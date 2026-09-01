# Help corpus report

The source manual contains **37 ledger articles** and **122,793 Markdown characters**, including whitespace and line endings. All 37 article rows are `VERIFIED`. This reports the evidence and remaining limits; it is not a claim that every SP+ workflow or the in-app delivery is complete.

## Final source-corpus checks

- Every ledger file exists and is non-empty.
- Each article is 2,000 to 3,500 characters, has four to seven `##` sections, and has no em dash.
- The audit checked 196 internal Markdown links under `knowledge/`; none point to a missing file.
- `grep -rIlP '\xe2\x80\x94' knowledge/ welcome/app/` returned no files.
- `git diff --check` passed before this report was written.
- `welcome/app/help-data.json` is valid JSON, but validity does not mean it matches the source corpus.

## What was checked

Claims were checked against the running SP+ test VM where possible, the local `localhost/sp-plus-kde:spike` image, and the repository configuration when a running interaction was not available. The ledger records the per-article evidence and limits.

There is material image-versus-VM drift. The local `spike` image predates DN-46 and DN-47: it has the old disabled-only system-update path. The current test VM has the newer daily staging timer, session notifier, staged-update finalization at normal shutdown or restart, and a prior deployment. Update statements in S1, P7, and U1 were re-verified against that newer VM and corrected in commits `7886394`, `bf9c767`, and `255372d`.

## Compiled in-app data is still stale

The source corpus cannot yet be treated as the exact in-app corpus.

- The compiled JSON has 34 records, while the ledger has 37 current article paths.
- It is missing current-path records for Y4, Y5, U1, U2, U3, H1, H2, and H3.
- It retains five records with obsolete `help-corpus/...` source paths for P6, U1, H1, H2, and H3.
- Its S1 and P7 Markdown differs from the corrected source files.
- No generator, category change, JSON regeneration, or app-load test was performed. G1, G2, and G3 remain deferred by the shared-checkout steering instruction.

## Product behavior that changed or differed from older copy

- System updates now stage daily and finish at a normal shutdown or restart. The stock forced-restart timer remains disabled. The prior source-manual claim that automatic system updates were off became false after DN-46 and DN-47.
- The current VM has a prior system deployment and an active local desktop session is authorized for the underlying rollback action. A visible advisor rollback flow, rollback boot, return to the newer version, and file-preservation behavior were not tested.
- Fin is a cloud-connected Pi agent with administrative capability and `--approve`, not a limited local form with a guaranteed per-change approval boundary. The source does not prove a content-redaction filter, complete change history, or safe handling of client material.
- LUKS encryption was observed in the VM, but no SP+ recovery-key, TPM enrollment, PIN, replacement-key, or real-hardware recovery workflow was found or tested.
- Automatic screen locking is disabled in the inspected configuration. Manual Meta+L locking exists, but locking, unlocking, lid behavior, and notification privacy were not interactively tested.
- No inspected SP+ feature provides remote locate, lock, wipe, support-session request, approved remote access, or an evidence-report export. The local machine record is a survey record, not a verified compliance report or PDF export.
- File Portal and Social capabilities are present in the newer image but not in the older running VM that was inspected. Their provider/account actions were not tested.
- The printer fixture is not evidence of an office printer. Physical Wi-Fi, printer, scanner, audio, camera, display, Bluetooth, USB, projector, dock, and call workflows remain untested.

## Claims deliberately left unpromised

The manual does not claim that a real provider login or request works for Fin, email, File Portal, Social, Zoom, a password manager, or a backup service. It does not claim a particular cloud-retention policy, outbound-content filter, universal transmission history, or support-session record.

It does not promise a guest account, tested multi-user isolation, physical-device pairing, an app-install GUI workflow, a theme-change result, a live e-signature, a real app update, a visible update notice on advisor hardware, or a tested migration or backup restore. It also does not promise that an earlier system deployment will exist on every computer or that rollback restores documents.

The individual ledger evidence cells list the narrower untested facts for each article, including hardware, GUI, account, provider, and recovery limits.

## Deferred work

G1 through G3 are intentionally not started. They require files owned by the other agent: the help-data generator, Welcome category wiring, and generated `welcome/app/help-data.json`. The next owner should regenerate from the 37 current source articles, reconcile the five obsolete source paths and eight missing records, then test the Welcome help screen at the required display sizes.

## Resolution of the deferred work, 2026-09-01

G1 through G3 are now done, in the driving session rather than the manual lane.

- The generator is `scripts/build-help-data.py`. It joins the ledger to the
  articles so the in-app help is the manual rather than a second, drifting copy.
- Its merge previously carried old records forward by TITLE, which is why three
  articles survived as duplicates when the manual moved out of `help-corpus/`
  and into `knowledge/` and their headings were reworded at the same time: the
  app shipped both copies of the recovery-key, evidence-report and assistant
  articles, so an advisor searching "recovery key" got two hits, one stale. The
  merge now compares the source path, which follows a moved file whatever its
  heading says.
- `welcome/app/help-data.json` is regenerated: **37 articles, 7 categories,
  122,756 Markdown characters.** The 37-character difference from the source
  figure is one trailing newline per file, stripped on ingest.
- No record points at `help-corpus/` any more, every record's text matches its
  source file byte for byte, and there are no duplicate titles or ids.
- The 7 generator categories and Welcome's hard-coded blurb map are identical.
  The "6 hardcoded categories" in the earlier note was already stale.

Tested rather than assumed, on the SP+ test VM and not on a developer machine:

- `tests/welcome-help-corpus-gate.sh` walked every category and opened every
  article: **37 articles opened, PASS.** No empty category, no blank reader.
- `tests/welcome-help-search-gate.sh` **PASS**, including the misspellings an
  anxious advisor actually types: `printr wont wrk`, `recovry key`, `passwrd`,
  and a nonsense query that correctly finds nothing and offers Fin instead.

Two gates were added so this cannot rot. `config-preflight.sh` P-15e regenerates
into a scratch copy and requires the committed JSON to match byte for byte, so a
hand-edit or an un-re-run generator fails before a build; it also checks every
record against its source file and every category against Welcome's blurb map.
The image-side `WELCOME_HELP_OK` gate now asserts 37 articles rather than a floor
of 17, no retired source paths, no duplicate titles or ids, and a blurb present
for every category. Both were mutation-tested and each failed on its own line.
