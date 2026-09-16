# BEE MARKETING PLAN 20260911 — COMPACT RESUME

Updated: 2026-09-15 on Bee (`com`, 192.168.1.191).

## 1. WHAT WE ARE DOING

The AD-013 through AD-022 review pass is complete. Christopher explicitly approved six SP+ graphics, which were copied byte-for-byte to `/home/chris/Pictures/assets/Ads`; four off-task graphics were explicitly rejected, retained only as negative controls, and not delivered. Working run: `/home/chris/fleet/runs/bee-marketing-plan-20260911` (not a git repository). Durable SP+ docs repo: `/home/chris/work/secureprospective-advisor-os`, branch `session/sp-plus-defense-in-depth`, remote `origin`.

Host: Bee/Beelink `com`, `192.168.1.191`. Render/test VM: `SP-Alpha-Rig`; use `/home/chris/work/secureprospective-advisor-os/projects/sp-plus/rig/rig`. Direct test-VM endpoint if required: `ssh -p 2222 test@127.0.0.1`. Never render ads on the host and never start graphical programs on the host.

## 2. AGENTS + HARNESSES

- Bee owns this completed review pass. No ClaudeBox escalation is pending.
- No subagent, dispatch, build, or render job is running. There are no live `bee-<fid>` artifacts or transcripts to recover.
- `SP-Alpha-Rig` is running and idle. All ad renders were produced there through the rig wrapper.
- Run evidence, scripts, renders, checks, logs, decisions, rejection studies, and handoff: `/home/chris/fleet/runs/bee-marketing-plan-20260911`.
- Approved graphics: `/home/chris/Pictures/assets/Ads`.
- Reaping removed 11,136,717 bytes of replayable host staging and completed ad staging inside `SP-Alpha-Rig`. Evidence and the live VM were preserved.
- `/home/chris` filing gate passed. Visible-entry count was 22 against the informational target of 23; all enforced checks passed.

## 3. GATES / STATUS

| Gate | Status | Evidence |
|---|---|---|
| AD-013 r06 approval + delivery | PASS | `ad-013/revisions/r06/DELIVERY.md` |
| AD-014 r08 approval + delivery | PASS | `ad-014/revisions/r08/DELIVERY.md` |
| AD-015 r06 approval + delivery | PASS | `ad-015/revisions/r06/DELIVERY.md` |
| AD-016 r06 approval + delivery | PASS | `ad-016/revisions/r06/DELIVERY.md` |
| AD-017 r06 approval + delivery | PASS | `ad-017/revisions/r06/DELIVERY.md` |
| AD-021 r06 approval + delivery | PASS | `ad-021/revisions/r06/DELIVERY.md` |
| AD-018 | REJECTED | r04 preserved; no delivery |
| AD-019 | REJECTED | r03 preserved; no delivery |
| AD-020 | REJECTED | r03 preserved; no delivery |
| AD-022 | REJECTED / JUNKED | r03 preserved only as AI-slop negative control; no replacement |
| Render provenance | PASS | Approved revisions report `SP-Alpha-Rig` |
| Display font | PASS | IBM Plex Sans Bold; no Primal |
| Publication / scheduling / spend | NOT AUTHORIZED | Graphic approval and local delivery only |

## 4. ARTIFACTS THAT EXIST AND WORK

Approved and delivered full-size PNGs (source revisions have identical bytes):

- AD-013 r06: `/home/chris/Pictures/assets/Ads/sp-plus-windows-expects-an-administrator.png`; 104,014 bytes; SHA256 `ae02aec0a2c549b84aeca0b1e0d087a0a8806700b028bed1ae79b755b73a89dd`.
- AD-014 r08: `/home/chris/Pictures/assets/Ads/sp-plus-your-laptop-still-works.png`; 133,421 bytes; SHA256 `ece8f4667ed1f13def3f042ca019007a5984e1e8ecd709f3a3974ca9a9dd688d`.
- AD-015 r06: `/home/chris/Pictures/assets/Ads/sp-plus-own-the-device-own-the-outcome.png`; 96,909 bytes; SHA256 `1b8d9eb12b8c467547a313ac7328418f55488851e8fd76fbfe6aeebb22c832cf`.
- AD-016 r06: `/home/chris/Pictures/assets/Ads/sp-plus-everything-underneath-is-different.png`; 108,960 bytes; SHA256 `900aa0dcb5c6d7e4452c62d90e61ce0c0f026dbfb4f935fd97ca8ac074ffba97`.
- AD-017 r06: `/home/chris/Pictures/assets/Ads/sp-plus-fewer-prompts-fewer-decisions.png`; 156,843 bytes; SHA256 `91b5f508ab8cd81038f4e62fbdc19814db6c2b8da09eca81d62596ad2b66afb0`.
- AD-021 r06: `/home/chris/Pictures/assets/Ads/sp-plus-client-documents-direct-to-portal.png`; 107,284 bytes; SHA256 `902b8b9514e43dd30428c16414b05a38fdb02e4699b41b3d9ef97155bf9eded8`.

Rejected negative controls:

- AD-018 r04: `ad-018/revisions/r04/ad-018-r04.png`; 80,461 bytes; SHA256 `7d4cd28a9f3660599102dd7482636f7f64e40e044513f00415c061e2c70a730e`; log `logs/AD-018-R04-REJECTED.md`.
- AD-019 r03: `ad-019/revisions/r03/ad-019-r03.png`; 72,655 bytes; SHA256 `94c4f32a729a35e5481001e7fa9111ad1738130d8011144a5f2bdb9995e14059`; log `logs/AD-019-R03-REJECTED.md`.
- AD-020 r03: `ad-020/revisions/r03/ad-020-r03.png`; 59,220 bytes; SHA256 `e30838484f6d47c0eafe8c784b5b23809e5234262c22fe2b85dd05e3747d5773`; log `logs/AD-020-R03-REJECTED.md`.
- AD-022 r03: `ad-022/revisions/r03/ad-022-r03.png`; 77,685 bytes; SHA256 `2ab9ed21fef9b610827b302a35e4484578ed357759790b14856aca803f997e84`; log `logs/AD-022-R03-REJECTED.md`.

Other critical paths:

- Current checkpoint: `/home/chris/fleet/runs/bee-marketing-plan-20260911/HANDOFF.md`.
- Decision ledger: `/home/chris/fleet/runs/bee-marketing-plan-20260911/DECISIONS.md`.
- Standing playbook: `/home/chris/fleet/runs/bee-marketing-plan-20260911/AD-PLAYBOOK.md`.
- AD-021 official Nextcloud source: `https://nextcloud.com/c/uploads/2022/08/nextcloud-logo-icon.svg`; source SHA256 `93b3a07c256999ecd0d0d8c9e7370f79a7be07a3264442ec05db80278ae01688`; recorded in `logs/AD-021-R06.md`.

## 5. THE CURRENT BUG

There is no active rendering or artifact bug. The completed batch exposed a planning bug: AD-018 through AD-022 were originally scoped as IMO/service concepts inside a review Christopher expected to remain SP+. His verbatim AD-022 ruling was:

> 022 is garbage, not on task.. this needs to be SP+, not approved

Leading hypothesis: future batches must declare the product/campaign boundary before outlines are generated, and every ad must pass an ICP/job check before visual work. Caveat: this is a workflow conclusion from this batch, not permission to revise the global planning system or revive rejected ads without Christopher's instruction.

## 6. HYPOTHESES ALREADY REFUTED — DO NOT RETEST

- **Automated PASS means creative readiness:** refuted repeatedly. Geometry, copy fit, assignment, ICP relevance, and visual logic still failed after checks passed.
- **Literal compliance with nouns in a brief solves the ad:** refuted by AD-018 r04. Six top tabs and a polished dossier still became `Corporate Clipboard Lasagna` because it made the reader perform paperwork instead of showing a compelling specialty.
- **A generic process diagram is relevant to the ICP:** refuted by AD-019 and AD-020. Timeline and balance furniture conveyed no immediate producer value.
- **IMO practice tools can sit inside an SP+ batch:** refuted by AD-022. It was junked, not replaced.
- **Clean uniform rows feel professional:** refuted by early AD-017. They read as AI-made until handled-paper details and physical imperfection were added.
- **Image-canvas centering equals optical centering:** refuted. Transparent padding in marks produced visibly off-center logos; center the visible alpha bounds.
- **Separate rectangular shadows are acceptable on 3D objects:** refuted. Build one coherent solid silhouette from a single upper-left light source.
- **Small text that remains technically in bounds is acceptable:** refuted. Safe margins and phone readability are required.
- **A chaotic route must be confusing:** refuted by AD-021 r05/r06. Numbered stations and explicit arrows allowed a visibly messy chain to remain traceable.
- **Approval can be inferred from praise or continued revisions:** refuted. Only explicit approval closes an ad.
- **Delivery authorizes publication or spend:** false. Delivery is only a local file copy.
- **Primal may be used:** false for this run. Use IBM Plex Sans Bold and never include or load Primal.

## 7. DECISIONS

- **D-01:** Review one ad at a time. Nothing is approved without Christopher's explicit approval.
- **D-02:** Render only in `SP-Alpha-Rig`; IBM Plex Sans Bold is the display face; never load Primal.
- **D-03:** Preserve prior revisions and rejected work. Never overwrite reviewed artifacts.
- **D-04:** Immediately copy every approved full render to `/home/chris/Pictures/assets/Ads`, verify byte identity, and write `DELIVERY.md`.
- **D-05:** The silver SecureProspective logo must remain readable, normally on a dark footer. Official SP+ marks must be prominent where appropriate.
- **D-06:** Future ads should meet the AD-016/017 Overdrive quality level: ambitious, dimensional, human, logically immediate, and fully finished without copying those layouts.
- **D-07:** Approval basics include optical mark centering, coherent light/shadow direction, safe text widths, phone readability, clean edges, and no clipping.
- **D-08:** AD-013 r06, AD-014 r08, AD-015 r06, AD-016 r06, AD-017 r06, and AD-021 r06 are approved final graphics.
- **D-09:** AD-018, AD-019, AD-020, and AD-022 are rejected negative controls. Do not revive them without explicit instruction.
- **D-10:** AD-022 receives no replacement in this batch. Christopher's final ruling: `junk it, studied as garbage, off task, Ai slop`.
- **D-11:** Approved graphics do not authorize captions, publication, scheduling, outreach, placement, account connection, or spend.

## 8. LEDGER STATE

- Run root `/home/chris/fleet/runs/bee-marketing-plan-20260911` is not a git repository. Its handoff, decision ledger, logs, revisions, and receipts are durable filesystem state but cannot be committed there.
- Bee config repo `/home/chris/.pi` is branch `main`, local-only. It contains pre-existing unrelated modified and untracked files. Commit only the two updated resume copies.
- SP+ project repo `/home/chris/work/secureprospective-advisor-os` is branch `session/sp-plus-defense-in-depth`, tracking `origin/session/sp-plus-defense-in-depth`. It contains pre-existing foreign installer changes and untracked rig logs. Commit and push only the resume document.

## 9. NEXT ACTIONS, IN ORDER

1. Read this resume first after compaction.
2. Verify `SP-Alpha-Rig` remains running and no render job is active.
3. Wait for Christopher's next assignment; the AD-013 through AD-022 pass is complete.
4. If a new ad batch is requested, establish the exact product/campaign boundary and ICP job before outlining or rendering.
5. Use the approved AD-016/017/021 work as quality evidence, not as layout templates.
6. Consult the rejected logs before accepting generic dossiers, timelines, balance diagrams, or feature-card walls.
7. Never revive AD-018, AD-019, AD-020, or AD-022 without explicit instruction.

## 10. RELAY / ENVIRONMENT NOTES

- Rig status: `virsh --connect qemu:///session domstate SP-Alpha-Rig`.
- Rig wrapper: `/home/chris/work/secureprospective-advisor-os/projects/sp-plus/rig/rig`.
- Transfer pattern: `rig push <host-path> <vm-path>` and `rig pull <vm-path> <host-path>`; execute with `rig run '<command>'`.
- No commands currently require Christopher to run them; `/home/chris/Downloads/paste.md` was not changed.
- Do not start GUI applications on Bee. Inspect images through the file-reading tool.
- No fleet-wide coordination or ClaudeBox escalation is pending.

## 11. HONEST STATUS

**OBSERVED:** Six graphics are explicitly approved, locally delivered, and byte-verified. Four graphics are explicitly rejected and preserved without delivery. AD-022 was junked with no replacement. No render process, build, dispatch, or subagent is running. `SP-Alpha-Rig` is running and idle.

**INFERRED / UNPROVEN:** The six delivered graphics have not been published or tested for marketing performance. Their approval proves Christopher accepted the graphics, not that they will perform. No next campaign or ad assignment has been selected.

ETA: none. This review pass is complete; the next action depends on Christopher's next assignment.
