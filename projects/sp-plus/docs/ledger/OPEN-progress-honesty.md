# OPEN — is our install progress bar honest?

**Status: open question. Not a defect report, not yet a decision.**

Raised 2026-08-30 by the D-02 review, which is easy to read as vindication of
DN-28 and is not.

## The situation

DN-28 fixed a real defect: `RunInstallationTask` used task *count* as its
denominator, so `DeployBootcTask` — about 95% of the wall clock — got roughly
9% of the bar. Arithmetically honest, useless to a human. We replaced it with a
cost-weighted denominator, and the bar now tracks time far better.

## The argument against what we shipped

There is no trustworthy byte denominator anywhere in this operation. Local layer
import, decompression, OSTree deployment, SELinux relabeling, bootloader work
and temporary scratch use do not share a common unit. `bootc` itself offers no
completion contract: `--progress-fd` is experimental and documented for
`upgrade`/`switch` rather than `install`, the upstream "add progress for
install" PR closed without landing, and the tracker is still open.

So our weighted bar is **an estimate rendered as a percentage.** It is a much
better estimate than task count. It is still a number we invented, presented in
the one form users read as measured fact.

## Why this matters more for SP+ than for a general installer

This is a security product installing an encrypted disk for someone who cannot
diagnose it. The failure mode is not an inaccurate bar — it is an advisor
deciding a stuck install is finished, or that a working one has hung, and
cutting power to an encrypted volume mid-deploy.

## The alternative

Show what is actually known: current phase, elapsed time, bytes observed
written, a "still working" heartbeat, and an indeterminate moving indicator.
Honest, and arguably *more* reassuring during a long deploy than a percentage
that stalls at 71% for four minutes.

## The counter-argument

A percentage sets expectations no phase label can. "Installing the operating
system" for eleven minutes with no number feels broken to most people even when
a heartbeat is moving. There is a real usability cost to being scrupulous here,
and the cost lands on exactly the non-technical user we are protecting.

## What would settle it

Watch a real advisor sit through a full install on the Dell — 5400 rpm, worst
case we ship — and see which they do: trust the bar, or ask whether it is stuck.
This is not settleable by argument, and both positions above are reasonable.

**Blocked on:** an ISO build and a human watching an install end to end. Do not
close this by picking whichever is easier to implement.
