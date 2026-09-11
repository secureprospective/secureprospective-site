# SP+ RESUME — 2026-09-11, public document session

**Supersedes** `RESUME-2026-09-11-v0.11-testing.md`. That document's engineering state is
still accurate and still live; this one carries it forward and adds the public-document work.
Read this one. Read the older one only if you need the publishing traps in full detail.

---

## 1. WHAT WE ARE DOING

Two threads are open at once.

**Thread A, engineering, PAUSED WAITING ON CHRISTOPHER.** v0.11 is built and with him for
acceptance testing. Nothing in that thread moves until his results come back.

**Thread B, this session, DELIVERED.** A deep public-facing document about SP+ for
secureprospective.com, written for an advisor who has not yet spoken to Christopher.

Repo: `~/work/secureprospective-advisor-os` on the **Beelink** (192.168.1.190, user `chris`,
key `/root/.ssh/beelink`). Branch `session/sp-plus-defense-in-depth`, head `a689086`, tree clean.
SP+ subproject is `projects/sp-plus`.

---

## 2. AGENTS + HARNESSES

None dispatched this session. All work done directly over ssh from CT105. No Bee, no Tom, no
subagents. Nothing to recover.

---

## 3. GATES / STATUS

| Item | State |
|---|---|
| Filing gate (`~/.reorg/tools/check-filing.sh`) | **PASS**, 23 entries, exit 0 |
| Repo tree | clean, 3 new commits this session |
| Disk | 306G free on `/`, 116G on `/home` |
| My processes on the Beelink | confirmed none |
| VMs | `fedora-0.11` RUNNING and **it is Christopher's, hands off**. `spplus-test` and `SP-Alpha-Rig` shut off |
| v0.11 acceptance | **not started by him yet as far as this session knows** |
| HTML structure of the public doc | validated, no unclosed tags, all 12 anchors resolve |

---

## 4. ARTIFACTS THAT EXIST AND WORK

**The public document, "Inside SP+".**

| Where | What |
|---|---|
| Artifact URL | https://claude.ai/code/artifact/358cc979-bbf8-4414-b421-861037db98a4 (version 3) |
| Scratchpad source | `scratchpad/inside-sp-plus.html` — the **fragment** form, what the Artifact tool publishes |
| Scratchpad standalone | `scratchpad/inside-sp-plus-standalone.html` — doctype, charset, viewport added |
| Beelink, for Christopher | `~/Downloads/INSIDE-SP-PLUS.html`, 62,623 bytes, standalone form |
| Committed | `projects/sp-plus/docs/PUBLIC-INSIDE-SP-PLUS.html`, standalone form |

⚠️ **Two forms, do not confuse them.** The Artifact tool wraps the file it publishes, so the
scratchpad `inside-sp-plus.html` has NO doctype/head/body by design. The website copy must be
the **standalone** build. Regenerating it is a 12-line python step recorded in §10.
**Republish by the same scratchpad path** to keep the artifact URL.

**The v0.11 ISO, unchanged from the previous session.**

```
~/Downloads/SP-PLUS-v0.11.iso
5497520128 bytes
sha256 8e5df67271fd073302c71603c59370cef6202b336942f5abd5fdcadc46d3816e
payload localhost/sp-plus-kde:v0.11 (ba98a7f8fdea)
os-release SP+ 1, BUILD_ID=20260911
```

---

## 5. THE CURRENT BUG

No bug. Nothing is broken and nothing is mid-flight.

**But one real product finding came out of this session and is NOT fixed:**

**Bitwarden has never shipped.** Doc 01 lists "Provide Bitwarden as the password manager,
working, on day one" as day-one job number 6 of 10, and `SP_PLUS_LANDING_CONTENT.md` markets it
in four places. The image does not contain it: no reference in `images/kde/Containerfile`,
`config/`, `scripts/` or `installer/`. Separately, `PasswordManagerEnabled = True` in the
shipped Brave policy (doc 16 appendix F), so the browser's own password saver is ON.

That is a **product gap and a marketing-accuracy gap**, not a document bug. The document has
been corrected. The gap is still open and needs Christopher's decision: ship Bitwarden, or
strike it from doc 01's day-one list and from the landing content.

---

## 6. HYPOTHESES ALREADY REFUTED — DO NOT RETEST

Carried forward from the previous resume, all still true:

1. **PAM cannot express a confirm-only sudo tier.** §6.1 of the older resume. Refuted, do not
   revisit the mechanism.
2. **A click is not a physical-presence proof on this desktop.** §6.2 of the older resume. Five
   synthesis routes were demonstrated by external review. The persistence guardrail is a check
   against text, not a boundary against malware. The closing statement of doc 16 says so.
3. **`skopeo --policy inspect` does not enforce anything.** Only `podman pull --signature-policy`
   is a real check.
4. **Podman and skopeo keep SEPARATE credential stores.** Logging one in does not log the other
   in. This cost a failed publish already.
5. **An absence check will match the sentence that corrects the claim.** Grepping the sudoers for
   the false line returns 1 because the correction quotes it. Do not read that as a failed fix.

**New this session:**

6. **The landing content draft is not a source of truth for what ships.** It is a 2026-08-25
   pre-build marketing draft and it says so in its own header. Every claim taken from it must be
   checked against the image or doc 16. That is how the Bitwarden error got in: it was the only
   claim in the document I did not verify against measured output.

---

## 7. DECISIONS

- **D44 stands.** Nothing may break day one.
- **D15 stands.** No compliance claims on any surface, including this new public document.
- **D-01 release identity**: round `VERSION_ID`, dated `BUILD_ID`, v0.11 labelled outside the image.
- **Christopher's ruling this session:** the password-manager comparison row comes out entirely.
  Done. He named the row; verification showed the claim was false in four places and all four
  were removed.
- **Editorial calls I made and flagged, all still reversible:**
  - Section 09 publishes the full residual-risk list.
  - The supply-chain paragraph deliberately does NOT detail the current state of the signature
    enforcement window, so the page is not a map for an attacker.
  - The Security Evidence Report is marked as not yet shipping, because no generator exists.

---

## 8. LEDGER STATE

Committed on `session/sp-plus-defense-in-depth`:

```
a689086 docs(sp-plus): the password manager claim was false in three places
b4a4dc3 docs(sp-plus): the comparison the advisor is actually making
0113bb7 docs(sp-plus): the public account of SP+, written for the advisor who has not called yet
b50f76d ledger(sp-plus): compact-safe resume, v0.11 built and with Christopher for testing
dd97106 build(sp-plus): v0.11 ISO, the first image carrying the persistence guardrail
```

Nothing written and uncommitted. Tree clean.

**Not committed anywhere, by choice:** the file has NOT been added to
`~/work/secureprospective-site`. Placing the route is a decision, and that repo is Tom's
working tree.

---

## 9. NEXT ACTIONS, IN ORDER

1. **Wait for Christopher's v0.11 acceptance results.** Unchanged and still item 1. Do not
   start new work on top of the image he is testing.
2. **Read section 0 of the acceptance sheet FIRST when results come back.** If Fin refused
   instead of asking, that is a D44 failure and the persistence class must be softened or
   reverted before anything else proceeds.
3. **Record the prompt-count number** he writes down. That number is the verdict on the design.
4. **Raise the Bitwarden gap** (§5) and get a decision: ship it, or strike it from doc 01 job 6
   and from `docs/SP_PLUS_LANDING_CONTENT.md`. Marketing currently promises software the image
   does not carry.
5. **If v0.11 accepted: publish it** with `projects/sp-plus/scripts/publish-image.sh
   localhost/sp-plus-kde:v0.11`. Both credential logins are in place. Expect the
   push-before-sign window; consider fixing the script first.
6. **Then enforcement.** `--enforce-container-sigpolicy` in `installer/bootc-wrapper.sh`, prove
   both directions on `spplus-test` (**NOT** on `fedora-0.11`), posture-gate assertion
   mutation-tested red. Never before a machine has booted a signed image.
7. **If Christopher wants the doc on the site:** the standalone file is ready to drop in as a
   static route. That is a change to `~/work/secureprospective-site`, which is Tom's tree, so
   coordinate rather than committing into it.

---

## 10. RELAY / ENVIRONMENT NOTES

- Beelink: `ssh -n -i /root/.ssh/beelink chris@192.168.1.190`. Always `-n`; a long-lived ssh
  holding the channel hung a tool call earlier in this session's lineage.
- **Apostrophes break single-quoted ssh heredocs.** A commit message containing `browser's`
  terminated the outer quote and truncated the commit. Fix: write the message to a file locally,
  `scp` it, `git commit -F`. This bit once today and cost an amend.
- **Regenerating the standalone form** from the fragment: read `inside-sp-plus.html`, find the
  index of `<div class="wrap">`, and write `doctype + html + head open + everything before that
  index + </head><body> + everything from that index + </body></html>`. The head block adds
  charset, viewport, description, robots and a four-line reset.
- Beelink `sudo` permits `podman` ONLY.
- Commands Christopher must run elsewhere go in `/root/paste.md` then scp to
  `chris@192.168.1.190:/home/chris/Downloads/paste.md`. Never pasted into chat.

---

## 11. HONEST STATUS

**The document is delivered and I have never seen it rendered.** Structure validates and all
anchors resolve, but the only Chrome reachable from CT105 is Christopher's live desktop, and
opening a tab there is an intrusion I did not make. The first visual check is his. If he reports
something visibly wrong, fix it and republish once; do not start a screenshot loop.

**The four-column comparison table is the most likely thing to need layout attention.** It has a
680px minimum width inside a horizontally scrolling container, which is allowed but is the one
element on the page that will not fit a phone screen without scrolling sideways.

**The Bitwarden finding is the genuinely important output of this session**, more than the
document itself. A day-one job that has never shipped, marketed in four places, and it surfaced
only because Christopher read one table row carefully. There may be more of that class in the
landing content draft. Nobody has audited the other nine day-one jobs against the image.

**v0.11 acceptance remains entirely unmeasured.** Section 0 of the acceptance sheet is still the
blocking unknown and no evidence has arrived.
