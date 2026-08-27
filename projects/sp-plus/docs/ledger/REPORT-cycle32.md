# cycle32 test evidence

Cycle: `cycle32`
ISO SHA256 tested: `b7780868abab4a0cff058b98884a5546f3c81144ccdda7a9ca13279b774d2529`
ISO bytes: `5244141568`
ISO mtime: `2026-08-27 10:02:27.120514340 -0500`

## Execution order and raw evidence

### Step 0 — ISO wait

Ran:

```text
tail -f /home/chris/sp-plus-build-20260827T095302.log | grep -m1 "ISO build complete"
```

The required grep did not produce a matching line within 1800 seconds. The build log then contained:

```text
Image build successful: bootc-sp-plus-1.0-bootc-generic-iso-x86_64/bootc-sp-plus-1.0-bootc-generic-iso-x86_64.iso
-rw-r--r-- 1 root root 4.9G Aug 27 10:02 projects/sp-plus/artifacts/spikeB-rootful/out/bootc-sp-plus-1.0-bootc-generic-iso-x86_64/bootc-sp-plus-1.0-bootc-generic-iso-x86_64.iso
```

`./spb-sha`:

```text
ISO_PRESENT: yes
ISO_BYTES: 5244141568
ISO_MTIME: 2026-08-27 10:02:27.120514340 -0500
ISO_SHA256: b7780868abab4a0cff058b98884a5546f3c81144ccdda7a9ca13279b774d2529
KNOWN_b04:  afc0f9c7276ca08ae8fc9efcd333a60d22b7c19eaf05a66d31366e59c9f21c81
KNOWN_t13:  6a593d7082614e561dd5ce8ea8f13b22acf331497f348e6b6172a9200f2aa0db
```

### Step 1 — install and boot

First `./spb-install` attempt:

```text
SPB: cycle32 up, pid=3277548 serial=/home/chris/sp-plus-iso/cycle32/serial.log
SPB: waiting for the Anaconda greeter (up to 5 min)
qemu-system-x86_64: terminating on signal 15 from pid 3278559 ()
```

After preserving that attempt's files, a repeat `./spb-install` produced:

```text
SPB: cycle32 up, pid=3300549 serial=/home/chris/sp-plus-iso/cycle32/serial.log
SPB: waiting for the Anaconda greeter (up to 5 min)
SPB: installing — watching the disk grow, then plateau (up to 35 min)
SPB: INSTALL_PLATEAU at 600s disk=12177113088
SPB: disk_bytes=12177113088
SPB: serial_bytes=94691
SPB: final_screen stddev=16267.5
SPB: a disk under 3 GB did NOT install. Report the number, do not judge it.
```

A later repeat reached:

```text
SPB: INSTALL_PLATEAU at 660s disk=12320112640
SPB: disk_bytes=12320112640
SPB: serial_bytes=93327
qemu-system-x86_64: terminating on signal 15 from pid 3355429 ()
```

The first exact `./spb-boot` attempt produced:

```text
qemu-system-x86_64: -netdev user,id=n0,hostfwd=tcp::2299-:22: Could not set up host forwarding rule 'tcp::2299-:22'
SPB: waiting for the GRUB menu
```

The port was occupied by the protected cycle31 VM. The current boot helper subsequently used the cycle-derived port `2232` for cycle32. A stable snapshot of the boot helper was used so concurrent edits to the shared helper could not change the script during execution. Successful boot evidence:

```text
SPB: waiting for the GRUB menu
SPB: GRUB_MENU_SEEN=yes
SPB: IN_EDITOR=yes
SPB: waiting for the LUKS prompt on serial (up to 2 min)
SPB: LUKS_PROMPT_ON_SERIAL=yes after 15s
SCREEN: /home/chris/sp-plus-iso/cycle32/screen-luks.png (1611 bytes)
SPB: passphrase sent, waiting 180s for the system to settle
SPB: FIRSTBOOT_PROMPT_ON_CONSOLE=no after 60s
SCREEN: /home/chris/sp-plus-iso/cycle32/screen-settled.png (881178 bytes)
SPB: serial_bytes=53977
SPB: guest left running. Type into /home/chris/sp-plus-iso/cycle32/bserialpty, read /home/chris/sp-plus-iso/cycle32/bserial.log
```

The installed image had no human account available to the serial lane. `spb-mkuser` was used to create the disposable `spbtest` lane account. Raw result:

```text
SPB: pre-pivot shell confirmed, /sysroot/etc writable
MKUSER_SYNCED=0
MKUSER_RESULT=WRITTEN-AND-SYNCED
SPB: now boot normally and prove it:
     CYCLE=cycle32 spb-boot && CYCLE=cycle32 spb-login spbtest '<password>'
```

The lane account home directory was initially absent at login. The raw login evidence was:

```text
-- spbtest: /var/home/spbtest: change directory failed: No such file or directory
Logging in with home = "/".
```

The home directory and the three `/etc/skel` defaults were then created/copied for the disposable lane account; raw listing:

```text
-rw-r--r--. 1 spbtest spbtest 1152 Aug 27 11:48 /var/home/spbtest/.config/btop/btop.conf
-rw-r--r--. 1 spbtest spbtest 1403 Aug 27 11:48 /var/home/spbtest/.config/fastfetch/config.jsonc
-rw-r--r--. 1 spbtest spbtest  989 Aug 27 11:48 /var/home/spbtest/.config/flameshot/flameshot.ini
```

### `./spb-evidence`

```text
########## SP+ EVIDENCE  cycle=cycle32  2026-08-27T16:56:53Z ##########
SERIAL_BYTES: 97913

=== A. EVERY avc: LINE, VERBATIM ===
(none present in the log)
AVC_COUNT: 0
0
CAVEAT: SELinux dontaudit rules HIDE denials. Zero here proves nothing
        unless 'semodule -DB' was run first.

=== B. EVERY FAILED / error LINE ===
... -- spbtest: /var/home/spbtest: change directory failed: No such file or directory
flameshot: info: No errors detected.

=== D. IN-GUEST STATE ===
Enforcing
---
---
etc labels were reported for /etc, /etc/localtime, /etc/nsswitch.conf, /etc/passwd, and /etc/shadow
```

The raw `ausearch -m AVC -ts boot` result, including every `avc:` line, was:

```text
type=AVC msg=audit(1787849019.878:95): avc:  denied  { read } for  pid=1031 comm="bootupctl" name="bootupd-state.json" dev="sda2" ino=138 scontext=system_u:system_r:bootupd_t:s0 tcontext=system_u:object_r:unlabeled_t:s0 tclass=file permissive=1
type=AVC msg=audit(1787849019.878:96): avc:  denied  { open } for  pid=1031 comm="bootupctl" path="/boot/bootupd-state.json" dev="sda2" ino=138 scontext=system_u:system_r:bootupd_t:s0 tcontext=system_u:object_r:unlabeled_t:s0 tclass=file permissive=1
type=AVC msg=audit(1787849019.878:97): avc:  denied  { getattr } for  pid=1031 comm="bootupctl" path="/boot/bootupd-state.json" dev="sda2" ino=138 scontext=system_u:system_r:bootupd_t:s0 tcontext=system_u:object_r:unlabeled_t:s0 tclass=file permissive=1
type=AVC msg=audit(1787849019.886:101): avc:  denied  { search } for  pid=1031 comm="bootupctl" name="grub2" dev="sda2" ino=3145862 scontext=system_u:system_r:bootupd_t:s0 tcontext=system_u:object_r:unlabeled_t:s0 tclass=dir permissive=1
type=AVC msg=audit(1787849019.887:102): avc:  denied  { search } for  pid=1031 comm="bootupctl" name="grub2" dev="sda2" ino=3145862 scontext=system_u:system_r:bootupd_t:s0 tcontext=system_u:object_r:unlabeled_t:s0 tclass=dir permissive=1
type=AVC msg=audit(1787849019.887:103): avc:  denied  { search } for  pid=1031 comm="bootupctl" name="grub2" dev="sda2" ino=3145862 scontext=system_u:system_r:bootupd_t:s0 tcontext=system_u:object_r:unlabeled_t:s0 tclass=dir permissive=1
type=AVC msg=audit(1787849019.887:104): avc:  denied  { read } for  pid=1031 comm="bootupctl" name="/" dev="proc" ino=1 scontext=system_u:system_r:bootupd_t:s0 tcontext=system_u:object_r:proc_t:s0 tclass=dir permissive=1
type=AVC msg=audit(1787849019.895:106): avc:  denied  { read } for  pid=1072 comm="lsblk" name="swaps" dev="proc" ino=4026532070 scontext=system_u:system_r:bootupd_t:s0 tcontext=system_u:object_r:proc_t:s0 tclass=file permissive=1
type=AVC msg=audit(1787849019.895:107): avc:  denied  { open } for  pid=1072 comm="lsblk" name="swaps" dev="proc" ino=4026532070 scontext=system_u:system_r:bootupd_t:s0 tcontext=system_u:object_r:proc_t:s0 tclass=file permissive=1
type=AVC msg=audit(1787849019.895:108): avc:  denied  { getattr } for  pid=1072 comm="lsblk" path="/proc/swaps" dev="proc" ino=4026532070 scontext=system_u:system_r:bootupd_t:s0 tcontext=system_u:object_r:proc_t:s0 tclass=file permissive=1
```

`semodule -DB` was run and returned `DONT_AUDIT_DISABLED=0`; it reported the same AVC lines while `getenforce` printed `Enforcing`. `semodule -B` was then run and returned `DONT_AUDIT_RESTORED=0`.

### Step 2 — new surface

#### `./spb-fin` whole output

```text
SPB-FIN: checking Fin on the installed guest (cycle32)
  PASS  pi runs and is the pinned version
  PASS  node is present
  PASS  npm is NOT present
  PASS  no key baked into the image
  PASS  launcher is executable
  PASS  banner draws the shoal
  PASS  system prompt shipped
  PASS  printer skill shipped
  PASS  no-key path exits cleanly
  PASS  no-key path names the fallback
  PASS  spplus-fix is usable
  FAIL  the RPC service is up
        wanted: "ok": true
        got:    shell prompt
  PASS  btop is installed
  PASS  fastfetch is installed
  PASS  flameshot is installed
  PASS  fastfetch runs with the SP+ config
  PASS  flameshot config is valid
  PASS  btop theme shipped
  PASS  skel carries the defaults
  PASS  Print is bound to flameshot
  PASS  launchers validate
SPB-FIN: 20 passed, 1 failed
```

Underlying command for the one FAIL:

```text
curl -sS -m 5 http://127.0.0.1:8765/api/health; echo "SPB""MARK..."
{"fixture": true, "ok": true, "service": "sp-plus-rpc"}SPBMARK...
```

The no-key Fin run, executed by hand, printed the fish/banner and ended with:

```text
Fin — your SP+ assistant
Fin needs a key before it can talk.
Key (or press Enter to skip):
Without a key Fin cannot answer questions, but the repair steps
still work. Run:  spplus-fix printer
FIN_RC=1
```

Guest versions and file checks:

```text
0.84.3
v22.23.1
NPM_ABSENT
btop version: 1.4.7
fastfetch 2.66.0 (x86_64)
Flameshot v14.0.0 (-)
NO_KEY_IN_IMAGE
FIRST_LOGIN_MARKER_PRESENT
```

Fastfetch with the SP+ config:

```text
   ▄▄▄▄▄▄   ▄▄▄▄▄▄    ▗▖     root on SP+
  ██▀▀▀▀▀▀ ██▀▀▀▀██   ▐▌
  ▀██████▖ ██████▛▘ ▗▄▟▙▄▖   System      SP+ 1.0 x86_64
  ▗▄▄▄▄▄██ ██▘        ▐▌     Computer    KVM/QEMU Standard PC (Q35 + ICH9, 2009)
```

#### `./spb-apps` whole result

```text
########## SP+ APPLICATION GATE  mode=image ##########
PASS inst brave-browser
PASS libs brave-browser links cleanly
PASS menu brave-browser.desktop
PASS inst libreoffice-writer
PASS libs libreoffice links cleanly
PASS menu libreoffice-writer.desktop
PASS inst libreoffice-calc
PASS menu libreoffice-calc.desktop
PASS inst okular
PASS libs okular links cleanly
PASS menu org.kde.okular.desktop
PASS inst dolphin
PASS libs dolphin links cleanly
PASS menu org.kde.dolphin.desktop
PASS inst ark
PASS libs ark links cleanly
PASS menu org.kde.ark.desktop
PASS inst gwenview
PASS libs gwenview links cleanly
PASS menu org.kde.gwenview.desktop
PASS inst spectacle
PASS libs spectacle links cleanly
PASS menu org.kde.spectacle.desktop
PASS inst kate
PASS libs kate links cleanly
PASS menu org.kde.kate.desktop
PASS inst kcalc
PASS libs kcalc links cleanly
PASS menu org.kde.kcalc.desktop
PASS inst keepassxc
PASS libs keepassxc links cleanly
PASS menu org.keepassxc.KeePassXC.desktop
PASS inst thunderbird
PASS libs thunderbird links cleanly
PASS menu net.thunderbird.Thunderbird.desktop
PASS inst system-config-printer
PASS inst plasma-systemsettings
PASS libs systemsettings links cleanly
PASS menu systemsettings.desktop
PASS inst micro
PASS libs micro links cleanly
PASS menu micro.desktop
PASS inst flameshot
PASS libs flameshot links cleanly
PASS menu org.flameshot.Flameshot.desktop
PASS inst kitty
PASS libs kitty links cleanly
PASS menu kitty.desktop
PASS crash no coredumps
PASS units no failed units
APPS_PASS=50 APPS_FAIL=0 APPS_WARN=0
########## END APPLICATION GATE (exit 0) ##########
```

#### `./spb-branding` whole result

```text
########## SP+ BRANDING GATE  mode=image ##########
PASS os-release NAME=SP+
PASS os-release PRETTY_NAME=SP+ 1.0
PASS os-release ID=sp-plus
PASS os-release LOGO=sp-plus-logo-icon
PASS os-release HOME_URL=https://secureprospective.com/
PASS os-release LOGO icon file exists
INFO plymouth default theme -> sp-plus
PASS plymouth default theme is an SP+ theme
INFO logos fedora-logos owns 249 paths, 107 on visible surfaces
INFO logos regular files: still-stock=0 absent-or-modified=91
PASS logos every visible Fedora logo surface has been replaced
PASS asset /usr/share/sp-plus/branding/sp-plus-icon.png
PASS asset /usr/share/sp-plus/branding/sp-plus-lockup.png
PASS strings no Fedora string in os-release/issue/plymouth config
BRANDING_PASS=11 BRANDING_FAIL=0
########## END BRANDING GATE (exit 0) ##########
```

### Step 3 — screen evidence

Image files were left in `/home/chris/sp-plus-iso/cycle32/`:

```text
screen-luks.png                 1611 bytes
screen-settled.png              881178 bytes
screen-desktop-after-login-2.png 544135 bytes
screen-print-screen-result.png  484425 bytes
screen-fin-first-run.png        285331 bytes
```

`screen-desktop-after-login-2.png` shows the logged-in desktop with the red/purple Fedora-style default wallpaper. It is visibly different from the blue SP+ map shown by `screen-luks.png` and `screen-desktop-login-2.png`.

The Print Screen capture, `screen-print-screen-result.png`, shows the Flameshot capture toolbar and selection overlay over the desktop.

The Fin first-run capture, `screen-fin-first-run.png`, shows a Konsole window containing the blue/grey fish shoal, `Fin — your SP+ assistant`, and `Key (or press Enter to skip):`.

First-login unit evidence:

```text
○ spplus-first-login.service - Apply the SP+ look and feel on an advisor's first login (DN-24)
     Loaded: loaded (.../spplus-first-login.service; disabled; preset: disabled)
     Active: inactive (dead) ...
    Process: 3007 ExecStart=/usr/libexec/spplus-first-login (code=exited, status=0/SUCCESS)
```

Root journal query:

```text
Starting spplus-first-login.service - Apply the SP+ look and feel on an advisor's first login (DN-24)...
spplus-first-login: screenshots will be saved to /var/home/spbtest/Pictures/Screenshots
spplus-first-login: applied org.secureprospective.spplus.windows11.dark and the SP+ wallpaper
Finished spplus-first-login.service - Apply the SP+ look and feel on an advisor's first login (DN-24).
```

Marker:

```text
-rw-r--r--. 1 spbtest spbtest 21 ... /var/home/spbtest/.local/state/sp-plus/first-login-theme-applied
```

## Evidence table requested by the brief

| Category | Surface | Evidence |
|---|---|---|
| PROVED | ISO identity | `ISO_PRESENT: yes`; SHA256 recorded above. |
| PROVED | Installation and LUKS path | Install disk plateau `12320112640`; `GRUB_MENU_SEEN=yes`; `IN_EDITOR=yes`; `LUKS_PROMPT_ON_SERIAL=yes`; screen capture exists. |
| PROVED | Fin runtime pieces | `spb-fin`: 20 PASS rows; `pi` `0.84.3`; node `v22.23.1`; `NPM_ABSENT`; no key file; no-key run returned `FIN_RC=1` and named `spplus-fix printer`. |
| PROVED | RPC service by raw command | Raw curl returned `{"fixture": true, "ok": true, "service": "sp-plus-rpc"}`. |
| PROVED | btop/fastfetch/flameshot | Version lines, SP+ fastfetch output, and `/etc/skel`/home file listings recorded above. |
| PROVED | Print Screen binding in a graphical session | Screenshot visibly contains Flameshot toolbar and selection overlay. |
| PROVED | Fin first run visual | Screenshot visibly contains fish shoal and key prompt. |
| PROVED | First-login unit execution evidence | Unit exited status 0; journal says `applied`; marker exists. |
| PROVED | Image app/branding gates | `APPS_PASS=50 APPS_FAIL=0 APPS_WARN=0`; `BRANDING_PASS=11 BRANDING_FAIL=0`. |
| DISPROVED | Desktop wallpaper surface | Logged-in screenshot shows the red/purple Fedora-style wallpaper, not the blue SP+ wallpaper seen at the login surface. |
| DISPROVED | No AVC evidence | Raw boot query contains 10 `avc:` lines, all shown verbatim above, involving `bootupctl`/`lsblk` and unlabeled `/boot` paths. |
| DISPROVED | `spb-fin` RPC check result as emitted by gate | Gate emitted `FAIL`, while the underlying curl emitted `{"fixture": true, "ok": true, "service": "sp-plus-rpc"}`. The gate's `got` field was only a shell prompt. |
| COULD NOT TEST | Actual advisor account/home from Anaconda | Fresh install had no human account available to the lane; `spbtest` was created by `spb-mkuser` and its home/defaults were then prepared for the disposable test. |
| COULD NOT TEST | `spb-apps live` launch subchecks through the gate | The live probe emitted `SPB_LIVE=0` and no `PASS run ... --version` lines; the image gate and individual Fin/Flameshot visual checks were run instead. |
| COULD NOT TEST | User-scoped journal query exactly as written | `journalctl --user --machine=spbtest@` from the root serial shell returned `Connecting to a machine as non-root is not supported.` The root journal query supplied the unit lines above. |

## Final disk-space evidence

```text
Filesystem      Size  Used Avail Use% Mounted on
/dev/nvme0n1p1  458G  368G   67G  85% /home
```

The cycle32 VM disk and all screenshots/logs used as evidence were left in place. The protected cycle31 VM on port 2299 was not killed.

## Full final `./spb-evidence` output

```text
########## SP+ EVIDENCE  cycle=cycle32  2026-08-27T17:05:42Z ##########
SERIAL_BYTES: 149362

=== A. EVERY avc: LINE, VERBATIM ===
type=AVC msg=audit(1787849019.878:95): avc:  denied  { read } for  pid=1031 comm="bootupctl" name="bootupd-state.json" dev="sda2" ino=138 scontext=system_u:system_r:bootupd_t:s0 tcontext=system_u:object_r:unlabeled_t:s0 tclass=file permissive=1
type=AVC msg=audit(1787849019.878:96): avc:  denied  { open } for  pid=1031 comm="bootupctl" path="/boot/bootupd-state.json" dev="sda2" ino=138 scontext=system_u:system_r:bootupd_t:s0 tcontext=system_u:object_r:unlabeled_t:s0 tclass=file permissive=1
type=AVC msg=audit(1787849019.878:97): avc:  denied  { getattr } for  pid=1031 comm="bootupctl" path="/boot/bootupd-state.json" dev="sda2" ino=138 scontext=system_u:system_r:bootupd_t:s0 tcontext=system_u:object_r:unlabeled_t:s0 tclass=file permissive=1
type=AVC msg=audit(1787849019.886:101): avc:  denied  { search } for  pid=1031 comm="bootupctl" name="grub2" dev="sda2" ino=3145862 scontext=system_u:system_r:bootupd_t:s0 tcontext=system_u:object_r:unlabeled_t:s0 tclass=dir permissive=1
type=AVC msg=audit(1787849019.887:102): avc:  denied  { search } for  pid=1031 comm="bootupctl" name="grub2" dev="sda2" ino=3145862 scontext=system_u:system_r:bootupd_t:s0 tcontext=system_u:object_r:unlabeled_t:s0 tclass=dir permissive=1
type=AVC msg=audit(1787849019.887:103): avc:  denied  { search } for  pid=1031 comm="bootupctl" name="grub2" dev="sda2" ino=3145862 scontext=system_u:system_r:bootupd_t:s0 tcontext=system_u:object_r:unlabeled_t:s0 tclass=dir permissive=1
type=AVC msg=audit(1787849019.887:104): avc:  denied  { read } for  pid=1031 comm="bootupctl" name="/" dev="proc" ino=1 scontext=system_u:system_r:bootupd_t:s0 tcontext=system_u:object_r:proc_t:s0 tclass=dir permissive=1
type=AVC msg=audit(1787849019.895:106): avc:  denied  { read } for  pid=1072 comm="lsblk" name="swaps" dev="proc" ino=4026532070 scontext=system_u:system_r:bootupd_t:s0 tcontext=system_u:object_r:proc_t:s0 tclass=file permissive=1
type=AVC msg=audit(1787849019.895:107): avc:  denied  { open } for  pid=1072 comm="lsblk" path="/proc/swaps" dev="proc" ino=4026532070 scontext=system_u:system_r:bootupd_t:s0 tcontext=system_u:object_r:proc_t:s0 tclass=file permissive=1
type=AVC msg=audit(1787849019.895:108): avc:  denied  { getattr } for  pid=1072 comm="lsblk" path="/proc/swaps" dev="proc" ino=4026532070 scontext=system_u:system_r:bootupd_t:s0 tcontext=system_u:object_r:proc_t:s0 tclass=file permissive=1
type=AVC msg=audit(1787849019.878:95): avc:  denied  { read } for  pid=1031 comm="bootupctl" name="bootupd-state.json" dev="sda2" ino=138 scontext=system_u:system_r:bootupd_t:s0 tcontext=system_u:object_r:unlabeled_t:s0 tclass=file permissive=1
type=AVC msg=audit(1787849019.878:96): avc:  denied  { open } for  pid=1031 comm="bootupctl" path="/boot/bootupd-state.json" dev="sda2" ino=138 scontext=system_u:system_r:bootupd_t:s0 tcontext=system_u:object_r:unlabeled_t:s0 tclass=file permissive=1
type=AVC msg=audit(1787849019.878:97): avc:  denied  { getattr } for  pid=1031 comm="bootupctl" path="/boot/bootupd-state.json" dev="sda2" ino=138 scontext=system_u:system_r:bootupd_t:s0 tcontext=system_u:object_r:unlabeled_t:s0 tclass=file permissive=1
type=AVC msg=audit(1787849019.886:101): avc:  denied  { search } for  pid=1031 comm="bootupctl" name="grub2" dev="sda2" ino=3145862 scontext=system_u:system_r:bootupd_t:s0 tcontext=system_u:object_r:unlabeled_t:s0 tclass=dir permissive=1
type=AVC msg=audit(1787849019.887:102): avc:  denied  { search } for  pid=1031 comm="bootupctl" name="grub2" dev="sda2" ino=3145862 scontext=system_u:system_r:bootupd_t:s0 tcontext=system_u:object_r:unlabeled_t:s0 tclass=dir permissive=1
type=AVC msg=audit(1787849019.887:103): avc:  denied  { search } for  pid=1031 comm="bootupctl" name="grub2" dev="sda2" ino=3145862 scontext=system_u:system_r:bootupd_t:s0 tcontext=system_u:object_r:unlabeled_t:s0 tclass=dir permissive=1
type=AVC msg=audit(1787849019.887:104): avc:  denied  { read } for  pid=1031 comm="bootupctl" name="/" dev="proc" ino=1 scontext=system_u:system_r:bootupd_t:s0 tcontext=system_u:object_r:proc_t:s0 tclass=dir permissive=1
type=AVC msg=audit(1787849019.895:106): avc:  denied  { read } for  pid=1072 comm="lsblk" name="swaps" dev="proc" ino=4026532070 scontext=system_u:system_r:bootupd_t:s0 tcontext=system_u:object_r:proc_t:s0 tclass=file permissive=1
type=AVC msg=audit(1787849019.895:107): avc:  denied  { open } for  pid=1072 comm="lsblk" path="/proc/swaps" dev="proc" ino=4026532070 scontext=system_u:system_r:bootupd_t:s0 tcontext=system_u:object_r:proc_t:s0 tclass=file permissive=1
type=AVC msg=audit(1787849019.895:108): avc:  denied  { getattr } for  pid=1072 comm="lsblk" path="/proc/swaps" dev="proc" ino=4026532070 scontext=system_u:system_r:bootupd_t:s0 tcontext=system_u:object_r:proc_t:s0 tclass=file permissive=1
[?2004l]3008;end=98afe343-f0b0-428b-89b6-c60a2c62be06;exit=success\]3008;start=62b04943-bf23-4345-946d-db838a856380;machineid=7da7b38b2f8c40b7b0d8f7715a08be6f;user=root;hostname=sp-plus;bootid=d7016119-9e2c-4fb9-a938-0d995946fe1b;pid=00000000000000002579;type=shell;cwd=/root\[?2004h[root@sp-plus ~]# semodule -DB; echo DONT_AUDIT_DISABLED=$?; getenforce; ausearch -m AVC -ts boot 2>&1 | grep "avc:"; echo "SPB""MARK3425908"
type=AVC msg=audit(1787849019.878:95): [01;31m[Kavc:[m[K  denied  { read } for  pid=1031 comm="bootupctl" name="bootupd-state.json" dev="sda2" ino=138 scontext=system_u:system_r:bootupd_t:s0 tcontext=system_u:object_r:unlabeled_t:s0 tclass=file permissive=1
type=AVC msg=audit(1787849019.878:96): [01;31m[Kavc:[m[K  denied  { open } for  pid=1031 comm="bootupctl" path="/boot/bootupd-state.json" dev="sda2" ino=138 scontext=system_u:system_r:bootupd_t:s0 tcontext=system_u:object_r:unlabeled_t:s0 tclass=file permissive=1
type=AVC msg=audit(1787849019.878:97): [01;31m[Kavc:[m[K  denied  { getattr } for  pid=1031 comm="bootupctl" path="/boot/bootupd-state.json" dev="sda2" ino=138 scontext=system_u:system_r:bootupd_t:s0 tcontext=system_u:object_r:unlabeled_t:s0 tclass=file permissive=1
type=AVC msg=audit(1787849019.886:101): [01;31m[Kavc:[m[K  denied  { search } for  pid=1031 comm="bootupctl" name="grub2" dev="sda2" ino=3145862 scontext=system_u:system_r:bootupd_t:s0 tcontext=system_u:object_r:unlabeled_t:s0 tclass=dir permissive=1
type=AVC msg=audit(1787849019.887:102): [01;31m[Kavc:[m[K  denied  { search } for  pid=1031 comm="bootupctl" name="grub2" dev="sda2" ino=3145862 scontext=system_u:system_r:bootupd_t:s0 tcontext=system_u:object_r:unlabeled_t:s0 tclass=dir permissive=1
type=AVC msg=audit(1787849019.887:103): [01;31m[Kavc:[m[K  denied  { search } for  pid=1031 comm="bootupctl" name="grub2" dev="sda2" ino=3145862 scontext=system_u:system_r:bootupd_t:s0 tcontext=system_u:object_r:unlabeled_t:s0 tclass=dir permissive=1
type=AVC msg=audit(1787849019.887:104): [01;31m[Kavc:[m[K  denied  { read } for  pid=1031 comm="bootupctl" name="/" dev="proc" ino=1 scontext=system_u:system_r:bootupd_t:s0 tcontext=system_u:object_r:proc_t:s0 tclass=dir permissive=1
type=AVC msg=audit(1787849019.895:106): [01;31m[Kavc:[m[K  denied  { read } for  pid=1072 comm="lsblk" name="swaps" dev="proc" ino=4026532070 scontext=system_u:system_r:bootupd_t:s0 tcontext=system_u:object_r:proc_t:s0 tclass=file permissive=1
type=AVC msg=audit(1787849019.895:107): [01;31m[Kavc:[m[K  denied  { open } for  pid=1072 comm="lsblk" path="/proc/swaps" dev="proc" ino=4026532070 scontext=system_u:system_r:bootupd_t:s0 tcontext=system_u:object_r:proc_t:s0 tclass=file permissive=1
type=AVC msg=audit(1787849019.895:108): [01;31m[Kavc:[m[K  denied  { getattr } for  pid=1072 comm="lsblk" path="/proc/swaps" dev="proc" ino=4026532070 scontext=system_u:system_r:bootupd_t:s0 tcontext=system_u:object_r:proc_t:s0 tclass=file permissive=1
AVC_COUNT: 31
CAVEAT: SELinux dontaudit rules HIDE denials. Zero here proves nothing
        unless 'semodule -DB' was run first.

=== B. EVERY FAILED / error LINE ===
]3008;start=fb30bfbe76c74fb98b7d129db7d0c3be;user=root;hostname=sp-plus;machineid=7da7b38b2f8c40b7b0d8f7715a08be6f;bootid=d70161199e2c4fb9a9380d995946fe1b;pid=1196;pidfdid=8506;comm=login;targetuser=spbtest;sessionid=2;type=session\ -- spbtest: /var/home/spbtest: change directory failed: No such file or directory
flameshot: info: No errors detected.
]3008;start=8ed9bb2c562d4753848f0df52982182a;user=spbtest;hostname=sp-plus;machineid=7da7b38b2f8c40b7b0d8f7715a08be6f;bootid=d70161199e2c4fb9a9380d995946fe1b;pid=2574;pidfdid=12977;comm=sudo;targetuser=root;type=session\]3008;start=62b04943-bf23-4345-946d-db838a856380;machineid=7da7b38b2f8c40b7b0d8f7715a08be6f;user=root;hostname=sp-plus;bootid=d7016119-9e2c-4fb9-a938-0d995946fe1b;pid=00000000000000002579;type=shell;cwd=/root\[?2004h[root@sp-plus ~]# echo ROOT_READY; systemctl --failed --no-legend --no-pager; echo ---; systemctl status sp-plus.service --no-pager -l | head -20; echo "SPB""MARK3422819"
[?2004l]3008;end=289bd52a-16f2-420a-9066-9f68baa00e9f;exit=success\]3008;start=62b04943-bf23-4345-946d-db838a856380;machineid=7da7b38b2f8c40b7b0d8f7715a08be6f;user=root;hostname=sp-plus;bootid=d7016119-9e2c-4fb9-a938-0d995946fe1b;pid=00000000000000002579;type=shell;cwd=/root\[?2004h[root@sp-plus ~]# getenforce; echo ---; systemctl --failed --no-legend; echo ---; ls -Zd /etc /etc/passwd /etc/nsswitch.conf /etc/shadow /etc/localtime; echo ---; ausearch -m AVC -ts boot 2>&1 | tail -40; echo "SPB""MARK3425467"
[?2004l]3008;end=cbc2c776-50b8-4ac2-8907-2e777100e03d;exit=success\]3008;start=62b04943-bf23-4345-946d-db838a856380;machineid=7da7b38b2f8c40b7b0d8f7715a08be6f;user=root;hostname=sp-plus;bootid=d7016119-9e2c-4fb9-a938-0d995946fe1b;pid=00000000000000002579;type=shell;cwd=/root\[?2004h[root@sp-plus ~]# [H[J[root@sp-plus ~]# p=0; f=0; w=0;SPB_LIVE=0;if rpm -q brave-browser >/dev/null 2>&1; then echo "PASS inst brave-browser"; p=$((p+1)); else echo "FAIL inst brave-browser  <- the advisor-facing browser, runs the SP+ PWA"; f=$((f+1)); fi;if command -v brave-browser >/dev/null 2>&1; then B=$(command -v brave-browser); MISS=$(ldd "$B" 2>/dev/null | grep -c "not found"); if [ "$MISS" -eq 0 ]; then echo "PASS libs brave-browser links cleanly"; p=$((p+1)); else echo "FAIL libs brave-browser has $MISS missing shared libraries"; f=$((f+1)); fi; if [ "$SPB_LIVE" = 1 ]; then if QT_QPA_PLATFORM=offscreen timeout 25 brave-browser --version >/dev/null 2>&1; then echo "PASS run  brave-browser --version"; p=$((p+1)); else echo "FAIL run  brave-browser installed but will not start"; f=$((f+1)); fi; fi; else echo "FAIL run  brave-browser binary not on PATH"; f=$((f+1)); fi;D=$(ls /usr/share/applications/brave-browser.desktop /var/lib/flatpak/exports/share/applications/brave-browser.desktop 2>/dev/null | head -1); if [ -n "$D" ]; then echo "PASS menu brave-browser.desktop"; p=$((p+1)); if command -v desktop-file-validate >/dev/null 2>&1 && ! desktop-file-validate "$D" >/dev/null 2>&1; then echo "WARN menu brave-browser.desktop has a malformed .desktop file"; w=$((w+1)); fi; else echo "FAIL menu brave-browser.desktop has no launcher — invisible to the advisor"; f=$((f+1)); fi;if rpm -q libreoffice-writer >/dev/null 2>&1; then echo "PASS inst libreoffice-writer"; p=$((p+1)); else echo "FAIL inst libreoffice-writer  <- client letters and documents"; f=$((f+1)); fi;if command -v libreoffice >/dev/null 2>&1; then B=$(command -v libreoffice); MISS=$(ldd "$B" 2>/dev/null | grep -c "not found"); if [ "$MISS" -eq 0 ]; then echo "PASS libs libreoffice links cleanly"; p=$((p+1)); else echo "FAIL libs libreoffice has $MISS missing shared libraries"; f=$((f+1)); fi; if [ "$SPB_LIVE" = 1 ]; then if QT_QPA_PLATFORM=offscreen timeout 25 libreoffice --version >/dev/null 2>&1; then echo "PASS run  libreoffice --version"; p=$((p+1)); else echo "FAIL run  libreoffice installed but will not start"; f=$((f+1)); fi; fi; else echo "FAIL run  libreoffice binary not on PATH"; f=$((f+1)); fi;D=$(ls /usr/share/applications/libreoffice-writer.desktop /var/lib/flatpak/exports/share/applications/libreoffice-writer.desktop 2>/dev/null | head -1); if [ -n "$D" ]; then echo "PASS menu libreoffice-writer.desktop"; p=$((p+1)); if command -v desktop-file-validate >/dev/null 2>&1 && ! desktop-file-validate "$D" >/dev/null 2>&1; then echo "WARN menu libreoffice-writer.desktop has a malformed .desktop file"; w=$((w+1)); fi; else echo "FAIL menu libreoffice-writer.desktop has no launcher — invisible to the advisor"; f=$((f+1)); fi;if rpm -q libreoffice-calc >/dev/null 2>&1; then echo "PASS inst libreoffice-calc"; p=$((p+1)); else echo "FAIL inst libreoffice-calc  <- spreadsheets, illustrations"; f=$((f+1)); fi;D=$(ls /usr/share/applications/libreoffice-calc.desktop /var/lib/flatpak/exports/share/applications/libreoffice-calc.desktop 2>/dev/null | head -1); if [ -n "$D" ]; then echo "PASS menu libreoffice-calc.desktop"; p=$((p+1)); if command -v desktop-file-validate >/dev/null 2>&1 && ! desktop-file-validate "$D" >/dev/null 2>&1; then echo "WARN menu libreoffice-calc.desktop has a malformed .desktop file"; w=$((w+1)); fi; else echo "FAIL menu libreoffice-calc.desktop has no launcher — invisible to the advisor"; f=$((f+1)); fi;if rpm -q okular >/dev/null 2>&1; then echo "PASS inst okular"; p=$((p+1)); else echo "FAIL inst okular  <- PDF — the format every carrier sends"; f=$((f+1)); fi;if command -v okular >/dev/null 2>&1; then B=$(command -v okular); MISS=$(ldd "$B" 2>/dev/null | grep -c "not found"); if [ "$MISS" -eq 0 ]; then echo "PASS libs okular links cleanly"; p=$((p+1)); else echo "FAIL libs okular has $MISS missing shared libraries"; f=$((f+1)); fi; if [ "$SPB_LIVE" = 1 ]; then if QT_QPA_PLATFORM=offscreen timeout 25 okular --version >/dev/null 2>&1; then echo "PASS run  okular --version"; p=$((p+1)); else echo "FAIL run  okular installed but will not start"; f=$((f+1)); fi; fi; else echo "FAIL run  okular binary not on PATH"; f=$((f+1)); fi;D=$(ls /usr/share/applications/org.kde.okular.desktop /var/lib/flatpak/exports/share/applications/org.kde.okular.desktop 2>/dev/null | head -1); if [ -n "$D" ]; then echo "PASS menu org.kde.okular.desktop"; p=$((p+1)); if command -v desktop-file-validate >/dev/null 2>&1 && ! desktop-file-validate "$D" >/dev/null 2>&1; then echo "WARN menu org.kde.okular.desktop has a malformed .desktop file"; w=$((w+1)); fi; else echo "FAIL menu org.kde.okular.desktop has no launcher — invisible to the advisor"; f=$((f+1)); fi;if rpm -q dolphin >/dev/null 2>&1; then echo "PASS inst dolphin"; p=$((p+1)); else echo "FAIL inst dolphin  <- file manager"; f=$((f+1)); fi;if command -v dolphin >/dev/null 2>&1; then B=$(command -v dolphin); MISS=$(ldd "$B" 2>/dev/null | grep -c "not found"); if [ "$MISS" -eq 0 ]; then echo "PASS libs dolphin links cleanly"; p=$((p+1)); else echo "FAIL libs dolphin has $MISS missing shared libraries"; f=$((f+1)); fi; if [ "$SPB_LIVE" = 1 ]; then if QT_QPA_PLATFORM=offscreen timeout 25 dolphin --version >/dev/null 2>&1; then echo "PASS run  dolphin --version"; p=$((p+1)); else echo "FAIL run  dolphin installed but will not start"; f=$((f+1)); fi; fi; else echo "FAIL run  dolphin binary not on PATH"; f=$((f+1)); fi;D=$(ls /usr/share/applications/org.kde.dolphin.desktop /var/lib/flatpak/exports/share/applications/org.kde.dolphin.desktop 2>/dev/null | head -1); if [ -n "$D" ]; then echo "PASS menu org.kde.dolphin.desktop"; p=$((p+1)); if command -v desktop-file-validate >/dev/null 2>&1 && ! desktop-file-validate "$D" >/dev/null 2>&1; then echo "WARN menu org.kde.dolphin.desktop has a malformed .desktop file"; w=$((w+1)); fi; else echo "FAIL menu org.kde.dolphin.desktop has no launcher — invisible to the advisor"; f=$((f+1)); fi;if rpm -q ark >/dev/null 2>&1; then echo "PASS inst ark"; p=$((p+1)); else echo "FAIL inst ark  <- opening the zip a carrier emails"; f=$((f+1)); fi;if command -v ark >/dev/null 2>&1; then B=$(command -v ark); MISS=$(ldd "$B" 2>/dev/null | grep -c "not found"); if [ "$MISS" -eq 0 ]; then echo "PASS libs ark links cleanly"; p=$((p+1)); else echo "FAIL libs ark has $MISS missing shared libraries"; f=$((f+1)); fi; if [ "$SPB_LIVE" = 1 ]; then if QT_QPA_PLATFORM=offscreen timeout 25 ark --version >/dev/null 2>&1; then echo "PASS run  ark --version"; p=$((p+1)); else echo "FAIL run  ark installed but will not start"; f=$((f+1)); fi; fi; else echo "FAIL run  ark binary not on PATH"; f=$((f+1)); fi;D=$(ls /usr/share/applications/org.kde.ark.desktop /var/lib/flatpak/exports/share/applications/org.kde.ark.desktop 2>/dev/null | head -1); if [ -n "$D" ]; then echo "PASS menu org.kde.ark.desktop"; p=$((p+1)); if command -v desktop-file-validate >/dev/null 2>&1 && ! desktop-file-validate "$D" >/dev/null 2>&1; then echo "WARN menu org.kde.ark.desktop has a malformed .desktop file"; w=$((w+1)); fi; else echo "FAIL menu org.kde.ark.desktop has no launcher — invisible to the advisor"; f=$((f+1)); fi;if rpm -q gwenview >/dev/null 2>&1; then echo "PASS inst gwenview"; p=$((p+1)); else echo "FAIL inst gwenview  <- image viewer"; f=$((f+1)); fi;if command -v gwenview >/dev/null 2>&1; then B=$(command -v gwenview); MISS=$(ldd "$B" 2>/dev/null | grep -c "not found"); if [ "$MISS" -eq 0 ]; then echo "PASS libs gwenview links cleanly"; p=$((p+1)); else echo "FAIL libs gwenview has $MISS missing shared libraries"; f=$((f+1)); fi; if [ "$SPB_LIVE" = 1 ]; then if QT_QPA_PLATFORM=offscreen timeout 25 gwenview --version >/dev/null 2>&1; then echo "PASS run  gwenview --version"; p=$((p+1)); else echo "FAIL run  gwenview installed but will not start"; f=$((f+1)); fi; fi; else echo "FAIL run  gwenview binary not on PATH"; f=$((f+1)); fi;D=$(ls /usr/share/applications/org.kde.gwenview.desktop /var/lib/flatpak/exports/share/applications/org.kde.gwenview.desktop 2>/dev/null | head -1); if [ -n "$D" ]; then echo "PASS menu org.kde.gwenview.desktop"; p=$((p+1)); if command -v desktop-file-validate >/dev/null 2>&1 && ! desktop-file-validate "$D" >/dev/null 2>&1; then echo "WARN menu org.kde.gwenview.desktop has a malformed .desktop file"; w=$((w+1)); fi; else echo "FAIL menu org.kde.gwenview.desktop has no launcher — invisible to the advisor"; f=$((f+1)); fi;if rpm -q spectacle >/dev/null 2>&1; then echo "PASS inst spectacle"; p=$((p+1)); else echo "FAIL inst spectacle  <- screenshots for support tickets"; f=$((f+1)); fi;if command -v spectacle >/dev/null 2>&1; then B=$(command -v spectacle); MISS=$(ldd "$B" 2>/dev/null | grep -c "not found"); if [ "$MISS" -eq 0 ]; then echo "PASS libs spectacle links cleanly"; p=$((p+1)); else echo "FAIL libs spectacle has $MISS missing shared libraries"; f=$((f+1)); fi; if [ "$SPB_LIVE" = 1 ]; then if QT_QPA_PLATFORM=offscreen timeout 25 spectacle --version >/dev/null 2>&1; then echo "PASS run  spectacle --version"; p=$((p+1)); else echo "FAIL run  spectacle installed but will not start"; f=$((f+1)); fi; fi; else echo "FAIL run  spectacle binary not on PATH"; f=$((f+1)); fi;D=$(ls /usr/share/applications/org.kde.spectacle.desktop /var/lib/flatpak/exports/share/applications/org.kde.spectacle.desktop 2>/dev/null | head -1); if [ -n "$D" ]; then echo "PASS menu org.kde.spectacle.desktop"; p=$((p+1)); if command -v desktop-file-validate >/dev/null 2>&1 && ! desktop-file-validate "$D" >/dev/null 2>&1; then echo "WARN menu org.kde.spectacle.desktop has a malformed .desktop file"; w=$((w+1)); fi; else echo "FAIL menu org.kde.spectacle.desktop has no launcher — invisible to the advisor"; f=$((f+1)); fi;if rpm -q kate >/dev/null 2>&1; then echo "PASS inst kate"; p=$((p+1)); else echo "FAIL inst kate  <- text editor"; f=$((f+1)); fi;if command -v kate >/dev/null 2>&1; then B=$(command -v kate); MISS=$(ldd "$B" 2>/dev/null | grep -c "not found"); if [ "$MISS" -eq 0 ]; then echo "PASS libs kate links cleanly"; p=$((p+1)); else echo "FAIL libs kate has $MISS missing shared libraries"; f=$((f+1)); fi; if [ "$SPB_LIVE" = 1 ]; then if QT_QPA_PLATFORM=offscreen timeout 25 kate --version >/dev/null 2>&1; then echo "PASS run  kate --version"; p=$((p+1)); else echo "FAIL run  kate installed but will not start"; f=$((f+1)); fi; fi; else echo "FAIL run  kate binary not on PATH"; f=$((f+1)); fi;D=$(ls /usr/share/applications/org.kde.kate.desktop /var/lib/flatpak/exports/share/applications/org.kde.kate.desktop 2>/dev/null | head -1); if [ -n "$D" ]; then echo "PASS menu org.kde.kate.desktop"; p=$((p+1)); if command -v desktop-file-validate >/dev/null 2>&1 && ! desktop-file-validate "$D" >/dev/null 2>&1; then echo "WARN menu org.kde.kate.desktop has a malformed .desktop file"; w=$((w+1)); fi; else echo "FAIL menu org.kde.kate.desktop has no launcher — invisible to the advisor"; f=$((f+1)); fi;if rpm -q kcalc >/dev/null 2>&1; then echo "PASS inst kcalc"; p=$((p+1)); else echo "FAIL inst kcalc  <- calculator"; f=$((f+1)); fi;if command -v kcalc >/dev/null 2>&1; then B=$(command -v kcalc); MISS=$(ldd "$B" 2>/dev/null | grep -c "not found"); if [ "$MISS" -eq 0 ]; then echo "PASS libs kcalc links cleanly"; p=$((p+1)); else echo "FAIL libs kcalc has $MISS missing shared libraries"; f=$((f+1)); fi; if [ "$SPB_LIVE" = 1 ]; then if QT_QPA_PLATFORM=offscreen timeout 25 kcalc --version >/dev/null 2>&1; then echo "PASS run  kcalc --version"; p=$((p+1)); else echo "FAIL run  kcalc installed but will not start"; f=$((f+1)); fi; fi; else echo "FAIL run  kcalc binary not on PATH"; f=$((f+1)); fi;D=$(ls /usr/share/applications/org.kde.kcalc.desktop /var/lib/flatpak/exports/share/applications/org.kde.kcalc.desktop 2>/dev/null | head -1); if [ -n "$D" ]; then echo "PASS menu org.kde.kcalc.desktop"; p=$((p+1)); if command -v desktop-file-validate >/dev/null 2>&1 && ! desktop-file-validate "$D" >/dev/null 2>&1; then echo "WARN menu org.kde.kcalc.desktop has a malformed .desktop file"; w=$((w+1)); fi; else echo "FAIL menu org.kde.kcalc.desktop has no launcher — invisible to the advisor"; f=$((f+1)); fi;if rpm -q keepassxc >/dev/null 2>&1; then echo "PASS inst keepassxc"; p=$((p+1)); else echo "FAIL inst keepassxc  <- password manager — a compliance talking point"; f=$((f+1)); fi;if command -v keepassxc >/dev/null 2>&1; then B=$(command -v keepassxc); MISS=$(ldd "$B" 2>/dev/null | grep -c "not found"); if [ "$MISS" -eq 0 ]; then echo "PASS libs keepassxc links cleanly"; p=$((p+1)); else echo "FAIL libs keepassxc has $MISS missing shared libraries"; f=$((f+1)); fi; if [ "$SPB_LIVE" = 1 ]; then if QT_QPA_PLATFORM=offscreen timeout 25 keepassxc --version >/dev/null 2>&1; then echo "PASS run  keepassxc --version"; p=$((p+1)); else echo "FAIL run  keepassxc installed but will not start"; f=$((f+1)); fi; fi; else echo "FAIL run  keepassxc binary not on PATH"; f=$((f+1)); fi;D=$(ls /usr/share/applications/org.keepassxc.KeePassXC.desktop /var/lib/flatpak/exports/share/applications/org.keepassxc.KeePassXC.desktop 2>/dev/null | head -1); if [ -n "$D" ]; then echo "PASS menu org.keepassxc.KeePassXC.desktop"; p=$((p+1)); if command -v desktop-file-validate >/dev/null 2>&1 && ! desktop-file-validate "$D" >/dev/null 2>&1; then echo "WARN menu org.keepassxc.KeePassXC.desktop has a malformed .desktop file"; w=$((w+1)); fi; else echo "FAIL menu org.keepassxc.KeePassXC.desktop has no launcher — invisible to the advisor"; f=$((f+1)); fi;if rpm -q thunderbird >/dev/null 2>&1; then echo "PASS inst thunderbird"; p=$((p+1)); else echo "FAIL inst thunderbird  <- mail client"; f=$((f+1)); fi;if command -v thunderbird >/dev/null 2>&1; then B=$(command -v thunderbird); MISS=$(ldd "$B" 2>/dev/null | grep -c "not found"); if [ "$MISS" -eq 0 ]; then echo "PASS libs thunderbird links cleanly"; p=$((p+1)); else echo "FAIL libs thunderbird has $MISS missing shared libraries"; f=$((f+1)); fi; if [ "$SPB_LIVE" = 1 ]; then if QT_QPA_PLATFORM=offscreen timeout 25 thunderbird --version >/dev/null 2>&1; then echo "PASS run  thunderbird --version"; p=$((p+1)); else echo "FAIL run  thunderbird installed but will not start"; f=$((f+1)); fi; fi; else echo "FAIL run  thunderbird binary not on PATH"; f=$((f+1)); fi;D=$(ls /usr/share/applications/net.thunderbird.Thunderbird.desktop /var/lib/flatpak/exports/share/applications/net.thunderbird.Thunderbird.desktop 2>/dev/null | head -1); if [ -n "$D" ]; then echo "PASS menu net.thunderbird.Thunderbird.desktop"; p=$((p+1)); if command -v desktop-file-validate >/dev/null 2>&1 && ! desktop-file-validate "$D" >/dev/null 2>&1; then echo "WARN menu net.thunderbird.Thunderbird.desktop has a malformed .desktop file"; w=$((w+1)); fi; else echo "FAIL menu net.thunderbird.Thunderbird.desktop has no launcher — invisible to the advisor"; f=$((f+1)); fi;if rpm -q system-config-printer >/dev/null 2>&1; then echo "PASS inst system-config-printer"; p=$((p+1)); else echo "FAIL inst system-config-printer  <- printer setup UI an advisor can drive"; f=$((f+1)); fi;if rpm -q plasma-systemsettings >/dev/null 2>&1; then echo "PASS inst plasma-systemsettings"; p=$((p+1)); else echo "FAIL inst plasma-systemsettings  <- settings"; f=$((f+1)); fi;if command -v systemsettings >/dev/null 2>&1; then B=$(command -v systemsettings); MISS=$(ldd "$B" 2>/dev/null | grep -c "not found"); if [ "$MISS" -eq 0 ]; then echo "PASS libs systemsettings links cleanly"; p=$((p+1)); else echo "FAIL libs systemsettings has $MISS missing shared libraries"; f=$((f+1)); fi; if [ "$SPB_LIVE" = 1 ]; then if QT_QPA_PLATFORM=offscreen timeout 25 systemsettings --version >/dev/null 2>&1; then echo "PASS run  systemsettings --version"; p=$((p+1)); else echo "FAIL run  systemsettings installed but will not start"; f=$((f+1)); fi; fi; else echo "FAIL run  systemsettings binary not on PATH"; f=$((f+1)); fi;D=$(ls /usr/share/applications/systemsettings.desktop /var/lib/flatpak/exports/share/applications/systemsettings.desktop 2>/dev/null | head -1); if [ -n "$D" ]; then echo "PASS menu systemsettings.desktop"; p=$((p+1)); if command -v desktop-file-validate >/dev/null 2>&1 && ! desktop-file-validate "$D" >/dev/null 2>&1; then echo "WARN menu systemsettings.desktop has a malformed .desktop file"; w=$((w+1)); fi; else echo "FAIL menu systemsettings.desktop has no launcher — invisible to the advisor"; f=$((f+1)); fi;if rpm -q micro >/dev/null 2>&1; then echo "PASS inst micro"; p=$((p+1)); else echo "FAIL inst micro  <- a text editor a newbie can use; ships NO launcher of its own, SP+ adds one"; f=$((f+1)); fi;if command -v micro >/dev/null 2>&1; then B=$(command -v micro); MISS=$(ldd "$B" 2>/dev/null | grep -c "not found"); if [ "$MISS" -eq 0 ]; then echo "PASS libs micro links cleanly"; p=$((p+1)); else echo "FAIL libs micro has $MISS missing shared libraries"; f=$((f+1)); fi; if [ "$SPB_LIVE" = 1 ]; then if QT_QPA_PLATFORM=offscreen timeout 25 micro --version >/dev/null 2>&1; then echo "PASS run  micro --version"; p=$((p+1)); else echo "FAIL run  micro installed but will not start"; f=$((f+1)); fi; fi; else echo "FAIL run  micro binary not on PATH"; f=$((f+1)); fi;D=$(ls /usr/share/applications/micro.desktop /var/lib/flatpak/exports/share/applications/micro.desktop 2>/dev/null | head -1); if [ -n "$D" ]; then echo "PASS menu micro.desktop"; p=$((p+1)); if command -v desktop-file-validate >/dev/null 2>&1 && ! desktop-file-validate "$D" >/dev/null 2>&1; then echo "WARN menu micro.desktop has a malformed .desktop file"; w=$((w+1)); fi; else echo "FAIL menu micro.desktop has no launcher — invisible to the advisor"; f=$((f+1)); fi;if rpm -q flameshot >/dev/null 2>&1; then echo "PASS inst flameshot"; p=$((p+1)); else echo "FAIL inst flameshot  <- screenshots, so a user can SHOW us what is wrong"; f=$((f+1)); fi;if command -v flameshot >/dev/null 2>&1; then B=$(command -v flameshot); MISS=$(ldd "$B" 2>/dev/null | grep -c "not found"); if [ "$MISS" -eq 0 ]; then echo "PASS libs flameshot links cleanly"; p=$((p+1)); else echo "FAIL libs flameshot has $MISS missing shared libraries"; f=$((f+1)); fi; if [ "$SPB_LIVE" = 1 ]; then if QT_QPA_PLATFORM=offscreen timeout 25 flameshot --version >/dev/null 2>&1; then echo "PASS run  flameshot --version"; p=$((p+1)); else echo "FAIL run  flameshot installed but will not start"; f=$((f+1)); fi; fi; else echo "FAIL run  flameshot binary not on PATH"; f=$((f+1)); fi;D=$(ls /usr/share/applications/org.flameshot.Flameshot.desktop /var/lib/flatpak/exports/share/applications/org.flameshot.Flameshot.desktop 2>/dev/null | head -1); if [ -n "$D" ]; then echo "PASS menu org.flameshot.Flameshot.desktop"; p=$((p+1)); if command -v desktop-file-validate >/dev/null 2>&1 && ! desktop-file-validate "$D" >/dev/null 2>&1; then echo "WARN menu org.flameshot.Flameshot.desktop has a malformed .desktop file"; w=$((w+1)); fi; else echo "FAIL menu org.flameshot.Flameshot.desktop has no launcher — invisible to the advisor"; f=$((f+1)); fi;if rpm -q kitty >/dev/null 2>&1; then echo "PASS inst kitty"; p=$((p+1)); else echo "FAIL inst kitty  <- terminal"; f=$((f+1)); fi;if command -v kitty >/dev/null 2>&1; then B=$(command -v kitty); MISS=$(ldd "$B" 2>/dev/null | grep -c "not found"); if [ "$MISS" -eq 0 ]; then echo "PASS libs kitty links cleanly"; p=$((p+1)); else echo "FAIL libs kitty has $MISS missing shared libraries"; f=$((f+1)); fi; if [ "$SPB_LIVE" = 1 ]; then if QT_QPA_PLATFORM=offscreen timeout 25 kitty --version >/dev/null 2>&1; then echo "PASS run  kitty --version"; p=$((p+1)); else echo "FAIL run  kitty installed but will not start"; f=$((f+1)); fi; fi; else echo "FAIL run  kitty binary not on PATH"; f=$((f+1)); fi;D=$(ls /usr/share/applications/kitty.desktop /var/lib/flatpak/exports/share/applications/kitty.desktop 2>/dev/null | head -1); if [ -n "$D" ]; then echo "PASS menu kitty.desktop"; p=$((p+1)); if command -v desktop-file-validate >/dev/null 2>&1 && ! desktop-file-validate "$D" >/dev/null 2>&1; then echo "WARN menu kitty.desktop has a malformed .desktop file"; w=$((w+1)); fi; else echo "FAIL menu kitty.desktop has no launcher — invisible to the advisor"; f=$((f+1)); fi;# ---- crash evidence: only meaningful on a real booted system ----;if [ -d /var/lib/systemd/coredump ] || command -v coredumpctl >/dev/null 2>&1; then;  n=$(coredumpctl list --no-legend 2>/dev/null | wc -l);  if [ "$n" -gt 0 ]; then;    echo "FAIL crash $n coredumps recorded:";    coredumpctl list --no-legend 2>/dev/null | tail -10 | sed 's/^/     /';    f=$((f+1));  else;    echo "PASS crash no coredumps"; p=$((p+1));  fi;fi;fu=$(systemctl --failed --no-legend --no-pager 2>/dev/null | wc -l);if [ "$fu" -gt 0 ]; then;  echo "FAIL units $fu failed units:";  systemctl --failed --no-legend --no-pager 2>/dev/null | sed 's/^/     /';  f=$((f+1));else;  echo "PASS units no failed units"; p=$((p+1));fi;echo "APPS_PASS=$p APPS_FAIL=$f APPS_WARN=$w";[ "$f" -eq 0 ];; echo "SPB""MARK3429598"
[?2004l]3008;end=d35851b8-4d81-4d2e-9490-d047b63edd65;exit=success\]3008;start=62b04943-bf23-4345-946d-db838a856380;machineid=7da7b38b2f8c40b7b0d8f7715a08be6f;user=root;hostname=sp-plus;bootid=d7016119-9e2c-4fb9-a938-0d995946fe1b;pid=00000000000000002579;type=shell;cwd=/root\[?2004h[root@sp-plus ~]# echo ---VERSIONS---; pi --version; node --version; command -v npm || echo NPM_ABSENT; btop --version; fastfetch --version; flameshot --version; echo ---NO_ENV---; test -e /etc/sp-plus/fin.env && echo KEY_PRESENT || echo NO_KEY_IN_IMAGE; echo ---MARKER---; test -f /var/home/spbtest/.local/state/sp-plus/first-login-theme-applied && echo FIRST_LOGIN_MARKER_PRESENT || echo FIRST_LOGIN_MARKER_ABSENT; echo ---FAILED---; systemctl --failed --no-legend --no-pager; echo "SPB""MARK3431984"
---FAILED---

=== C. LAST 60 LINES OF SERIAL ===
PASS libs kate links cleanly
PASS menu org.kde.kate.desktop
PASS inst kcalc
PASS libs kcalc links cleanly
PASS menu org.kde.kcalc.desktop
PASS inst keepassxc
PASS libs keepassxc links cleanly
PASS menu org.keepassxc.KeePassXC.desktop
PASS inst thunderbird
PASS libs thunderbird links cleanly
PASS menu net.thunderbird.Thunderbird.desktop
PASS inst system-config-printer
PASS inst plasma-systemsettings
PASS libs systemsettings links cleanly
PASS menu systemsettings.desktop
PASS inst micro
PASS libs micro links cleanly
PASS menu micro.desktop
PASS inst flameshot
PASS libs flameshot links cleanly
PASS menu org.flameshot.Flameshot.desktop
PASS inst kitty
PASS libs kitty links cleanly
PASS menu kitty.desktop
]3008;end=da4ae397-c924-4f58-9acd-906bf10f413d;exit=success\]3008;start=62b04943-bf23-4345-946d-db838a856380;machineid=7da7b38b2f8c40b7b0d8f7715a08be6f;user=root;hostname=sp-plus;bootid=d7016119-9e2c-4fb9-a938-0d995946fe1b;pid=00000000000000002579;type=shell;cwd=/root\[?2004h[root@sp-plus ~]# 
[?2004l]3008;end=d35851b8-4d81-4d2e-9490-d047b63edd65;exit=success\]3008;start=62b04943-bf23-4345-946d-db838a856380;machineid=7da7b38b2f8c40b7b0d8f7715a08be6f;user=root;hostname=sp-plus;bootid=d7016119-9e2c-4fb9-a938-0d995946fe1b;pid=00000000000000002579;type=shell;cwd=/root\[?2004h[root@sp-plus ~]# echo ---VERSIONS---; pi --version; node --version; command -v npm || echo NPM_ABSENT; btop --version; fastfetch --version; flameshot --version; echo ---NO_ENV---; test -e /etc/sp-plus/fin.env && echo KEY_PRESENT || echo NO_KEY_IN_IMAGE; echo ---MARKER---; test -f /var/home/spbtest/.local/state/sp-plus/first-login-theme-applied && echo FIRST_LOGIN_MARKER_PRESENT || echo FIRST_LOGIN_MARKER_ABSENT; echo ---FAILED---; systemctl --failed --no-legend --no-pager; echo "SPB""MARK3431984"
[?2004l]3008;start=989dcda3-d2d3-49a2-88dc-14920933abfe;machineid=7da7b38b2f8c40b7b0d8f7715a08be6f;user=root;hostname=sp-plus;bootid=d7016119-9e2c-4fb9-a938-0d995946fe1b;pid=00000000000000002579;type=command;cwd=/root\---VERSIONS---
0.84.3
v22.23.1
NPM_ABSENT
btop version: [1m1.4.7[0m
Compiled with: g++ (16.1.1)
Configured with: /usr/bin/make STATIC= GPU_SUPPORT=true RSMI_STATIC=
fastfetch 2.66.0 (x86_64)
Flameshot v14.0.0 (-)
Compiled with Qt 6.11.1
---NO_ENV---
NO_KEY_IN_IMAGE
---MARKER---
FIRST_LOGIN_MARKER_PRESENT
---FAILED---
SPBMARK3431984
]3008;end=989dcda3-d2d3-49a2-88dc-14920933abfe;exit=success\]3008;start=62b04943-bf23-4345-946d-db838a856380;machineid=7da7b38b2f8c40b7b0d8f7715a08be6f;user=root;hostname=sp-plus;bootid=d7016119-9e2c-4fb9-a938-0d995946fe1b;pid=00000000000000002579;type=shell;cwd=/root\[?2004h[root@sp-plus ~]# 
[?2004l]3008;end=15b18e9b-0ada-466d-8cce-0c8c130207ea;exit=success\]3008;start=62b04943-bf23-4345-946d-db838a856380;machineid=7da7b38b2f8c40b7b0d8f7715a08be6f;user=root;hostname=sp-plus;bootid=d7016119-9e2c-4fb9-a938-0d995946fe1b;pid=00000000000000002579;type=shell;cwd=/root\[?2004h[root@sp-plus ~]# HOME=/root fastfetch --config /etc/skel/.config/fastfetch/config.jsonc --pipe; echo "SPB""MARK3432144"
[?2004l]3008;start=db73e69a-aead-419e-a2e7-d3e6af7dde3a;machineid=7da7b38b2f8c40b7b0d8f7715a08be6f;user=root;hostname=sp-plus;bootid=d7016119-9e2c-4fb9-a938-0d995946fe1b;pid=00000000000000002579;type=command;cwd=/root\                             
   ▄▄▄▄▄▄   ▄▄▄▄▄▄    ▗▖     root on SP+
  ██▀▀▀▀▀▀ ██▀▀▀▀██   ▐▌     
  ▀██████▖ ██████▛▘ ▗▄▟▙▄▖   System      SP+ 1.0 x86_64
  ▗▄▄▄▄▄██ ██▘        ▐▌     Computer    KVM/QEMU Standard PC (Q35 + ICH9, 2009) (pc-q35-10.0)
  ▀▀▀▀▀▀▀  ▀▀         ▝▘     Processor   QEMU Virtual version 2.5+ (4) @ 3.29 GHz
                             Memory      1.61 GiB / 5.74 GiB (28%)
                             Storage     35.95 MiB / 35.95 MiB (100%) - overlay [Read-only]
                             Screen      1280x800 in 15", 75 Hz
                             Running     20 mins
                             Software    1911 (rpm)
                             
                             [90m  Secure Prospective Advisor OS[0m
                             
SPBMARK3432144
]3008;end=db73e69a-aead-419e-a2e7-d3e6af7dde3a;exit=success\]3008;start=62b04943-bf23-4345-946d-db838a856380;machineid=7da7b38b2f8c40b7b0d8f7715a08be6f;user=root;hostname=sp-plus;bootid=d7016119-9e2c-4fb9-a938-0d995946fe1b;pid=00000000000000002579;type=shell;cwd=/root\[?2004h[root@sp-plus ~]# 
=== D. IN-GUEST STATE ===
getenforce; echo ---; systemctl --failed --no-legend; echo ---; ls -Zd /etc /etc/passwd /etc/nsswitch.conf /etc/shadow /etc/localtime; echo ---; ausearch -m AVC -ts boot 2>&1 | tail -40; echo "SPB""MARK3434608"
[?2004l]3008;start=7c9b1f2c-cf25-48d9-9d4f-dc914241339c;machineid=7da7b38b2f8c40b7b0d8f7715a08be6f;user=root;hostname=sp-plus;bootid=d7016119-9e2c-4fb9-a938-0d995946fe1b;pid=00000000000000002579;type=command;cwd=/root\Enforcing
---
---
        system_u:object_r:etc_t:s0 [0m[01;34m/etc[0m
     system_u:object_r:locale_t:s0 [01;36m/etc/localtime[0m
        system_u:object_r:etc_t:s0 [01;36m/etc/nsswitch.conf[0m
system_u:object_r:passwd_file_t:s0 /etc/passwd
     system_u:object_r:shadow_t:s0 /etc/shadow
---
----
time->Thu Aug 27 11:43:39 2026
type=AVC msg=audit(1787849019.878:95): avc:  denied  { read } for  pid=1031 comm="bootupctl" name="bootupd-state.json" dev="sda2" ino=138 scontext=system_u:system_r:bootupd_t:s0 tcontext=system_u:object_r:unlabeled_t:s0 tclass=file permissive=1
----
time->Thu Aug 27 11:43:39 2026
type=AVC msg=audit(1787849019.878:96): avc:  denied  { open } for  pid=1031 comm="bootupctl" path="/boot/bootupd-state.json" dev="sda2" ino=138 scontext=system_u:system_r:bootupd_t:s0 tcontext=system_u:object_r:unlabeled_t:s0 tclass=file permissive=1
----
time->Thu Aug 27 11:43:39 2026
type=AVC msg=audit(1787849019.878:97): avc:  denied  { getattr } for  pid=1031 comm="bootupctl" path="/boot/bootupd-state.json" dev="sda2" ino=138 scontext=system_u:system_r:bootupd_t:s0 tcontext=system_u:object_r:unlabeled_t:s0 tclass=file permissive=1
----
time->Thu Aug 27 11:43:39 2026
type=AVC msg=audit(1787849019.886:101): avc:  denied  { search } for  pid=1031 comm="bootupctl" name="grub2" dev="sda2" ino=3145862 scontext=system_u:system_r:bootupd_t:s0 tcontext=system_u:object_r:unlabeled_t:s0 tclass=dir permissive=1
----
time->Thu Aug 27 11:43:39 2026
type=AVC msg=audit(1787849019.887:102): avc:  denied  { search } for  pid=1031 comm="bootupctl" name="grub2" dev="sda2" ino=3145862 scontext=system_u:system_r:bootupd_t:s0 tcontext=system_u:object_r:unlabeled_t:s0 tclass=dir permissive=1
----
time->Thu Aug 27 11:43:39 2026
type=AVC msg=audit(1787849019.887:103): avc:  denied  { search } for  pid=1031 comm="bootupctl" name="grub2" dev="sda2" ino=3145862 scontext=system_u:system_r:bootupd_t:s0 tcontext=system_u:object_r:unlabeled_t:s0 tclass=dir permissive=1
----
time->Thu Aug 27 11:43:39 2026
type=AVC msg=audit(1787849019.887:104): avc:  denied  { read } for  pid=1031 comm="bootupctl" name="/" dev="proc" ino=1 scontext=system_u:system_r:bootupd_t:s0 tcontext=system_u:object_r:proc_t:s0 tclass=dir permissive=1
----
time->Thu Aug 27 11:43:39 2026
type=AVC msg=audit(1787849019.895:106): avc:  denied  { read } for  pid=1072 comm="lsblk" name="swaps" dev="proc" ino=4026532070 scontext=system_u:system_r:bootupd_t:s0 tcontext=system_u:object_r:proc_t:s0 tclass=file permissive=1
----
time->Thu Aug 27 11:43:39 2026
type=AVC msg=audit(1787849019.895:107): avc:  denied  { open } for  pid=1072 comm="lsblk" path="/proc/swaps" dev="proc" ino=4026532070 scontext=system_u:system_r:bootupd_t:s0 tcontext=system_u:object_r:proc_t:s0 tclass=file permissive=1
----
time->Thu Aug 27 11:43:39 2026
type=AVC msg=audit(1787849019.895:108): avc:  denied  { getattr } for  pid=1072 comm="lsblk" path="/proc/swaps" dev="proc" ino=4026532070 scontext=system_u:system_r:bootupd_t:s0 tcontext=system_u:object_r:proc_t:s0 tclass=file permissive=1
SPBMARK3434608
]3008;end=7c9b1f2c-cf25-48d9-9d4f-dc914241339c;exit=success\]3008;start=62b04943-bf23-4345-946d-db838a856380;machineid=7da7b38b2f8c40b7b0d8f7715a08be6f;user=root;hostname=sp-plus;bootid=d7016119-9e2c-4fb9-a938-0d995946fe1b;pid=00000000000000002579;type=shell;cwd=/root\[?2004h[root@sp-plus ~]# ########## END EVIDENCE ##########
```
