# The SP+ Performance Standard
**Established 2026-09-02. The bar future sessions must clear.**

This exists so nobody has to rediscover any of it. It is deliberately short.

---

## 1. The numbers of record

Every claim about speed is measured with `~/fleet/bin/spplus-bench.sh`, in QEMU,
never on Beelink hardware. A number produced any other way is not admissible.

| Metric | Baseline (test55, 2026-09-02) |
|---|---|
| Total install | **500.9s (8m21s)** |
| — ISO boot -> installer ready | 66.8s (13%) |
| — **payload write to disk** | **414.5s (83%)** |
| — post-install + bootloader | ~16s (3%) |
| ISO size | 5,655,955,456 B (5.66 GB) |
| **Machine boot (passphrase wait excluded)** | **~23.8s** |
| — kernel -> LUKS prompt | 3.2s |
| — unlock -> login ready | 20.6s |

**RETRACTED 2026-09-02: the "~73 s per GB" estimator is NOT VALID. Do not use it.**
It was computed by dividing the 414.5 s payload-write wall clock by the payload
size. That interval is not disk writes: it also contains source-squashfs reads and
decompression, OCI/containers-storage streaming, tar parsing, hashing, OSTree
object creation, temporary checkout and merge, deployment checkout, SELinux work,
bootloader work and final flushes. Dividing it by one byte count describes that
single benchmark and nothing else — it cannot predict the effect of a size change,
and it cannot tell CPU-bound from I/O-bound work. (Independent review, 2026-09-02.)

**Therefore: bytes saved may NOT be converted into seconds saved.** Report bytes as
bytes. A time saving is only real once a bench run measures it.

## 2. The loop (do it in this order, every time)

1. **Measure first.** No optimisation begins without a baseline from the harness.
2. **Do NOT convert bytes into seconds.** There is no valid conversion (see §1).
   State bytes as bytes, state the mechanism you believe will save time, and treat
   the seconds as UNKNOWN until a bench run measures them. "Smaller is better" is
   still not a justification — but neither is an invented rate.
3. **State the risk and how you would detect the breakage.** An optimisation
   whose failure mode you cannot name has not been thought through.
4. **Get it challenged by a different model.** ClaudeBox and Tom are the same
   model; their agreement is weak evidence. Bee (gpt-5.6-luna, `THINKING=high`)
   is the independent check. On 2026-09-02 this killed two of three hypotheses
   before they cost a build cycle.
5. **Build, then re-measure.** The predicted saving is a prediction until the
   harness confirms it.
6. **Record it in the ledger** — including what did NOT work and why.

## 3. Rules with teeth

- **Never run a build while a timing run is in flight.** A rootful build
  saturates all 16 cores and corrupts the benchmark it shares a host with.
  Serialise them. (Learned 2026-09-02.)
- **Nothing SP+ ever installs or boots on the Beelink.** It is a live desktop.
  Everything in QEMU, VMs named `spplus-bench-*`.
- **Never delete a known-good ISO.** Keep at least two rollback points.
- **Prove the fix is in the IMAGE, not in git.** Quote the line from inside the
  built image and give its sha256. Git is not evidence of what shipped.
- **The artifact is the evidence, never the exit code.** `EXIT=0` with 94 bytes
  of output is a failure. (Learned 2026-09-02.)

## 4. What we got WRONG, so nobody repeats it

- **We invented a bogus estimator and nearly standardised it.** "~73 s/GB" was
  derived from one benchmark and presented as a conversion rate. It is not one.
  Independent review caught it. Deriving a rate from a single measurement and then
  using it to predict a different scenario is the mistake to avoid here.
- **"Install time = bytes written" is a heuristic, not a law.** A bootc install
  also does OCI read+decompression, OSTree import and checkout, SELinux
  xattrs, boot assets and LUKS setup.
- **Layer count is not the enemy.** 55 RUN / 103 COPY layers sounded terrible.
  Measured, it is not what dominates. Two independent models agreed. Layer
  surgery is the classic wasted build cycle here.
- **`nodejs`/`npm` looked like obvious waste.** Worth 0.7 seconds. Not worth doing.
- **The 291 MB initramfs looked like a boot tax.** It reaches the LUKS prompt in
  3.2s. Refuted. Trimming `--no-hostonly` would have risked unbootable laptops
  to win nothing.
- **A "truncated" boot capture was not a harness bug** — boot was blocked at the
  LUKS passphrase prompt for 4m08s. Encrypted products cannot be boot-timed
  without supplying the passphrase and excluding that wait from the number.
- **What actually dominated:** 1.68 GB that SP+ installs and then deletes, which
  still ships because an OCI layer cannot un-write an earlier layer's bytes.
  **Delete in the SAME layer as the install, or the bytes ship anyway.**

## 5. Standing decisions (do not relitigate without Christopher)

- **LibreOffice stays.** Removing `libreoffice-base` (~9.4s) is a feature cut.
  Decided 2026-09-02.
- **No squashing.** It would save ~38-55s but collapse the layers `bootc upgrade`
  uses to ship deltas, so every future update would pull the whole ~5.6 GB.
  Advisors install once and update many times. Decided 2026-09-02.
- **Keep the Fedora-signed base.** Building our own base saves ~30s but moves the
  trust root from Fedora to us. Not worth it. Decided 2026-09-02.
- **Keep `dracut --no-hostonly`.** One image must boot on any advisor laptop.
  The only sanctioned trim is curating individual dracut modules, each tested
  against Intel/AMD/NVIDIA graphics, NVMe/SATA/RAID, filesystems, UEFI, LUKS,
  TPM, keyboard and any network unlock path.

## 6. Things that BREAK bootc — never do these

- Remove `ostree` / `ostree-prepare-root` or its initramfs config -> breaks
  deployment switch-root.
- Remove `cryptsetup` / `systemd-cryptsetup`, TPM2/Clevis/FIDO, keyboard,
  storage or filesystem drivers -> **breaks LUKS unlock**.
- `rpm-ostree install` / `rpm-ostree initramfs` on a deployed system ->
  `bootc upgrade` errors.
- Relocate kernel/initramfs out of `/usr/lib/modules/$kver/` to `/boot`, or drop
  SELinux xattrs or the bootc image label.

**Speed never buys itself with security or with the update lane.**

## 7. Dispatch discipline (agents)

- The brief is a FILE; the prompt is a fixed pointer. Never argv.
- Tom's coding harness (`run-tom-code.sh`) carries the surgical mandate and the
  batch-process rule: he must BLOCK and poll until work finishes. He once ended
  a turn with "I'll pick back up when it completes" and orphaned a live install.
- Bee runs `pi -p`, which BUFFERS stdout until exit — a timeout destroys the
  output rather than truncating it. Size briefs to finish. Set `THINKING=high`
  for reasoning work; at `low` Bee answered "No further action required."
- Check process NAMES before declaring a job dead. Bee is `pi`, not `codex`.
