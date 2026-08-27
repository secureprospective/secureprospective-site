# SP+ RESUME — compaction #8, 2026-08-27 ~15:10 CDT

## 1. WHAT WE ARE DOING

SP+ (Secure Prospective Advisor OS), a Fedora Kinoite 44 bootc/image-mode Linux
distribution for independent financial advisors. cycle34 is built, delivered and installed
successfully. Four fixes are committed and staged for cycle35, which has **not** been
built. The live work is Bee drafting the **SP+ Welcome** screen (DN-26).

- Repo: `/home/chris/work/secureprospective-advisor-os`
- Branch: `session/sp-plus-plan` (never work on main; never `git --no-verify`)
- Host: Beelink (`com`, 192.168.1.190). CT105 (192.168.1.105) is head-brain; observe, do
  not intervene in its work.

## 2. AGENTS + HARNESSES

**Bee** = the Pi agent on this machine, working dir `/home/chris/sp-plus-bee/`.
Briefs are `BRIEF-<job>.md`, runners `run-<job>.sh`, dispatched detached via
`systemd-run --user`. Bee returns **evidence, never a verdict**, and never edits the repo.

**Bee MUST run on `gpt-5.6-luna` with high thinking.** Every runner needs
`--model openai-codex/gpt-5.6-luna --thinking high` explicitly; with no flag `pi` silently
uses its own default. The `opencode-go` provider (1.1M context) returned
`429 GoUsageLimitError — monthly limit reached, resets in 10 days`, so use `openai-codex`
(272K) until roughly 2026-09-06.

## 3. IN-FLIGHT RIGHT NOW — most perishable

### bee-welcome.service — SP+ Welcome research + draft (RUNNING)

- Started 15:04:15 CDT, MainPID 3770628. No timeout; long job (heavy web research).
- Alive check: `systemctl --user is-active bee-welcome`
- **Liveness proof:** `ls -lt ~/.pi/web-search-cache | head` — files were being written at
  15:05, which is Phase 1 research actually happening. An empty `bee-welcome.log` is
  NORMAL: `pi -p` buffers, and a quiet log is not a stall.
- Brief: `/home/chris/sp-plus-bee/BRIEF-welcome-draft.md`
- Output: `/home/chris/sp-plus-bee/welcome-draft/` → `RESEARCH.md`, `ICP.md`, `DESIGN.md`,
  code, `RUN.md`, screenshots of every screen.
- Sentinel: `~/sp-plus-bee/REPORT-welcome-draft.md` then `REPORT-welcome-draft.DONE`
- **Transcript (recovery channel if killed):**
  `/home/chris/.pi/agent/sessions/--home-chris-sp-plus-bee--/2026-08-27T20-04-15-697Z_01a044d2-b8d1-7f66-b440-4fd0f2082389.jsonl`
- A persistent Monitor (task `bf7uar5tu`) watches for the sentinel. **Monitors do not
  survive compaction reliably** — if no notification arrives, check the sentinel by hand.
- **When it lands:** read `ICP.md` and the prioritised flow FIRST and take those to
  Christopher before the code. If the ICP and flow are wrong the draft does not matter.

### Christopher's VM `fedora-test34` — his own, NEVER kill

cycle34 installed and rebooted successfully; he is testing on it. Reachable only via the
QEMU guest agent (see §10). `fedora-test` is also his by standing rule.

## 4. GATES / STATUS

| Gate | State |
|---|---|
| `tests/config-preflight.sh` | 12/12 pass |
| `tests/preflight-gate.sh` | 10/10 pass |
| `tests/pkg-preflight.sh` | pass, 54 packages resolve |
| cycle34 build gates | TOOLS_OK, MENU_OK visible_entries=28, AUTOSTART_OK count=13, DEBLOAT_OK enabled_units=77 |
| cycle35 | **NOT BUILT.** Four fixes committed, awaiting Christopher's go |
| 10 SELinux AVCs (bootupctl/lsblk, unlabeled /boot) | deferred |

## 5. ARTIFACTS THAT EXIST AND WORK

- `/home/chris/Downloads/SP-PLUS-cycle34.iso`
  5,286,039,552 bytes
  sha256 `f0af88023c56fc88a1009fdc40bd8db50f1cf344b6ebbb51940b85bf6987db17`
- Build log: `/home/chris/sp-plus-build-20260827T141814.log`
- cycle34 lane evidence (KEEP): `/home/chris/sp-plus-iso/cycle34/*.png`, `serial.log`,
  `bserial.log` — includes `screen-wizard-blocked-sddm.png`, the SDDM finding.
- Bee reports: `~/sp-plus-bee/REPORT-cycle34.md`, `REPORT-libreoffice-msoffice.md`,
  `REPORT-pi-skills-extensions.md` (the last still on the table, not in the repo).

## 6. THE CURRENT STATE — no open bug blocking anything

cycle34 installs and boots. One transient was observed and NOT reproduced: Christopher's
first install went to a uniform grey screen ~1-2 min into the payload, with writes frozen
at exactly 2,617,446,400 bytes and the framebuffer a single colour (128,128,128) across
all 1,024,000 pixels. His retry installed cleanly, and Bee's parallel lane install reached
12.5 GB. **Leading hypothesis: a transient SPICE/virtio-vga display crash taking Anaconda's
session down.** Caveat: never reproduced, so this is unproven and may recur.

## 7. HYPOTHESES ALREADY REFUTED — DO NOT RETEST

- **"Bee is broken / ignoring the brief."** No. Three failed cycle34 dispatches were all
  defects in what I handed it: (a) a brief-local gate `! grep -q writer_OOXML` that matched
  the token inside an explanatory XML comment; (b) the wrong package name; (c) a fixed
  systemd unit name colliding with a `RemainAfterExit=yes` corpse. Bee followed the brief
  and refused to invent results every time.
- **"`caladea-fonts` is the package name."** No. It does not exist in Fedora 44 either.
  The real name is **`google-crosextra-caladea-fonts`**, confirmed via `dnf provides` on
  the font files and verified by `fc-match Caladea` on the installed system.
- **"`plasma-setup` creates the advisor's account and must never be removed."** FALSE, and
  the Containerfile comment saying so is stale. DN-23 already writes
  `/etc/plasma-setup-done` at build time, so the wizard NEVER RUNS. Anaconda's user spoke
  creates the account; Christopher did exactly that on cycle34.
- **"The empty `bee-*.log` means the agent died."** No. `pi -p` buffers output.
- **`podman run` has DNS.** It does NOT by default here — needs `--network=host`. Two
  earlier package lookups returned empty for this reason and were nearly misread as
  "package does not exist".
- **The guest agent can verify per-user config.** It cannot. It runs as
  `virt_qemu_ga_t` and SELinux denies it `user_home_t`, so `~/.config/*` contents are
  unreadable. Absence of a file through that channel is NOT evidence of absence.

## 8. DECISIONS (Christopher's, do not relitigate)

- **DN-26 (new, committed):** retire the KDE wizard; **SP+ Welcome** owns the first screen;
  **Flathub open** (chosen over a curated allowlist, tension recorded in the doc).
- Welcome scope: theme chooser early, app installs, Fin setup, orientation, printer+email,
  Google/M365 account connections, **and a shared network drive with a saved password**.
- **Theme chooser near the very beginning** — his words: makes it "pleasurable, as well as
  having them feel they have ownership over the process." SP+ theme pre-selected.
- Network share = **a real system mount** with a root-only credentials file, not just a
  Dolphin bookmark. The advisor should see a folder, not a protocol.
- Fin: how keys are fetched is UNCHANGED; only the guidance improves. The TUI must ALWAYS
  open; no key prompt.
- "You need to push Bee to do the work" — I drive and delegate; Bee executes.

## 9. LEDGER / GIT STATE — all committed, tree clean

```
7d3b039 ledger: DN-26 gains network share drives and saved credentials
dd25a93 fin: always open the TUI; replace key prompt with /login guidance
6d5f66e kde: fix Print Screen binding, put fin on PATH
8f1e9dd images: correct Caladea font package name; add package preflight gate
ff0a503 tests: move config payload checks into config-preflight.sh
```

**Four fixes staged for cycle35:**
1. Print Screen → Flameshot. Two causes fixed: Spectacle declared `_launch=none,Print,...`
   (2nd field is the DEFAULT, which `kglobalacceld` honours when seeding a new user), and
   the file shipped only to `/etc/xdg` (defaults layer) — now also `/etc/skel/.config/`.
2. `fin` symlinked into `/usr/bin` — it existed only at `/usr/libexec/sp-plus/fin`, so
   typing `fin` failed, including per our own `/techhelp` guidance.
3. Fin always opens the TUI; `/login` guidance replaces the "welcome email" key prompt;
   no `--provider` forced when unkeyed, or Pi cannot offer the provider choice.
4. Caladea package name (already in cycle34, verified installed).

## 10. RELAY / ENVIRONMENT NOTES

- **Christopher's VM has no SSH** — libvirt SLIRP user networking, 10.0.2.15, no hostfwd.
  Use the **QEMU guest agent**. Helper written this session:
  `/tmp/claude-1000/-home-chris/be0acfa3-9ce0-4a04-a529-45b08530b737/scratchpad/gx`
  (`gx '<shell command>'`, `GX_DOM` to change domain). It is confined — see §7.
- To inspect the built image unconfined: `sudo -n podman run --rm localhost/sp-plus-kde:spike ...`
  (`sudo -n` works for podman ONLY). Add `--network=host` for anything needing DNS.
- Screenshot a libvirt VM: `virsh screenshot <dom> out.ppm` then `convert`.
- Never `pkill -f` / `ps | grep <pattern>` — matches your own shell. Kill from a pidfile.
- `spplus-test` is the disposable test LUKS/root passphrase. Never in the ISO, repo, or
  committed config.
- Reaped this compaction: cycle32 + cycle34 lane VMs (by pidfile) and the superseded
  cycle32 disk image. **12 GB reclaimed**, 74G → 86G free. All logs and screenshots kept.

## 11. NEXT ACTIONS, IN ORDER

1. **Check `bee-welcome`** — `systemctl --user is-active bee-welcome` and
   `ls ~/sp-plus-bee/REPORT-welcome-draft.DONE`. If dead without a sentinel, recover its
   reasoning from the transcript in §3 before re-dispatching.
2. **Read `welcome-draft/ICP.md` and the prioritised flow FIRST** when it lands, and take
   those to Christopher before any code. Then `RESEARCH.md`, then the screenshots.
3. **Ask Christopher whether to fire cycle35** with the four staged fixes, or fold the
   Welcome work and `wsdd` in and build once.
4. **Add `wsdd` to the KDE Containerfile** before Welcome ships — it is the ONLY missing
   piece for network-share discovery. `cifs.ko`, `cifs-utils`, `samba-client`,
   `kio-extras`, `keyutils`, `avahi`, `kwalletd6` + `pam_kwallet5.so` are all already
   present, verified against `localhost/sp-plus-kde:spike`.
5. **Get Christopher's eyes** on cycle34: fastfetch logo + info panel, starship prompt,
   btop theme, LibreOffice Writer (ribbon/Colibre, `.docx` default). I cannot verify these
   through the confined guest agent, and three are aesthetic calls that are his.
6. **Fix the lane so it can test post-login at all.** `spb-install` skips the Anaconda user
   spoke, so no account exists; with the wizard pre-completed it lands on SDDM with nobody
   to log in as, which is why Bee returned COULD NOT TEST on all seven questions.
7. When DN-26 is implemented, delete the `plasma-setup` gettext catalogues and locale
   drop-ins that exist only to rebrand it. **Keep `/etc/locale.conf`** — cycle27 proved
   `fedora-kinoite:44` ships none and without it every process starts in the C locale.

## 12. HONEST STATUS

cycle34 is real, installed, and verified as far as a confined channel allows. **cycle35 has
not been built and must not be described as working.** The four staged fixes are committed
and gated but **unproven on hardware** — in particular the Print Screen fix addresses two
plausible causes and neither has been confirmed on a booted system. Bee's Welcome draft is
research-in-progress with nothing written yet as of 15:05; treat any claim about its
contents as unknown until the artifacts exist. The grey-screen install stall is unexplained
and unreproduced.
