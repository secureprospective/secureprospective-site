# Anticipating the first-boot wizard

SP+ ships **no human account** (DN-13). The advisor's account is created by the
KDE first-boot wizard (`plasma-setup`). Every per-user default we ship therefore
depends on what that wizard does — and almost none of it has ever been tested
against a wizard-created account. The whole test lane to date has used accounts
made by `useradd`, which behaves differently in at least one important way.

**This is the single largest untested surface in SP+.** Bee marked it "COULD NOT
TEST" on cycle32. Work through it in the order below on the next fresh install.

## Already settled, with evidence — do not retest

| Question | Answer | Evidence |
|---|---|---|
| Does `spplus-first-login.service` run for a wizard-created user? | **Yes** | Enabled image-wide at `/usr/lib/systemd/user/plasma-workspace.target.wants/spplus-first-login.service`, not per-user. Verified on cycle33. |

## The risks, most likely to bite first

### 1. Does the wizard copy `/etc/skel` into the new home?

**The big one.** `useradd` copies `/etc/skel`; other account-creation paths
(accountsservice, systemd-homed) may not. Everything the advisor sees in their
tools travels through it: btop's theme, fastfetch's config, flameshot's settings.

If the wizard does not copy skel, **none of those configs reach anybody**, and
three of this session's fixes are invisible in production while passing every
build gate we have.

- **One-second test:** run `btop`. Themed means skel arrived; stock colours mean
  it did not.
- **Confirm with:** `ls ~/.config/btop ~/.config/fastfetch ~/.config/flameshot`
- **If it failed:** move the per-user defaults out of `/etc/skel` and have
  `spplus-first-login` install them into `$HOME` on first login instead. That
  unit is already proven to run for wizard users, so it is the reliable vehicle.

### 2. Does the advisor's account land in `wheel`?

Fin cannot administer the machine otherwise, and `sudo` becomes a dead end. As of
cycle34 SP+ no longer depends on the wizard for this — `spplus-grant-admin.service`
grants it at every boot — but that service has never run against a wizard-created
account.

- **Test:** `id` shows `wheel`, and `sudo -n true` succeeds with no prompt.
- **Also check:** `systemctl status spplus-grant-admin` and its journal line.
- **Watch for:** the service running *before* the wizard creates the account. It
  runs every boot precisely so the account is picked up on the following boot,
  but the advisor's very first session may predate it. If `sudo` fails in the
  first session and works after a reboot, that is this, and the fix is to also
  trigger the grant when a session starts rather than only at boot.

### 3. Does the wizard set a password the advisor actually knows?

Passwordless sudo removes most of the need, but the lock screen still asks. If
the wizard allows an empty password, or auto-login without one, the advisor may
be locked out of their own screen after the first idle timeout.

- **Test:** lock the session and unlock it with what the wizard was given.

### 4. Is the home directory at `/var/home/<user>`?

bootc puts homes under `/var/home` with `/home` symlinked. Anything of ours that
hardcodes `/home/<user>` breaks. `spplus-first-login` uses `$HOME`, so it should
be fine — confirm rather than assume.

- **Test:** `getent passwd <advisor>` and check `flameshot.ini`'s `savePath`
  points somewhere that actually exists.

### 5. Does the theme actually apply, and does the wallpaper stick?

DN-24's fix reads the config back and retries. Its retry loop has been reasoned
about but never watched on a real first login.

- **Test:** the desktop shows the SP+ wallpaper, not Fedora's red/purple.
- **Confirm with:** `journalctl --user -u spplus-first-login` — look for
  "wallpaper verified in the desktop config on attempt N". If N is 2 or 3, the
  race is real and the retry is earning its place.

### 6. Does Print Screen reach flameshot?

Depends on `/etc/xdg/kglobalshortcutsrc` being read as a defaults layer by the
wizard-created session, which depends on `XDG_CONFIG_DIRS` including `/etc/xdg`.

- **Test:** press Print Screen. The flameshot overlay should appear on the FIRST
  press. If nothing happens the first time and it works the second, the daemon
  autostart is not running.
- **Confirm with:** `systemctl --user status flameshot` or `pgrep -a flameshot`.

### 7. Do the coaching tips and `/techhelp` appear? (cycle34)

- **Test:** run `fin`. The first launch should show one "Try this first:" tip.
  Type `/techhelp` and confirm the three-option menu plus the open invitation.
- **State lives at:** `~/.local/state/sp-plus/fin-tips`.

## The order to test in

1. `btop` — settles skel, which gates the most.
2. `sudo -n true` — settles admin rights, which gates Fin's usefulness.
3. Look at the desktop — settles DN-24.
4. Press Print Screen — settles the flameshot rebind.
5. Run `fin`, then `/techhelp`.

The first two are one command each and between them decide whether the rest of
the session's work reached the advisor at all.
