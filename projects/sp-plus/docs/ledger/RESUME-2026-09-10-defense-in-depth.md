# SP+ RESUME — defense-in-depth session, 2026-09-10

**Compact-safe document.** The session CONTINUES after compaction. Read this, check §1, then
start at §9 item 1. Do not re-derive, do not recap, do not re-test §6.

## 1. IN FLIGHT RIGHT NOW

**Nothing.** No background jobs, no dispatches, no agents, no running VMs, no builds.
Verified 2026-09-10: `pgrep` clean on CT105 and the Beelink; all three libvirt domains
(`spplus-test`, `fedora-alpha-test`, `SP-Alpha-Rig`) are `shut off`.

Compaction will orphan nothing. This is the cheapest possible moment to compact.

## 2. WHAT WE ARE DOING

Turning YouTux Channel's *Don't Give Me Another "Secure" Linux Distro* — researched into
`beelink:~/fleet/inbox/wiki-secure-linux-distro-defense-in-depth-research.md` — into a real
security architecture for SP+, without breaking the advisor's workday.

Christopher's scope call: **measure and write it down, build nothing yet.** That is done. The
session is now at a decision point, not mid-build.

- Repo: `beelink:~/work/secureprospective-advisor-os`
- Branch: **`session/sp-plus-defense-in-depth`** (created this session off `session/sp-plus-plan`)
- Head: **`5118324`**, tree clean, nothing uncommitted
- SSH: `ssh -i /root/.ssh/beelink chris@192.168.1.190`

## 3. AGENTS + HARNESSES

| Thing | Where |
|---|---|
| Bee dispatch harness | `CT105:/root/run-bee.sh <brief.md> [timeout]`, `THINKING=high` |
| Brief used | `CT105:/root/.claude/briefs/bee-secureblue-control-inventory-20260910.md` (4,234 B) |
| Run output | `CT105:/root/bee-runs/20260910T200927Z_bee-secureblue-control-inventory-20260910/{out,err,verdict}` |
| Deep posture probe | `beelink:~/fleet/bin/sp-plus-deep-posture.sh` — read-only, **not yet in the repo**; candidate for `tests/` |
| Test VM harness | `beelink:~/fleet/bin/spplus-testvm.sh {install,up,down,nuke,info}` |
| LUKS unlock | `beelink:~/fleet/bin/vmunlock` — `DOM=spplus-test vmunlock spplustest` |

**Bee dispatch worked cleanly**: rc=0, 15,513 bytes, fresh session id (not a replay), ACCEPT.

## 4. ARTIFACTS THAT EXIST AND WORK

**alpha4 ISO** — built 2026-09-10 11:33, the previous session started it and never saw it land.

```
beelink:~/work/secureprospective-advisor-os/projects/sp-plus/artifacts/spikeB-rootful/out/
  bootc-sp-plus-1.0-bootc-generic-iso-x86_64/bootc-sp-plus-1.0-bootc-generic-iso-x86_64.iso
bytes  5452943360
sha256 d841d489ed9ce57d928e97678fa8a388215a2a914a5c9f170b0b7aca489dbccd
```

Payload `localhost/sp-plus-kde:alpha4`, image id `68b3c5ba3721`, `BUILD_ID=20260910`.

**Installed alpha4 test VM** — `spplus-test`, disk `/QEMU/images/spplus-test.qcow2` (13 GB used
of 60 GB). **Keep it.** It is the measurement target and Phase S will need it. Bring it up with
`spplus-testvm.sh up spplus-test` then `DOM=spplus-test vmunlock spplustest` (see §6).
SSH: `-p 2222 -i ~/.ssh/spvm test@127.0.0.1`, LUKS `spplustest`, user `test`/`testtest`.

**Committed this session** (commit `5118324`, six files):

| File | What |
|---|---|
| `projects/sp-plus/docs/14-THREAT-MODEL.md` | Assets, adversaries ranked by likelihood, trust anchors, deliberate non-defences, residual risk |
| `projects/sp-plus/docs/15-DEFENSE-IN-DEPTH-ROADMAP.md` | Phase S, Tier 1/2/3, the test-lane gap, suggested order |
| `projects/sp-plus/docs/ledger/POSTURE-2026-09-10-alpha4.md` | Every measurement, plus §0 on what it cannot tell you |
| `projects/sp-plus/docs/ledger/SECUREBLUE-INVENTORY-2026-09-10.md` | Bee's 37 controls, VERIFIED vs CLAIMED |
| `projects/sp-plus/docs/06-OPEN-QUESTIONS-AND-DECISIONS.md` | D13 corrected, D43-D46, Q21-Q22 |
| `projects/sp-plus/README.md` | Planning-set rows 13/14/15 + evidence links |

## 5. THE OPEN FINDING (not a bug being chased — a gap being recorded)

**SP+ signs every image it publishes and no installed machine verifies the signature.**

Measured on alpha4, all four independently:

```
/etc/containers/policy.json  -> {"default":[{"type":"insecureAcceptAnything"}]}
/etc/pki/containers/         -> does not exist
/etc/containers/registries.d -> no ghcr.io entry
Containerfile grep 'policy.json|sigstore|cosign|signedBy|sigstoreSigned' -> 0 matches in 2,921 lines
```

D13 recorded the policy as shipping. Only the signing half was built. This is the 2026-09-01
BlueBuild vector still open: `publish-image.sh` constrains our own publishing and cannot
constrain anyone else who can write `ghcr.io/secureprospective/sp-plus-kde:latest`.

**Caveat on the fix, not on the finding.** The finding is measured and certain. The *fix* has a
real trap: a fail-closed policy that disagrees with the publish lane stops the fleet updating.
Doc 15 §2 records the required order — ship key and policy inside an image that is itself already
correctly signed and installed, prove verification on a test machine, only then depend on it.
A machine that cannot verify the next image stops updating; it does not stop working. That must
be the failure mode that happens.

## 6. HYPOTHESES ALREADY REFUTED — DO NOT RETEST

- **The alpha4 ISO is not a stale v0.10.** Its size, `5452943360`, is byte-identical to the
  v0.10 size recorded in the previous handoff. That is coincidence. sha256 differs
  (`d841d489…` vs v0.10's `5e10d090…`). Do not re-flag the size.
- **The 2026-09-04 embedded-ref mismatch is NOT present.** Verified from the build log: the
  installer's own `DN51_PAYLOAD_REF_OK` gate confirmed the kickstart installs from
  `localhost/sp-plus-kde:alpha4`, image-builder was invoked with that payload ref, and the config
  blob copied into the ISO is `sha256:68b3c5ba3721…`, matching the payload image id.
- **`mokutil` is NOT missing from the image.** It is at `/usr/bin/mokutil`. The probe's fallback
  branch fires because there is no Secure Boot state to read, not because the binary is absent.
  The evidence report's mokutil field is fine.
- **`lockdown=[none]` and `module sig_enforce=N` are NOT product defects.** Both are downstream
  of the test VM having no Secure Boot. Fedora auto-enables lockdown under Secure Boot.
- **`spplus-testvm.sh up` "hanging" is NOT the image failing to boot.** It feeds the LUKS
  passphrase to the *serial* console; SP+ boots `rhgb quiet` with no serial console, so the
  passphrase types into nothing and sshd never starts. `vmunlock` sends keys to the graphical
  console and documents this exact failure in its own header. Always use `vmunlock`.
- **Bee's reasoning on the container-policy row was wrong** (its verdict was right). It called it
  PORTABLE because "SP+ advisors do not use containers". `policy.json` is what **bootc** consults
  to verify the OS image itself. Corrected in the ledger header; do not re-adopt Bee's reason.
- **The existing posture gate is not stale.** It passes 18 of 18 on alpha4. Everything it covers
  is genuinely holding.

## 7. DECISIONS (do not relitigate)

| # | Ruling, Christopher 2026-09-10 |
|---|---|
| D43 | Fedora/KDE bootc is the sole target of security work. Debian parked. Docs 11-13 stay valid as a parked design |
| D44 | **Nothing may break day one.** Breaks printing, printer discovery, Wi-Fi, Brave, PWAs, audio, camera, mic, suspend, external display or Bluetooth → rejected outright |
| D45 | Brave is fixed for this lane. Q1/Q17 stay open on their own clock |
| D46 | Every security control ships with an assertion in `tests/runtime-posture-gate.sh`, mutation-tested red before green |
| D13 | **Corrected**, not new — see §5 |

Also settled this session by Christopher: **write it down, build nothing yet.** That instruction
is complete; §9 is what he has not yet chosen.

## 8. LEDGER STATE

Committed and clean: everything above, commit `5118324` on `session/sp-plus-defense-in-depth`.
**Not committed, deliberately:** `beelink:~/fleet/bin/sp-plus-deep-posture.sh`. It is read-only
measurement tooling and landing it in `tests/` was outside the approved scope. It is a candidate,
not an omission.

Branch is **not** merged and should not be until Christopher says so.

## 9. NEXT ACTIONS, IN ORDER

**Item 1 is a decision, not a task.** Christopher chose to record and stop. He has not chosen
what to build. Ask which, do not assume:

1. **Ask Christopher which he wants to start**, using doc 15 §7's suggested order:
   Phase 0 (Secure Boot test lane) → Phase S (signature hole, alone) → Tier 1 batch →
   T2.2 (Flathub filtering, cheap now and a migration later) → rest of Tier 2 one at a time.
2. If Phase 0: teach `spplus-testvm.sh` to use `OVMF_CODE_4M.secboot.fd` + `OVMF_VARS_4M.ms.fd`
   and an optional vTPM; make `up` call `vmunlock` instead of feeding serial. Gate:
   `mokutil --sb-state` enabled, `/sys/kernel/security/lockdown` at `integrity`, no MOK prompt.
3. If Phase S: doc 15 §2 has the design, the trap, and the gate.

**Carried over from the previous session and untouched by this work:**

4. Run `tests/libreoffice-parity-gate.sh` against alpha4 — it was red with 15 of 68 failing
   against alpha3, and should go to 0. That is the proof the previous session's fixes reached
   the image rather than only the source.
5. Render-check T-28 (`[hidden]` actually hides) and T-30 (exactly one Help entry) on alpha4.
6. Alpha v0.10 is still not downloadable — blocked on an R2 Object Read & Write token only
   Christopher can mint, dropped at `~/.config/fleet/r2.env`. Also unresolved: whether alpha4
   **replaces** v0.10 rather than joining it, since R2's free tier is 10 GB-month and each ISO
   is ~5.1 GiB.

## 10. RELAY / ENVIRONMENT NOTES

- Beelink `sudo` permits **podman only**.
- All SP+ execution and verification runs on the Dell or a VM, **never on the Beelink**, which is
  Christopher's live desktop.
- Subordinate agents may not run git, act on the Beelink, touch another VM, or rebuild anything.
  That is why the posture measurement was done by the head brain and not dispatched to Bee.
- Commands Christopher must run himself go to `chris@192.168.1.190:/home/chris/Downloads/paste.md`.
- Home filing gate passes: `~/.reorg/tools/check-filing.sh` → PASS, 23 visible entries.

## 11. HONEST STATUS

The documents are written, committed and cite measured evidence rather than configuration text.
Four things are genuinely unproven and must not be reported otherwise:

1. **No security control has been built or tested.** Every row in doc 15 is a plan.
2. **Secure Boot, kernel lockdown, module signing and TPM have never been tested by this lane**,
   because the test VM has no Secure Boot firmware. Any claim about them today is unfounded.
3. **The Phase S fix is designed but unbuilt**, and its failure mode — a fleet that stops
   updating — is exactly the kind that shows up late.
4. **alpha4 itself is only partly verified.** The security posture was measured. The LibreOffice
   parity gate, T-28 and T-30 were not.
