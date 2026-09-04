# SP+ RESUME — 2026-09-04, compact #10

## 1. WHAT WE ARE DOING

Building **SP+ 1 Alpha** (immutable KDE/Fedora-bootc advisor OS) to a distributable ISO.
Today's session fixed the installer payload-ref crash, added install-screen copy, fixed three
Welcome defects, rebuilt the help landing screen, and is now building the `alpha2` payload on
the way to a fresh ISO.

- **ACTIVE repo (Beelink, 192.168.1.190):** `/home/chris/work/secureprospective-advisor-os`
- Project subdir: `projects/sp-plus`. Branch: the checked-out one; **tree was clean at `498e1f6`**.
- SSH from CT105: `ssh -n -i /root/.ssh/beelink chris@192.168.1.190`
- **sudo on the Beelink permits `podman` ONLY.** Not scripts, not `rm`, not `sysctl`, not `virsh
  -c qemu:///system`. To delete root-owned files, run a container with the path bind-mounted.

## 2. IN-FLIGHT RIGHT NOW (most perishable)

**`localhost/sp-plus-kde:alpha2` payload build.**

- Started ~17:35 local, from `projects/sp-plus`, **with `--network=host`** (see §6).
- Command:
  `sudo -n podman build --network=host -t localhost/sp-plus-kde:alpha2 -f images/kde/Containerfile .`
- Log: `/home/chris/logs/sp-plus/alpha2-payload.log`
- At compact time: **step 87/193, 0 errors.**
- Alive? `pgrep -af 'podman build' | grep -v 'bash -c'`
- Progress: `grep -c '^STEP' <log>` · Errors: `grep -n '^Error' <log>` · Done: `grep -c 'Successfully tagged' <log>`
- **A Monitor task does not reliably survive compaction. Its silence proves nothing. Read the log.**
- **The build runs on the Beelink and does not depend on this session.** Compaction cannot kill it.
- **DO NOT `podman image prune` while it runs.**

**Christopher's VM `fedora-test-alpha` is RUNNING and is HIS.** Read-only inspection only
(`virsh screenshot` is fine). It is booted from the **old** ISO and will not show today's fixes.

## 3. NEXT ACTIONS, IN ORDER

1. **Confirm the payload build finished**: `grep -c 'Successfully tagged'` == 1 and errors == 0.
2. **Bump the payload ref to alpha2** (do this AFTER the image exists, because P-28 checks the
   image is really in the rootful store):
   - `projects/sp-plus/installer/payload-ref.txt` → `localhost/sp-plus-kde:alpha2`
   - `installer/interactive-defaults.ks` line 67 → `containers-storage:localhost/sp-plus-kde:alpha2`
3. **Run preflight**: `./projects/sp-plus/tests/config-preflight.sh` from the repo root. Must be
   **39/39 "Safe to build"**. P-28 will fail loudly if the two refs disagree.
4. **Commit** the ref bump.
5. **Rebuild the installer** (it embeds the kickstart AND payload-ref.txt), from `projects/sp-plus`:
   `sudo -n podman build --network=host -t localhost/sp-plus-installer:alpha2 -f installer/Containerfile .`
   Expect `DN51_PAYLOAD_REF_OK`, `DN52_REASSURANCE_OK`, `SPPLUS_REASSURANCE_PATCHED`.
6. **Build the ISO** (~35 min), from `projects/sp-plus`:
   ```
   REF=$(tr -d "[:space:]" < installer/payload-ref.txt)
   mkdir -p artifacts/alpha2-iso
   sudo -n podman run --rm --privileged --userns=host --security-opt label=disable \
     --device /dev/loop-control -v /dev:/dev \
     -v "$PWD/artifacts/alpha2-iso:/output" \
     -v /var/lib/containers/storage:/var/lib/containers/storage \
     ghcr.io/osbuild/image-builder-cli:latest build bootc-generic-iso \
     --bootc-ref localhost/sp-plus-installer:alpha2 \
     --bootc-installer-payload-ref "$REF" \
     --bootc-default-fs ext4
   ```
   Success line is `Image build successful:` (NOT "Image built" — a monitor grepping that misses it).
7. **VERIFY INSIDE THE ISO before handing it over** — this is the check that would have caught
   the crash. Mount it in a container and confirm the kickstart ref matches the embedded image:
   ```
   sudo -n podman run --rm --privileged --device /dev/loop-control -v /dev:/dev \
     -v "<iso>:/iso:ro" localhost/sp-plus-installer:alpha2 bash -c '
     mkdir -p /isomnt && mount -o loop,ro /iso /isomnt
     unsquashfs -q -d /tmp/sq /isomnt/LiveOS/squashfs.img \
       "var/lib/containers/storage/overlay-images/images.json" \
       "usr/share/anaconda/interactive-defaults.ks" >/dev/null 2>&1
     grep -oE "containers-storage:[^ ]+" /tmp/sq/usr/share/anaconda/interactive-defaults.ks
     python3 -c "import json;[print(i[\"id\"][:12], i.get(\"names\")) for i in json.load(open(\"/tmp/sq/var/lib/containers/storage/overlay-images/images.json\"))]"'
   ```
8. **Measure the ISO, do not predict it.** `ls -l`, then place it:
   `cp <iso> ~/Downloads/sp-plus-1.0-alpha.iso` and regenerate `.sha256`. Verify source and copy
   hashes match before deleting the artifacts copy.
9. **Install it in a fresh VM and run `tests/runtime-posture-gate.sh` → 18/18.** Nothing has
   installed successfully yet this cycle.

## 4. GATES / STATUS

| Gate | State |
|---|---|
| `config-preflight` | **39/39 "Safe to build"** at `498e1f6` (with clean tree) |
| `help-app-gate` | **93 checks** (was 91; +2 for the root index), 37 guides open |
| welcome layout / services / service-link / all-stubs / help-search | PASS |
| `welcome-close-gate`, `welcome-lifecycle-gate` | SKIP on the Beelink, need a graphical session |
| In-image gates | 79 fired green on the alpha1 payload |

New gates added today: **P-27** em-dash (LC_ALL=C), **P-28** payload ref, **P-29** install-screen
reassurance, **DN-51** payload ref in installer, **DN-52** reassurance vs kickstart encryption.
All five were mutation-tested red before being allowed green.

## 5. ARTIFACTS THAT EXIST

- `localhost/sp-plus-kde:alpha1` — image id `4491d4ff9ebd4178ca231e472fc856cf539b1da93a9292c4d5f34511faf4bbc9`,
  digest `sha256:3ae8576f100dd4dd3763e2786bb09c8dbb7c30cd60cbc027b88d0fe9df613783`, 11 GB.
- `localhost/sp-plus-installer:alpha2` — has the reassurance copy + alpha1 ref.
- `~/Downloads/sp-plus-1.0-alpha.iso` — 5,451,405,312 bytes,
  sha256 `346d51b445a4511cbefe7357f2d22505ef377b654a4bfc7a4d431e29c4c9bbe1`. **Ref-correct but
  built BEFORE today's Welcome/help fixes. Never successfully installed.**
- Fallback ISOs kept deliberately: `~/Downloads/sp-plus-1.0-alpha-20260904.iso`,
  `~/Downloads/sp-plus-1.0-rc1f-20260904.iso`. **Do not delete** until a new ISO installs — they
  are the only media built while the payload was tagged `:spike`, which is what the kickstart in
  them expects. Their payload image `localhost/sp-plus-kde:spike` must also survive.
- Evidence: `~/logs/sp-plus/alpha-install-crash-2026-09-04/anaconda-payload-ref-crash.png`,
  `~/logs/sp-plus/help-redesign-2026-09-04/help-root-{BEFORE-vm,AFTER-render}.png`.

## 6. THE CURRENT ENVIRONMENT BUG — NOT OURS, WILL RECUR

**Rootful podman containers on the default bridge have NO EGRESS.** First `alpha2` attempt died
at step 68 with `Could not resolve host: mirrors.fedoraproject.org` repeated until dnf gave up.

Measured:
- Host resolves and reaches the internet fine.
- Container on the bridge gets a correct address (`10.88.0.79/16`) and default route (`10.88.0.1`),
  then `curl` to a **bare IP** returns `000`. Not DNS — no egress at all.
- `--network=host`: everything works, including `dnf repoquery`.
- `podman network reload --all` did nothing (rules are applied per container at start).
- `/proc/sys/net/ipv4/ip_forward` = **1**, so that is not it.

**Leading hypothesis, NOT confirmed:** libvirt rewrote host firewall rules when
`fedora-test-alpha` started (~17:13) and its FORWARD policy now drops podman's subnet. The
alpha1 payload and both ISO builds succeeded on the normal bridge two hours earlier.
**Caveat: unverified.** Reading the nftables ruleset needs root and sudo here only allows
`podman`. This is a correlation, not a conclusion.

**Workaround in use: `--network=host` on every rootful build.** Verified safe first: no build
step starts a server, and host ports 8766/8791/5000 are free. **Network mode does not change
image contents.** Christopher has been told; the real fix (reboot, or restarting the firewall
service) needs root on his daily driver and is his call.

## 7. HYPOTHESES ALREADY REFUTED — DO NOT RETEST

- **"The ISO tooling is broken."** No. `bootc-generic-iso` works. Two separate failures had
  named causes: missing `DefaultRootFs` (answer: `--bootc-default-fs ext4`, already in the docs
  three times as DN-07) and a missing `shimx64.efi` because the **payload** was passed as
  `--bootc-ref`. The installer is a separate purpose-built container; the payload rides in via
  `--bootc-installer-payload-ref`.
- **"The Alpha ISO crash was a tooling or image problem."** No. The kickstart hardcoded
  `:spike` while the ISO embedded `:alpha1`. Two strings, two files, nothing compared them.
- **"`grep -P '\xe2\x80\x94'` finds em-dashes repo-side."** NO. In a UTF-8 locale `\xe2` is read
  as codepoint U+00E2, not the byte, and it silently matches nothing. The container runs under
  `LC_ALL=C` where it does match. P-27 matches the literal character instead.
- **"The services check is slow because the servers are slow."** No. Both endpoints return
  HTTP 200; connect+TLS+transfer is under 0.5s. The entire cost is a cold dual-stack
  `getaddrinfo` stall of **5.02s** (18ms warm, 9ms IPv4-only; `dig` answers in 0.12s).
- **"`podman network reload` fixes the egress problem."** Tested, did nothing.
- **"`ip_forward` is off."** Checked, it is 1.
- **"`rpm -q --whatrequires java-headless` proves the JVM is an orphan."** No — it does not
  follow virtual provides. `dnf remove --assumeno` shows it takes LibreOffice with it.
- **"`tar | zstd -19` predicts ISO savings."** Over-predicts by ~2x (measured ratio 0.45).
- **R2 single-PUT ceiling is 5,363,466,240 bytes** (NOT the round 5,368,709,120). Today's ISO is
  5,451,405,312, so **multipart is required** — Christopher already ruled this.

## 8. DECISIONS (do not relitigate)

- Keep docs cut, **restore CJK**, use **multipart** upload.
- **"Other account"** on Office connections: let the advisor paste their own webmail address
  (chosen 2026-09-04 over a help article or removing the option).
- Keep both older ISOs and `sp-plus-kde:spike` as fallbacks until a new ISO installs.
- Reap dangling podman images only, rootful, **after** a build.
- D-1: no SSH key in the image, sshd key-only. Never `git --no-verify`.

## 9. LEDGER STATE

All committed on the Beelink repo. Today's chain:
`586eab6` (em-dash + P-27, cwd-independent continuation gate) → `a71bd53` (payload ref, P-28,
DN-51) → `c8155ba` (install-screen reassurance, P-29, DN-52) → `58362c4` (three Welcome fixes) →
`498e1f6` (help opening screen = index of the manual, 93 checks).

**Tree was clean (0 dirty) at compact time.** Nothing written-but-uncommitted.

**Still unpushed and unmirrored:** ~97 commits; the CT105 mirror is stale since 2026-09-02.
`/root/backup-beelink-repos.sh`, verify by ref list not exit code. Awaiting Christopher's word —
sync is announced, never silent.

## 10. HONEST STATUS

The `alpha2` payload is ~45% through a build that has never completed with today's changes in
it. Everything downstream of it — installer, ISO, install test — is **unstarted**.

**Nothing has installed successfully this entire cycle.** The one ISO that is ref-correct
(`sp-plus-1.0-alpha.iso`) has never been booted. The install-screen encryption copy, the three
Welcome fixes and the help index are all **verified in source and in gates, and seen by no human
on a running machine.** The help "after" screenshot is an offscreen render, not an installed
system.

Christopher's standard for this release: **"I need this install to be absolutely flawless...
100% before distributing."** That is not met yet and should not be claimed.
