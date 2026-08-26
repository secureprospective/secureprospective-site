# Your Encryption and Recovery Key

This page explains the two most important pieces of security on your computer in plain terms, and helps you fix the most common mistake advisors make with them.

## What encryption does for you

Everything stored on this computer is scrambled using strong encryption. The unscrambling key exists only on your side of the screen: your PIN at startup and your login password after that.

What this means in practice:

- **Laptop stolen from a car**: thief gets expensive junk. The files are unreadable without your PIN.
- **Computer lost on a trip**: same story.
- **Old computer retired or recycled**: the data cannot be pulled off the drive by whoever receives it. Wiping keys or keeping the recovery key safe finishes the job.

Client Social Security numbers, account statements, medical information in emails: none of it is legible to anyone holding the hardware.

## The two keys, and how they differ

| | Startup PIN | Recovery key |
|---|---|---|
| What it is | A code you chose during setup | A long machine-generated code shown once |
| Used when | Every normal startup | Only rare exceptions |
| Looks like | Something you can remember | A long block of random characters |
| If forgotten | Recoverable through support processes | Cannot be guessed; without it, encrypted data stays locked forever |

The startup PIN unlocks the disk each morning; then your usual login password takes over for the session. Two quick codes, both yours alone.

## When you would need the recovery key

Rarely: usually after some major update changes the startup chain enough that the security chip wants human confirmation before releasing its secret. The full walkthrough lives here: [The computer asks for a recovery key](../troubleshooting/computer-asks-for-recovery-key.md).

## Storing the key properly: do this today

The single worst outcome with encryption is not theft. It is losing the one key that unlocks your own data. Store the recovery key so that all of these are true:

1. **Away from this computer.** Not in a file on the machine, not in a photo of the screen still sitting in your phone's camera roll next to the laptop it unlocks. The key protects against computer-level loss; storing it on the same computer cancels itself out.
2. **Physically secure.** Printed and placed in a home safe, a lockbox, or a bank safe-deposit box. Paper survives things computers do not.
3. **Findable by someone you trust if you cannot be.** An emergency should not turn into a lockout because only you knew where the paper was.

Good options, roughly in order:

- Print it, store it in a fireproof home safe.
- Print it, deposit it with your attorney or in a bank box alongside your will documents.
- A password manager entry in Bitwarden works as a secondary copy, but keep a physical copy too: if the day comes when you need this key, it may be because computers have failed you.

If you never wrote it down, or cannot find it now: treat this as urgent but fixable. Support can guide replacing the recovery key with a new one while the computer is working normally. Doing that requires access to a functioning machine; waiting until something breaks removes that option.

## Related pages

- [Computer asks for a recovery key](../troubleshooting/computer-asks-for-recovery-key.md)
- [Screen lock and privacy](screen-lock-and-privacy.md)
- [Security Evidence Report](../advisor-help/security-evidence-report.md)
