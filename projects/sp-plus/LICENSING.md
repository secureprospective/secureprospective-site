# Licensing SP+

Three different things are licensed three different ways. Reading them as one
thing is the mistake this document exists to prevent.

## 1. SP+'s own code — GPL-3.0-or-later

The Containerfile, the kickstart, the Welcome app, the help app, the update
lane, the theme packaging, and the test gates. Full text in `LICENSE`.

**Why copyleft rather than a permissive license.** The goal is that SP+ cannot
be taken closed. GPL-3.0 requires anyone who distributes a modified build to
distribute their source too, which removes the ability to build a proprietary
product on top of this one and ship it to advisors as a black box.

**What the GPL does not do, and cannot.** It does not forbid selling. No license
in this stack can: the image already carries 233 GPL-2.0-or-later and 66
GPL-3.0-or-later packages, and the GPL specifically prohibits adding
field-of-use restrictions such as "non-commercial only". A no-commercial clause
here would not be a protection — it would be a license violation that ends the
right to distribute SP+ at all, including its own theme, which is itself
GPL-3.0 inherited from four upstream projects.

Control over commercial use of **SP+ specifically** comes from the trademark,
not the copyright license. See `TRADEMARK.md`.

## 2. The composed image — not licensed as a whole

The ISO is an aggregation of about 2,184 packages, each under its own license.
There is no single license that covers it, and any statement that SP+ "is
licensed under X" as an image would be false.

`LICENSES.md` is the generated inventory: every package in the built image with
its version and license, produced from the image itself rather than from a
list someone maintained by hand.

## 3. Source availability

SP+ redistributes Fedora binaries. For unmodified Fedora packages, source is
available from Fedora. For anything SP+ modifies, SP+ owes the source, and it
is in this repository.

## Known items to resolve before public release

- **Brave** is a third-party vendor RPM (`Vendor: Brave Software, Inc.`,
  `License: Multiple, see https://brave.com/`) bundled in the image rather than
  fetched from Flathub the way Zoom and Joplin are. Whether it may be
  redistributed inside a derivative image is a question for Brave. If the answer
  is no, moving it to a Flathub reference removes the question entirely and
  changes nothing an advisor sees.
- **Ghostscript is AGPL-3.0.** Irrelevant on a desktop. It matters only if SP+
  ever exposes it over a network, and it is recorded here so that day does not
  arrive as a surprise.
- **18 firmware packages** are redistributable but may not be modified. Fine to
  ship as-is; they cannot be patched.

## Wallpapers

Every wallpaper SP+ ships is under the **Pexels License**, which permits free
use, modification and redistribution, commercial included, without attribution.
Photographers are credited anyway in each package's `ATTRIBUTION.md`.

One clause to remember: Pexels asks that photographs not be redistributed on
other **stock or wallpaper platforms**. Shipping them as desktop wallpapers
inside an operating system is not that. Packaging SP+ backgrounds as a
downloadable wallpaper pack, or offering them as stock imagery, would be.

## What is confirmed clean

- **No patent-encumbered codecs.** Every media package is Fedora's patent-safe
  variant — `ffmpeg-free`, `libavcodec-free`, `gstreamer1-plugins-bad-free`,
  `gstreamer1-plugins-ugly-free`, `fdk-aac-free` — and `noopenh264` is a stub
  with no codec in it.
- **No Microsoft fonts.** Only the metric-compatible clones Liberation,
  Carlito, Caladea and Tinos, which exist to be used this way.
- **Zoom and Joplin are flatpak preinstalls, not bundled binaries.** The image
  carries a reference; the machine fetches from Flathub at first boot. SP+ does
  not redistribute either one.
