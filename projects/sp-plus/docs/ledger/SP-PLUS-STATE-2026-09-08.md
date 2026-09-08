# SP+ — Combined State of Both Lanes

**Written:** 2026-09-08 · **Machine:** Beelink · **Repo:** `~/work/secureprospective-advisor-os`

This is the single authoritative state document for SP+, covering **both** the Fedora/KDE bootc
lane and the Debian 13 lane. It exists so an agent picking this up cold — Bee included — can work
without re-deriving anything. If a fact here conflicts with another file, check the commit dates;
do not copy facts out of here into a second document, because a ref written twice drifts.

---

## 0. The one open question

**Does SP+ continue on Fedora bootc, or move to Debian 13?**

Not answered. It is Christopher's call and it is the gate on almost everything below. Claude's
recommendation, 2026-09-07: **stay on Fedora, keep Debian as a documented triggered option.**
Reasoning is in §5. Nothing in the Debian lane should be built until this is settled.

---

## 1. Repository and branch map

| Branch | Holds | State |
|---|---|---|
| `session/sp-plus-debian-plan` | Doc 12 and its two revisions, docs 06/11/README, three audit reports | Pushed. Not merged |
| `session/sp-plus-base-repin` | The Fedora base re-pin, one line in the Containerfile | Pushed. **NOT BUILT, NOT GATED** |
| `session/sp-alpha-rig-profile` | Prior session's work | Parent of the doc branch |

Commits from this session, all pushed:

- `3f3e72c` doc 12 created, docs 06/11/README edited
- `ec17e12` compact-safe resume document
- `d283433` Bee verification audit recorded
- `493f4db` doc 12 revision 1
- `e48c607` doc 12 revision 2, after two terra audits
- `2d1e5bc` Fedora base re-pin (separate branch)

---

## 2. Fedora / KDE bootc lane — the shipping product

### What exists and works

- ISOs on the Beelink: `~/Downloads/SP-PLUS-1.0-alpha2.iso` (5.45 GB) and `sp-plus-1.0-alpha.iso`.
- Built images: `localhost/sp-plus-kde:d1d4-impl`, `ghcr.io/secureprospective/sp-plus-kde`
  (tags `latest`, `20260902`, `20260902b`, `testlane`). All **amd64**.
- Gates exist as scripts: `projects/sp-plus/tests/preflight-gate.sh`, `release-gate.sh`.
- `projects/sp-plus/scripts/run-qemu.sh` requires `qemu-system-x86_64`.

### The base pin problem — the important finding of 2026-09-07

The Containerfile pinned `quay.io/fedora/fedora-kinoite@sha256:dd672611...`. **That digest no
longer exists on quay.io** — `skopeo` returns `manifest unknown`. Fedora rotated it off the
registry. Even the `:44` tag has moved since.

**The old digest is not recoverable, by anyone, ever.** containers-storage keeps layers
decompressed, so the original compressed blobs the manifest digest is computed over were discarded
at pull time. `skopeo copy --preserve-digests` refuses: *"would require changing layer
representation"*. Content is recoverable; identity is not.

**Consequence: `SP-PLUS-1.0-alpha2.iso` cannot be rebuilt from source at its pinned base.** That
was already true before anyone looked; nothing done on 2026-09-07 caused it.

The Containerfile's own comment above the `FROM` line predicted this exact failure and named the
fix — mirror the base into our own registry — which was never implemented.

### What was done about it

- Content-faithful archive at `/QEMU/base-archive/fedora-kinoite-dd672611.tar` on the Beelink
  **root filesystem** (3.2 GB, own digest `sha256:7cf87aaf...`, config `39904990511a` matching the
  cached image). A reference copy, **not** a restoration of the pin.
- The cached image `fedora-kinoite@dd672611` is **deliberately retained** in podman storage. It is
  the last live copy of that identity. Do not blanket-prune.
- Re-pin staged on `session/sp-plus-base-repin` to `fedora-kinoite:44`
  `sha256:6041ce7cf2b3318c4703d7a1a23e4d8e2de83e72c5e941b915750ed86414214c` (amd64, 2026-09-07).

### Open on this lane

1. **Rebuild and full hardware-gate re-run** for the re-pin. Required by the Containerfile's own
   comment. Not done. Nothing built from `2d1e5bc` may ship until it is.
2. **Mirror the base into our own registry.** The real fix. Needs ghcr credentials; `gh` is **not
   installed** on the Beelink and Christopher's standing preference is `gh` device flow, never PATs.
3. **One end-to-end bootc rebase test on advisor hardware.** This is the single assumption the
   "stay on Fedora" recommendation rests on, and it has never been run.

### Architecture

**amd64 only.** The base pin resolves to a single-arch amd64 manifest. Upstream
`fedora-kinoite:latest` *is* a multi-arch index (arm64 `sha256:3ca7a581...`, amd64
`sha256:37361069...`), so the container could go multi-arch — but that produces only an arm64
*image*. Per-device boot, firmware and the ARM Secure Boot chain are all downstream and unsolved.

---

## 3. Debian 13 lane — a plan, zero code

`projects/sp-plus/docs/12-DEBIAN-LIVE-INSTALLER-AND-SUPPORT-PLAN.md` — 70,639 bytes, revision 2.
**No implementation exists.** No `projects/sp-plus/debian/` tree, no packages, no signing key, no
live-build run, no ISO.

Structure: §0 fact base · §1 what Fedora gives free vs what Debian makes us own · §2 six-package
set · §3 fail-closed managed update · §4 installer incl. §4.6 hardware/firmware · §5 phases and
gates incl. §5.8 unowned decisions · §6 support obligation · §7 tech-debt boundaries.

### Decisions of record (doc 06)

| | |
|---|---|
| D32 | Stock Calamares 3.3 driven by `calamares-settings-spplus` supplying `partition.conf` + `mount.conf`. No installer *code*, but SP+ owns the full storage config. **Panel gate still pending** |
| D33 | No grub-btrfs, no snapshot boot menu. Recovery is Timeshift restore |
| D34 | `sp-plus-fin` vendors pinned Node 22 + pinned pi, SHASUMS-verified, no npm on the machine |
| D35 | Beelink builds, R2 hosts, CI deferred to Phase E. **Conflicts with D20** — unresolved |
| D36 | Managed update fail-closed; snapshot verification precedes any APT transaction |
| D37 | Trust roots Debian + SP+ only. Backports per-package only |
| D38 | **Stable base.** Trixie's Cinnamon 6.4.10-2. Newer Cinnamon only as a per-package backport for a *named* feature |
| D39 | Firmware carried in **both** live image and target. b43 installers excluded; b43 hardware unsupported |
| D40 | A model is "supported" only after passing the §4.6 firmware gate **and** getting a ledger row |
| D41 | Debian lane keeps **DN-30's fortnightly cadence** (even ISO weeks, Fri 15:00; apply following Sun 04:00). Restart predicate becomes the recorded APT result |
| D42 | `sp-plus-fin` is `Architecture: amd64`. **The Debian edition is amd64-only while Fin is in the base image** |

Open questions: Q16 (dracut vs initramfs-tools — its asserted answer was removed as unverified),
Q17 (Firefox ESR vs Chromium), Q18 (Timeshift restore UX for a non-technical advisor), Q19 (R2 as
an APT origin), **Q20 (when arm64 becomes a supported target — four named review triggers)**.

### Verified facts worth not re-deriving

- Upstream Calamares 3.3 defaults: `luksGeneration: luks1`, `defaultFileSystemType: "ext4"`.
- Upstream `mount.conf` **example** lists `/@ /@home /@cache /@log` — but that is an example file.
- `calamares-settings-debian` ships **no `partition.conf`** and no `btrfsSubvolumes`, so
  `mount/main.py` lines 137–143 falls back **in code** to `/@` and `/@home` only, plus `/@swap`.
- The SP+ five-subvolume layout **is achievable through stock Calamares config** — no custom
  module, no installer code. It needs explicit `{mountPoint, subvolume}` pairs and
  `Conflicts`/`Replaces` against `calamares-settings-debian`; Calamares does not merge config.
- Trixie: full support to **2028-08-09**, LTS to **2030-06-30**.
- Trixie Node is 20.19.2; `pi` needs >= 22.19.0; upstream Node has no arch-independent tarball.
- `grub-btrfs` returns HTTP 404 from Debian sources — absent from Debian, not from third parties.
- `firmware-b43-installer` / `-b43legacy-installer` **download at install time** and cannot work
  offline.
- `unpackfs` copies the live squashfs into the target, so **firmware does flow live→target**.

### Still unowned — doc 12 §5.8

Twelve decisions with named owners, split so *design* blocks a phase's start and *evidence* blocks
its completion. Rows 8 and 10 (Fin architecture, cadence) are now resolved as D42 and D41. The
other ten stand, notably: storage implementation, TPM2 contract, recovery lifecycle, Secure Boot
chain, firmware scope, hardware matrix, APT trust (moved to blocking **Phase 0**, not Phase E),
CI authority, snapshot acceptance matrix, release terminology.

---

## 4. Audits — three of them, and what they cost

| File in `projects/sp-plus/docs/ledger/` | Model | Found |
|---|---|---|
| `AUDIT-2026-09-07-doc12-bee.md` | Bee / Luna, high | 3 wrong facts in §0, wrong premise under D32, firmware gap, 12 coherence defects |
| `AUDIT-2026-09-07-doc12-terra.md` | terra, high — §4–§7 | The `unpackfs` inheritance error, missing firmware packages, untestable gate rows, circular gates in §5.8 |
| `AUDIT-2026-09-07-doc12-terra-1-facts.md` | terra, high — §0–§3 | The subvolume fallback error, Timeshift "no newer version" error, ISC over-claim |

**Every audit found real errors in work that had already been checked.** Section 0 was wrong about
the *same fact* twice: first `@rootfs` (which exists nowhere), then `/@cache /@log` (a real file,
the wrong one). Both times the method was reading a configuration file and assuming it described
behaviour.

**The lesson, stated in doc 12 §0:** where a claim is about what software *does*, the deciding
source is the code that consumes the configuration, not the configuration shipped beside it.

Also learned this session:

- A dispatcher agent reported "finished" in two seconds having **never run a command**. Caught only
  by checking `~/fleet/runs/` for artifacts. The exit code and the completion notification were
  both useless. *The tree is the evidence, never the exit code.*
- terra's first run exited 0 and printed its own scratchpad instead of a report. The 1500-byte
  floor in the harness caught it. Fix: state in the brief that the entire reply must be the report
  and give it an opening heading to start from.
- `fleet-dispatch.sh` hardcodes `--no-session`, so **there is no session transcript to recover from
  when a dispatch dies.** The documented recovery path does not exist for anything it launches.
- `timeout` is only a wrapper: `kill -9` on the wrapper leaves `pi` running with its stdout fd
  intact. This saved a 100-minute audit four minutes before its deadline. The harness then writes a
  false `REJECTED` sentinel — ignore it and read the `.out`.
- One oversized brief (ten questions) ran 100 minutes. Two split briefs ran ~10 and ~4 minutes.

---

## 5. The strategic comparison

**Fedora costs churn. Debian costs permanent ownership.**

Fedora gives atomic updates, proven rollback, and image signing for free; its cost is a roughly
yearly rebase and a ~13-month support window. Debian gives three quiet years and a calmer base;
its cost is that SP+ must build and then permanently own six packages, a GPG-signed APT repo with
key rotation *and emergency revocation*, an installer configuration, a firmware and per-model
hardware matrix, a hand-built fail-closed update path, and a release process.

The crux: Debian's pitch is safety, but it requires giving up bootc's **proven** atomic rollback
and rebuilding it from Timeshift — which is documented around `@` and `@home` only, does not cover
`/boot`, and has unproven restore semantics across the five SP+ subvolumes.

What would flip the recommendation: a bootc rebase that breaks advisors in the field. That is the
trigger, and it is why item 3 in §2 matters more than anything in the Debian lane.

---

## 6. Machine state — Beelink, end of 2026-09-07

- `/home` 62% used, **166 GB free** (was 92% / 37 GB). Steam removed by Christopher via
  `paste.md` (~94 GB); he pruned three Timeshift snapshots (83 GB → 64 GB); Claude removed stale
  build images (~6 GB).
- `/` 25% used, 326 GB free. **VMs already live here**, correctly: `/QEMU/images/butter.qcow2` and
  `/QEMU/images/SP-Alpha-Rig.qcow2`, moved 2026-09-03, 27 GB actual (sparse). They were never on
  `/home`.
- podman: 182 images, ~30 GB nominally reclaimable — **left on purpose**. A blanket prune takes the
  irreplaceable `dd672611` base.
- `gh` is **not installed**. Needed for the ghcr base mirror.

---

## 7. Next actions, in order

1. **Christopher decides Fedora vs Debian (§0).** Everything else waits on this.
2. If Fedora: run one bootc rebase end-to-end on advisor hardware. This is the untested assumption.
3. If Fedora: rebuild from `session/sp-plus-base-repin` and re-run the full hardware gate.
4. Either way: mirror the Fedora base into our own registry. Needs `gh` installed and a device login.
5. If Debian: run the **D32 expert-AI panel** against the *corrected* D32 wording, then Phase 0.
   Do not run the panel before the lane decision — it is expensive and may gate a lane not taken.
6. Doc 13 — the ISO standards-and-gates system Christopher asked for. Never started. Its seed
   corpus is doc 05's 48 anti-patterns plus the three audits and the incidents in §4 above. Design
   spine agreed: every gate is a predicate over the artifact, never an exit code or a log; a gate
   is born from a real defect with the incident attached as provenance; gates carry a cost tier;
   the definition of done must be observed, not asserted by an agent.

---

## 8. Notes for Bee

- Dispatch briefs live in `~/fleet/briefs/`; runs land in `~/.pi/agent/` as
  `<agent>-<fid>.out/.err/.sentinel`. A sentinel under 1500 bytes is a rejection.
- Vary the session id per dispatch or the same brief replays the old session.
- Prefer several small briefs over one large one. One question per dispatch.
- Report findings on STDOUT. Never write into `projects/sp-plus/docs/` without being asked —
  audits are recorded by the editor, into `docs/ledger/`.
- Do not blanket-prune podman on this machine. See §6.
