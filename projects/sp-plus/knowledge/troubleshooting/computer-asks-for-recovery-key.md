# The Computer Asks for a Recovery Key at Startup

**Read this calmly: your files are almost certainly fine.** This screen looks alarming and is nearly always routine. Here is what happened and exactly what to do.

## What just happened

Your disk is encrypted so that stolen hardware yields nothing readable. At startup, the computer normally unlocks itself using a secret held by its security chip, confirmed by the PIN you type. As part of unlocking, the security chip verifies that nothing about the startup process changed.

If something in that startup chain changed (a firmware update, a significant system update, a hardware change, or a security setting adjustment), the chip refuses to hand over the secret automatically. That refusal is the encryption working exactly as designed. The computer cannot know the change was friendly, so it asks for the master key instead: your recovery key.

Think of it like a bank flagging a transaction as unusual. Annoying, but you want a bank that checks.

## What to do

1. **Find your recovery key.** You printed it or stored it away from this computer during setup. It is a long block of characters, unique to this machine.
   - Stored in a safe or lockbox? Retrieve it.
   - Stored with a trusted person? Call them.
   - If support set up the machine, they may hold a copy under your authorization.
2. **Type it carefully** at the prompt. These keys are long on purpose. Type slowly, watch each character, and use the visibility toggle if there is one.
3. **The computer continues starting normally.** Your files, programs, and settings are all untouched.

If the key is rejected three times, stop typing. Re-read character by character: common mistakes are confusing similar characters (0/O, 1/l/I) and missing a block. If it still fails, contact support; do not guess repeatedly. See [Getting more help](../advisor-help/getting-more-help.md).

## After you are in: make future boots normal again

Once started, ask the Assistant: "My computer asked for my recovery key." It will verify what triggered the request, and support can re-enroll the normal unlock so future startups work with your usual PIN again. Until that is done, the computer may keep asking for the recovery key at each start.

## Then: fix the storage problem

This event is the reason the recovery key exists, and it will happen again someday (after some future major update, most likely). Before you move on:

- If you had the key handy: good. Confirm it is stored somewhere safe away from this computer, and that someone you trust could find it in an emergency.
- If finding it was painful: fix that today. Read [Your encryption and recovery key](../security/your-encryption-and-recovery-key.md).

## What this screen is NOT

- Not evidence of a virus or hacking attempt (though if you also see other strange behavior, mention it to support).
- Not data loss. Nothing happened to your files.
- Not a password reset trap: the recovery key is independent of your login password and PIN. It was generated once, shown once, and never changes unless deliberately replaced.

## Related pages

- [Your encryption and recovery key](../security/your-encryption-and-recovery-key.md)
- [Updates and restarts](../advisor-help/updates-and-restarts.md): why updates occasionally trigger this
- [Getting more help](../advisor-help/getting-more-help.md)
