# DN-32 — "Make my computer better" (spplus-tune)

**Status:** design settled, v1 (survey only) built and proven on real hardware 2026-08-29.
Reviewed adversarially by Bee (`bee-runs/20260829T211906Z_spplus-tune-design`, 18 KB, ACCEPT).

## The feature

First option on the Welcome app's Fin page. Surveys the machine's hardware and
software profile and improves the settings for *that* machine. For most advisors
this is their first experience of Fin doing anything, which makes it the highest-
trust-risk feature in the product: if it ever makes a machine worse, the trust
does not come back.

## Decisions

**D1 — It is a deterministic script, not a prose skill.** `spplus-tune` ships in
`/usr`; `SKILL.md` teaches Fin to drive and explain it. DN-31 decision 7 held that
a system prompt is not a guardrail; the same reasoning says it is not an
implementation either. A skill that says "look at the hardware and decide" gives a
different answer every run and cannot be gated at build time.

**D2 — The advisor's own settings are sacred, enforced by construction.**
Christopher's rule: never revert or re-tune what the advisor changed, unless asked.
Ownership *cannot* be established by comparing values — a changed value proves only
that it changed, never who changed it. Bee enumerated ~25 ways the comparison
returns a wrong verdict (KDE key renames, a bootc default moving, a dock, a monitor
swap, a daemon clamping a value, a crash between apply and record). Rather than
detect ownership, we remove the need to: **no setting is ever changed without
explicit, per-item consent.** Sacredness then holds by construction. There is no
automatic re-tune path, ever.

**D3 — Provenance is a markdown record of the machine** (`/var/lib/sp-plus/THIS-MACHINE.md`),
in the style this project already uses for homelab machines. Bee argued markdown is
unsound as the authority for an automated safety gate (partial writes, hand edits,
delimiters in values, restores from backup) and wanted a hash-chained journal behind
a privileged helper. That objection is real but is dissolved by D2: with no automatic
mutation, the file is not gating a machine decision, it is informing a human one.
Exact fields still live in a strict table with a sanitiser, never in prose.

**D4 — Nothing that touches the image. Ever.** No package install, no rpm-ostree
layering, no repo changes, no kernel modules. See the verified finding below.

**D5 — Display identity is connector + EDID hash, never the setting name.** A
different monitor or a dock is a different scope, treated as never-tuned.

**D6 — Effective state, not stored value.** KDE settings are layered
(`/etc/xdg` defaults, then `~/.config`). A file can change without behaviour
changing and vice versa. Catalogue entries must verify behaviour. (Bee's Q8 — the
gap neither the headbrain nor the brief had spotted.)

## VERIFIED FINDING — layering takes a machine off the update train

On the Dell, 2026-08-29, after an attempt to update Pi installed `npm`:

```
error: Upgrading: Deployment contains local rpm-ostree modifications;
cannot upgrade via bootc. You can run `rpm-ostree reset` to undo the modifications.
```

`bootc status` reported the staged deployment as `incompatible: true`. Bee had rated
this "medium confidence, a future upgrade may still work" — it is in fact a hard
refusal. The booted deployment was clean, so the machine looked entirely normal; the
next reboot would have landed on a deployment that could never be updated again, with
nothing on the desktop indicating it.

Recovered with `rpm-ostree reset` (freed 160.4 MB, `incompatible: false`).

**Consequences:** D4 is non-negotiable, and **DN-30 needs an update-health gate** —
every machine must report whether it is still upgradable, every cycle. A security
product that silently stops receiving patches is the worst failure mode available.

## Catalogue after review

Kept: display scale/HiDPI, refresh rate (both individually opt-in, EDID-scoped,
watchdog rollback, never bundled); touchpad tap-to-click and natural scroll (proposed,
never silent — natural scrolling is preference, not improvement); Wi-Fi power save
(with an explicit latency/roaming tradeoff warning); power profile via **tuned**;
reduced compositor effects under software rendering.

Dropped: **zram** (already configured by policy; reboot-dependent), **lid/suspend**
(needs a safety policy, no safe generic undo), **battery charge thresholds** (vendor-
specific; absent on the Dell), **font DPI** (duplicates scaling on Wayland).
**SSD trim** becomes verify-and-report only.

**Wrong daemon trap:** the first draft named `power-profiles-daemon`. Fedora ships
`tuned` + `tuned-ppd`; on the Dell PPD is inactive and tuned is active (`balanced`).
This is the same trap recorded for the Surface Pro 7 on 2026-08-17.

## v1 status — built and proven

`spplus-tune` v1 surveys and writes the machine record. It has **no apply path at all**.

Proven on the Dell (Inspiron 5737, i5-4200U, 7808 MB, spinning HDD, Haswell-ULT):
74-line document generated, update health `OK`, two displays correctly separated by
EDID (`eDP-1` 69bc89393efb3641 @1600x900, `HDMI-A-1` 862663c08a63e08c @1920x1080).

**Bug found only by running on real hardware:** sysfs reports `st_size 0` for the
EDID node while reading back 128 bytes, so `[ -s "$c/edid" ]` is always false. Every
display collapsed to `(no EDID)` — precisely the laptop-panel/dock confusion D5 exists
to prevent. Fixed by reading the node and testing the byte count.

Gate: `tests/test-update-health.sh`, 6 assertions over verbatim before/after fixtures
captured from the Dell. Passing.

## Open

- Wire the catalogue's consent + apply path (v2). Not started.
- `SKILL.md` for Fin. Not started.
- Test on the two other laptops — deliberately different hardware.
- Add the update-health gate to DN-30's fortnightly cycle.
