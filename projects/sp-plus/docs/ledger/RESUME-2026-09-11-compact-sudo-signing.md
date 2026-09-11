# SP+ RESUME — sudo confirmation, signing enforcement, 2026-09-11 (post Bee panel)

## 1. WHAT WE ARE DOING

Three work items agreed after Christopher asked whether doc 16's closing admissions
could be improved: (1) put a confirmation in front of privileged action, (2) sign the
fleet tag and switch on signature enforcement, (3) rewrite the compartmentalization
claim. **Item 3 is DONE and committed. Items 1 and 2 are the live work.**

- Repo: `beelink:~/work/secureprospective-advisor-os`, branch `session/sp-plus-defense-in-depth`
- Head: **`3f7167f`**. **Tree clean.**
- Beelink: `ssh -i /root/.ssh/beelink chris@192.168.1.190`
- Plan file (approved): `/root/.claude/plans/this-is-a-planning-hazy-rainbow.md`
  **Its work-item-1 mechanism is now REFUTED. See §6.1. Do not implement it as written.**

## 2. NOTHING IS IN FLIGHT

No builds, no dispatches, no agents, no background jobs. Filing gate PASS at 23 entries.
292 G on `/`, 127 G on `/home`.

**`fedora-dnd-test` is CHRISTOPHER'S OWN VM and is RUNNING. Do not touch it, do not shut
it down, do not count its 8 CPUs and 8 G as reclaimable.** The SP+ domains are
`spplus-test`, `fedora-alpha-test` and `SP-Alpha-Rig`, all shut off; those are the only
ones this work may act on.

## 3. THE INPUTS THAT EXIST

```
beelink:~/Downloads/SPPLUS-SUDO-PANEL-BRIEF.md          10,816 bytes, 194 lines
  The brief I wrote and Christopher took to the panel. Self-contained.

beelink:~/fleet/inbox/bee-spplus-sudo-panel-findings-2026-09-11.md
  49,553 bytes, 657 lines. Bee's two-pass source review. THE key document.
  Read it before touching item 1. Synthesis is in §6 below but the report has
  the source citations and the confidence register.
```

## 4. STATUS

| Item | State |
|---|---|
| 3 Compartmentalization claim | **DONE**, committed `3f7167f` |
| 1 Privilege confirmation | **Design refuted, needs redesign.** Direction chosen but not built |
| 2 Publish + sign + enforce | **Approved to proceed. Nothing done yet.** Needs Christopher's go on the publish |

## 5. VERIFIED FACTS — do not re-derive

- **SP+ ships sudo 1.9.17p2**, the exact version Bee inspected. Its findings apply
  directly, not by analogy. Built `--with-pam --enable-python`.
- **`bootc` is 1.16.10** and DOES have `--enforce-container-sigpolicy` on both
  `switch` and `install to-filesystem`.
- **`/etc/pam.d/sudo`** is stock: `auth include system-auth`, nothing custom.
- **Registry state**, `ghcr.io/secureprospective/sp-plus-kde`:
  - `:latest` = `sha256:ca2fad9e46420e4754a5fb00e895d5d6272526c69e2d2e0b83afbb5ec5ecf46b`,
    build label `20260902`, created **2026-09-02**. Predates all defense-in-depth work.
  - Tags present: `latest`, `20260902`, `20260902b`, `testlane`,
    `sha256-89c2347a…`, `sha256-ca2fad9e…`
  - Those two `sha256-` tags are **cosign v3 bundles**
    (`application/vnd.dev.sigstore.bundle.v0.3+json`), with **no `.sig` suffix**.
    containers/image cannot read them. **No published image has EVER carried a
    fleet-readable signature.**
- **Reader side is complete and correct** on a booted machine: `policy.json` default
  `reject` + `sigstoreSigned` for the SP+ repo, `/etc/pki/containers/sp-plus-cosign.pub`
  present, and `/etc/containers/registries.d/ghcr-secureprospective.yaml` with
  `use-sigstore-attachments: true`.
- **Publishing host prerequisites are in place**: `/etc/containers/registries.d/sp-plus-ghcr.yaml`
  has attachments enabled, key at `~/.config/sp-plus-signing/`.
- **`scripts/publish-image.sh` is already correct.** It signs with skopeo in the readable
  format and verifies with `podman pull --signature-policy`, a check that can fail. It has
  simply never been run since the fix.
- **The enforcement injection points**, both found:
  - `installer/bootc-wrapper.sh` already rewrites the `install to-filesystem` argv to add
    `--skip-finalize`. One more flag goes there.
  - `installer/interactive-defaults.ks:67` sets the update origin:
    `bootc --source-imgref containers-storage:localhost/sp-plus-kde:t29 --target-imgref ghcr.io/secureprospective/sp-plus-kde:latest`
- **The downgrade guard is real**: `spplus-update-control` compares TIMESTAMPS and refuses
  anything not genuinely newer. A t29 machine pointed at an older `:latest` will not roll back.
- **The Dell is verified.** Christopher confirmed 2026-09-11 it mirrors the dnd VM in every
  way that matters. **The hardware gate that blocked publishing is PASSED.**

## 6. HYPOTHESES REFUTED — DO NOT RETEST

### 6.1 The PAM design is DEAD. This was the approved plan's mechanism.
In sudo 1.9.17p2 a matching `NOPASSWD` tag sets `def_authenticate = false`, and
`check_user()` skips the branch containing `pam_authenticate()`. **A helper in sudo's
`auth` stack never runs for the invocations we care about.** Verified version match.
Moving into PAM `account` processing is a *different* proposal, not a rescue of this one.

### 6.2 "A click proves physical presence" is NOT defensible.
Bee found five source-level routes, all H-confidence upstream, all C for SP+ specifically:
1. **KWin fake_input.** Authorization is declared via `X-KDE-Wayland-Interfaces` desktop
   metadata resolved through KApplicationTrader, and `~/.local/share/applications` is a
   normal lookup location, so an unconfined user process can declare its own. The handler
   then contains a literal `// TODO: make secure` above `device->setAuthenticated(true)`.
2. **Portal preauthorization.** A session-bus caller can write a `remote-desktop`
   permission-store entry; KDE's `isAppMegaAuthorized()` then skips the dialog.
3. **XWayland XTEST translated through libei** reaches native Wayland clients.
   `XwaylandEisNoPrompt` upstream default is **false** — do not claim otherwise.
4. **Direct KWin EIS D-Bus**, `/org/kde/KWin/EIS/RemoteDesktop`, no in-handler auth check.
5. **AT-SPI `DoAction`** invokes `animateClick()` on an enabled standard Qt button.

### 6.3 Claims in our own docs that Bee showed are overstated.
- **"Every change lands in a new deployment" is FALSE.** `/etc` is mutable, `/var` is shared
  across deployments. `bootc rollback` reorders deployments; it does not merge `/etc` edits
  back and it restores no data. It is not a backup and not a general state restore.
- **Locking does not close an unlocked LUKS mapping.** LUKS protects data at rest. It is not
  a boundary against live same-user malware.
- **"Any same-UID process can run host sudo" is overbroad.** Say "unconfined host process".
  Sandboxing, `no_new_privs` and MAC policy make same-UID processes materially different.
These appear in `config/sudoers-sp-plus` and in doc 16 and must be corrected.

### 6.4 Earlier in this session, also refuted
- The registries.d lookaside is **NOT** missing from the image. My first `cat *.yaml | head -12`
  was truncated before reaching `ghcr-secureprospective.yaml`. It is present and correct.
- `fedora-dnd-test` showing `ostree-unverified-registry:` is **NOT a defect**. It is the
  documented Phase S bootstrap order in `images/kde/Containerfile`: a machine can only begin
  enforcing after booting an image that carries the policy, and that image must arrive by the
  unverified path.
- sshd in the guest is `disabled`/`inactive`. That is why password login over the port
  forward reset. Not a defect. Reach that VM through the graphical console.
- The guest network is QEMU user-mode NAT, so `10.0.2.15` is unreachable except from inside.
  A live `hostfwd_add` via `virsh qemu-monitor-command ... --hmp` works and is removable.

## 7. THE REFRAME — my synthesis, not in Bee's report. Expensive to lose.

Bee is right that confirmation is not a boundary against malware running as the advisor.
But malware with that UID can already read and exfiltrate every client document **without
touching sudo at all**, so anti-malware was never the strongest justification for it.

**The threat confirmation genuinely addresses is Bee's point K: prompt injection.** Fin reads
attacker-controlled logs, filenames, documents and web pages, and can be induced into a
harmful repair. A confirmation the advisor sees, describing the actual operation, is a real
check on that, because there the adversary is *content*, not code execution, and content
cannot synthesise a click.

**That changes where the control belongs.** If the threat is Fin being *manipulated* rather
than Fin being *replaced*, the gate belongs at Fin's tool boundary where
`config/fin-extensions/spplus-guardrails.ts` already sits — not in sudo, not in PAM, not in a
sudo approval plugin. That siting avoids every failure mode Bee flagged: no system-wide sudo
change, no `open() == 0` self-disabling trap, no availability risk on a machine with no
support desk, and no claim we cannot defend.

Bee's explicit decision request was: **Direction 1** (consent / cost-raising, documented
honestly) or **Direction 2** (engineer a real trusted-approval subsystem). Recommend
Direction 1, sited at Fin's tool path, with Direction 2 recorded as the target and a trigger.

## 8. DECISIONS

- **Sudo approach = presence confirmation**, chosen by Christopher over deny-list,
  docs-only, and moving Fin to its own account. **The mechanism is now refuted; the
  intent survives.** Redesign per §7, do not abandon.
- **Panel gate applied.** Christopher took the brief out himself and returned Bee's findings.
- **Out of scope by his instruction**: Flatpak permission lockdown, Brave to Flatpak
  (both deferred to a future paid custom-setup offering), and moving the build to CI.
- **D44 still governs**: nothing may break day one.

## 9. LEDGER STATE

```
3f7167f docs(sp-plus): the compartmentalization claim was too absolute   <- this session
1bfb95a ledger(sp-plus): fedora-dnd-test is Christopher's, hands off
6145dff ledger(sp-plus): compact-safe resume at t29, both deliverables shipped
23105ab docs(sp-plus): security architecture and evidence report, doc 16
```
Nothing written but uncommitted. Tree clean.

## 10. NEXT ACTIONS, IN ORDER

Christopher's instruction at compact: **"we will target publish and sign, and the redesign
direction after compact."**

1. **Get his explicit go for the publish.** It is fleet-wide and outward-facing. The Dell
   gate has passed, so the recommendation is to publish the defense-in-depth image as the
   new `:latest` and sign THAT, rather than signing the stale 2026-09-02 build.
2. **Publish via `scripts/publish-image.sh` only.** Never by hand. Note the t29 image was
   built ROOTFUL, so it lives in root's podman storage, not chris's. Beelink sudo permits
   `podman` ONLY, which is enough to push it.
3. **Verify the signature the way a machine reads it**: `podman pull --signature-policy`
   with the shipped policy and shipped pubkey. **Mutation-test it red** against an unsigned
   digest first. If the mutation does not fail, stop and report.
4. **Confirm `sha256-<digest>.sig` appears** in `skopeo list-tags`. Its absence is the
   whole finding.
5. **Then enforcement**: add `--enforce-container-sigpolicy` in `installer/bootc-wrapper.sh`,
   prove both directions on a disposable SP+ VM, add a posture-gate assertion mutation-tested
   red. **Never before step 3 passes** or machines stop updating.
6. **Redesign item 1 per §7.** Site it at Fin's tool path. Run Bee's harmless fake-input test
   against a mock dialog with nothing privileged attached, purely so the docs can say we
   tested it and that is why we do not claim presence.
7. **Correct the §6.3 overstatements** in `config/sudoers-sp-plus` and doc 16.

## 11. RELAY / ENVIRONMENT NOTES

- Commands Christopher runs go in `/root/paste.md` then
  `scp -i /root/.ssh/beelink /root/paste.md chris@192.168.1.190:/home/chris/Downloads/paste.md`.
  **Never put a destructive command with a literal placeholder in a relay batch** — that is
  what caused the `/dev/sdX` RAM incident.
- **Beelink sudo permits `podman` ONLY.** Anything else needs Christopher.
- Commit messages: write to a file and `git commit -F`. Inline heredocs through ssh break on
  apostrophes.
- Patch scripts: scp a file and run it. Never nest heredocs through ssh — two hops, zero work,
  exit 0. Every patch should assert its target was found.
- To inspect the dnd VM: `virsh -c qemu:///session qemu-monitor-command fedora-dnd-test --hmp
  "screendump /tmp/x.ppm"` is read-only and safe. Keystrokes via a sendkey helper work but
  type into his live desktop, so confirm between steps with a screendump.

## 12. KNOWN DIRT

- **`artifacts/t28-iso/` (5.2 G) still cannot be reaped.** Root-owned by the rootful podman
  build; Beelink sudo is podman-only. Needs one `sudo rm -rf` from Christopher. Not urgent.
- **Helper files left in `/tmp` on the Beelink**: `dndkey.py`, `dndcon.py`, `dndssh.sh`,
  `dndshot.sh`, `dnd.ppm`, `dnd.png`, `patch-doc16.py`, `cm.txt`. My cleanup command was
  denied by the permission classifier. They are in `/tmp` and clear on reboot.
- **Doc 14 (threat model) is still stale** in four places; doc 16 §3 names the discrepancy.

## 13. HONEST STATUS

Item 3 is genuinely done. Item 2 is fully investigated with every mechanism verified rather
than assumed, and needs only Christopher's go plus careful execution in the stated order.

Item 1 is back at the design stage. The approved plan's mechanism was refuted by source
review, and the honest position is that we cannot build what was described and should not
make the claim it was going to make. The reframe in §7 is my own reasoning and has **not**
been reviewed by anyone. Treat it as a proposal, not a finding, and put it back to Bee or to
Christopher before building on it.

Nothing about item 1 has been written to the repo. No sudo behaviour has changed.
