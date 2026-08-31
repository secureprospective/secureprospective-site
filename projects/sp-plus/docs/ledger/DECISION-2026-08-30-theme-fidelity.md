# DN-43 — global themes apply the creator's intent, not an SP+ profile

Date: 2026-08-30
Decided by: Christopher
Status: decided; phase 1 (manifest audit) in flight, no code changed

## The defect

The Welcome picker applies an SP+-normalized profile, not each creator's theme.
Confirmed in code, not inferred:

- `config/spplus-apply-theme` parses only `contents/defaults`. There is no layout
  path, so no picker choice can move a panel. (DN-28 item 6 already flagged that the
  SP+ layout lived inside the withdrawn Calm package.)
- Every subprocess call in it uses `check=False` — `plasma-apply-lookandfeel`, every
  `kwriteconfig6`, `plasma-apply-wallpaperimage`, all `qdbus-qt6` notifies — and the
  script then returns 0. Welcome reports success having only ATTEMPTED the writes.
- `SPPLUS_FONTS` (Noto Sans) is injected into any theme whose package declares no
  font, so even stock Breeze is not stock.

Net effect: "Windows 11" reads as a palette and a window decoration.

## The decisions

1. **The theme wins on everything it declares.** Drop the forced Noto fonts, the
   forced SP+ wallpaper, the fixed titlebar buttons and the `KSplash=none` override
   wherever the theme declares its own. SP+ policy fills gaps only where the package
   is silent. Typeface and wallpaper therefore change with the theme; that is
   intended. Brand lives on the website and in Welcome, not on the desktop.
2. **Layout may be reset, never silently.** A theme shipping its own layout gets a
   receipt in Welcome — "this resets your panel, pinned apps and desktop widgets;
   your current layout is backed up and can be restored" — and applies only after an
   explicit yes, with a restorable snapshot taken first.
3. **Pilot scope: Windows 11 light and dark together.** They share every asset. The
   rest of the shipped set follows only after the pilot is proven on the Dell.

## Phase 1, running now — audit only, no application-code change

Five per-theme manifests under `docs/theme-manifests/`, produced by Bee: Windows 11,
Catppuccin, Nordic, Orchis, and stock Breeze plus the SP+ policy layer. Each records
provenance and pinned ref, shipped assets vs what the Containerfile actually copies,
the creator's declared configuration, dependencies, Plasma 6 compatibility, layout
contents including every hard-coded path, SP+ divergences classified as
REQUIRED-COMPAT / SP+-POLICY / UNEXPLAINED, and a verification section of readback
commands that can actually fail. Claims cite file:line or a command's output;
anything not established is written `UNKNOWN — <what would settle it>`.

## Phase 2, gated on the manifests

Replace the apply path with one that validates the installed profile, snapshots
current config and layout, applies canonical config, applies layout only on
confirmation, reloads only affected Plasma services, reads back every expected key
after Plasma settles, and restores the snapshot on any mismatch. Failures stop being
swallowed. Welcome offers only profiles that pass that gate, and says exactly what
each will change.

## Plasma 6.7 constraints (research, 2026-08-30)

Full text: `docs/theme-manifests/PLASMA6-CONSTRAINTS.md`. Source-derived from
plasma-workspace / kwin / aurorae / kconfig / Kvantum; no live session was available,
so runtime claims are marked as such there. Consequences that bind the build:

1. **The second root cause is confirmed.** `spplus-apply-theme`'s `notify()` calls
   `org.kde.KGlobalSettings.notifyChange` as a D-Bus *method*. It is a **signal**,
   with no method implementation. The call fails — and `check=False` swallows it.
   So the entire reload half of the apply path has never done anything. That, plus
   the missing layout path, is why themes read as "colours changed, nothing else".
   Correct per-surface paths are tabled in the constraints doc (KIconLoader change
   for icons, `/KDEPlatformTheme refreshFonts` for fonts, `KWin.reconfigure` for
   decoration, cursor via `kcminputrc` + KWin reparse).
2. **`--resetLayout` is not layout-only.** `lnftool` always applies
   `AppearanceSettings | BlendChanges` and merely *adds* `LayoutSettings`. Its
   appearance phase calls `setCursorTheme()`, which opens `kcminputrc`, writes
   `kdedefaults/kcminputrc` and calls `revertToDefault()` — which explains our
   observed zero-byte `kcminputrc` (`config/kcminputrc:8`) without needing a bug.
   Blast radius to snapshot: `plasma-org.kde.plasma-appletsrc`, `kdeglobals`,
   `kwinrc`, `plasmarc`, `ksplashrc`, `plasmashellrc`, `kcminputrc`,
   `~/.config/kdedefaults/*`.
3. **Layout reload is asynchronous with no completion signal.** `startupCompleted`
   is not exported on `org.kde.PlasmaShell`; `shellChanged` belongs to `changeShell`.
   The apply path must POLL a read-back (`dumpCurrentLayoutJS` plus package-specific
   invariants), never `sleep`. This kills the DN-28-era fixed-interval approach.
4. **Aurorae `.v2` is what new SVG config must write.** v1 still exists for legacy
   QML decorations, and 6.7 migrates `__aurorae__svg__*` themes, but we write `.v2`.
   Nordic, Orchis and Catppuccin Classic have the expected legacy SVG/rc structure,
   so no format conversion is indicated — not a guarantee each SVG renders.
5. **Decoration fallback is now detectable.** `KWin.supportInformation()` reports the
   loaded plugin and theme. Reading `kwinrc` only proves the request was *written*;
   supportInformation proves it was *loaded*. This is the check that can fail.
6. **Three look-and-feel surfaces are dead on Plasma 6:** `contents/lockscreen`,
   `contents/osd` and `contents/loginmanager` are not registered by the
   `Plasma/LookAndFeel` package type. Nordic's lock screen and OSD assets are
   therefore shipped-but-inert. Honoured: `splash`, `windowswitcher`, `layouts`,
   `logout`, `defaults`, `colors`.
7. **Some surfaces cannot apply live, and Welcome must say so.** Splash needs the
   next login; SDDM needs the greeter; Kvantum needs affected apps restarted — there
   is no D-Bus call that restyles a running Qt process. Nothing needs a reboot.
8. **Kvantum activation is `widgetStyle=kvantum{,-dark}` plus
   `Kvantum/kvantum.kvconfig`.** `KVANTUM_THEME` is not read by current upstream and
   must not be used as the read-back. Proving it is active requires a Qt probe
   reporting the style class, not a config value.

## Follow-on decisions (Christopher, 2026-08-30, after the Windows manifest)

- **Cursor: keep `breeze_cursors` for Windows Modern and disclose it.** Upstream's
  declared `Windows-modern-dark-cursors` does not exist upstream — a dangling
  reference — so "the theme wins" has nothing to apply. Not sourcing a third-party
  cursor set, which would add a dependency under the maintained-only rule. The DN-44
  change-list must not imply the cursor changes.
- **Windows Modern provenance is now pinned** at `7ef6bfe99a4…` in
  `theme/vendor/PROVENANCE.md`, recorded as a reconstructed pin with the verified /
  deliberately-divergent / not-vendored split stated explicitly.

### New consequence surfaced by the manifest

Upstream's Windows Modern **wallpaper is not copied into the image**. DN-43 decision 1
flips the wallpaper to the theme's own, so for Windows that asset has to start shipping
or the decision cannot be honoured for this theme. Shipping it is consistent with the
standing rule that ISO size is traded for a better first run. This is a build change,
not a picker change, and belongs in the phase-2 brief.

## Defect found by the Catppuccin audit, 2026-08-30 — missing Aurorae `<theme>rc`

Plasma 6.7's Aurorae v2 plugin requires both `decoration.svg` and `<theme>rc` under
`share/aurorae/themes/<theme>/` (`PLASMA6-CONSTRAINTS.md` §2). Catppuccin's local Aurorae
tree has byte-perfect upstream SVGs but **no `<theme>rc`**: upstream's `install.sh`
supplies it from `Resources/Aurorae/Common` at install time, and SP+ vendored the static
tree without running the installer.

Expected runtime consequence: KWin fails to load the decoration and silently falls back to
Breeze — user-visible as "only the colours changed", the original complaint. Detectable via
`KWin.supportInformation()`, not by reading `kwinrc`.

A build gate asserting `decoration.svg` + `<theme>rc` for every referenced Aurorae theme is
now mandatory in phase 2, and Nordic and Orchis must be checked for the same omission.

Also recorded from that audit: upstream Catppuccin has **no icon-theme policy at all**, so
SP+'s Papirus selection there fills a genuine gap rather than overriding a creator choice —
unlike Windows, where `windows-modern` icons exist and are installed. And upstream's
installer downloads two cursor archives (`--local-cursor` / `--no-cursor`), so Catppuccin's
cursor is a real sourceable asset, unlike Windows' dangling reference.
