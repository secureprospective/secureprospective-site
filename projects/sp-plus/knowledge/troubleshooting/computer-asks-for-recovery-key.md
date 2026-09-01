# The computer asks for a recovery key at startup

**Stop and read the exact wording. Your files are not automatically gone.** A startup screen asking for an unlock secret means the encrypted storage has not unlocked yet, so it remains protected.

## Do not guess or share a secret

Do not keep trying an unknown key, and do not send a disk passphrase or recovery key to Fin, support, email, chat, or a caller. A legitimate support person can guide you without receiving it. Do not use a key sent unexpectedly by email or message.

Your normal sign-in password, a disk passphrase, and a recovery key are different kinds of secret. Do not assume they are interchangeable because a screen uses the word "password."

## Read the prompt before entering anything

Look for the exact term the computer uses, such as **passphrase**, **unlock**, **recovery key**, or **recovery code**. Write down the wording and any non-secret error message. Do not take or send a photo if it would capture a secret.

If the screen clearly asks for the disk passphrase you created during encrypted installation, enter that passphrase on the computer itself. It is not your ordinary desktop sign-in password. If it is accepted and the computer starts, make a note of what happened and ask support to investigate before changing firmware or startup settings.

## If it specifically asks for a recovery key

Do not assume every SP+ computer has a recovery key. The currently verified SP+ setup does not establish a separate recovery-key issuance or automatic-unlock workflow. The checked test system has LUKS2-encrypted storage with one unlock keyslot and no recovery token. It did not test a TPM, UEFI, real hardware, or a recovery-key screen.

Use a recovery key only if you were deliberately given one, recorded it away from the computer, and the setup record identifies this computer. If you cannot confirm those facts, stop and contact support rather than searching for a key that may never have been issued.

## What to tell support

Say: **"My computer stopped at a startup unlock prompt. It says [exact non-secret wording]. I [do / do not] have the disk passphrase I created, and I [do / do not] have a recovery key issued for this computer."** Also say what changed just before this, such as a firmware update, a new dock, or a BIOS setting change.

Do not include the secret itself, client information, or a screenshot containing either. Do not download a recovery tool, reset firmware security settings, or repeatedly restart the computer while guessing. Those actions can make a simple support check harder.

## What this prompt does and does not mean

The prompt by itself does not erase your files or prove that someone accessed them. It means the encrypted storage is still locked until a valid secret is entered. That is safer than starting with the storage exposed.

It also does not prove what caused the request. A startup, hardware, or encryption configuration problem needs a direct check. The recovery-key and TPM path remains untested for this manual, so support should confirm the actual setup before proposing a repair.

## Related pages

- [Your encryption and recovery key](../security/your-encryption-and-recovery-key.md)
- [Getting more help](../advisor-help/getting-more-help.md)
- [Updates and restarts](../advisor-help/updates-and-restarts.md)
