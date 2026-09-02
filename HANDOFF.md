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

## In flight when the baton was set down

**Tom is running a guest-side CPU profile of the deploy phase.** Started 2026-09-02
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

## Next actions, in order

1. Collect Tom's CPU breakdown (command above). It decides everything after it.
2. Pick the target it names (hashing / SELinux relabel / object creation) and make ONE
   surgical change.
3. Measure it with **3 runs and a median**, not one.
4. Fix the dead `--add-drivers bochs_drm` line — the module does not exist and
   `--add-drivers` fails as a GROUP, so it is silently killing the whole driver list.
   `bochs_drm` -> `bochs`, or delete the line.

## Known-good rollback ISOs — never delete

- `~/Downloads/sp-plus-1.0-test56-20260902.iso` sha256 2d12181473ec98a0cded0f10ceaa01e48898f47ec9fd1ec75f4690c12078eccf
- test55 sha256 86951b7fd636df8f1b74704be76f9b9dbe9b2c45cb5eaf70c2ee8555bf54807d
- `~/Downloads/sp-plus-1.0-20260901.iso` sha256 921da03309889ea9ca2548677cf2698b40172db330113185971426717ecf0d23
