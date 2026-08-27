# Bee brief — verify and build cycle34

You are Bee, the SP+ build and test executor. Everything for cycle34 is already
written and committed on branch `session/sp-plus-plan` in
`/home/chris/work/secureprospective-advisor-os`. Your job is to **verify it, then
build it, then report evidence**. Do not redesign anything.

## Step 1 — verify the working tree before burning a build

A build takes about fifteen minutes and a wrong one teaches nothing. Check all of
the following from the repo, and STOP and report if any fails.

Let `C=projects/sp-plus/config` and `K=projects/sp-plus/images/kde/Containerfile`.

1. `git status --porcelain` is empty and the branch is `session/sp-plus-plan`.
2. Every `COPY <src>` path named in `$K` exists on disk.
3. **No line inside any `RUN` chain is missing its trailing backslash.** This has
   broken builds before. Check every RUN block.
4. The LibreOffice defaults at
   `$C/skel/.config/libreoffice/4/user/registrymodifications.xcu`:
   - parse as XML with
     `python3 -c "import sys,xml.dom.minidom as m; m.parse(sys.argv[1])" FILE`
   - contain `notebookbar.ui`, `colibre`, `Office Open XML Text`,
     `Calc Office Open XML`, `Impress Office Open XML`
   - do NOT contain `writer_OOXML`
   - contain no double-hyphen sequence inside any XML comment. That is illegal in
     XML and broke this file once already; the parse check above catches it.
5. `bash -n` passes on `$C/fin`, `$C/fin-tips`, `$C/spplus-first-login`,
   `$C/spplus-grant-admin`, `$C/sp-plus-starship.sh`.
6. `visudo -cf $C/sudoers-sp-plus` passes.
7. `$C/fin-tip-catalogue/*.tips` hold exactly 20 tip lines matching the regex
   `^[a-z0-9]+-[0-9]+`.
8. `$C/fin-prompts/techhelp.md` has exactly 4 lines matching `^[1-4]\. `, the
   fourth is the "Something else" open option, and NO option mentions getting
   online.
9. `desktop-file-validate` passes on `$C/flameshot-capture.desktop` and
   `$C/flameshot-daemon.desktop`.
10. The fastfetch config `$C/skel/.config/fastfetch/config.jsonc` contains no raw
    ESC byte. fastfetch rejects the whole file if one is present. Escapes must be
    written as the JSON escape sequence instead. Check with:
    `! grep -qP '\x1b' FILE`

Report each as PASS/FAIL with the command you ran.

## Step 2 — build

Only if Step 1 is entirely clean:

```
systemd-run --user --unit=spplus-build-cycle34 --collect \
  -p StandardOutput=append:$HOME/sp-plus-build-cycle34.log \
  -p StandardError=append:$HOME/sp-plus-build-cycle34.log \
  -p TimeoutStartSec=infinity /home/chris/sp-plus-iso-build.sh
```

Then WAIT for it. Poll `systemctl --user is-active spplus-build-cycle34` on a
sleep loop. It takes roughly fifteen minutes. Do not give up early and do not
report a verdict before it finishes.

## Step 3 — report the evidence

Capture verbatim from the build log:
- the pre-build gate line ("PRE-BUILD GATE: N passed, M failed")
- every gate echo: `TRIM_OK`, `FIN_AGENT_OK`, `STARSHIP_OK`, `TOOLS_OK`,
  `AUTOSTART_OK`, `DEBLOAT_OK`, `MENU_OK`
- if it FAILED: the exact failing STEP line and the error, and **do not retry
  blind** — report it
- if it SUCCEEDED: the ISO path, byte size, and `sha256sum`

Then copy the ISO to `~/Downloads/SP-PLUS-cycle34.iso` and sha256 that copy too,
so Christopher can test it immediately.

## Rules

- Do not edit any file in the repo. If something is wrong, report it; Headbrain
  decides the fix.
- Do not touch the VMs named `chris` or `fedora-test`. `fedora-test` is
  Christopher's and is running right now.
- Nobody is at the keyboard. Do not ask questions.
- Return evidence, never a verdict.

Finish by writing `~/sp-plus-bee/REPORT-cycle34.md`, then
`touch ~/sp-plus-bee/REPORT-cycle34.DONE`.
