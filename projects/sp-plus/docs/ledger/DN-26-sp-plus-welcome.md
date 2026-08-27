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

The image today ships no flatpak, no Flathub remote, no Tailscale and no Bitwarden. All
of that is new work.

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
