# SP+ layout fidelity report

Date: 2026-08-31

## Result

All eight shipped Welcome theme cards now request a layout reset. The helper now applies a package-owned layout when one exists, or Plasma's stock default-panel layout when the package owns no layout, and verifies the live panel over D-Bus in both cases. The original rollback path remains in place.

The receipt-capture harness was updated so all eight evidence runs use `--layout`.

## Diff

Changed files:

- `welcome/app/index.html`: all eight `data-layout-reset` values are `"true"`.
- `config/spplus-apply-theme`:
  - parses executable layout source after masking comments;
  - follows `loadTemplate(...)` references for stock/package layout templates;
  - handles optional language-gated `org.kde.plasma.kimpanel` slots without accepting unexpected applets;
  - builds a stock default-panel expectation from the image's authoritative Plasma template;
  - retains a documented clean-profile readback expectation if a stripped image has no template;
  - verifies the stock expectation through the same live D-Bus readback path as package layouts;
  - clears a stale systemd user-unit failure counter before the checked plasmashell restart, so a rapid eight-theme evidence sweep does not trip the start-rate limiter. No fixed sleep was added.
- `tests/theme-phase2-source-gate.sh`: rejects any card whose `data-layout-reset` is not `true`.
- `tests/capture_receipts.sh`: all eight capture calls now use `--layout`.

`git diff --stat` for these files:

```text
 projects/sp-plus/config/spplus-apply-theme         | 172 ++++++++++++++++++---
 projects/sp-plus/tests/capture_receipts.sh         |  12 +-
 projects/sp-plus/tests/theme-phase2-source-gate.sh |   3 +
 projects/sp-plus/welcome/app/index.html            |   4 +-
 4 files changed, 164 insertions(+), 27 deletions(-)
```

## Gate evidence

The deliberate regression changed the first card's value to `false`. The gate failed as required:

```text
$ tests/theme-phase2-source-gate.sh
 theme card does not reset to its declared layout: <button class="theme-card lead" role="radio" aria-checked="false" data-lnf="org.secureprospective.spplus.modern.light" data-theme="WINDOWS LIGHT" data-preview="assets/theme-previews/windows-light.png" data-layout-reset="false" data-cursor-note="The mouse pointer stays standard for Modern." style="--sw-bg:#f9f9f9;--sw-fg:#1e1e1e;--sw-view:#ffffff;--sw-accent:#0067c0">
exit=1
```

The value was restored, and the final gate passed:

```text
$ tests/theme-phase2-source-gate.sh
PASS SP+ Phase 2 theme source path and preview contract
```

Additional final local checks passed:

```text
python3 -m py_compile config/spplus-apply-theme
bash -n config/spplus-first-login tests/capture_receipts.sh tests/theme-phase2-source-gate.sh
./tests/cycle36-source-gate.sh
 git diff --check
```

## Live D-Bus evidence

Host: Dell live Plasma session `sp-plus` (reachable at `192.168.1.124` during capture). Each row is a fresh `spplus-apply-theme THEME --layout` invocation followed by `qdbus-qt6 org.kde.plasmashell /PlasmaShell org.kde.PlasmaShell.dumpCurrentLayoutJS`. Every final invocation returned `rc=0`, and the helper reported config, wallpaper, decoration, and requested layout readback success.

| Theme | Live panel applet sequence after apply | LNF readback |
|---|---|---|
| `org.secureprospective.spplus.modern.dark` | `org.kde.plasma.panelspacer -> org.kde.plasma.kickoff -> org.kde.plasma.icontasks -> org.kde.plasma.panelspacer -> org.kde.plasma.systemtray -> org.kde.plasma.digitalclock -> org.kde.plasma.minimizeall` | `org.secureprospective.spplus.modern.dark` |
| `org.secureprospective.spplus.modern.light` | `org.kde.plasma.panelspacer -> org.kde.plasma.kickoff -> org.kde.plasma.icontasks -> org.kde.plasma.panelspacer -> org.kde.plasma.systemtray -> org.kde.plasma.digitalclock -> org.kde.plasma.minimizeall` | `org.secureprospective.spplus.modern.light` |
| `org.kde.breezedark.desktop` | `org.kde.plasma.kickoff -> org.kde.plasma.pager -> org.kde.plasma.icontasks -> org.kde.plasma.marginsseparator -> org.kde.plasma.systemtray -> org.kde.plasma.digitalclock -> org.kde.plasma.showdesktop` | `org.kde.breezedark.desktop` |
| `org.kde.breeze.desktop` | `org.kde.plasma.kickoff -> org.kde.plasma.pager -> org.kde.plasma.icontasks -> org.kde.plasma.marginsseparator -> org.kde.plasma.systemtray -> org.kde.plasma.digitalclock -> org.kde.plasma.showdesktop` | `org.kde.breeze.desktop` |
| `Nordic` | `org.kde.plasma.kickoff -> org.kde.plasma.pager -> org.kde.plasma.icontasks -> org.kde.plasma.marginsseparator -> org.kde.plasma.systemtray -> org.kde.plasma.digitalclock -> org.kde.plasma.showdesktop` | `Nordic` |
| `com.github.vinceliuice.Orchis` | `org.kde.plasma.kickoff -> org.kde.plasma.appmenu -> org.kde.plasma.panelspacer -> org.kde.plasma.colorpicker -> org.kde.plasma.systemtray -> org.kde.plasma.digitalclock` | `com.github.vinceliuice.Orchis` |
| `Catppuccin-Latte` | `org.kde.plasma.kickoff -> org.kde.plasma.pager -> org.kde.plasma.icontasks -> org.kde.plasma.marginsseparator -> org.kde.plasma.systemtray -> org.kde.plasma.digitalclock -> org.kde.plasma.showdesktop` | `Catppuccin-Latte` |
| `Catppuccin-Mocha` | `org.kde.plasma.kickoff -> org.kde.plasma.pager -> org.kde.plasma.icontasks -> org.kde.plasma.marginsseparator -> org.kde.plasma.systemtray -> org.kde.plasma.digitalclock -> org.kde.plasma.showdesktop` | `Catppuccin-Mocha` |

Event-log confirmation for the final sweep:

```text
windows-dark       verdict=success layout_readback=true
windows-light      verdict=success layout_readback=true
breeze-dark        verdict=success layout_readback=true
breeze-light       verdict=success layout_readback=true
nordic-dark        fallback=stock-default-panel-template layout_readback=true verdict=success
orchis-light       layout_readback=true verdict=success
catppuccin-latte   fallback=stock-default-panel-template layout_readback=true verdict=success
catppuccin-mocha   fallback=stock-default-panel-template layout_readback=true verdict=success
```

The final remote state was restored to the initial Windows Dark theme and its Windows panel sequence. This report is applet/D-Bus evidence only; it does not claim visual screenshot evidence.
