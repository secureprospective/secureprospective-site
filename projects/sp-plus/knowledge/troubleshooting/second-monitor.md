# Second Monitor Problems

Plugging in an external monitor or projector should just work. When it does not, here are the fixes in order.

## Nothing appears at all

1. **Check the cable seating at both ends.** Half-seated HDMI and USB-C cables cause exactly this. Unplug, replug firmly.
2. **Wake the input.** Many monitors sit on the wrong input or sleep aggressively. Press the monitor's own menu button and confirm the input (HDMI 1 vs 2) matches the cable. Power-cycle the monitor if unsure.
3. **Adapters fail quietly.** If you are using any adapter or dock, that is the prime suspect. Try the cable directly, or a different adapter, before blaming anything else.

## Detected but wrong: mirrored, sideways, blurry

Open display settings:

- KDE edition: System Settings, search "display".
- Mac-style edition: Activities search, type "display".

You will see both screens drawn side by side. From there:

- **Drag the rectangles** to match how your physical monitors sit on the desk. The little rectangles represent real screens; where you drag a window onto them determines which monitor shows what.
- **Choose the mode**: extend (two independent screens, normal desk setup), mirror/duplicate (projector showing your laptop screen), or single display only.
- **Fix blurriness with scaling.** If text looks tiny or fuzzy, raise the scaling percentage for the screen that needs it. Each screen scales independently.
- **Fix rotation** if something is sideways: there is a rotate/orientation control per screen.

Apply, wait two seconds, confirm. If a setting ever leaves a screen black, do not panic: press Escape or wait about twenty seconds and the change reverts itself automatically.

## Laptop lid: closed-clamshell mode

You can run with the laptop closed on a stand, using only the external monitor. Plug in the external display plus power, set displays to "single external", then close the lid. If closing the lid puts everything to sleep instead, ask the Assistant: "I want to use my laptop closed with an external monitor." It can adjust that behavior safely.

## Presenting at someone else's office

Carry your own cable if you can; conference-room cables die constantly and nobody has ever been sad about having a spare HDMI. Mirror mode (duplicate) is usually right for presentations so you can look at your own screen while the room watches.

## Related pages

- [Getting around](../advisor-help/getting-around.md)
- [No sound](no-sound.md): HDMI carries audio too, which surprises people
- [Getting more help](../advisor-help/getting-more-help.md)
