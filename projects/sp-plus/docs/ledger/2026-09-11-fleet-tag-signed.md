# Ledger — 2026-09-11 — the fleet tag carries a readable signature for the first time

## What changed for the fleet

`ghcr.io/secureprospective/sp-plus-kde:latest` moved from `sha256:ca2fad9e…` (built
2026-09-02, before any defense-in-depth work) to `sha256:87e7a432…`, the t29 image built
2026-09-11 11:57Z, and that digest carries a signature every SP+ machine can read.

| | Before | After |
|---|---|---|
| `:latest` digest | `ca2fad9e` | `87e7a432` |
| Fleet-readable `.sig` | none, ever | `sha256-87e7a432….sig` |
| Verified by the shipped policy | rejected | accepted |

Prior to this, the only signatures in the registry were cosign v3 bundles under suffix-less
tags. `cosign verify` passed on them and no advisor machine could read one. That is why this
is recorded as the first readable signature and not as a routine re-sign.

## Evidence

Verification was run from an **empty container store**, so the check could not be satisfied by
a cached copy, and it was mutation-tested in the same store:

```
MUTATION (old unsigned digest ca2fad9e) -> REJECTED
  Error: Source image rejected: A signature was required, but no signature exists
POSITIVE (:latest by tag)               -> ACCEPTED
  pulled ghcr.io/secureprospective/sp-plus-kde@sha256:87e7a432…
```

A gate that cannot produce a negative result is a false positive. This one produced it first.

The signing public key is byte-identical (`0130a9b2…`) on the publishing host, in
`config/containers/sp-plus-cosign.pub`, and at `/etc/pki/containers/sp-plus-cosign.pub` inside
the published image. The shipped `policy.json` uses `matchRepository`, identical in repo and
image. The verification therefore used the fleet's real key and the fleet's real rule.

## Two defects found in the publishing lane, neither yet fixed

**1. Neither podman nor skopeo had a registry credential.** Rootful podman was not logged in to
ghcr.io at all, and skopeo running as the operator had no auth file. `publish-image.sh` checks
for the signing key and for sigstore attachments but never checks that it can authenticate, so
it discovers this only part-way through a push. Both were authenticated from the existing `gh`
login, which already carries `write:packages`. No token was written to disk by hand.

**2. `publish-image.sh` pushes before it signs.** If anything fails between the push and a
successful verification, `:latest` has already moved to an image with no readable signature.
That window is not theoretical: the signing step failed on this run, for the credential reason
above, after the push had begun. It did no harm only because the push itself failed first.

The same run also hit `Copying this image would require changing layer representation, which we
cannot do: "Would invalidate signatures"`, because a verification pull had attached a signature
to the image in local storage. The script has no handling for that state.

`:latest` was therefore moved by a digest-preserving `skopeo copy` from the already-signed
digest, so the bytes that were verified are exactly the bytes the tag now serves. Every
identity check the script performs had already passed in that run and is recorded above.

**Recommended fix, not yet made:** sign and verify against the dated tag first, and move
`:latest` only by digest once verification is green. That makes the fleet tag the last thing
that moves rather than the first.

## Known dirt created

- Registry tag `:signtest` remains, pointing at the same digest as `:latest`. **Do not delete
  it by tag.** On GHCR a package version is addressed by digest and holds all of its tags, so
  deleting the tag risks removing the manifest `:latest` depends on. It is harmless; nothing
  pulls it.
- `/var/tmp/spverify/` on the Beelink: an empty root-owned store skeleton. Podman reports zero
  images and zero bytes. Removing the directory needs one `sudo rm -rf`, which Beelink sudo does
  not permit.

## Not done

Signature **enforcement** is still off. Installed machines record
`ostree-unverified-registry:` and do not consult the policy. That is the documented Phase S
bootstrap order and is the next step, not a defect. It must not be switched on until a machine
has booted an image carrying the policy.
