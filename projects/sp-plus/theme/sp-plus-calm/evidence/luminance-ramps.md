# 1x luminance ramps

Measured from the literal three SVG exterior rows after straight-alpha compositing at a pixel centre. `outer → inner` ends at the normal frame ground. The diagonal corner uses the supplied radial gradient, so its values are not substituted for the straight-edge measurement.

| Scheme | Underlay | Row | Alpha | Result | Relative luminance | Delta from prior row |
|---|---|---:|---:|---|---:|---:|
| Dark | own ground | 1 outer→inner | 3.5% | `#151A20` | 0.0100 | +0.0031 |
| Dark | own ground | 2 outer→inner | 8.5% | `#1A2229` | 0.0152 | +0.0052 |
| Dark | own ground | 3 outer→inner | 17.0% | `#222F39` | 0.0267 | +0.0114 |
| Dark | own ground | frame | 0.0% | `#111419` | 0.0069 | -0.0198 |
| Dark | busy wallpaper sample | 1 outer→inner | 3.5% | `#324348` | 0.0516 | +0.0057 |
| Dark | busy wallpaper sample | 2 outer→inner | 8.5% | `#36494F` | 0.0611 | +0.0095 |
| Dark | busy wallpaper sample | 3 outer→inner | 17.0% | `#3C535C` | 0.0792 | +0.0181 |
| Dark | busy wallpaper sample | frame | 0.0% | `#111419` | 0.0069 | -0.0723 |
| Light | own ground | 1 outer→inner | 5.5% | `#E6E7E0` | 0.7936 | -0.0633 |
| Light | own ground | 2 outer→inner | 14.5% | `#D3DBD8` | 0.6947 | -0.0989 |
| Light | own ground | 3 outer→inner | 30.0% | `#B1C6C9` | 0.5395 | -0.1552 |
| Light | own ground | frame | 0.0% | `#F2EEE5` | 0.8568 | +0.3173 |
| Light | busy wallpaper sample | 1 outer→inner | 5.5% | `#2F4147` | 0.0484 | +0.0025 |
| Light | busy wallpaper sample | 2 outer→inner | 14.5% | `#2D454D` | 0.0535 | +0.0051 |
| Light | busy wallpaper sample | 3 outer→inner | 30.0% | `#294C58` | 0.0634 | +0.0099 |
| Light | busy wallpaper sample | frame | 0.0% | `#F2EEE5` | 0.8568 | +0.7934 |

The dark ramp is intentionally below attention threshold. The light ramp is deeper and has roughly twice the final alpha because a warm paper underlay gives a pale treatment too little state separation. The spread is exactly 3 logical pixels outside a 1 px frame, not a Gaussian blur. At 96 DPI that is 0.79 mm, which stays short enough to avoid a halo.
