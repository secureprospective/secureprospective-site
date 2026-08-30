# D-02 — Stay on Anaconda for Fedora 45

**Ruling: Christopher, 2026-08-30.** Do not replace Anaconda for F45. Keep it,
retain the guarded patches, upstream the transport-aware network fix now, and
treat a purpose-built installer as post-Beta work.

Source: an external research review, brought back through the Collaboration
Loop. Per doctrine its output is **leads, not findings**; what follows separates
what was verified here from what was not.

## The decisive fact

`bootc install` is a **deployer, not a complete encrypted-workstation
installer.** It neither creates the LUKS2 → LVM → XFS passphrase layout nor
exposes a stable install-progress API. Replacing Anaconda means owning storage,
boot chain, recovery and progress correctness simultaneously — and no candidate
proves all three hard boundaries at once: encrypted storage topology, no-MOK
Secure Boot, and truthful progress.

## Verified against this repository

Checked directly, 2026-08-30:

| Claim | Result |
|---|---|
| Both patches exist and are anchor-guarded | **TRUE.** `patch-anaconda-network.py` aborts with `SPPLUS_NETWORK_PATCH FAILED` unless the anchor matches exactly once |
| Patches run at image build time, so drift fails loudly | **TRUE.** `installer/Containerfile` lines 96-97 |
| Our transport list is what should be upstreamed | **TRUE.** `containers-storage:`, `oci:`, `oci-archive:`, `dir:`, with `registry:` falling through to `True` |
| Progress is weighted by cost, not task count | **TRUE.** DN-28, with reasoning in-comment |
| The installer container is not pinned | **WAS TRUE.** Fixed in this commit; see D-02b below |

**Consequence for upstreaming:** our patch *is* the patch, in the exact shape
recommended. Upstreaming is a docstring, a test matrix and a PR — not new
engineering. That makes recommendation 2 much cheaper than it reads.

## NOT verified — do not treat as fact

Nothing outside this repository was checkable from here, and none of it should
drive a decision until checked against source:

- F45 dates (Beta 15 Sep, final 20 Oct, freeze 25 Aug).
- Anaconda at 45.22 with `network_required` still `return True`.
- All cited PR/issue numbers.
- Bluefin/Dakota internals — **especially the ~9 GB layer and `/var/tmp` at 80%
  of RAM**, since that single claim is what rules fisherman out against our 8 GB
  floor. If we ever reconsider fisherman, verify that first.

The review is candid that it found no upstream issue for the local-transport
case and that this does not prove none exists privately.

## Accepted actions

1. Keep the GTK path. Do not let an untested Web UI migration ride along with
   the F45 base change; Web UI is a separate release gate if we take it at all.
2. Upstream the transport-aware network patch with local-transport tests.
3. Pin the installer container by digest and keep asserting patch anchors — done,
   D-02b.
4. Post-F45: a non-shipping `to-filesystem` proof of concept, exactly one
   layout (UEFI ESP + /boot + LUKS2 + LVM + XFS). Not a Calamares/Readymade
   migration.
5. Run the F45 gate before Beta: `-nic none` install; physical Dell with no
   link; **Secure Boot enabled with no MOK on physical UEFI hardware — never
   inferred from a QEMU boot with Secure Boot off**; LUKS2 unlock at first boot;
   `bootc upgrade --check` after restoring network; timestamped progress capture
   showing UI activity at least every two seconds; ISO rebuilt from container CI.

## Open, deliberately not settled here

The review's progress argument is **a criticism of shipped SP+ behaviour, not
just of upstream.** It reads as vindication of DN-28 and is not. See
`OPEN-progress-honesty.md`.

## Also worth carrying

Changing installers would not have fixed the Dell's missing Wi-Fi firmware. The
installer must not require a connection, but the installed image still needs the
firmware payload, and that is a separate hardware test.
