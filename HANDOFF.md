# HANDOFF — SP+ install/boot performance campaign

**Baton:** ClaudeBox (headbrain), paused 2026-09-02. Christopher moved to other work.
**Branch:** `session/sp-plus-plan`

## Where it stands

The install is ~510 s, and **96% of it is one phase: "Deploying image" (~490 s)**.
Boot is ~23.8 s of machine time and is NOT the problem — do not spend time there.

We now know what the bottleneck is NOT. Three levers are dead, with evidence:

1. **Image size.** Removed 101 MB from the ISO / 158 MB from the image. No measurable
   install-time gain. The "73 s per GB" estimator that motivated it was retracted.
2. **OCI payload compression.** The kickstart installs via
   `--source-imgref containers-storage:`, so layers are already uncompressed. There is
   no decompression in the hot path to remove.
3. **More CPU cores.** 8 vCPU is not faster than 4; the fastest run of three was a
   4-vCPU run. The deploy pipeline does not parallelise.

Host sampling during deploy: CPU 245% avg of 400%, **disk write 1.8 MB/s, iowait 5%,
never above 30%.** The phase is CPU-bound on a mostly serial pipeline.

**The one surviving hypothesis:** the time goes to per-object CPU work — hashing,
SELinux relabeling, or ostree object creation. Reduce WORK, not BYTES.

## Blocked on

Nothing. The next step is measurement, and it is already running.

## Tom's dispatch — COMPLETE, collected, filed below

(was: a guest-side CPU profile of the deploy phase) Started 2026-09-02
~07:29 local, 5400 s timeout. His report lands on disk and survives the session.

```
# collect Tom's report (Beelink):
cat ~/tom-spplus-deploy-cpu-profile.out
cat ~/tom-spplus-deploy-cpu-profile.sentinel   # EXIT= and byte count
# reject the report if it is under 1500 bytes or starts with <tool_call>
pgrep -f tom-dispatch/spplus-deploy-cpu-profile.sh   # still running?
```
Brief: `~/briefs/spplus-deploy-cpu-profile.md`. It asks ONE question: which processes
and which operations hold the CPU during deploy, ranked, with numbers.

If Tom's VM `spplus-bench-r1` is still running with no sentinel, he died: reap the VM
(`virsh -c qemu:///session destroy/undefine --nvram`) and re-dispatch.

## THE RULE THAT CHANGED — read this before measuring anything

**Two runs of an IDENTICAL config differed by 33.5 s (~7%).** The noise floor is ~33 s.

- **Every performance comparison runs >=3 times and reports the MEDIAN and the spread.**
  `spplus-bench.sh` takes a run count as its 2nd arg. We had been passing `1`.
- Any single-run difference under ~35 s is noise. Do not report it as a result.
- A single run answers "did it break", never "is it faster".

## Tried and rejected, with why

- Byte-shaving for install speed — measured, no effect (above).
- OCI compression — structurally impossible via containers-storage transport.
- More vCPUs — measured, no effect; 4 beat 8.
- Running two bench harnesses concurrently WITHOUT overriding `PREFIX` — the harness
  hardcodes domain `spplus-bench-r1` and its `destroy_ours` will tear down the other
  run's VM. Use `spplus-bench-vcpu.sh` (PREFIX/VCPUS/OWNER_TITLE overridable).
- The harness boot leg hangs at the LUKS prompt and burns `BOOT_TIMEOUT` (900 s) for
  nothing. Stop after the install unless boot is actually being measured.

## Log-reading trap

Boot logs show a ~355 s gap immediately before `Please enter passphrase`. That is the
harness waiting and then typing, flushed as one line. **It is not machine time.**

## THE ANSWER CAME BACK — Tom's deploy CPU profile (2026-09-02)

Full report: `projects/sp-plus/docs/research/deploy-cpu-profile-2026-09-02.md`.
Method: per-process `/proc/<pid>/stat` deltas every 3 s from a bench-only `%pre`, emitted
to `/dev/ttyS0`. 137 samples, full deploy coverage. Deploy = 423.3 s of a 482.6 s install.

**Guest CPU during deploy, ranked:**

| process | % of deploy CPU | threading |
|---|---|---|
| **anaconda** (python3) | **51.9%** | single-threaded, pinned at exactly 1.0 core the whole time |
| bootc | 25.9% | 15 threads exist, never exceeds 1.02 cores |
| skopeo | 14.8% | 9 threads, ~1.05 core ceiling, active only in the first 5 min |
| ostree | 3.3% | literally 1 thread |

**NO process ever exceeded 1.09 cores in any of 137 samples.** The 1.85 guest cores are two
or three independent single-core-bound processes overlapping — not one wide workload. This
independently explains why the 8-vCPU arm did nothing: there is no parallelism to widen.

**The biggest lever on the board: Anaconda burns ~420 CPU-seconds — 51.9%, more than the
entire bootc toolchain combined — doing none of the payload work.** It is flat at 1.0 core
across every regime, unaffected by what skopeo/ostree/bootc are doing.
CAUSE IS UNVERIFIED. Leading hypothesis (untested): the text-mode TUI full-screen repaint
loop against the serial console — every `Deploying image: N%` update repaints, and the raw
log is dense with escape sequences. Cheap first experiment: one run with a quiet console.

**Second target: the "99%" plateau is 134 s — 32% of the whole deploy phase** — of pure
bootc finalisation with skopeo and ostree at exactly zero. Self-contained, worth its own
dispatch.

**Ruled out as levers, with evidence:**
- **SELinux relabel** — happens inline in `ostree commit --selinux-policy`, only 3.3%. No
  separate `setfiles`/`restorecon` process exists in any sample. The `%post` relabel is
  outside the window and the whole post-install phase is ~4 s.
- **Hashing** — no digest helper process exists; bounded at <=18.1% (skopeo+ostree combined)
  and confined to the import phase. Cannot touch the plateau.
- **Decompression** — no decompressor process in any sample; source is an already-extracted
  `containers-storage:`. Confirms the earlier compression finding from a second direction.
- **rpm-ostree** — 0 jiffies. It is not in this path at all.

**Caveat on the above:** attribution is per-PROCESS, not in-process. Splitting skopeo's or
ostree's internal time between tar, sha256, xattr and syscalls needs `perf record` in the
guest, which was not done.

**Harness bug Tom fixed (uncommitted, in `~/fleet/bin/spplus-bench.sh`):** with no reader on
the console pty the buffer fills, the qemu chardev blocks, and libvirt's `log.file` silently
stops mid-install. It truncated his first run at "Deploying image: 42%". He added a pty
drainer. **This bug predates today and will silently truncate any high-volume serial capture.**
Review and commit that fix.

## Next actions, in order

1. **Test the Anaconda hypothesis** — it is 51.9% of deploy CPU and the cause is unknown.
   One run with a quiet/non-redrawing console vs. current. Cheapest big lever we have.
2. **Attack the 134 s bootc finalisation plateau** — 32% of deploy, own dispatch.
3. Measure BOTH with **3 runs and a median**, never one (see the rule above).
4. Review and commit Tom's console-pty drainer fix in `~/fleet/bin/spplus-bench.sh`.
4. Fix the dead `--add-drivers bochs_drm` line — the module does not exist and
   `--add-drivers` fails as a GROUP, so it is silently killing the whole driver list.
   `bochs_drm` -> `bochs`, or delete the line.

## Known-good rollback ISOs — never delete

- `~/Downloads/sp-plus-1.0-test56-20260902.iso` sha256 2d12181473ec98a0cded0f10ceaa01e48898f47ec9fd1ec75f4690c12078eccf
- test55 sha256 86951b7fd636df8f1b74704be76f9b9dbe9b2c45cb5eaf70c2ee8555bf54807d
- `~/Downloads/sp-plus-1.0-20260901.iso` sha256 921da03309889ea9ca2548677cf2698b40172db330113185971426717ecf0d23
