# DN-26 — Retire the KDE wizard; SP+ Welcome owns the first screen

Status: DECIDED 2026-08-27 by Christopher. Not yet implemented.
Supersedes: the wizard-first framing in `WIZARD-TEST-PLAN.md`.
Amends: DN-13, DN-17.

## The decision

1. **`plasma-setup` is retired.** The advisor's account is created by Anaconda's user
   spoke during installation, which is what `interactive-defaults.ks` already intends
   and states in its own comments.
2. **A first-party SP+ Welcome application owns the first screen after first login**,
   in the spirit of Linux Mint's `mintwelcome`.
3. **Flathub is enabled, open**, so the Welcome screen can genuinely install applications
   with one click.

## Why the wizard goes

Two account-creation paths existed at once and contradicted each other. The kickstart
says "the person installing creates their own user in the installer's user spoke, the
same as any other operating system." The KDE Containerfile says `plasma-setup` "is the
only path by which the advisor's account comes into existence" and "must never be
removed." Both could not be true. Christopher created his account in Anaconda's user
spoke on cycle34 and the install completed, which settles it: the Containerfile comment
is stale and `plasma-setup` is not load-bearing.

The cost of keeping it is already measured. Cycles 26 and 27 were spent trying to change
one string — the wizard's "Welcome to Plasma Desktop" headline, which is compiled into
its QML with no configuration key. That required a gettext catalogue, then an en_GB
locale trick because ki18n treats en_US as its untranslated source, then the discovery
that the wizard is not even a child of `plasma-setup.service` but is started by
`/usr/libexec/plasma-setup-bootutil` as uid 968 under autologin, so a systemd
`Environment=` drop-in could never reach it. That is three cycles spent rebranding
someone else's wizard.

SP+ is judged on how the installed system operates. The first screen an advisor ever
sees is the highest-leverage surface in the product, and it should be ours.

## What SP+ Welcome must cover

Christopher's scope, in his words, is "all the things that are important to an advisor
and their team." Concretely, the first version covers:

- **Optional application installs**, one click each. Bitwarden and Tailscale are the
  named examples.
- **Fin setup**, including the API key. This is currently DN-25 and the weakest moment
  in the whole first run.
- **Orientation for a first-timer**: what this machine is, what is safe to do, where
  things live. This is the orientation layer Christopher wanted built on top of a
  settled first-run flow.
- **Printer and email setup**, the two things an advisor hits on day one and which
  `/techhelp` currently only catches after they have already gone wrong.
- **Account connections**: Google Workspace, Microsoft 365, and the other accounts an
  advisory practice runs on.

## The constraint that shapes the catalogue

`/usr` is read-only. Nothing installs at runtime the ordinary way. The catalogue
therefore contains two mechanically different kinds of entry, which must look identical
to the advisor:

| Kind | Mechanism | Example |
|---|---|---|
| GUI application | Flatpak from Flathub, installed at runtime, no reboot | Bitwarden (`com.bitwarden.desktop`) |
| System service | Baked into the image at build time; Welcome only enables and configures it | Tailscale (needs a root daemon and TUN; cannot be installed at runtime) |

The advisor clicks one button in both cases. Internally one is `flatpak install` and the
other is `systemctl enable --now` plus a login step. **Any daemon-shaped component must
be identified before the build that ships it**, because adding one later costs a whole
image cycle.

**Corrected 2026-08-27.** That paragraph originally read "the image today ships no
flatpak, no Flathub remote, no Tailscale and no Bitwarden. All of that is new work." Half
of it was wrong. Verified against `localhost/sp-plus-kde:spike`:

| Component | Actual state |
|---|---|
| `flatpak` | **already present**, 1.18.1 |
| `plasma-discover` | **already present**, 6.7.4 |
| `plasma-discover-flatpak` | **already present**, 6.7.4 |
| Flathub remote | **missing** — `flatpak remotes` returns nothing |
| PySide6 | **already present**, 6.11.1 — so SP+ Welcome itself needs no new runtime |
| Tailscale, Bitwarden | genuinely absent |

So the software-store half of this decision needs **no rebuild at all**: Discover is
installed with a working Flatpak backend and simply has no source of applications. One
`flatpak remote-add --if-not-exists flathub https://dl.flathub.org/repo/flathub.flatpakrepo`
completes it, and Welcome can do that at runtime. The lesson repeats one already recorded
in this project: assert what the image contains before writing down that it does not.

## Recorded tension, accepted

Christopher chose **open Flathub** over a curated allowlist, having been shown the
tradeoff. This puts unvetted third-party applications within reach on a desk that serves
a regulated practice, and it sits in tension with the standing rule that anything
shipping in SP+ must be well maintained. The containment argument is architectural: the
OS is immutable, a Flatpak is sandboxed, and `bootc rollback` remains available. Noted
here so the decision is visible later rather than rediscovered.

## Consequences for existing work

- `WIZARD-TEST-PLAN.md` is superseded as a plan. Its **evidence** stays valuable: the
  questions about whether `/etc/skel` reaches the home directory, whether the account
  lands in `wheel`, and whether `spplus-first-login` runs are all still live and are now
  questions about an Anaconda-created account instead.
- The gettext catalogues and locale drop-ins that exist only to rebrand `plasma-setup`
  can be removed with it. `/etc/locale.conf` must stay: cycle27 proved
  `fedora-kinoite:44` ships none, so without it every process starts in the C locale.
- DN-17 ("the first screen an advisor ever sees") is not cancelled. Its subject changes
  from the KDE wizard to SP+ Welcome.

## Network share drives and remembered passwords

Added 2026-08-27 at Christopher's direction: the Welcome screen must walk the advisor
through connecting to a shared network drive, and must save the password so it is not
re-entered after every reboot.

### What the image already has, verified against `localhost/sp-plus-kde:spike`

| Component | Status |
|---|---|
| `cifs.ko` kernel module | present (`kernel/fs/smb/client/cifs.ko.xz`) |
| `cifs-utils` (`mount.cifs`, `cifscreds`) | 7.6-2.fc44 |
| `samba-client` (`smbclient`) | 4.24.6-1.fc44 |
| `kio-extras` (`smb.so`, so Dolphin browses `smb://`) | 26.08.0-1.fc44 |
| `keyutils` | 1.6.3-7.fc44 |
| `avahi` | 0.9~rc2-8.fc44 |
| `kwalletd6` + `pam_kwallet5.so` | present on the installed system |

Nothing about mounting a share is blocked. Mounting works today; only the guided
experience is missing.

### The one gap that needs a build

**`wsdd` was not installed. It is now — added 2026-08-27, staged for cycle35.**

Modern Windows and NAS devices are discovered by WS-Discovery; the old NetBIOS browsing
that `smbclient -L` relies on is disabled by default on current Windows. Without `wsdd` the
advisor cannot be shown a list of shares on their office network and must type a server
name or IP, which is exactly the kind of thing this product exists to avoid.

`wsdd` 0.8-6.fc44 is now installed and enabled in the KDE Containerfile, with a drop-in
that corrects two things about the shipped unit:

- **`BindsTo=smb.service` is cleared.** Upstream assumes wsdd runs beside a Samba *server*.
  SP+ is a client and ships no `smb.service`, so the unit as shipped could never start —
  it would sit failed and the advisor would see no shares and no explanation.
- **Host mode is turned off.** Upstream defaults to advertising this machine to the whole
  network. An advisor's laptop holding client records should not announce itself; SP+ wants
  to look, not to be looked at. The options are `--discovery --no-host --listen
  127.0.0.1:5357`, so the result socket is on loopback and firewalld needs no new rule.

One bug was found and fixed during verification and is worth recording, because it fails
silently in the worst possible direction: the `Environment=` value **must be quoted**.
Unquoted, systemd splits on spaces, reports `Invalid environment assignment, ignoring:
--no-host`, discards everything after the first token, and wsdd comes up in **host mode** —
advertising the advisor to the office network, which is precisely the outcome the flag
existed to prevent. `systemd-analyze verify` catches it; a build gate grepping for the
string would not.

Still unverified at runtime: that the empty `BindsTo=` reset actually makes the unit
startable on a booted machine. It is documented systemd behaviour and `systemd-analyze
verify` is silent, but nothing has yet watched `wsdd.service` reach `active` on real
hardware. The cycle35 lane test must assert that.

### The mechanism, and why

Two routes exist and they behave differently for a non-technical user:

1. **Dolphin `smb://` with the password saved in KWallet.** Per-user, no root. But it only
   exists inside Dolphin's network view, and the wallet must be unlocked. Applications that
   open a plain file path will not see the share.
2. **A real system mount** — an `/etc/fstab` or systemd `.mount` entry using
   `credentials=` pointing at a root-only file. The share becomes an ordinary folder that
   every application sees, and it is present at every boot with nothing typed.

**Route 2 is the product answer.** An advisor should see a folder, not a protocol. The
Welcome screen collects the server, share, and credentials once, writes
`/etc/sp-plus/shares/<name>.cred` mode `0600` root-owned, adds the mount, and drops a
Dolphin bookmark plus a desktop shortcut so the share is visible where they already look.
`/etc` is writable and per-machine on a bootc system, so this survives upgrades and
`bootc rollback` alike.

Route 1 should still work, and `pam_kwallet5` should auto-unlock the wallet at login so
that saved `smb://` credentials in Dolphin do not prompt either. The two are complementary:
the mount is for the advisor's daily folder, the wallet is for ad-hoc browsing.

### Recorded security consequence

The share password is stored in cleartext in a root-only file. Two mitigations are real:
the disk is LUKS-encrypted at rest, and the file is `0600` root-owned. One caveat is not
mitigated and is recorded here deliberately: SP+ grants `%wheel ALL=(ALL) NOPASSWD: ALL`,
so anyone at an unlocked session can read that file. This is the same tradeoff already
accepted in `sudoers-sp-plus`, now with a stored network credential behind it. If that
becomes unacceptable, the sudoers decision is the thing to revisit, not the mount.

## The "Choose the look" screen, specified

Added 2026-08-27 at Christopher's direction: *"Choose the look should center around Global
themes with options to change some things like back ground and colors palets."*

The screen has a primary and a secondary, and they are deliberately unequal.

**Primary — the global theme.** This is the unit of choice and it dominates the screen. A
gallery of real desktop previews chosen by picture rather than by name: the advisor does not
know what "Breeze Dark" means, but knows which one they like. SP+ Calm (Dark) is preselected
and visibly recommended, per DN-27. Choosing a theme is one click and completes the screen on
its own.

**Secondary — adjustments inside that choice.** Wallpaper and colour palette, presented as
tuning the theme already picked rather than as rival decisions. Visually subordinate, never
required, and the screen must read as finished before they are touched.

Two mechanics follow from that ordering:

- **Adjustments reset when the theme changes.** Selecting a different global theme returns the
  wallpaper and palette to that theme's own defaults. Carrying a previous theme's wallpaper
  across is precisely how a desktop ends up looking half-applied, which is the failure DN-24
  exists to prevent.
- **Previews must be honest.** Applying a look-and-feel on Plasma 6 is asynchronous, and the
  call returning success is not evidence it applied. Read the config back before showing any
  success state. This is the same lesson `spplus-first-login` already had to learn about the
  wallpaper on cycle32.

## Standing layout constraint: no scrolling

Also added 2026-08-27, and it governs every screen rather than this one:

> "we need to eliminate the need to scroll. everything needs to sit in one page"

Every screen must fit a single viewport with no scrollbar and nothing below the fold. A
first-time Linux user does not know that hidden content exists, so anything requiring a scroll
is invisible to exactly the person the application was built for. A screen that does not fit is
fixed by cutting content, by composing horizontally, or by disclosing detail in place -- never
by growing taller, and never by shrinking type below comfortable reading size. The target is a
full, balanced single viewport: neither sparse nor long.

The acceptance test is measured, not eyeballed: `scrollHeight` must equal `clientHeight` at
1366x768, the smallest realistic advisor laptop and the case most likely to overflow. A
screenshot alone is not proof, because a tall window hides the overflow a normal one reveals.
