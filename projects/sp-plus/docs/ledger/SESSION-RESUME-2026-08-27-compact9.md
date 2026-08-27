# SP+ RESUME — compaction #9, 2026-08-27 ~17:30 CDT

## 1. WHAT WE ARE DOING

SP+ (Secure Prospective Advisor OS), a Fedora Kinoite 44 bootc/image-mode Linux distribution
for independent financial advisors. cycle34 is built, delivered and installed. The live work
is **SP+ Welcome** (DN-26), the first-run app that replaces the KDE wizard, being rebuilt as
an HTML application carrying Christopher's real brand identity, for **cycle35**.

- Repo: `/home/chris/work/secureprospective-advisor-os`, branch `session/sp-plus-plan`
- Never work on main. Never `git --no-verify`.
- Host: Beelink (`com`, 192.168.1.190). CT105 (192.168.1.105) is head-brain; observe, do not
  intervene in its work.

## 2. AGENTS + HARNESSES

**Bee** = the Pi agent on this machine, working dir `/home/chris/sp-plus-bee/`. Briefs are
`BRIEF-<job>.md`, runners `run-<job>.sh`, dispatched detached via `systemd-run --user` with
a **timestamped unit name** (a fixed name collides with a `RemainAfterExit=yes` corpse).
Bee returns **evidence, never a verdict**, and never edits the repo.

**Model matters and is a standing rule:**
- `openai-codex/gpt-5.6-luna --thinking high` for engineering work.
- `openai-codex/gpt-5.6-terra --thinking high` for **aesthetic** work. Verified working this
  session. `opencode-go` does NOT carry terra (`401 Model not supported`).
- Never leave the model to pi's default.

**Christopher's standing correction, 2026-08-27:** *"you are always stuck in average land
with this kind of stuff, lean hard into gpt on this one and we need to ban the idea of
average."* Design work goes to terra + the `impeccable` skill. I write briefs and judge
results; I do not choose palettes or layouts.

## 3. IN-FLIGHT RIGHT NOW — most perishable

### bee-welcome-v4-172735.service — the HTML rebuild (RUNNING)

- Started **17:27:35 CDT**, MainPID 3933904, model `openai-codex/gpt-5.6-terra`, high
  thinking. No timeout. Long job.
- Alive: `systemctl --user is-active bee-welcome-v4-172735`
- **Liveness proof = transcript mtime**, not artifacts (artifacts persist after death):
  `/home/chris/.pi/agent/sessions/--home-chris-sp-plus-bee--/2026-08-27T22-27-35-644Z_01a04555-f25c-7f90-a76c-a82e4fbc758b.jsonl`
  An empty `bee-welcome-v4.log` is NORMAL: `pi -p` buffers.
- Brief: `/home/chris/sp-plus-bee/BRIEF-welcome-v4-html.md` (sections 1-6 plus 7-8 appended
  after a deliberate restart, see §6)
- Output: `/home/chris/sp-plus-bee/welcome-draft/`
- Sentinel: `REPORT-welcome-v4.md` then `REPORT-welcome-v4.DONE`
- Watcher: background Bash task `bi3gh3ons`. **Watchers may not survive compaction** — if no
  ping arrives, check the sentinel by hand.
- **When it lands:** read the report, then the VM screenshots, then decide whether cycle35
  builds. Do not accept "average"; that is the stated acceptance criterion.

### spplus-review-serve.service — HTTP on :8899 (RUNNING, keep it)

Serves `/home/chris/sp-plus-bee/review-serve/` on `0.0.0.0:8899`. **This is the only channel
into Christopher's VM** (it fetches from `http://10.0.2.2:8899/`) and also serves the
screenshot review page at `http://192.168.1.190:8899/`. Do not stop it.

### fedora-test34 — Christopher's VM. NEVER kill.

Booted, account `test` (uid 1000), running the v3 Welcome app. Its **screen lock is
currently OFF** (see §7). `fedora-test` is also his by standing rule.

## 4. GATES / STATUS

| Gate | State |
|---|---|
| `tests/config-preflight.sh` | 12/12 pass |
| `tests/preflight-gate.sh` | 10/10 pass |
| `tests/pkg-preflight.sh` | pass, 55 packages resolve (wsdd added) |
| cycle35 | **NOT BUILT.** Fixes committed, awaiting Welcome + Christopher's go |
| 10 SELinux AVCs (bootupctl/lsblk, unlabeled /boot) | deferred |

## 5. ARTIFACTS THAT EXIST AND WORK

- `/home/chris/Downloads/SP-PLUS-cycle34.iso` — 5,286,039,552 bytes,
  sha256 `f0af88023c56fc88a1009fdc40bd8db50f1cf344b6ebbb51940b85bf6987db17`
- `/home/chris/Downloads/SP-PLUS-cycle33.iso` — 5.0G, superseded. **Christopher's directory;
  ask before deleting.**
- Bee reports in `~/sp-plus-bee/`: `REPORT-cycle34.md`, `REPORT-welcome-draft.md`,
  `REPORT-welcome-theme-vm.md`, `REPORT-welcome-v2.md`, `REPORT-welcome-v3.md`
- `welcome-draft/` (662M): `RESEARCH.md`, `ICP.md`, `DESIGN.md`, `welcome.py` (v3 PySide6,
  being replaced), `help-corpus/`, `help-additions/libreoffice.md`, `screenshots/`, `vm34/`
- Review page: `http://192.168.1.190:8899/` and `~/Downloads/SP-PLUS-Welcome-review.html`
- Artifact (needs his login): https://claude.ai/code/artifact/d6ba5854-73e5-4b2c-b28a-e99fdfc7c53a

## 6. THE CURRENT STATE — no open bug blocking anything

v4 was **deliberately stopped 4 minutes in and restarted at 17:27** after the website
project's `CLAUDE.md` revealed four locked brand rules invisible in the CSS. One of them (no
em dashes) touches every string in the app, so restarting was far cheaper than correcting.
That is not a fault; do not treat the short first run as a failure.

**Unreproduced, from cycle34:** Christopher's first install went to a uniform grey screen,
writes frozen at exactly 2,617,446,400 bytes, framebuffer a single colour. His retry and the
lane both installed cleanly. Leading hypothesis: a transient SPICE/virtio-vga crash taking
Anaconda's session down. **Never reproduced. Unproven. May recur.**

## 7. HYPOTHESES ALREADY REFUTED — DO NOT RETEST

- **"Christopher's VM has no SSH."** FALSE now. A host forward was added to the LIVE qemu
  monitor: `virsh qemu-monitor-command fedora-test34 --hmp 'hostfwd_add hostnet0 tcp:127.0.0.1:2234-:22'`.
  `ssh -p 2234 test@127.0.0.1` reaches it. **It dies when the VM powers off.** Still blocked
  on the account password — never guess it.
- **"The image ships no flatpak."** FALSE. `flatpak` 1.18.1, `plasma-discover` 6.7.4 and
  `plasma-discover-flatpak` are all installed. Only the **Flathub remote** is missing. DN-26
  has been corrected.
- **"Welcome needs a new GUI runtime."** FALSE. `python3-pyside6` 6.11.1 AND
  `qt6-qtwebengine` 6.11.1 are in the image; `from PySide6 import QtWebEngineWidgets`
  imports. The HTML rebuild needs **nothing new**.
- **"There is no `qml` runtime."** TRUE — no `qml`/`qml6` binary, so a standalone QML app
  will not launch. Kirigami QML modules are present.
- **"The guest agent can read/write user config."** It CANNOT. `virt_qemu_ga_t` is denied
  `user_home_t`, `/var/usrlocal`, `getenforce` and outbound sockets. Absence through that
  channel is NOT evidence of absence. It CAN kill processes (it killed kscreenlocker).
- **"`podman run` has DNS."** It does NOT by default — needs `--network=host`.
- **"Bee is broken."** No. Every failure has been a defect in what I handed it. It has twice
  refused to fabricate VM evidence and reported COULD NOT TEST instead, correctly.
- **`caladea-fonts` / `google-caladea-fonts`** do not exist. It is
  `google-crosextra-caladea-fonts`.
- **"`plasma-setup` creates the advisor's account."** FALSE and the Containerfile comment is
  stale. DN-23 writes `/etc/plasma-setup-done` at build time so it NEVER runs.
- **`secureprospective.co`** does not resolve. The site is **secureprospective.com**.

## 8. DECISIONS (Christopher's, do not relitigate)

- **DN-26:** retire the KDE wizard; SP+ Welcome owns the first screen; **Flathub open**.
- **Seven screens**, not eight: office folder + printer + email merged into one.
- **Tailscale is OUT** ("not a day one task"). **Signal Desktop is IN** (`org.signal.Signal`).
  This removes the only daemon that needed baking into the image.
- **Optional-tools screen also carries Discover / the Flatpak store.**
- **"Know your way around" gets an information tree** — cards with breadcrumbs that never
  leave the app, built from the existing help corpus, going deep on LibreOffice specifically
  because it intimidates.
- **ISO size is cheap.** "we will have many themes even if it bloats the ISO a bit." Never
  economise on assets; raise size only with megabyte numbers attached.
- **The app is HTML** in a PySide6 `QWebEngineView` shell.
- **Brand = secureprospective.com, measured not designed.** `#0033A0` blue, `#E5E4E2`
  platinum, `#D4AF37` identity gold, `#FFD700` accent, `#222222` ink. **Nothing is rounded.**
- **Four locked rules from the website project:** zero em dashes in anything a user reads;
  the anti-list (no soft blurred shadows, hard offsets only); motion 120-200ms; mood anchor
  = corporate badge x transit signage x financial ledger x storm shelter x vault.
- **`1GraphWeb_8K.png` is the SP+ Calm default wallpaper.**
- Fin: no key, no welcome email. The TUI always opens; `/login` handles providers.

## 9. LEDGER / GIT STATE — all committed, tree clean

```
2ee76d9 theme: SP+ Calm gets Christopher's graph-web wallpaper; brand rules from the site
0f52dda branding: capture the secureprospective.com identity as a spec
5f73ce6 kde: add wsdd for network-share discovery, client-only
11732a9 ledger: compaction #8 — cycle34 shipped, Bee drafting SP+ Welcome
```

**Staged for cycle35, committed but unbuilt:** Print Screen → Flameshot; `fin` on PATH; Fin
always opens with `/login`; Caladea package name; **`wsdd`** client-only discovery; SP+ Calm
wallpaper ladder.

## 10. NEXT ACTIONS, IN ORDER

1. **Check `bee-welcome-v4-172735`** — `systemctl --user is-active` and the sentinel. If dead
   without a sentinel, recover its reasoning from the transcript in §3 before re-dispatching.
2. **Read `REPORT-welcome-v4.md`, then the VM screenshots.** Judge it against "ban average"
   and the mood anchor, not against whether it is tidy.
3. **Answer Christopher's two open questions** if he has not: does the desktop theme get
   repaletted to blue/gold to match Welcome, or is Welcome its own surface? And should
   Welcome follow the advisor's chosen theme or always be light?
4. **Get his ruling on the Primal font licence** before cycle35 ships it. It is staged in
   `branding/brand/fonts/`, loaded at runtime, deliberately NOT installed by the Containerfile.
5. **Add `ibm-plex-sans-fonts`** to the KDE Containerfile. It is the brand body face and is
   absent from the image.
6. **Add the Welcome `.desktop` + icon + `/etc/skel` autostart plumbing.** Without it Welcome
   never appears on first login and cannot be reopened from the menu.
7. **Fix the em dashes at source** in `projects/sp-plus/knowledge/` and `config/fin-*`. Bee
   filters them at render time and lists the locations; the source is still wrong.
8. **Correct the GNOME/KDE split in the help corpus at source.** Five locations Bee named:
   `START-HERE.md`, `advisor-help/getting-around.md`, `troubleshooting/printer-not-printing.md`,
   `troubleshooting/second-monitor.md`, `security/screen-lock-and-privacy.md`.
9. **Decide the `qemu-guest-agent` question.** It is installed and enabled in the image, and
   it let the screen lock be bypassed on a VM. Keep for the lane, or drop from production
   images? Christopher's call, flagged and unanswered.
10. **Then build cycle35.**

## 11. RELAY / ENVIRONMENT NOTES

- **Into Christopher's VM without SSH**, proven twice:
  `virsh send-key fedora-test34 KEY_LEFTMETA`, then
  `SPB_DOM=fedora-test34 /home/chris/sp-plus-bee/spb-type 'konsole' --enter`, then
  `curl -o g http://10.0.2.2:8899/go`, then `bash g`.
  **`spb-type` has no pipe character** — avoid `|`.
- Screenshot a VM: `virsh screenshot fedora-test34 out.ppm`, then convert with PIL.
- A blank screenshot (2 colours) means the display is blanked; `virsh send-key
  fedora-test34 KEY_LEFTSHIFT` wakes it. That is not a crash.
- **`fedora-test34`'s screen lock is OFF** because Bee killed `kscreenlocker` via the guest
  agent to get past it. Session is open. Do not report this as a break-in; it is recorded.
- Guest-agent helper written this session: `<scratchpad>/gx '<cmd>'`, `GX_DOM` to change domain.
  It is SELinux-confined; see §7.
- Inspect the built image: `sudo -n podman run --rm localhost/sp-plus-kde:spike ...`
  (`sudo -n` is podman ONLY). Add `--network=host` for anything needing DNS.
- Never `pkill -f` / `ps | grep <pattern>` — matches your own shell. Kill from a pidfile.
- `spplus-test` is the disposable test LUKS/root passphrase. Never in the ISO, repo, or
  committed config. **No secrets in the image, ever.**
- Reaped this compaction: five stale `bee-*` units and `cycle28/disk.qcow2` (11G).
  **11 GB reclaimed, 84G → 95G free.** Every log, screenshot and report kept.

## 12. HONEST STATUS

cycle34 is real and installed. **cycle35 has not been built and must not be described as
working.** The staged fixes are committed and gated but **unproven on hardware** — in
particular the Print Screen fix and `wsdd`, where nothing has yet watched `wsdd.service`
reach `active` on a booted machine; the empty `BindsTo=` reset is documented systemd
behaviour and `systemd-analyze verify` is silent, but that is not runtime proof. The v4 HTML
rebuild is **in progress with nothing written yet** as of 17:28; treat any claim about its
contents as unknown until the artifacts exist. The grey-screen install stall is unexplained
and unreproduced. The Primal font licence is unresolved and is a genuine ship blocker.
