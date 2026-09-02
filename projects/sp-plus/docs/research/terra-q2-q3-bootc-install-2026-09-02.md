# SP+ Q2/Q3 research — bootc install payload and OCI byte recovery

**Scope:** Q2 and Q3 only. Read-only research; no product files changed.  
**Research date:** 2026-09-02 UTC. Source claims below are version-sensitive: verify the versions *inside the shipped installer* before acting (`bootc --version`, `rpm -q ostree containers-common anaconda`). Current upstream snapshots inspected were bootc `98bc78d` (2026-09-01), libostree `1d5a312` (2026-08-25), Anaconda `879fab1` (2026-09-01), containers/image `df7e80d` (2025-08-29), and image-builder `45b4eb7` (2026-08-31).

## Direct verdict

The **73 s/GB model is not a model of disk writes** and should not drive a compression decision. It divides a wall-clock interval containing source-squashfs reads/decompression, OCI/container-storage streaming, tar parsing, hashing and OSTree object creation, temporary checkouts/merge, deployment checkout, SELinux work, bootloader work, and final flushes by one non-equivalent byte count. It can describe this one benchmark only; it cannot predict a size change or distinguish CPU from I/O.

The **same-layer cleanup premise is correct for content first created in that layer**. It is not a solution for content inherited from Fedora base layers, nor for a temporary `COPY` that is already its own layer. Do not broadly merge unrelated `RUN`s: that makes OCI update blobs larger when any constituent change occurs.

The single highest-value next move is **one instrumented baseline install**, not a compression rebuild. It establishes whether to pursue byte recovery, source squashfs decompression, dm-crypt/target I/O, or metadata/SELinux work. No upstream profiling supplies defensible percentage shares for this 414.5 s path.

---

## Q2 — what “Deploying image” actually contains

### 1. Boundary of the measurement — documented

Anaconda’s bootc task reports “Deploying image” while it executes one external process:

* **Implementation:** Anaconda `pyanaconda/modules/payloads/payload/rpm_ostree/installation.py`, lines 797–894 at `879fab1`  
  https://github.com/rhinstaller/anaconda/blob/879fab16ea4d61cefeff7fcbd8941e9d2f4ef7a3/pyanaconda/modules/payloads/payload/rpm_ostree/installation.py#L797-L894
* Exact implementation facts: `_parse_bootc_output()` reports `"Deploying image: {}"`; `run()` builds `bootc install to-filesystem ... --source-imgref=... --target-imgref=... <physroot>` and consumes its output with `execReadlines`.

Therefore the displayed 0–100% interval is **not a “write to ext4” timer**. It includes all work in that `bootc` child and excludes Anaconda tasks before/after it. The external installer owns LUKS/LVM creation; bootc is handed the already mounted physical root. This matches the bootc manual: “the root filesystem … [is] prepared and mounted by an external tool or script.”

* **Source:** bootc `bootc-install-to-filesystem(8)`  
  https://bootc-dev.github.io/bootc/man/bootc-install-to-filesystem.8.html
* **Exact quote:** “The root filesystem alongside any necessary platform partitions … are prepared and mounted by an external tool or script.”

### 2. Documented current bootc path

The following are real stages in current upstream code. They are **not measured proportions** for SP+; the versions in the ISO decide whether exact details match.

| Stage | Evidence | Consequence |
|---|---|---|
| Source selection and container fetch | `install_container()` selects the source. For an installer running from container storage it uses `containers-storage`; code comment says the install source is “today always containers-storage.” | Identify the actual `--source-imgref`; this determines whether OCI blob compression is even on the hot path. |
| Per-layer import | `ImageImporter::import()` fetches missing base/derived layers. For each derived layer it calls `fetch_layer()` and `write_tar()`; then writes a merge commit. | This is stream read/decompression, tar parsing, object checksums/xattrs, object/metadata writes, and layer merge—not a single sequential target write. |
| Temporary tree/merge | `write_merge_commit_impl()` checks out the base and each layer into a temporary repo directory with `UnionFiles`/whiteouts, then `write_dfd_to_mtree()` and writes the merge commit. | Lots of pathname, inode, xattr, and SHA work. A first install gets no existing layer cache. |
| Deployment | `container::deploy::deploy()` calls `sysroot.deploy_tree_with_options()` then `simple_write_deployment()`. libostree bare repositories use hardlinks for checkouts where possible, with copy fallback controlled by repository/check-out mode. | “Hardlink farm” is broadly right, but it still traverses all entries, creates directories/links/metadata, and can fall back. It is not free. |
| SELinux | Imported derived layers are passed `selinux: true`; merging derived layers builds a policy modifier. bootc then says it performs a “full SELinux relabeling of physical root”; its own comment says files already labelled are skipped. | There can be policy lookups, xattr writes, and recursive walks. Do not assume `restorecon` is a separate post-install-only phase. |
| Boot loader and finalization | bootc invokes bootupd after deployment. `finalize_filesystem()` runs `fstrim`, `mount -o remount,ro`, then `fsfreeze -f/-u` (except VFAT). | Target durability/flush time is explicitly part of the child’s elapsed time. |

**Primary implementation URLs and exact supporting text/paths**

1. bootc install source, `crates/lib/src/install.rs#L1050-L1099`  
   https://github.com/bootc-dev/bootc/blob/98bc78d441bc620201b598e44db88e28c8640d10/crates/lib/src/install.rs#L1050-L1099  
   Exact comment: “Since this is an install path, we don't need to fsync() individual layers.” The code calls `repo.set_disable_fsync(true)` before pull and re-enables it afterwards. This disproves any claim that per-object fsync alone explains the whole install, while leaving final journal/writeback costs real.
2. Layer import, `crates/ostree-ext/src/container/store.rs#L1448-L1607`  
   https://github.com/bootc-dev/bootc/blob/98bc78d441bc620201b598e44db88e28c8640d10/crates/ostree-ext/src/container/store.rs#L1448-L1607  
   Exact code/comments: “First download all layers for the base image … we need the SELinux policy to label all following layers”; derived layers call `fetch_layer`, then `crate::tar::write_tar`; finally `write_merge_commit_impl` is spawned.
3. Merge/checkouts, `store.rs#L1207-L1340`  
   https://github.com/bootc-dev/bootc/blob/98bc78d441bc620201b598e44db88e28c8640d10/crates/ostree-ext/src/container/store.rs#L1207-L1340  
   Exact paths: `repo.checkout_at()` for base and each layer, `repo.write_dfd_to_mtree()`, `repo.write_mtree()`, `repo.write_commit_with_time()`.
4. Initial deployment, `crates/ostree-ext/src/container/deploy.rs#L57-L145`  
   https://github.com/bootc-dev/bootc/blob/98bc78d441bc620201b598e44db88e28c8640d10/crates/ostree-ext/src/container/deploy.rs#L57-L145  
   Exact path: `sysroot.deploy_tree_with_options()` followed by `sysroot.simple_write_deployment()`.
5. libostree repository semantics, `src/libostree/ostree-repo.c#L83-L97`  
   https://github.com/ostreedev/ostree/blob/1d5a312a3189b0fbd70fe6769aadb19a366fedb2/src/libostree/ostree-repo.c#L83-L97  
   Exact quote: “content files are represented exactly as they are, and checkouts are just hardlinks.” Checkout code uses `linkat()` and explicitly documents copy fallback for `EMLINK`, `EXDEV`, and `EPERM`: `ostree-repo-checkout.c#L440-L930`.
6. SELinux and finalization, `install.rs#L1998-L2117` and `#L1410-L1443`  
   https://github.com/bootc-dev/bootc/blob/98bc78d441bc620201b598e44db88e28c8640d10/crates/lib/src/install.rs#L1998-L2117  
   https://github.com/bootc-dev/bootc/blob/98bc78d441bc620201b598e44db88e28c8640d10/crates/lib/src/install.rs#L1410-L1443  
   Exact comments: “full SELinux relabeling … files that are already labeled … are skipped”; finalization “trims, flushes, and freezes the filesystem.”

### 3. Source compression: the crucial conditional

**Documented image-builder behavior:** Generic ISO builds turn the installer container into `/LiveOS/squashfs.img`; if the payload reference is supplied, it is copied from host container storage to `/var/lib/containers/storage` *inside that squashfs*.

* **Source:** image-builder ISO documentation, current at `45b4eb7`  
  https://github.com/osbuild/image-builder/blob/45b4eb7b2d22287fe6c68249e7ad8059b73dd397/doc/20-advanced/20-bootc/10-isos.md#L5-L18
* **Exact quotes:** “The container image is converted to a `squashfs` filesystem and put into `/LiveOS/squashfs.img`”; “the container reference is copied from the hosts container storage to `/var/lib/containers/storage` in the squashfs filesystem.”
* **Implementation:** generic ISO currently sets `img.RootfsCompression = "zstd"` and `RootfsType = Squashfs`:  
  https://github.com/osbuild/image-builder/blob/45b4eb7b2d22287fe6c68249e7ad8059b73dd397/pkg/distro/generic/bootc_imagetype.go#L489-L499

**Documented containers-storage behavior:** bootc’s fetch code says: “Both containers-storage and docker-daemon store layers uncompressed in their local storage, even though the manifest may indicate they are compressed.”

* **Source:** `crates/ostree-ext/src/container/unencapsulate.rs#L208-L238`  
  https://github.com/bootc-dev/bootc/blob/98bc78d441bc620201b598e44db88e28c8640d10/crates/ostree-ext/src/container/unencapsulate.rs#L208-L238

**Inference, high confidence if SP+ uses the embedded local reference:** OCI gzip-versus-zstd level will not materially reduce bootc’s layer-decompression CPU during this ISO installation, because the local containers-storage transport hands it uncompressed layer data. The source *squashfs zstd* still must be read/decompressed to obtain those files. Thus “change payload OCI compression” and “change ISO squashfs compression” are different experiments; the first is likely a false lever for an embedded payload.

**Mandatory verification:** capture the exact command from `/tmp/anaconda.log`/`program.log` and inspect the generated kickstart for `bootc --source-imgref`. If it is `containers-storage:` (or an embedded local transport), the inference applies. If it is `registry:`, `oci:`, or `oci-archive:`, it does not; then normal OCI decompression is in the hot path.

### 4. zstd and zstd:chunked — support does not establish a win

OCI formally defines both `application/vnd.oci.image.layer.v1.tar+gzip` and `...+zstd`; each is a tar changeset.

* **Source:** OCI Image Spec, `layer.md`  
  https://github.com/opencontainers/image-spec/blob/main/layer.md
* **Exact quote:** “The media type `application/vnd.oci.image.layer.v1.tar+zstd` represents an `application/vnd.oci.image.layer.v1.tar` payload which has been compressed with zstd.”

Current bootc’s generic decompressor accepts `ImageLayerZstd`, `ImageLayerGzip`, and uncompressed; its comment explicitly handles trailing “zstd:chunked layers … metadata/skippable frames.”  
https://github.com/bootc-dev/bootc/blob/98bc78d441bc620201b598e44db88e28c8640d10/crates/ostree-ext/src/generic_decompress.rs#L108-L157

containers/image defines zstd:chunked as “a Zstd compression with chunk metadata which allows random access to individual files.”  
https://github.com/containers/image/blob/df7e80d2d19872b61f352a8a182ec934dc0c2346/pkg/compression/compression.go#L20-L44

But zstd:chunked’s point is partial/range retrieval. An offline ISO install that imports the whole OS must read and process essentially every file; it is **not a reason to expect a payload-install win**. It adds format/toolchain compatibility risk and can worsen ISO size or CPU. Also, containers/image refuses/degenerates the combination with *OCI layer encryption* because arbitrary encrypted range access is unsupported; that is separate from LUKS target encryption.

* **Source:** `containers/image/copy/single.go#L154-L172`  
  https://github.com/containers/image/blob/df7e80d2d19872b61f352a8a182ec934dc0c2346/copy/single.go#L154-L172
* **Exact quote:** “zstd:chunked can only usefully be consumed using range requests of parts of the layer”.

**Recommendation:** do not change OCI compression first. First prove the source transport and measure CPU/iowait. If it is a remote/compressed source and CPU is saturated with little target-device queueing, test *plain* zstd at a lower level against current gzip using identical manifest content and a full install/update test. Do not start with zstd:chunked.

### 5. LUKS/dm-crypt

**Documented:** dm-crypt is transparent block encryption using the kernel crypto API; default workqueue behavior balances encryption work automatically. `/proc/crypto` lists loaded crypto modes.  
https://docs.kernel.org/admin-guide/device-mapper/dm-crypt.html

**Exact quotes:** “provides transparent encryption of block devices using the kernel crypto API”; for `same_cpu_crypt`, “The default is to use an unbound workqueue so that encryption work is automatically balanced between available CPUs.”

No upstream document gives a universal “LUKS adds N%” number. That number varies with cipher, CPU instructions/implementation, core count, request mix, target device, and VM CPU flags. `cryptsetup benchmark` is useful only as a clue: its upstream manual explicitly says, “This benchmark uses memory only and is only informative. You cannot directly predict real storage encryption speed from it.”  
https://man7.org/linux/man-pages/man8/cryptsetup-benchmark.8.html

**Inference:** 2012 hardware without usable AES acceleration can be substantially worse and can make dm-crypt CPU-bound; hardware year is not enough to classify it. Verify `grep -w aes /proc/cpuinfo` and inspect `/proc/crypto` in each target. Do **not** weaken, remove, or tune away encryption from the shipping configuration. A disposable A/B install to otherwise identical unencrypted ext4 is a legitimate *measurement control*, not a product proposal; it measures the ceiling attributable to dm-crypt. Keep LUKS in the shipped path.

Do not pre-emptively set dm-crypt `same_cpu_crypt`, `high_priority`, or `no_*_workqueue`. The kernel documentation says these trade throughput/latency/concurrency and responsiveness. Make one measured change only if dm-crypt is proven limiting.

### 6. SELinux: likely measurable, not safely removable

Current bootc actively labels derived-layer content and does a final recursive physical-root pass. That means “pre-label the OCI image and skip relabel” is **not a documented bootc optimization switch**. In fact, the merge code deliberately creates a policy modifier when there are derived layers; source comments say it must “relabel everything” if such layers could contain custom policy.

* **Source:** `store.rs#L1280-L1308`  
  https://github.com/bootc-dev/bootc/blob/98bc78d441bc620201b598e44db88e28c8640d10/crates/ostree-ext/src/container/store.rs#L1280-L1308
* **Exact quote:** “If we have derived layers, then we need to handle the case where the derived layers include custom policy. Just relabel everything in this case.”

**Recommendation:** time it before optimizing it. `--disable-selinux` / `inst.selinux=0` is explicitly outside SP+ constraints. Do not hand-apply labels or delete policy/xattrs. A source-version upgrade might improve this path, but only benchmark the exact pinned installer/image-builder/bootc set; this code is evolving.

### 7. Instrumentation that works with serial console and persisted logs

#### Capture without changing installer semantics

1. Boot with `console=ttyS0,115200 inst.notmux` (adapt device/baud) and retain normal graphical/text choices as needed. Anaconda docs: `console=` selects serial and “Implies `inst.text`”; `inst.notmux` makes output usable for automation.  
   https://anaconda-installer.readthedocs.io/en/latest/user-guide/boot-options.html#console  
   https://anaconda-installer.readthedocs.io/en/latest/user-guide/boot-options.html#inst-notmux
2. Add `inst.syslog=<collector>:514` where network is available, or `inst.virtiolog=org.fedoraproject.anaconda.log.0` in QEMU. The latter is the better no-network VM path.  
   https://anaconda-installer.readthedocs.io/en/latest/user-guide/boot-options.html#inst-syslog
3. Keep normal log saving enabled. Fedora documents `/tmp/anaconda.log`, `/tmp/storage.log`, `/tmp/program.log`, `/tmp/syslog`, and after successful install copies them to `/var/log/anaconda/`.  
   https://docs.fedoraproject.org/en-US/quick-docs/anaconda-logging/
   Exact quote: “After every successful installation, anaconda logs are copied into `/var/log` on the system you just installed.”
4. Set `RUST_LOG=debug` only for a diagnostic run if you can inject the environment into Anaconda’s bootc child (e.g., an installer-only updates image/wrapper). bootc’s tracing helper states, “Always add the stdout/stderr layer for `RUST_LOG` support”; root INFO logs also go to journal.  
   https://github.com/bootc-dev/bootc/blob/98bc78d441bc620201b598e44db88e28c8640d10/crates/utils/src/tracing_util.rs#L5-L40
   This is diagnostic-only: verbose logging can perturb a 414 s benchmark.

#### One baseline experiment (recommended)

Use a kickstart `%pre` diagnostic helper that starts before storage/payload work, waits for the `bootc install` PID, and writes timestamped samples to `/tmp/spplus-install-profile/`. In `%post --nochroot`, copy that directory to `/mnt/sysimage/root/spplus-install-profile/` (or another permitted target), so it survives. Also tee start/end markers to the serial console. Do not alter the payload command, filesystem, encryption, or compression in this run.

At 1-second cadence, collect:

* `pidstat -rud -h -p <bootc-pid> 1` (CPU %, RSS, read/write rates, voluntary/involuntary context switches);
* `iostat -dx 1` for the dm-crypt mapper, LVM LV, and physical virtio/NVMe device; **do not add rates across stacked devices**;
* `vmstat 1`, `/proc/pressure/{cpu,io,memory}`, and `cat /proc/crypto | grep -A... -E 'aes|xts'` once;
* process tree and commands at start/end: `ps -eo pid,ppid,stat,etime,%cpu,%mem,args --forest`;
* target counters from `/proc/diskstats` before/after; source mount and `findmnt -T /var/lib/containers/storage`;
* `journalctl -b -o short-monotonic` after installation, plus the Anaconda logs above.

If available in the installer, run **one separate repeat** with `perf stat -p <bootc-pid>` (task-clock, cycles, instructions, context-switches, cache-misses) and, separately, `strace -f -c -p <pid>` for syscall aggregate counts. Do not combine both with a timing result; both perturb it. `strace -ttT` is diagnosis, not a performance measurement.

**Decision rules:**

* High bootc CPU, low iowait/device utilization, source mount active => source squashfs/decompression/tar/hash/metadata CPU. Profile one run further before changing compression.
* dm-crypt and lower device both saturated while bootc CPU is not => target I/O/fs/journal dominates; first quantify LUKS with the disposable A/B control.
* Small data rate but high CPU/syscalls/context switches and long `ostree`/SELinux intervals => metadata/checkout/relabel path; use bootc debug timestamps and a syscall summary.
* A long tail after source reads cease and before `Installation complete!` => deployment, bootloader, relabel, or finalization; isolate those spans from journal/debug output.

### 8. Ranked actions within constraints

| Rank | Action | Expected saving | Risk / proof of safety |
|---|---|---:|---|
| 1 | Instrument the unchanged baseline as above; record source transport and per-layer compressed/uncompressed sizes. | Not a direct time saving; prevents the wrong build cycle. | Low. Confirm same ISO digest, VM config, cache state, and serial logging only. |
| 2 | Recover derived-layer transient bytes (Q3), beginning with the largest *derived* wasted layers identified by OCI history analysis. | Unknown; do not multiply GiB by 73 s. It helps source squashfs bytes and every full offline install, but only profile tells the seconds. | Low if image boot, SELinux enforcing, desktop/product acceptance, `bootc upgrade`, and rollback are tested. |
| 3 | If source is embedded `containers-storage`, investigate ISO squashfs/source-read CPU—not OCI compression—and first check what configuration the pinned image-builder digest exposes. | Unknown. Current generic source hard-codes zstd squashfs; likely not a simple blueprint knob. | Medium: ISO compatibility/size/boot must be tested. |
| 4 | If dm-crypt is proven CPU-limiting on legacy machines, tune only after a one-variable benchmark on representative hardware. | Unknown and hardware-specific. | Medium/high. Preserve cipher/key policy and test power-loss/reboot and throughput; do not change security posture. |
| 5 | If SELinux traversal is proven material, compare a newer pinned bootc/libostree/Anaconda stack, not SELinux-off. | Unknown. | Medium: install/upgrade compatibility regression; test enforcing mode and AVCs. |

---

## Q3 — OCI byte recovery

### 1. Is “delete in the same RUN” correct?

**Yes, for content created and removed before that instruction’s filesystem changeset is committed.** OCI layers are changeset tar archives: additions/modifications are included in full; removals are whiteout entries. The specification says the resulting tar contains “only this changeset,” specifically “Added and modified files and directories in their entirety” and “Deleted files or directories marked with a whiteout file.”

* **Source:** OCI Image Spec `layer.md`, sections “Determining Changes”, “Representing Changes”, and “Whiteouts”  
  https://github.com/opencontainers/image-spec/blob/main/layer.md
* **Exact quote:** “Whiteout files MUST only apply to resources in lower/parent layers. Files that are present in the same layer as a whiteout file can only be hidden by whiteout files in subsequent layers.”

So creation and deletion within the same completed `RUN` normally leaves neither the data addition nor a needed whiteout in that layer. A deletion in a *later* `RUN` creates a small whiteout but cannot remove bytes in its parent blob.

**Important exceptions / wrong assumptions:**

* **`COPY`/`ADD` is already a distinct layer.** `COPY temp /tmp/` then `RUN use /tmp/temp && rm ...` does **not** reclaim the copied bytes. Use a builder stage and copy only final artifacts, or a builder-supported ephemeral bind/cache mount; verify the builder semantics. This is likely a major trap in a Containerfile with 103 `COPY`s.
* Cleanup only removes the bytes if the builder’s final diff truly excludes them. Inspect the final OCI image, not the Containerfile’s intent. Failed commands, caches mounted at a different path, package scripts, generated indexes, logs, and copies elsewhere are common misses.
* Deleting a file inherited from a parent is represented as a whiteout and hides it; it cannot delete the parent blob bytes. OCI explicitly limits a whiteout to lower/parent resources.
* This saves **shipped image content**, not necessarily builder cache space. Buildah/Podman/BuildKit may retain intermediate cache separately.
* An apparent “sum of layer bytes minus installed tree bytes” is an upper-bound clue, not an exact reclaimable byte count: tar headers/padding, compression basis, hardlinks, sparse/allocation versus apparent-size accounting, xattrs, and OCI whiteouts make the two totals non-comparable unless measured in one canonical method.

### 2. Base-image removals

Your reasoning is correct. The Firefox/firmware/language/font/MariaDB bytes committed by the Fedora parent image remain referenced parent OCI layers in the derived image. Removing them in SP+ creates whiteouts, not a smaller parent layer. With the stated “same Fedora-signed base” constraint, I found **no supported bootc/OSTree switch** that removes those inherited bytes from an offline payload while retaining that parent-layer lineage.

This is also consistent with bootc’s storage model: its importer caches each OCI layer as an OSTree commit and its source documentation states it “only fetch[es] layers that aren't already present.”  
https://github.com/bootc-dev/bootc/blob/98bc78d441bc620201b598e44db88e28c8640d10/crates/ostree-ext/src/container/store.rs#L1-L55

**Inference:** the ~406 MB compressed base component is not recoverable by Containerfile cleanup. Avoiding it requires one of the rejected classes of change: a different Fedora-published base/variant, a repacked/squashed/rebased base, or a different delivery artifact. Do not spend cycles trying to rearrange downstream `RUN`s to solve it.

### 3. Keep updates efficient: do not broad-squash or broad-merge

The rejection of global squashing is directionally sound. In an OCI update workflow, unchanged layer blobs are reusable; a changed/squashed monolithic blob is not. Current bootc importer documentation says each layer is cached as a separate OSTree commit and that caching provides “Incremental updates: Only changed layers are downloaded.”  
https://github.com/bootc-dev/bootc/blob/98bc78d441bc620201b598e44db88e28c8640d10/crates/ostree-ext/src/container/store.rs#L1-L55

**Correction:** do not frame this primarily as OSTree static deltas. For bootc OCI updates, the relevant normal mechanism is OCI layer/digest (and in current code diffID) reuse through the importer. Static deltas are an OSTree repository feature, but are not evidence that a squashed OCI image would receive a small network update.

**Inference:** adding cleanup to the same logical layer is good: after the one transition, future updates preserve its stable digest when its inputs do not change. Combining unrelated installs/configuration into a giant layer is bad for update efficiency: any small change changes the one large layer digest and requires its replacement. It also harms build-cache locality. The maintainable rule is **minimal semantic layers, each internally self-cleaning**—not “one RUN for the whole OS.”

### 4. Maintainable Containerfile/CI pattern

Use a house rule and an enforceable gate:

1. One logical package/content unit per `RUN`; start it with `set -euo pipefail`; install/create, validate desired output, then clean temporary/cache content before the same `RUN` exits. Do not put cleanup in a later instruction.
2. Use multi-stage builds for compilers, downloaded source trees, and generation tooling. The final stage should `COPY --from=builder` only named runtime artifacts. Never `COPY` a temporary asset into the final stage and delete it later.
3. Keep DNF cleanup adjacent to DNF. `hadolint` rule DL3040 flags “dnf clean all missing after dnf command.” It is useful but insufficient: it cannot prove arbitrary files or a prior `COPY` are recovered.  
   https://github.com/hadolint/hadolint/wiki/DL3040
4. Add a CI image audit on the **actual pushed OCI image**, not a `du` of a running container:
   * fail on a per-layer and total compressed/uncompressed size budget from `skopeo inspect --raw` / manifest descriptors;
   * run a layer-waste tool (for example `dive` CI mode) to identify bytes added then hidden; treat it as a detector, not proof;
   * retain a reviewed allowlist for intentional whiteouts of Fedora-base content; fail newly introduced large wasted *derived* content;
   * save manifest, config/rootfs diffIDs, `podman history --no-trunc`, and audit result as CI artifacts; compare to the last accepted build.
5. Add a simple source lint that rejects a final-stage `COPY` into known ephemeral paths (`/tmp`, build workdirs, DNF cache) and reject standalone cleanup `RUN rm -rf ...` unless justified. This catches the exact human regression your 2,095-line file invites.

No lint can make arbitrary shell effects impossible to get wrong. The image-level gate is the authority.

### 5. What to look for, and what not to strip

**Usually reasonable candidates, subject to product tests and legal review:** build artifacts accidentally copied to final stage; package-manager metadata/cache/logs created while composing; transient downloads; `*-devel` packages and static `.a` archives when no shipped feature compiles/links/loads them; unneeded language packs where the supported advisor locales are explicitly defined.

**Potentially useful but not blanket-safe:** man pages, info pages, docs, translations, icon caches, and font caches. They are not intrinsically required by bootc or OSTree, but can affect offline help, legal notices, localization, desktop lookup, print/font rendering, first-login latency, and accessibility. Do not claim they are free bytes. In particular preserve licences/copyright material (often `/usr/share/licenses`, sometimes package-specific documentation), and do not let a generic `/usr/share/doc` rule silently remove product/legal content.

**Do not do:**

* manually delete RPM database or random files owned by packages while leaving the package installed; use DNF transaction options/exclusions or remove the package. Otherwise `rpm -V` and future maintenance are inconsistent even if bootc itself deploys images transactionally;
* delete `/ostree`, bootc/OSTree metadata, `/usr/lib/ostree`, SELinux policy/store or security xattrs, bootloader/kernel artifacts, or runtime files merely because they are large;
* delete font/icon caches without testing first boot/login and all advisor workflows; a cache regenerated under immutable `/usr` may not be regenerable where expected;
* use `--disable-selinux`, `inst.selinux=0`, unencrypted root, or a force-squash as an “optimization” under this brief.

### 6. Concrete next Q3 measurement

For the current image, produce a table per OCI layer: compressed descriptor size, uncompressed diff size, instruction/history, added bytes, later-hidden bytes, and whether the data originated in parent or SP+-derived layer. Classify each candidate as: (A) same-layer recoverable, (B) parent-unrecoverable, (C) intentional final content, or (D) measurement artifact. Only then choose the top A candidate. The 149 MB DNF result proves the method; it does not prove the remaining 1.679 GB is similarly recoverable.

---

## Evidence limits

I found upstream documentation and source sufficient to establish the pipeline and semantics, but **no published bootc/OSTree/Anaconda profile that assigns percentage time to decompression, dm-crypt, SELinux, checkout, or bootloader for a LUKS+LVM ext4 offline bootc ISO install**. Any such percentages here would be invented. The required evidence is one instrumented SP+ baseline on the exact ISO, followed by one-variable tests.
