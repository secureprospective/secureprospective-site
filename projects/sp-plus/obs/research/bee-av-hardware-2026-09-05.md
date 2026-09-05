# Linux A/V purchase brief

## Bottom line

- **Webcam:** Logitech **C922 Pro Stream** — buy if new price is **$80–90**.
- **Headset:** **HyperX Cloud Stinger 2 wired** — use its **3.5 mm analog connection**, not a USB adapter.
- The analog headset route is the safer Linux choice: Christopher’s onboard capture device is already known to operate at **48 kHz stereo**, avoiding the Jabra-style USB `16 kHz mono-fallback` trap.

All webcam format lists below are Linux reports from the same model family, not measurements of the eventual serial-number-specific unit. Verify on arrival.

---

# 1. Webcam

## Recommendation: Logitech C922 Pro Stream

**Typical new price:** $79.99–$89.99; availability varies. [Logitech price](https://www.logitech.com/en-us/shop/p/c922-pro-stream-webcam), [B&H listing](https://www.bhphotovideo.com/c/product/1374480-REG/logitech_960_001087_c922_pro_stream_webcam.html)

### Why this one

- Standard UVC device; Linux uses the in-kernel `uvcvideo` driver.
- Good independent reports of low-light performance for this price.
- 1080p30 for the intended production format.
- 720p60 remains available if a future plan requires it.
- V4L2 exposes focus, exposure, white balance, gain, brightness, contrast, saturation and sharpness.
- No Windows configuration is required for the useful Linux settings.
- Kernel support already contains the C922’s known UVC timing quirk (`046d:085c`, `UVC_QUIRK_INVALID_DEVICE_SOF`); do not add a `uvcvideo quirks=` parameter manually. [Kernel source](https://raw.githubusercontent.com/torvalds/linux/master/drivers/media/usb/uvc/uvc_driver.c)

### Expected Linux V4L2 formats

A representative Linux enumeration reports:

```text
'YUYV'
  320x180
  320x240
  352x288
  424x240
  640x360
  640x480
  848x480
  960x540
  1280x720
  1920x1080

'MJPG'
  320x180
  320x240
  352x288
  424x240
  640x360
  640x480
  848x480
  960x540
  1280x720
  1920x1080
```

Expected useful modes:

```text
MJPG  1920x1080  30 fps
MJPG  1280x720   60 fps
MJPG  1280x720   30 fps
YUYV  640x480    30 fps
YUYV  1280x720   low frame rates only
YUYV  1920x1080  approximately 5 fps
```

The important result is **MJPG at 1920×1080/30**. Native NV12 is not normally expected. Applications may show emulated formats, but those are not additional camera hardware modes.

Linux reports and descriptor data confirm YUYV and MJPG, including 1080p MJPG; a Linux user report also confirms ordinary Debian operation. [C922 Linux format report](https://raspberrypi.stackexchange.com/questions/63798/get-h264-from-webcam-logitech-c922), [Linux hardware database](https://linux-hardware.org/?id=usb%3A046d-085c)

### Optics and controls

- Autofocus: continuous autofocus.
- FOV: fixed **78° diagonal**.
- Low light: better than the C920 generation in several reviews, but still becomes noisy in a genuinely dark room. It is a reasonable choice for typical indoor lighting, not a substitute for a light.
- Privacy shutter: **none**. Use a physical lens cover or unplug it when privacy matters.
- Linux V4L2 controls normally include:

```text
brightness
contrast
saturation
gain
white_balance_temperature_auto
white_balance_temperature
power_line_frequency
sharpness
backlight_compensation
exposure_auto
exposure_absolute
exposure_auto_priority
focus_auto
focus_absolute
zoom_absolute
pan_absolute
tilt_absolute
```

The exact ranges vary slightly by firmware revision. `v4l2-ctl --list-ctrls-menus` is authoritative. [Example C922 controls](https://gist.github.com/ethzero/e95b9de42a0d9ed268d07aca1dcd4540)

The Windows-only ChromaCam/background-removal feature is irrelevant and should not be used as a purchase criterion.

---

## Alternate 1: Logitech C920s Pro HD

**Typical price:** $60–72; buy only if the available listing is within the stated webcam budget. [Logitech](https://www.logitech.com/en-us/shop/p/c920s-pro-hd-webcam), [Staples](https://www.staples.com/logitech-c920s-pro-1080p-hd-webcam-with-privacy-shutter-black/product_24383955)

- 1080p30.
- Fixed 78° FOV.
- Autofocus.
- RightLight 2 auto light correction.
- Physical privacy shutter.
- Standard V4L2 controls for focus, exposure and white balance.
- Native YUYV and MJPG; expected useful modes are:

```text
MJPG  1920x1080  30 fps
MJPG  1280x720   30 fps
YUYV  1920x1080  approximately 5 fps
YUYV  1280x720   approximately 10 fps
YUYV  640x480    30 fps
```

A typical full C920-family report includes additional lower sizes such as 160×90, 160×120, 176×144, 320×180, 320×240, 352×288, 432×240, 640×360, 800×448, 800×600, 864×480, 960×720, 1024×576 and 1600×896. Exact lists vary by C920 revision. [Linux C920 format report](https://askubuntu.com/questions/1562705/camera-video-capture-glitches-with-logitech-c920-hd-pro-webcam)

### Important kernel warning

C920-family USB IDs differ by revision. The newer `046d:08e5` variant has a documented Linux MJPG truncation problem at 1080p30; a later kernel patch proposes additional quirks for it. Do not assume kernel 6.12.107 contains that fix. Check `lsusb` immediately after purchase and test a sustained MJPG capture before the return period expires. [Patch discussion](https://ratatoskr.run/linux-media/2026/06/17189449)

---

## Alternate 2: Logitech C930e

**Typical price:** $85–95 when available new. [Logitech](https://www.logitech.com/en-us/products/webcams/c930e-business-webcam.html), [Newegg](https://www.newegg.com/logitech-c930e/p/N82E16826104845)

- 1080p30.
- 90° diagonal FOV.
- Autofocus.
- RightLight 2.
- Included attachable privacy shutter.
- Wider than ideal for some single-person desk shots, but useful if Christopher wants to show products or more of the workspace.
- Standard Linux reports expose YUYV and MJPG. Reported sizes include:

```text
160x120, 176x144, 320x180, 320x240, 352x288,
424x240, 480x270, 640x360, 640x480, 800x448,
800x600, 848x480, 960x540, 1024x576, 1280x720,
1600x896, 1920x1080
```

Expected key modes:

```text
MJPG  1920x1080  30 fps
MJPG  1280x720   30 fps
YUYV  1920x1080  low frame rates only
YUYV  640x480    30 fps
```

No native NV12 should be assumed.

The camera’s advertised UVC H.264/SVC capability is not reliably exposed by Linux’s standard `uvcvideo` path on all revisions. Use **MJPG**, not H.264, in OBS. Linux reports expose the ordinary V4L2 controls for exposure, white balance, focus, zoom, pan and tilt. [Linux C930e report](https://www.linux.fi/wiki/Logitech/C930e)

---

## Why MJPG matters

Uncompressed 1920×1080 YUYV at 30 fps is approximately 995 Mb/s before USB overhead. USB 2.0 tops out at 480 Mb/s. Therefore:

- **YUYV 1080p30 is impossible over USB 2.0.**
- Cameras expose YUYV at 1080p only at very low frame rates.
- **MJPG compresses each frame in the camera**, making 1080p30 practical.
- NV12 is also uncompressed; even if exposed, it is not a USB 2.0 solution for 1080p30.

---

# 2. Headset with microphone

## Recommendation: HyperX Cloud Stinger 2 wired

**Price:** $49.99 MSRP; commonly less. [Manufacturer](https://hyperx.com/products/hyperx-cloud-stinger-2-wired-gaming-headset)

Use it through the included **3.5 mm TRRS-to-two-TRS splitter**:

- Headphone plug → headphone output.
- Mic plug → the machine’s separate analog input.

### Why analog is the right choice here

The headset has no USB audio interface. Its microphone is an analog electret capsule, so Linux captures it through the Beelink’s known-good onboard codec:

```text
alsa_input.pci-0000_06_00.6.analog-stereo
48 kHz, stereo
```

The microphone signal itself is mono, but the analog codec path is not a USB `mono-fallback` profile. This avoids the Jabra failure mode.

Expected microphone bandwidth is approximately **100 Hz–15.6 kHz**, much better suited to speech than a 16 kHz-sampled USB microphone. [HyperX specifications](https://row.hyperx.com/products/hyperx-cloud-stinger-2-wired-gaming-headset)

### Other relevant properties

- Closed-back over-ear design: reduces headphone bleed into the mic.
- Weight: under 300 g.
- Memory-foam leatherette pads; suitable for long sessions, though leatherette may become warm.
- Flexible boom microphone.
- Boom is **not detachable**.
- Swivel-up mute.
- Fixed cable, approximately **2 m**, plus a short PC splitter.
- No hardware sidetone.
- No hardware mic monitoring.
- Software monitoring is possible through PipeWire/OBS, but latency and echo must be managed.

The microphone is not studio quality, but at this price a boom mic positioned a few centimeters from the mouth is normally better for voice capture than a cheap desktop mic several feet away.

---

## Alternate 1: Corsair HS55 Stereo

**Price:** $59.99. [Manufacturer](https://www.corsair.com/us/en/p/gaming-headsets/ca-9011260-na/hs55-stereo-wired-gaming-headset-carbon-ca-9011260-na)

- 3.5 mm analog, with included splitter.
- Closed-back over-ear.
- 50 mm drivers.
- Flip-to-mute fixed boom.
- Microphone is not detachable.
- Cable: approximately 1.8 m.
- Weight: approximately 284 g.
- Mic response: 100 Hz–10 kHz.
- No hardware sidetone.
- Use analog mode only; do not buy the USB-surround version for this Linux requirement.

Its omnidirectional mic is more susceptible to room sound and headphone bleed than the HyperX’s bi-directional noise-cancelling mic.

---

## Alternate 2: Logitech G432

**Price:** buy only at $60 or less; some listings are around $40, while Logitech’s own price may be higher. [Logitech](https://www.logitechg.com/en-us/shop/p/g432-7-1-surround-sound-gaming-headset)

- 3.5 mm analog connection plus a USB DAC.
- Use the **3.5 mm connection**, not the USB DAC.
- Closed-back over-ear.
- 50 mm drivers.
- Cardioid 6 mm flip-to-mute boom.
- Fixed cable, approximately 2 m.
- More directional microphone than the Corsair.
- No hardware sidetone.
- DTS/EQ features require Logitech G HUB and Windows; those features are disallowed and unnecessary.

In analog mode it uses the Beelink’s 48 kHz onboard audio path. The USB DAC’s actual capture rate is not sufficiently documented for this purchase brief.

---

## Why not another cheap USB headset?

“USB” does not mean “wideband microphone.” Cheap USB headsets frequently expose a playback stream at 44.1/48 kHz while exposing their microphone only at 16 kHz mono. The Logitech H390, for example, is UAC-supported by Linux but its published microphone response is only 100 Hz–10 kHz, and it has had ALSA-specific quirks. [H390 specifications](https://support.logi.com/hc/en-us/articles/360024878073-Specifications-USB-Headset-H390), [ALSA quirk](https://github.com/sarsanaee/linux/commit/2b929b6eec0c7c45eb554256d349c16c0ba1df3c)

---

# 3. Why `mono-fallback` happens

The Jabra result is not caused by OBS. It is a property of the device’s exposed audio capture endpoint and PipeWire’s profile selection.

- A USB Audio Class device advertises playback and capture endpoints in its USB descriptors.
- UAC1 versus UAC2 describes the USB audio protocol version, but **UAC1 alone does not guarantee 48 kHz capture**.
- Some headsets expose a full-rate playback endpoint but only a 16 kHz mono microphone endpoint.
- PipeWire’s ALSA ACP layer (`api.acp`) reads the available ALSA PCMs and creates card profiles.
- If no richer UCM/card profile exists, ACP may expose a generic profile such as:

```text
input:mono-fallback
```

That profile name is a symptom of the generic ALSA profile selection. It does not create missing microphone bandwidth. The decisive evidence is the hardware PCM capability:

```text
16 kHz, 1 channel
```

PipeWire can resample 16 kHz to 48 kHz, but cannot restore speech information that the microphone never captured.

Bluetooth HSP/HFP is a related but separate trap: Bluetooth headset call profiles commonly use 8 or 16 kHz mono SCO audio. It should not be confused with USB UAC1, although both can produce telephone-quality microphone audio.

Before buying any USB headset, look for a Linux report containing:

```text
arecord --dump-hw-params
RATE: 44100 48000
CHANNELS: 1
```

or equivalent. Do not infer the microphone rate from the headphone specification.

---

# 4. Combination question

Use a **closed-back headset**, keep headphone volume moderate, and place the boom mic close to the corner of the mouth.

- Closed-back cups reduce direct headphone leakage.
- Open-back headphones are a poor choice here: sound escapes through the cups and the boom mic can capture it.
- A headset mic at the mouth generally beats a cheap standalone USB mic placed on the desk in an untreated room.
- A good standalone USB mic plus separate closed headphones would ultimately sound better, but it adds a stand/arm, another USB device, more routing, and another opportunity for a 16 kHz or noisy interface.
- For this budget and current machine, the straight choice is **3.5 mm closed-back headset now**.

Disable the webcam’s built-in microphone in OBS so it cannot be selected accidentally.

---

# 5. Arrival verification checklist

## Identify the webcam

```bash
v4l2-ctl --list-devices
lsusb
```

Prefer the stable `/dev/v4l/by-id/...` path rather than `/dev/video0`.

## Verify camera formats

```bash
v4l2-ctl \
  -d /dev/v4l/by-id/DEVICE \
  --list-formats-ext
```

Good:

```text
'MJPG'
    Size: Discrete 1920x1080
        Interval: Discrete 0.033s (30.000 fps)
```

Also acceptable:

```text
'YUYV'
    640x480 at 30 fps
```

Failure:

- No `MJPG`.
- No `1920x1080`.
- 1920×1080 available only at 5 fps.
- Only VGA modes, as with the current Sonix camera.

Check controls:

```bash
v4l2-ctl -d /dev/v4l/by-id/DEVICE --list-ctrls-menus
```

Expected controls include exposure, white balance and focus. Their presence proves the Linux path can configure them without vendor software.

## Verify headset and analog input

```bash
pactl list cards
pactl list sources
wpctl status
arecord -l
```

The analog source should be present:

```text
alsa_input.pci-0000_06_00.6.analog-stereo
```

Good:

```text
48 kHz
2 channels
Analog Stereo / Analog Stereo Duplex
```

For hardware capabilities, replace the card/device identifiers:

```bash
arecord \
  -D hw:CARD=...,DEV=... \
  --dump-hw-params \
  -f S16_LE -c 1 -r 48000 \
  -d 2 /dev/null
```

Good USB-headset output would explicitly include 44100 or 48000 Hz. For the recommended analog headset, the known-good onboard analog path should accept 48000 Hz.

Failure signature:

```text
Audio format: s16le, 16000 Hz, 1 channels
```

or a USB card whose only capture profile is:

```text
input:mono-fallback
```

If using the 3.5 mm headset, record a short test with OBS or:

```bash
arecord -D <analog-device> -f S16_LE -r 48000 -c 1 -d 10 test.wav
aplay test.wav
```

The recording should be clear, speech should not sound telephone-narrow, and the capture source should remain the onboard analog input.

---

# 6. Keep in mind

- **Lighting is probably the largest video-quality improvement** available at this budget. A modest front key light will help more than moving from one ordinary 1080p webcam to another.
- Keep the camera and any USB headset on separate USB controllers if possible. The recommended analog headset avoids adding USB audio traffic.
- A boom arm or mic stand is useful later, especially if switching to a standalone microphone.
- Acoustic treatment will improve voice quality more than software noise suppression.
- A future 1080p60 plan does not change the C922’s 1080p30 limit; it only makes its 720p60 mode relevant. For 1080p60, this webcam budget will need to increase.

## Sources

1. [Logitech C922](https://www.logitech.com/en-us/shop/p/c922-pro-stream-webcam)  
2. [C922 Linux format discussion](https://raspberrypi.stackexchange.com/questions/63798/get-h264-from-webcam-logitech-c922)  
3. [Linux hardware: C922 USB support](https://linux-hardware.org/?id=usb%3A046d-085c)  
4. [Linux UVC driver source](https://raw.githubusercontent.com/torvalds/linux/master/drivers/media/usb/uvc/uvc_driver.c)  
5. [C920 Linux format report](https://askubuntu.com/questions/1562705/camera-video-capture-glitches-with-logitech-c920-hd-pro-webcam)  
6. [C920 08e5 kernel patch discussion](https://ratatoskr.run/linux-media/2026/06/17189449)  
7. [Logitech C930e](https://www.logitech.com/en-us/products/webcams/c930e-business-webcam.html)  
8. [C930e Linux report](https://www.linux.fi/wiki/Logitech/C930e)  
9. [PipeWire ALSA configuration](https://pipewire.pages.freedesktop.org/wireplumber/daemon/configuration/alsa.html)  
10. [Linux kernel V4L2 camera controls](https://docs.kernel.org/userspace-api/media/v4l/ext-ctrls-camera.html)  
11. [HyperX Cloud Stinger 2](https://hyperx.com/products/hyperx-cloud-stinger-2-wired-gaming-headset)  
12. [Cloud Stinger 2 microphone review](https://www.soundguys.com/hyperx-cloud-stinger-2-review-79677/)  
13. [Corsair HS55 Stereo](https://www.corsair.com/us/en/p/gaming-headsets/ca-9011260-na/hs55-stereo-wired-gaming-headset-carbon-ca-9011260-na)  
14. [Logitech G432](https://www.logitechg.com/en-us/shop/p/g432-7-1-surround-sound-gaming-headset)  
15. [Logitech H390 specifications](https://support.logi.com/hc/en-us/articles/360024878073-Specifications-USB-Headset-H390)
