# SP+ RC1e — Pre-Release Security Audit
**Date:** 2026-09-03 · **Repo:** `~/work/secureprospective-advisor-os` @ `session/sp-plus-plan` · **Image:** `localhost/sp-plus-kde:spike` · **Runtime:** `spplus-test` VM (RC1e, LUKS unlocked, SELinux enforcing)
**Mode:** read-only. No file, package, image, VM or ISO was modified.

---

## 1. VERDICT

**DO NOT SHIP this ISO to the Dell.**

The single most important reason: **the shipped firewall zone accepts every inbound TCP and UDP port from 1025–65535**, and there are live services sitting in that range. Verified on the running VM — `nft` accepts `tcp dport 1025-65535`, and `firewall-cmd --query-port=1716/tcp` returns `yes` with `kdeconnectd` bound to `0.0.0.0:1716`. An advisor's laptop on hotel, airport, or client-office Wi-Fi is not a trusted LAN. This is the default posture a non-sysadmin will run forever.

Three further defects are independently serious: a **root-level command injection** in the update path (demonstrated, not theorised), a **full Samba server running with a read-write `[homes]` share** on a machine the design explicitly declares client-only, and a build gate that **greps source text instead of measuring effect**, which is why nobody caught the Samba issue.

None of the four requires redesign. All four are small, surgical changes.

| Severity | Count |
|---|---|
| CRITICAL | 0 |
| HIGH | 4 |
| MEDIUM | 5 |
| LOW | 3 |
| INFO | 3 |

No embedded secret, private key, token or credential was found in the image or the repo. That check was run hard and came back clean.

---

## 2. RANKED FINDINGS

---

### [HIGH-1] Root command injection in `spplus-stage-update` via `eval` on registry-derived text — VERIFIED

**Where:** `projects/sp-plus/config/spplus-stage-update:53`, reached from `config/spplus-update-control:167,183`

**Evidence:**

```
config/spplus-stage-update:53
eval "$(printf '%s' "$answer" | python3 -c '
    ...
    print("note=%s" % json.dumps(d.get("note") or d.get("reason") or ""))
')"
```

`note`/`reason` carries `bootc`'s own stderr verbatim:

```
config/spplus-update-control:183
if ! err=$(bootc upgrade 2>&1); then
    fail "The update did not finish downloading. $(printf '%s' "$err" | tail -1)"
```

`json.dumps` escapes `"` and `\` but **not `$` or backtick**, and the result is placed inside double quotes for `eval`. Demonstrated locally with a harmless payload:

```
$ answer='{"state":"error","reason":"registry says: $(id -u) BAD"}'
$ eval "$(printf '%s' "$answer" | python3 -c '...')"
$ echo "note=$note"
note=registry says: 1000 BAD
```

`$(id -u)` executed. `config/spplus-stage-update.service:19-21` declares no `User=`, so the unit runs as **root**, on `spplus-stage-update.timer`.

**Risk:** A compromised or hostile container registry (or anyone in a trusted TLS position on the update path) that returns an error string containing `$(...)` gets arbitrary command execution as root on the advisor's laptop, unattended, on a timer. The brief's own threat framing asks whether SP+ resists malicious mirrors. Today it does not.

**Fix:** Delete the `eval`. Emit NUL-delimited values and consume them without a shell round-trip:

```bash
{ IFS= read -r -d '' state; IFS= read -r -d '' digest; IFS= read -r -d '' note; } < <(
  printf '%s' "$answer" | python3 -c '
import json,sys
d=json.load(sys.stdin)
for v in (d.get("state",""), (d.get("staged") or {}).get("digest") or "", d.get("note") or d.get("reason") or ""):
    sys.stdout.write(v + "\0")')
```

Belt and braces: have `update-control` strip control and shell-metacharacters from any `bootc` text before it enters JSON.

**Blocks release? YES.** Root RCE reachable from the network-facing update lane, on a machine holding client financial data.

---

### [HIGH-2] Firewall default zone accepts all inbound ports 1025–65535 — VERIFIED

**Where:** `/etc/firewalld/firewalld.conf:6` in the image; confirmed live

**Evidence:** In the built image —

```
$ sudo -n podman run --rm --entrypoint /bin/bash localhost/sp-plus-kde:spike \
    -c 'grep -n "^DefaultZone" /etc/firewalld/firewalld.conf'
6:DefaultZone=FedoraWorkstation
```

On the running VM —

```
$ sudo firewall-cmd --list-all
FedoraWorkstation (default, active)
  interfaces: enp1s0
  services: dhcpv6-client samba-client ssh
  ports: 1025-65535/udp 1025-65535/tcp

$ sudo nft list ruleset | grep 1025-65535
152:  udp dport 1025-65535 accept
153:  tcp dport 1025-65535 accept

$ sudo firewall-cmd --query-port=1716/tcp
yes
```

**Risk:** Every service that binds a high port is exposed to the whole local network with no further action. This is a defensible default for a desktop workstation on a home LAN; it is the wrong default for a laptop that will sit on untrusted Wi-Fi in client offices, hotels and coffee shops. It also converts any future high-port service — or a Flatpak app the advisor installs — into a network-listening service by accident. It is the amplifier that makes HIGH-3 and HIGH-4 reachable.

**Fix:** In `images/kde/Containerfile`, set `DefaultZone=public` in `/etc/firewalld/firewalld.conf` (or ship a vendored `sp-plus` zone permitting only what SP+ needs — `ssh` at most, and arguably not even that by default, plus mDNS if printer discovery requires it). Add a build gate asserting `firewall-offline-cmd --get-default-zone` is not `FedoraWorkstation`.

**Blocks release? YES.** It is the difference between "a laptop with some services" and "a laptop that answers strangers."

---

### [HIGH-3] `wsdd` starts a full Samba **server** with a read-write `[homes]` share; the `BindsTo=` override silently did nothing — VERIFIED

**Where:** `projects/sp-plus/config/wsdd.service.d/sp-plus.conf:3`; gate at `images/kde/Containerfile:208`

**Evidence:** The drop-in intends to break the binding:

```
config/wsdd.service.d/sp-plus.conf:1-3
[Unit]
# SP+ is an SMB client, not a Samba server. Do not inherit the RPM's smb binding.
BindsTo=
```

On the live VM, it did not take:

```
$ systemctl show wsdd.service -p BindsTo
BindsTo=smb.service

$ systemctl list-dependencies --reverse smb.service
smb.service
● └─wsdd.service

$ systemctl status smb.service
   Loaded: loaded (/usr/lib/systemd/system/smb.service; disabled; preset: disabled)
   Active: active (running) since Thu 2026-09-03 18:43:22 EDT
   Status: "smbd: ready to serve connections..."
```

`smb.service` is `disabled` and starts anyway, because `wsdd.service:10` has `BindsTo=smb.service` and the empty-assignment reset did not clear it. The `ExecStart=` reset in the same file *did* work (`/proc/1262/cmdline` shows the hardened flags) — which is exactly why this went unnoticed. What is now listening:

```
tcp LISTEN 0.0.0.0:139  users:(("smbd",pid=1254))
tcp LISTEN 0.0.0.0:445  users:(("smbd",pid=1254))
```

And what it serves:

```
$ sudo testparm -s
[homes]
	browseable = No
	read only = No
	valid users = %S %D%w%S
[global]
	usershare allow guests = Yes
	Weak crypto is allowed by GnuTLS (e.g. NTLM as a compatibility fallback)
```

**The build gate does not catch this** because it checks the file's text, not the system's behaviour:

```
images/kde/Containerfile:208
&& grep -q '^BindsTo=$' /usr/lib/systemd/system/wsdd.service.d/sp-plus.conf \
```

That assertion passes while the control it represents fails. `Containerfile:196` states the conclusion this gate was supposed to protect — *"nothing new is exposed and firewalld needs no new rule"* — and that statement is false as built.

**Risk:** A read-write network file share of every user's home directory, with guest usershares permitted and NTLM allowed, running on a laptop whose home directory holds client financial documents. Currently contained *only* by firewalld — 139/445 are not in the open range and `firewall-cmd --query-port=445/tcp` returns `no`. That containment is one zone change, one "why can't I share a folder?" support call, or one advisor clicking Dolphin's Share tab away from being gone. Defence-in-depth is absent: the service should not be running at all.

**Fix:** Two changes, both small.
1. In `images/kde/Containerfile`, `systemctl mask smb.service nmb.service` — masking survives `BindsTo` where disabling does not.
2. Replace the text-grep gate with a behavioural one. In the build: `systemd-analyze verify wsdd.service` plus an assertion on effective properties, e.g. `systemctl show wsdd.service -p BindsTo | grep -qx 'BindsTo='` — and add a runtime gate asserting `ss -tulpn` shows nothing on 139/445.

**Blocks release? YES.** Both the exposure and, more importantly, the false-assurance gate — every other `grep`-the-source gate in this build is now suspect.

---

### [HIGH-4] `kdeconnectd` runs and is LAN-reachable despite being deliberately disabled — VERIFIED

**Where:** `images/kde/Containerfile:1225` (autostart removal) vs. runtime

**Evidence:** The build removes the autostart entry —

```
images/kde/Containerfile:1225
RUN for f in baloo_file org.kde.kdeconnect.daemon \
    ... rm -f "/etc/xdg/autostart/$f.desktop"
```

— and `Containerfile:2020` records the intent: *"kdeconnect x3 (phone pairing; its daemon is already off)"*. It is not off:

```
$ ls /etc/xdg/autostart/ | grep -i kdeconnect      # (nothing)
$ tr '\0' ' ' < /proc/2073/cmdline
/usr/bin/kdeconnectd
$ ss -tulpn | grep 1716
tcp LISTEN 0.0.0.0:1716 users:(("kdeconnectd",pid=2073))
udp UNCONN     *:1716   users:(("kdeconnectd",pid=2073))
```

Root cause, present in the image:

```
$ sudo -n podman run --rm ... -c 'ls -la /usr/share/dbus-1/services/ | grep -i kdeconnect'
-rw-r--r-- 2 root root 66 org.kde.kdeconnect.service
```

The D-Bus activation file was left behind, so the daemon is started on demand regardless of the removed autostart entry. Combined with HIGH-2, port 1716 is accepted from the LAN.

**Risk:** KDE Connect is a device-pairing service that, once paired, exposes file transfer, clipboard sync, notification mirroring and remote input. On an untrusted network it is an unsolicited pairing prompt on a laptop displaying client portfolios. The `Containerfile` comment asserting the daemon is off means nobody is looking at it.

**Fix:** In `images/kde/Containerfile`, also `rm -f /usr/share/dbus-1/services/org.kde.kdeconnect.service` (and the matching `kdeconnectd` binary if nothing else needs it). Add a runtime gate asserting nothing listens on 1716. Correct the comment at `Containerfile:2020`.

**Blocks release? YES** — cheap to fix, and it is a network-facing pairing service on a client-facing machine.

---

### [MEDIUM-1] `spplus-grant-admin` grants passwordless root to *every* account, on *every* boot, irrevocably — VERIFIED

**Where:** `projects/sp-plus/config/spplus-grant-admin:21-34`, with `config/sudoers-sp-plus:23`

**Evidence:**

```
config/spplus-grant-admin:21-28
while IFS=: read -r name _ uid _ _ _ shell; do
    [ "$uid" -ge 1000 ] 2>/dev/null || continue
    [ "$uid" -lt 65534 ] || continue
    case "$shell" in */nologin|*/false|'') continue ;; esac
    ...
    if usermod -aG wheel "$name"; then
```

```
config/sudoers-sp-plus:23
%wheel ALL=(ALL) NOPASSWD: ALL
```

`config/spplus-grant-admin.service:5,16` runs it `WantedBy=multi-user.target` at every boot.

Confirmed live: `getent group wheel` → `wheel:x:10:test`, and `sudo -l` → `(ALL) NOPASSWD: ALL`.

**Risk:** The *decision* — advisor is administrator, no password prompt — is sanctioned (DN-13, D-47) and the reasoning in the file header is sound. The *implementation* is broader than the decision. Any account with UID ≥ 1000 and a login shell becomes passwordless root at the next boot: a second account the advisor creates for a spouse or assistant, a support account created during a repair, or an account created by an attacker who achieved one-shot code execution. Because it re-runs every boot, **de-privileging is impossible** — removing someone from `wheel` is undone at the next power-on, with no way for a non-technical owner to notice or prevent it. The script also correctly excludes the `spplus` service account (uid 960), so the exclusion mechanism already exists and simply is not scoped.

**Fix:** Bind the grant to the *first* account rather than all accounts. Either promote only the lowest-UID human account (the one the first-boot wizard created), or write a stamp file on first success and make the unit `ConditionPathExists=!/var/lib/sp-plus/admin-granted`. Keep the exclusion list.

**Blocks release? NO** — it does not create a new externally reachable path, and the base decision is Christopher's to make. It should land in the fix dispatch immediately after.

---

### [MEDIUM-2] No ISO signature, no SBOM, no signed checksum — VERIFIED

**Where:** `~/Downloads/`, and `images/kde/Containerfile` / `installer/Containerfile`

**Evidence:**

```
$ ls ~/Downloads/ | grep -iE 'sp-plus.*(iso|sha|sig)'
sp-plus-1.0-rc1c-20260903.iso
sp-plus-1.0-rc1d-20260903.iso
sp-plus-1.0-rc1e-20260903.iso
sp-plus-1.0-rc1e-20260903.iso.sha256

$ cat sp-plus-1.0-rc1e-20260903.iso.sha256
ce8cdd1ce4954b22f694af555af12a4e82127199993e39efdbeef158d01f702b  sp-plus-1.0-rc1e-20260903.iso
```

One bare SHA-256, unsigned. `grep -nE "cosign|sigstore|sbom|syft" images/kde/Containerfile installer/Containerfile` returns nothing. `rc1c` and `rc1d` have no checksum at all.

**Risk:** A bare hash published beside the file it describes authenticates nothing — anyone who can alter the ISO can alter the `.sha256`. There is no way for the advisor, or Christopher six months from now, to prove which ISO is genuine, and no component inventory to answer "is SP+ affected by *X*?" when a CVE lands.

**Fix:** Sign `.sha256` with a GPG key (or `cosign sign-blob`), publish the public key over HTTPS on `secureprospective.com`, and generate an SBOM at build time (`syft` against the built image, committed to the release artifacts). Sign the container image with `cosign` so `bootc` can verify the update lane too.

**Blocks release? NO for the Dell** — Christopher is hand-carrying this ISO to a machine he controls, so provenance is established out-of-band. **YES for any public download.**

---

### [MEDIUM-3] Full libvirt/virtualisation and iSCSI stack enabled on an advisor laptop — VERIFIED

**Where:** `systemctl list-unit-files --state=enabled` on the VM

**Evidence:**

```
virtqemud.service           enabled
virtinterfaced.socket       enabled   virtnetworkd.socket    enabled
virtnodedevd.socket         enabled   virtnwfilterd.socket   enabled
virtproxyd.socket           enabled   virtsecretd.socket     enabled
virtstoraged.socket         enabled   virtlockd.socket       enabled
iscsid.socket  iscsi-onboot.service  iscsi-starter.service  iscsiuio.socket
```

```
$ systemd-analyze security | sort -k2 -rn | head
virtstoraged.service   9.6 UNSAFE :-{
virtqemud.service      9.6 UNSAFE :-{
...  (all virt* daemons at 9.6 UNSAFE)
```

Plus setuid-root helpers for software this product does not use:

```
-rwsr-xr-x root root /usr/libexec/qemu-bridge-helper
-rwsr-xr-x root root /usr/bin/vmware-user-suid-wrapper
-rwsr-xr-x root root /usr/bin/fusermount-glusterfs
-rwsr-xr-x root root /usr/libexec/spice-gtk-x86_64/spice-client-glib-usb-acl-helper
-rws--x--x root root /usr/bin/userhelper
```

The build already disables `vmtoolsd`/`vboxservice` (`Containerfile:1199-1201`) but leaves their setuid binaries installed.

**Risk:** Local privilege-escalation surface with no product function. `qemu-bridge-helper` and `userhelper` both have a history of privilege-escalation CVEs; every one of these is a root-owned setuid binary reachable by the advisor's account. This is not remotely exploitable, but it widens the blast radius of any code execution on the box.

**Fix:** Remove the packages rather than disabling the units — `libvirt-daemon-*`, `iscsi-initiator-utils`, `open-vm-tools`, `glusterfs-fuse`, `usermode` — in the debloat `RUN` in `images/kde/Containerfile`. Extend `tests/pkg-preflight.sh` with a setuid allow-list gate so new setuid binaries fail the build.

**Blocks release? NO.**

---

### [MEDIUM-4] Brave managed policy disables the password manager and pins no anti-phishing controls — VERIFIED (file) / INFERRED (consequence)

**Where:** `/etc/brave/policies/managed/sp-plus.json`, and `config/pwa/*.desktop`

**Evidence:**

```json
"PasswordManagerEnabled": false,
"AutofillCreditCardEnabled": false,
```

The full policy contains **no** `SafeBrowsingProtectionLevel`, `DnsOverHttpsMode`, `ExtensionInstallBlocklist`, `PasswordProtectionWarningTrigger`, or `URLBlocklist`. Meanwhile the shipped PWAs are exactly the credential-entry surfaces:

```
Exec=brave-browser --app=https://advisorservices.schwab.com/advisor/login --class=spplus-schwab
Exec=brave-browser --app=https://www.wealthscape.com/ --class=spplus-wealthscape
```

All six PWA targets are HTTPS — that part is correct, and the two financial ones resolve to the right vendor hostnames. No password manager ships in the Flatpak preinstall set (`config/flatpak/preinstall.d/` contains only Joplin and Zoom), though `welcome/app/help-core.js:41` maps the advisor's search for "password" to *Bitwarden*, which is not installed.

**Risk:** Two separate problems. First, turning off the browser password manager without providing a replacement is a security *regression* dressed as hardening: an advisor who cannot store a Schwab Advisor Center password will reuse one, weaken one, or write it on paper. The help corpus already assumes a manager they do not have. Second, Safe Browsing and DNS-over-HTTPS being unpinned means a policy-level default the advisor (who is passwordless root, per MEDIUM-1) can switch off — on the exact machine most likely to be phished, since advisor-portal credentials are a high-value target.

*I did not measure Brave's runtime `chrome://policy` state — the finding rests on the policy file's contents, and Brave's built-in defaults for the unpinned settings are presumed-on but unverified.*

**Fix:** Add to the policy: `"SafeBrowsingProtectionLevel": 1` (or `2`), `"DnsOverHttpsMode": "automatic"`, and an extension install allow-list. Then either re-enable `PasswordManagerEnabled` **or** ship Bitwarden in `config/flatpak/preinstall.d/` and point the help corpus at it. Do not leave the gap.

**Blocks release? NO** — but the password-manager gap should be settled before an advisor types a live Schwab credential.

---

### [MEDIUM-5] Build gates assert source text, not effect — VERIFIED

**Where:** `images/kde/Containerfile:206-215`, and the pattern generally

**Evidence:** See HIGH-3. `grep -q '^BindsTo=$' <file>` passed on every build while `systemctl show wsdd -p BindsTo` returned `BindsTo=smb.service` on the installed machine. The same file also greps for `IPAddressAllow=localhost` (`Containerfile:650`) and for `0.0.0.0` absence — all textual.

**Risk:** This is a methodological defect, not a single bug. Every control asserted by grepping a config file can fail at runtime exactly the way this one did, and the build will keep reporting `WSDD_OK`. The audit found one instance; the class is larger than what I checked.

**Fix:** For each security-relevant gate, add a runtime assertion measured on a booted machine, not a string match on a file: `systemctl show -p <Property>`, `sshd -T`, `ss -tulpn`, `firewall-cmd --list-all`. `tests/` should gain a `runtime-posture-gate.sh` that runs against `spplus-test` over SSH and asserts the listening-port set, effective sshd config, firewall zone and unit dependency properties.

**Blocks release? NO** for RC1e itself, but it is the reason HIGH-3 shipped and should land with the fixes.

---

### [LOW-1] sshd permits X11 and TCP forwarding — VERIFIED

**Where:** `config/ssh/45-sp-plus.conf`; measured with `sudo sshd -T`

**Evidence:**

```
$ sudo sshd -T | grep -iE 'forwarding|permitroot|password'
permitrootlogin no
passwordauthentication no
kbdinteractiveauthentication no
pubkeyauthentication yes
permitemptypasswords no
x11forwarding yes
allowtcpforwarding yes
```

The four settings SP+ pins are all correct and effective — the `45-` ordering works as documented. Forwarding is simply not among them.

**Risk:** Low. An operator key is required to authenticate at all (D-1 verified: no `authorized_keys` ships). But `AllowTcpForwarding yes` turns any holder of the operator key into a pivot into the advisor's LAN, and X11 forwarding is unused on a Wayland desktop.

**Fix:** Add `X11Forwarding no` and `AllowTcpForwarding no` to `config/ssh/45-sp-plus.conf`. Extend the existing `sshd -T` gate to cover them.

**Blocks release? NO.**

---

### [LOW-2] LUKS is passphrase-only; no TPM2 enrolment and no passphrase strength policy — VERIFIED

**Where:** measured on the VM's root device

**Evidence:**

```
$ sudo cryptsetup luksDump /dev/vda3
Version:  2
cipher:   aes-xts-plain64      Cipher key: 512 bits
PBKDF:    argon2id   Time cost: 4   Memory: 1048576   Threads: 4

$ sudo systemd-cryptenroll /dev/vda3
SLOT TYPE
   0 password
```

The cryptography is strong and correctly chosen — LUKS2, AES-XTS-512, argon2id with real cost parameters. There is exactly one keyslot, a password. Confirms **T-01** is not merely unproven but absent on this install. The VM has no TPM (`ls /sys/class/tpm/` empty), so this cannot be judged further here.

Related, and honestly scoped: the boot log shows

```
systemd-tmpfiles[279]: /usr/lib/tmpfiles.d/tpm2-tss-fapi.conf:2: Failed to resolve user 'tss': Unknown user
systemd-udevd[405]: /usr/lib/udev/rules.d/60-tpm-udev.rules:3 Failed to resolve user 'tss', ignoring: Unknown user
```

I checked whether this means TPM support is broken, and **it does not**: `getent passwd tss` resolves at runtime via `/usr/lib/passwd` and `nsswitch.conf: passwd: files altfiles systemd`. These are early-boot ordering messages before the switch-root. Whether the udev rule's failure leaves `/dev/tpm0` mis-owned on a machine that actually has a TPM is **not determinable on this VM** — see COULD NOT VERIFY.

**Risk:** The advisor types the LUKS passphrase at every boot. Non-technical users under that friction choose short passphrases, and nothing in the installer enforces a minimum. Full-disk encryption whose passphrase is `spring2026` protects against a casual thief and nothing else. Argon2id's cost parameters mitigate but do not solve this.

**Fix:** Two parts. (a) Enforce a passphrase policy in the Anaconda spoke, or document a minimum prominently in the first-boot flow. (b) Resolve T-01 on TPM-equipped hardware and enrol TPM2+PIN, which converts the passphrase from a daily-friction secret into a rarely-used recovery secret and permits a strong one.

**Blocks release? NO** — but the residual-risk document must state plainly that disk protection rests entirely on the passphrase the advisor chose.

---

### [LOW-3] Samba permits guest usershares and NTLM — VERIFIED

**Where:** `sudo testparm -s` on the VM

**Evidence:** `usershare allow guests = Yes`, `usershare max shares = 100`, and `Weak crypto is allowed by GnuTLS (e.g. NTLM as a compatibility fallback)`.

**Risk:** Subsumed by HIGH-3 — if `smbd` is stopped as recommended, this becomes moot. Recorded separately because it is the reason HIGH-3's impact is "read-write home directories to unauthenticated guests" rather than "an idle daemon."

**Fix:** Resolved by masking `smb.service`. If Samba serving is ever wanted, set `usershare allow guests = no` first.

**Blocks release? NO** (folded into HIGH-3).

---

### [INFO] Things checked that came back clean

| Check | Result |
|---|---|
| Embedded secrets, private keys, tokens, certs (repo + image) | **None found.** The only hit, `docs/ledger/DO-NOT.md:294` `--password=spplus-advisor`, is an anti-pattern record, and `tests/preflight-gate.sh:66` already gates against its return. |
| `rootpw` in kickstart | Absent by design; `installer/interactive-defaults.ks:28-43` documents why root is left locked rather than given a random hash. Correct, and stronger than the alternative. |
| World-writable files and directories | **Zero.** `find / -xdev -type d -perm -0002 ! -perm -1000` and the file equivalent both returned empty. |
| SELinux | **Enforcing, zero AVCs since boot.** `getenforce` → `Enforcing`; `ausearch -m avc -ts boot \| grep -c type=AVC` → `0`. T-13's labelling concern did not manifest on this install. |
| Failed units | **Zero**, system and user scope. |
| PWA transport | All six PWAs use `https://`; correct vendor hostnames for Schwab and Fidelity. |
| Help server binding | Correct. `127.0.0.1:8765` (RPC, running as the unprivileged `spplus` user) and `127.0.0.1:8766` (help). Not reachable off-host. |
| Base image pinning | Both `FROM` lines pinned by digest — `images/kde/Containerfile:25`, `installer/Containerfile:29`. Good practice, genuinely done. |
| Brave supply chain | Repo and GPG key vendored, `gpgcheck=1`, `gpgkey=file://`, both removed post-install. `config/brave/brave-browser.repo` — this is done properly. |
| Support contact | `SUPPORT_URL`/`BUG_REPORT_URL` both `https://secureprospective.com/contact`, as the brief states. |

Note: the two help-server processes on 8765 and 8766 are the two *distinct* services (RPC and help), not the duplicate-instance race the brief mentions. No help-app traceback appeared in `journalctl -p err -b` on this boot.

---

## 3. THE TEN SECTIONS

### 3.1 Threat model *(written here for the first time)*

**Asset.** A Dell laptop holding, or providing authenticated access to, the financial records of an independent advisor's clients. The credentials to Schwab Advisor Center and Fidelity Wealthscape are the crown jewels — they are custodial-platform logins, and compromise means access to client assets, not just client data.

**User.** A non-technical financial advisor. Sole owner and sole administrator. Will not harden, patch manually, read logs, or notice anomalies. Will click links in email. Whatever posture ships is the posture that runs for the life of the machine.

**Hardware.** One physical laptop, physically portable, physically lost or stolen at a realistic rate. UEFI. Secure Boot state unverified. TPM presence varies by unit; the current test Dell has none.

**Network.** **Assume hostile by default.** The machine will be on hotel, airport, conference, client-office and home Wi-Fi. It is not on a managed corporate LAN and there is no perimeter firewall doing work on its behalf. This assumption is the one SP+ currently gets wrong (HIGH-2).

**Persistence.** Immutable `/usr` on bootc/ostree. State lives in `/etc` (three-way merged) and `/var/home` (LUKS-encrypted LVM). Rollback via `bootc rollback`. Updates by whole image over the `spplus-update-control` lane only.

**What SP+ defends against, and does so credibly:**
- *Device theft while powered off* — LUKS2/argon2id full-disk encryption. Strong, subject to passphrase quality (LOW-2).
- *Persistent OS compromise* — read-only `/usr` plus image-based updates make a durable rootkit substantially harder, and any bad state is one `bootc rollback` away.
- *The advisor breaking their own machine* — single update lane, Discover's rpm-ostree backend removed, downgrade guard in `spplus-update-control`. This is well-engineered and is the strongest part of the design.
- *Remote login* — key-only sshd, no shipped key, root login denied. Verified effective.
- *Kernel-level local escapes* — SELinux enforcing, cleanly.

**What SP+ does not defend against, and must say so:**
- *A hostile local network.* Today, actively so (HIGH-2/3/4).
- *A malicious or compromised update registry.* No image signature verification, and a root injection in the consumer of registry output (HIGH-1, MEDIUM-2).
- *Compromised upstream packages.* Fedora and Brave GPG signatures are checked at build; Flathub applications are trusted transitively with no additional review. There is no SBOM, so post-hoc "are we affected?" cannot be answered.
- *An attacker with an unlocked session.* By explicit, documented decision (`config/sudoers-sp-plus:13-19`), an unlocked session is root. The containment is architectural (immutable `/usr`, rollback) and physical (LUKS + screen lock), not permission-based. This is a coherent choice; it must be stated in the shipped residual-risk document so the advisor understands that locking the screen *is* the security control.
- *Phishing.* The highest-likelihood real attack on this user, and currently unaddressed at policy level (MEDIUM-4).

**Must the ISO resist tampering?** For the Dell hand-install, no — provenance is established by Christopher carrying it. For any public download, **yes, and it currently cannot** (MEDIUM-2).

---

### 3.2 Build chain

| Property | State | Evidence |
|---|---|---|
| Base images pinned | **Yes**, by digest | `images/kde/Containerfile:25`, `installer/Containerfile:29` |
| Third-party repo vendored | **Yes** | `config/brave/brave-browser.repo` + `brave-core.asc`, `gpgcheck=1`, `file://` key |
| Package versions recorded | **Partial** — Brave pinned via `ARG BRAVE_VERSION`/`BRAVE_RELEASE`; Fedora packages float within the pinned base | `config/brave/brave-browser.repo` header |
| SBOM | **No** | `grep -nE "sbom\|syft\|cosign\|sigstore"` → no matches in either Containerfile |
| Image signing | **No** | as above |
| Signature/checksum verification of upstreams | **Yes** for RPMs (`gpgcheck=1`, no `--nogpgcheck` anywhere in either Containerfile) | grep returned no `nogpgcheck` |
| Clean/isolated build | **Not assessed** — builds run on this host's rootful podman; no hermetic/reproducible build harness observed | — |
| **Embedded secrets** | **None found** | see INFO table |

The secret hunt was the release-blocking item here and it is clean. Digest-pinned bases and a vendored, GPG-verified Brave repo are meaningfully better than typical practice. The gaps are SBOM and signing (MEDIUM-2).

---

### 3.3 ISO contents

**Package inventory** — retrieved in full via `rpm -qa` against `localhost/sp-plus-kde:spike`. Kernel `7.1.10-200.fc44`, Fedora 44 base.

**Known-CVE exposure** — **I cannot determine this.** There is no CVE database available to this session and no network research was performed for this audit. I will not invent CVE identifiers. What I can state factually: the image carries `tpm2-tss 4.1.3-9.fc44`, `grub2 2.12-64.fc44`, `shim 16.1-5`, `kernel-core 7.1.10-200.fc44`, plus a full libvirt and Samba stack. The concrete gap is that **without an SBOM there is no way to answer this question later either** — which is the actionable finding (MEDIUM-2), rather than a snapshot CVE count that expires the day it is written. See COULD NOT VERIFY for the test.

**setuid/setgid** — swept; full list captured. Standard Fedora set plus five binaries belonging to software this product does not use (`qemu-bridge-helper`, `vmware-user-suid-wrapper`, `fusermount-glusterfs`, `spice-client-glib-usb-acl-helper`, `userhelper`) — MEDIUM-3. `/usr/lib/opt/brave.com/brave/chrome-sandbox` setuid-root is expected and required for Brave's sandbox.

**World-writable paths** — none. Clean.

**Services/timers** — 118 enabled unit files enumerated. Findings: the libvirt/iSCSI block (MEDIUM-3) and `rc-local.service`. SP+'s own timers (`spplus-stage-update`, `spplus-flatpak-update`, `spplus-update-health`, `spplus-flatpak-preinstall`) are all present and enabled as designed.

**Unsafe commands / hardcoded passwords / debug settings in shell and config** — the `eval` at `spplus-stage-update:53` (HIGH-1) is the significant hit. `config/spplus-fix:11` uses `curl` against `http://127.0.0.1:8765/api/rpc` — plain HTTP, but loopback-only to a service that binds loopback, so acceptable. No hardcoded passwords in live code.

---

### 3.4 Boot security

| Item | Finding |
|---|---|
| Secure Boot | **Not determinable here.** `mokutil --sb-state` → `This system doesn't support Secure Boot` — that is the VM's firmware, not SP+. See COULD NOT VERIFY. |
| Signed boot chain available | **Yes.** `shim-x64-16.1-5`, `shim-ia32-16.1-5`, `grub2-efi-x64-2.12-64.fc44`, Fedora-signed `kernel-core` are all present in the image, so the components for a Secure Boot chain ship. Note `grub2-pc` (legacy BIOS) is also installed. |
| Bootloader config | Booted EFI. `/proc/cmdline`: `... rhgb quiet rd.luks.uuid=luks-9de7274f-... rd.lvm.lv=sp_sp-plus/root ostree=/ostree/boot.1/...`. No `lockdown=`, no `init_on_alloc`/`slab_nomerge` hardening args — cosmetic, low value against this threat model. GRUB has no password set; combined with the sanctioned "owner is root" model that is consistent, though it means single-user/`init=` boot is available to anyone with the LUKS passphrase. |
| Initramfs/kernel provenance | Fedora 44 stock, from the digest-pinned base. |
| Can the ISO silently enable persistence or alter existing disks? | **Partly determinable.** Anaconda runs interactively (`installer/interactive-defaults.ks` is a *defaults* file, not an automated `autopart --nohome` unattended install), so a human confirms destructive partitioning. I did not boot the ISO to confirm no auto-install path exists — see COULD NOT VERIFY. |
| Trademark/shim | `T-05` (Fedora Council question on shim inside a modified image) remains open in `docs/ledger/TODO.md:9`. Legal, not security, but it gates public release. |

---

### 3.5 Installer

- **Disk encryption** — LUKS2 via Anaconda `autopart`, verified on the installed result: AES-XTS-512, argon2id, one password keyslot, LVM on top with separate `root` (38.6G) and `home` (18.8G) volumes. `/boot` and `/boot/efi` unencrypted, as they must be.
- **Root account** — deliberately left locked with no `rootpw` line. `installer/interactive-defaults.ks:28-43` explains that declaring even a random `rootpw` made Anaconda treat the account as configured; leaving it out entirely is stronger. This reasoning is correct.
- **Operator key overlay** — `installer/operator-key.ks.example` writes `/etc/ssh/authorized_keys.d/<user>` plus a `46-` sshd drop-in from `%post`, avoiding the `sshkey` directive that no-ops under bootc. The file documents that a wrong username fails *loudly*, unlike `sshkey`. Sound design, and D-1 is verified honoured — the image ships no authorized key.
- **Do installer logs contain secrets?** **I could not check this** — it requires a fresh install run with `/var/log/anaconda/` preserved. This is a real risk (Anaconda has historically written passphrase-adjacent material to `program.log` / `ks-script-*.log`), and it is on the must-test list.
- **Rollback / failed-install recovery** — `bootc rollback` covers post-install. A *failed* install leaves a partially-written disk with no automated recovery; the remedy is re-running the installer. Not tested.
- **Malformed input** — not tested. See COULD NOT VERIFY.

---

### 3.6 Default posture

| Control | State | Verdict |
|---|---|---|
| Firewall | firewalld active, zone `FedoraWorkstation`, **1025–65535 tcp+udp open** | **HIGH-2 — wrong for this product** |
| Listening (external) | 22 (sshd), **139/445 (smbd)**, **1716 (kdeconnectd)**, 5353 (avahi), 5355 (resolved), 3702 (wsdd) | **HIGH-3, HIGH-4** |
| Listening (loopback only) | 8765 RPC, 8766 help, 631 cups, 53 resolved, 323 chrony | Correct |
| Default users | Root locked, no shipped account, no shipped key | Correct — D-1 honoured |
| sudo | `%wheel NOPASSWD: ALL`, all human accounts auto-added every boot | Decision sanctioned; scope too broad — **MEDIUM-1** |
| polkit | `49-sp-plus-updates.rules` — every grant gated on `subject.active && subject.local && isInGroup("wheel")` | **Correct and well-reasoned.** SSH sessions get nothing. The deliberately-withheld verbs (`install-local-packages`, `override`, `repo-modify`, `set-bios-settings`, `override-parental-controls`) are the right ones to withhold. No finding. |
| sshd | key-only, no root, `45-` ordering effective per `sshd -T` | Correct; forwarding not restricted (**LOW-1**) |
| SELinux | Enforcing, 0 AVCs | Correct |
| Automatic updates | Stage-only, applied at shutdown, downgrade-guarded | Well-designed; injection flaw in the consumer (**HIGH-1**) |
| Disabled | vbox/vmware/mdmonitor/mcelog/ModemManager/dnf-makecache and 9 autostarts | Done, but see HIGH-4 and MEDIUM-3 for what disabling missed |

---

### 3.7 Static and dynamic testing

**What exists.** A substantial gate suite — 40+ files in `tests/`. `config-preflight.sh`, `pkg-preflight.sh`, `preflight-gate.sh`, `release-gate.sh`, `update-guard-gate.sh`, `service-link-gate.sh`, plus theme/welcome/help gates. `preflight-gate.sh:66` specifically guards against the `--password=spplus-advisor` regression. Ten test files reference security-relevant terms (`ssh`, `firewall`, `selinux`, `sudo`, `polkit`, `password`).

**ShellCheck: NOT INSTALLED on this machine.** `command -v shellcheck` returned nothing. I did not run it and I am not reporting guessed results. Given HIGH-1 is precisely the class of bug ShellCheck flags (SC2086-family / unquoted `eval`), installing it and gating on it is high-value.

**What is missing:**
1. **Runtime posture gates.** The largest gap, and the direct cause of HIGH-3/HIGH-4. Nothing asserts the listening-port set, the effective firewall zone, or effective unit properties on a booted machine. Every security gate today is a `grep` over source text (MEDIUM-5).
2. **ShellCheck** in CI over `config/spplus-*`.
3. **A setuid allow-list gate** — fail the build when a new setuid-root binary appears.
4. **A secret-scanning gate** (gitleaks/trufflehog) in CI. Today's clean result is a point-in-time manual check.
5. **An SBOM diff gate** between releases.

**Dynamic tests that need hardware:** Secure Boot enable/disable on the Dell; TPM2 LUKS enrolment on a TPM-equipped unit; untrusted-USB and hostile-network boots; interrupted-upgrade power-loss testing; installer fuzzing with malformed kickstarts and corrupted media.

---

### 3.8 Upgrade and recovery

**Well-designed.** `spplus-update-control` is the strongest component in the tree. The downgrade guard compares image *timestamps* rather than digests, with the reasoning recorded at `config/spplus-update-control:14-18` (*"DIFFERENT IS NOT NEWER"*), and the `cachedUpdate` shape bug — which would have silently meant no-more-updates-ever — is documented and fixed at lines 89-95. `spplus-stage-update.service:3-13` deliberately stages without `--apply` so no update reboots an advisor mid-appointment. `spplus-update-health.timer` exists to catch a genuinely broken update path as distinct from a hotel Wi-Fi failure. This is careful work.

**Gaps:**
- **No image signature verification.** `bootc` pulls over TLS but nothing verifies a cosign signature on the image, so registry compromise is unmitigated — and HIGH-1 turns that into root execution.
- **Interrupted upgrades** — untested. `ostree-finalize-staged` at shutdown is designed to be atomic, and ostree's design makes this likely safe, but likely is not measured.
- **Offline updates** — no mechanism. An advisor who is never on a fast network never updates, and nothing tells anyone.
- **Key rotation / revoked signing keys** — no process exists. Brave's key is vendored at `config/brave/brave-core.asc` with a note to re-fetch only if Brave rotates it; there is no monitoring that would notice a rotation or a revocation.
- **Recovery media** — the ISO is the recovery path. Unsigned (MEDIUM-2), and there is no documented recovery procedure for an advisor.

---

### 3.9 Release integrity

**Plainly stated: almost nothing is signed today.**

| Artifact | Signed? | Hashed? |
|---|---|---|
| ISO (rc1e) | No | Yes — one unsigned `.sha256` |
| ISO (rc1c, rc1d) | No | **No** |
| Container image | No | Digest-addressed only |
| Repo metadata | Upstream Fedora/Brave signatures verified at build | n/a |
| SBOM | Does not exist | n/a |

Reproducibility is not established — the base images are digest-pinned (good), but Fedora packages float within that base, so two builds on different days will differ. There is no versioned, published build log, and no path for independent verification by anyone but Christopher.

For the Dell hand-install this is acceptable: provenance is physical. For a public release it is not, and "first public release" is what the brief describes. The minimum viable set: GPG-sign the checksum file, publish the public key over HTTPS on `secureprospective.com`, `cosign sign` the container image and have the update lane verify it, and generate + publish an SBOM per release.

---

### 3.10 Residual risk — what SP+ should ship with

The document does not exist. It should, and it should say, in the advisor's language:

1. **Your screen lock is a security control.** Anyone at an unlocked SP+ session has complete control of this computer, by design. Lock it when you step away. *(Rationale: `config/sudoers-sp-plus:13-19` — this is a deliberate trade and the owner must know they are party to it.)*
2. **Your disk passphrase is the only thing protecting your data if this laptop is stolen.** Choose a long one. There is no recovery if you forget it. *(LOW-2.)*
3. **Supported hardware and boot mode:** UEFI. State the Secure Boot posture once tested on the Dell. State whether TPM2 is used on this unit (currently: no).
4. **How updates work:** SP+ downloads updates in the background and installs them when you shut down at the end of the day. It never reboots you mid-appointment. If you never shut down, you never update.
5. **Known limitations at 1.0** — carrying whatever of MEDIUM-1 through LOW-3 is not fixed before ship, in plain language.
6. **Reporting a security problem:** `https://secureprospective.com/contact` — already correct in `/etc/os-release` (`SUPPORT_URL`, `BUG_REPORT_URL`) and the crash reporter. What is missing is a stated response commitment (acknowledgement window, disclosure practice) and a security-specific contact route that is not the general contact form.
7. **What SP+ does not protect you from:** phishing, a malicious website you log into, or someone who knows your disk passphrase.

---

## 4. COULD NOT VERIFY

Each item below is genuinely unreachable from a read-only agent on this machine — not something I skipped.

| # | Item | Test a human must run | Passing looks like |
|---|---|---|---|
| 1 | **Secure Boot on real hardware** | Boot rc1e on the Dell with Secure Boot **enabled** in UEFI. Then `mokutil --sb-state`; `bootctl status`. | `SecureBoot enabled`, system boots without MOK enrolment, no shim complaint. If it fails to boot, that is release-blocking for the Dell. |
| 2 | **TPM2 LUKS enrolment (T-01)** | On a TPM-equipped machine: `ls -l /dev/tpm0` (check ownership — the boot-time `tss` udev failure means this may be mis-owned), then `systemd-cryptenroll --tpm2-device=auto --tpm2-with-pin=yes /dev/<part>`, reboot. | `/dev/tpm0` owned `tss:tss`; enrolment succeeds; reboot unlocks with PIN; `systemd-cryptenroll /dev/<part>` lists a `tpm2` slot alongside the password slot. |
| 3 | **Installer logs containing secrets** | Complete an install with a distinctive LUKS passphrase and user password. Before first reboot (or from the installed system): `grep -rn '<passphrase>' /var/log/anaconda/ /root/*.log /var/log/anaconda/ks-script-*.log`. | Zero matches. Any match is release-blocking. |
| 4 | **CVE exposure of the shipped package set** | Generate an SBOM (`syft localhost/sp-plus-kde:spike -o spdx-json`) and run it through a vulnerability matcher (`grype`) on a network-connected machine. | A reviewed list with no unpatched Critical/High in network-reachable components. I will not guess at CVE identifiers. |
| 5 | **Hostile-network boot** | Put the Dell on an untrusted network (or a lab segment) and port-scan it from a second host: `nmap -sS -sU -p- <ip>`. Run before *and* after the HIGH-2/3/4 fixes. | After fixes: only intentionally-open ports respond. Today this scan is the direct proof of HIGH-2/3/4 at LAN scope, which I could not obtain because the VM shares Beelink's IP (see note below). |
| 6 | **Untrusted-USB boot / ISO tampering behaviour** | Boot the ISO on a machine with an existing populated disk; observe whether any path can write to it without explicit confirmation. Also boot a deliberately corrupted ISO. | No silent partitioning; corrupted media fails loudly at media-check. |
| 7 | **Interrupted upgrade** | Stage an update, then cut power during `ostree-finalize-staged` at shutdown. Repeat ~5×. | Machine boots every time, into either the old or the new deployment, never into a broken state. |
| 8 | **Installer on malformed input** | Feed Anaconda a malformed/truncated kickstart and corrupted install media. | Clean error, no crash writing a traceback containing user input to a world-readable log. |
| 9 | **ShellCheck results** | `dnf install ShellCheck && shellcheck projects/sp-plus/config/spplus-* projects/sp-plus/tests/*.sh` | Clean, or triaged. Not installed on this machine; no results guessed. |
| 10 | **Brave runtime policy state** | On the installed machine, open `brave://policy` and `brave://settings/security`. | Managed policy applied; Safe Browsing on. MEDIUM-4 rests on the policy *file*, not on Brave's runtime state. |

**One measurement caveat, stated plainly:** the `spplus-test` VM reports `192.168.1.190/24` on `enp1s0` — the same address Beelink holds on `enp5s0`. My one attempt to probe the VM's ports from outside therefore hit Beelink, not the VM, and I discarded that result. All firewall conclusions in this report come from `nft list ruleset` and `firewall-cmd` measured *on* the VM, which are unaffected. Item 5 above exists because the external scan is the measurement I could not honestly make. This address collision is a test-bed artifact, not an SP+ defect, but Christopher may want to know about it.

---

## 5. THE SHORT LIST

Five fixes. In this order.

| # | Fix | File to change |
|---|---|---|
| **1** | **Remove the `eval`.** Replace with NUL-delimited `read` (patch in HIGH-1). Root RCE from the update path. | `projects/sp-plus/config/spplus-stage-update:53` |
| **2** | **Change the default firewall zone** off `FedoraWorkstation` to `public` or a vendored `sp-plus` zone; close 1025–65535. | `projects/sp-plus/images/kde/Containerfile` (writes `/etc/firewalld/firewalld.conf`) |
| **3** | **`systemctl mask smb.service nmb.service`** in the image — masking survives the `BindsTo` that disabling does not. | `projects/sp-plus/images/kde/Containerfile` (near the wsdd block, ~line 205) |
| **4** | **Delete `/usr/share/dbus-1/services/org.kde.kdeconnect.service`** so the daemon cannot be D-Bus-activated; fix the false comment at line 2020. | `projects/sp-plus/images/kde/Containerfile:1225` |
| **5** | **Replace the text-grep security gates with runtime assertions** — at minimum a `ss -tulpn` listening-port gate and `systemctl show -p BindsTo`. Without this, fixes 2–4 have no regression protection and the next one fails the same silent way. | `projects/sp-plus/images/kde/Containerfile:206-215`; new `projects/sp-plus/tests/runtime-posture-gate.sh` |

Fixes 1–4 are each a few lines. Fix 5 is the one that keeps them fixed.

**Not on this list, but next:** `spplus-grant-admin` scoping (MEDIUM-1), ISO signing + SBOM (MEDIUM-2 — blocking for public download, not for the Dell), package removal for libvirt/iSCSI/VMware (MEDIUM-3), Brave policy hardening and the password-manager decision (MEDIUM-4), sshd forwarding (LOW-1).

---

### One correction to the brief

The brief states the KDE Connect daemon is off and cites the Containerfile. The Containerfile comment at line 2020 says so; the running system disagrees (HIGH-4). Similarly, `Containerfile:196` asserts that the wsdd change means "nothing new is exposed and firewalld needs no new rule" — `smbd` on `0.0.0.0:445` contradicts it (HIGH-3). In both cases the code comment records the intent and the intent was not achieved. That pattern — accurate, thoughtful comments describing controls that silently did not take effect — is the most useful thing this audit found, and it is why fix #5 matters more than its severity rating suggests.

Nothing was written to disk; no file, package, image, VM or ISO was modified.
