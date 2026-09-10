# Alpha v0.10 — what Christopher verified on the Dell, 2026-09-10

The overnight sweep ran on the `fedora-alpha-test` QEMU rig. Several of its failures were
artifacts of emulated hardware. This document records what was checked on the **Dell**,
which is the authority, and it supersedes the VM's verdict wherever the two disagree.

## Confirmed working on real hardware

| Area | Result | Note |
|---|---|---|
| **Sleep and resume** | **Works** | The VM reported the display never repaints after wake (three FAIL verdicts across P09, P10, P11). That was virtio-GPU. On the Dell it works. |
| **Hibernation** | **Works, 1 of 2 attempts** | Christopher: "hibernate mostly works on the Dell, but its also a spinning HDD and it worked 1 our of 2 times. Good enough for me." **Accepted as-is for the alpha.** The VM's "unsupported" verdict was wrong — it had only zram swap. |
| **Flameshot** | **Works** | "Flameshot works perfect, keep as is." The VM's `QPainter engine == 0` abort does not occur on real graphics hardware. Stays shipped. |
| **SP+ Welcome autostart** | **Works** | "T-37 - works perfect, Luna messed up." The agent misread a first-run autostart as an every-login one. |
| **Full install and use** | **Works** | The Dell test is what authorised the release on 2026-09-09. |

## Confirmed broken on real hardware

| Area | Result | Ledger |
|---|---|---|
| **Brave ad blocking** | **Not blocking ads** | Found by Christopher on the Dell. Root cause traced on the VM: Brave ships no filter lists and fetches them as components hours after first run. See **T-36**. |

## Still open against the Dell

- **Secure Boot state.** Unprovable in the VM — `/sys/firmware/efi` is absent and
  `mokutil --sb-state` returns "EFI variables are not supported on this system".
- **Whether the ad-block fix actually lands.** T-36's acceptance test is a fresh install
  from the ISO, opening Brave, and loading a page carrying ads.

## The standing lesson

Hibernation working once in two attempts on a spinning disk is a **pass**, by Christopher's
own call. The VM graded the same capability "unsupported" and would have generated work that
was neither needed nor correct. A symptom seen only in a VM is a candidate for testing on the
Dell, never a finding — and this is especially true for anything touching painting, the
framebuffer, GPU, screenshot capture, suspend, hibernation, or Secure Boot.
