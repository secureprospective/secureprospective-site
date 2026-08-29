# ISO 44 — post-install test plan

**Everything here is UNVERIFIED on an installed machine.** A passing build gate
proves the source says the right thing; it does not prove the machine behaves.
This is the list that has to be walked on real hardware before ISO 44 is called
good, and before any advisor sees it.

Test hardware: the Dell (Inspiron 5737, Haswell, spinning HDD, dual display) plus
the two other laptops, which are deliberately different.

## A. Blocking — ship stops if these fail

| # | Test | How | Pass looks like |
|---|---|---|---|
| A1 | **Update health is real** | `sudo /usr/libexec/spplus-tune` then read `/var/lib/sp-plus/THIS-MACHINE.md` | "Update health — OK", `Layered packages: none`, `Marked incompatible: false` |
| A2 | **bootc can actually upgrade** | `sudo bootc upgrade --check` | Reaches the registry. Any "local rpm-ostree modifications" is a FAIL |
| A3 | **Flatpak install works** (see D1) | Welcome → install Bitwarden, then Signal | App installs and launches. `No remote refs found for 'flathub'` is a FAIL |
| A4 | **Home directory exists** | log in as a fresh account; `ls -ld /var/home/<user>` | `drwx------`, owned by that user. Confirm `journalctl -u spplus-mkhomedir` shows it created |
| A5 | **`bootc rollback` works** | deliberately roll back, reboot, confirm the prior deployment boots | Machine boots and the desktop is usable. **Never depended on until proven once** |
| A6 | **Graphical login** | reboot, log in at SDDM | Plasma session reaches the desktop |

## B. The tuner (DN-32) — first run on each machine

| # | Test | Pass looks like |
|---|---|---|
| B1 | Document is written | 70+ lines at `/var/lib/sp-plus/THIS-MACHINE.md`, mode 0644 |
| B2 | **Displays are separated by EDID** | each connected screen gets its OWN row and a DIFFERENT 16-hex EDID value. Two rows sharing `(no EDID)` is the regression this gate exists for |
| B3 | Dock / external monitor | plug and re-run: the new screen appears as its own scope, and the laptop panel's row is unchanged |
| B4 | Power manager named correctly | reports `tuned (...)` on Fedora, not `power-profiles-daemon` |
| B5 | Rotational media detected | HDD machines say "spinning HDD"; SSD machines say "solid-state" |
| B6 | **Nothing was changed** | v1 has no apply path: diff the desktop settings before and after. Any difference is a FAIL |
| B7 | Runs as non-root | `spplus-tune` without sudo exits with a clear message, does not traceback |

## C. Welcome app — carried over, still unverified

These were attempted on the Dell on 2026-08-29 and did NOT produce a clean result.

| # | Test | Why it is still open |
|---|---|---|
| C1 | **Theme apply** | the run was invalidated by an unrelated `rpm-ostree` transaction on the same machine (headbrain's own, running concurrently). Never re-tested |
| C2 | **Printer error path** | no CUPS destination existed, so the wrong-destination case threw at the pycups layer; the UI's own error path was never seen |
| C3 | **Email links** | `xdg-open` returned 0 but Brave was already running as a singleton, so nothing proved the page rendered |
| C4 | **Share check, both outcomes** | reachable and unreachable probes never both completed in one run |
| C5 | **Ask/Fin round trip in the page** | Fin returned the right answer on the command line; the DOM result was never captured |
| C6 | **Overflow / rendering at 1600x900 and 1920x1080** | needs human eyes; automation cannot judge it |

## D. Known defects to fix and then retest

**D1 — Flatpak scope mismatch. GROUNDED, two independent lines of evidence.**

`welcome.py:111` runs `flatpak install --user -y flathub <app>`, but the image
ships Flathub as a **system** remote only (`Containerfile:790` →
`/usr/share/flatpak/remotes.d/flathub.flatpakrepo`), and
`spplus-flatpak-preinstall.service` installs with `--system`. The user
installation therefore has no remote named `flathub`:

```
error: No remote refs found for 'flathub'
```

Observed live for both Bitwarden and Signal, and confirmed by reading the source.
Welcome is the only component using user scope; everything else in the image is
system scope.

**Recommendation, not yet decided:** make Welcome install `--system`, matching
the rest of the image. The advisor is in `wheel` with `NOPASSWD: ALL`, so a
polkit password prompt they cannot answer is exactly the dead end
`sudoers-sp-plus` argues against. **Not changed yet** — the semantics need
testing on hardware, and the Dell went offline before that was possible.

**D2 — Boot is 2m56s** (`graphical.target` at 2m19s). `ldconfig.service` alone is
59.8s and sda device units 53s. Slow hardware is the point of this test machine,
but this is worth attacking.

**D3 — Journal noise. Triaged; one item deliberately NOT fixed.**

Per boot: 72 x `link # is undefined!` (plasmashell), 25 x `Windows-modern-dark uses
the legacy metadata.desktop`, 12 x logind/audit session reuse, 6 x kwin "main thread
was hanging temporarily", 6 x portal registration failures. All benign; none affects
function.

*The theme warning is being left alone on purpose.* Both SP+ desktop themes
(`theme/desktoptheme/Windows-modern-{dark,light}`) ship only `metadata.desktop`.
Plasma 6 warns but still reads it. The obvious fix -- add `metadata.json` -- is not
safe to do blind: those files also carry `[ContrastEffect]` and
`[AdaptiveTransparency]` groups, and Plasma 6 PREFERS `metadata.json` when present.
A conversion that does not carry those groups across in exactly the right schema
would silently change the theme's transparency and contrast. That trades a verified
appearance for log cleanliness.

**If it is fixed, it must be done with `desktoptojson` (not hand-written), and the
result compared against the current desktop side by side by a human before it ships.**
Not a blocker. Cosmetic.

**D4 — `spplus-flatpak-preinstall.service` runs 3m56s** on the Dell. It is off the
critical path (`graphical.target` does not wait for it), but it is four minutes of
contention on a 5400rpm disk while the advisor is trying to use a fresh desktop.
Worth deferring further or rate-limiting.

## E. Deferred — not blocking ISO 44, blocking launch

- **Publish the image.** `ghcr.io/secureprospective/sp-plus-kde:edge` currently
  returns `manifest unknown`. Until it is published, DN-30 cannot pull anything
  and no installed machine can update at all.
- **Replace `insecureAcceptAnything`** with signature verification. Deployments
  currently show `ostree-unverified-registry`. Signing must ship BEFORE
  unattended pull, or an unattended machine accepts whatever is published under
  that name.
- **DN-30 update-health gate** — every machine reports upgradability each cycle.
