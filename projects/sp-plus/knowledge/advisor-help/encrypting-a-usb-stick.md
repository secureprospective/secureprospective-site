# Protect a USB Stick with a Password

## Know the limitation first

This encrypted USB stick opens on your SP+ computers only. It will not open on Windows or Mac. If you hand it to a client, Windows may show a message offering to format the stick. Do not choose that option. It can erase access to the files.

When a client needs a file, send it the normal way you already send documents. Use this stick for your own protected working copy, not for handing files to someone else.

Use this protection when a USB stick contains client information and might be left in a hotel, car, or client’s office. If the stick is lost, encryption keeps the files from being readable. Without it, losing the stick can disclose the files.

## Before you start

Formatting erases everything currently on the stick. Copy off any files you need first, or use a new empty stick. Keep the stick connected until the process finishes.

The most important step is choosing the right item. A wrong choice erases the wrong drive. Check the size shown in Disks against the size printed on the USB stick or its packaging. The computer’s own drive is the big one and is usually much larger. Do not choose by name or position alone. If the size does not make sense, stop.

## Create the encrypted stick

1. Plug in the USB stick.
2. Open **Applications**, then open **Disks**.
3. In the list on the left, select the USB stick whose size matches what you checked. Confirm again that it is not the computer’s own, much larger drive.
4. On the right side, select the USB’s storage area. Click the gear button below the storage picture and choose **Format Partition…**.
5. In the format dialog, select **Password protect volume (LUKS)**. Continue through the on-screen steps until you reach the password screen.
6. Create a password and enter it again when asked. Make it something you can remember but others cannot guess. Store it safely, such as in your password manager.
7. Confirm the format when asked. Your computer may ask for your usual sign-in password to approve the change.

If you lose this password, the files are gone. Nobody can recover them. That is the point of this protection, not a flaw. There is no reset link or backup password.

## Use it afterward

From then on, plug the stick into an SP+ computer. A password request appears. Enter the password you created. The stick then opens like a normal USB stick. Drag files in and out normally.

When you finish, use the stick’s eject icon and wait for it to disappear before pulling it out. This helps prevent file damage.
