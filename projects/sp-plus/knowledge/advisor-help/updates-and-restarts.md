# Updates and restarts

**SP+ can prepare a new system version in the background without restarting while you are working.** When a version is ready, a desktop notice says it will be used the next time you restart or shut down.

## What happens in the background

SP+ checks for a newer system version each day. If a new version is available and the computer can reach the update service, it downloads and prepares that version for the next start. It does not use a fixed time you need to wait for, and a missed check can run later.

The computer does not restart in the middle of an appointment to apply that update. The normal automatic-restart updater is disabled. Preparing an update and choosing when to restart are deliberately separate.

## When you see an update notice

The notice means the new system version has already been downloaded. It does not ask you to install an operating system, find a download, or stop work immediately.

When you reach a suitable break:

1. Save and close client work as you normally would.
2. Choose a normal **Restart** or **Shut Down**.
3. Sign in afterward and open the one app or task you need next.

A normal restart or shutdown finishes the prepared system update. If you are in the middle of important work, finish it first. The update can wait for your normal break.

## Apps update on a separate path

Some installed applications use a separate daily update path. In the checked build, SP+ refreshes its application catalogue and updates system Flatpak apps without asking you to run a command. That is separate from the operating-system image.

An app update does not prove the whole system changed, and a system-update notice does not identify every app that may have changed. If an app behaves differently, record its name, what you were doing, and the exact non-sensitive message before changing other things.

## If a restart reveals a problem

A problem after a restart can be related to an update, but it can also be a browser setting, network problem, device, or ordinary app issue. Do not repeatedly restart, download a repair tool, or use a terminal or boot menu to guess at a fix.

Save what you safely can, note the time and symptoms, and read [Something broke after an update: going back](../troubleshooting/going-back-after-an-update.md). Going back to an earlier system version is not a way to restore a deleted or unsaved document.

## What this page has and has not tested

The current test virtual machine staged newer system images and finalized them during shutdown or restart without a forced mid-session restart. It also has a separate prior system deployment. This page did not test the notice on advisor hardware, a particular app update, a rollback, a return to the newer version, or any physical-device behavior.

## Related pages

- [Something broke after an update: going back](../troubleshooting/going-back-after-an-update.md)
- [Installing software safely](installing-software.md)
- [Backups: what is protected and what is not](../files/backups.md)
- [Getting more help](getting-more-help.md)
