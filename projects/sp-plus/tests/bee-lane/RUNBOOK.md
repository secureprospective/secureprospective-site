# SP+ TEST LANE — RUNBOOK FOR BEE / LUNA
Version 1 · 2026-08-26 · lives at `~/sp-plus-bee/RUNBOOK.md` on the Beelink

You are running the **test loop** for SP+, a Fedora-44 bootc Linux distribution for
financial advisors. Christopher owns the machine. Headbrain (Claude on CT105) owns
the judgment. **You own the loop.**

---

## THE ONE RULE

**Return evidence, never a verdict.**

Paste the actual lines. Do not write "it works", "the fix succeeded", "SELinux is fine",
or "boot completed normally". Those sentences are what this lane exists to avoid — a
wrong root cause was recorded on 2026-08-26 from exactly that kind of summary, and cost
most of a day to unwind.

If you believe something, say: *"I think X, because these lines: <lines>"* — with the
lines. Headbrain decides whether X is true.

**"NOT FOUND" and "I could not tell" are correct, valuable answers.** A confident guess
is worse than a blank.

---

## NO ROOT NEEDED — READ THIS FIRST

Every script here runs as `chris`. QEMU, swtpm, socat and the gates need no privileges.
**Root lives inside the guest**, reached over the serial console with `spb-shell`.
So: if you find yourself wanting `sudo`, you are on the wrong path — use `spb-shell`.

The single exception is rebuilding the ISO, which needs rootful podman. That is wrapped
once, in `spb-build`, and you never compose a privileged command yourself.

---

## THE LOOP

```bash
cd ~/sp-plus-bee
export CYCLE=cycle7          # pick a NEW cycle name each run; never reuse cycle6

./spb-sha                    # 0. what ISO is on disk right now
./spb-build                  # 1. rebuild (~15 min, detached). SKIP if the ISO is current.
./spb-install                # 2. fresh VM, drives Anaconda, ~35 min
./spb-mkuser spbtest spplus-test   # 2b. MANDATORY. See below.
./spb-boot                   # 3. serial boot + LUKS unlock, ~5 min
./spb-evidence               # 4. THE DELIVERABLE — paste this whole output back
```

**Step 2b is not optional and is easy to forget.** SP+ ships NO account (DN-13) and
root's password is a random hash generated at install time and thrown away — so
`spb-shell` and `spb-login` CANNOT log in until `spb-mkuser` has created one. If you
skip it, every command you try returns `Login incorrect` at a `sp-plus login:` prompt
and it looks like a defect in the ISO. It is not. It is this step, missing.

`spb-mkuser` does NOT start a VM. It types into one that is ALREADY sitting in a
dracut pre-pivot shell, so the real sequence is three commands, in this order:

```bash
./spb-boot 'rd.break=pre-pivot'      # boot INTO the pre-pivot shell
./spb-mkuser spbtest spplus-test     # write the account into the deployment
# then kill that VM from its pidfile and boot normally:
kill $(cat /home/chris/sp-plus-iso/$CYCLE/boot.pid); sleep 5
./spb-boot
```

If you run `spb-mkuser` against a normally-booted guest it prints
`MKUSER_RESULT=NOT-IN-PREPIVOT-SHELL` and changes nothing. Never `pkill -f`.

`spb-boot "enforcing=0"` boots permissive, for when you need the system up to inspect it.

`spb-shell '<cmd>'` runs one command in the guest and prints the output. Example:
```bash
./spb-shell 'semodule -DB; getenforce; ausearch -m AVC -ts boot | tail -40'
```

---

## WHAT WE ARE TRYING TO PROVE RIGHT NOW
*Rewritten 2026-08-27 for cycle32. Everything the previous version of this section
described (DN-15, DN-16) is settled; see DO NOT RETEST below.*

Cycle32 is the first ISO that carries all of the following at once. **None of it has
been observed working on an installed machine.** Build gates proved the FILES are
right; that is not the same claim.

**1. Fin is now a real agent, not a menu.** Fin was four menu items over an RPC
allowlist. It is now the Pi agent (`/usr/bin/pi`, pinned 0.84.3) behind
`/usr/libexec/sp-plus/fin`. The risky part: `npm` was REMOVED in the same build layer
that installed it, so the question is whether `pi` still has a runtime on a real
machine. Prove:

- `pi --version` prints `0.84.3`
- `node --version` works, and `command -v npm` finds NOTHING
- `/usr/libexec/sp-plus/fin < /dev/null` exits **1** and names `spplus-fix printer`.
  It must NOT traceback and must NOT hang. This is what an advisor sees if they open
  Fin before a key is set up, so it is the most likely first contact with the product.
- **`/etc/sp-plus/fin.env` must NOT exist.** No credential ships in the ISO, ever.

**2. DN-24 — the desktop paints itself.** Previous ISOs NAMED the SP+ look-and-feel in
`/etc/xdg/kdeglobals` but never APPLIED it, so a fresh install came up with Fedora's
wallpaper and Fedora's favourites while a hand-dressed machine looked right. A per-user
unit `spplus-first-login.service` now applies it. Prove:

- `systemctl --user --machine=<user>@ status spplus-first-login` ran, or its journal
  shows `spplus-first-login: applied`
- the wallpaper on screen is the SP+ one, not Fedora's — **use `spb-screen` and look**
- `~/.local/state/sp-plus/first-login-theme-applied` exists afterwards

**3. btop, fastfetch and flameshot, configured out of the box.** Prove each RUNS on the
installed machine, and that `/etc/skel` defaults actually reached the created account:

- `btop --version`, `fastfetch --version`, `flameshot --version`
- `~/.config/btop/btop.conf` exists **in the advisor's home**, not just in `/etc/skel`
- `fastfetch` renders with the SP+ logo and says `System  SP+`
- **Print Screen opens flameshot, not Spectacle.** This is UNVERIFIED and is the single
  thing here most likely to be wrong. `kglobalshortcutsrc` was shipped as a defaults
  layer; whether Plasma honours it for a launch binding has not been observed. Press the
  key in a real session and report what appeared.

**4. The whole ISO still works.** Everything the six-step loop already covers: boot,
LUKS, login, the advisor account, Brave, the SP+ runtime, zero AVCs.

### Run this
`./spb-fin` is a 21-check gate covering items 1 and 3. Run it, paste the whole output.
It returns evidence per check, not a verdict.

---

## DO NOT RETEST — ALREADY REFUTED

Each of these was tested and disproved. Re-running them wastes a night.

0. **DN-16 (`/etc` unlabeled, every login fails) and DN-15 (invisible LUKS prompt).**
   Both were the whole point of this runbook on 2026-08-26 and both are settled —
   Christopher has installed and logged into a real machine since. Do not spend a night
   on them again. If a login fails now, it is a NEW defect; report it as one.
1. "SELinux Enforcing deadlocks the boot." **False** — false correlation from a timing
   artefact. It boots to a login prompt under Enforcing.
2. The first-boot password unit causes the hang. Masking it changed nothing.
3. The system asks for the LUKS passphrase twice. It does not.
4. "`/etc` is fully labeled" — a `find`/`ls -Z` survey said 0 unlabeled files.
   **The survey was wrong. The kernel AVC log is the authority, not `ls -Z`.**
5. Fedora 44 removed local graphical installs. False.
6. `/.autorelabel` is the fix. It is not — the ostree root is read-only (bootc #1087).
7. `chcon` in the Containerfile. OCI layers do not carry `security.selinux` xattrs.

---

## TRAPS THAT HAVE ALREADY BITTEN

- **`pkill -f <pattern>` and `ps | grep <pattern>` match your own shell** when the
  pattern appears in your command line. This killed the ssh session twice in one day.
  Kill from a **pidfile** (the scripts do) or match on `comm`.
- **An open forwarded port is NOT a listening service.** QEMU slirp accepts the TCP
  connect whether or not anything is listening. Prove sshd with a **banner grab**.
- **Exit 0 does not prove an artifact exists.** Check the file and its size. A build
  that "succeeded" with a 1 MB disk installed nothing.
- **`/tmp` is a 16 GB tmpfs.** Never copy a repo into it.
- **A VM named `chris` belongs to Christopher. Never kill it.**
- The build log contains `Failed to create directory ... /usr/local/sbin: Read-only
  file system`. **Non-fatal. Do not chase it.**
- Beelink is Christopher's daily driver. Leave RAM and disk tidy; delete VM disks you
  will not return to, but **never** delete a disk or log that evidence was drawn from.

---

## CREDENTIALS

`spplus-test` is a **disposable test-only** LUKS and root passphrase for throwaway VMs.
It may appear in run logs. It must **never** appear in the ISO, the Containerfile, the
repo, or any committed config. SP+ ships **no default account password** at all.

---

## WHEN YOU ARE DONE

Post the full `spb-evidence` output. Add, in plain words:
- which cycle and which ISO sha you tested
- what you ran, in order
- anything that did not behave as this runbook describes

Then stop. Headbrain writes the ledger and decides the next experiment.

---

## THE LOOP IS SIX STEPS NOW — SOFTWARE IS PART OF IT

Booting is not the same as working. An SP+ machine that starts perfectly but has no
Brave, no SP+ runtime and no advisor account is not SP+. **As of 2026-08-26 that is
exactly what the ISO ships (DN-18).**

```bash
cd ~/sp-plus-bee && export CYCLE=cycle8
./spb-hygiene                    # RAM/disk before you start
./spb-packages image             # IS THE SOFTWARE IN THE IMAGE? seconds, no VM needed
./spb-build                      # only if the image gate passes — never build an empty image
./spb-install
./spb-boot
./spb-packages live              # IS IT STILL THERE AFTER INSTALL? separate question.
./spb-evidence
./spb-state                      # update the baton, edit the narrative, commit
./spb-hygiene --apply
```

`spb-packages` reads `~/sp-plus-bee/spb-manifest` — one line per component,
`TYPE|NAME|WHY`, types `rpm`, `path`, `unit`, `user`. **When the product gains a
component, add a line.** The manifest is the definition of "SP+ is complete"; anything
not in it is a component nobody is testing.

It also enforces **DN-13**: the `advisor` account must exist and must be **locked or
passwordless**. If a usable password ships, the gate fails. Do not "fix" that by
removing the check.

Report the `PACKAGES_PASS=` / `PACKAGES_FAIL=` line and every `FAIL` line verbatim.
As always: **evidence, not a verdict.**

---

## EIGHT GATES NOW — SOFTWARE, BRANDING, APPS

```bash
cd ~/sp-plus-bee && export CYCLE=cycle8
./spb-hygiene
./spb-packages image                              # SP+ software present?
./spb-branding image                              # any Fedora logo left?
./spb-branding image localhost/sp-plus-installer  # the INSTALLER has its own Fedora art
./spb-apps     image                              # app suite installed + links cleanly?
./spb-build                                       # ONLY if the three image gates are green
./spb-install
./spb-boot
./spb-packages live
./spb-branding live
./spb-apps     live                               # do they RUN? any coredumps?
./spb-evidence
./spb-state                                       # edit the narrative, commit
./spb-hygiene --apply
```

**Never build past a red image gate.** They answer in seconds; the ISO takes fifteen
minutes.

Manifests you may need to extend — a component with no line is a component nobody tests:
- `~/sp-plus-bee/spb-manifest` — SP+ software (`TYPE|NAME|WHY`)
- `~/sp-plus-bee/spb-appmanifest` — the app suite (`RPM|BINARY|DESKTOP|WHY`)

Branding assets are staged at `projects/sp-plus/branding/` (icon 1024/512, lockup 1080/4k,
dark splash). `spb-branding` enumerates the real surfaces from the rpm database rather
than a guessed path list, and only counts regular files.

Report every `FAIL` line verbatim plus the `PACKAGES_ / BRANDING_ / APPS_` count lines.
**Evidence, not a verdict.**
