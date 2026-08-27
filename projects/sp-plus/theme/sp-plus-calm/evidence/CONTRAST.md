# SP+ Calm graphite contrast measurements

Method: WCAG 2 relative luminance with sRGB linearization. Ratio is `(L1 + 0.05) / (L2 + 0.05)` using unrounded RGB source values. Each table enumerates every `Foreground*` value against both backgrounds in every shipped `Colors:*` section. `Decoration*` is a non-text UI indicator, not a foreground/background pair.

Thresholds: normal text 7:1 target, all text 4.5:1 minimum. All measured shipped foreground/background pairs pass 4.5:1.

## Dark

| Section | Background | Active | Inactive | Link | Negative | Neutral | Normal | Positive | Visited |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Colors:Button | Normal `#1E232B` | 9.06:1 | 7.88:1 | 8.44:1 | 6.70:1 | 9.01:1 | 14.06:1 | 7.62:1 | 7.72:1 |
| Colors:Button | Alternate `#191D24` | 9.70:1 | 8.44:1 | 9.04:1 | 7.18:1 | 9.65:1 | 15.05:1 | 8.16:1 | 8.27:1 |
| Colors:Complementary | Normal `#111419` | 10.59:1 | 9.22:1 | 9.87:1 | 7.84:1 | 10.54:1 | 16.43:1 | 8.92:1 | 9.03:1 |
| Colors:Complementary | Alternate `#191D24` | 9.70:1 | 8.44:1 | 9.04:1 | 7.18:1 | 9.65:1 | 15.05:1 | 8.16:1 | 8.27:1 |
| Colors:Header | Normal `#111419` | 10.59:1 | 9.22:1 | 9.87:1 | 7.84:1 | 10.54:1 | 16.43:1 | 8.92:1 | 9.03:1 |
| Colors:Header | Alternate `#191D24` | 9.70:1 | 8.44:1 | 9.04:1 | 7.18:1 | 9.65:1 | 15.05:1 | 8.16:1 | 8.27:1 |
| Colors:Header][Inactive | Normal `#12161B` | 10.42:1 | 9.07:1 | 9.71:1 | 7.71:1 | 10.37:1 | 16.17:1 | 8.77:1 | 8.88:1 |
| Colors:Header][Inactive | Alternate `#12161B` | 10.42:1 | 9.07:1 | 9.71:1 | 7.71:1 | 10.37:1 | 16.17:1 | 8.77:1 | 8.88:1 |
| Colors:Selection | Normal `#1E3440` | 7.44:1 | 6.47:1 | 6.93:1 | 5.50:1 | 7.40:1 | 11.54:1 | 6.26:1 | 6.34:1 |
| Colors:Selection | Alternate `#1E3440` | 7.44:1 | 6.47:1 | 6.93:1 | 5.50:1 | 7.40:1 | 11.54:1 | 6.26:1 | 6.34:1 |
| Colors:Tooltip | Normal `#191D24` | 9.70:1 | 8.44:1 | 9.04:1 | 7.18:1 | 9.65:1 | 15.05:1 | 8.16:1 | 8.27:1 |
| Colors:Tooltip | Alternate `#191D24` | 9.70:1 | 8.44:1 | 9.04:1 | 7.18:1 | 9.65:1 | 15.05:1 | 8.16:1 | 8.27:1 |
| Colors:View | Normal `#111419` | 10.59:1 | 9.22:1 | 9.87:1 | 7.84:1 | 10.54:1 | 16.43:1 | 8.92:1 | 9.03:1 |
| Colors:View | Alternate `#191D24` | 9.70:1 | 8.44:1 | 9.04:1 | 7.18:1 | 9.65:1 | 15.05:1 | 8.16:1 | 8.27:1 |
| Colors:Window | Normal `#111419` | 10.59:1 | 9.22:1 | 9.87:1 | 7.84:1 | 10.54:1 | 16.43:1 | 8.92:1 | 9.03:1 |
| Colors:Window | Alternate `#191D24` | 9.70:1 | 8.44:1 | 9.04:1 | 7.18:1 | 9.65:1 | 15.05:1 | 8.16:1 | 8.27:1 |

### Dark window-manager and focus indicators

| Pair | Ratio |
|---|---:|
| Active title ground `#1F2E39` / inactive title ground `#12161B` | 1.30:1 |
| Decoration focus `#76B4D4` / active title ground `#1F2E39` | 6.13:1 |
| Decoration focus `#76B4D4` / inactive title ground `#12161B` | 8.00:1 |

### Dark semantic separation under colour-vision simulation

CIE76 delta E between the semantic pair after a Machado 2009 100% simulation. The palette remains separated in every listed simulation. Theme color cannot replace application labels, icons, or text for errors and warnings.

| Pair | Normal | Protanopia | Deuteranopia | Tritanopia |
|---|---:|---:|---:|---:|
| Negative / Neutral | 45.6 | 38.4 | 26.8 | 28.1 |
| Negative / Positive | 67.9 | 13.4 | 25.7 | 89.0 |
| Neutral / Positive | 57.6 | 44.0 | 51.9 | 63.1 |

## Light

| Section | Background | Active | Inactive | Link | Negative | Neutral | Normal | Positive | Visited |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Colors:Button | Normal `#E4E9EE` | 5.23:1 | 5.73:1 | 5.08:1 | 5.53:1 | 6.17:1 | 12.73:1 | 5.42:1 | 6.57:1 |
| Colors:Button | Alternate `#E9EDF1` | 5.44:1 | 5.95:1 | 5.28:1 | 5.74:1 | 6.40:1 | 13.22:1 | 5.63:1 | 6.83:1 |
| Colors:Complementary | Normal `#F4F6F8` | 5.90:1 | 6.46:1 | 5.73:1 | 6.24:1 | 6.95:1 | 14.35:1 | 6.12:1 | 7.41:1 |
| Colors:Complementary | Alternate `#E9EDF1` | 5.44:1 | 5.95:1 | 5.28:1 | 5.74:1 | 6.40:1 | 13.22:1 | 5.63:1 | 6.83:1 |
| Colors:Header | Normal `#F4F6F8` | 5.90:1 | 6.46:1 | 5.73:1 | 6.24:1 | 6.95:1 | 14.35:1 | 6.12:1 | 7.41:1 |
| Colors:Header | Alternate `#E9EDF1` | 5.44:1 | 5.95:1 | 5.28:1 | 5.74:1 | 6.40:1 | 13.22:1 | 5.63:1 | 6.83:1 |
| Colors:Header][Inactive | Normal `#E2E7EB` | 5.14:1 | 5.62:1 | 4.99:1 | 5.43:1 | 6.05:1 | 12.49:1 | 5.32:1 | 6.45:1 |
| Colors:Header][Inactive | Alternate `#E2E7EB` | 5.14:1 | 5.62:1 | 4.99:1 | 5.43:1 | 6.05:1 | 12.49:1 | 5.32:1 | 6.45:1 |
| Colors:Selection | Normal `#DCECF4` | 5.28:1 | 5.78:1 | 5.13:1 | 5.58:1 | 6.22:1 | 12.85:1 | 5.47:1 | 6.64:1 |
| Colors:Selection | Alternate `#DCECF4` | 5.28:1 | 5.78:1 | 5.13:1 | 5.58:1 | 6.22:1 | 12.85:1 | 5.47:1 | 6.64:1 |
| Colors:Tooltip | Normal `#E9EDF1` | 5.44:1 | 5.95:1 | 5.28:1 | 5.74:1 | 6.40:1 | 13.22:1 | 5.63:1 | 6.83:1 |
| Colors:Tooltip | Alternate `#E9EDF1` | 5.44:1 | 5.95:1 | 5.28:1 | 5.74:1 | 6.40:1 | 13.22:1 | 5.63:1 | 6.83:1 |
| Colors:View | Normal `#FAFBFC` | 6.17:1 | 6.76:1 | 5.99:1 | 6.52:1 | 7.27:1 | 15.01:1 | 6.40:1 | 7.75:1 |
| Colors:View | Alternate `#E9EDF1` | 5.44:1 | 5.95:1 | 5.28:1 | 5.74:1 | 6.40:1 | 13.22:1 | 5.63:1 | 6.83:1 |
| Colors:Window | Normal `#F4F6F8` | 5.90:1 | 6.46:1 | 5.73:1 | 6.24:1 | 6.95:1 | 14.35:1 | 6.12:1 | 7.41:1 |
| Colors:Window | Alternate `#E9EDF1` | 5.44:1 | 5.95:1 | 5.28:1 | 5.74:1 | 6.40:1 | 13.22:1 | 5.63:1 | 6.83:1 |

### Light window-manager and focus indicators

| Pair | Ratio |
|---|---:|
| Active title ground `#EEF4F7` / inactive title ground `#E2E7EB` | 1.12:1 |
| Decoration focus `#267A9B` / active title ground `#EEF4F7` | 4.36:1 |
| Decoration focus `#267A9B` / inactive title ground `#E2E7EB` | 3.89:1 |

### Light semantic separation under colour-vision simulation

CIE76 delta E between the semantic pair after a Machado 2009 100% simulation. The palette remains separated in every listed simulation. Theme color cannot replace application labels, icons, or text for errors and warnings.

| Pair | Normal | Protanopia | Deuteranopia | Tritanopia |
|---|---:|---:|---:|---:|
| Negative / Neutral | 43.7 | 33.3 | 17.6 | 37.2 |
| Negative / Positive | 70.4 | 21.9 | 40.7 | 88.9 |
| Neutral / Positive | 60.4 | 53.9 | 57.3 | 52.1 |
