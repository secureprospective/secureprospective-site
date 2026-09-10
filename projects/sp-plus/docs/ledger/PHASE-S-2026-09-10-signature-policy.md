# Phase S — the signature hole, and what closing it exposed

**Built and measured 2026-09-10.** Branch `session/sp-plus-defense-in-depth`.
Doc 15 §2 is the specification. This file is the evidence.

**Status: verified in the lane, NOT yet shippable to the fleet.** One precondition
is outstanding and it is stated in §5. Shipping before it is met would stop every advisor
machine updating.

## 1. What was wrong

SP+ has signed every image it published since 2026-09-01, and no installed machine has
ever checked one. Measured on alpha4:

```
/etc/containers/policy.json  -> {"default":[{"type":"insecureAcceptAnything"}]}
/etc/pki/containers/         -> did not exist
/etc/containers/registries.d -> no ghcr.io entry
Containerfile grep for policy.json|sigstore|cosign|signedBy -> 0 matches in 2,921 lines
```

`publish-image.sh` constrains Secure Prospective's own publishing. It cannot constrain
anyone else who can write `ghcr.io/secureprospective/sp-plus-kde:latest`.

## 2. What the image now carries

| File | Purpose |
|---|---|
| `/etc/containers/policy.json` | `default: reject`, with one `sigstoreSigned` exception for the product repository |
| `/etc/pki/containers/sp-plus-cosign.pub` | the public half of the signing key |
| `/etc/containers/registries.d/ghcr-secureprospective.yaml` | `use-sigstore-attachments: true` |

bootc honours `/etc/containers/policy.json` when it fetches images. That is upstream bootc's
own documented behaviour, so there is no bootc-specific switch to set as well.

Two deviations from the reference implementation, both deliberate:

- **`containers-storage` is accepted rather than rejected.** The installer materialises the OS
  from local container storage, so a blanket reject risks breaking installation. Writing to local
  container storage already requires root.
- **`signedIdentity` is `matchRepository`.** The stricter default rejects cosign-shaped
  signatures. The residual risk is stated in §6 and is real.

## 3. The advisor's experience of a refusal

A refused update is not a network problem and must not be reported as one. `spplus-update-control`
now recognises a signature rejection and says:

> This update was refused because it is not signed by Secure Prospective. Your computer is safe
> and is still working normally, and it will keep the version it is running. It will try again on
> its own. If you keep seeing this, contact support.

**There is deliberately no way for an advisor to override this.** A control that can be talked
out of by the person being attacked is not a control. The honest position is that the machine
keeps working and stops updating, which is the failure mode we chose.

## 4. The gate

`tests/signature-policy-gate.sh`. Ten assertions against a booted machine. Nine pass.

```
  PASS  policy default is reject                 reject
  PASS  product scope present in policy          ghcr.io/secureprospective/sp-plus-kde
  PASS  signing public key installed             /etc/pki/containers/sp-plus-cosign.pub
  PASS  sigstore attachments enabled             registries.d entry present
  PASS  unlisted registry refused                rejected by policy
  PASS  unsigned image refused                   A signature was required, but no signature exists
  PASS  wrongkey image refused                   cryptographic signature verification failed
  PASS  SP+ signed image accepted                pulled and verified
  FAIL  published image signature is readable    cosign bundle format — the fleet would stop updating
  PASS  advisor sees plain english on refusal    message present in update control
```

The accepted case is signed with the **real** SP+ key and carries the **real** production
identity, so the `signedIdentity` check is exercised rather than sidestepped. Only the transport
is local.

**Two ways this gate lied before it was trusted, both caught and both instructive:**

- The three fixtures were one image pushed under three tags. Signing the accepted one signed the
  other two, because a signature binds to the manifest digest, not to the tag. Both refusal cases
  passed verification and were reported as accepted. The gate now builds three distinct images
  and asserts they have three distinct digests before it believes any refusal.
- The publish lane's verification step was `skopeo --policy ... inspect`. Measured directly:
  **`skopeo inspect` does not enforce the policy at all** and accepts a deliberately unsigned
  image without complaint. It is now `podman pull --signature-policy`, which was mutation-tested
  in both directions before being trusted.

## 5. THE FINDING — the fleet's signature is in a format the fleet cannot read

This is the reason Phase S is not shippable today, and it is exactly the bricking trap doc 15 §2
warned about, arriving from a direction nobody predicted.

**cosign v3 does not write the attachment that containers/image reads.** It publishes an OCI
referrers index pointing at an `application/vnd.dev.sigstore.bundle.v0.3+json` artifact, under a
tag with **no `.sig` suffix at all**. containers/image looks for `sha256-<digest>.sig` in the
legacy cosign layout, does not find it, and refuses the image:

```
Source image rejected: A signature was required, but no signature exists
```

Measured on the real published image:

```
cosign verify --key cosign.pub ghcr.io/secureprospective/sp-plus-kde:latest   -> PASSES
sudo podman pull ghcr.io/secureprospective/sp-plus-kde:latest (Phase S policy) -> REFUSED
GET /v2/secureprospective/sp-plus-kde/manifests/sha256-ca2fad9e....sig         -> 404
tags/list                                                                     -> sha256-ca2fad9e... (no .sig)
```

So the fleet tag **is** signed, verifiably, in a format no advisor machine can use. cosign was
checking its own homework.

`--registry-referrers-mode=legacy` does **not** fix it. Per its own help text that flag governs
*fetching* references, not writing them; signing with it produced the same suffix-less tag.

**The fix, tested and working:** sign with skopeo, which produces the format containers/image
reads, using the same key file.

```
skopeo copy --preserve-digests \
  --sign-by-sigstore-private-key $KEYDIR/cosign.key \
  --sign-passphrase-file $KEYDIR/password \
  --sign-identity "$REPO:latest" \
  "docker://$REPO@$DIGEST" "docker://$REPO:latest"
```

`--sign-identity` is not decorative. Without it the signature records whatever reference the copy
targeted, and the policy's identity check rejects it. Attachments must also be enabled **on the
publishing host** or skopeo refuses with *"writing sigstore attachments is disabled by
configuration"*; `publish-image.sh` now checks for that file and stops if it is missing.

`scripts/publish-image.sh` has been rewritten to sign this way and to verify the result the way an
advisor machine will read it.

### The precondition, and why it needs Christopher

**The published image must be re-signed in the readable format before the Phase S policy reaches
any advisor machine.** Until then, a machine running this image would refuse every update.

Re-signing adds a signature attachment to an existing published digest. It does not change the
image and does not move any tag. It is still a write to the production registry, so it is
Christopher's call, not mine.

## 6. What Phase S does not protect against

- **A compromised signing key, build host, or publish lane.** The signature says the image came
  from us. It says nothing about whether what came from us was sound.
- **Downgrade.** `matchRepository` accepts any digest ever signed for this repository, so whoever
  controls the tag can serve an older signed image. The downgrade guard in `spplus-stage-update`
  is the control that covers this, and it is a separate control that was already there.
- **A local root attacker.** Anyone who can edit `/etc/containers/policy.json`, replace the public
  key, or replace `bootc` has already won.
- **Images already pulled.** Verification happens at fetch time.
- **Rollback to an installed deployment.** Deliberately, since rollback is the recovery path.
