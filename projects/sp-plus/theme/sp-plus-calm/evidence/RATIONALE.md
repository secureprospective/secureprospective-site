# Calm graphite rationale

## Accent decision

The accent is a restrained blue-cyan, not Secure Prospective website blue, gold, or silver. Dark uses `#76B4D4`; light uses `#267A9B`. These hues recede against graphite and read as an optical temperature change instead of a warning. They are reserved for focus, active affordances, links, and the active window edge. The chosen colors are materially less saturated than the replaced orange and remain distinct from the red, amber, and teal semantic triad.

Rejected: the inherited hot orange `#FF704C` because it advances visually and turns every selection into an alert; cobalt because it approaches the website palette and produces a harder, more branded look; violet because it competes with visited-link meaning; green because it would blur selection with success.

## Glow system

The default dark grounds are retained: view/window `#111419`, alternate `#191D24`, and button `#1E232B`. Focus is a two-signal system: the existing one-pixel Aurorae active edge takes the blue-cyan focus color, while the active title ground is lifted to `#1F2E39` from inactive `#12161B`. `activeBlend` is a muted blue-gray `#416173`; inactive blend is graphite `#2B323A`. The focus line has no bloom in the color scheme. The slight lift and the edge are the glow, so focus is readable at a glance without a halo competing with work.

Selection is a low-saturation blue graphite ground, `#1E3440` dark and `#DCECF4` light, with normal-weight normal text. Hover remains neutral and is deliberately weaker than selection. This makes the hierarchy stable: hover suggests possibility, selection records a choice, and window focus identifies the typing target.

The semantic triad is intentionally separate from focus: soft red error, muted amber warning, and teal success. The contrast table includes all shipped foreground/background pairs and colour-vision simulations. Applications must still pair semantic color with text or iconography; a desktop palette cannot make color-only content accessible.

## Type

`Noto Sans` replaces `JetBrains Mono` in both Global Theme defaults. It is an actively maintained UI sans with broad script coverage, while monospaced type remains appropriate for terminals and code. The exact image inventory command from the brief could not run through the privileged tool because privilege escalation is blocked in this session. The equivalent unprivileged command succeeded: `podman run --rm --network=host localhost/sp-plus-kde:spike fc-list : family`, and listed `Noto Sans` plus its styles. No new Fedora package is required for this image.

## Source contradiction requiring integration action

The source Aurorae `decoration.svg` currently hard-codes Mars-coral `#FF704C` in `.active-border`; its title-bar fills and inactive borders are also literal SVG colors. The delivered `.colors` files cannot override those literals. To carry this palette into the literal active edge, integration must replace that active-border value with the delivered dark/light `DecorationFocus` color and align its inactive literals with the WM colors. This is evidence from the source asset, not a claim that the color scheme alone changes Aurorae.
