# SP+ releases — channels, numbers, and how a release happens

**Ruling D-01, Christopher, 2026-08-30:** *"Alpha, Beta, Stable. The numbered
scheme will keep with the Fedora theme, round numbers with dated mile markers."*

---

## The frame this serves

*"Everything needs to update from stable, keep the user out of the loop."*

An advisor never chooses a version, never sees a changelog, and never approves an
update. That single fact determines everything below. A release is **not a build**
— it is a tag an advisor's machine already follows, and moving it is the act of
shipping.

## Channels

`bootc` follows exactly one tag and takes whatever that tag points at. So a
channel is a promise about what a machine following it will silently pull
tonight.

| Channel | Who follows it | The promise |
|---|---|---|
| `:alpha` | the Dell and our own machines | may be broken; that is what it is for |
| `:beta` | a small number of real advisor machines, opt-in | believed good, soaking on real work |
| `:stable` | every advisor by default | proven on hardware; moves only deliberately |

## Numbers — Fedora scheme

**SP+ 1, SP+ 2, SP+ 3.** A round integer. There is no 1.1 and no 1.2.3.

Semver exists to tell a developer whether an upgrade will break their code. No
advisor makes that decision, so a compatibility-encoding version would be
ceremony nobody reads. The integer says which generation of SP+ a machine is,
which is the only version question anyone will actually ask.

## Mile markers

The number says the generation; the **dated mile marker** says the exact bits.

```
sp-plus-kde:1-20260830        immutable. never moves. ever.
```

A channel tag moves, so it can never name a specific thing after the fact. The
mile marker is what a support conversation, a bug report and a rollback target
are named by. It is also what makes promotion safe: promotion retags **an existing
digest**, so what reaches an advisor is byte-identical to what soaked in `:beta`.

In `os-release` this is `BUILD_ID`, and `PRETTY_NAME` carries both:

```
VERSION_ID=1
BUILD_ID=20260830
PRETTY_NAME="SP+ 1 (20260830)"
```

Both come from build args, so a release never means editing prose in the
Containerfile:

```bash
podman build -f images/kde/Containerfile \
  --build-arg SPPLUS_RELEASE=1 \
  --build-arg SPPLUS_BUILD=$(date -u +%Y%m%d) \
  -t localhost/sp-plus-kde:1-$(date -u +%Y%m%d) .
```

`SPPLUS_BUILD` defaults to `dev`, so a local build that was never dated says
`SP+ 1 (dev)` and is obviously not a release. Verified by probe build 2026-08-30.

## How a release happens

**Nothing is ever rebuilt to be promoted.** Promotion is retagging a digest that
has already been tested.

```bash
D=$(date -u +%Y%m%d)

# 1. build once, named by its mile marker
podman build -f images/kde/Containerfile \
  --build-arg SPPLUS_RELEASE=1 --build-arg SPPLUS_BUILD=$D \
  -t sp-plus-kde:1-$D .

# 2. alpha: the Dell picks it up
skopeo copy containers-storage:sp-plus-kde:1-$D docker://<registry>/sp-plus-kde:1-$D
skopeo copy docker://<registry>/sp-plus-kde:1-$D docker://<registry>/sp-plus-kde:alpha

# 3. beta: same digest, no rebuild
skopeo copy docker://<registry>/sp-plus-kde:1-$D docker://<registry>/sp-plus-kde:beta

# 4. stable: same digest again
skopeo copy docker://<registry>/sp-plus-kde:1-$D docker://<registry>/sp-plus-kde:stable
```

`skopeo copy` between two tags in the same registry moves no layers — it writes a
manifest. Promotion is close to instant, and cannot accidentally ship different
bits from the ones that were tested.

### Gates between channels

| Move | Required before it happens |
|---|---|
| → `:alpha` | preflight green; payload verified **inside the image**; self-test passes on the Dell |
| `:alpha` → `:beta` | a human has used the changed feature on real hardware; rendered UI looked at in every state |
| `:beta` → `:stable` | soaked on a real advisor machine with no regression; **`bootc rollback` proven on that release** |

### Rolling back a bad stable

Retag the previous mile marker:

```bash
skopeo copy docker://<registry>/sp-plus-kde:1-20260815 docker://<registry>/sp-plus-kde:stable
```

Machines pick it up on their next check. This is why mile markers must never be
deleted or reused — a channel with no immutable history behind it cannot be
rolled back.

## When the integer increments

Bump to SP+ 2 when a machine's behaviour changes enough that a support
conversation needs to start with "which one are you on" — a new base Fedora, a
changed disk layout, a reworked first-run. Routine fixes ride the same integer
with a new mile marker. There is no schedule and no minor version; if the
question "should this be 2?" is genuinely arguable, it is not 2.

---

## Not yet true — do not describe any of this as working

- **`bootc rollback` has never been exercised.** Everything above assumes a bad
  `:stable` can be undone unattended. Until that is proven on hardware, the
  gates are a plan, not a safety net. **This blocks the first promotion to
  `:stable`.**
- **The ghcr package is private** (401 anonymous) and there is **no `:stable` tag**.
  Needs a push token. Blocked on Christopher.
- **Image signing is not set up.** `ostree-unverified-registry:` in
  `rpm-ostree status` today means an advisor machine takes the image on trust.
  A durable decision in its own right; not settled here.
- **`bootc-fetch-apply-updates.timer` is not enabled anywhere.** Nothing on an
  advisor machine currently follows any channel at all. Until that timer ships
  enabled and pointed at `:stable`, the update frame is a design, not a
  behaviour.
