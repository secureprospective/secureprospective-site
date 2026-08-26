# Do Not

Greppable record of approaches proven not to work. Every entry has an error signature so a future engineer can find it by searching the observed failure.

### DN-01 — Never use Docker anywhere in the SP+ build path
- **Error signature:** `image-builder` cannot read the Docker image store; the Docker-built image is not available in Podman's `containers/storage`.
- **Why:** image-builder reads Podman's `containers/storage`, while Docker maintains a separate image store. The detour cost most of the 2026-08-25 session and creates a divergent build path.
- **Do instead:** Use Podman; delete the Docker path rather than keeping a fallback.
- **Source:** docs/05-POSTMORTEM-ANTIPATTERNS-AND-BRANDING.md Part I, item 3; docs/08-BUILD-SESSION-HANDOFF.md §6
- **Status:** PROVEN

### DN-02 — Never use `OVMF_VARS_4M.fd` for a Secure Boot test
- **Error signature:** The VM boots unsigned or broken-boot-chain content and reports a confident Secure Boot pass because no keys are enrolled.
- **Why:** the plain variable store enrolls nothing, so it does not enforce the Microsoft-signed Secure Boot chain.
- **Detect with:** `mokutil --sb-state` (must return `SecureBoot enabled`; the plain variable store exposes the false pass as `SecureBoot disabled`).
- **Do instead:** Use a writable per-VM copy of `OVMF_VARS_4M.ms.fd` paired with `OVMF_CODE_4M.secboot.fd` and `-machine q35,smm=on`.
- **Source:** docs/08-BUILD-SESSION-HANDOFF.md §3
- **Status:** PROVEN

### DN-03 — Never omit `--target-imgref` from the Anaconda bootc kickstart
- **Error signature:** The machine installs perfectly and silently never updates.
- **Why:** `--source-imgref` alone identifies the installer source, not the installed system's update target; the omission can remain unnoticed for weeks.
- **Detect with:** `bootc upgrade --check` (must reach the configured update channel; the missing target leaves no usable update target).
- **Do instead:** Provide both `--source-imgref` and `--target-imgref`.
- **Source:** docs/05-POSTMORTEM-ANTIPATTERNS-AND-BRANDING.md Part II, #29; docs/08-BUILD-SESSION-HANDOFF.md §5
- **Status:** PROVEN

### DN-04 — Never let `selinux=0` leak from the installer into the installed system
- **Error signature:** `getenforce` reports `Disabled` on the installed system.
- **Why:** `selinux=0` is an installer-side workaround in the upstream image-builder example, not an installed-system setting. SP+ must remain SELinux enforcing (D22).
- **Do instead:** Run `getenforce` on the installed system; expected output is `Enforcing`. Keep `selinux=0` confined to the installer workaround, if needed.
- **Source:** docs/05-POSTMORTEM-ANTIPATTERNS-AND-BRANDING.md Part II, #34; docs/08-BUILD-SESSION-HANDOFF.md §5
- **Status:** PROVEN

### DN-05 — Never build the desktop from the minimal `fedora-bootc` base
- **Error signature:** NOT-YET-OBSERVED
- **Why:** The minimal base requires assembling the KDE desktop by hand, recreating integration maintained by Fedora's official Atomic Desktop images.
- **Do instead:** Use `quay.io/fedora/fedora-kinoite:44`, which carries `containers.bootc=1` and `ostree.bootable=true` and is rebuilt daily.
- **Source:** docs/05-POSTMORTEM-ANTIPATTERNS-AND-BRANDING.md Part I, item 1; docs/08-BUILD-SESSION-HANDOFF.md §6
- **Status:** PREDICTED

### DN-06 — Never mix Podman's ROOTLESS and ROOT image stores in one build
- **Error signature:** image-builder reports the image reference cannot be found despite `podman images` listing it.
- **Why:** On this host, `podman info` as `chris` reports GraphRoot `/home/chris/.local/share/containers/storage` (rootless), while `sudo podman` uses `/var/lib/containers/storage` (root). The image-builder invocation in `docs/03-ISO-BUILD-PLAN.md` §2.2 bind-mounts the ROOT store, so a rootless-built image is invisible to it.
- **Do instead:** Build with `sudo podman build` so the image lands in the root store that image-builder reads, and state which store you used in every ledger entry.
- **Source:** Dated host verification run, 2026-08-26; docs/03-ISO-BUILD-PLAN.md §2.2
- **Status:** PREDICTED

### DN-07 — Current pinned bootc-image-builder cannot convert this Fedora Kinoite-derived image
- **Error signature:** `failed to initialize bootc distro: missing required info: DefaultRootFs`; one explicit `--rootfs xfs` corrective attempt then returned `reference "[overlay@/var/lib/containers/storage+/run/containers/storage]docker.io/library/sp-plus-kde:spike" does not resolve to an image ID`
- **Why:** The pinned `quay.io/centos-bootc/bootc-image-builder:latest` digest did not produce a qcow2 from the exact Spike A image and command path. The first failure lacked root filesystem metadata; the only corrective attempt did not resolve the local image reference.
- **Do instead:** Do not claim the derived Fedora Kinoite desktop architecture passes until the builder/image metadata and local-reference failure are resolved in a separately authorized run.
- **Source:** `docs/ledger/runs/2026-08-26-spike-A.md`, resolved by `docs/ledger/runs/2026-08-26-spike-A-retry.md`
- **Status:** RESOLVED

### DN-08 — Do not run the current image-builder ISO pipeline rootless on this host
- **Error signature:** `chcon: failed to change context of '/var/cache/image-builder/store' to 'system_u:object_r:root_t:s0': Operation not permitted` followed by `error: entrypoint setup failed: error running chcon system_u:object_r:root_t:s0 /var/cache/image-builder/store: exit status 1`
- **Why:** The current image-builder container entrypoint unconditionally applies an SELinux context to its cache; rootless Podman cannot perform that operation, even with `--privileged` and `--security-opt label=disable`.
- **Do instead:** Run the pinned image-builder container rootful with the ROOT Podman store mounted, as specified by the brief.
- **Source:** `docs/ledger/runs/2026-08-26-spike-B.md`
- **Status:** PROVEN

## Candidates from the postmortem

See docs/05-POSTMORTEM-ANTIPATTERNS-AND-BRANDING.md Part II. Anti-patterns get promoted into this file with a DN number when a run actually proves them, not in bulk.

### DN-09 — Do NOT remove `selinux=0` from the installer kernel cmdline

**Error signature (verbatim, serial console):**
```
Unable to fix SELinux security context of /dev/kmsg: Permission denied
Failed to set up the root directory for shared mount propagation: Permission denied
Failed to allocate manager object: Permission denied
[!!!!!!] Failed to allocate manager object.
Freezing execution.
```

**Presenting symptom.** ISO boots, GRUB works, kernel and initrd load, then a Plymouth
splash spinner animates forever. Behind `rhgb quiet` there is NO error on screen.

**Detect with:** target disk stays at ~197 KB while CPU sits at 20-45%, and two
screendumps minutes apart are byte-identical. Boot with `-kernel`/`-initrd`/`-append`
and a serial console to see the actual failure.

**Why.** DN-04 correctly says `selinux=0` must not leak into the INSTALLED system. A
dispatch over-corrected it by deleting `selinux=0` from `iso.yaml` entirely. The Anaconda
installer environment genuinely requires it: without it systemd PID 1 cannot allocate its
manager object and freezes before Anaconda ever starts.

**Do instead.** Keep `selinux=0` on the installer cmdline in `installer/iso.yaml`. Keep the
kickstart free of any `selinux` directive so the installed system stays `Enforcing`. The
rule is scoped, not deleted. **Verify both ends:** the installer boots, AND `getenforce`
on the installed system returns `Enforcing` with no `selinux=0` in `/proc/cmdline`.

**Source.** Confirmed 2026-08-26 by controlled A/B direct-kernel boot: identical kernel,
initrd and ISO, the single difference being `selinux=0`. Without it, PID 1 freezes. With
it, boot reaches `basic.target` and Anaconda starts.

**Status.** FIXED — commit `a43c918`.

**General lesson.** Over-correcting a do-not can cause a worse failure than the one it
prevented. Scope a fix to where the rule actually applies.

### DN-10 — Do NOT assume installer kernel args stay out of the installed system

**THIS IS A SECURITY DEFECT, NOT A COSMETIC ONE.**

**Error signature.** On the installed system:
```
/proc/cmdline: ... boot=UUID=... selinux=0 console=ttyS0,115200 console=tty0 ostree=/ostree/boot.1/...
/etc/selinux/config: SELINUX=enforcing
getenforce: Disabled
```
`/etc/selinux/config` says `enforcing` and is IGNORED, because the kernel argument wins.

**Detect with:** `getenforce` on the INSTALLED system (must be `Enforcing`), and
`grep -w selinux=0 /proc/cmdline` (must find nothing). Also read
`/boot/loader/entries/*.conf` — the leak is visible in `options`.

**Why.** DN-04 warned this arg must not reach the installed OS. The fix applied on
2026-08-26 scoped `selinux=0` to the installer cmdline in `iso.yaml` and left the kickstart
free of any `selinux` directive, on the assumption that this was sufficient. **It was not.**
Anaconda/bootc COPIES THE INSTALLER'S KERNEL COMMAND LINE into the generated ostree
bootloader entry. `console=ttyS0,115200 console=tty0` leaked by the same mechanism, proving
it is the general behaviour and not specific to SELinux.

**Consequence.** SP+ shipped with SELinux fully disabled while its own config file claimed
enforcing. For a product holding client financial data this would be a serious finding in
any security review, and it is invisible to anyone who trusts `/etc/selinux/config`.

**Do instead.** Explicitly control the installed system's kargs. Options, to be decided:
strip in `%post` (`grubby --update-kernel=ALL --remove-args="selinux=0 console=ttyS0,115200"`),
or pass explicit kargs to `bootc install`. **Whichever is chosen, the gate is empirical:**
`getenforce` on the installed system must return `Enforcing`.

**Status.** OPEN — found 2026-08-26 at the first QEMU field inspection.

**Meta-lesson.** The morning's fix was declared correct on the strength of a reasonable
mechanism ("the kickstart has no selinux directive"). The claim was never tested on an
INSTALLED system because no installed system existed yet. A fix is not verified until it is
observed in the environment it targets. See OP-02 — this time the unverified causal story
was the head brain's own.

### DN-11 — An interactive install SILENTLY DISCARDS kickstart partitioning

**Error signature.** Installed system, expected LUKS2 on root + `/var/home` per D34:
```
NAME   TYPE FSTYPE  SIZE MOUNTPOINT
vda1   part vfat    600M /boot/efi
vda2   part ext4      2G /boot
vda3   part btrfs  57.4G /var/home
```
`lsblk -o FSTYPE | grep -c crypto_LUKS` returns **0**. NO ENCRYPTION ANYWHERE.

**Detect with:** `lsblk -o NAME,TYPE,FSTYPE` and `cryptsetup luksDump` on each partition.
Never infer encryption from the kickstart source — read the installed disk.

**Why.** `interactive-defaults.ks` supplies DEFAULTS for an interactive install. When the
operator walks the storage screens and accepts automatic partitioning, Anaconda's own
scheme replaces the kickstart's `part ... --encrypted --luks-version=luks2` lines entirely.
The result was btrfs, a single data partition, and no encryption. No warning is shown.
The declared `ext4` layout and the separate `/var/home` partition were also discarded.

**Consequence.** D34 (LUKS2 on root + all user data) was silently violated, and this is
exactly the property most likely to be assumed rather than checked.

**Do instead.** For an appliance-style product, do NOT rely on an operator choosing
correctly in an interactive storage screen. Either ship a NON-interactive kickstart that
fully declares partitioning (with `--encrypted` and an interactive passphrase prompt), or
verify the resulting layout on every single install. **Encryption is a gate, not a default.**

**Status.** OPEN — found 2026-08-26. Relates to T-08.

### DN-12 — Manual `part` commands keep the graphical storage spoke incomplete

**Error signature (verbatim, graphical hub):**
```
Installation Destination
Custom partitioning selected
Please complete items marked with this icon before continuing to the next step.
```

**Observed.** Cycle 1 supplied a complete manual encrypted layout and did not open the
storage spoke. Anaconda still classified it as custom, displayed the warning triangle,
and disabled `Begin Installation`. The kickstart's declared layout was therefore not
enough to make an interactive install proceed unattended.

**Detect with:** Take a screendump of the INSTALLATION SUMMARY before pressing Begin
Installation and inspect the Installation Destination tile and its button state.

**Do instead.** Use `autopart` with a runtime `ignoredisk --only-use=` selection. Do not
walk the storage screen; the product policy is automatic partitioning, not custom layout.

**Status.** FIXED in cycle 2 by replacing manual `part` commands with `autopart`.

### DN-13 — `rootpw --lock` leaves the graphical root spoke incomplete

**Error signature (verbatim, graphical hub):**
```
Root Account
Root account is disabled
```

**Observed.** Cycle 1 explicitly supplied `rootpw --lock`, but the graphical hub still
showed the warning and disabled `Begin Installation`. Locking root is not treated as a
settled root-account choice in this interactive flow.

**Detect with:** Take a screendump of the INSTALLATION SUMMARY and inspect the Root
Account tile; its warning triangle must be absent before Begin Installation is enabled.

**Do instead.** Generate an unusable random crypt root hash in `%pre` and provide it via
`rootpw --iscrypted`; do not put a known password in the repository or image.

**Status.** FIXED in cycle 2 by configuring `rootpw --iscrypted` from a random hash.

### DN-14 — The first test-only crypt hash did not authenticate the provisioned user

**Error signature (verbatim, installed tty):**
```
fedora login: advisor
spPassword:
Login incorrect
```

**Observed.** Cycle 3 reached the installed Plasma session and the `advisor` account was
present, but the crypt-form user password supplied in the kickstart did not authenticate
at the serial TTY. This blocked running the root-required field inspection harness through
that console. The failure did not affect LUKS unlock or graphical session startup.

**Detect with:** On the installed system, switch to tty2, log in as the provisioned user,
and require a shell prompt before running `field-inspect.sh`.

**Do instead.** For the throwaway QEMU inspection VM only, use the explicit test password
in the kickstart and replace it with the product credential flow before release. The LUKS
passphrase remains separately prompted and is not stored anywhere in the product.

**Status.** FIXED in cycle 4 for the throwaway test path by using the plaintext test
credential; this must not be treated as a release credential.

### DN-12 — `grubby` does NOT exist in a bootc image; a `%post` guard on it silently voids the whole block

**Error signature.** None at install time. The install reports SUCCESS. On the installed system:
```
CMDLINE:  selinux=0
ENFORCE:  Disabled
GRUBBY:   MISSING
ls: cannot access '/var/home/advisor': No such file or directory
```
and the graphical login LOOPS — SDDM accepts the correct password, then returns to the
greeter, because Plasma cannot start a session without a home directory. `login` on a text
VT succeeds but reports:
```
-- advisor: /var/home/advisor: change directory failed: No such file or directory
Logging in with home = "/".
```

**Detect with:** on the installed system, `command -v grubby` (expect MISSING on bootc),
`grep -o selinux=0 /proc/cmdline`, `getenforce`, and `ls -ld /var/home/<user>`.
**A login loop with a CORRECT password is a missing/unwritable home directory until proven
otherwise.**

**Why.** The kickstart `%post` opened with:
```bash
if ! command -v grubby >/dev/null 2>&1; then
    echo "SP+ post: grubby is required to remove installer kernel arguments" >&2
    exit 1
fi
```
`grubby` is not part of the bootc image, so `%post` exited at line 3. **Everything after it
never ran**: the DN-10 karg strip, `systemctl set-default graphical.target`, and the home
directory creation. One missing binary silently voided three unrelated fixes, and Anaconda
still reported a successful install.

**Do instead.**
1. Do NOT depend on `grubby` for bootc/ostree systems. Kernel arguments live in BLS entries
   under `/boot/loader/entries/*.conf`; edit `options` there, or pass explicit kargs to
   `bootc install`. Whatever is chosen, the gate is empirical: `getenforce` = `Enforcing`.
2. **NEVER let one prerequisite abort an entire `%post`.** Separate independent concerns so a
   missing tool cannot silently cancel unrelated work. Guard narrowly, fail loudly, and make
   the failure visible in the INSTALLED system, not only on a stream nobody reads.
3. A `%post` failure must not be able to masquerade as a successful install.

**Status.** OPEN — found 2026-08-26 during Christopher's hands-on QEMU test.

**Meta-lesson.** This is the SECOND time in one day that a fix was declared correct from the
diff and was doing nothing in reality (see DN-10). Both were caught only by inspecting a
running installed system. **A fix is not verified until it is observed in the environment it
targets.** The release gate (OP-16) would have caught this one mechanically.

### DN-13 — SP+ must NEVER ship a default account password

**Found 2026-08-26.** The kickstart contained:
```
user --name=advisor --groups=wheel --shell=/bin/bash --homedir=/var/home/advisor --password=spplus-advisor
```
A literal, known password on a **sudo-capable** account, committed to git and baked into every
ISO. It was added so an automated test loop could complete the User Creation spoke; it must
never reach a shipped product.

**Detect with:** `tests/preflight-gate.sh` — it now fails the build on any credential-bearing
kickstart line lacking `--iscrypted`/`--lock`, and separately on any wheel account shipping a
preset password.

**Do instead.** Ship the advisor account LOCKED and require the advisor to set their own
password at first boot. A shared default is identical on every SP+ machine in the field.

**Gate-design lesson (important).** The original secrets check MISSED this twice:
1. It matched `--password foo` but not `--password=foo`.
2. It then asked whether `--iscrypted` appeared ANYWHERE IN THE FILE. An unrelated
   `rootpw --iscrypted` line answered yes and masked the literal password on the user line.
   **A flag must be computed from the datum, never from a neighbouring line.**
The gate had been "validated" only against an artifact with no user account at all, so it
passed and was trusted. **A gate tested solely against artifacts that LACK the defect proves
nothing.** Every gate must be demonstrated against an artifact that HAS it (OP-16).
