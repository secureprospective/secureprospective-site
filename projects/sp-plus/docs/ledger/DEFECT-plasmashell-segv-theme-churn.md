# DEFECT: plasmashell segfaults during repeated theme switching (VM only so far)

Status: **OPEN, logged for hardware testing.** Christopher's call on 2026-09-01
was to log it rather than chase it now.

## What happens

`plasmashell` dies with SIGSEGV during a run that walks all eight Welcome
themes with layout resets. It is restarted automatically and the desktop
recovers. Christopher saw the resulting drkonqi crash dialogs on the VM's
screen, which is how this was found: the theme gate was reporting a clean pass
at the time, because it only checked the wallpaper and never asked whether
anything had died getting there.

## Measured rate

Three SIGSEGVs across roughly 80 theme switches, about 4 percent, all on the
test VM.

| Exercise | Switches | Crashes |
|---|---|---|
| Full eight-theme walk plus double round trip, run 1 | 20 | 1 |
| Same, run 2 | 20 | 0 |
| Same, earlier run | 20 | 1 |
| Windows Light to Windows Dark only, old unchanged wallpaper | 10 | 0 |
| Catppuccin Mocha to Latte only, new wallpapers incl. the 8K one | 10 | 0 |

## What the crash is

Both captured backtraces are inside Mesa's software rasteriser, on the Qt
scene-graph render thread, but at DIFFERENT call sites:

- `llvmpipe_texture_layout` then `posix_memalign` then `sysmalloc_mmap`,
  reached from `st_TexImage` and `QGles2Texture::create`, i.e. uploading a
  texture.
- `llvmpipe_draw_vbo`, i.e. drawing.

The VM reports `Compositing Type: OpenGL`, `Driver: LLVMpipe`,
`GPU class: Unknown`. There is no GPU, so every wallpaper pixel goes through
the CPU.

## Hypotheses tested and REFUTED

- **"The new 7680x4320 wallpaper is too large for llvmpipe."** Refuted. Ten
  switches between the two Catppuccins, one of which ships that 8K image,
  produced zero crashes, and ten switches on the old unchanged wallpaper also
  produced zero. Two different call sites also argue against one bad texture.
- **"The machine ran out of memory."** Refuted. Zero kernel OOM kills, 7.9 GB
  RAM with 5.5 GB available and zram swap unused.
- **"The crashes were the test harness."** Partly true and partly not. An
  early broken run without a session bus produced 21 `plasma-apply-lookandfeel`
  aborts, and those were harness noise. The three `plasmashell` SIGSEGVs are
  not: they occur in runs that otherwise pass every check.

## What it does NOT break

Every wallpaper check passed in the crashing runs as well, 20 of 20. The right
wallpaper is on the desktop afterwards. This is a shell that falls over under
churn and recovers, not a theme switch that produces a wrong result.

## Why it is not fixed yet

The cause is not established, only characterised. The two things that would
settle it are the Dell, which has real graphics and may not use this software
path at all, and a human-realistic pattern: an advisor switches theme once or
twice, not eighty times in a row. Christopher's own acceptance test, Breeze to
Windows and back twice, passes clean.

## What to do next

Run `tests/theme-wallpaper-roundtrip.sh` on the Dell. It now counts coredumps
before and after and fails on any new one, so it will answer this directly. If
the Dell is clean across several full runs, this is a GPU-less VM artefact and
should be recorded as such rather than fixed. If the Dell crashes too, it is a
real product defect and blocks the ISO.

Do not guess at a fix before that measurement exists.
