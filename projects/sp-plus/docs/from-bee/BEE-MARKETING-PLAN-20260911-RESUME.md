# BEE MARKETING PLAN 20260911 — COMPACT RESUME

Updated: 2026-09-15 on Bee (`com`, 192.168.1.191).

## 1. WHAT WE ARE DOING

Review and refine SP+ batch-01 graphics AD-013 through AD-022 one at a time until Christopher explicitly approves each full-size graphic, then immediately copy the exact approved render to `/home/chris/Pictures/assets/Ads` and verify byte identity. Working run: `/home/chris/fleet/runs/bee-marketing-plan-20260911`; it is **not a git repository**. Project repository used for durable SP+ documentation: `/home/chris/work/secureprospective-advisor-os`, branch `session/sp-plus-defense-in-depth`, remote `origin`.

Host: Bee/Beelink `com`, `192.168.1.191`. Render/test VM: `SP-Alpha-Rig`; use `/home/chris/work/secureprospective-advisor-os/projects/sp-plus/rig/rig`. Direct test-VM SSH endpoint, if required by the harness: `ssh -p 2222 test@127.0.0.1`. Do not render ads on the host and do not start graphical programs on the host.

## 2. AGENTS + HARNESSES

- Bee owns this ad-review pass. ClaudeBox is the fleet coordinator but no escalation is pending.
- No subagent, dispatch, build, or render job is currently running. There are no current `bee-<fid>.{out,err,sentinel}` triples, briefs, session IDs, or transcripts to recover.
- `SP-Alpha-Rig` is running and idle. Render there only through the rig wrapper.
- Run evidence, revision scripts, checks, screenshots, logs, decisions, and handoff live under `/home/chris/fleet/runs/bee-marketing-plan-20260911`.
- Approved deliverables live under `/home/chris/Pictures/assets/Ads`.
- Reaping at compaction removed 47,983,762 bytes of replayable host tar staging plus completed `/tmp/ad013-*`, `/tmp/ad014-*`, `/tmp/ad015-*`, and batch staging inside `SP-Alpha-Rig`. Evidence and the live VM were preserved.
- `/home/chris` filing gate passed. The visible-entry count was 22 against the informational target of 23; all enforced filing checks passed.
- A host `xviewer` process showing the old contact sheet exists, but it belongs to Christopher's live desktop context and was not touched.

## 3. GATES / STATUS

| Gate | Status | Evidence / note |
|---|---|---|
| AD-013 explicit approval | PASS | Christopher approved r06 |
| AD-013 delivery byte match | PASS | SHA256 below; `ad-013/revisions/r06/DELIVERY.md` |
| AD-014 explicit approval | PASS | Christopher approved r08 |
| AD-014 delivery byte match | PASS | SHA256 below; `ad-014/revisions/r08/DELIVERY.md` |
| AD-015 explicit approval | PASS | Christopher said `approve` for r06 |
| AD-015 delivery byte match | PASS | SHA256 below; `ad-015/revisions/r06/DELIVERY.md` |
| AD-016 automated r03 checks | PASS | `ad-016/revisions/r03/checks.json` |
| AD-016 human quality/claim review | FAIL / NOT READY | The unapproved r03 contains the absolute line `cannot be worn down`; revise before showing |
| AD-016 through AD-022 approval | PENDING | All remain unapproved drafts |
| Render provenance | PASS | Existing batch renders report `SP-Alpha-Rig` |
| Display font rule | PASS | IBM Plex Sans Bold; no Primal |
| Publication / scheduling / spend | NOT AUTHORIZED | Graphic approval and file delivery only |

## 4. ARTIFACTS THAT EXIST AND WORK

Approved sources and exact deliveries:

- AD-013 r06 source: `/home/chris/fleet/runs/bee-marketing-plan-20260911/ad-013/revisions/r06/ad-013-r06.png`; 104,014 bytes; SHA256 `ae02aec0a2c549b84aeca0b1e0d087a0a8806700b028bed1ae79b755b73a89dd`.
- AD-013 delivery: `/home/chris/Pictures/assets/Ads/sp-plus-windows-expects-an-administrator.png`; 104,014 bytes; same SHA256.
- AD-014 r08 source: `/home/chris/fleet/runs/bee-marketing-plan-20260911/ad-014/revisions/r08/ad-014-r08.png`; 133,421 bytes; SHA256 `ece8f4667ed1f13def3f042ca019007a5984e1e8ecd709f3a3974ca9a9dd688d`.
- AD-014 delivery: `/home/chris/Pictures/assets/Ads/sp-plus-your-laptop-still-works.png`; 133,421 bytes; same SHA256.
- AD-015 r06 source: `/home/chris/fleet/runs/bee-marketing-plan-20260911/ad-015/revisions/r06/ad-015-r06.png`; 96,909 bytes; SHA256 `1b8d9eb12b8c467547a313ac7328418f55488851e8fd76fbfe6aeebb22c832cf`.
- AD-015 delivery: `/home/chris/Pictures/assets/Ads/sp-plus-own-the-device-own-the-outcome.png`; 96,909 bytes; same SHA256.

Current next draft:

- AD-016 r03 full: `/home/chris/fleet/runs/bee-marketing-plan-20260911/ad-016/revisions/r03/ad-016-r03.png`; 83,541 bytes; SHA256 `48878b9bf4439556270e186647fe503b2ff76d9f7df4580a3f6f6866047cc957`.
- AD-016 r03 phone: `/home/chris/fleet/runs/bee-marketing-plan-20260911/ad-016/revisions/r03/ad-016-r03-phone.png`; 87,335 bytes; SHA256 `c15c4eb4f9d72247cb2217021c38fcf14bddac2a132585019333f3602df2b1f7`.
- Current checkpoint: `/home/chris/fleet/runs/bee-marketing-plan-20260911/HANDOFF.md`.
- Decision ledger: `/home/chris/fleet/runs/bee-marketing-plan-20260911/DECISIONS.md`.
- Playbook: `/home/chris/fleet/runs/bee-marketing-plan-20260911/AD-PLAYBOOK.md`.

## 5. THE CURRENT BUG

There is no runtime or render-harness bug. The next artifact, AD-016 r03, is not ready to show because its closing line reads verbatim:

> A machine underneath it that cannot be worn down.

Leading hypothesis: replacing that absolute durability claim with a concrete, supported property of the immutable/atomic-update design will preserve the cutaway concept while staying inside the claim boundary. Caveat: no replacement copy has been approved, and the full composition still needs an independent phone-readability and identity inspection after the copy change. The absent prominent SP+ lockup at the top may also need correction; verify against the ad outline before changing it.

## 6. HYPOTHESES ALREADY REFUTED — DO NOT RETEST

- **Automated PASS means ready to show:** refuted. Earlier ads passed checks while still containing visible spacing, overlap, clipping, fill, or balance defects. Open both full and phone renders every time.
- **AD-015 could stay as a generic record form:** refuted by Christopher's feedback that it was flat and did not explain why SP+ was better. The approved direction used concrete encryption-policy facts and `OWN THE DEVICE. OWN THE OUTCOME.`
- **`USER SETUP / NONE` was safe copy:** rejected during Bee's own claim review because it implied no setup effort. It was replaced before presentation with `USER CHOICE / NOT OPTIONAL` and `CAN BE SKIPPED / NO`.
- **Approval can be inferred from continued revision work:** refuted by the standing process. Only explicit approval closes an ad.
- **A delivered graphic authorizes marketing action:** refuted. Delivery does not authorize captions, publication, scheduling, outreach, placement, account connection, or spend.
- **Primal can be used as a display font:** settled false for this run. Use IBM Plex Sans Bold and never load or include Primal.

## 7. DECISIONS

- **D-01:** Review one ad at a time and show the full-size render. Nothing is approved without Christopher's explicit approval.
- **D-02:** Render only in `SP-Alpha-Rig`. IBM Plex Sans Bold is the display face. Never load or include Primal.
- **D-03:** Preserve every prior revision by creating a new revision directory; do not overwrite a reviewed revision.
- **D-04:** Immediately copy every explicitly approved full render to `/home/chris/Pictures/assets/Ads`, verify byte-for-byte, and write `DELIVERY.md`.
- **D-05:** The silver SecureProspective logo is the default ad footer identity. Keep the official SP+ mark prominent where appropriate.
- **D-06:** AD-013 r06 is approved and final, including Christopher's supplied wording `Updates do not interupt productivity` and `Not subject to a Microsoft outage.`
- **D-07:** AD-014 r08 is approved and final after matching the blue fill's x-position above and below the receipt.
- **D-08:** AD-015 r06 is approved and final with `OUTCOME CONTROL / 015`, `ENCRYPTION STANDARD`, the policy proof, `OWN THE DEVICE. OWN THE OUTCOME.`, and the lower-right outcome plate.
- **D-09:** Approved graphics are deliverables only. Do not infer permission for any external action.

## 8. LEDGER STATE

- Run root `/home/chris/fleet/runs/bee-marketing-plan-20260911` is not a git repository. Its `HANDOFF.md`, `DECISIONS.md`, logs, revision folders, and delivery receipts are durable filesystem state but cannot be committed there.
- Bee config repo `/home/chris/.pi` is branch `main`, local-only with no remote. It contains unrelated/foreign modified and untracked files. Commit only the two compact-resume copies; do not stage the foreign files.
- SP+ project repo `/home/chris/work/secureprospective-advisor-os` is branch `session/sp-plus-defense-in-depth`, tracking `origin/session/sp-plus-defense-in-depth`. It has pre-existing foreign changes in `projects/sp-plus/installer/interactive-defaults.ks`, `projects/sp-plus/installer/payload-ref.txt`, and `projects/sp-plus/rig/logs/`. Commit and push only this resume file; do not stage those changes.

## 9. NEXT ACTIONS, IN ORDER

1. Read this resume first after compaction and verify that `SP-Alpha-Rig` is still running and no render job is active.
2. Read the AD-016 outline/brief and r03 render script, then replace only the unsupported absolute `cannot be worn down` claim with supported copy in a new `ad-016/revisions/r04/` directory.
3. Decide from the outline whether AD-016 needs the official SP+ lockup at the top; add it only if appropriate, without copying an earlier ad's composition.
4. Render AD-016 r04 only in `SP-Alpha-Rig`.
5. Open and inspect both the 1080x1350 full render and 540x675 phone proof for geometry, spacing, identity, text bounds, clean edges, and readability; run the automated checks.
6. Show only the full-size AD-016 render to Christopher and wait for explicit approval or revision instructions.
7. If approved, update `DECISIONS.md`, create `DELIVERY.md`, copy the exact full render to `/home/chris/Pictures/assets/Ads`, verify bytes, and update `HANDOFF.md`.
8. Continue AD-017 through AD-022 one at a time; never infer approval.

## 10. RELAY / ENVIRONMENT NOTES

- Rig status: `virsh --connect qemu:///session domstate SP-Alpha-Rig`.
- Rig wrapper: `/home/chris/work/secureprospective-advisor-os/projects/sp-plus/rig/rig`.
- VM command pattern: `rig run '<command>'`; transfer with `rig push <host-path> <vm-path>` and `rig pull <vm-path> <host-path>`.
- No commands currently require Christopher to run them, so `/home/chris/Downloads/paste.md` was not created or changed.
- Do not start GUI applications on Bee. Image inspection is through the available file-reading tool.
- No fleet-wide coordination or ClaudeBox escalation is currently required.

## 11. HONEST STATUS

**OBSERVED:** AD-013 r06, AD-014 r08, and AD-015 r06 are explicitly approved, delivered, and byte-verified. AD-016 r03 exists, its automated checks pass, and visual inspection confirms the cutaway composition renders cleanly. No render process or dispatch is running. `SP-Alpha-Rig` is running and idle.

**INFERRED / UNPROVEN:** AD-016's cutaway direction may be viable, but it is not ready to show because the absolute durability sentence is not claim-safe. No replacement copy, r04 render, or human approval exists. Ads AD-016 through AD-022 remain unapproved.

ETA: the next concrete unit is one AD-016 r04 copy correction, VM render, and full/phone inspection before presentation; no time promise is recorded because approval may require further revisions.
