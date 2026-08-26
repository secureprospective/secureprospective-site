# SP+ Spike A retry — 2026-08-26

- **Baton:** Bee; Spike A retry / image-conversion tooling question
- **Host:** Beelink `com`, LMDE 7, kernel `6.12.101+deb13-amd64`
- **Repository:** `session/sp-plus-plan`
- **Store:** ROOT Podman store, `GraphRoot=/var/lib/containers/storage`, `Rootless=false`
- **Prior state:** `git pull --ff-only` could not run because `session/sp-plus-plan` has no upstream tracking branch. Pre-existing untracked `grafix/hdri/` and `grafix/render/` were left untouched.
- **Verdict:** PASS for Gate 0.A

## Tool research

### Read

- The upstream osbuild deprecation notice says the standalone `bootc-image-builder` is deprecated in favor of the unified `image-builder` CLI, and directs new work to the `image-builder` package or container: <https://osbuild.org/docs/bootc/deprecation-notice/>
- The archived `bootc-image-builder` repository says it was merged into `image-builder` and archived: <https://github.com/osbuild/bootc-image-builder>
- Upstream installation documentation identifies the Fedora package as `image-builder`, installed with `sudo dnf install image-builder`, and the container as `ghcr.io/osbuild/image-builder-cli:latest`: <https://github.com/osbuild/image-builder/blob/main/doc/00-installation.md>
- Upstream usage documents bootc inputs via `--bootc-ref`, says the inputs must be in the invoking user's container storage, documents `--bootc-default-fs`, and documents `--bootc-installer-payload-ref`: <https://github.com/osbuild/image-builder/blob/main/doc/01-usage.md>
- Upstream ISO documentation says `bootc-generic-iso` is the current generic ISO image type, that `--bootc-installer-payload-ref` optionally embeds the payload in the ISO squashfs, and that `bootc-installer` makes more assumptions: <https://github.com/osbuild/image-builder/blob/main/doc/20-advanced/20-bootc/10-isos.md>
- The Fedora bootc documentation describes bootable-container conversion to disk images and links the historical `bootc-image-builder` path: <https://docs.fedoraproject.org/en-US/bootc/getting-started/>
- The current upstream source test tree contains Fedora 44 bootc test configuration and `bootc-generic-iso` image-type tests: <https://github.com/osbuild/image-builder/tree/main/test> and <https://github.com/osbuild/image-builder/blob/main/test/scripts/imgtestlib/bootcsource.py>

### Tested

The pulled current image-builder CLI was pinned by digest and reported:

```text
image-builder:
  version: "1"
  commit: 5a8232a20a8bf727a15fffb5c2d0aa11233dc26f
  dependencies:
    osbuild: "192"
```

Its live `build --help` exposed `--bootc-ref`, `--bootc-default-fs`, `--bootc-installer-payload-ref`, and `--bootc-pull-container`. The exact tested container was:

```text
ghcr.io/osbuild/image-builder-cli@sha256:55ce154eaad86a4fcd43998588ccb6e15c801d25e392dab5c8073627f22ae37e
```

The current CLI then converted the actual Fedora Kinoite-derived SP+ image to qcow2 successfully; the exact command and result are in the build attempt below. Therefore Fedora 44 support and qcow2 production are tested for this image. ISO production and the Anaconda installer flow are documented upstream but were not built in Spike A; they belong to Spike B.

## Cheap reference fix

Hypothesis: the second Spike A failure is caused by the old builder qualifying `sp-plus-kde:spike` as `docker.io/library/sp-plus-kde:spike`; passing `localhost/sp-plus-kde:spike` will resolve the image in the ROOT store. `--rootfs xfs` was retained to bypass the already-observed missing filesystem metadata and isolate the reference-resolution failure.

Command:

```sh
sudo podman run --rm --privileged --pull=newer --security-opt label=type:unconfined_t \
  -v /var/lib/containers/storage:/var/lib/containers/storage \
  -v "$PWD/projects/sp-plus/artifacts/spikeA-retry/out":/output \
  quay.io/centos-bootc/bootc-image-builder@sha256:2b52843ea2bfda73b0a08d97e76b734393b1d3a804681b9fabb26723bd3a2f0b \
  --type qcow2 --rootfs xfs --local localhost/sp-plus-kde:spike
```

Exact result: `Done generating manifest`; the builder deployed `30ac0c0c7f452c143a428b63b172a488b2cf341ce75b80ea4dafd5fab5b6d4b2`, completed the qcow2 pipeline, and saved `projects/sp-plus/artifacts/spikeA-retry/out/qcow2/disk.qcow2`. The fully qualified reference fix worked. It did not reproduce `DefaultRootFs` because this isolation command explicitly supplied `--rootfs xfs`; the prior unqualified retry's exact error remains in DN-07.

## Build attempt 1 — current image-builder

Hypothesis: the unified `image-builder` CLI, given the ROOT-store image by fully qualified local reference and an explicit filesystem, will replace the deprecated builder and produce a qcow2 from the Fedora Kinoite-derived image.

Command:

```sh
sudo podman run --rm --privileged --network host \
  --security-opt label=type:unconfined_t \
  -v /var/lib/containers/storage:/var/lib/containers/storage \
  -v "$PWD/projects/sp-plus/artifacts/spikeA-retry/image-builder-qcow2":/output \
  ghcr.io/osbuild/image-builder-cli@sha256:55ce154eaad86a4fcd43998588ccb6e15c801d25e392dab5c8073627f22ae37e \
  build --bootc-ref localhost/sp-plus-kde:spike --bootc-default-fs xfs --output-dir /output --progress verbose qcow2
```

Exact result:

```text
Image build successful: /output/bootc-fedora-44-qcow2-x86_64.qcow2
```

The build log also showed:

```text
org.osbuild.bootc.install-to-filesystem: ... {
  "target-imgref": "localhost/sp-plus-kde:spike"
}
...
org.osbuild.qemu: ... {
  "filename": "disk.qcow2",
  "format": { "type": "qcow2", "compat": "1.1" }
}
```

No second or third build attempt was needed.

## Artifact evidence

```text
localhost/sp-plus-kde                     spike       sha256:da47edacbf5f4759f7b8613f0548ea8f583f530123de3aa7536a087a8a21c6fe  30ac0c0c7f45  35 minutes ago  7.38 GB
Id=30ac0c0c7f452c143a428b63b172a488b2cf341ce75b80ea4dafd5fab5b6d4b2
GraphRoot=/var/lib/containers/storage Rootless=false
-rw-r--r-- 1 root root 3.6G Aug 26 07:37 projects/sp-plus/artifacts/spikeA-retry/image-builder-qcow2/bootc-fedora-44-qcow2-x86_64.qcow2
f9f05fb3ed51311153322cc73d859bc268e025cb2aab365f1c580b534c5ca563  projects/sp-plus/artifacts/spikeA-retry/image-builder-qcow2/bootc-fedora-44-qcow2-x86_64.qcow2
file format: qcow2
virtual size: 15.2 GiB (16364077056 bytes)
disk size: 3.57 GiB
    corrupt: false
```

Builder image evidence:

```text
Id=80c8dbae7fcc36db094ece0ed60fc88009cfafc00590cd276e31d820b594cdb5 Digest=sha256:55ce154eaad86a4fcd43998588ccb6e15c801d25e392dab5c8073627f22ae37e Created=2026-08-25 11:35:57.565452016 +0000 UTC
```

## Boot evidence

The qcow2 was booted unattended with QEMU/KVM, 4 vCPU, 8192 MiB, plain `/usr/share/OVMF/OVMF_CODE_4M.fd` and a copied plain `OVMF_VARS_4M.fd`, plus swtpm. No Secure Boot conclusion was made. QEMU reached a KDE Plasma graphical session. The screenshot is `projects/sp-plus/artifacts/spikeA-retry/qemu-screen.png`; it shows the Plasma Desktop Welcome screen with Restart and Shut Down controls, not a black screen. Serial output also reached:

```text
Fedora Linux 44.20260826.0 (Kinoite)
Kernel 7.1.10-200.fc44.x86_64 on x86_64 (ttyS0)
fedora login:
```

The guest's graphical session was observed from the QEMU framebuffer using `screendump`; `systemctl is-active graphical.target` was not run inside the guest. The graphical desktop screenshot is positive evidence that the image booted unattended to KDE, but this run makes no Secure Boot claim.

## Ledger changes

- Added `W-01` to `docs/ledger/WORKS.md`: root Podman build DNS is fixed by `--network host`.
- Added `Detect with:` to DN-02: `mokutil --sb-state`.
- Added `Detect with:` to DN-03: `bootc upgrade --check`.
- Tightened DN-04's `Do instead:` to `getenforce` with expected `Enforcing`.
- Updated DN-07 status to `RESOLVED` with a pointer to this run.
