# Updates and restarts

SP+ has two paths. This build does **not** automatically update its system image. It has a daily service for installed Flatpak apps. Do not assume a restart means the system updated.

## The system update path is not automatic now

SP+ uses an image-based system underneath. Its built-in system-update timer is disabled in the checked image and virtual machine. No verified SP+ screen tells an advisor that a new system version is ready, downloads one, or asks for a restart to install it.

That means you should not wait for a system-update notice, promise that a restart installed security fixes, or download an operating-system installer from a website. If your practice needs a system update, the current supported advisor action is to ask for the approved process rather than use a terminal or an online recovery guide.

The checked virtual machine has a running system version but no staged update and no rollback target. A system-image download, staging, restart into a new version, and return test were not performed.

## Apps can update separately

The image enables a daily, non-interactive Flatpak update service for apps installed from the system Flatpak source. On the checked virtual machine, that service ran and reported that there was nothing to update. This confirms the service can run, not that a particular app update has been downloaded and tested.

An app update is different from an operating-system update. It does not prove that the system image changed, and the manual did not test what notice, restart, or app behavior you will see when a real app update is available. If an app behaves differently, note its name and what changed before making more changes.

## Restart for a clear reason

A normal restart can clear a temporary app or device problem, but it does not prove that an update was installed. Save your work first, close client files you can safely close, and restart only when you have a suitable break.

If a restart makes a problem appear, do not assume an update caused it. Record the time, the program or device involved, the exact non-sensitive error, and whether it worked before the restart. Do not repeatedly restart while guessing, and do not send a screenshot that includes client information.

## Do not promise a rollback

The underlying image system includes a command that can select an older system version for a future start. That command is not a verified advisor feature. There is no verified rollback button in SP+ Welcome or System Settings, and the checked virtual machine has no rollback target.

Do not use a terminal, boot menu, or web "recovery" guide to try to reverse an update. If work breaks after a restart, preserve the facts and use the related going-back page.

## What remains unproven

This manual did not test a system-image update, real app update, update notification, restart into a staged version, rollback, return to the newer version, or behavior on advisor hardware. The automatic system-update and advisor-facing recovery workflow need a tested product path before they can be promised.

## Related pages

- [Something broke after an update: going back](../troubleshooting/going-back-after-an-update.md)
- [Installing software safely](installing-software.md)
- [Backups: what is protected and what is not](../files/backups.md)
- [Computer asks for a recovery key](../troubleshooting/computer-asks-for-recovery-key.md)
