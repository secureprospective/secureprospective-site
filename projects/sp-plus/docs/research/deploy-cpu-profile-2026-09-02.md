```
## WHAT I RAN

# 1. read the harness in full
cat -n ~/fleet/bin/spplus-bench.sh
cat -n ~/work/secureprospective-advisor-os/projects/sp-plus/installer/interactive-defaults.ks

# 2. backed it up, then added guest-side sampling (diff below)
cp ~/fleet/bin/spplus-bench.sh /tmp/spplus-bench.sh.orig
bash -n ~/fleet/bin/spplus-bench.sh          # SYNTAX_OK

# 3. dry-ran the two sampler scripts on the host before spending a VM on them
timeout 8  /tmp/t_samp.sh    # emitted valid SPCPU lines
timeout 20 /tmp/t_thr.sh     # emitted a valid SPTHR line

# 4. run 1 (existing ISO, 1 install, no rebuild)
~/fleet/bin/spplus-bench.sh ~/Downloads/sp-plus-1.0-test56-20260902.iso 1
   -> logs /home/chris/logs/sp-plus/bench/20260902T123122Z
   -> PARTIAL: console froze at "Deploying image: 42%" (39 samples). Diagnosed:
      with no reader on the console pty the buffer fills, the qemu chardev blocks,
      and libvirt's log.file stops receiving output. The guest kept working.

# 5. added a console-pty drainer to the harness, re-ran
~/fleet/bin/spplus-bench.sh ~/Downloads/sp-plus-1.0-test56-20260902.iso 1
   -> logs /home/chris/logs/sp-plus/bench/20260902T125334Z
   -> COMPLETE: 143 SPCPU samples, 25 SPTHR samples, deploy 0%->100% fully covered.
   -> harness killed after marks-1.txt was written (boot-timing phases not needed here)

# 6. analysis (awk over the SPCPU lines extracted from install-1.serial)
grep -ao 'SPCPU|[0-9]*|w=[0-9.]*|[^ ]*' $D/install-1.serial | sed 's/.*SPCPU|//' > /tmp/r2.txt
```

Sampling approach chosen, and why: two background bash loops started from an extra
bench-only `%pre` in the *generated* kickstart (the SP+ repo kickstart is untouched).
The first reads `/proc/<pid>/stat` for every pid every 3 s and emits per-process
utime+stime *deltas* plus `num_threads`; deltas are what you need to attribute CPU, and
`/proc` needs no tooling that may be missing from the installer image (`top -b` gives you
a screen-scrape and lifetime averages instead). The second names the hottest process
every 15 s with its full cmdline and thread names, which is what actually answers the
threading question. Both write to `/dev/ttyS0`, which the harness already logs, so the
data survives poweroff. Nothing is written to the target disk.

Harness diff (`~/fleet/bin/spplus-bench.sh`, not committed; `~/work/sp-plus-build` is
untouched — `git status --porcelain` is empty):

```diff
--- /tmp/spplus-bench.sh.orig	2026-09-02 07:30:13
+++ /home/chris/fleet/bin/spplus-bench.sh	2026-09-02 07:53:03
@@ -88,6 +88,62 @@ (inside make_ks_iso, before `cat "$base"`)
+        cat <<'BENCHCPUSAMPLER'
+# DELTA: bench-only per-process CPU sampler for the deploy window. Runs in the
+# installer environment and emits one SPCPU line per sample to /dev/ttyS0, which
+# the harness already logs, so the data survives the VM powering off.
+%pre --interpreter=/bin/bash --log=/tmp/spplus-cpusampler-pre.log
+cat > /tmp/spplus-cpusample.sh <<'SAMPLER'
+#!/bin/bash
+# One SPCPU line per interval: wall seconds since last sample, then the top
+# processes by CPU jiffies consumed in that interval, as pid:comm:jiffies:threads.
+# 100 jiffies/s/CPU, so jiffies/(100*wall) is cores used by that process.
+snap() {
+  awk 'FNR==1{
+        n=split(FILENAME,p,"/"); pid=p[3];
+        line=$0; sub(/^[0-9]+ \(/,"",line);
+        i=index(line,") "); comm=substr(line,1,i-1); rest=substr(line,i+2);
+        split(rest,f," ");
+        print pid, comm, f[12]+f[13], f[18]
+      }' /proc/[0-9]*/stat 2>/dev/null
+}
+prev=/tmp/spcpu.prev; cur=/tmp/spcpu.cur
+snap > "$prev"; pt=$(date +%s.%N)
+exec 3>/dev/ttyS0
+while :; do
+  sleep 3
+  snap > "$cur"; ct=$(date +%s.%N)
+  w=$(awk -v a="$pt" -v b="$ct" 'BEGIN{printf "%.2f", b-a}')
+  top=$(awk -v w="$w" 'NR==FNR{o[$1]=$3; next}
+        { d=$3-(($1 in o)?o[$1]:$3); if(d>0) printf "%s:%s:%s:%s ", $1,$2,d,$4 }' "$prev" "$cur" \
+        | tr " " "\n" | awk -F: "NF==4" | sort -t: -k3,3nr | head -8 | tr "\n" "," )
+  printf "SPCPU|%s|w=%s|%s\n" "$(date +%s)" "$w" "$top" >&3
+  mv -f "$cur" "$prev"; pt="$ct"
+done
+SAMPLER
+cat > /tmp/spplus-cputhreads.sh <<'THREADS'
+#!/bin/bash
+# Every 15s, name the single hottest process fully: cmdline plus its thread
+# names, so "is it multi-threaded and what is it doing" is answerable.
+exec 3>/dev/ttyS0
+while :; do
+  sleep 15
+  a=$(awk 'FNR==1{n=split(FILENAME,p,"/"); line=$0; i=index(line,") "); split(substr(line,i+2),f," "); print p[3], f[12]+f[13]}' /proc/[0-9]*/stat 2>/dev/null)
+  sleep 2
+  b=$(awk 'FNR==1{n=split(FILENAME,p,"/"); line=$0; i=index(line,") "); split(substr(line,i+2),f," "); print p[3], f[12]+f[13]}' /proc/[0-9]*/stat 2>/dev/null)
+  pid=$(awk 'NR==FNR{o[$1]=$2; next}{d=$2-(($1 in o)?o[$1]:$2); if(d>0) print d, $1}' <(echo "$a") <(echo "$b") | sort -k1,1nr | head -1 | awk '{print $2}')
+  [ -n "$pid" ] || continue
+  cl=$(tr '\0' ' ' < /proc/$pid/cmdline 2>/dev/null | cut -c1-160)
+  th=$(cat /proc/$pid/task/*/comm 2>/dev/null | sort | uniq -c | tr '\n' ',' )
+  printf "SPTHR|%s|pid=%s|cmd=%s|threads=%s\n" "$(date +%s)" "$pid" "$cl" "$th" >&3
+done
+THREADS
+chmod +x /tmp/spplus-cpusample.sh /tmp/spplus-cputhreads.sh
+setsid nohup /tmp/spplus-cpusample.sh </dev/null >/dev/null 2>&1 &
+setsid nohup /tmp/spplus-cputhreads.sh </dev/null >/dev/null 2>&1 &
+disown -a 2>/dev/null || true
+%end
+BENCHCPUSAMPLER
         cat "$base"
@@ -248,11 +304,25 @@ (in run_install, after `V start`)
+    # DELTA: keep a reader on the console pty for the whole install. With no
+    # reader the pty buffer fills, the qemu chardev blocks, and libvirt's
+    # log.file stops receiving ANY further console output mid-install (observed
+    # 2026-09-02: the serial log froze at "Deploying image: 42%" and the rest of
+    # the run was never logged, though the guest kept working).
+    local pty=""; for _ in $(seq 1 10); do
+        pty="$(V ttyconsole "$dom" 2>/dev/null || true)"; [ -n "$pty" ] && break; sleep 1
+    done
+    DRAIN_PID=""
+    if [ -n "$pty" ]; then
+        ( exec 9<> "$pty"; cat <&9 > "$LOGDIR/install-${n}.ptydrain" ) 2>/dev/null &
+        DRAIN_PID=$!
+    fi
     local tend; tend="$(now)"; sleep 2; stop_stamper
+    [ -n "${DRAIN_PID:-}" ] && kill "$DRAIN_PID" 2>/dev/null || true
```

## DEPLOY WINDOW

From `/home/chris/logs/sp-plus/bench/20260902T125334Z/marks-1.txt`:

```
t0=1788353616.468  vm_first_output=1788353617.990  installer_ready=1788353644.823
payload_start=1788353667.637  post_start=1788354090.921  tend=1788354099.046
```

```
deploy start : 1788353667.64  (payload_start)
deploy end   : 1788354090.92  (post_start)
duration     : 423.3 s
total install: 482.6 s   -> deploy is 87.7% of the install
```

Sampler coverage of that window: 137 SPCPU samples, 425.5 s of wall time accounted for.
Guest total CPU consumed in the window: **78,772 jiffies = 787.7 CPU-seconds = 1.85 cores
average of 4 available.** (Host-side qemu measured 245% earlier; the ~0.6-core gap is
qemu/host-side virtualisation overhead, not guest work.)

## CPU BREAKDOWN (the answer)

Whole deploy window, ranked. "peak cores" is that process's single best 3 s sample
converted to cores (jiffies / (100 × 3.05 s)). "max thr" is the highest `num_threads`
ever observed for it.

| # | process | jiffies | % of deploy CPU | peak cores | max thr | threaded? | evidence |
|---|---|---|---|---|---|---|---|
| 1 | **anaconda** (`/usr/bin/python3 /usr/bin/anaconda`) | 40,879 | **51.90%** | 1.03 | 4 | **NO — single-threaded, pinned at 1.00 core** | 25/25 SPTHR samples name pid 2758 as hottest with `threads= 1 anaconda, 1 gdbus, 1 gmain, 1 pool-spawner`; only the main thread is ever busy. Per-minute jiffies are flat 5,260–6,151 (0.88–1.03 cores) for all 7 minutes. |
| 2 | **bootc** (`/usr/bin/bootc-real install to-filesystem --skip-finalize --bootloader=grub …`) | 20,426 | **25.93%** | 1.02 | 15 | **NO — many threads, one busy, ~1.0 core ceiling** | `SPTHR\|1788354027\|pid=4167\|…\|threads= 2 bootc, 1 tokio-rt-worker,`. Never exceeded 1.02 cores in any sample despite 15 threads existing at peak. |
| 3 | **skopeo** | 11,647 | **14.79%** | 1.09 | 9 | **NO — 9 Go threads, ~1.05 core ceiling** | Active only in deploy minutes 0–5, then exactly 0. Peak sample 333 jiffies/3.05 s = 1.09 cores. |
| 4 | **ostree** (`ostree commit --repo=/proc/self/fd/3 --selinux-policy /var/tmp/.tmpGv560y --add-metadata-string=ostree.importer.version=0.15.3 --no-bindings --tar-autocreate-pa…`) | 2,588 | **3.29%** | 1.00 | 1 | **NO — literally 1 thread** | `SPTHR\|1788353941\|pid=10005\|…\|threads= 1 ostree,` |
| 5 | **du** | 867 | 1.10% | 0.98 | 1 | no | One burst of ~0.98 core in deploy minute 0 only. |
| 6 | kswapd0 | 787 | 1.00% | 0.19 | 1 | no | kernel reclaim |
| 7 | python3 (Anaconda DBus modules) | 483 | 0.61% | 0.32 | 5 | no | |
| 8 | kcompactd0 | 376 | 0.48% | 0.24 | 1 | no | |
| 9 | spplus-cpusampl (my own sampler) | 225 | **0.29%** | 0.01 | 1 | no | measurement overhead is negligible |
| — | everything else combined | ~494 | 0.63% | — | — | | xfsaild, ksoftirqd, systemd, dbus, journal, brltty, lvmdbusd |

**bootc / ostree / rpm-ostree itself vs. helper work:**
- `bootc` + `ostree` = 23,014 jiffies = **29.2%**
- `skopeo` (the container-image transport bootc shells out to) = **14.8%**
- so the bootc toolchain end-to-end = **44.0%**
- `rpm-ostree` **never appears at all** — 0 jiffies. This is a bootc image install, not an rpm-ostree one.
- **Anaconda itself, doing none of the payload work, is 51.9%** — more than the entire bootc toolchain combined.

The window is two distinct regimes:

```
IMPORT phase, t+16..t+290 (deploy 0%->~90%)     PLATEAU phase, t+290..t+424 (stuck at "99%")
  anaconda 52.03%                                 anaconda 50.87%
  skopeo   22.69%                                 bootc    46.98%
  bootc    17.00%                                 (skopeo and ostree both exactly 0)
  ostree    5.04%                                 xfsaild   0.65%
```

The console sat on `Deploying image: 99%` for **~134 s (32% of the whole deploy phase)**
doing nothing but bootc's own finalisation plus the same constant 1.0 core of Anaconda.

**Direct answer to "is one process multi-threaded at 245%?": no.** No process in the
guest ever exceeded **1.09 cores** in any of the 137 samples. The 1.85 guest cores are
**two or three independent, single-core-bound processes running side by side** —
anaconda pegged at 1.0 the whole time, plus skopeo (early) or bootc (late) at ~1.0.
There is no parallelism to widen inside any one of them; the parallelism that exists is
accidental pipeline overlap between separate processes.

## IS IT SELINUX / HASHING / DECOMPRESSION?

**SELinux relabeling — YES, but inline inside the ostree import, and it is NOT the
expensive part (3.29%).**
Evidence: `SPTHR|1788353941|pid=10005|cmd=ostree commit --repo=/proc/self/fd/3
--selinux-policy /var/tmp/.tmpGv560y --add-metadata-string=ostree.importer.version=0.15.3`
— the `--selinux-policy` flag means labels are applied from the target policy as objects
are committed. There is **no separate `setfiles` or `restorecon` process anywhere in the
137 samples**; the SP+ `%post` relabel runs after `post_start=1788354090.9`, i.e. outside
this window, and the whole post-install phase measured only ~4 s of console time
(`Configuring installed system` at t+424 through `Complete!` at t+427). SELinux is not
the lever.

**Checksumming / hashing — NO SEPARATE PROCESS; it is inside skopeo and ostree, and
those are only 18.1% combined.**
Evidence: no `sha256sum`, `openssl`, or any digest helper appears in any sample. The
work that would contain hashing (`skopeo` blob digest verification + `ostree commit`
content-addressed object hashing) totals 14,235 jiffies = **18.08%** of deploy CPU, and
both are confined to the import phase (minutes 0–5). Even eliminating hashing entirely
cannot touch the 50.87%-anaconda / 46.98%-bootc plateau. Note this is an upper bound
attributed by process, not an in-process profile — see UNVERIFIED.

**Decompression — NO EVIDENCE OF IT, and it cannot be a major cost.**
Evidence: no `gzip`, `zstd`, `xz`, `pigz` or any decompressor process appears in any of
the 137 samples. The source is `containers-storage:localhost/sp-plus-kde:spike` (from
the kickstart `bootc --source-imgref` line), a local already-extracted container store,
so there is no compressed layer to inflate. Any residual would be inside skopeo's 14.79%.

**What it actually is:** the single largest consumer of the deploy phase is
**Anaconda's own Python main thread, burning exactly one core continuously for the full
423 s, while the payload tools do their work in parallel beside it.** It is flat across
every regime — it does not rise or fall with skopeo, ostree or bootc activity. That is
~420 CPU-seconds spent by the installer front-end, not by the image deployment.

## FOUND BUT NOT TOUCHED

1. **Anaconda burning a constant 1.0 core for the entire deploy is unexplained and is
   the biggest single lever on the board.** The most likely candidate is the text-mode
   TUI redraw loop against the serial console (every `Deploying image: N%` update is a
   full-screen repaint — the raw log is dense with `ESC[1;24r ESC[23;1H ESC[?25l ESC[?25h`
   sequences) and/or its progress/DBus polling loop. I did not test it. It would be a
   cheap experiment: one run with `inst.text` on a quiet console vs. the current one.
2. **The "99%" plateau is 134 s (32% of deploy) of pure bootc finalisation** with zero
   skopeo/ostree activity. It is a separate, self-contained target worth its own dispatch.
3. **`du` runs at ~1.0 core for a burst at the very start of the payload phase** (867
   jiffies, 1.10%). Anaconda computing installed-size; small, but it is real CPU on a
   4-vCPU box.
4. **A `%post`-time `du`-free note:** the SP+ `%post` relabel via `setfiles -F` over
   `/etc` and `/var` costs almost nothing here (post-install total ~4 s of console time).
   Not a target.
5. **The console-pty backpressure bug in the harness** (no reader → libvirt's `log.file`
   silently stops mid-install). This existed before my change and would have truncated
   any future high-volume serial capture. I fixed it in the harness because run 1 could
   not otherwise be completed; I did not commit it.
6. **Other agents are running installs on this Beelink concurrently.** During my runs,
   `virsh -c qemu:///session list --all` showed `spplus-vcpu4-r1` and `spplus-vcpu8-r1`
   (not this harness's `spplus-bench-` prefix), and `pgrep -af spplus-bench.sh` showed up
   to five concurrent invocations of `~/fleet/bin/spplus-bench.sh` from other sessions,
   with host load average 6.45. **I did not touch them.** This inflates wall-clock and it
   means other sessions are running my edited copy of the shared harness. The *ratios*
   reported above are unaffected: they are guest-internal per-process CPU shares.

## UNVERIFIED

- **The cause** of Anaconda's constant 1.0 core. Measured beyond doubt; explained not at
  all. I have process-level and thread-level evidence only — no `perf`, no `py-spy`, no
  stack sampling inside the guest. The TUI-redraw hypothesis above is a hypothesis.
- **In-process attribution for hashing and decompression.** I can prove no separate
  hashing or decompression *process* exists and can bound their combined cost at
  ≤18.08% (skopeo+ostree), but I cannot split skopeo's or ostree's internal time between
  tar handling, sha256, xattr/SELinux labeling and syscalls. That needs `perf record`
  inside the guest, which this dispatch did not do.
- **Run 1's deploy 42%→100% window** was lost to the console-pty stall and is not in any
  reported number. Every figure above comes from run 2
  (`~/logs/sp-plus/bench/20260902T125334Z`), which has unbroken coverage. Run 1's partial
  data (39 samples, deploy 0→42%) independently agrees: anaconda 51.99%, skopeo 22.82%,
  bootc 13.76%, du 8.02%.
- The `install-1.ptydrain` file in run 1's log directory (`20260902T123122Z`) contains
  output from **a different guest** — the pid identities in it (anaconda pid 2741 vs 2735
  in the same domain's serial log, and a `543 s` guest uptime that does not match this
  domain's 708 s wall clock) indicate the mid-run `virsh ttyconsole` attach landed on
  another session's concurrently-running VM. **I excluded it from all analysis.**
- Whether the ~0.6-core gap between guest total (1.85 cores) and the previously measured
  host qemu figure (245%) is qemu emulation overhead specifically. It is the arithmetic
  remainder; I did not profile qemu on the host.
