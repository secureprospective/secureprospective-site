# Round 4 — SP+ plus shading match (2026-08-26, Beelink)

## What changed
The `+` in the SP+ lockup read noticeably brighter than the S and P. Cause was
geometry-driven, not material: the plus has a faceted pyramid top (`plaque_top()`)
whose planes catch the HDRI at near-specular angles, while the letter faces are flat.

Fix is shading only. **No geometry was touched** — apex height, inset steps and span
are all unchanged from round 3. The plus now gets its own instance of the same
sterling-silver shader:

- `PLUS_TINT = 0.68` — multiplier on `BASE_COLOR`. On a metal the base colour is
  reflectance, so scaling it down darkens the plus directly.
- `PLUS_ROUGH_ADD = 0.03` — roughness 0.10 -> 0.13 for the plus only, which spreads
  the hot facet highlight instead of mirroring it.

`silver_material()` now takes `(name, tint, rough_add)`; `build_scene()` assigns the
second material only to the object named `SP_Plus`. When both knobs are at their
neutral values the script produces byte-comparable round-3 behaviour (one material).

## Measured result (mean luma, dark composites)
| | S/P letters | plus before | plus after |
|---|---|---|---|
| Lockup | 171.3 | 188.2 (+16.9) | **174.8 (+3.5)** |
| Icon   | 144.9 | 187.8 (+42.9) | 172.9 (+28.0) |

Selection came from `job_plustint` (tints 1.00 / 0.88 / 0.78 / 0.68 / 0.58, identical
framing every frame). Sweep frames kept at `v3-scratch/plustint_*_dark.png`.

## KNOWN, NOT FIXED — the icon still runs bright
The icon composition improved by ~15 luma but the plus is still ~28 above the letters
there. This is **not** the material. The icon crops tighter, so the plus fills much more
of the frame and its large facet planes take the softbox nearly head-on while the S and
P sit further into the HDRI's shadow side. Same shader, different incident angles.
If it needs fixing: either a separate icon-only tint (~0.45) or a small `HDRI_ROTATION_Z`
nudge for that composition. Do not "fix" it by lowering the shared lockup tint.

## Files
Re-rendered at tint 0.68 (220 spp):
`sp-plus-lockup-4k-transparent.png`, `sp-plus-lockup-1080-{dark,transparent}.png`,
`sp-plus-icon-1024-{dark,transparent}.png`, `sp-plus-icon-512-transparent.png`,
and both `.blend` files re-saved.

Round-3 originals (tint 1.00) preserved unmodified at
`v3-scratch/round3-plus-tint-1.00/`. Nothing was deleted or moved.

`build-sp-plus.py.bak` is a pre-edit backup of the build script; safe to delete.

## ⚠️ For CT105 / whoever picks this up
`grafix/render/` and `grafix/hdri/` are **untracked** in this repo (branch
`session/sp-plus-plan`). They have never been committed, so a `git fetch` from CT105
will NOT bring these renders across. Christopher's stated intent is to use these assets
in the SP+ ISO project (`~/work/sp-plus/iso/`). Getting them there needs an explicit commit
or an rsync — it will not happen by itself.
