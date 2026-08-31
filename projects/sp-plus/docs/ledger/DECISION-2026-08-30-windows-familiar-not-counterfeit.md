# DN-45 — Windows themes keep the name, drop the fake affordances

Date: 2026-08-30
Decided by: Christopher
Supersedes nothing; refines DN-43 and DN-44 for the pilot theme.
Research: `docs/theme-manifests/WINDOWS-PANEL-AND-PREVIEW-COPY.md`

## The constraint that forces the question

SP+ deliberately does not ship upstream Windows Modern's custom C++ applets, panel
template, session-lock shell or patched boot greeter (`images/kde/Containerfile:L860-L863`).
The Windows panel must therefore be built from stock Fedora Plasma 6.7 applets only.
Stock applets cannot reproduce: a stably centred task group (Plasma's panel is a linear
layout, so two flexible spacers drift as task and tray widths change), the Windows Start
menu structure, Snap Layouts, the Widgets feed, jump lists, or Search/Copilot.

## The decision

The themes **keep the names Windows Light and Windows Dark** and keep leading the Welcome
list, because instant recognition for an advisor arriving from Windows is the reason they
lead. But SP+ ships a *familiar office desktop*, not a claimed reproduction.

Concretely, in and out:

**In** — the landmarks that carry daily use: bottom-anchored full-width 48px panel, no
auto-hide, compact icons-only task manager with pinned launchers in a stable order,
grouped running applications with popups, real system tray (network, volume,
notifications), two-line clock with date, a show-desktop affordance.

**Out** — any cue that promises a Windows action and delivers something else: no Windows
logo on the launcher (a Windows mark opening a visibly KDE menu is the single most
damaging case), no Widgets, Search or Snap Layouts buttons that do not do what a Windows
user expects, no glass/mica effects that imply Windows materials without improving
readability.

**Stability beats fidelity.** If the pseudo-centred group visibly drifts across the
required display sizes and window counts, use a stable left-aligned Start-plus-tasks
arrangement instead. A panel that moves while in use reads as broken.

## Acceptance bar for the pilot

1. The bottom bar is immediately recognisable.
2. Pinned apps are in a stable order and click predictably.
3. Running applications are visibly distinct and sensibly grouped.
4. Clock, date, volume, network and notifications are easy to find.
5. **Nothing advertises a capability that is absent.**
6. The panel does not shift enough at common window counts to look broken.

Tested at 1920 first, then 1366, 4K scaling, and multi-monitor.

## Flagged, decided, not blocking

Keeping "Windows" in a shipped product name carries a third-party trademark
consideration for a commercial product. It was raised at decision time and Christopher
chose to keep the name; recorded here so the choice is visible rather than assumed.

## Consequences for DN-44 copy

The preview change-list must not claim a Windows match. The approved copy in
`WINDOWS-PANEL-AND-PREVIEW-COPY.md` (Version A, layout-resetting) is adopted as the
starting text, including the restore wording — "Your current panel is saved. You can
restore the previous panel and pinned apps later." — and its prohibition on "reset",
"rollback", "recovery" and "backup" as the visible heading.
