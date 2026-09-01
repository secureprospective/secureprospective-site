# Your encryption and recovery key

The checked SP+ virtual machine uses encrypted storage but does not demonstrate older guidance's recovery-key or automatic-unlock setup. Do not assume SP+ gave you a startup PIN or recovery code.

## What was checked

The test machine has LUKS2 encrypted storage. Its `/var` area, which holds home folders and work files, is inside it. `/boot` is outside it. Not every part of the disk is encrypted.

Disk encryption protects stored data only while the computer is powered off and the encrypted volume is locked. It does not protect an unlocked computer, a copied or sent file, or the only copy of a deleted file.

This was checked on a virtual machine, not through a real installation or on your hardware. The actual layout, passphrase prompt, and hardware security chip still need testing.

## Three different secrets

A **disk passphrase** unlocks encrypted storage during startup if one was set when the computer was installed. A **login password** opens your desktop session after startup. They have different jobs and should not be treated as interchangeable.

A **recovery key** is a separate emergency secret. It is useful only when a specific setup process has created it and told you how it works. It is not your login password, not a short PIN, and not a code you should invent from a hint on screen.

## Recovery-key status in this release

The image has encryption tools but no verified SP+ process that creates, displays, records, or replaces a recovery key. On the checked virtual machine, the encrypted volume had one key slot, no recovery token, and no hardware security chip.

That does not prove another computer was never configured differently. It does mean that this manual cannot promise a machine-generated key, TPM-based automatic startup unlocking, or support-led key replacement. Do not run encryption commands yourself to try to add a key. A mistake can make the data permanently inaccessible.

## If you were given a recovery key

Treat it like a master key to the encrypted files. Keep it away from the computer, identify which computer it belongs to, and store it in a location your practice has approved. Do not put the only copy in a local document, email it, paste it into Fin, or send it to support.

A recovery key should be recorded when it is issued, not reconstructed from memory after a lockout. If you do not know whether one was issued, ask the person who set up the computer while it still starts normally.

## If startup asks for a key

Read the screen. Do not guess repeatedly, enter your login password as a recovery key, or follow instructions from an unexpected caller or webpage. If the computer is working, record the exact wording and ask for human help before changing encryption settings. If it is already locked, use [Computer asks for a recovery key](../troubleshooting/computer-asks-for-recovery-key.md).

## Encryption is not a backup or a privacy policy

Encryption cannot recover a file that was deleted, a drive that failed, or a document sent to the wrong recipient. It also does not control what leaves through email, websites, cloud storage, printing, or an AI provider. Keep tested backups and make a deliberate decision before sending client information.

## Related pages

- [Computer asks for a recovery key](../troubleshooting/computer-asks-for-recovery-key.md)
- [Backups: a working copy, not a wish](../files/backups.md)
- [What leaves this computer](what-leaves-this-computer.md)
