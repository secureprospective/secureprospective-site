# SP+ package license inventory

Generated from the built image `localhost/sp-plus-kde:spike` (BUILD_ID 20260904e)
on 2026-09-04, by `rpm -qa` against the image itself -- not from a
hand-maintained list. Regenerate it whenever the image changes, with
`scripts/generate-licenses.sh`.

Flatpak applications (Joplin, Zoom, Thunderbird, and GNOME Boxes if the
advisor adds it) are NOT in this table. They are preinstall or optional
references fetched from Flathub on the advisor's machine, not binaries SP+
redistributes, and they carry their own licenses from Flathub.

Total `rpm -qa` entries: 2007, of which 7 are `gpg-pubkey`
repository signing keys rather than redistributed software, leaving
**2000 software packages**.

## Summary

| License | Packages |
|---|---|
| GPL-2.0-or-later | 221 |
| LGPL-2.1-or-later | 132 |
| MIT | 126 |
| OFL-1.1 | 66 |
| GPL-3.0-or-later | 64 |
| BSD-3-Clause | 61 |
| GPL-1.0-or-later OR Artistic-1.0-Perl | 51 |
| GPL-2.0-only | 43 |
| LGPL-3.0-only OR GPL-3.0-only WITH Qt-GPL-exception-1.0 | 41 |
| LGPL-2.0-or-later | 36 |
| Apache-2.0 | 29 |
| MPL-2.0 | 22 |
| LGPL-3.0-or-later | 21 |
| LicenseRef-Callaway-Redistributable-no-modification-permitted | 18 |
| LGPL-2.1-only | 18 |
| MPL-2.0 AND Apache-2.0 AND LGPL-3.0-only AND LGPL-3.0-or-later AND CC0-1.0 AND BSD-3-Clause AND (LGPL-2.1-only OR SISSL) AND (MPL-2.0 OR LGPL-3.0-or-later) AND (MPL-2.0 OR LGPL-2.1-or-later) AND (MPL-1.1 OR GPL-2.0-only OR LGPL-2.1-only) AND MIT | 16 |
| GPL-2.0-or-later AND LGPL-2.1-or-later | 16 |
| BSD-2-Clause AND BSD-3-Clause AND CC0-1.0 AND GPL-2.0-only AND GPL-2.0-or-later AND GPL-3.0-only AND LGPL-2.0-only AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-2.1-or-later AND LGPL-3.0-only AND (GPL-2.0-only OR GPL-3.0-only) AND (LGPL-2.1-only OR LGPL-3.0-only) AND MIT | 15 |
| BSD-2-Clause | 15 |
| GPL-3.0-or-later AND LGPL-3.0-or-later | 14 |
| GPL-3.0-only | 13 |
| AGPL-3.0-only AND GPL-2.0-or-later | 12 |
| LicenseRef-Callaway-LGPLv2+ | 10 |
| GPL-2.0-or-later AND LGPL-2.1-or-later AND BSD-2-Clause AND BSD-3-Clause | 10 |
| BSD-3-Clause AND CC0-1.0 AND GPL-2.0-only AND GPL-2.0-or-later AND GPL-3.0-only AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-3.0-only AND (GPL-2.0-only OR GPL-3.0-only) AND (LGPL-2.1-only OR LGPL-3.0-only) | 10 |
| ISC | 9 |
| LicenseRef-Callaway-BSD | 8 |
| GPL-3.0-or-later AND LGPL-3.0-or-later AND (GPL-3.0-or-later WITH GCC-exception-3.1) AND (GPL-3.0-or-later WITH Texinfo-exception) AND (LGPL-2.1-or-later WITH GCC-exception-2.0) AND (GPL-2.0-or-later WITH GCC-exception-2.0) AND (GPL-2.0-or-later WITH GNU-compiler-exception) AND BSL-1.0 AND GFDL-1.3-or-later AND Linux-man-pages-copyleft-2-para AND SunPro AND BSD-1-Clause AND BSD-2-Clause AND BSD-2-Clause-Views AND BSD-3-Clause AND BSD-4-Clause AND BSD-Source-Code AND Zlib AND MIT AND Apache-2.0 AND (Apache-2.0 WITH LLVM-Exception) AND ZPL-2.1 AND ISC AND LicenseRef-Fedora-Public-Domain AND HP-1986 AND curl AND Martin-Birgmeier AND HPND-Markus-Kuhn AND dtoa AND SMLNJ AND AMD-newlib AND OAR AND HPND-merchantability-variant AND HPND-Intel | 8 |
| ((GPL-2.0-only WITH Linux-syscall-note) OR BSD-2-Clause) AND ((GPL-2.0-only WITH Linux-syscall-note) OR BSD-3-Clause) AND ((GPL-2.0-only WITH Linux-syscall-note) OR CDDL-1.0) AND ((GPL-2.0-only WITH Linux-syscall-note) OR Linux-OpenIB) AND ((GPL-2.0-only WITH Linux-syscall-note) OR MIT) AND ((GPL-2.0-or-later WITH Linux-syscall-note) OR BSD-3-Clause) AND ((GPL-2.0-or-later WITH Linux-syscall-note) OR MIT) AND 0BSD AND BSD-2-Clause AND (BSD-2-Clause OR Apache-2.0) AND BSD-3-Clause AND BSD-3-Clause-Clear AND CC0-1.0 AND GFDL-1.1-no-invariants-or-later AND GPL-1.0-or-later AND (GPL-1.0-or-later OR BSD-3-Clause) AND (GPL-1.0-or-later WITH Linux-syscall-note) AND GPL-2.0-only AND (GPL-2.0-only OR Apache-2.0) AND (GPL-2.0-only OR BSD-2-Clause) AND (GPL-2.0-only OR BSD-3-Clause) AND (GPL-2.0-only OR CDDL-1.0) AND (GPL-2.0-only OR GFDL-1.1-no-invariants-or-later) AND (GPL-2.0-only OR GFDL-1.2-no-invariants-only) AND (GPL-2.0-only OR GFDL-1.2-no-invariants-or-later) AND (GPL-2.0-only WITH Linux-syscall-note) AND GPL-2.0-or-later AND (GPL-2.0-or-later OR BSD-2-Clause) AND (GPL-2.0-or-later OR BSD-3-Clause) AND (GPL-2.0-or-later OR CC-BY-4.0) AND (GPL-2.0-or-later WITH GCC-exception-2.0) AND (GPL-2.0-or-later WITH Linux-syscall-note) AND ISC AND LGPL-2.0-or-later AND (LGPL-2.0-or-later OR BSD-2-Clause) AND (LGPL-2.0-or-later WITH Linux-syscall-note) AND LGPL-2.1-only AND (LGPL-2.1-only OR BSD-2-Clause) AND (LGPL-2.1-only WITH Linux-syscall-note) AND LGPL-2.1-or-later AND (LGPL-2.1-or-later WITH Linux-syscall-note) AND (Linux-OpenIB OR GPL-2.0-only) AND (Linux-OpenIB OR GPL-2.0-only OR BSD-2-Clause) AND Linux-man-pages-copyleft AND MIT AND (MIT OR Apache-2.0) AND (MIT OR GPL-2.0-only) AND (MIT OR GPL-2.0-or-later) AND (MIT OR LGPL-2.1-only) AND (MPL-1.1 OR GPL-2.0-only) AND (X11 OR GPL-2.0-only) AND (X11 OR GPL-2.0-or-later) AND Zlib AND (copyleft-next-0.3.1 OR GPL-2.0-or-later) | 8 |
| pubkey | 7 |
| MIT-open-group | 7 |
| LicenseRef-Fedora-Public-Domain | 7 |
| HPND-sell-variant | 7 |
| CC0-1.0 AND LGPL-2.0-or-later | 7 |
| CC0-1.0 AND GPL-2.0-or-later AND GPL-3.0-or-later AND LGPL-2.1-or-later AND LGPL-3.0-or-later AND (BSD-3-Clause OR LGPL-3.0-or-later OR GPL-2.0-or-later) AND CC-BY-4.0 AND MIT | 7 |
| BSL-1.0 AND MIT AND Python-2.0.1 | 7 |
| BSD-3-Clause OR GPL-2.0-only | 7 |
| Zlib | 6 |
| X11-distribute-modifications-variant | 6 |
| MIT AND BSD-3-Clause AND SGI-B-2.0 | 6 |
| LGPL-2.1-or-later OR MPL-2.0 | 6 |
| GPL-3.0-only WITH Qt-GPL-exception-1.0 | 6 |
| GPL-1.0-or-later | 6 |
| CC0-1.0 AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-3.0-only AND (LGPL-2.1-only OR LGPL-3.0-only) | 6 |
| BSD-3-Clause AND CC0-1.0 AND LGPL-2.0-or-later AND LGPL-2.1-or-later | 6 |
| BSD-2-Clause AND BSD-3-Clause AND CC0-1.0 AND GPL-2.0-only AND GPL-2.0-or-later AND GPL-3.0-only AND LGPL-2.0-only AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-2.1-or-later AND LGPL-3.0-only AND LGPL-3.0-or-later AND (GPL-2.0-only OR GPL-3.0-only) AND (LGPL-2.1-only OR LGPL-3.0-only) AND MIT | 6 |
| Apache-2.0 WITH LLVM-exception | 6 |
| AGPL-3.0-or-later | 6 |
| (AFL-2.1 OR GPL-2.0-or-later) AND GPL-2.0-or-later | 6 |
| X11 | 5 |
| MIT-feh AND MIT-Modern-Variant AND BSD-1-Clause AND BSD-3-Clause AND GPL-3.0-or-later WITH Autoconf-exception-macro | 5 |
| LicenseRef-Not-Copyrightable | 5 |
| LGPL-2.1-or-later AND MIT | 5 |
| LGPL-2.1-or-later AND LGPL-2.1-only AND BSD-3-Clause-Modification | 5 |
| LGPL-2.1-or-later AND LGPL-2.0-or-later AND BSD-2-Clause-Views AND MIT | 5 |
| GPL-2.0-only AND GPL-2.0-or-later AND BSD-3-Clause AND BSD-2-Clause AND (HPND-export-US-modify AND HPND-sell-variant) AND (GPL-2.0-only WITH Linux-syscall-note OR BSD-3-Clause) | 5 |
| CC0-1.0 AND LGPL-2.0-only AND LGPL-2.0-or-later AND LGPL-3.0-only AND (LGPL-2.1-only OR LGPL-3.0-only) | 5 |
| BSD-3-Clause AND CC0-1.0 AND GPL-2.0-only AND GPL-2.0-or-later AND GPL-3.0-only AND (GPL-2.0-only OR GPL-3.0-only) AND MIT | 5 |
| Apache-2.0 WITH LLVM-exception AND BSD-3-Clause AND Zlib AND BSD-2-Clause | 5 |
| OFL-1.1-RFN | 4 |
| LGPL-3.0-only | 4 |
| LGPL-2.1-or-later AND SunPro AND LGPL-2.1-or-later WITH GCC-exception-2.0 AND BSD-3-Clause AND GPL-2.0-or-later AND LGPL-2.1-or-later WITH GNU-compiler-exception AND GPL-2.0-only AND ISC AND LicenseRef-Fedora-Public-Domain AND HPND AND CMU-Mach AND LGPL-2.0-or-later AND Unicode-3.0 AND GFDL-1.1-or-later AND GPL-1.0-or-later AND FSFUL AND MIT AND Inner-Net-2.0 AND X11 AND GPL-2.0-or-later WITH GCC-exception-2.0 AND GFDL-1.3-only AND GFDL-1.1-only AND GPL-3.0-or-later AND GPL-3.0-or-later WITH Autoconf-exception-generic-3.0 AND GPL-3.0-or-later WITH Texinfo-exception | 4 |
| LGPL-2.1-or-later AND MIT AND GPL-2.0-or-later | 4 |
| GPL-2.0-or-later WITH SANE-exception AND GPL-2.0-or-later AND GPL-2.0-only AND LGPL-2.0-or-later AND LGPL-2.1-or-later AND LicenseRef-Fedora-Public-Domain AND IJG AND MIT | 4 |
| GPL-2.0-or-later OR LGPL-3.0-or-later | 4 |
| GPL-2.0-or-later AND MIT AND BSD-3-Clause-HP AND IJG AND GPL-2.0-only AND LGPL-2.1-or-later AND BSD-2-Clause AND LicenseRef-Fedora-Public-Domain AND python-ldap | 4 |
| (GPL-2.0-only OR GPL-3.0-only) AND GPL-2.0-or-later AND LGPL-2.0-or-later AND LGPL-2.1-or-later AND MIT | 4 |
| CC0-1.0 AND GPL-2.0-or-later AND LGPL-2.0-or-later | 4 |
| BSD-3-Clause AND GPL-2.0-or-later | 4 |
| BSD-3-Clause AND GPL-2.0-only AND GPL-2.0-or-later AND LGPL-2.1-or-later AND MIT | 4 |
| BSD-3-Clause AND FSFULLR AND X11 AND GPL-2.0-or-later AND FSFAP AND FSFUL AND GPL-3.0-or-later | 4 |
| BSD-3-Clause AND CC0-1.0 AND LGPL-2.0-only AND LGPL-2.0-or-later AND LGPL-2.1-or-later AND LGPL-3.0-or-later | 4 |
| BSD-3-Clause AND BSD-2-Clause AND ISC AND SSH-OpenSSH AND ssh-keyscan AND snprintf AND LicenseRef-Fedora-Public-Domain AND X11-distribute-modifications-variant | 4 |
| Apache-2.0 AND Artistic-2.0 AND BSD-2-Clause AND BSD-3-Clause AND BlueOak-1.0.0 AND CC-BY-3.0 AND CC0-1.0 AND ISC AND MIT | 4 |
| MIT AND X11 | 3 |
| MIT AND HPND-sell-variant | 3 |
| LGPLv2+ | 3 |
| LGPL-3.0-or-later AND LGPL-2.0-or-later AND BSD-3-Clause-Open-MPI | 3 |
| LGPL-3.0-only OR CC-BY-SA-3.0 | 3 |
| LGPL-2.1-only OR MPL-1.1 | 3 |
| LGPL-2.0-or-later AND LGPL-2.1-or-later AND GPL-2.0-or-later | 3 |
| LGPL-2.0-or-later AND LGPL-2.1-or-later | 3 |
| LGPL-2.0-or-later AND GPL-3.0-only AND MPL-2.0 AND BSD-3-Clause-Sun | 3 |
| ISC AND BSD-4-Clause AND BSD-2-Clause AND pkgconf AND MIT | 3 |
| HPND | 3 |
| GPL-3.0-or-later AND LGPL-3.0-or-later AND GFDL-1.3-or-later | 3 |
| GPL-3.0-or-later AND LGPL-2.1-or-later | 3 |
| GPL-2.0-or-later AND LGPL-2.0-or-later AND MIT AND GPL-3.0-or-later WITH Bison-exception-2.2 | 3 |
| (GPL-2.0-only OR LGPL-3.0-only OR GPL-3.0-only WITH Qt-GPL-exception-1.0) AND BSD-3-Clause | 3 |
| GPL-2.0-only OR GPL-3.0-only | 3 |
| ( GPL-2.0-only OR Apache-2.0 ) AND ( GPL-2.0-or-later OR Apache-2.0 ) AND BSD-2-Clause AND BSD-3-Clause AND CC-BY-4.0 AND GPL-2.0-only AND GPL-2.0-or-later AND GPL-3.0-or-later AND ( GPL-3.0-or-later WITH Bison-exception-2.2 ) AND LGPL-2.0-only AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-2.1-or-later AND OpenSSL AND MIT AND OFL-1.1 AND CC0-1.0 AND PHP-3.0 AND PHP-3.01 AND zlib AND dtoa AND FSFAP AND blessing AND Info-ZIP AND Boehm-GC | 3 |
| CC-BY-SA-4.0 | 3 |
| CC0-1.0 AND LGPL-2.0-or-later AND LGPL-2.1-or-later | 3 |
| CC0-1.0 | 3 |
| BSD-Attribution-HPND-disclaimer | 3 |
| BSD-3-Clause AND CC0-1.0 AND GPL-2.0-only AND GPL-2.0-or-later AND GPL-3.0-only AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-2.1-or-later AND LGPL-3.0-only AND (GPL-2.0-only OR GPL-3.0-only) AND (LGPL-2.1-only OR LGPL-3.0-only) AND bzip2-1.0.6 | 3 |
| BSD-3-Clause AND CC0-1.0 | 3 |
| BSD-2-Clause-Darwin AND BSD-2-Clause | 3 |
| BSD-2-Clause AND BSD-3-Clause AND CC0-1.0 AND GPL-2.0-only AND GPL-2.0-or-later AND GPL-3.0-only AND LGPL-2.0-only AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-2.1-or-later AND LGPL-3.0-only AND (GPL-2.0-only OR GPL-3.0-only) AND (LGPL-2.1-only OR LGPL-3.0-only) | 3 |
| BSD-2-Clause AND BSD-3-Clause AND CC0-1.0 AND GPL-2.0-only AND GPL-2.0-or-later AND GPL-3.0-only AND GPL-3.0-or-later AND LGPL-2.0-only AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-2.1-or-later AND LGPL-3.0-only AND (GPL-2.0-only OR GPL-3.0-only) AND (LGPL-2.1-only OR LGPL-3.0-only) AND MIT | 3 |
| Apache-2.0 AND HPND AND LGPL-2.1-or-later AND LicenseRef-Fedora-Public-Domain AND OFL-1.1 | 3 |
| Apache-2.0 AND BSD-3-Clause | 3 |
| Apache-2.0 AND BSD-2-Clause AND BSD-3-Clause AND ISC AND MIT AND MPL-2.0 | 3 |
| zlib | 2 |
| WTFPL | 2 |
| Vim AND LGPL-2.1-or-later AND MIT AND GPL-1.0-only AND (GPL-2.0-only OR Vim) AND Apache-2.0 AND BSD-2-Clause AND BSD-3-Clause AND GPL-2.0-or-later AND GPL-3.0-or-later AND OPUBL-1.0 AND Apache-2.0 WITH Swift-exception | 2 |
| Unicode-DFS-2016 | 2 |
| Python-2.0.1 | 2 |
| OLDAP-2.8 | 2 |
| OFL-1.1 AND Apache-2.0 | 2 |
| (MPL-2.0 OR LGPL-2.1-or-later) AND Apache-2.0 WITH LLVM-exception AND BSD-3-Clause AND CC0-1.0 AND GPL-3.0-or-later AND IJG AND ISC AND MIT AND Unicode-3.0 AND Unicode-DFS-2016 AND (0BSD OR MIT OR Apache-2.0) AND (Apache-2.0 OR MIT) AND (Apache-2.0 WITH LLVM-exception OR Apache-2.0 OR MIT) AND (BSD-2-Clause OR Apache-2.0 OR MIT) AND (BSD-3-Clause OR Apache-2.0) AND (MIT OR Apache-2.0 OR Zlib) AND (Unlicense OR MIT) | 2 |
| MPL-2.0 AND ISC AND MIT AND BSD-3-Clause AND BSD-2-Clause | 2 |
| MIT-Modern-Variant | 2 |
| MIT AND X11 AND MIT-CMU | 2 |
| MIT AND (MIT OR Apache-2.0) | 2 |
| MIT AND MIT-open-group | 2 |
| MIT AND LicenseRef-Fedora-Public-Domain | 2 |
| LicenseRef-Fedora-Public-Domain AND (GPL-2.0-only WITH ClassPath-exception-2.0) | 2 |
| LicenseRef-Fedora-Public-Domain AND GPL-1.0-or-later | 2 |
| LicenseRef-Callaway-LGPLv2+ OR Apache-2.0 | 2 |
| LicenseRef-Callaway-LGPLv2 | 2 |
| (LGPLv2 with exceptions or GPLv3 with exceptions) and BSD and LGPLv2+ and ASL 2.0 and IJG and MIT and GPLv2+ and ISC and OpenSSL and (MPLv1.1 or GPLv2 or LGPLv2) | 2 |
| (LGPL-3.0-only OR LGPL-2.1-only) AND GPL-3.0-only | 2 |
| LGPL-2.1-or-later OR GPL-2.0-or-later OR MPL-1.1 | 2 |
| LGPL-2.1-or-later OR Apache-2.0 | 2 |
| LGPL-2.1-or-later AND PHP-3.0 AND PHP-3.01 AND LicenseRef-Fedora-Public-Domain | 2 |
| LGPL-2.1-or-later AND LGPL-2.0-or-later AND (MIT OR LGPL-2.1-or-later) AND MPL-1.1 AND BSD-2-Clause AND BSD-3-Clause AND BSD-2-Clause-Views AND (BSD-2-Clause AND DOC) AND MIT-Festival AND (LGPL-2.0-or-later AND LicenseRef-Fedora-Public-Domain) AND (MPL-1.1 OR LGPL-2.0-or-later OR MIT) AND BSD-3-Clause WITH AdditionRef-Dart AND MIT AND GPL-2.0-only WITH Linux-syscall-note | 2 |
| LGPL-2.1-or-later AND GPL-2.0-or-later | 2 |
| LGPL-2.1-or-later AND BSD-3-Clause | 2 |
| LGPL-2.1-only OR LGPL-3.0-only | 2 |
| LGPL-2.1-only AND GPL-2.0-only AND CC0-1.0 AND LGPL-3.0-only AND GPL-3.0-or-later AND GPL-2.0-or-later AND GPL-3.0-only | 2 |
| LGPL-2.0-or-later AND GPL-2.0-or-later | 2 |
| LGPL-2.0-only AND LGPL-2.0-or-later AND GPL-2.0-or-later | 2 |
| Info-ZIP | 2 |
| ImageMagick | 2 |
| GPL-3.0-or-later AND GPL-2.0-or-later AND LGPL-2.1-or-later AND BSD-3-Clause | 2 |
| GPL-3.0-or-later AND GFDL-1.3-no-invariants-or-later AND LGPL-2.1-or-later AND LGPL-3.0-or-later | 2 |
| GPL-3.0-or-later AND BSD-3-Clause AND FSFAP AND LGPL-2.1-or-later AND GPL-2.0-or-later AND LGPL-2.0-or-later AND LicenseRef-Fedora-Public-Domain AND GFDL-1.3-or-later AND LGPL-2.0-or-later WITH GCC-exception-2.0 AND GPL-3.0-or-later WITH GCC-exception-3.1 AND GPL-2.0-or-later WITH GNU-compiler-exception AND MIT | 2 |
| GPL-3.0-only AND CC-BY-SA-4.0 AND LGPL-3.0-or-later | 2 |
| GPL-2.0-or-later WITH SANE-exception AND MIT | 2 |
| GPL-2.0-or-later WITH cryptsetup-OpenSSL-exception AND LGPL-2.1-or-later WITH cryptsetup-OpenSSL-exception | 2 |
| GPL-2.0-or-later AND MIT AND BSD-2-Clause | 2 |
| GPL-2.0-or-later AND LicenseRef-Callaway-GFDL | 2 |
| GPL-2.0-or-later AND LGPL-2.1-only OR LGPL-2.0-only | 2 |
| GPL-2.0-or-later AND LGPL-2.0-or-later | 2 |
| GPL-2.0-or-later AND GPL-3.0-or-later AND FSFUL AND FSFULLRWD AND LGPL-2.1-only AND LGPL-2.1-or-later AND X11 | 2 |
| GPL-2.0-or-later AND CC-BY-SA-3.0 | 2 |
| GPL-2.0-or-later AND CC0-1.0 | 2 |
| GPL-2.0-or-later AND BSD-3-Clause AND LicenseRef-Fedora-Public-Domain | 2 |
| GPL-2.0-or-later AND BSD-3-Clause | 2 |
| GPL-2.0-only OR LGPL-2.1-or-later OR MPL-1.1 | 2 |
| GPL-2.0-only OR BSD-2-Clause AND BSD-3-Clause | 2 |
| GPL-2.0-only AND W3C AND LGPL-2.1-only AND ICU AND ISC AND MIT | 2 |
| GPL-2.0-only AND LGPL-2.1-only AND MIT | 2 |
| GPL-2.0-only AND LGPL-2.1-only AND GFDL-1.2-no-invariants-only | 2 |
| GPL-2.0-only AND GPL-3.0-only AND LicenseRef-Callaway-GFDL | 2 |
| GPL-2.0-only AND GPL-2.0-or-later | 2 |
| GPL-2.0-only AND BSD-2-Clause AND MIT AND Unicode-DFS-2016 AND (LGPL-2.1-only OR BSD-2-Clause) AND (MIT OR Apache-2.0) AND (Unlicense OR MIT) | 2 |
| GPL-2.0-only AND Artistic-2.0 AND ISC | 2 |
| GPL-1.0-or-later AND GPL-2.0-or-later AND MIT AND LicenseRef-Callaway-Redistributable-no-modification-permitted | 2 |
| curl | 2 |
| CC0-1.0 AND LGPL-2.0-only AND LGPL-2.0-or-later AND LGPL-2.1-or-later AND LGPL-3.0-only AND (LGPL-2.1-only OR LGPL-3.0-only) | 2 |
| CC0-1.0 AND LGPL-2.0-only AND LGPL-2.0-or-later | 2 |
| CC0-1.0 AND GPL-2.0-or-later AND LGPL-2.1-or-later AND MIT | 2 |
| CC0-1.0 AND GPL-2.0-or-later AND LGPL-2.0-only AND LGPL-2.0-or-later | 2 |
| CC0-1.0 AND GPL-2.0-only AND LGPL-2.0-only AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-2.1-or-later AND xlock AND MIT AND BSD-3-Clause AND CC-BY-3.0 | 2 |
| CC0-1.0 AND GPL-2.0-only AND GPL-2.0-or-later AND GPL-3.0-only AND LGPL-2.1-only AND LGPL-3.0-only AND (GPL-2.0-only OR GPL-3.0-only) AND (LGPL-2.1-only OR LGPL-3.0-only) | 2 |
| CC0-1.0 AND GPL-2.0-only AND GPL-2.0-or-later AND GPL-3.0-only AND LGPL-2.0-only AND LGPL-2.1-only AND LGPL-3.0-only AND (GPL-2.0-only OR GPL-3.0-only) AND (LGPL-2.1-only OR LGPL-3.0-only) | 2 |
| CC0-1.0 AND GPL-2.0-only AND GPL-2.0-or-later AND GPL-3.0-only AND LGPL-2.0-only AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-3.0-only AND (GPL-2.0-only OR GPL-3.0-only) AND (LGPL-2.1-only OR LGPL-3.0-only) | 2 |
| BSL-1.0 AND (MIT OR NCSA) | 2 |
| BSD-4-Clause | 2 |
| BSD-3-Clause AND GPL-2.0-or-later AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-3.0-only AND (LGPL-2.1-only OR LGPL-3.0-only) | 2 |
| BSD-3-Clause AND GPL-2.0-or-later AND LGPL-2.0-or-later | 2 |
| BSD-3-Clause and CC0-1.0 and MIT and LGPL-2.1-or-later and MIT | 2 |
| BSD-3-Clause AND CC0-1.0 AND LGPL-2.1-only AND LGPL-3.0-only | 2 |
| BSD-3-Clause AND CC0-1.0 AND LGPL-2.1-only AND LGPL-2.1-or-later AND LGPL-3.0-only AND (LGPL-2.1-only OR LGPL-3.0-only) | 2 |
| BSD-3-Clause AND CC0-1.0 AND LGPL-2.0-only AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-3.0-only AND (LGPL-2.1-only OR LGPL-3.0-only) | 2 |
| BSD-3-Clause AND CC0-1.0 AND GPL-2.0-or-later AND LGPL-2.1-only AND LGPL-2.1-or-later AND LGPL-3.0-only AND (LGPL-2.1-only OR LGPL-3.0-only) | 2 |
| BSD-3-Clause AND CC0-1.0 AND GPL-2.0-or-later AND LGPL-2.0-or-later | 2 |
| BSD-3-Clause AND CC0-1.0 AND GPL-2.0-or-later | 2 |
| BSD-3-Clause and CC0-1.0 and (GPL-2.0-only or GPL-3.0-only) and GPL-2.0-or-later and LGPL-2.0-or-later and LGPL-2.1-or-later | 2 |
| BSD-3-Clause AND CC0-1.0 AND GPL-2.0-only AND GPL-3.0-only AND LGPL-2.0-only AND LGPL-2.0-or-later AND LGPL-2.1-or-later AND LGPL-3.0-only AND (LGPL-2.1-only OR LGPL-3.0-only) | 2 |
| BSD-3-Clause AND BSD-2-Clause AND GPL-3.0-or-later | 2 |
| BSD-3-Clause AND Apache-2.0 AND ISC | 2 |
| BSD-2-Clause AND MIT | 2 |
| BSD-2-Clause AND CC0-1.0 AND GPL-2.0-or-later AND LGPL-2.0-or-later | 2 |
| BSD-2-Clause AND CC0-1.0 AND GPL-2.0-only AND GPL-3.0-only AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-2.1-or-later AND LGPL-3.0-only AND (GPL-2.0-only OR GPL-3.0-only) AND (LGPL-2.1-only OR LGPL-3.0-only) | 2 |
| BSD-2-Clause AND BSD-3-Clause AND GPL-2.0-only AND GPL-2.0-or-later AND GPL-3.0-only AND LGPL-2.0-only AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-3.0-only AND (GPL-2.0-only OR GPL-3.0-only) AND (LGPL-2.1-only OR LGPL-3.0-only) | 2 |
| BSD-2-Clause AND BSD-3-Clause AND CC0-1.0 AND GPL-2.0-or-later AND LGPL-2.0-only AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-3.0-only AND (LGPL-2.1-only OR LGPL-3.0-only) AND MIT | 2 |
| BSD-2-Clause AND BSD-3-Clause AND CC0-1.0 AND GPL-2.0-only AND GPL-2.0-or-later AND GPL-3.0-only AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-3.0-only AND (GPL-2.0-only OR GPL-3.0-only) AND (LGPL-2.1-only OR LGPL-3.0-only) | 2 |
| BSD-2-Clause AND BSD-3-Clause | 2 |
| Artistic-2.0 AND GPL-2.0-only AND GPL-2.0-or-later AND GPL-3.0-only AND LGPL-2.0-only AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-2.1-only AND LGPL-3.0-only AND (GPL-2.0-only OR GPL-3.0-only) AND (LGPL-2.1-only OR LGPL-3.0-only) | 2 |
| Apache-2.0 WITH LLVM-exception OR NCSA | 2 |
| Apache-2.0 AND BSD-2-Clause AND BSD-3-Clause AND FSFAP AND GPL-1.0-or-later AND GPL-2.0-only AND GPL-2.0-or-later AND GPL-2.0-or-later WITH GCC-exception-2.0 AND LGPL-2.0-only AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-2.1-or-later AND MIT AND LicenseRef-Fedora-Public-Domain AND CC-BY-3.0 | 2 |
| Apache-1.1 AND Apache-2.0 AND LicenseRef-Callaway-BSD AND LicenseRef-Callaway-BSD-with-advertising AND GPL-1.0-or-later AND GPL-2.0-only AND LicenseRef-Callaway-GPLv2-with-exceptions AND IJG AND LicenseRef-Callaway-LGPLv2+ AND LicenseRef-Callaway-MIT AND MPL-2.0 AND LicenseRef-Callaway-Public-Domain AND W3C AND Zlib AND ISC AND FTL AND LicenseRef-RSA | 2 |
| Zlib AND MIT AND Apache-2.0 AND (Apache-2.0 OR MIT) | 1 |
| Zlib AND MIT | 1 |
| Zlib AND (HPND-Pbmplus AND Zlib) AND MIT AND (MIT OR Unlicense) AND LicenseRef-Fedora-Public-Domain | 1 |
| Zlib AND BSD-3-Clause AND MIT AND IJG | 1 |
| X11-distribute-modifications-variant AND MIT-open-group | 1 |
| X11-distribute-modifications-variant AND HPND-sell-variant | 1 |
| Unlicense | 1 |
| Unicode-DFS-2016 AND BSD-2-Clause AND BSD-3-Clause AND NAIST-2003 AND LicenseRef-Fedora-Public-Domain | 1 |
| Unicode-DFS-2015 | 1 |
| Unicode-3.0 | 1 |
| tu-berlin-2.0 | 1 |
| TTWL | 1 |
| TermReadKey AND (GPL-1.0-or-later OR Artistic-1.0-Perl) | 1 |
| TCL AND GPL-3.0-or-later WITH Bison-exception-2.2 AND BSD-3-Clause | 1 |
| SMLNJ AND HPND-sell-variant | 1 |
| SISSL AND BSD-3-Clause | 1 |
| Python-2.0.1 AND MIT AND BSD-3-Clause AND MIT-CMU AND HPND-SMC AND BSD-2-Clause AND dtoa AND Unicode-3.0 | 1 |
| Multiple, see https://brave.com/ | 1 |
| MPL-2.0 AND LicenseRef-Fedora-Public-Domain | 1 |
| MPL-2.0 AND BSD-3-Clause AND MIT | 1 |
| MPL-1.1 OR LGPL-2.0-or-later | 1 |
| MPL-1.1 | 1 |
| ((MIT OR Apache-2.0) AND Unicode-DFS-2016) AND (0BSD OR MIT OR Apache-2.0) AND Apache-2.0 AND (Apache-2.0 OR MIT) AND (Apache-2.0 WITH LLVM-exception OR Apache-2.0 OR MIT) AND (BSD-2-Clause OR Apache-2.0 OR MIT) AND BSD-3-Clause AND BSL-1.0 AND LGPL-2.0-or-later AND MIT AND (MIT OR Apache-2.0) AND (MIT OR Zlib OR Apache-2.0) AND MPL-2.0 AND Unicode-3.0 AND (Unlicense OR MIT) AND Zlib | 1 |
| MIT-open-group AND X11 AND HPND AND HPND-sell-variant AND SMLNJ AND NTP | 1 |
| MIT-open-group AND X11 AND HPND AND HPND-sell-variant AND SMLNJ AND MIT AND ISC AND HPND-doc AND HPND-doc-sell | 1 |
| MIT-open-group AND SMLNJ AND X11 AND ISC | 1 |
| MIT-open-group AND SMLNJ AND MIT | 1 |
| MIT-open-group AND HPND-sell-variant AND X11 AND HPND-doc AND HPND-doc-sell | 1 |
| MIT-open-group AND HPND-DEC | 1 |
| MIT-open-group AND HPND AND SMLNJ | 1 |
| MIT-CMU AND BSD-3-Clause AND MIT | 1 |
| MIT AND X11-distribute-modifications-variant | 1 |
| MIT AND Python-2.0.1 AND Apache-2.0 AND BSD-2-Clause AND BSD-3-Clause AND ISC AND MPL-2.0 AND (Apache-2.0 OR BSD-2-Clause) | 1 |
| MIT AND NTP | 1 |
| MIT AND (MIT OR Apache-2.0) AND (Unlicense OR MIT) AND Unicode-DFS-2016 | 1 |
| MIT AND MIT-open-group AND X11 | 1 |
| MIT AND ISC-Veillard AND W3C | 1 |
| MIT AND ICU AND CC-BY-3.0 | 1 |
| MIT AND ICU | 1 |
| MIT AND HPND-sell-variant AND SMLNJ AND MIT-open-group AND X11 | 1 |
| MIT AND HPND-sell-variant AND ICU | 1 |
| MIT AND GPL-3.0-or-later WITH Bison-exception-2.2 AND LGPL-2.1-only AND BSD-4-Clause-UC | 1 |
| MIT AND GPL-3.0-or-later | 1 |
| MIT AND GPL-2.0-or-later AND BSD-2-Clause AND LGPL-2.0-or-later | 1 |
| MIT AND GPL-2.0-or-later | 1 |
| MIT and GPL-2.0-only and BSD-2-Clause | 1 |
| MIT AND FTL | 1 |
| MIT AND CC-PDDC AND (GPL-3.0-or-later WITH Texinfo-exception) | 1 |
| MIT AND CC-BY-4.0 AND ISC AND BSD-2-Clause | 1 |
| MIT AND CC0-1.0 AND BSD-3-Clause | 1 |
| MIT AND BSD-3-Clause | 1 |
| MIT AND BSD-2-Clause AND BSD-3-Clause AND CC0-1.0 AND GPL-2.0-only AND LGPL-2.0-or-later | 1 |
| MIT and BSD | 1 |
| MIT AND Bitstream-Vera | 1 |
| MIT AND (Apache-2.0 OR MIT) AND (Unlicense OR MIT) AND (Zlib OR Apache-2.0 OR MIT) | 1 |
| MIT AND (Apache-2.0 OR MIT) AND (Unlicense OR MIT) | 1 |
| lsof | 1 |
| LicenseRef-Fedora-UltraPermissive | 1 |
| LicenseRef-Fedora-Public-Domain OR MIT | 1 |
| LicenseRef-Fedora-Public-Domain AND MIT AND metamail | 1 |
| LicenseRef-Fedora-Logos | 1 |
| LicenseRef-docbook-dtds | 1 |
| LicenseRef-DMIT | 1 |
| LicenseRef-Callaway-Python AND CNRI-Python | 1 |
| LicenseRef-Callaway-LGPLv2 AND LGPL-3.0-only | 1 |
| LicenseRef-Callaway-GFDL | 1 |
| LicenseRef-Callaway-BSD AND GPL-2.0-only | 1 |
| LicenseRef-BSD-3-Clause-Clear-WITH-AdditionRef-AOMPL-1.0 AND MIT AND ISC AND LicenseRef-Fedora-Public-Domain AND BSD-2-Clause | 1 |
| libtiff | 1 |
| LGPL-3.0-or-later OR MPL-2.0 | 1 |
| (LGPL-3.0-or-later OR GPL-2.0-or-later OR (LGPL-3.0-or-later AND GPL-2.0-or-later)) AND GFDL-1.3-invariants-or-later | 1 |
| LGPL-3.0-or-later OR GPL-2.0-or-later | 1 |
| ( LGPL-3.0-or-later OR BSD-3-Clause ) AND ( LGPL-3.0-or-later OR CC-BY-SA-3.0 ) | 1 |
| LGPL-3.0-or-later and MIT | 1 |
| LGPL-3.0-or-later AND FSFAP | 1 |
| LGPL-3.0-only AND LGPL-2.1-only AND CC0-1.0 | 1 |
| LGPL-2.1-or-later WITH cryptsetup-OpenSSL-exception | 1 |
| LGPL-2.1-or-later OR MPL-2.0 OR GPL-2.0-or-later | 1 |
| ( LGPL-2.1-or-later OR MPL-2.0 ) AND BSD-3-Clause | 1 |
| LGPL-2.1-or-later OR MPL-1.1 | 1 |
| LGPL-2.1-or-later AND Unicode-DFS-2016 | 1 |
| LGPL-2.1-or-later AND NIST-PD | 1 |
| LGPL-2.1-or-later and MIT | 1 |
| LGPL-2.1-or-later AND LicenseRef-Fedora-Public-Domain AND GPL-3.0-or-later AND LGPL-2.0-or-later AND FSFAP | 1 |
| LGPL-2.1-or-later AND LGPL-3.0-or-later AND CC-BY-SA-4.0 | 1 |
| LGPL-2.1-or-later AND LGPL-3.0-or-later | 1 |
| LGPL-2.1-or-later AND LGPL-2.1-only AND CCO-1.0 AND BSD-3-Clause AND LGPL-3.0-only | 1 |
| LGPL-2.1-or-later AND LGPL-2.1-only AND BSD-2-Clause | 1 |
| LGPL-2.1-or-later AND LGPL-2.0-or-later | 1 |
| LGPL-2.1-or-later AND GPL-2.0-or-later WITH Bison-exception-2.2 AND BSD-3-clause | 1 |
| LGPL-2.1-or-later AND GPL-2.0-or-later AND IJG-short AND BSD-2-Clause | 1 |
| LGPL-2.1-or-later AND GPL-2.0-or-later AND GPL-1.0-or-later | 1 |
| LGPL-2.1-or-later AND GPL-2.0-or-later AND BSD-3-Clause | 1 |
| LGPL-2.1-or-later AND (GPL-2.0-only OR Apache-2.0) | 1 |
| LGPL-2.1-or-later AND GPL-2.0-only AND GPL-2.0-or-later | 1 |
| LGPL-2.1-or-later AND FSFULLRWD AND (LGPL-3.0-or-later OR CC-BY-SA-3.0) AND (MPL-1.1 OR GPL-2.0-or-later OR LGPL-2.1-or-later) AND GCR-docs | 1 |
| LGPL-2.1-or-later AND CC-BY-SA-3.0 | 1 |
| LGPL-2.1-or-later AND (BSD-3-Clause OR LGPL-2.1-or-later) AND FSFULLR AND GPL-2.0-or-later | 1 |
| LGPL-2.1-or-later AND BSD-3-Clause AND BSD-2-Clause AND LicenseRef-Fedora-Public-Domain | 1 |
| LGPL-2.1-or-later AND BSD-3-Clause AND BSD-2-Clause AND BSD-2-Clause-FreeBSD AND 0BSD AND CC0-1.0 AND LicenseRef-Fedora-Public-Domain | 1 |
| LGPL-2.1-or-later AND BSD-2-Clause | 1 |
| LGPL-2.1-or-later AND Apache-2.0 AND (GPL-2.0-or-later OR TGPPL-1.0) AND LicenseRef-Fedora-Public-Domain AND GCR-docs | 1 |
| LGPL-2.1-or-later AND Apache-2.0 AND BSD-3-Clause AND MIT AND MPL-2.0 AND Unicode-3.0 AND Unicode-DFS-2016 AND (0BSD OR MIT OR Apache-2.0) AND (Apache-2.0 OR MIT) AND (BSD-3-Clause OR Apache-2.0) AND (MIT OR Apache-2.0 OR Zlib) AND (Unlicense OR MIT) | 1 |
| LGPL-2.1-only OR MPL-2.0 | 1 |
| (LGPL-2.1-only OR MPL-1.1) AND BSD-2-Clause AND LGPL-2.1-only | 1 |
| LGPL-2.1-only OR BSD-2-Clause | 1 |
| LGPL-2.1-only AND MIT AND GPL-2.0-only AND BSD-3-Clause AND BSD-2-Clause | 1 |
| LGPL-2.1-only AND LicenseRef-Fedora-UltraPermissive AND MIT | 1 |
| LGPL-2.1-only AND LGPL-2.1-or-later AND GPL-2.0-only AND GPL-2.0-or-later | 1 |
| LGPL-2.1-only AND GPL-2.0-only | 1 |
| LGPL-2.1-only and GPL-2.0-only | 1 |
| LGPL-2.1-only AND CC-BY-3.0 | 1 |
| LGPL-2.1-only AND Apache-1.1 | 1 |
| LGPL-2.1 | 1 |
| LGPL-2.0-or-later AND MIT AND Zlib | 1 |
| LGPL-2.0-or-later AND MIT | 1 |
| LGPL-2.0-or-later AND (LGPL-3.0-only OR GPL-2.0-or-later) AND (LGPL-3.0-only OR GPL-2.0-only OR GPL-3.0-only) | 1 |
| LGPL-2.0-or-later AND LGPL-2.1-or-later AND LGPL-3.0-or-later AND CC-BY-SA-4.0 | 1 |
| LGPL-2.0-or-later AND LGPL-2.1-or-later AND LGPL-2.1-only AND FSFULLR AND LicenseRef-Fedora-UltraPermissive | 1 |
| LGPL-2.0-or-later AND LGPL-2.1-or-later AND GPL-2.0-or-later AND GPL-3.0-or-later | 1 |
| LGPL-2.0-or-later AND LGPL-2.1-or-later AND CC0-1.0 | 1 |
| LGPL-2.0-or-later AND LGPL-2.1-or-later AND Apache-2.0 AND CC0-1.0 AND MIT AND MIT-open-group AND HPND-sell-variant AND GPL-2.0-or-later AND GPL-3.0-or-later AND OFL-1.1 | 1 |
| LGPL-2.0-or-later and GPL-3.0-or-later | 1 |
| LGPL-2.0-or-later AND GPL-2.0-or-later AND LicenseRef-Fedora-Public-Domain | 1 |
| LGPL-2.0-or-later AND GPL-2.0-only AND GPL-3.0-only AND LGPL-2.1-only AND LGPL-3.0-only AND (GPL-2.0-only OR GPL-3.0-only) AND (LGPL-2.1-only OR LGPL-3.0-only) AND CC0-1.0 | 1 |
| LGPL-2.0-or-later AND BSD-3-Clause AND GPL-2.0-or-later AND Apache-2.0 AND (LGPL-2.0-or-later AND BSD-3-Clause) AND (MIT WITH fmt-exception) AND NCL AND MIT AND LicenseRef-Fedora-Public-Domain | 1 |
| LGPL-2.0-or-later AND BSD-2-Clause | 1 |
| LGPL-2.0-or-later AND Apache-2.0 AND BSD-3-Clause AND BSL-1.0 AND MIT AND Unicode-3.0 AND Unicode-DFS-2016 AND (Apache-2.0 OR MIT) AND (Unlicense OR MIT) | 1 |
| LGPL-2.0-or-later AND Apache-2.0 | 1 |
| LGPL-2.0-only OR LGPL-3.0-only | 1 |
| LGPL-2.0-only | 1 |
| Leptonica | 1 |
| JasPer-2.0 | 1 |
| ISC AND LicenseRef-Fedora-Public-Domain | 1 |
| ISC AND BSD-3-Clause | 1 |
| ISC AND BSD-2-Clause AND CC0-1.0 | 1 |
| ISC AND BSD-2-Clause AND BSD-3-Clause AND BSD-4-Clause-UC | 1 |
| IJG AND MIT AND LGPL-2.1-or-later AND (GPL-2.0-only OR GPL-3.0-only) | 1 |
| HPND-DEC AND MIT-open-group | 1 |
| HPND AND MIT | 1 |
| HPND AND LicenseRef-Fedora-Public-Domain AND Unicode-DFS-2016 | 1 |
| HPND AND HPND-sell-variant AND X11 AND X11-distribute-modifications-variant AND MIT AND MIT-open-group AND xkeyboard-config-Zinoviev | 1 |
| hdparm | 1 |
| GPL-3.0-or-later AND MIT AND CC-BY-4.0 AND CC0-1.0 | 1 |
| GPL-3.0-or-later AND MIT | 1 |
| GPL-3.0-or-later AND LicenseRef-OASIS AND LicenseRef-WS-Addressing AND LicenseRef-Discovery AND W3C | 1 |
| GPL-3.0-or-later AND LGPL-3.0-or-later AND MIT AND CC-BY-4.0 AND CC0-1.0 AND GFDL-1.2-or-later | 1 |
| GPL-3.0-or-later AND LGPL-3.0-or-later AND LGPL-2.1-or-later AND GPL-2.0-or-later AND LGPL-2.0-or-later AND GFDL-1.3-no-invariants-or-later | 1 |
| GPL-3.0-or-later AND LGPL-2.1-or-later AND (LGPL-3.0-or-later OR GPL-2.0-or-later) | 1 |
| GPL-3.0-or-later AND LGPL-2.1-or-later AND LGPL-3.0-or-later | 1 |
| GPL-3.0-or-later and LGPL-2.0-or-later and GFDL-1.2-or-later | 1 |
| GPL-3.0-or-later AND LGPL-2.0-or-later | 1 |
| GPL-3.0-or-later and LGPL-2.0-or-later | 1 |
| GPL-3.0-or-later AND (GPL-3.0-or-later WITH Bison-exception-2.2) AND (LGPL-2.0-or-later WITH GCC-exception-2.0) AND BSD-3-Clause AND GFDL-1.3-or-later AND GPL-2.0-or-later AND LGPL-2.1-or-later AND LGPL-2.0-or-later | 1 |
| GPL-3.0-or-later AND (GPL-2.0-or-later OR LGPL-3.0-or-later) AND GFDL-1.3-no-invariants-or-later | 1 |
| GPL-3.0-or-later AND (GPL-2.0-or-later OR LGPL-3.0-or-later) | 1 |
| GPL-3.0-or-later AND GPL-2.0-or-later AND GFDL-1.3-no-invariants-or-later | 1 |
| GPL-3.0-or-later AND GFDL-1.3-or-later AND BSD-4-Clause-UC AND MIT AND X11 AND LicenseRef-Fedora-Public-Domain | 1 |
| GPL-3.0-or-later AND GFDL-1.3-only | 1 |
| GPL-3.0-or-later AND GFDL-1.3-no-invariants-or-later | 1 |
| GPL-3.0-or-later AND GFDL-1.1-or-later AND LicenseRef-Fedora-Public-Domain AND GPL-2.0-only AND GPL-3.0-only AND GPL-3.0-or-later WITH Bison-exception-2.2 | 1 |
| GPL-3.0-or-later AND BSD-2-Clause AND LGPL-2.1-or-later | 1 |
| GPL-3.0-or-later AND Apache-2.0 AND GPL-2.0-only AND LGPL-3.0-or-later AND (LGPL-3.0-only OR GPL-3.0-only) AND LAL-1.3 | 1 |
| GPL-3.0-or-later AND Apache-2.0 | 1 |
| GPL-3.0-only OR GPL-2.0-only | 1 |
| GPL-3.0-only OR BSD-3-Clause | 1 |
| (GPL-3.0-only OR BSD-2-Clause) AND GPL-2.0-or-later | 1 |
| GPL-3.0-only AND MIT | 1 |
| GPL-3.0-only AND LGPL-2.1-or-later AND Zlib AND (MIT AND CC0-1.0) AND BSD-2-Clause AND CC0-1.0 AND MIT | 1 |
| GPL-3.0-only AND GPL-3.0-or-later AND Apache-2.0 AND BSD-2-Clause AND Unicode-DFS-2016 AND CC-BY-SA-3.0 | 1 |
| GPL-3.0-only AND (GPL-3.0-only OR CDDL-1.0) | 1 |
| GPL-3.0-only AND BSD-3-Clause AND MIT AND GPL-2.0-only AND LGPL-2.1-only AND CC0-1.0 AND LGPL-3.0-only | 1 |
| GPL-3.0-only AND (0BSD OR MIT OR Apache-2.0) AND Apache-2.0 AND (Apache-2.0 OR MIT) AND (Apache-2.0 WITH LLVM-exception OR Apache-2.0 OR MIT) AND BSD-3-Clause AND MIT AND (MIT OR Apache-2.0) AND (MIT OR Zlib OR Apache-2.0) AND (Unlicense OR MIT) AND (Zlib OR Apache-2.0 OR MIT) | 1 |
| GPL-2.0-or-later WITH Autoconf-exception-generic | 1 |
| GPL-2.0-or-later OR LicenseRef-Callaway-LGPLv2+ OR Apache-2.0 | 1 |
| (GPL-2.0-or-later OR LGPL-3.0-or-later) AND GPL-3.0-or-later | 1 |
| GPL-2.0-or-later OR LGPL-2.1-or-later OR MPL-1.1 | 1 |
| GPL-2.0-or-later OR LGPL-2.1-or-later | 1 |
| (GPL-2.0-or-later or GPL-3.0-or-later) and GPL-2.0-or-later and GPL-3.0-or-later and (LGPL-2.0-or-later or LGPL-3.0-or-later) and (LGPL-2.1-or-later or LGPL-3.0-or-later) and LGPL-2.1-or-later and BSD-2-Clause and CC0-1.0 | 1 |
| GPL-2.0-or-later OR Artistic-1.0-Perl | 1 |
| GPL-2.0-or-later AND NIST-PD | 1 |
| GPL-2.0-or-later AND MIT AND CC0-1.0 | 1 |
| GPL-2.0-or-later AND MIT | 1 |
| GPL-2.0-or-later AND Linux-man-pages-copyleft-var AND Linux-man-pages-copyleft AND MIT | 1 |
| GPL-2.0-or-later AND LicenseRef-Fedora-Firmware | 1 |
| GPL-2.0-or-later AND LGPL-3.0-only | 1 |
| GPL-2.0-or-later AND LGPL-2.1-or-later AND (GPL-2.0-only OR GPL-3.0-only) AND LicenseRef-Fedora-Public-Domain | 1 |
| GPL-2.0-or-later AND LGPL-2.1-or-later AND GPL-2.0-only | 1 |
| GPL-2.0-or-later AND LGPL-2.1-only | 1 |
| GPL-2.0-or-later AND LGPL-2.0-or-later AND LGPL-2.1-or-later AND BSD-2-Clause AND MIT | 1 |
| GPL-2.0-or-later AND LGPL-2.0-or-later AND LGPL-2.1-or-later AND BSD-2-Clause | 1 |
| GPL-2.0-or-later AND LGPL-2.0-or-later AND LGPL-2.1-or-later | 1 |
| GPL-2.0-or-later AND LGPL-2.0-only AND MIT | 1 |
| GPL-2.0-or-later AND LGPL-2.0-only | 1 |
| GPL-2.0-or-later AND IJG AND LGPL-2.1-or-later AND MIT AND (GPL-2.0-only OR GPL-3.0-only) | 1 |
| GPL-2.0-or-later AND GPL-3.0-or-later | 1 |
| GPL-2.0-or-later AND GPL-2.0-only | 1 |
| GPL-2.0-or-later AND GPL-1.0-or-later | 1 |
| GPL-2.0-or-later AND GFDL-1.1-or-later | 1 |
| GPL-2.0-or-later AND CC0-1.0 AND LGPL-2.1-or-later | 1 |
| GPL-2.0-or-later AND BSD-2-Clause | 1 |
| GPL-2.0-or-later and BSD-2-Clause | 1 |
| gpl-2.0-or-later | 1 |
| (GPL-2.0-only WITH Linux-syscall-note OR MIT) AND (LGPL-2.0-or-later OR MIT) | 1 |
| GPL-2.0-only WITH Font-exception-2.0 | 1 |
| (GPL-2.0-only or GPL-3.0-only) and LGPL-2.0-or-later and BSD-3-Clause | 1 |
| (GPL-2.0-only or GPL-3.0-only) and BSD-3-Clause and CC0-1.0 and FSFAP | 1 |
| (GPL-2.0-only OR GPL-3.0-only) AND BSD-3-Clause | 1 |
| GPL-2.0-only OR BSD-3-Clause | 1 |
| GPL-2.0-only AND (MPL-1.1 OR GPL-2.0-or-later OR LGPL-2.1-or-later) | 1 |
| GPL-2.0-only AND LGPL-2.1-or-later | 1 |
| GPL-2.0-only AND LGPL-2.0-only | 1 |
| GPL-2.0-only AND GPL-3.0-only AND LGPL-2.1-only AND LGPL-3.0-only AND (GPL-2.0-only OR GPL-3.0-only) AND (LGPL-2.1-only OR LGPL-3.0-only) | 1 |
| GPL-2.0-only AND GPL-3.0-only | 1 |
| GPL-2.0-only AND GPL-2.0-or-later AND LGPL-2.0-or-later AND CC-BY-SA-3.0 AND CC-BY-3.0 AND CC-BY-4.0 | 1 |
| GPL-2.0-only AND GPL-2.0-or-later AND LGPL-2.0-or-later | 1 |
| GPL-2.0-only AND GPL-2.0-or-later AND LGPL-2.0-only AND LGPL-2.0-or-later AND LGPL-2.1-or-later AND LGPL-3.0-or-later AND BSD-3-Clause AND IJG-short AND (MIT OR Unlicense) | 1 |
| GPL-2.0-only AND GPL-2.0-or-later AND BSD-2-Clause AND BSD-3-Clause AND BSD-4-Clause-UC AND LicenseRef-Fedora-Public-Domain | 1 |
| (GPL-1.0-or-later OR Artistic-1.0-Perl) AND X11 | 1 |
| (GPL-1.0-or-later OR Artistic-1.0-Perl) AND MPL-2.0 | 1 |
| (GPL-1.0-or-later OR Artistic-1.0-Perl) AND metamail | 1 |
| (GPL-1.0-or-later OR Artistic-1.0-Perl) AND Martin-Birgmeier AND Spencer-86 AND MIT AND Unicode-3.0 AND LicenseRef-Fedora-Public-Domain | 1 |
| (GPL-1.0-or-later OR Artistic-1.0-Perl) AND FSFAP | 1 |
| ( GPL-1.0-or-later OR Artistic-1.0-Perl ) AND BSD-3-Clause | 1 |
| (GPL-1.0-or-later OR Artistic-1.0-Perl) AND Artistic-2.0 | 1 |
| GPL-1.0-or-later AND LGPL-2.1-or-later | 1 |
| GPL-1.0-or-later AND GPL-2.0-only AND GPL-2.0-or-later AND GPL-3.0-or-later AND LGPL-2.1-or-later AND BSD-2-Clause AND BSD-3-Clause AND BSD-4-Clause-UC AND LicenseRef-Fedora-Public-Domain | 1 |
| GFDL-1.2-only | 1 |
| GFDL-1.1-or-later | 1 |
| GD | 1 |
| (FTL OR GPL-2.0-or-later) AND BSD-3-Clause AND MIT AND MIT-Modern-Variant AND LicenseRef-Fedora-Public-Domain AND Zlib | 1 |
| FDK-AAC | 1 |
| epl-1.0 AND cpl-1.0 AND bsd-3-clause AND mit AND gpl-3.0-or-later WITH bison-exception-2.2 AND apache-1.1 AND lgpl-2.0-or-later WITH libtool-exception AND smlnj AND hpnd-uc | 1 |
| CFITSIO | 1 |
| CC-PDDC | 1 |
| CC-BY-4.0 | 1 |
| CC0-1.0 OR Apache-2.0 | 1 |
| CC0-1.0 OR Apache-1.0 OR Apache-2.0 | 1 |
| CC0-1.0, GPL-2.0-only AND GPL-2.0-or-later AND GPL-3.0-only AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-3.0-only AND (GPL-2.0-only OR GPL-3.0-only) AND (LGPL-2.1-only OR LGPL-3.0-only) | 1 |
| CC0-1.0 AND LGPL-3.0-or-later | 1 |
| CC0-1.0 AND LGPL-2.1-or-later | 1 |
| CC0-1.0 AND LGPL-2.1-only AND LGPL-3.0-only AND (LGPL-2.1-only OR LGPL-3.0-only) | 1 |
| CC0-1.0 AND LGPL-2.1-only AND LGPL-3.0-only | 1 |
| CC0-1.0 AND LGPL-2.1-only AND LGPL-2.1-or-later AND LGPL-3.0-only AND MIT | 1 |
| CC0-1.0 AND LGPL-2.1-only AND LGPL-2.1-or-later AND LGPL-3.0-only AND (LGPL-2.1-only OR LGPL-3.0-only) AND MIT | 1 |
| CC0-1.0 AND LGPL-2.1-only AND LGPL-2.1-or-later AND LGPL-3.0-only | 1 |
| CC0-1.0 AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-3.0-only | 1 |
| CC0-1.0 AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-2.1-or-later AND LGPL-3.0-only | 1 |
| CC0-1.0 AND LGPL-2.0-only AND LGPL-2.0-or-later AND LGPL-3.0-only AND LicenseRef-KDE-Accepted-LGPL | 1 |
| CC0-1.0 AND LGPL-2.0-only AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-3.0-only AND (LGPL-2.1-only OR LGPL-3.0-only) | 1 |
| CC0-1.0 AND LGPL-2.0-only | 1 |
| CC0-1.0 AND GPL-2.0-or-later AND LGPL-2.0-or-later AND LGPL-2.1-or-later | 1 |
| CC0-1.0 AND GPL-2.0-or-later AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-3.0-only AND (LGPL-2.1-only OR LGPL-3.0-only) AND MIT | 1 |
| CC0-1.0 and GPL-2.0-or-later AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-3.0-only AND (GPL-2.0-only OR GPL-3.0-only) AND (LGPL-2.1-only OR LGPL-3.0-only) | 1 |
| CC0-1.0 AND GPL-2.0-or-later AND LGPL-2.0-only AND LGPL-2.0-or-later AND LGPL-3.0-only AND (LGPL-2.1-only OR LGPL-3.0-only) | 1 |
| CC0-1.0 AND GPL-2.0-or-later AND LGPL-2.0-only AND LGPL-2.0-or-later AND LGPL-2.1-or-later AND MIT AND MPL-1.1 | 1 |
| CC0-1.0 AND GPL-2.0-or-later AND LGPL-2.0-only AND LGPL-2.0-or-later AND LGPL-2.1-or-later AND LGPL-3.0-only AND (LGPL-2.1-only OR LGPL-3.0-only) | 1 |
| CC0-1.0 AND GPL-2.0-or-later AND LGPL-2.0-only AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-3.0-only AND (LGPL-2.1-only OR LGPL-3.0-only) AND MIT | 1 |
| CC0-1.0 AND GPL-2.0-or-later AND LGPL-2.0-only AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-3.0-only AND (LGPL-2.1-only OR LGPL-3.0-only) | 1 |
| CC0-1.0 AND GPL-2.0-or-later AND LGPL-2.0-only AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-2.1-or-later AND LGPL-3.0-only AND LGPL-3.0-or-later AND (LGPL-2.1-only OR LGPL-3.0-only) | 1 |
| CC0-1.0 AND GPL-2.0-or-later AND GPL-3.0-or-later AND MIT | 1 |
| CC0-1.0 AND GPL-2.0-or-later | 1 |
| CC0-1.0 AND GPL-2.0-only AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-3.0-only AND (LGPL-2.1-only OR LGPL-3.0-only) | 1 |
| CC0-1.0 AND GPL-2.0-only AND GPL-3.0-only AND LGPL-2.1-only AND LGPL-3.0-only AND (GPL-2.0-only OR GPL-3.0-only) AND (LGPL-2.1-only OR LGPL-3.0-only) | 1 |
| CC0-1.0 AND GPL-2.0-only AND GPL-3.0-only AND LGPL-2.0-or-later AND LGPL-2.1-or-later AND (GPL-2.0-only OR GPL-3.0-only) AND MIT | 1 |
| CC0-1.0 AND GPL-2.0-only AND GPL-3.0-only AND LGPL-2.0-only AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-3.0-only AND (GPL-2.0-only OR GPL-3.0-only) AND (LGPL-2.1-only OR LGPL-3.0-only) | 1 |
| CC0-1.0 AND GPL-2.0-only AND GPL-2.0-or-later AND GPL-3.0-only AND LGPL-2.0-or-later AND LGPL-2.1-or-later AND LGPL-3.0-only AND LicenseRef-KFQF-Accepted-GPL | 1 |
| CC0-1.0 AND GPL-2.0-only AND GPL-2.0-or-later AND GPL-3.0-only AND LGPL-2.0-or-later AND (GPL-2.0-only OR GPL-3.0-only) | 1 |
| CC0-1.0 AND GPL-2.0-only AND GPL-2.0-or-later AND GPL-3.0-only AND LGPL-2.0-or-later | 1 |
| CC0-1.0 AND GPL-2.0-only AND GPL-2.0-or-later | 1 |
| CC0-1.0 AND BSD-2-Clause AND CC-BY-SA-4.0 | 1 |
| BSL-1.0 AND LicenseRef-Callaway-BSD AND CC0-1.0 AND GPL-3.0-only AND LicenseRef-Callaway-LGPLv2 AND LicenseRef-Callaway-LGPLv2+ AND LGPL-3.0-or-later AND LicenseRef-Callaway-Public-Domain | 1 |
| BSL-1.0 AND (BSL-1.0 OR Apache-2.0 WITH LLVM-exception) | 1 |
| BSD-4-Clause-UC AND GPL-2.0-or-later | 1 |
| BSD-3-Clause WITH AdditionRef-OpenEXR-Additional-IP-Rights-Grant OR Apache-2.0 | 1 |
| BSD-3-Clause OR GPL-2.0-or-later | 1 |
| BSD-3-Clause-Modification AND MIT | 1 |
| BSD-3-Clause-Modification AND ClArtistic | 1 |
| bsd-3-clause AND zlib AND licenseref-fedora-public-domain AND bsd-attribution-hpnd-disclaimer AND bsd-4.3tahoe AND bsd-4-clause-uc AND apache-2.0 AND lgpl-2.0-or-later AND (gpl-2.0-or-later OR bsd-2-clause OR bsd-3-clause OR bsd-4-clause) AND gpl-2.0-or-later AND xlock AND gpl-1.0-or-later AND mackerras-3-clause-acknowledgment AND mackerras-3-clause AND hpnd-fenneberg-Livingston AND sun-ppp AND hpnd-inria-imag AND sun-ppp-2000 | 1 |
| BSD-3-clause AND TU-Berlin-1.0 | 1 |
| BSD-3-Clause AND MIT-open-group AND Zlib AND Apache-2.0 | 1 |
| BSD-3-Clause AND MIT AND BSL-1.0 AND Unlicense AND Zlib | 1 |
| BSD-3-Clause AND MIT | 1 |
| BSD-3-Clause AND LGPL-2.1-or-later | 1 |
| BSD-3-Clause AND LGPL-2.0-or-later AND LGPL-3.0-or-later | 1 |
| BSD-3-Clause AND ISC AND LicenseRef-Fedora-Public-Domain | 1 |
| BSD-3-Clause AND GPL-2.0-or-later AND LGPL-2.1-or-later | 1 |
| BSD-3-Clause AND GPL-2.0-or-later AND GFDL-1.3-or-later | 1 |
| BSD-3-Clause AND GFDL-1.3-no-invariants-only AND GPL-3.0-only WITH Qt-GPL-exception-1.0 | 1 |
| BSD-3-Clause AND GFDL-1.3-no-invariants-only AND GPL-3.0-only | 1 |
| BSD-3-Clause and (CDDL-1.0 or LGPL-2.1-only) | 1 |
| BSD-3-Clause AND CC0-1.0 AND MIT | 1 |
| BSD-3-Clause AND CC0-1.0 AND LGPL-3.0-or-later AND MIT | 1 |
| BSD-3-Clause AND CC0-1.0 AND LGPL-3.0-or-later | 1 |
| BSD-3-Clause AND CC0-1.0 AND LGPL-2.1-or-later | 1 |
| BSD-3-Clause AND CC0-1.0 AND LGPL-2.1-only AND LGPL-3.0-only AND (LGPL-2.1-only OR LGPL-3.0-only) AND MIT AND MIT-CMU | 1 |
| BSD-3-Clause AND CC0-1.0 AND LGPL-2.1-only AND LGPL-2.1-or-later AND LGPL-3.0-only AND MIT-CMU AND MIT | 1 |
| BSD-3-Clause AND CC0-1.0 AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-3.0-only AND (LGPL-2.1-only OR LGPL-3.0-only) AND ODbl-1.0 | 1 |
| BSD-3-Clause AND CC0-1.0 AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-2.1-or-later AND LGPL-3.0-only AND (LGPL-2.1-only OR LGPL-3.0-only) AND ODbL-1.0 | 1 |
| BSD-3-Clause AND CC0-1.0 AND LGPL-2.0-or-later | 1 |
| BSD-3-Clause AND CC0-1.0 AND LGPL-2.0-only AND LGPL-2.1-only AND LGPL-3.0-only AND (LGPL-2.1-only OR LGPL-3.0-only) | 1 |
| BSD-3-Clause AND CC0-1.0 AND GPL-2.0-or-later AND LGPL-2.0-only AND LGPL-2.0-or-later AND LGPL-2.1-or-later AND MIT AND MPL-1.1 | 1 |
| BSD-3-Clause AND CC0-1.0 AND GPL-2.0-or-later AND LGPL-2.0-only AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-2.1-or-later AND LGPL-3.0-only AND LGPL-3.0-or-later | 1 |
| BSD-3-Clause AND CC0-1.0 AND GPL-2.0-only AND GPL-3.0-only AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-3.0-only AND LGPL-3.0-or-later AND (GPL-2.0-only OR GPL-3.0-only) AND (LGPL-2.1-only OR LGPL-3.0-only) | 1 |
| BSD-3-Clause AND CC0-1.0 AND GPL-2.0-only AND GPL-3.0-only AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-3.0-only AND (GPL-2.0-only OR GPL-3.0-only) AND (LGPL-2.1-only OR LGPL-3.0-only) | 1 |
| BSD-3-Clause AND CC0-1.0 AND GPL-2.0-only AND GPL-3.0-only AND (GPL-2.0-only OR GPL-3.0-only) | 1 |
| BSD-3-Clause AND CC0-1.0 AND GPL-2.0-only AND GPL-2.0-or-later AND GPL-3.0-only AND LGPL-2.1-only AND LGPL-3.0-only AND (GPL-2.0-only OR GPL-3.0-only) AND (LGPL-2.1-only OR LGPL-3.0-only) | 1 |
| BSD-3-Clause AND CC0-1.0 AND GPL-2.0-only AND GPL-2.0-or-later AND GPL-3.0-only AND LGPL-2.1-only AND LGPL-3.0-only | 1 |
| BSD-3-Clause AND CC0-1.0 AND GPL-2.0-only AND GPL-2.0-or-later AND GPL-3.0-only AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-2.1-or-later AND LGPL-3.0-only AND (GPL-2.0-only OR GPL-3.0-only) AND (LGPL-2.1-only OR LGPL-3.0-only) AND Qt-LGPL-exception-1.1 | 1 |
| BSD-3-Clause AND CC0-1.0 AND GPL-2.0-only AND GPL-2.0-or-later AND GPL-3.0-only AND LGPL-2.0-only AND LGPL-2.1-only AND LGPL-2.1-or-later AND LGPL-3.0-only AND (GPL-2.0-only OR GPL-3.0-only) AND (LGPL-2.1-only OR LGPL-3.0-only) | 1 |
| BSD-3-Clause AND CC0-1.0 AND GPL-2.0-only AND GPL-2.0-or-later AND GPL-3.0-only AND LGPL-2.0-only AND LGPL-2.0-or-later AND LGPL-2.1-or-later AND MIT | 1 |
| BSD-3-Clause AND CC0-1.0 AND GPL-2.0-only AND GPL-2.0-or-later AND GPL-3.0-only AND GPL-3.0-or-later AND LGPL-2.0-only AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-2.1-or-later AND LGPL-3.0-only AND LGPL-3.0-or-later AND (GPL-2.0-only OR GPL-3.0-only) AND (LGPL-2.1-only OR LGPL-3.0-only) AND MIT AND Unicode-3.0 AND (Apache-2.0 OR MIT) AND (Apache-2.0 WITH LLVM-exception OR Apache-2.0 OR MIT) AND (BSD-3-Clause OR MIT OR Apache-2.0) | 1 |
| BSD-3-Clause AND CC0-1.0 AND FSFAP AND GPL-2.0-or-later AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-2.1-or-later AND LGPL-3.0-only AND (LGPL-2.1-only OR LGPL-3.0-only) AND MIT | 1 |
| BSD-3-Clause AND CC0-1.0 AND FSFAP AND GPL-2.0-only AND GPL-3.0-only AND LGPL-3.0-only AND (GPL-2.0-only OR GPL-3.0-only) AND (LGPL-2.1-only OR LGPL-3.0-only) | 1 |
| BSD-3-Clause and CC0-1.0 and FSFAP and GPL-2.0-only and GPL-3.0-only | 1 |
| BSD-3-Clause AND BSD-4-Clause AND APSL-2.0 AND NCSA AND MIT | 1 |
| BSD-3-Clause AND (BSD-3-Clause OR GPL-2.0-only) AND GPL-2.0-or-later AND LGPL-2.1-or-later AND LGPL-2.0-or-later AND MIT-Modern-Variant | 1 |
| BSD-3-Clause AND BSD-2-Clause AND LicenseRef-Fedora-Public-Domain | 1 |
| BSD-3-Clause AND BSD-2-Clause AND ISC | 1 |
| BSD-3-Clause AND BSD-2-Clause | 1 |
| BSD-3-Clause AND Apache-2.0 AND Zlib | 1 |
| BSD-3-Clause AND Apache-2.0 | 1 |
| BSD-2-Clause-Views | 1 |
| BSD-2-Clause-Patent | 1 |
| BSD-2-Clause OR GPL-2.0-or-later | 1 |
| BSD-2-Clause OR Apache-2.0 | 1 |
| BSD-2-Clause and LGPL-2.1-or-later | 1 |
| BSD-2-Clause AND ISC AND MIT AND LicenseRef-BSD-2-Clause-WITH-AdditionRef-AOMPL-1.0 AND (Apache-2.0 OR MIT) AND (Apache-2.0 WITH LLVM-exception OR Apache-2.0 OR MIT) AND (Unlicense OR MIT) | 1 |
| BSD-2-Clause AND ISC | 1 |
| BSD-2-Clause and ISC | 1 |
| BSD-2-Clause AND IJG AND Apache-2.0 AND BSD-3-Clause | 1 |
| BSD-2-Clause AND GPL-2.0-or-later AND MIT | 1 |
| BSD-2-Clause AND FSFULLR AND GPL-2.0-or-later WITH Libtool-exception AND BSD-3-Clause AND FSFUL | 1 |
| BSD-2-Clause AND CC-BY-SA-4.0 AND CC0-1.0 AND GPL-2.0-only AND GPL-2.0-or-later AND GPL-3.0-only AND LGPL-2.0-only AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-2.1-or-later AND LGPL-3.0-only AND (GPL-2.0-only OR GPL-3.0-only) AND (LGPL-2.1-only OR LGPL-3.0-only) AND LicenseRef-KFQF-Accepted-GPL | 1 |
| BSD-2-Clause AND CC0-1.0 AND LGPL-2.1-only AND LGPL-3.0-only AND MIT | 1 |
| BSD-2-Clause and CC0-1.0 and LGPL-2.0-or-later and LGPL-2.1-only and LGPL-3.0-only and (LGPL-2.1-only OR LGPL-3.0-only) | 1 |
| BSD-2-Clause AND CC0-1.0 AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-2.1-or-later AND LGPL-3.0-only AND (LGPL-2.1-only OR LGPL-3.0-only) | 1 |
| BSD-2-Clause AND CC0-1.0 AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-2.1-or-later AND LGPL-3.0-only | 1 |
| BSD-2-Clause AND CC0-1.0 AND LGPL-2.0-or-later | 1 |
| BSD-2-Clause AND CC0-1.0 AND LGPL-2.0-only AND LGPL-2.0-or-later AND MIT | 1 |
| BSD-2-Clause AND CC0-1.0 AND LGPL-2.0-only AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-2.1-or-later AND LGPL-3.0-only AND (LGPL-2.1-only OR LGPL-3.0-only) | 1 |
| BSD-2-Clause AND CC0-1.0 AND GPL-3.0-or-later AND LGPL-2.0-or-later WITH Bison-exception-2.2 | 1 |
| BSD-2-Clause AND CC0-1.0 AND GPL-2.0-or-later AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-3.0-only AND (LGPL-2.1-only OR LGPL-3.0-only) | 1 |
| BSD-2-Clause AND CC0-1.0 AND GPL-2.0-or-later AND LGPL-2.0-only AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-2.1-or-later AND LGPL-3.0-only AND (LGPL-2.1-only OR LGPL-3.0-only) | 1 |
| BSD-2-Clause AND CC0-1.0 AND GPL-2.0-only AND GPL-2.0-or-later AND GPL-3.0-only AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-3.0-only AND (GPL-2.0-only OR GPL-3.0-only) AND (LGPL-2.1-only OR LGPL-3.0-only) | 1 |
| BSD-2-Clause AND CC0-1.0 AND GPL-2.0-only AND GPL-2.0-or-later AND GPL-3.0-only AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-3.0-only | 1 |
| BSD-2-Clause AND CC0-1.0 AND GPL-2.0-only AND GPL-2.0-or-later AND GPL-3.0-only AND LGPL-2.0-only AND LGPL-2.1-or-later AND (GPL-2.0-only OR GPL-3.0-only) | 1 |
| BSD-2-Clause AND CC0-1.0 AND BSD-3-Clause AND LGPL-2.0-or-later | 1 |
| BSD-2-Clause and CC0-1.0 | 1 |
| BSD-2-Clause AND BSD-4-Clause-UC AND HPND-sell-variant AND MIT-open-group AND SMLNJ AND X11 | 1 |
| BSD-2-Clause AND BSD-3-Clause AND ISC AND Beerware AND LicenseRef-Fedora-Public-Domain | 1 |
| BSD-2-Clause AND BSD-3-Clause AND CC0-1.0 AND LGPL-2.0-only AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-3.0-only AND MIT | 1 |
| BSD-2-Clause AND BSD-3-Clause AND CC0-1.0 AND GPL-2.0-or-later AND MPL-1.1 AND LGPL-2.0-only AND LGPL-2.1-or-later AND LGPL-3.0-only AND LGPL-2.1-only WITH Qt-LGPL-exception-1.1 | 1 |
| BSD-2-Clause AND BSD-3-Clause AND CC0-1.0 AND GPL-2.0-or-later AND LGPL-2.0-only AND LGPL-2.0-or-later AND LGPL-3.0-only AND (LGPL-2.1-only OR LGPL-3.0-only) | 1 |
| BSD-2-Clause and BSD-3-Clause and CC0-1.0 and GPL-2.0-or-later | 1 |
| BSD-2-Clause AND BSD-3-Clause AND CC0-1.0 AND GPL-2.0-only AND GPL-3.0-only AND (GPL-2.0-only OR GPL-3.0-only) | 1 |
| BSD-2-Clause AND BSD-3-Clause AND CC0-1.0 AND GPL-2.0-only AND GPL-2.0-or-later AND GPL-3.0-only AND LGPL-2.1-only AND LGPL-3.0-only AND LGPL-3.0-or-later AND (GPL-2.0-only OR GPL-3.0-only) AND (LGPL-2.1-only OR LGPL-3.0-only) | 1 |
| BSD-2-Clause AND BSD-3-Clause AND CC0-1.0 AND GPL-2.0-only AND GPL-2.0-or-later AND GPL-3.0-only AND (GPL-2.0-only OR GPL-3.0-only) | 1 |
| BSD-2-Clause AND BSD-3-Clause AND CC0-1.0 AND FSFAP AND GPL-2.0-or-later AND GPL-2.1-or-later AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-3.0-only AND (LGPL-2.1-only OR LGPL-3.0-only) AND MIT AND LGPL-2.1-or-later | 1 |
| BSD-2-Clause AND BSD-3-Clause AND CC0-1.0 AND FSFAP AND GPL-2.0-only AND GPL-2.0-or-later AND GPL-3.0-only AND LGPL-2.1-or-later AND LGPL-3.0-only AND (GPL-2.0-only OR GPL-3.0-only) AND (LGPL-2.1-only OR LGPL-3.0-only) | 1 |
| BSD-2-Clause AND BSD-3-Clause AND BSD-4.3TAHOE AND BSD-4-Clause-UC AND GPL-1.0-or-later AND GPL-2.0-only AND GPL-2.0-or-later AND LicenseRef-Fedora-Public-Domain AND LicenseRef-Fedora-UltraPermissive AND Linux-man-pages-1-para AND Linux-man-pages-copyleft AND Linux-man-pages-copyleft-2-para AND Linux-man-pages-copyleft-var AND MIT AND Spencer-94 | 1 |
| BSD-2-Clause AND BSD-3-Clause AND BSD-1-Clause | 1 |
| Brian-Gladman-2-Clause AND BSD-2-Clause AND (BSD-2-Clause OR GPL-2.0-or-later) AND BSD-2-Clause-first-lines AND BSD-3-Clause AND BSD-4-Clause AND CMU-Mach-nodoc AND FSFULLRWD AND HPND AND HPND-export2-US AND HPND-export-US AND HPND-export-US-acknowledgement AND HPND-export-US-modify AND ISC AND MIT AND MIT-CMU AND OLDAP-2.8 AND OpenVision | 1 |
| blessing | 1 |
| Beerware AND BSD-2-Clause AND BSD-3-Clause AND ISC AND libutil-David-Nugent AND MIT AND LicenseRef-Fedora-Public-Domain | 1 |
| Artistic-2.0 | 1 |
| APSL-2.0 | 1 |
| (Apache-2.0 OR MIT) AND LGPL-2.1-or-later AND MIT AND (MIT OR Apache-2.0) AND Zlib | 1 |
| Apache-2.0 OR Artistic-2.0 | 1 |
| Apache-2.0 AND MIT AND Zlib | 1 |
| Apache-2.0 AND MIT | 1 |
| Apache-2.0 AND LicenseRef-Fedora-Public-Domain | 1 |
| Apache-2.0 AND LGPL-2.0-or-later AND LGPL-2.1-or-later AND (Apache-2.0 OR LGPL-2.1-or-later) | 1 |
| Apache-2.0 AND ISC AND MIT AND LicenseRef-Fedora-Public-Domain | 1 |
| Apache-2.0 AND GPL-3.0-or-later AND MIT | 1 |
| Apache-2.0 AND BSD-3-Clause WITH AdditionRef-WebM-patent-license AND BSD-3-Clause AND FSFULLRWD | 1 |
| (Apache-2.0 AND BSD-3-Clause) OR BSD-3-Clause | 1 |
| Apache-2.0 AND BSD-3-Clause AND MIT AND (Apache-2.0 OR BSL-1.0) AND (Apache-2.0 OR MIT) AND (Apache-2.0 WITH LLVM-exception OR Apache-2.0 OR MIT) AND (Unlicense OR MIT) | 1 |
| Apache-2.0 AND BSD-3-Clause AND MIT | 1 |
| Apache-2.0 AND BSD-2-Clause AND BSD-3-Clause AND MIT | 1 |
| Apache-2.0 AND BSD-2-Clause AND BSD-3-Clause AND ISC AND JSON AND MIT AND MPL-1.1 AND MPL-2.0 | 1 |
| Apache-2.0 AND BSD-2-Clause AND BSD-3-Clause AND GPL-3.0-only AND MIT AND OFL-1.1 | 1 |
| Apache-2.0 AND (Apache-2.0 WITH LLVM-exception) AND BSD-3-Clause AND MIT AND (Apache-2.0 OR BSL-1.0) AND (Apache-2.0 OR MIT) AND (Apache-2.0 WITH LLVM-exception OR Apache-2.0 OR MIT) AND (Unlicense OR MIT) | 1 |
| 0BSD AND GPL-2.0-or-later AND LicenseRef-Fedora-Public-Domain | 1 |
| 0BSD | 1 |

## Every package

| Package | Version | License |
|---|---|---|
| 7zip | 26.02-1.fc44 | LGPL-2.1-or-later AND BSD-3-Clause AND BSD-2-Clause AND LicenseRef-Fedora-Public-Domain |
| aardvark-dns | 1.17.1-1.fc44 | Apache-2.0 AND MIT AND Zlib |
| abattis-cantarell-fonts | 0.301-17.fc44 | OFL-1.1 |
| abattis-cantarell-vf-fonts | 0.301-17.fc44 | OFL-1.1 |
| abseil-cpp | 20260107.1-1.fc44 | Apache-2.0 AND LicenseRef-Fedora-Public-Domain |
| accounts-qml-module-qt6 | 0.7^20231216.05e79eb-8.fc44 | LGPL-2.1-only |
| accountsservice | 23.13.9-16.fc44 | GPL-3.0-or-later |
| accountsservice-libs | 23.13.9-16.fc44 | GPL-3.0-or-later |
| acl | 2.4.0-1.fc44 | GPL-2.0-or-later AND LGPL-2.1-or-later |
| adobe-mappings-cmap | 20231115-5.fc44 | BSD-3-Clause |
| adobe-mappings-cmap-deprecated | 20231115-5.fc44 | BSD-3-Clause |
| adobe-mappings-pdf | 20190401-12.fc44 | BSD-3-Clause |
| adwaita-cursor-theme | 50.0-1.fc44 | LGPL-3.0-only OR CC-BY-SA-3.0 |
| adwaita-icon-theme | 50.0-1.fc44 | LGPL-3.0-only OR CC-BY-SA-3.0 |
| adwaita-icon-theme-legacy | 46.2-7.fc44 | LGPL-3.0-only OR CC-BY-SA-3.0 |
| adwaita-mono-fonts | 50.0-1.fc44 | OFL-1.1 |
| adwaita-sans-fonts | 50.0-1.fc44 | OFL-1.1 |
| aha | 0.5.1-16.fc44 | MPL-1.1 OR LGPL-2.0-or-later |
| akonadi-server | 26.08.0-1.fc44 | BSD-3-Clause AND CC0-1.0 AND GPL-2.0-only AND GPL-2.0-or-later AND GPL-3.0-only AND LGPL-2.0-only AND LGPL-2.0-or-later AND LGPL-2.1-or-later AND MIT |
| alsa-lib | 1.2.16.1-1.fc44 | LGPL-2.1-or-later |
| alsa-sof-firmware | 2025.12.2-1.fc44 | BSD-3-Clause AND Apache-2.0 |
| alsa-ucm | 1.2.16.1-1.fc44 | BSD-3-Clause |
| alsa-utils | 1.2.16-1.fc44 | GPL-2.0-or-later |
| alternatives | 1.33-5.fc44 | GPL-2.0-only |
| amd-gpu-firmware | 20260810-1.fc44 | LicenseRef-Callaway-Redistributable-no-modification-permitted |
| amd-ucode-firmware | 20260810-1.fc44 | LicenseRef-Callaway-Redistributable-no-modification-permitted |
| anthy-unicode | 1.0.0.20260213-1.fc44 | LGPL-2.0-or-later AND GPL-2.0-or-later AND LicenseRef-Fedora-Public-Domain |
| antiword | 0.37-44.fc44 | GPL-2.0-or-later |
| appstream | 1.1.3-1.fc44 | GPL-2.0-or-later AND LGPL-2.1-or-later |
| appstream-qt | 1.1.3-1.fc44 | GPL-2.0-or-later AND LGPL-2.1-or-later |
| aribb24 | 1.0.3^20160216git5e9be27-5.fc44 | LGPL-3.0-only |
| ark | 26.08.0-1.fc44 | GPL-2.0-or-later AND LGPL-3.0-only |
| ark-libs | 26.08.0-1.fc44 | BSD-2-Clause AND GPL-2.0-or-later AND MIT |
| assimp | 6.0.5-2.fc44 | BSD-3-Clause AND MIT AND BSL-1.0 AND Unlicense AND Zlib |
| atheros-firmware | 20260810-1.fc44 | LicenseRef-Callaway-Redistributable-no-modification-permitted |
| atk | 2.60.6-1.fc44 | LGPL-2.1-or-later |
| at-spi2-atk | 2.60.6-1.fc44 | LGPL-2.1-or-later |
| at-spi2-core | 2.60.6-1.fc44 | LGPL-2.1-or-later |
| attr | 2.6.0-1.fc44 | GPL-2.0-or-later |
| audiocd-kio | 26.08.0-1.fc44 | BSD-3-Clause AND CC0-1.0 AND LGPL-3.0-or-later |
| audiocd-kio-doc | 26.08.0-1.fc44 | GFDL-1.2-only |
| audit | 4.2.1-1.fc44 | GPL-2.0-or-later AND LGPL-2.0-or-later |
| audit-libs | 4.2.1-1.fc44 | LGPL-2.0-or-later |
| audit-rules | 4.2.1-1.fc44 | GPL-2.0-or-later |
| aurorae | 6.7.4-1.fc44 | GPL-2.0-or-later AND MIT AND CC0-1.0 |
| authselect | 1.7.1-1.fc44 | GPL-3.0-or-later |
| authselect-libs | 1.7.1-1.fc44 | GPL-3.0-or-later |
| autocorr-en | 26.2.6.1-1.fc44 | MPL-2.0 AND Apache-2.0 AND LGPL-3.0-only AND LGPL-3.0-or-later AND CC0-1.0 AND BSD-3-Clause AND (LGPL-2.1-only OR SISSL) AND (MPL-2.0 OR LGPL-3.0-or-later) AND (MPL-2.0 OR LGPL-2.1-or-later) AND (MPL-1.1 OR GPL-2.0-only OR LGPL-2.1-only) AND MIT |
| avahi | 0.9~rc2-8.fc44 | LGPL-2.1-or-later AND LGPL-2.0-or-later AND BSD-2-Clause-Views AND MIT |
| avahi-glib | 0.9~rc2-8.fc44 | LGPL-2.1-or-later AND LGPL-2.0-or-later AND BSD-2-Clause-Views AND MIT |
| avahi-gobject | 0.9~rc2-8.fc44 | LGPL-2.1-or-later AND LGPL-2.0-or-later AND BSD-2-Clause-Views AND MIT |
| avahi-libs | 0.9~rc2-8.fc44 | LGPL-2.1-or-later AND LGPL-2.0-or-later AND BSD-2-Clause-Views AND MIT |
| avahi-tools | 0.9~rc2-8.fc44 | LGPL-2.1-or-later AND LGPL-2.0-or-later AND BSD-2-Clause-Views AND MIT |
| b43-fwcutter | 020-1.fc44 | BSD-2-Clause |
| b43-openfwwf | 5.2-48.fc44 | GPL-2.0-only |
| baloo-widgets | 26.08.0-1.fc44 | LGPL-2.0-only OR LGPL-3.0-only |
| bash | 5.3.9-3.fc44 | GPL-3.0-or-later |
| bash-color-prompt | 0.7.1-3.fc44 | GPL-2.0-or-later |
| bash-completion | 2.17-2.fc44 | GPL-2.0-or-later |
| bc | 1.08.2-4.fc44 | GPL-3.0-or-later |
| bind-libs | 9.18.50-1.fc44 | MPL-2.0 AND ISC AND MIT AND BSD-3-Clause AND BSD-2-Clause |
| bind-utils | 9.18.50-1.fc44 | MPL-2.0 AND ISC AND MIT AND BSD-3-Clause AND BSD-2-Clause |
| binutils | 2.46.1-1.fc44 | GPL-3.0-or-later AND (GPL-3.0-or-later WITH Bison-exception-2.2) AND (LGPL-2.0-or-later WITH GCC-exception-2.0) AND BSD-3-Clause AND GFDL-1.3-or-later AND GPL-2.0-or-later AND LGPL-2.1-or-later AND LGPL-2.0-or-later |
| bluedevil | 6.7.4-1.fc44 | GPL-2.0-or-later |
| blueman | 2.4.6-7.fc44 | GPL-2.0-or-later |
| bluez | 5.87-6.fc44 | GPL-2.0-or-later |
| bluez-cups | 5.87-6.fc44 | GPL-2.0-or-later |
| bluez-libs | 5.87-6.fc44 | GPL-2.0-or-later |
| bluez-obexd | 5.87-6.fc44 | GPL-2.0-or-later |
| bolt | 0.9.11-1.fc44 | LGPL-2.1-or-later |
| boost-atomic | 1.90.0-7.fc44 | BSL-1.0 AND MIT AND Python-2.0.1 |
| boost-charconv | 1.90.0-7.fc44 | BSL-1.0 AND (BSL-1.0 OR Apache-2.0 WITH LLVM-exception) |
| boost-chrono | 1.90.0-7.fc44 | BSL-1.0 AND (MIT OR NCSA) |
| boost-container | 1.90.0-7.fc44 | BSL-1.0 AND MIT AND Python-2.0.1 |
| boost-date-time | 1.90.0-7.fc44 | BSL-1.0 AND MIT AND Python-2.0.1 |
| boost-iostreams | 1.90.0-7.fc44 | BSL-1.0 AND MIT AND Python-2.0.1 |
| boost-locale | 1.90.0-7.fc44 | BSL-1.0 AND MIT AND Python-2.0.1 |
| boost-random | 1.90.0-7.fc44 | BSL-1.0 AND MIT AND Python-2.0.1 |
| boost-regex | 1.90.0-7.fc44 | BSL-1.0 AND MIT AND Python-2.0.1 |
| boost-thread | 1.90.0-7.fc44 | BSL-1.0 AND (MIT OR NCSA) |
| bootc | 1.16.10-1.fc44 | Apache-2.0 AND BSD-3-Clause AND MIT AND (Apache-2.0 OR BSL-1.0) AND (Apache-2.0 OR MIT) AND (Apache-2.0 WITH LLVM-exception OR Apache-2.0 OR MIT) AND (Unlicense OR MIT) |
| bootupd | 0.2.35-1.fc44 | Apache-2.0 AND (Apache-2.0 WITH LLVM-exception) AND BSD-3-Clause AND MIT AND (Apache-2.0 OR BSL-1.0) AND (Apache-2.0 OR MIT) AND (Apache-2.0 WITH LLVM-exception OR Apache-2.0 OR MIT) AND (Unlicense OR MIT) |
| botan3 | 3.9.0-7.fc44 | BSD-2-Clause |
| Box2D | 2.4.2-7.fc44 | Zlib |
| braille-printer-app | 2.0~b0^386eea385f-11.fc44 | Apache-2.0 WITH LLVM-exception |
| brave-browser | 1.94.119-1 | Multiple, see https://brave.com/ |
| brave-keyring | 1.19-1 | MPL-2.0 |
| brcmfmac-firmware | 20260810-1.fc44 | LicenseRef-Callaway-Redistributable-no-modification-permitted |
| breeze-cursor-theme | 6.7.4-2.fc44 | BSD-3-Clause AND CC0-1.0 AND GPL-2.0-only AND GPL-2.0-or-later AND GPL-3.0-only AND (GPL-2.0-only OR GPL-3.0-only) AND MIT |
| breeze-gtk-common | 6.7.4-1.fc44 | BSD-3-Clause AND CC0-1.0 |
| breeze-gtk-gtk3 | 6.7.4-1.fc44 | BSD-3-Clause AND CC0-1.0 |
| breeze-gtk-gtk4 | 6.7.4-1.fc44 | BSD-3-Clause AND CC0-1.0 |
| breeze-icon-theme | 6.29.0-1.fc44 | LGPL-2.1-or-later AND LGPL-3.0-or-later AND CC-BY-SA-4.0 |
| brlapi | 0.8.7-8.fc44 | LGPL-2.0-or-later AND LGPL-2.1-or-later AND GPL-2.0-or-later |
| brltty | 6.8-8.fc44 | LGPL-2.0-or-later AND LGPL-2.1-or-later AND GPL-2.0-or-later |
| btop | 1.4.7-1.fc44 | Apache-2.0 AND ISC AND MIT AND LicenseRef-Fedora-Public-Domain |
| btrfs-progs | 7.1-1.fc44 | GPL-2.0-only |
| bubblewrap | 0.11.0-4.fc44 | LGPL-2.0-or-later |
| buildah | 1.43.2-1.fc44 | Apache-2.0 AND BSD-2-Clause AND BSD-3-Clause AND ISC AND MIT AND MPL-2.0 |
| bzip2 | 1.0.8-23.fc44 | BSD-4-Clause |
| bzip2-libs | 1.0.8-23.fc44 | BSD-4-Clause |
| c2esp | 2.7-37.fc44 | GPL-2.0-or-later |
| ca-certificates | 2025.2.80_v9.0.304-7.fc44 | MIT AND GPL-2.0-or-later |
| cairo | 1.18.4-6.fc44 | LGPL-2.1-only OR MPL-1.1 |
| cairo-gobject | 1.18.4-6.fc44 | LGPL-2.1-only OR MPL-1.1 |
| cairomm1.16 | 1.18.0-16.fc44 | LGPL-2.0-or-later |
| capstone | 5.0.6-4.fc44 | BSD-3-Clause AND BSD-4-Clause AND APSL-2.0 AND NCSA AND MIT |
| c-ares | 1.34.8-1.fc44 | MIT |
| catatonit | 0.2.1-5.fc44 | GPL-3.0-or-later |
| catdoc | 0.95-30.fc44 | GPL-2.0-or-later |
| cdparanoia-libs | 10.2-50.fc44 | LicenseRef-Callaway-LGPLv2 |
| cfitsio | 4.6.3-2.fc44 | CFITSIO |
| checkpolicy | 3.11-1.fc44 | GPL-2.0-or-later AND LGPL-2.1-or-later |
| chrony | 4.8-5.fc44 | GPL-2.0-only |
| cifs-utils | 7.6-2.fc44 | GPL-3.0-only |
| cifs-utils-info | 7.6-2.fc44 | GPL-3.0-only |
| cirrus-audio-firmware | 20260810-1.fc44 | LicenseRef-Callaway-Redistributable-no-modification-permitted |
| cjson | 1.7.19-1.fc44 | MIT |
| cldr-emoji-annotation | 48.2-1.fc44 | Unicode-DFS-2016 |
| cldr-emoji-annotation-dtd | 48.2-1.fc44 | Unicode-DFS-2016 |
| clinfo | 3.0.25.02.14-3.fc44 | CC0-1.0 |
| clucene-contribs-lib | 2.3.3.4-55.20130812.e8e3d20git.fc44 | LicenseRef-Callaway-LGPLv2+ OR Apache-2.0 |
| clucene-core | 2.3.3.4-55.20130812.e8e3d20git.fc44 | LicenseRef-Callaway-LGPLv2+ OR Apache-2.0 |
| cmake-filesystem | 4.3.0-1.fc44 | BSD-3-Clause AND MIT-open-group AND Zlib AND Apache-2.0 |
| codec2 | 1.2.0-9.fc44 | LGPL-2.1-only |
| colord | 1.4.8-4.fc44 | GPL-2.0-or-later AND LGPL-2.1-or-later |
| colord-kde | 26.08.0-1.fc44 | CC0-1.0 AND LGPL-3.0-or-later |
| colord-libs | 1.4.8-4.fc44 | GPL-2.0-or-later AND LGPL-2.1-or-later |
| color-filesystem | 1-38.fc44 | LicenseRef-Not-Copyrightable |
| composefs | 1.0.8-5.fc44 | LGPL-2.0-or-later AND Apache-2.0 |
| composefs-libs | 1.0.8-5.fc44 | LGPL-2.1-or-later AND (GPL-2.0-only OR Apache-2.0) |
| compsize | 1.5^git20250123.d79eacf-15.fc44 | GPL-2.0-or-later |
| conmon | 2.2.1-2.fc44 | Apache-2.0 |
| containers-common | 0.67.0-1.fc44 | Apache-2.0 |
| containers-common-extra | 0.67.0-1.fc44 | Apache-2.0 |
| container-selinux | 2.250.0-1.fc44 | GPL-2.0-only |
| coreutils | 9.10-5.fc44 | GPL-3.0-or-later AND GFDL-1.3-no-invariants-or-later AND LGPL-2.1-or-later AND LGPL-3.0-or-later |
| coreutils-common | 9.10-5.fc44 | GPL-3.0-or-later AND GFDL-1.3-no-invariants-or-later AND LGPL-2.1-or-later AND LGPL-3.0-or-later |
| corosynclib | 3.1.10-5.fc44 | BSD-3-Clause |
| cpio | 2.15-9.fc44 | GPL-3.0-or-later |
| cpp | 16.2.1-2.fc44 | GPL-3.0-or-later AND LGPL-3.0-or-later AND (GPL-3.0-or-later WITH GCC-exception-3.1) AND (GPL-3.0-or-later WITH Texinfo-exception) AND (LGPL-2.1-or-later WITH GCC-exception-2.0) AND (GPL-2.0-or-later WITH GCC-exception-2.0) AND (GPL-2.0-or-later WITH GNU-compiler-exception) AND BSL-1.0 AND GFDL-1.3-or-later AND Linux-man-pages-copyleft-2-para AND SunPro AND BSD-1-Clause AND BSD-2-Clause AND BSD-2-Clause-Views AND BSD-3-Clause AND BSD-4-Clause AND BSD-Source-Code AND Zlib AND MIT AND Apache-2.0 AND (Apache-2.0 WITH LLVM-Exception) AND ZPL-2.1 AND ISC AND LicenseRef-Fedora-Public-Domain AND HP-1986 AND curl AND Martin-Birgmeier AND HPND-Markus-Kuhn AND dtoa AND SMLNJ AND AMD-newlib AND OAR AND HPND-merchantability-variant AND HPND-Intel |
| cracklib | 2.10.3-1.fc44 | LGPL-2.1-or-later |
| cracklib-dicts | 2.10.3-1.fc44 | LGPL-2.1-or-later |
| criu | 4.2.1-1.fc44 | GPL-2.0-only AND LGPL-2.1-only AND MIT |
| criu-libs | 4.2.1-1.fc44 | GPL-2.0-only AND LGPL-2.1-only AND MIT |
| crun | 1.28-1.fc44 | GPL-2.0-only |
| crypto-policies | 20251128-3.git19878fe.fc44 | LGPL-2.1-or-later |
| crypto-policies-scripts | 20251128-3.git19878fe.fc44 | LGPL-2.1-or-later |
| cryptsetup | 2.8.7-1.fc44 | GPL-2.0-or-later WITH cryptsetup-OpenSSL-exception AND LGPL-2.1-or-later WITH cryptsetup-OpenSSL-exception |
| cryptsetup-libs | 2.8.7-1.fc44 | GPL-2.0-or-later WITH cryptsetup-OpenSSL-exception AND LGPL-2.1-or-later WITH cryptsetup-OpenSSL-exception |
| ctags | 6.2.1-3.fc44 | GPL-2.0-or-later |
| cups | 2.4.19-3.fc44 | Apache-2.0 WITH LLVM-exception AND BSD-3-Clause AND Zlib AND BSD-2-Clause |
| cups-browsed | 2.1.1-7.fc44 | Apache-2.0 WITH LLVM-exception |
| cups-client | 2.4.19-3.fc44 | Apache-2.0 WITH LLVM-exception AND BSD-3-Clause AND Zlib AND BSD-2-Clause |
| cups-filesystem | 2.4.19-3.fc44 | Apache-2.0 WITH LLVM-exception AND BSD-3-Clause AND Zlib AND BSD-2-Clause |
| cups-filters | 2.0.1-14.fc44 | Apache-2.0 WITH LLVM-exception |
| cups-filters-driverless | 2.0.1-14.fc44 | Apache-2.0 WITH LLVM-exception |
| cups-ipptool | 2.4.19-3.fc44 | Apache-2.0 WITH LLVM-exception AND BSD-3-Clause AND Zlib AND BSD-2-Clause |
| cups-libs | 2.4.19-3.fc44 | Apache-2.0 WITH LLVM-exception AND BSD-3-Clause AND Zlib AND BSD-2-Clause |
| cups-pk-helper | 0.2.7-12.fc44 | GPL-2.0-or-later |
| curl | 8.18.0-9.fc44 | curl |
| cyrus-sasl-gssapi | 2.1.28-35.fc44 | BSD-Attribution-HPND-disclaimer |
| cyrus-sasl-lib | 2.1.28-35.fc44 | BSD-Attribution-HPND-disclaimer |
| cyrus-sasl-plain | 2.1.28-35.fc44 | BSD-Attribution-HPND-disclaimer |
| dbus | 1.16.2-1.fc44 | (AFL-2.1 OR GPL-2.0-or-later) AND GPL-2.0-or-later |
| dbus-broker | 37-8.fc44 | Apache-2.0 AND LGPL-2.0-or-later AND LGPL-2.1-or-later AND (Apache-2.0 OR LGPL-2.1-or-later) |
| dbus-common | 1.16.2-1.fc44 | (AFL-2.1 OR GPL-2.0-or-later) AND GPL-2.0-or-later |
| dbus-daemon | 1.16.2-1.fc44 | (AFL-2.1 OR GPL-2.0-or-later) AND GPL-2.0-or-later |
| dbus-libs | 1.16.2-1.fc44 | (AFL-2.1 OR GPL-2.0-or-later) AND GPL-2.0-or-later |
| dbusmenu-qt5 | 0.9.3-0.40.20160218.fc44 | LGPL-2.0-or-later |
| dbus-tools | 1.16.2-1.fc44 | (AFL-2.1 OR GPL-2.0-or-later) AND GPL-2.0-or-later |
| dbus-x11 | 1.16.2-1.fc44 | (AFL-2.1 OR GPL-2.0-or-later) AND GPL-2.0-or-later |
| dconf | 0.49.0-5.fc44 | LGPL-2.0-or-later AND LGPL-2.1-or-later AND GPL-2.0-or-later AND GPL-3.0-or-later |
| ddcutil | 2.2.1-3.fc44 | GPL-2.0-or-later |
| default-editor | 8.7.1-2.fc44 | GPL-3.0-or-later |
| default-fonts-am | 4.3-1.fc44 | GPL-2.0-or-later |
| default-fonts-ar | 4.3-1.fc44 | GPL-2.0-or-later |
| default-fonts-as | 4.3-1.fc44 | GPL-2.0-or-later |
| default-fonts-ast | 4.3-1.fc44 | GPL-2.0-or-later |
| default-fonts-be | 4.3-1.fc44 | GPL-2.0-or-later |
| default-fonts-bg | 4.3-1.fc44 | GPL-2.0-or-later |
| default-fonts-bn | 4.3-1.fc44 | GPL-2.0-or-later |
| default-fonts-bo | 4.3-1.fc44 | GPL-2.0-or-later |
| default-fonts-br | 4.3-1.fc44 | GPL-2.0-or-later |
| default-fonts-chr | 4.3-1.fc44 | GPL-2.0-or-later |
| default-fonts-core-emoji | 4.3-1.fc44 | GPL-2.0-or-later |
| default-fonts-core-math | 4.3-1.fc44 | GPL-2.0-or-later |
| default-fonts-core-mono | 4.3-1.fc44 | GPL-2.0-or-later |
| default-fonts-core-sans | 4.3-1.fc44 | GPL-2.0-or-later |
| default-fonts-core-serif | 4.3-1.fc44 | GPL-2.0-or-later |
| default-fonts-dv | 4.3-1.fc44 | GPL-2.0-or-later |
| default-fonts-dz | 4.3-1.fc44 | GPL-2.0-or-later |
| default-fonts-el | 4.3-1.fc44 | GPL-2.0-or-later |
| default-fonts-eo | 4.3-1.fc44 | GPL-2.0-or-later |
| default-fonts-eu | 4.3-1.fc44 | GPL-2.0-or-later |
| default-fonts-fa | 4.3-1.fc44 | GPL-2.0-or-later |
| default-fonts-got | 4.3-1.fc44 | GPL-2.0-or-later |
| default-fonts-gu | 4.3-1.fc44 | GPL-2.0-or-later |
| default-fonts-he | 4.3-1.fc44 | GPL-2.0-or-later |
| default-fonts-hi | 4.3-1.fc44 | GPL-2.0-or-later |
| default-fonts-hy | 4.3-1.fc44 | GPL-2.0-or-later |
| default-fonts-ia | 4.3-1.fc44 | GPL-2.0-or-later |
| default-fonts-ii | 4.3-1.fc44 | GPL-2.0-or-later |
| default-fonts-iu | 4.3-1.fc44 | GPL-2.0-or-later |
| default-fonts-ka | 4.3-1.fc44 | GPL-2.0-or-later |
| default-fonts-kab | 4.3-1.fc44 | GPL-2.0-or-later |
| default-fonts-km | 4.3-1.fc44 | GPL-2.0-or-later |
| default-fonts-kn | 4.3-1.fc44 | GPL-2.0-or-later |
| default-fonts-ku | 4.3-1.fc44 | GPL-2.0-or-later |
| default-fonts-lo | 4.3-1.fc44 | GPL-2.0-or-later |
| default-fonts-mai | 4.3-1.fc44 | GPL-2.0-or-later |
| default-fonts-ml | 4.3-1.fc44 | GPL-2.0-or-later |
| default-fonts-mni | 4.3-1.fc44 | GPL-2.0-or-later |
| default-fonts-mr | 4.3-1.fc44 | GPL-2.0-or-later |
| default-fonts-my | 4.3-1.fc44 | GPL-2.0-or-later |
| default-fonts-nb | 4.3-1.fc44 | GPL-2.0-or-later |
| default-fonts-ne | 4.3-1.fc44 | GPL-2.0-or-later |
| default-fonts-nn | 4.3-1.fc44 | GPL-2.0-or-later |
| default-fonts-nqo | 4.3-1.fc44 | GPL-2.0-or-later |
| default-fonts-nr | 4.3-1.fc44 | GPL-2.0-or-later |
| default-fonts-nso | 4.3-1.fc44 | GPL-2.0-or-later |
| default-fonts-or | 4.3-1.fc44 | GPL-2.0-or-later |
| default-fonts-other-mono | 4.3-1.fc44 | GPL-2.0-or-later |
| default-fonts-other-sans | 4.3-1.fc44 | GPL-2.0-or-later |
| default-fonts-other-serif | 4.3-1.fc44 | GPL-2.0-or-later |
| default-fonts-pa | 4.3-1.fc44 | GPL-2.0-or-later |
| default-fonts-ru | 4.3-1.fc44 | GPL-2.0-or-later |
| default-fonts-sat | 4.3-1.fc44 | GPL-2.0-or-later |
| default-fonts-si | 4.3-1.fc44 | GPL-2.0-or-later |
| default-fonts-ss | 4.3-1.fc44 | GPL-2.0-or-later |
| default-fonts-syr | 4.3-1.fc44 | GPL-2.0-or-later |
| default-fonts-ta | 4.3-1.fc44 | GPL-2.0-or-later |
| default-fonts-te | 4.3-1.fc44 | GPL-2.0-or-later |
| default-fonts-th | 4.3-1.fc44 | GPL-2.0-or-later |
| default-fonts-tn | 4.3-1.fc44 | GPL-2.0-or-later |
| default-fonts-ts | 4.3-1.fc44 | GPL-2.0-or-later |
| default-fonts-uk | 4.3-1.fc44 | GPL-2.0-or-later |
| default-fonts-ur | 4.3-1.fc44 | GPL-2.0-or-later |
| default-fonts-ve | 4.3-1.fc44 | GPL-2.0-or-later |
| default-fonts-vi | 4.3-1.fc44 | GPL-2.0-or-later |
| default-fonts-xh | 4.3-1.fc44 | GPL-2.0-or-later |
| default-fonts-yi | 4.3-1.fc44 | GPL-2.0-or-later |
| default-fonts-zu | 4.3-1.fc44 | GPL-2.0-or-later |
| desktop-backgrounds-compat | 44.0.0-2.fc44 | LicenseRef-Fedora-Public-Domain AND GPL-1.0-or-later |
| desktop-backgrounds-kde | 44.0.0-2.fc44 | LicenseRef-Fedora-Public-Domain AND GPL-1.0-or-later |
| desktop-file-utils | 0.28-5.fc44 | GPL-2.0-or-later |
| device-mapper | 1.02.212-2.fc44 | GPL-2.0-only |
| device-mapper-event | 1.02.212-2.fc44 | GPL-2.0-only |
| device-mapper-event-libs | 1.02.212-2.fc44 | LGPL-2.1-only |
| device-mapper-libs | 1.02.212-2.fc44 | LGPL-2.1-only |
| device-mapper-persistent-data | 1.3.3-1.fc44 | GPL-3.0-only AND (0BSD OR MIT OR Apache-2.0) AND Apache-2.0 AND (Apache-2.0 OR MIT) AND (Apache-2.0 WITH LLVM-exception OR Apache-2.0 OR MIT) AND BSD-3-Clause AND MIT AND (MIT OR Apache-2.0) AND (MIT OR Zlib OR Apache-2.0) AND (Unlicense OR MIT) AND (Zlib OR Apache-2.0 OR MIT) |
| diffutils | 3.12-5.fc44 | GPL-3.0-or-later |
| distribution-gpg-keys | 1.121-1.fc44 | CC0-1.0 |
| djvulibre-libs | 3.5.30-1.fc44 | GPL-2.0-or-later |
| dlm-lib | 4.3.0-8.fc44 | GPL-2.0-only AND GPL-2.0-or-later AND LGPL-2.0-or-later |
| dmidecode | 3.7-1.fc44 | GPL-2.0-or-later |
| dnf5 | 5.4.3.0-2.fc44 | GPL-2.0-or-later |
| dnf5-plugins | 5.4.3.0-2.fc44 | LGPL-2.1-or-later AND GPL-2.0-or-later |
| dnsmasq | 2.92rel2-9.fc44 | GPL-2.0-only OR GPL-3.0-only |
| dns-root-data | 2026260100-2.fc44 | BSD-2-Clause and CC0-1.0 |
| docbook-dtds | 1.0-91.fc44 | LicenseRef-docbook-dtds |
| docbook-style-xsl | 1.79.2-27.fc44 | LicenseRef-DMIT |
| dolphin | 26.08.0-1.fc44 | BSD-2-Clause AND BSD-3-Clause AND GPL-2.0-only AND GPL-2.0-or-later AND GPL-3.0-only AND LGPL-2.0-only AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-3.0-only AND (GPL-2.0-only OR GPL-3.0-only) AND (LGPL-2.1-only OR LGPL-3.0-only) |
| dolphin-libs | 26.08.0-1.fc44 | BSD-2-Clause AND BSD-3-Clause AND GPL-2.0-only AND GPL-2.0-or-later AND GPL-3.0-only AND LGPL-2.0-only AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-3.0-only AND (GPL-2.0-only OR GPL-3.0-only) AND (LGPL-2.1-only OR LGPL-3.0-only) |
| dolphin-plugins | 26.08.0-1.fc44 | GPL-2.0-or-later |
| dosfstools | 4.2-18.fc44 | GPL-3.0-or-later |
| dotconf | 1.4.1-7.fc44 | LGPL-2.1-only AND Apache-1.1 |
| double-conversion | 3.4.0-3.fc44 | BSD-3-Clause |
| dracut | 108-7.fc44 | GPL-2.0-or-later AND LGPL-2.1-or-later AND GPL-2.0-only |
| duktape | 2.7.0-11.fc44 | MIT |
| dymo-cups-drivers | 1.4.0.5-25.fc44 | GPL-2.0-or-later |
| e2fsprogs | 1.47.3-4.fc44 | GPL-2.0-only |
| e2fsprogs-libs | 1.47.3-4.fc44 | GPL-2.0-only AND LGPL-2.0-only |
| ebook-tools-libs | 0.2.2-31.fc44 | MIT |
| editorconfig-libs | 0.12.11-1.fc44 | BSD-2-Clause AND BSD-3-Clause AND BSD-1-Clause |
| efibootmgr | 18-11.fc44 | GPL-2.0-or-later |
| efi-filesystem | 6-6.fc44 | GPL-3.0-or-later |
| efivar-libs | 39-12.fc44 | LGPL-2.1-only |
| egl-utils | 9.0.0-11.fc44 | MIT |
| elfutils | 0.196-1.fc44 | GPL-3.0-or-later AND (GPL-2.0-or-later OR LGPL-3.0-or-later) AND GFDL-1.3-no-invariants-or-later |
| elfutils-debuginfod-client | 0.196-1.fc44 | GPL-3.0-or-later AND (GPL-2.0-or-later OR LGPL-3.0-or-later) |
| elfutils-default-yama-scope | 0.196-1.fc44 | GPL-2.0-or-later OR LGPL-3.0-or-later |
| elfutils-libelf | 0.196-1.fc44 | GPL-2.0-or-later OR LGPL-3.0-or-later |
| elfutils-libs | 0.196-1.fc44 | GPL-2.0-or-later OR LGPL-3.0-or-later |
| emacs-filesystem | 30.2-2.fc44 | CC0-1.0 |
| enchant2 | 2.8.19-2.fc44 | LGPL-2.0-or-later |
| espeak-ng | 1.52.0-3.fc44 | GPL-3.0-only AND GPL-3.0-or-later AND Apache-2.0 AND BSD-2-Clause AND Unicode-DFS-2016 AND CC-BY-SA-3.0 |
| ethtool | 7.1-1.fc44 | GPL-2.0-only AND GPL-2.0-or-later |
| exfatprogs | 1.4.3-1.fc44 | GPL-2.0-only |
| exiv2 | 0.28.6-3.fc44 | GPL-2.0-or-later AND BSD-3-Clause AND LicenseRef-Fedora-Public-Domain |
| exiv2-libs | 0.28.6-3.fc44 | GPL-2.0-or-later AND BSD-3-Clause AND LicenseRef-Fedora-Public-Domain |
| expat | 2.8.1-1.fc44 | MIT |
| f2fs-tools | 1.16.0-10.fc44 | GPL-2.0-or-later |
| f44-backgrounds-base | 44.0.0-1.fc44 | CC-BY-SA-4.0 |
| f44-backgrounds-kde | 44.0.0-1.fc44 | CC-BY-SA-4.0 |
| faad2-libs | 2.11.2-6.fc44 | GPL-2.0-or-later |
| fastfetch | 2.66.0-1.fc44 | MIT |
| fatresize | 1.1.0-20.20221116gitab78c48.fc44 | GPL-3.0-or-later |
| fdk-aac-free | 2.0.3-2.fc44 | FDK-AAC |
| fedora-appstream-metadata | 20260515-1.fc44 | MIT |
| fedora-bookmarks | 28-36.fc44 | GFDL-1.1-or-later |
| fedora-chromium-config | 3.0-9.fc44 | GPL-2.0-or-later |
| fedora-chromium-config-kde | 3.0-9.fc44 | GPL-2.0-or-later |
| fedora-flathub-remote | 1-12.fc44 | MIT |
| fedora-gpg-keys | 44-2 | MIT |
| fedora-logos | 42.0.1-3.fc44 | LicenseRef-Fedora-Logos |
| fedora-release-common | 44-18 | MIT |
| fedora-release-identity-kinoite | 44-18 | MIT |
| fedora-release-kinoite | 44-18 | MIT |
| fedora-release-ostree-desktop | 44-18 | MIT |
| fedora-repos | 44-2 | MIT |
| fedora-repos-archive | 44-2 | MIT |
| fedora-third-party | 0.10-16.fc44 | MIT |
| fedora-workstation-backgrounds | 1.6-9.fc44 | CC-BY-4.0 |
| fedora-workstation-repositories | 38-9.fc44 | MIT |
| ffmpeg-free | 8.1.2-4.fc44 | GPL-3.0-or-later |
| ffmpegthumbs | 26.08.0-1.fc44 | GPL-2.0-or-later |
| fftw-libs-double | 3.3.10-17.fc44 | GPL-2.0-or-later AND MIT AND BSD-2-Clause |
| fftw-libs-single | 3.3.10-17.fc44 | GPL-2.0-or-later AND MIT AND BSD-2-Clause |
| file | 5.46-10.fc44 | BSD-2-Clause-Darwin AND BSD-2-Clause |
| file-libs | 5.46-10.fc44 | BSD-2-Clause-Darwin AND BSD-2-Clause |
| filelight | 26.08.0-1.fc44 | GPL-2.0-only OR GPL-3.0-only |
| filesystem | 3.18-52.fc44 | LicenseRef-Fedora-Public-Domain |
| findutils | 4.10.0-7.fc44 | GPL-3.0-or-later |
| firewall-config | 2.4.4-1.fc44 | GPL-2.0-or-later |
| firewalld | 2.4.4-1.fc44 | GPL-2.0-or-later |
| firewalld-filesystem | 2.4.4-1.fc44 | GPL-2.0-or-later |
| flac-libs | 1.5.0-8.fc44 | BSD-3-Clause AND GPL-2.0-or-later AND GFDL-1.3-or-later |
| flameshot | 14.0.0-1.fc44 | GPL-3.0-or-later AND Apache-2.0 AND GPL-2.0-only AND LGPL-3.0-or-later AND (LGPL-3.0-only OR GPL-3.0-only) AND LAL-1.3 |
| flatpak | 1.18.1-1.fc44 | LGPL-2.1-or-later |
| flatpak-kcm | 6.7.4-1.fc44 | BSD-2-Clause and BSD-3-Clause and CC0-1.0 and GPL-2.0-or-later |
| flatpak-libs | 1.18.1-1.fc44 | LGPL-2.1-or-later |
| flatpak-selinux | 1.18.1-1.fc44 | LGPL-2.1-or-later |
| flatpak-session-helper | 1.18.1-1.fc44 | LGPL-2.1-or-later |
| flexiblas | 3.5.0-2.fc44 | LGPL-3.0-or-later AND LGPL-2.0-or-later AND BSD-3-Clause-Open-MPI |
| flexiblas-netlib | 3.5.0-2.fc44 | LGPL-3.0-or-later AND LGPL-2.0-or-later AND BSD-3-Clause-Open-MPI |
| flexiblas-openblas-openmp | 3.5.0-2.fc44 | LGPL-3.0-or-later AND LGPL-2.0-or-later AND BSD-3-Clause-Open-MPI |
| flite | 2.2-13.fc44 | MIT |
| fmt | 11.2.0-4.fc44 | MIT |
| fontconfig | 2.17.0-4.fc44 | HPND AND LicenseRef-Fedora-Public-Domain AND Unicode-DFS-2016 |
| fonts-filesystem | 5.0.0-2.fc44 | MIT |
| fpaste | 0.5.0.0-4.fc44 | GPL-3.0-or-later |
| fprintd | 1.94.5-5.fc44 | GPL-2.0-or-later AND GFDL-1.1-or-later |
| fprintd-pam | 1.94.5-5.fc44 | GPL-2.0-or-later |
| freeglut | 3.8.0-2.fc44 | MIT |
| freerdp | 3.30.0-1.fc44 | Apache-2.0 AND HPND AND LGPL-2.1-or-later AND LicenseRef-Fedora-Public-Domain AND OFL-1.1 |
| freerdp-libs | 3.30.0-1.fc44 | Apache-2.0 AND HPND AND LGPL-2.1-or-later AND LicenseRef-Fedora-Public-Domain AND OFL-1.1 |
| freetype | 2.14.3-1.fc44 | (FTL OR GPL-2.0-or-later) AND BSD-3-Clause AND MIT AND MIT-Modern-Variant AND LicenseRef-Fedora-Public-Domain AND Zlib |
| fribidi | 1.0.16-4.fc44 | LGPL-2.1-or-later AND Unicode-DFS-2016 |
| fstrm | 0.6.1-14.fc44 | MIT AND NTP |
| fuse3 | 3.18.2-1.fc44 | GPL-1.0-or-later |
| fuse3-libs | 3.18.2-1.fc44 | LGPL-2.1-or-later |
| fuse-common | 3.18.2-1.fc44 | GPL-1.0-or-later |
| fuse-overlayfs | 1.17-1.fc44 | GPL-3.0-or-later |
| fuse-sshfs | 3.7.6-1.fc44 | GPL-2.0-only |
| fwupd | 2.1.7-1.fc44 | LGPL-2.1-or-later |
| fwupd-efi | 1.8-1.fc44 | LGPL-2.1-or-later |
| fwupd-plugin-modem-manager | 2.1.7-1.fc44 | LGPL-2.1-or-later |
| fwupd-plugin-uefi-capsule-data | 2.1.7-1.fc44 | LGPL-2.1-or-later |
| gamemode | 1.8.2-4.fc44 | BSD-3-Clause |
| game-music-emu | 0.6.4-3.fc44 | LicenseRef-Callaway-LGPLv2+ |
| gawk | 5.3.2-3.fc44 | GPL-3.0-or-later AND GPL-2.0-or-later AND LGPL-2.1-or-later AND BSD-3-Clause |
| gawk-all-langpacks | 5.3.2-3.fc44 | GPL-3.0-or-later AND GPL-2.0-or-later AND LGPL-2.1-or-later AND BSD-3-Clause |
| gcr-libs | 4.4.0.1-7.fc44 | LGPL-2.1-or-later AND FSFULLRWD AND (LGPL-3.0-or-later OR CC-BY-SA-3.0) AND (MPL-1.1 OR GPL-2.0-or-later OR LGPL-2.1-or-later) AND GCR-docs |
| gd | 2.3.3-21.fc44 | GD |
| gdb | 17.2-2.fc44 | GPL-3.0-or-later AND BSD-3-Clause AND FSFAP AND LGPL-2.1-or-later AND GPL-2.0-or-later AND LGPL-2.0-or-later AND LicenseRef-Fedora-Public-Domain AND GFDL-1.3-or-later AND LGPL-2.0-or-later WITH GCC-exception-2.0 AND GPL-3.0-or-later WITH GCC-exception-3.1 AND GPL-2.0-or-later WITH GNU-compiler-exception AND MIT |
| gdb-headless | 17.2-2.fc44 | GPL-3.0-or-later AND BSD-3-Clause AND FSFAP AND LGPL-2.1-or-later AND GPL-2.0-or-later AND LGPL-2.0-or-later AND LicenseRef-Fedora-Public-Domain AND GFDL-1.3-or-later AND LGPL-2.0-or-later WITH GCC-exception-2.0 AND GPL-3.0-or-later WITH GCC-exception-3.1 AND GPL-2.0-or-later WITH GNU-compiler-exception AND MIT |
| gdbm | 1.23-11.fc44 | GPL-3.0-or-later |
| gdbm-libs | 1.23-11.fc44 | GPL-3.0-or-later |
| gdk-pixbuf2 | 2.44.4-2.fc44 | LGPL-2.1-or-later |
| gdouros-symbola-fonts | 10.24-19.fc44 | LicenseRef-Fedora-UltraPermissive |
| geoclue2 | 2.8.2-1.fc44 | GPL-2.0-or-later |
| gettext-envsubst | 0.26-5.fc44 | GPL-3.0-or-later and LGPL-2.0-or-later and GFDL-1.2-or-later |
| gettext-libs | 0.26-5.fc44 | LGPL-2.0-or-later and GPL-3.0-or-later |
| gettext-runtime | 0.26-5.fc44 | GPL-3.0-or-later and LGPL-2.0-or-later |
| ghostscript | 10.06.0-2.fc44 | AGPL-3.0-or-later |
| ghostscript-tools-fontutils | 10.06.0-2.fc44 | AGPL-3.0-or-later |
| ghostscript-tools-printing | 10.06.0-2.fc44 | AGPL-3.0-or-later |
| giflib | 6.1.3-2.fc44 | MIT |
| git | 2.55.0-1.fc44 | BSD-3-Clause AND GPL-2.0-only AND GPL-2.0-or-later AND LGPL-2.1-or-later AND MIT |
| git-core | 2.55.0-1.fc44 | BSD-3-Clause AND GPL-2.0-only AND GPL-2.0-or-later AND LGPL-2.1-or-later AND MIT |
| git-core-doc | 2.55.0-1.fc44 | BSD-3-Clause AND GPL-2.0-only AND GPL-2.0-or-later AND LGPL-2.1-or-later AND MIT |
| glib2 | 2.88.3-1.fc44 | LGPL-2.1-or-later |
| glibc | 2.43-8.fc44 | LGPL-2.1-or-later AND SunPro AND LGPL-2.1-or-later WITH GCC-exception-2.0 AND BSD-3-Clause AND GPL-2.0-or-later AND LGPL-2.1-or-later WITH GNU-compiler-exception AND GPL-2.0-only AND ISC AND LicenseRef-Fedora-Public-Domain AND HPND AND CMU-Mach AND LGPL-2.0-or-later AND Unicode-3.0 AND GFDL-1.1-or-later AND GPL-1.0-or-later AND FSFUL AND MIT AND Inner-Net-2.0 AND X11 AND GPL-2.0-or-later WITH GCC-exception-2.0 AND GFDL-1.3-only AND GFDL-1.1-only AND GPL-3.0-or-later AND GPL-3.0-or-later WITH Autoconf-exception-generic-3.0 AND GPL-3.0-or-later WITH Texinfo-exception |
| glibc-common | 2.43-8.fc44 | LGPL-2.1-or-later AND SunPro AND LGPL-2.1-or-later WITH GCC-exception-2.0 AND BSD-3-Clause AND GPL-2.0-or-later AND LGPL-2.1-or-later WITH GNU-compiler-exception AND GPL-2.0-only AND ISC AND LicenseRef-Fedora-Public-Domain AND HPND AND CMU-Mach AND LGPL-2.0-or-later AND Unicode-3.0 AND GFDL-1.1-or-later AND GPL-1.0-or-later AND FSFUL AND MIT AND Inner-Net-2.0 AND X11 AND GPL-2.0-or-later WITH GCC-exception-2.0 AND GFDL-1.3-only AND GFDL-1.1-only AND GPL-3.0-or-later AND GPL-3.0-or-later WITH Autoconf-exception-generic-3.0 AND GPL-3.0-or-later WITH Texinfo-exception |
| glibc-gconv-extra | 2.43-8.fc44 | LGPL-2.1-or-later AND SunPro AND LGPL-2.1-or-later WITH GCC-exception-2.0 AND BSD-3-Clause AND GPL-2.0-or-later AND LGPL-2.1-or-later WITH GNU-compiler-exception AND GPL-2.0-only AND ISC AND LicenseRef-Fedora-Public-Domain AND HPND AND CMU-Mach AND LGPL-2.0-or-later AND Unicode-3.0 AND GFDL-1.1-or-later AND GPL-1.0-or-later AND FSFUL AND MIT AND Inner-Net-2.0 AND X11 AND GPL-2.0-or-later WITH GCC-exception-2.0 AND GFDL-1.3-only AND GFDL-1.1-only AND GPL-3.0-or-later AND GPL-3.0-or-later WITH Autoconf-exception-generic-3.0 AND GPL-3.0-or-later WITH Texinfo-exception |
| glibc-langpack-en | 2.43-8.fc44 | LGPL-2.1-or-later AND SunPro AND LGPL-2.1-or-later WITH GCC-exception-2.0 AND BSD-3-Clause AND GPL-2.0-or-later AND LGPL-2.1-or-later WITH GNU-compiler-exception AND GPL-2.0-only AND ISC AND LicenseRef-Fedora-Public-Domain AND HPND AND CMU-Mach AND LGPL-2.0-or-later AND Unicode-3.0 AND GFDL-1.1-or-later AND GPL-1.0-or-later AND FSFUL AND MIT AND Inner-Net-2.0 AND X11 AND GPL-2.0-or-later WITH GCC-exception-2.0 AND GFDL-1.3-only AND GFDL-1.1-only AND GPL-3.0-or-later AND GPL-3.0-or-later WITH Autoconf-exception-generic-3.0 AND GPL-3.0-or-later WITH Texinfo-exception |
| glibmm2.68 | 2.88.1-1.fc44 | LGPL-2.1-or-later AND GPL-2.0-or-later |
| glib-networking | 2.80.1-4.fc44 | LGPL-2.1-or-later WITH cryptsetup-OpenSSL-exception |
| glx-utils | 9.0.0-11.fc44 | MIT |
| glycin-libs | 2.1.5-1.fc44 | (MPL-2.0 OR LGPL-2.1-or-later) AND Apache-2.0 WITH LLVM-exception AND BSD-3-Clause AND CC0-1.0 AND GPL-3.0-or-later AND IJG AND ISC AND MIT AND Unicode-3.0 AND Unicode-DFS-2016 AND (0BSD OR MIT OR Apache-2.0) AND (Apache-2.0 OR MIT) AND (Apache-2.0 WITH LLVM-exception OR Apache-2.0 OR MIT) AND (BSD-2-Clause OR Apache-2.0 OR MIT) AND (BSD-3-Clause OR Apache-2.0) AND (MIT OR Apache-2.0 OR Zlib) AND (Unlicense OR MIT) |
| glycin-loaders | 2.1.5-1.fc44 | (MPL-2.0 OR LGPL-2.1-or-later) AND Apache-2.0 WITH LLVM-exception AND BSD-3-Clause AND CC0-1.0 AND GPL-3.0-or-later AND IJG AND ISC AND MIT AND Unicode-3.0 AND Unicode-DFS-2016 AND (0BSD OR MIT OR Apache-2.0) AND (Apache-2.0 OR MIT) AND (Apache-2.0 WITH LLVM-exception OR Apache-2.0 OR MIT) AND (BSD-2-Clause OR Apache-2.0 OR MIT) AND (BSD-3-Clause OR Apache-2.0) AND (MIT OR Apache-2.0 OR Zlib) AND (Unlicense OR MIT) |
| gmp | 6.3.0-5.fc44 | (LGPL-3.0-or-later OR GPL-2.0-or-later OR (LGPL-3.0-or-later AND GPL-2.0-or-later)) AND GFDL-1.3-invariants-or-later |
| gnome-disk-utility | 46.1-4.fc44 | GPL-2.0-or-later AND CC0-1.0 |
| gnome-icon-theme | 3.12.0-27.fc44 | LGPL-3.0-or-later |
| gnulib-l10n | 20241231-2.fc44 | LGPL-2.1-or-later |
| gnupg2 | 2.4.9-16.fc44 | CC0-1.0 AND GPL-2.0-or-later AND GPL-3.0-or-later AND LGPL-2.1-or-later AND LGPL-3.0-or-later AND (BSD-3-Clause OR LGPL-3.0-or-later OR GPL-2.0-or-later) AND CC-BY-4.0 AND MIT |
| gnupg2-dirmngr | 2.4.9-16.fc44 | CC0-1.0 AND GPL-2.0-or-later AND GPL-3.0-or-later AND LGPL-2.1-or-later AND LGPL-3.0-or-later AND (BSD-3-Clause OR LGPL-3.0-or-later OR GPL-2.0-or-later) AND CC-BY-4.0 AND MIT |
| gnupg2-gpg-agent | 2.4.9-16.fc44 | CC0-1.0 AND GPL-2.0-or-later AND GPL-3.0-or-later AND LGPL-2.1-or-later AND LGPL-3.0-or-later AND (BSD-3-Clause OR LGPL-3.0-or-later OR GPL-2.0-or-later) AND CC-BY-4.0 AND MIT |
| gnupg2-gpgconf | 2.4.9-16.fc44 | CC0-1.0 AND GPL-2.0-or-later AND GPL-3.0-or-later AND LGPL-2.1-or-later AND LGPL-3.0-or-later AND (BSD-3-Clause OR LGPL-3.0-or-later OR GPL-2.0-or-later) AND CC-BY-4.0 AND MIT |
| gnupg2-keyboxd | 2.4.9-16.fc44 | CC0-1.0 AND GPL-2.0-or-later AND GPL-3.0-or-later AND LGPL-2.1-or-later AND LGPL-3.0-or-later AND (BSD-3-Clause OR LGPL-3.0-or-later OR GPL-2.0-or-later) AND CC-BY-4.0 AND MIT |
| gnupg2-scdaemon | 2.4.9-16.fc44 | CC0-1.0 AND GPL-2.0-or-later AND GPL-3.0-or-later AND LGPL-2.1-or-later AND LGPL-3.0-or-later AND (BSD-3-Clause OR LGPL-3.0-or-later OR GPL-2.0-or-later) AND CC-BY-4.0 AND MIT |
| gnupg2-verify | 2.4.9-16.fc44 | CC0-1.0 AND GPL-2.0-or-later AND GPL-3.0-or-later AND LGPL-2.1-or-later AND LGPL-3.0-or-later AND (BSD-3-Clause OR LGPL-3.0-or-later OR GPL-2.0-or-later) AND CC-BY-4.0 AND MIT |
| gnustep-base-libs | 1.31.0-8.fc44 | GPL-3.0-or-later AND LGPL-2.0-or-later |
| gnustep-filesystem | 2.9.3-4.fc44 | LicenseRef-Not-Copyrightable |
| gnustep-make | 2.9.3-4.fc44 | GPL-3.0-or-later |
| gnutls | 3.8.13-1.fc44 | GPL-3.0-or-later AND LGPL-2.1-or-later |
| gnutls-dane | 3.8.13-1.fc44 | GPL-3.0-or-later AND LGPL-2.1-or-later |
| gobject-introspection | 1.86.0-3.fc44 | GPL-2.0-or-later AND LGPL-2.0-or-later AND LGPL-2.1-or-later AND BSD-2-Clause |
| gocryptfs | 2.6.1-5.fc44 | Apache-2.0 AND BSD-2-Clause AND BSD-3-Clause AND MIT |
| google-carlito-fonts | 1.103-0.28.20130920.fc44 | OFL-1.1 |
| google-crosextra-caladea-fonts | 1.002-0.22.20130214.fc44 | Apache-2.0 |
| google-droid-sans-fonts | 20200215-24.fc44 | Apache-2.0 |
| google-noto-color-emoji-fonts | 20250623-4.fc44 | OFL-1.1 AND Apache-2.0 |
| google-noto-emoji-fonts | 20250623-4.fc44 | OFL-1.1 AND Apache-2.0 |
| google-noto-fonts-common | 20251201-2.fc44 | OFL-1.1 |
| google-noto-naskh-arabic-vf-fonts | 20251201-2.fc44 | OFL-1.1 |
| google-noto-sans-arabic-vf-fonts | 20251201-2.fc44 | OFL-1.1 |
| google-noto-sans-armenian-vf-fonts | 20251201-2.fc44 | OFL-1.1 |
| google-noto-sans-bengali-vf-fonts | 20251201-2.fc44 | OFL-1.1 |
| google-noto-sans-canadian-aboriginal-vf-fonts | 20251201-2.fc44 | OFL-1.1 |
| google-noto-sans-cherokee-vf-fonts | 20251201-2.fc44 | OFL-1.1 |
| google-noto-sans-devanagari-vf-fonts | 20251201-2.fc44 | OFL-1.1 |
| google-noto-sans-ethiopic-vf-fonts | 20251201-2.fc44 | OFL-1.1 |
| google-noto-sans-fonts | 20251201-2.fc44 | OFL-1.1 |
| google-noto-sans-georgian-vf-fonts | 20251201-2.fc44 | OFL-1.1 |
| google-noto-sans-gothic-fonts | 20251201-2.fc44 | OFL-1.1 |
| google-noto-sans-gujarati-vf-fonts | 20251201-2.fc44 | OFL-1.1 |
| google-noto-sans-gurmukhi-vf-fonts | 20251201-2.fc44 | OFL-1.1 |
| google-noto-sans-hebrew-vf-fonts | 20251201-2.fc44 | OFL-1.1 |
| google-noto-sans-kannada-vf-fonts | 20251201-2.fc44 | OFL-1.1 |
| google-noto-sans-khmer-vf-fonts | 20251201-2.fc44 | OFL-1.1 |
| google-noto-sans-lao-vf-fonts | 20251201-2.fc44 | OFL-1.1 |
| google-noto-sans-math-fonts | 20251201-2.fc44 | OFL-1.1 |
| google-noto-sans-meetei-mayek-vf-fonts | 20251201-2.fc44 | OFL-1.1 |
| google-noto-sans-mono-fonts | 20251201-2.fc44 | OFL-1.1 |
| google-noto-sans-mono-vf-fonts | 20251201-2.fc44 | OFL-1.1 |
| google-noto-sans-nko-fonts | 20251201-2.fc44 | OFL-1.1 |
| google-noto-sans-ol-chiki-vf-fonts | 20251201-2.fc44 | OFL-1.1 |
| google-noto-sans-oriya-vf-fonts | 20251201-2.fc44 | OFL-1.1 |
| google-noto-sans-sinhala-vf-fonts | 20251201-2.fc44 | OFL-1.1 |
| google-noto-sans-symbols-2-fonts | 20251201-2.fc44 | OFL-1.1 |
| google-noto-sans-symbols-vf-fonts | 20251201-2.fc44 | OFL-1.1 |
| google-noto-sans-syriac-vf-fonts | 20251201-2.fc44 | OFL-1.1 |
| google-noto-sans-tamil-vf-fonts | 20251201-2.fc44 | OFL-1.1 |
| google-noto-sans-telugu-vf-fonts | 20251201-2.fc44 | OFL-1.1 |
| google-noto-sans-thaana-vf-fonts | 20251201-2.fc44 | OFL-1.1 |
| google-noto-sans-thai-vf-fonts | 20251201-2.fc44 | OFL-1.1 |
| google-noto-sans-vf-fonts | 20251201-2.fc44 | OFL-1.1 |
| google-noto-sans-yi-fonts | 20251201-2.fc44 | OFL-1.1 |
| google-noto-serif-armenian-vf-fonts | 20251201-2.fc44 | OFL-1.1 |
| google-noto-serif-bengali-vf-fonts | 20251201-2.fc44 | OFL-1.1 |
| google-noto-serif-devanagari-vf-fonts | 20251201-2.fc44 | OFL-1.1 |
| google-noto-serif-ethiopic-vf-fonts | 20251201-2.fc44 | OFL-1.1 |
| google-noto-serif-fonts | 20251201-2.fc44 | OFL-1.1 |
| google-noto-serif-georgian-vf-fonts | 20251201-2.fc44 | OFL-1.1 |
| google-noto-serif-gujarati-vf-fonts | 20251201-2.fc44 | OFL-1.1 |
| google-noto-serif-gurmukhi-vf-fonts | 20251201-2.fc44 | OFL-1.1 |
| google-noto-serif-hebrew-vf-fonts | 20251201-2.fc44 | OFL-1.1 |
| google-noto-serif-kannada-vf-fonts | 20251201-2.fc44 | OFL-1.1 |
| google-noto-serif-khmer-vf-fonts | 20251201-2.fc44 | OFL-1.1 |
| google-noto-serif-lao-vf-fonts | 20251201-2.fc44 | OFL-1.1 |
| google-noto-serif-oriya-vf-fonts | 20251201-2.fc44 | OFL-1.1 |
| google-noto-serif-sinhala-vf-fonts | 20251201-2.fc44 | OFL-1.1 |
| google-noto-serif-tamil-vf-fonts | 20251201-2.fc44 | OFL-1.1 |
| google-noto-serif-telugu-vf-fonts | 20251201-2.fc44 | OFL-1.1 |
| google-noto-serif-thai-vf-fonts | 20251201-2.fc44 | OFL-1.1 |
| google-noto-serif-vf-fonts | 20251201-2.fc44 | OFL-1.1 |
| google-tinos-fonts | 1.31.0-23.fc44 | Apache-2.0 |
| gpgme | 2.0.1-5.fc44 | LGPL-2.1-or-later AND MIT |
| gpgmepp | 2.0.1-5.fc44 | LGPL-2.1-or-later AND MIT |
| gpg-pubkey | 36f612dcf27f7d1a48a835e4dbfcf71c6d9f90a6-6786af3b | pubkey |
| gpg-pubkey | 47d32a74e9a9e013a4b4926c68d513d36a73cd96-67d85d73 | pubkey |
| gpg-pubkey | 56f49901ab19baf099a95a76c3de1dd4f661cdcb-63ab09ad | pubkey |
| gpg-pubkey | 8c1f16ab24df8f75c1cf56595929a141e0e87f1f-67d85d48 | pubkey |
| gpg-pubkey | b2a3dca350e67256740df904de4ec67be4b0dca0-688887bb | pubkey |
| gpg-pubkey | b721e073b7ef8e56acc6b23ecbc67d2399225ccf-68908a61 | pubkey |
| gpg-pubkey | dbf1a116c220b8c7164f98230686b78420038257-63ab09c9 | pubkey |
| gpsd-libs | 3.27.5-5.fc44 | BSD-2-Clause |
| graphene | 1.10.8-4.fc44 | MIT |
| graphite2 | 1.3.14-20.fc44 | LGPL-2.1-or-later OR MPL-2.0 OR GPL-2.0-or-later |
| graphviz-libs | 14.1.4-2.fc44 | epl-1.0 AND cpl-1.0 AND bsd-3-clause AND mit AND gpl-3.0-or-later WITH bison-exception-2.2 AND apache-1.1 AND lgpl-2.0-or-later WITH libtool-exception AND smlnj AND hpnd-uc |
| grep | 3.12-3.fc44 | GPL-3.0-or-later AND LGPL-3.0-or-later AND LGPL-2.1-or-later AND GPL-2.0-or-later AND LGPL-2.0-or-later AND GFDL-1.3-no-invariants-or-later |
| grim | 1.5.0-3.fc44 | MIT |
| groff-base | 1.23.0-12.fc44 | GPL-3.0-or-later AND GFDL-1.3-or-later AND BSD-4-Clause-UC AND MIT AND X11 AND LicenseRef-Fedora-Public-Domain |
| grub2-common | 2.12-64.fc44 | GPL-3.0-or-later |
| grub2-efi-ia32 | 2.12-64.fc44 | GPL-3.0-or-later |
| grub2-efi-x64 | 2.12-64.fc44 | GPL-3.0-or-later |
| grub2-pc | 2.12-64.fc44 | GPL-3.0-or-later |
| grub2-pc-modules | 2.12-64.fc44 | GPL-3.0-or-later |
| grub2-tools | 2.12-64.fc44 | GPL-3.0-or-later |
| grub2-tools-minimal | 2.12-64.fc44 | GPL-3.0-or-later |
| gsettings-desktop-schemas | 50.1-1.fc44 | LGPL-2.1-or-later |
| gsm | 1.0.24-2.fc44 | tu-berlin-2.0 |
| gssdp | 1.6.6-1.fc44 | LicenseRef-Callaway-LGPLv2+ |
| gssproxy | 0.9.2-10.fc44 | MIT |
| gstreamer1 | 1.28.6-1.fc44 | LGPL-2.1-or-later |
| gstreamer1-plugin-dav1d | 0.15.0-1.fc44 | MIT AND (Apache-2.0 OR MIT) AND (Unlicense OR MIT) |
| gstreamer1-plugin-libav | 1.28.6-1.fc44 | LGPLv2+ |
| gstreamer1-plugins-bad-free | 1.28.6-1.fc44 | LGPL-2.1-or-later AND LGPL-2.0-or-later AND (MIT OR LGPL-2.1-or-later) AND MPL-1.1 AND BSD-2-Clause AND BSD-3-Clause AND BSD-2-Clause-Views AND (BSD-2-Clause AND DOC) AND MIT-Festival AND (LGPL-2.0-or-later AND LicenseRef-Fedora-Public-Domain) AND (MPL-1.1 OR LGPL-2.0-or-later OR MIT) AND BSD-3-Clause WITH AdditionRef-Dart AND MIT AND GPL-2.0-only WITH Linux-syscall-note |
| gstreamer1-plugins-bad-free-libs | 1.28.6-1.fc44 | LGPL-2.1-or-later AND LGPL-2.0-or-later AND (MIT OR LGPL-2.1-or-later) AND MPL-1.1 AND BSD-2-Clause AND BSD-3-Clause AND BSD-2-Clause-Views AND (BSD-2-Clause AND DOC) AND MIT-Festival AND (LGPL-2.0-or-later AND LicenseRef-Fedora-Public-Domain) AND (MPL-1.1 OR LGPL-2.0-or-later OR MIT) AND BSD-3-Clause WITH AdditionRef-Dart AND MIT AND GPL-2.0-only WITH Linux-syscall-note |
| gstreamer1-plugins-base | 1.28.6-1.fc44 | LGPL-2.1-or-later |
| gstreamer1-plugins-good | 1.28.6-1.fc44 | CC0-1.0 AND GPL-2.0-only AND LGPL-2.0-only AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-2.1-or-later AND xlock AND MIT AND BSD-3-Clause AND CC-BY-3.0 |
| gstreamer1-plugins-good-qt6 | 1.28.6-1.fc44 | CC0-1.0 AND GPL-2.0-only AND LGPL-2.0-only AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-2.1-or-later AND xlock AND MIT AND BSD-3-Clause AND CC-BY-3.0 |
| gstreamer1-plugins-ugly-free | 1.28.6-1.fc44 | LGPL-2.0-or-later AND LGPL-2.1-or-later AND CC0-1.0 |
| gtk3 | 3.24.52-2.fc44 | LGPL-2.0-or-later |
| gtk4 | 4.22.4-1.fc44 | LGPL-2.0-or-later AND LGPL-2.1-or-later AND Apache-2.0 AND CC0-1.0 AND MIT AND MIT-open-group AND HPND-sell-variant AND GPL-2.0-or-later AND GPL-3.0-or-later AND OFL-1.1 |
| gtkmm4.0 | 4.22.0-1.fc44 | LGPL-2.1-or-later |
| gtk-update-icon-cache | 3.24.52-2.fc44 | LGPL-2.0-or-later |
| gupnp | 1.6.10-1.fc44 | LGPL-2.1-or-later |
| gupnp-igd | 1.6.0-8.fc44 | LGPL-2.1-or-later |
| gutenprint | 5.3.5-7.fc44 | GPL-2.0-or-later AND LGPL-2.0-or-later AND MIT AND GPL-3.0-or-later WITH Bison-exception-2.2 |
| gutenprint-cups | 5.3.5-7.fc44 | GPL-2.0-or-later AND LGPL-2.0-or-later AND MIT AND GPL-3.0-or-later WITH Bison-exception-2.2 |
| gutenprint-libs | 5.3.5-7.fc44 | GPL-2.0-or-later AND LGPL-2.0-or-later AND MIT AND GPL-3.0-or-later WITH Bison-exception-2.2 |
| gvfs | 1.60.2-1.fc44 | LGPL-2.0-or-later AND GPL-3.0-only AND MPL-2.0 AND BSD-3-Clause-Sun |
| gvfs-client | 1.60.2-1.fc44 | LGPL-2.0-or-later AND GPL-3.0-only AND MPL-2.0 AND BSD-3-Clause-Sun |
| gvfs-smb | 1.60.2-1.fc44 | LGPL-2.0-or-later AND GPL-3.0-only AND MPL-2.0 AND BSD-3-Clause-Sun |
| gwenview | 26.08.0-1.fc44 | GPL-2.0-or-later AND IJG AND LGPL-2.1-or-later AND MIT AND (GPL-2.0-only OR GPL-3.0-only) |
| gwenview-libs | 26.08.0-1.fc44 | IJG AND MIT AND LGPL-2.1-or-later AND (GPL-2.0-only OR GPL-3.0-only) |
| gzip | 1.14-2.fc44 | GPL-3.0-or-later AND GFDL-1.3-only |
| harfbuzz | 14.1.0-2.fc44 | MIT-Modern-Variant |
| harfbuzz-icu | 14.1.0-2.fc44 | MIT-Modern-Variant |
| hdparm | 9.65-10.fc44 | hdparm |
| hfsplus-tools | 540.1.linux3-36.fc44 | APSL-2.0 |
| hfsutils | 3.2.6-57.fc44 | GPL-2.0-or-later |
| hicolor-icon-theme | 0.18-3.fc44 | GPL-2.0-or-later |
| hidapi | 0.15.0-3.fc44 | GPL-3.0-only OR BSD-3-Clause |
| highway | 1.3.0-2.fc44 | Apache-2.0 |
| hiredis | 1.2.0-8.fc44 | LicenseRef-Callaway-BSD |
| hostname | 3.25-4.fc44 | GPL-2.0-or-later |
| hplip | 3.26.4-7.fc44 | GPL-2.0-or-later AND MIT AND BSD-3-Clause-HP AND IJG AND GPL-2.0-only AND LGPL-2.1-or-later AND BSD-2-Clause AND LicenseRef-Fedora-Public-Domain AND python-ldap |
| hplip-common | 3.26.4-7.fc44 | GPL-2.0-or-later AND MIT AND BSD-3-Clause-HP AND IJG AND GPL-2.0-only AND LGPL-2.1-or-later AND BSD-2-Clause AND LicenseRef-Fedora-Public-Domain AND python-ldap |
| hplip-libs | 3.26.4-7.fc44 | GPL-2.0-or-later AND MIT AND BSD-3-Clause-HP AND IJG AND GPL-2.0-only AND LGPL-2.1-or-later AND BSD-2-Clause AND LicenseRef-Fedora-Public-Domain AND python-ldap |
| hunspell | 1.7.3-1.fc44 | LGPL-2.1-or-later OR GPL-2.0-or-later OR MPL-1.1 |
| hunspell-en | 0.20260225-2.fc44 | LGPL-2.1-or-later AND LGPL-2.1-only AND BSD-3-Clause-Modification |
| hunspell-en-AU | 0.20260225-2.fc44 | LGPL-2.1-or-later AND LGPL-2.1-only AND BSD-3-Clause-Modification |
| hunspell-en-CA | 0.20260225-2.fc44 | LGPL-2.1-or-later AND LGPL-2.1-only AND BSD-3-Clause-Modification |
| hunspell-en-GB | 0.20260225-2.fc44 | LGPL-2.1-or-later AND LGPL-2.1-only AND BSD-3-Clause-Modification |
| hunspell-en-US | 0.20260225-2.fc44 | LGPL-2.1-or-later AND LGPL-2.1-only AND BSD-3-Clause-Modification |
| hunspell-filesystem | 1.7.3-1.fc44 | LGPL-2.1-or-later OR GPL-2.0-or-later OR MPL-1.1 |
| hwdata | 0.410-1.fc44 | GPL-2.0-or-later |
| hyperv-daemons | 6.10-3.fc44 | GPL-2.0-only |
| hyperv-daemons-license | 6.10-3.fc44 | GPL-2.0-only |
| hypervfcopyd | 6.10-3.fc44 | GPL-2.0-only |
| hypervkvpd | 6.10-3.fc44 | GPL-2.0-only |
| hypervvssd | 6.10-3.fc44 | GPL-2.0-only |
| hyphen | 2.8.8-28.fc44 | GPL-2.0-only OR LGPL-2.1-or-later OR MPL-1.1 |
| hyphen-en | 2.8.8-28.fc44 | GPL-2.0-only OR LGPL-2.1-or-later OR MPL-1.1 |
| i2c-tools | 4.4-4.fc44 | GPL-2.0-or-later |
| ibm-plex-sans-fonts | 20260526-1.fc44 | OFL-1.1 |
| ibus | 1.5.34-4.fc44 | LGPL-2.1-or-later |
| ibus-anthy | 1.5.18-2.fc44 | GPL-2.0-or-later |
| ibus-anthy-python | 1.5.18-2.fc44 | GPL-2.0-or-later |
| ibus-chewing | 2.1.7-2.fc44 | GPL-2.0-or-later |
| ibus-gtk3 | 1.5.34-4.fc44 | LGPL-2.1-or-later |
| ibus-gtk4 | 1.5.34-4.fc44 | LGPL-2.1-or-later |
| ibus-hangul | 1.5.5-12.fc44 | GPL-2.0-or-later |
| ibus-libpinyin | 1.16.5-3.fc44 | GPL-3.0-or-later |
| ibus-libs | 1.5.34-4.fc44 | LGPL-2.1-or-later |
| ibus-m17n | 1.4.39-1.fc44 | GPL-2.0-or-later |
| ibus-panel | 1.5.34-4.fc44 | LGPL-2.1-or-later |
| ibus-setup | 1.5.34-4.fc44 | LGPL-2.1-or-later |
| ibus-typing-booster | 2.30.11-1.fc44 | GPL-3.0-or-later AND Apache-2.0 |
| iio-sensor-proxy | 3.8-2.fc44 | GPL-3.0-or-later |
| ilbc | 3.0.4-19.fc44 | BSD-3-Clause |
| ima-evm-utils-libs | 1.6.2-8.fc44 | LGPL-2.0-or-later |
| ImageMagick | 7.1.2.27-1.fc44 | ImageMagick |
| ImageMagick-libs | 7.1.2.27-1.fc44 | ImageMagick |
| imath | 3.1.12-6.fc44 | BSD-3-Clause |
| inih | 62-2.fc44 | BSD-3-Clause |
| inih-cpp | 62-2.fc44 | BSD-3-Clause |
| initscripts-service | 10.27-2.fc44 | GPL-2.0-only |
| intel-audio-firmware | 20260810-1.fc44 | LicenseRef-Callaway-Redistributable-no-modification-permitted |
| intel-gmmlib | 22.10.1-1.fc44 | MIT AND BSD-3-Clause |
| intel-gpu-firmware | 20260810-1.fc44 | LicenseRef-Callaway-Redistributable-no-modification-permitted |
| intel-lpmd | 0.1.0-2.fc44 | GPL-2.0-or-later |
| intel-mediasdk | 23.2.2-11.fc44 | MIT |
| intel-vpl-gpu-rt | 26.1.6-1.fc44 | MIT |
| intel-vsc-firmware | 20260810-1.fc44 | LicenseRef-Callaway-Redistributable-no-modification-permitted |
| ipp-usb | 0.9.34-2.fc44 | BSD-2-Clause |
| iproute | 6.17.0-2.fc44 | GPL-2.0-or-later AND NIST-PD |
| ipset | 7.24-3.fc44 | GPL-2.0-only |
| ipset-libs | 7.24-3.fc44 | GPL-2.0-only |
| iptables-libs | 1.8.11-13.fc44 | GPL-2.0-only AND Artistic-2.0 AND ISC |
| iptables-nft | 1.8.11-13.fc44 | GPL-2.0-only AND Artistic-2.0 AND ISC |
| iptstate | 2.3.0-1.fc44 | zlib |
| iputils | 20250605-2.fc44 | BSD-4-Clause-UC AND GPL-2.0-or-later |
| iso-codes | 4.20.1-3.fc44 | LGPL-2.1-or-later |
| iw | 6.17-2.fc44 | ISC AND LicenseRef-Fedora-Public-Domain |
| iwlegacy-firmware | 20260810-1.fc44 | LicenseRef-Callaway-Redistributable-no-modification-permitted |
| iwlwifi-dvm-firmware | 20260810-1.fc44 | LicenseRef-Callaway-Redistributable-no-modification-permitted |
| iwlwifi-mld-firmware | 20260810-1.fc44 | LicenseRef-Callaway-Redistributable-no-modification-permitted |
| iwlwifi-mvm-firmware | 20260810-1.fc44 | LicenseRef-Callaway-Redistributable-no-modification-permitted |
| jansson | 2.14-4.fc44 | MIT AND LicenseRef-Fedora-Public-Domain |
| jasper-libs | 4.2.8-2.fc44 | JasPer-2.0 |
| java-25-openjdk-crypto-adapter | 25.0.4.1.1-1.1.fc44 | Apache-1.1 AND Apache-2.0 AND LicenseRef-Callaway-BSD AND LicenseRef-Callaway-BSD-with-advertising AND GPL-1.0-or-later AND GPL-2.0-only AND LicenseRef-Callaway-GPLv2-with-exceptions AND IJG AND LicenseRef-Callaway-LGPLv2+ AND LicenseRef-Callaway-MIT AND MPL-2.0 AND LicenseRef-Callaway-Public-Domain AND W3C AND Zlib AND ISC AND FTL AND LicenseRef-RSA |
| java-25-openjdk-headless | 25.0.4.1.1-1.1.fc44 | Apache-1.1 AND Apache-2.0 AND LicenseRef-Callaway-BSD AND LicenseRef-Callaway-BSD-with-advertising AND GPL-1.0-or-later AND GPL-2.0-only AND LicenseRef-Callaway-GPLv2-with-exceptions AND IJG AND LicenseRef-Callaway-LGPLv2+ AND LicenseRef-Callaway-MIT AND MPL-2.0 AND LicenseRef-Callaway-Public-Domain AND W3C AND Zlib AND ISC AND FTL AND LicenseRef-RSA |
| javapackages-filesystem | 6.4.1-10.fc44 | BSD-3-Clause |
| jbig2dec-libs | 0.20-8.fc44 | AGPL-3.0-or-later |
| jbigkit-libs | 2.1-33.fc44 | GPL-2.0-or-later |
| jetbrains-mono-fonts | 2.304-10.fc44 | OFL-1.1 |
| jfsutils | 1.1.15-32.fc44 | GPL-2.0-or-later |
| jitterentropy | 3.7.0-3.fc44 | BSD-3-Clause OR GPL-2.0-only |
| jomolhari-fonts | 0.003-45.fc44 | OFL-1.1 |
| jq | 1.8.1-3.fc44 | MIT AND ICU AND CC-BY-3.0 |
| json-c | 0.18-8.fc44 | MIT |
| jsoncpp | 1.9.6-3.fc44 | LicenseRef-Fedora-Public-Domain OR MIT |
| json-glib | 1.10.8-5.fc44 | LGPL-2.1-or-later |
| kaccounts-integration-qt6 | 26.08.0-1.fc44 | CC0-1.0 AND GPL-2.0-only AND GPL-2.0-or-later AND GPL-3.0-only AND LGPL-2.0-or-later |
| kaccounts-providers | 26.08.0-1.fc44 | GPL-2.0-only |
| kactivitymanagerd | 6.7.4-1.fc44 | CC0-1.0 AND GPL-2.0-only AND GPL-2.0-or-later AND GPL-3.0-only AND LGPL-2.1-only AND LGPL-3.0-only AND (GPL-2.0-only OR GPL-3.0-only) AND (LGPL-2.1-only OR LGPL-3.0-only) |
| kamera | 26.08.0-1.fc44 | GPL-2.0-only |
| kasumi-common | 2.5-50.fc44 | GPL-2.0-or-later |
| kasumi-unicode | 2.5-50.fc44 | GPL-2.0-or-later |
| kate | 26.08.0-1.fc44 | LGPL-2.0-only AND LGPL-2.0-or-later AND GPL-2.0-or-later |
| kate-libs | 26.08.0-1.fc44 | LGPL-2.0-only AND LGPL-2.0-or-later AND GPL-2.0-or-later |
| kbd | 2.9.0-3.fc44 | GPL-2.0-or-later |
| kbd-legacy | 2.9.0-3.fc44 | GPL-2.0-or-later |
| kbd-misc | 2.9.0-3.fc44 | GPL-2.0-or-later |
| kcalc | 26.08.0-1.fc44 | GPL-2.0-or-later |
| kcharselect | 26.08.0-1.fc44 | GPL-2.0-or-later |
| kcm-plasma-keyboard | 6.7.4-1.fc44 | LGPL-2.1-only AND GPL-2.0-only AND CC0-1.0 AND LGPL-3.0-only AND GPL-3.0-or-later AND GPL-2.0-or-later AND GPL-3.0-only |
| kcm-plasmalogin | 6.7.4-1.fc44 | BSD-3-Clause and CC0-1.0 and (GPL-2.0-only or GPL-3.0-only) and GPL-2.0-or-later and LGPL-2.0-or-later and LGPL-2.1-or-later |
| kcolorpicker-qt6 | 0.3.0-7.fc44 | LGPL-3.0-or-later |
| kdebugsettings | 26.08.0-1.fc44 | LicenseRef-Callaway-LGPLv2+ |
| kde-cli-tools | 6.7.4-1.fc44 | Artistic-2.0 AND GPL-2.0-only AND GPL-2.0-or-later AND GPL-3.0-only AND LGPL-2.0-only AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-2.1-only AND LGPL-3.0-only AND (GPL-2.0-only OR GPL-3.0-only) AND (LGPL-2.1-only OR LGPL-3.0-only) |
| kde-connect | 26.08.0-1.fc44 | GPL-2.0-or-later |
| kdeconnectd | 26.08.0-1.fc44 | GPL-2.0-or-later |
| kde-connect-libs | 26.08.0-1.fc44 | GPL-2.0-or-later |
| kdecoration | 6.7.4-1.fc44 | LGPL-3.0-only AND LGPL-2.1-only AND CC0-1.0 |
| kde-filesystem | 5-7.fc44 | LicenseRef-Not-Copyrightable |
| kdegraphics-mobipocket | 26.08.0-1.fc44 | GPL-2.0-or-later AND CC0-1.0 AND LGPL-2.1-or-later |
| kdegraphics-thumbnailers | 26.08.0-1.fc44 | GPL-2.0-or-later |
| kde-gtk-config | 6.7.4-1.fc44 | BSD-2-Clause AND BSD-3-Clause AND CC0-1.0 AND GPL-2.0-only AND GPL-2.0-or-later AND GPL-3.0-only AND (GPL-2.0-only OR GPL-3.0-only) |
| kde-inotify-survey | 26.08.0-1.fc44 | BSD-3-Clause and CC0-1.0 and FSFAP and GPL-2.0-only and GPL-3.0-only |
| kdenetwork-filesharing | 26.08.0-1.fc44 | BSD-3-Clause AND CC0-1.0 AND GPL-2.0-only AND GPL-2.0-or-later AND GPL-3.0-only AND LGPL-2.1-only AND LGPL-3.0-only |
| kde-partitionmanager | 26.08.0-1.fc44 | GPL-3.0-or-later AND LGPL-3.0-or-later AND MIT AND CC-BY-4.0 AND CC0-1.0 AND GFDL-1.2-or-later |
| kdeplasma-addons | 6.7.4-1.fc44 | BSD-3-Clause AND CC0-1.0 AND GPL-2.0-only AND GPL-2.0-or-later AND GPL-3.0-only AND GPL-3.0-or-later AND LGPL-2.0-only AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-2.1-or-later AND LGPL-3.0-only AND LGPL-3.0-or-later AND (GPL-2.0-only OR GPL-3.0-only) AND (LGPL-2.1-only OR LGPL-3.0-only) AND MIT AND Unicode-3.0 AND (Apache-2.0 OR MIT) AND (Apache-2.0 WITH LLVM-exception OR Apache-2.0 OR MIT) AND (BSD-3-Clause OR MIT OR Apache-2.0) |
| kde-settings | 44.0-1.fc44 | MIT |
| kde-settings-plasma | 44.0-1.fc44 | MIT |
| kde-settings-plasmalogin | 44.0-1.fc44 | MIT |
| kde-settings-pulseaudio | 44.0-1.fc44 | LicenseRef-Not-Copyrightable |
| kdesu | 6.7.4-1.fc44 | Artistic-2.0 AND GPL-2.0-only AND GPL-2.0-or-later AND GPL-3.0-only AND LGPL-2.0-only AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-2.1-only AND LGPL-3.0-only AND (GPL-2.0-only OR GPL-3.0-only) AND (LGPL-2.1-only OR LGPL-3.0-only) |
| kdialog | 26.08.0-1.fc44 | GPL-2.0-or-later AND LicenseRef-Callaway-GFDL |
| kdnssd | 26.08.0-1.fc44 | GPL-2.0-or-later AND LGPL-2.0-only |
| kdsingleapplication-qt6 | 1.1.0-14.fc44 | MIT |
| kdsoap6 | 2.2.0-9.fc44 | MIT |
| kdsoap-ws-discovery-client | 0.4.0-6.fc44 | GPL-3.0-or-later AND LicenseRef-OASIS AND LicenseRef-WS-Addressing AND LicenseRef-Discovery AND W3C |
| keditbookmarks | 26.08.0-1.fc44 | GPL-2.0-only AND GPL-3.0-only AND LicenseRef-Callaway-GFDL |
| keditbookmarks-libs | 26.08.0-1.fc44 | GPL-2.0-only AND GPL-3.0-only AND LicenseRef-Callaway-GFDL |
| keepassxc | 2.7.12-1.fc44 | BSL-1.0 AND LicenseRef-Callaway-BSD AND CC0-1.0 AND GPL-3.0-only AND LicenseRef-Callaway-LGPLv2 AND LicenseRef-Callaway-LGPLv2+ AND LGPL-3.0-or-later AND LicenseRef-Callaway-Public-Domain |
| kernel | 7.1.10-200.fc44 | ((GPL-2.0-only WITH Linux-syscall-note) OR BSD-2-Clause) AND ((GPL-2.0-only WITH Linux-syscall-note) OR BSD-3-Clause) AND ((GPL-2.0-only WITH Linux-syscall-note) OR CDDL-1.0) AND ((GPL-2.0-only WITH Linux-syscall-note) OR Linux-OpenIB) AND ((GPL-2.0-only WITH Linux-syscall-note) OR MIT) AND ((GPL-2.0-or-later WITH Linux-syscall-note) OR BSD-3-Clause) AND ((GPL-2.0-or-later WITH Linux-syscall-note) OR MIT) AND 0BSD AND BSD-2-Clause AND (BSD-2-Clause OR Apache-2.0) AND BSD-3-Clause AND BSD-3-Clause-Clear AND CC0-1.0 AND GFDL-1.1-no-invariants-or-later AND GPL-1.0-or-later AND (GPL-1.0-or-later OR BSD-3-Clause) AND (GPL-1.0-or-later WITH Linux-syscall-note) AND GPL-2.0-only AND (GPL-2.0-only OR Apache-2.0) AND (GPL-2.0-only OR BSD-2-Clause) AND (GPL-2.0-only OR BSD-3-Clause) AND (GPL-2.0-only OR CDDL-1.0) AND (GPL-2.0-only OR GFDL-1.1-no-invariants-or-later) AND (GPL-2.0-only OR GFDL-1.2-no-invariants-only) AND (GPL-2.0-only OR GFDL-1.2-no-invariants-or-later) AND (GPL-2.0-only WITH Linux-syscall-note) AND GPL-2.0-or-later AND (GPL-2.0-or-later OR BSD-2-Clause) AND (GPL-2.0-or-later OR BSD-3-Clause) AND (GPL-2.0-or-later OR CC-BY-4.0) AND (GPL-2.0-or-later WITH GCC-exception-2.0) AND (GPL-2.0-or-later WITH Linux-syscall-note) AND ISC AND LGPL-2.0-or-later AND (LGPL-2.0-or-later OR BSD-2-Clause) AND (LGPL-2.0-or-later WITH Linux-syscall-note) AND LGPL-2.1-only AND (LGPL-2.1-only OR BSD-2-Clause) AND (LGPL-2.1-only WITH Linux-syscall-note) AND LGPL-2.1-or-later AND (LGPL-2.1-or-later WITH Linux-syscall-note) AND (Linux-OpenIB OR GPL-2.0-only) AND (Linux-OpenIB OR GPL-2.0-only OR BSD-2-Clause) AND Linux-man-pages-copyleft AND MIT AND (MIT OR Apache-2.0) AND (MIT OR GPL-2.0-only) AND (MIT OR GPL-2.0-or-later) AND (MIT OR LGPL-2.1-only) AND (MPL-1.1 OR GPL-2.0-only) AND (X11 OR GPL-2.0-only) AND (X11 OR GPL-2.0-or-later) AND Zlib AND (copyleft-next-0.3.1 OR GPL-2.0-or-later) |
| kernel-core | 7.1.10-200.fc44 | ((GPL-2.0-only WITH Linux-syscall-note) OR BSD-2-Clause) AND ((GPL-2.0-only WITH Linux-syscall-note) OR BSD-3-Clause) AND ((GPL-2.0-only WITH Linux-syscall-note) OR CDDL-1.0) AND ((GPL-2.0-only WITH Linux-syscall-note) OR Linux-OpenIB) AND ((GPL-2.0-only WITH Linux-syscall-note) OR MIT) AND ((GPL-2.0-or-later WITH Linux-syscall-note) OR BSD-3-Clause) AND ((GPL-2.0-or-later WITH Linux-syscall-note) OR MIT) AND 0BSD AND BSD-2-Clause AND (BSD-2-Clause OR Apache-2.0) AND BSD-3-Clause AND BSD-3-Clause-Clear AND CC0-1.0 AND GFDL-1.1-no-invariants-or-later AND GPL-1.0-or-later AND (GPL-1.0-or-later OR BSD-3-Clause) AND (GPL-1.0-or-later WITH Linux-syscall-note) AND GPL-2.0-only AND (GPL-2.0-only OR Apache-2.0) AND (GPL-2.0-only OR BSD-2-Clause) AND (GPL-2.0-only OR BSD-3-Clause) AND (GPL-2.0-only OR CDDL-1.0) AND (GPL-2.0-only OR GFDL-1.1-no-invariants-or-later) AND (GPL-2.0-only OR GFDL-1.2-no-invariants-only) AND (GPL-2.0-only OR GFDL-1.2-no-invariants-or-later) AND (GPL-2.0-only WITH Linux-syscall-note) AND GPL-2.0-or-later AND (GPL-2.0-or-later OR BSD-2-Clause) AND (GPL-2.0-or-later OR BSD-3-Clause) AND (GPL-2.0-or-later OR CC-BY-4.0) AND (GPL-2.0-or-later WITH GCC-exception-2.0) AND (GPL-2.0-or-later WITH Linux-syscall-note) AND ISC AND LGPL-2.0-or-later AND (LGPL-2.0-or-later OR BSD-2-Clause) AND (LGPL-2.0-or-later WITH Linux-syscall-note) AND LGPL-2.1-only AND (LGPL-2.1-only OR BSD-2-Clause) AND (LGPL-2.1-only WITH Linux-syscall-note) AND LGPL-2.1-or-later AND (LGPL-2.1-or-later WITH Linux-syscall-note) AND (Linux-OpenIB OR GPL-2.0-only) AND (Linux-OpenIB OR GPL-2.0-only OR BSD-2-Clause) AND Linux-man-pages-copyleft AND MIT AND (MIT OR Apache-2.0) AND (MIT OR GPL-2.0-only) AND (MIT OR GPL-2.0-or-later) AND (MIT OR LGPL-2.1-only) AND (MPL-1.1 OR GPL-2.0-only) AND (X11 OR GPL-2.0-only) AND (X11 OR GPL-2.0-or-later) AND Zlib AND (copyleft-next-0.3.1 OR GPL-2.0-or-later) |
| kernel-modules | 7.1.10-200.fc44 | ((GPL-2.0-only WITH Linux-syscall-note) OR BSD-2-Clause) AND ((GPL-2.0-only WITH Linux-syscall-note) OR BSD-3-Clause) AND ((GPL-2.0-only WITH Linux-syscall-note) OR CDDL-1.0) AND ((GPL-2.0-only WITH Linux-syscall-note) OR Linux-OpenIB) AND ((GPL-2.0-only WITH Linux-syscall-note) OR MIT) AND ((GPL-2.0-or-later WITH Linux-syscall-note) OR BSD-3-Clause) AND ((GPL-2.0-or-later WITH Linux-syscall-note) OR MIT) AND 0BSD AND BSD-2-Clause AND (BSD-2-Clause OR Apache-2.0) AND BSD-3-Clause AND BSD-3-Clause-Clear AND CC0-1.0 AND GFDL-1.1-no-invariants-or-later AND GPL-1.0-or-later AND (GPL-1.0-or-later OR BSD-3-Clause) AND (GPL-1.0-or-later WITH Linux-syscall-note) AND GPL-2.0-only AND (GPL-2.0-only OR Apache-2.0) AND (GPL-2.0-only OR BSD-2-Clause) AND (GPL-2.0-only OR BSD-3-Clause) AND (GPL-2.0-only OR CDDL-1.0) AND (GPL-2.0-only OR GFDL-1.1-no-invariants-or-later) AND (GPL-2.0-only OR GFDL-1.2-no-invariants-only) AND (GPL-2.0-only OR GFDL-1.2-no-invariants-or-later) AND (GPL-2.0-only WITH Linux-syscall-note) AND GPL-2.0-or-later AND (GPL-2.0-or-later OR BSD-2-Clause) AND (GPL-2.0-or-later OR BSD-3-Clause) AND (GPL-2.0-or-later OR CC-BY-4.0) AND (GPL-2.0-or-later WITH GCC-exception-2.0) AND (GPL-2.0-or-later WITH Linux-syscall-note) AND ISC AND LGPL-2.0-or-later AND (LGPL-2.0-or-later OR BSD-2-Clause) AND (LGPL-2.0-or-later WITH Linux-syscall-note) AND LGPL-2.1-only AND (LGPL-2.1-only OR BSD-2-Clause) AND (LGPL-2.1-only WITH Linux-syscall-note) AND LGPL-2.1-or-later AND (LGPL-2.1-or-later WITH Linux-syscall-note) AND (Linux-OpenIB OR GPL-2.0-only) AND (Linux-OpenIB OR GPL-2.0-only OR BSD-2-Clause) AND Linux-man-pages-copyleft AND MIT AND (MIT OR Apache-2.0) AND (MIT OR GPL-2.0-only) AND (MIT OR GPL-2.0-or-later) AND (MIT OR LGPL-2.1-only) AND (MPL-1.1 OR GPL-2.0-only) AND (X11 OR GPL-2.0-only) AND (X11 OR GPL-2.0-or-later) AND Zlib AND (copyleft-next-0.3.1 OR GPL-2.0-or-later) |
| kernel-modules-core | 7.1.10-200.fc44 | ((GPL-2.0-only WITH Linux-syscall-note) OR BSD-2-Clause) AND ((GPL-2.0-only WITH Linux-syscall-note) OR BSD-3-Clause) AND ((GPL-2.0-only WITH Linux-syscall-note) OR CDDL-1.0) AND ((GPL-2.0-only WITH Linux-syscall-note) OR Linux-OpenIB) AND ((GPL-2.0-only WITH Linux-syscall-note) OR MIT) AND ((GPL-2.0-or-later WITH Linux-syscall-note) OR BSD-3-Clause) AND ((GPL-2.0-or-later WITH Linux-syscall-note) OR MIT) AND 0BSD AND BSD-2-Clause AND (BSD-2-Clause OR Apache-2.0) AND BSD-3-Clause AND BSD-3-Clause-Clear AND CC0-1.0 AND GFDL-1.1-no-invariants-or-later AND GPL-1.0-or-later AND (GPL-1.0-or-later OR BSD-3-Clause) AND (GPL-1.0-or-later WITH Linux-syscall-note) AND GPL-2.0-only AND (GPL-2.0-only OR Apache-2.0) AND (GPL-2.0-only OR BSD-2-Clause) AND (GPL-2.0-only OR BSD-3-Clause) AND (GPL-2.0-only OR CDDL-1.0) AND (GPL-2.0-only OR GFDL-1.1-no-invariants-or-later) AND (GPL-2.0-only OR GFDL-1.2-no-invariants-only) AND (GPL-2.0-only OR GFDL-1.2-no-invariants-or-later) AND (GPL-2.0-only WITH Linux-syscall-note) AND GPL-2.0-or-later AND (GPL-2.0-or-later OR BSD-2-Clause) AND (GPL-2.0-or-later OR BSD-3-Clause) AND (GPL-2.0-or-later OR CC-BY-4.0) AND (GPL-2.0-or-later WITH GCC-exception-2.0) AND (GPL-2.0-or-later WITH Linux-syscall-note) AND ISC AND LGPL-2.0-or-later AND (LGPL-2.0-or-later OR BSD-2-Clause) AND (LGPL-2.0-or-later WITH Linux-syscall-note) AND LGPL-2.1-only AND (LGPL-2.1-only OR BSD-2-Clause) AND (LGPL-2.1-only WITH Linux-syscall-note) AND LGPL-2.1-or-later AND (LGPL-2.1-or-later WITH Linux-syscall-note) AND (Linux-OpenIB OR GPL-2.0-only) AND (Linux-OpenIB OR GPL-2.0-only OR BSD-2-Clause) AND Linux-man-pages-copyleft AND MIT AND (MIT OR Apache-2.0) AND (MIT OR GPL-2.0-only) AND (MIT OR GPL-2.0-or-later) AND (MIT OR LGPL-2.1-only) AND (MPL-1.1 OR GPL-2.0-only) AND (X11 OR GPL-2.0-only) AND (X11 OR GPL-2.0-or-later) AND Zlib AND (copyleft-next-0.3.1 OR GPL-2.0-or-later) |
| kernel-modules-extra | 7.1.10-200.fc44 | ((GPL-2.0-only WITH Linux-syscall-note) OR BSD-2-Clause) AND ((GPL-2.0-only WITH Linux-syscall-note) OR BSD-3-Clause) AND ((GPL-2.0-only WITH Linux-syscall-note) OR CDDL-1.0) AND ((GPL-2.0-only WITH Linux-syscall-note) OR Linux-OpenIB) AND ((GPL-2.0-only WITH Linux-syscall-note) OR MIT) AND ((GPL-2.0-or-later WITH Linux-syscall-note) OR BSD-3-Clause) AND ((GPL-2.0-or-later WITH Linux-syscall-note) OR MIT) AND 0BSD AND BSD-2-Clause AND (BSD-2-Clause OR Apache-2.0) AND BSD-3-Clause AND BSD-3-Clause-Clear AND CC0-1.0 AND GFDL-1.1-no-invariants-or-later AND GPL-1.0-or-later AND (GPL-1.0-or-later OR BSD-3-Clause) AND (GPL-1.0-or-later WITH Linux-syscall-note) AND GPL-2.0-only AND (GPL-2.0-only OR Apache-2.0) AND (GPL-2.0-only OR BSD-2-Clause) AND (GPL-2.0-only OR BSD-3-Clause) AND (GPL-2.0-only OR CDDL-1.0) AND (GPL-2.0-only OR GFDL-1.1-no-invariants-or-later) AND (GPL-2.0-only OR GFDL-1.2-no-invariants-only) AND (GPL-2.0-only OR GFDL-1.2-no-invariants-or-later) AND (GPL-2.0-only WITH Linux-syscall-note) AND GPL-2.0-or-later AND (GPL-2.0-or-later OR BSD-2-Clause) AND (GPL-2.0-or-later OR BSD-3-Clause) AND (GPL-2.0-or-later OR CC-BY-4.0) AND (GPL-2.0-or-later WITH GCC-exception-2.0) AND (GPL-2.0-or-later WITH Linux-syscall-note) AND ISC AND LGPL-2.0-or-later AND (LGPL-2.0-or-later OR BSD-2-Clause) AND (LGPL-2.0-or-later WITH Linux-syscall-note) AND LGPL-2.1-only AND (LGPL-2.1-only OR BSD-2-Clause) AND (LGPL-2.1-only WITH Linux-syscall-note) AND LGPL-2.1-or-later AND (LGPL-2.1-or-later WITH Linux-syscall-note) AND (Linux-OpenIB OR GPL-2.0-only) AND (Linux-OpenIB OR GPL-2.0-only OR BSD-2-Clause) AND Linux-man-pages-copyleft AND MIT AND (MIT OR Apache-2.0) AND (MIT OR GPL-2.0-only) AND (MIT OR GPL-2.0-or-later) AND (MIT OR LGPL-2.1-only) AND (MPL-1.1 OR GPL-2.0-only) AND (X11 OR GPL-2.0-only) AND (X11 OR GPL-2.0-or-later) AND Zlib AND (copyleft-next-0.3.1 OR GPL-2.0-or-later) |
| kernel-tools | 7.1.10-200.fc44 | ((GPL-2.0-only WITH Linux-syscall-note) OR BSD-2-Clause) AND ((GPL-2.0-only WITH Linux-syscall-note) OR BSD-3-Clause) AND ((GPL-2.0-only WITH Linux-syscall-note) OR CDDL-1.0) AND ((GPL-2.0-only WITH Linux-syscall-note) OR Linux-OpenIB) AND ((GPL-2.0-only WITH Linux-syscall-note) OR MIT) AND ((GPL-2.0-or-later WITH Linux-syscall-note) OR BSD-3-Clause) AND ((GPL-2.0-or-later WITH Linux-syscall-note) OR MIT) AND 0BSD AND BSD-2-Clause AND (BSD-2-Clause OR Apache-2.0) AND BSD-3-Clause AND BSD-3-Clause-Clear AND CC0-1.0 AND GFDL-1.1-no-invariants-or-later AND GPL-1.0-or-later AND (GPL-1.0-or-later OR BSD-3-Clause) AND (GPL-1.0-or-later WITH Linux-syscall-note) AND GPL-2.0-only AND (GPL-2.0-only OR Apache-2.0) AND (GPL-2.0-only OR BSD-2-Clause) AND (GPL-2.0-only OR BSD-3-Clause) AND (GPL-2.0-only OR CDDL-1.0) AND (GPL-2.0-only OR GFDL-1.1-no-invariants-or-later) AND (GPL-2.0-only OR GFDL-1.2-no-invariants-only) AND (GPL-2.0-only OR GFDL-1.2-no-invariants-or-later) AND (GPL-2.0-only WITH Linux-syscall-note) AND GPL-2.0-or-later AND (GPL-2.0-or-later OR BSD-2-Clause) AND (GPL-2.0-or-later OR BSD-3-Clause) AND (GPL-2.0-or-later OR CC-BY-4.0) AND (GPL-2.0-or-later WITH GCC-exception-2.0) AND (GPL-2.0-or-later WITH Linux-syscall-note) AND ISC AND LGPL-2.0-or-later AND (LGPL-2.0-or-later OR BSD-2-Clause) AND (LGPL-2.0-or-later WITH Linux-syscall-note) AND LGPL-2.1-only AND (LGPL-2.1-only OR BSD-2-Clause) AND (LGPL-2.1-only WITH Linux-syscall-note) AND LGPL-2.1-or-later AND (LGPL-2.1-or-later WITH Linux-syscall-note) AND (Linux-OpenIB OR GPL-2.0-only) AND (Linux-OpenIB OR GPL-2.0-only OR BSD-2-Clause) AND Linux-man-pages-copyleft AND MIT AND (MIT OR Apache-2.0) AND (MIT OR GPL-2.0-only) AND (MIT OR GPL-2.0-or-later) AND (MIT OR LGPL-2.1-only) AND (MPL-1.1 OR GPL-2.0-only) AND (X11 OR GPL-2.0-only) AND (X11 OR GPL-2.0-or-later) AND Zlib AND (copyleft-next-0.3.1 OR GPL-2.0-or-later) |
| kernel-tools-libs | 7.1.10-200.fc44 | ((GPL-2.0-only WITH Linux-syscall-note) OR BSD-2-Clause) AND ((GPL-2.0-only WITH Linux-syscall-note) OR BSD-3-Clause) AND ((GPL-2.0-only WITH Linux-syscall-note) OR CDDL-1.0) AND ((GPL-2.0-only WITH Linux-syscall-note) OR Linux-OpenIB) AND ((GPL-2.0-only WITH Linux-syscall-note) OR MIT) AND ((GPL-2.0-or-later WITH Linux-syscall-note) OR BSD-3-Clause) AND ((GPL-2.0-or-later WITH Linux-syscall-note) OR MIT) AND 0BSD AND BSD-2-Clause AND (BSD-2-Clause OR Apache-2.0) AND BSD-3-Clause AND BSD-3-Clause-Clear AND CC0-1.0 AND GFDL-1.1-no-invariants-or-later AND GPL-1.0-or-later AND (GPL-1.0-or-later OR BSD-3-Clause) AND (GPL-1.0-or-later WITH Linux-syscall-note) AND GPL-2.0-only AND (GPL-2.0-only OR Apache-2.0) AND (GPL-2.0-only OR BSD-2-Clause) AND (GPL-2.0-only OR BSD-3-Clause) AND (GPL-2.0-only OR CDDL-1.0) AND (GPL-2.0-only OR GFDL-1.1-no-invariants-or-later) AND (GPL-2.0-only OR GFDL-1.2-no-invariants-only) AND (GPL-2.0-only OR GFDL-1.2-no-invariants-or-later) AND (GPL-2.0-only WITH Linux-syscall-note) AND GPL-2.0-or-later AND (GPL-2.0-or-later OR BSD-2-Clause) AND (GPL-2.0-or-later OR BSD-3-Clause) AND (GPL-2.0-or-later OR CC-BY-4.0) AND (GPL-2.0-or-later WITH GCC-exception-2.0) AND (GPL-2.0-or-later WITH Linux-syscall-note) AND ISC AND LGPL-2.0-or-later AND (LGPL-2.0-or-later OR BSD-2-Clause) AND (LGPL-2.0-or-later WITH Linux-syscall-note) AND LGPL-2.1-only AND (LGPL-2.1-only OR BSD-2-Clause) AND (LGPL-2.1-only WITH Linux-syscall-note) AND LGPL-2.1-or-later AND (LGPL-2.1-or-later WITH Linux-syscall-note) AND (Linux-OpenIB OR GPL-2.0-only) AND (Linux-OpenIB OR GPL-2.0-only OR BSD-2-Clause) AND Linux-man-pages-copyleft AND MIT AND (MIT OR Apache-2.0) AND (MIT OR GPL-2.0-only) AND (MIT OR GPL-2.0-or-later) AND (MIT OR LGPL-2.1-only) AND (MPL-1.1 OR GPL-2.0-only) AND (X11 OR GPL-2.0-only) AND (X11 OR GPL-2.0-or-later) AND Zlib AND (copyleft-next-0.3.1 OR GPL-2.0-or-later) |
| keyutils | 1.6.3-7.fc44 | GPL-2.0-or-later AND LGPL-2.1-or-later |
| keyutils-libs | 1.6.3-7.fc44 | GPL-2.0-or-later AND LGPL-2.1-or-later |
| kf5-attica | 5.116.0-5.fc44 | CC0-1.0 AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-3.0-only AND (LGPL-2.1-only OR LGPL-3.0-only) |
| kf5-filesystem | 5.116.0-6.fc44 | BSD-3-Clause |
| kf5-frameworkintegration | 5.116.0-11.fc44 | CC0-1.0 AND LGPL-2.0-only AND LGPL-2.0-or-later AND LGPL-3.0-only AND (LGPL-2.1-only OR LGPL-3.0-only) |
| kf5-frameworkintegration-libs | 5.116.0-11.fc44 | CC0-1.0 AND LGPL-2.0-only AND LGPL-2.0-or-later AND LGPL-3.0-only AND (LGPL-2.1-only OR LGPL-3.0-only) |
| kf5-karchive | 5.116.0-5.fc44 | BSD-2-Clause AND CC0-1.0 AND LGPL-2.0-or-later |
| kf5-kauth | 5.116.0-5.fc44 | BSD-3-Clause AND CC0-1.0 AND LGPL-2.0-or-later AND LGPL-2.1-or-later |
| kf5-kbookmarks | 5.116.0-5.fc44 | CC0-1.0 AND GPL-2.0-or-later AND LGPL-2.0-only AND LGPL-2.0-or-later AND LGPL-3.0-only AND (LGPL-2.1-only OR LGPL-3.0-only) |
| kf5-kcodecs | 5.116.0-5.fc44 | CC0-1.0 AND GPL-2.0-or-later AND LGPL-2.0-only AND LGPL-2.0-or-later AND LGPL-2.1-or-later AND MIT AND MPL-1.1 |
| kf5-kcompletion | 5.116.0-5.fc44 | CC0-1.0 AND LGPL-2.0-or-later AND LGPL-2.1-or-later |
| kf5-kconfig-core | 5.116.0-6.fc44 | BSD-2-Clause AND BSD-3-Clause AND CC0-1.0 AND GPL-2.0-or-later AND LGPL-2.0-only AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-3.0-only AND (LGPL-2.1-only OR LGPL-3.0-only) AND MIT |
| kf5-kconfig-gui | 5.116.0-6.fc44 | BSD-2-Clause AND BSD-3-Clause AND CC0-1.0 AND GPL-2.0-or-later AND LGPL-2.0-only AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-3.0-only AND (LGPL-2.1-only OR LGPL-3.0-only) AND MIT |
| kf5-kconfigwidgets | 5.116.0-5.fc44 | CC0-1.0 AND GPL-2.0-or-later AND LGPL-2.0-only AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-3.0-only AND (LGPL-2.1-only OR LGPL-3.0-only) AND MIT |
| kf5-kcoreaddons | 5.116.0-5.fc44 | BSD-2-Clause AND BSD-3-Clause AND CC0-1.0 AND GPL-2.0-only AND GPL-2.0-or-later AND GPL-3.0-only AND LGPL-2.0-only AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-2.1-or-later AND LGPL-3.0-only AND (GPL-2.0-only OR GPL-3.0-only) AND (LGPL-2.1-only OR LGPL-3.0-only) |
| kf5-kcrash | 5.116.0-5.fc44 | CC0-1.0 AND LGPL-2.0-or-later |
| kf5-kdbusaddons | 5.116.0-5.fc44 | CC0-1.0 AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-3.0-only AND (LGPL-2.1-only OR LGPL-3.0-only) |
| kf5-kdoctools | 5.116.0-5.fc44 | BSD-3-Clause AND CC0-1.0 AND GPL-2.0-or-later AND LGPL-2.1-only AND LGPL-2.1-or-later AND LGPL-3.0-only AND (LGPL-2.1-only OR LGPL-3.0-only) |
| kf5-kglobalaccel | 5.116.0-5.fc44 | CC0-1.0 AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-3.0-only AND (LGPL-2.1-only OR LGPL-3.0-only) |
| kf5-kglobalaccel-libs | 5.116.0-5.fc44 | CC0-1.0 AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-3.0-only AND (LGPL-2.1-only OR LGPL-3.0-only) |
| kf5-kguiaddons | 5.116.0-5.fc44 | BSD-2-Clause AND CC0-1.0 AND GPL-2.0-only AND GPL-2.0-or-later AND GPL-3.0-only AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-3.0-only AND (GPL-2.0-only OR GPL-3.0-only) AND (LGPL-2.1-only OR LGPL-3.0-only) |
| kf5-ki18n | 5.116.0-6.fc44 | BSD-3-Clause AND CC0-1.0 AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-2.1-or-later AND LGPL-3.0-only AND (LGPL-2.1-only OR LGPL-3.0-only) AND ODbL-1.0 |
| kf5-kiconthemes | 5.116.0-5.fc44 | CC0-1.0 AND GPL-2.0-only AND GPL-3.0-only AND LGPL-2.0-only AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-3.0-only AND (GPL-2.0-only OR GPL-3.0-only) AND (LGPL-2.1-only OR LGPL-3.0-only) |
| kf5-kinit | 5.116.0-5.fc44 | BSD-3-Clause AND CC0-1.0 AND LGPL-2.0-only AND LGPL-2.1-only AND LGPL-3.0-only AND (LGPL-2.1-only OR LGPL-3.0-only) |
| kf5-kio-core | 5.116.0-6.fc44 | BSD-2-Clause AND BSD-3-Clause AND CC0-1.0 AND GPL-2.0-only AND GPL-2.0-or-later AND GPL-3.0-only AND LGPL-2.0-only AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-2.1-or-later AND LGPL-3.0-only AND (GPL-2.0-only OR GPL-3.0-only) AND (LGPL-2.1-only OR LGPL-3.0-only) AND MIT |
| kf5-kio-core-libs | 5.116.0-6.fc44 | BSD-2-Clause AND BSD-3-Clause AND CC0-1.0 AND GPL-2.0-only AND GPL-2.0-or-later AND GPL-3.0-only AND LGPL-2.0-only AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-2.1-or-later AND LGPL-3.0-only AND (GPL-2.0-only OR GPL-3.0-only) AND (LGPL-2.1-only OR LGPL-3.0-only) AND MIT |
| kf5-kio-doc | 5.116.0-6.fc44 | BSD-2-Clause AND BSD-3-Clause AND CC0-1.0 AND GPL-2.0-only AND GPL-2.0-or-later AND GPL-3.0-only AND LGPL-2.0-only AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-2.1-or-later AND LGPL-3.0-only AND (GPL-2.0-only OR GPL-3.0-only) AND (LGPL-2.1-only OR LGPL-3.0-only) AND MIT |
| kf5-kio-file-widgets | 5.116.0-6.fc44 | BSD-2-Clause AND BSD-3-Clause AND CC0-1.0 AND GPL-2.0-only AND GPL-2.0-or-later AND GPL-3.0-only AND LGPL-2.0-only AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-2.1-or-later AND LGPL-3.0-only AND (GPL-2.0-only OR GPL-3.0-only) AND (LGPL-2.1-only OR LGPL-3.0-only) AND MIT |
| kf5-kio-gui | 5.116.0-6.fc44 | BSD-2-Clause AND BSD-3-Clause AND CC0-1.0 AND GPL-2.0-only AND GPL-2.0-or-later AND GPL-3.0-only AND LGPL-2.0-only AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-2.1-or-later AND LGPL-3.0-only AND (GPL-2.0-only OR GPL-3.0-only) AND (LGPL-2.1-only OR LGPL-3.0-only) AND MIT |
| kf5-kio-ntlm | 5.116.0-6.fc44 | BSD-2-Clause AND BSD-3-Clause AND CC0-1.0 AND GPL-2.0-only AND GPL-2.0-or-later AND GPL-3.0-only AND LGPL-2.0-only AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-2.1-or-later AND LGPL-3.0-only AND (GPL-2.0-only OR GPL-3.0-only) AND (LGPL-2.1-only OR LGPL-3.0-only) AND MIT |
| kf5-kio-widgets | 5.116.0-6.fc44 | BSD-2-Clause AND BSD-3-Clause AND CC0-1.0 AND GPL-2.0-only AND GPL-2.0-or-later AND GPL-3.0-only AND LGPL-2.0-only AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-2.1-or-later AND LGPL-3.0-only AND (GPL-2.0-only OR GPL-3.0-only) AND (LGPL-2.1-only OR LGPL-3.0-only) AND MIT |
| kf5-kio-widgets-libs | 5.116.0-6.fc44 | BSD-2-Clause AND BSD-3-Clause AND CC0-1.0 AND GPL-2.0-only AND GPL-2.0-or-later AND GPL-3.0-only AND LGPL-2.0-only AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-2.1-or-later AND LGPL-3.0-only AND (GPL-2.0-only OR GPL-3.0-only) AND (LGPL-2.1-only OR LGPL-3.0-only) AND MIT |
| kf5-kirigami2 | 5.116.0-5.fc44 | BSD-2-Clause AND BSD-3-Clause AND CC0-1.0 AND FSFAP AND GPL-2.0-or-later AND GPL-2.1-or-later AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-3.0-only AND (LGPL-2.1-only OR LGPL-3.0-only) AND MIT AND LGPL-2.1-or-later |
| kf5-kitemviews | 5.116.0-5.fc44 | CC0-1.0 AND GPL-2.0-or-later AND LGPL-2.0-only AND LGPL-2.0-or-later |
| kf5-kjobwidgets | 5.116.0-5.fc44 | CC0-1.0 AND LGPL-2.0-only AND LGPL-2.0-or-later AND LGPL-3.0-only AND (LGPL-2.1-only OR LGPL-3.0-only) |
| kf5-knewstuff | 5.116.0-5.fc44 | BSD-2-Clause AND CC0-1.0 AND GPL-2.0-only AND GPL-3.0-only AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-2.1-or-later AND LGPL-3.0-only AND (GPL-2.0-only OR GPL-3.0-only) AND (LGPL-2.1-only OR LGPL-3.0-only) |
| kf5-knotifications | 5.116.0-5.fc44 | BSD-3-Clause AND CC0-1.0 AND LGPL-2.0-only AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-3.0-only AND (LGPL-2.1-only OR LGPL-3.0-only) |
| kf5-kpackage | 5.116.0-5.fc44 | CC0-1.0 AND GPL-2.0-or-later AND LGPL-2.0-or-later |
| kf5-kservice | 5.116.0-5.fc44 | CC0-1.0 AND GPL-2.0-only AND GPL-2.0-or-later AND GPL-3.0-only AND LGPL-2.0-only AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-3.0-only AND (GPL-2.0-only OR GPL-3.0-only) AND (LGPL-2.1-only OR LGPL-3.0-only) |
| kf5-ktextwidgets | 5.116.0-5.fc44 | CC0-1.0 AND LGPL-2.0-only AND LGPL-2.0-or-later AND LGPL-2.1-or-later AND LGPL-3.0-only AND (LGPL-2.1-only OR LGPL-3.0-only) |
| kf5-kwallet | 5.116.0-5.fc44 | BSD-3-Clause AND CC0-1.0 AND LGPL-2.0-only AND LGPL-2.0-or-later AND LGPL-2.1-or-later AND LGPL-3.0-or-later |
| kf5-kwallet-libs | 5.116.0-5.fc44 | BSD-3-Clause AND CC0-1.0 AND LGPL-2.0-only AND LGPL-2.0-or-later AND LGPL-2.1-or-later AND LGPL-3.0-or-later |
| kf5-kwayland | 5.116.0-11.fc44 | BSD-3-Clause AND CC0-1.0 AND LGPL-2.1-only AND LGPL-3.0-only AND (LGPL-2.1-only OR LGPL-3.0-only) AND MIT AND MIT-CMU |
| kf5-kwidgetsaddons | 5.116.0-5.fc44 | CC0-1.0 AND GPL-2.0-or-later AND LGPL-2.0-only AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-2.1-or-later AND LGPL-3.0-only AND LGPL-3.0-or-later AND (LGPL-2.1-only OR LGPL-3.0-only) |
| kf5-kwindowsystem | 5.116.0-5.fc44 | CC0-1.0 AND LGPL-2.1-only AND LGPL-2.1-or-later AND LGPL-3.0-only AND (LGPL-2.1-only OR LGPL-3.0-only) AND MIT |
| kf5-kxmlgui | 5.116.0-5.fc44 | BSD-2-Clause AND CC0-1.0 AND GPL-2.0-or-later AND LGPL-2.0-only AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-2.1-or-later AND LGPL-3.0-only AND (LGPL-2.1-only OR LGPL-3.0-only) |
| kf5-qqc2-desktop-style | 5.116.1-5.fc44 | LGPL-2.0-or-later AND (LGPL-3.0-only OR GPL-2.0-or-later) AND (LGPL-3.0-only OR GPL-2.0-only OR GPL-3.0-only) |
| kf5-solid | 5.116.0-6.fc44 | BSD-3-Clause AND CC0-1.0 AND LGPL-2.1-only AND LGPL-2.1-or-later AND LGPL-3.0-only AND (LGPL-2.1-only OR LGPL-3.0-only) |
| kf5-sonnet | 5.116.0-5.fc44 | BSD-3-Clause AND CC0-1.0 AND LGPL-2.0-or-later AND LGPL-2.1-or-later |
| kf5-sonnet-core | 5.116.0-5.fc44 | BSD-3-Clause AND CC0-1.0 AND LGPL-2.0-or-later AND LGPL-2.1-or-later |
| kf5-sonnet-ui | 5.116.0-5.fc44 | BSD-3-Clause AND CC0-1.0 AND LGPL-2.0-or-later AND LGPL-2.1-or-later |
| kf5-syndication | 5.116.0-5.fc44 | BSD-2-Clause AND CC0-1.0 AND GPL-2.0-or-later AND LGPL-2.0-or-later |
| kf6-attica | 6.29.0-1.fc44 | CC0-1.0 AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-3.0-only AND (LGPL-2.1-only OR LGPL-3.0-only) |
| kf6-baloo | 6.29.0-1.fc44 | BSD-3-Clause AND CC0-1.0 AND GPL-2.0-only AND GPL-2.0-or-later AND GPL-3.0-only AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-2.1-or-later AND LGPL-3.0-only AND (GPL-2.0-only OR GPL-3.0-only) AND (LGPL-2.1-only OR LGPL-3.0-only) AND bzip2-1.0.6 |
| kf6-baloo-file | 6.29.0-1.fc44 | BSD-3-Clause AND CC0-1.0 AND GPL-2.0-only AND GPL-2.0-or-later AND GPL-3.0-only AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-2.1-or-later AND LGPL-3.0-only AND (GPL-2.0-only OR GPL-3.0-only) AND (LGPL-2.1-only OR LGPL-3.0-only) AND bzip2-1.0.6 |
| kf6-baloo-libs | 6.29.0-1.fc44 | BSD-3-Clause AND CC0-1.0 AND GPL-2.0-only AND GPL-2.0-or-later AND GPL-3.0-only AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-2.1-or-later AND LGPL-3.0-only AND (GPL-2.0-only OR GPL-3.0-only) AND (LGPL-2.1-only OR LGPL-3.0-only) AND bzip2-1.0.6 |
| kf6-bluez-qt | 6.29.0-1.fc44 | CC0-1.0 AND LGPL-2.1-only AND LGPL-2.1-or-later AND LGPL-3.0-only |
| kf6-breeze-icons | 6.29.0-1.fc44 | LGPL-2.0-or-later AND LGPL-2.1-or-later AND LGPL-3.0-or-later AND CC-BY-SA-4.0 |
| kf6-filesystem | 6.29.0-1.fc44 | BSD-3-Clause |
| kf6-frameworkintegration | 6.29.0-1.fc44 | CC0-1.0 AND LGPL-2.0-only AND LGPL-2.0-or-later AND LGPL-3.0-only AND (LGPL-2.1-only OR LGPL-3.0-only) |
| kf6-frameworkintegration-libs | 6.29.0-1.fc44 | CC0-1.0 AND LGPL-2.0-only AND LGPL-2.0-or-later AND LGPL-3.0-only AND (LGPL-2.1-only OR LGPL-3.0-only) |
| kf6-karchive | 6.29.0-1.fc44 | LGPL-2.0-or-later AND BSD-2-Clause |
| kf6-kauth | 6.29.0-1.fc44 | BSD-3-Clause AND CC0-1.0 AND LGPL-2.1-or-later |
| kf6-kbookmarks | 6.29.0-1.fc44 | CC0-1.0 AND LGPL-2.0-only AND LGPL-2.0-or-later AND LGPL-3.0-only AND LicenseRef-KDE-Accepted-LGPL |
| kf6-kcalendarcore | 6.29.0-1.fc44 | BSD-3-Clause AND LGPL-2.0-or-later AND LGPL-3.0-or-later |
| kf6-kcmutils | 6.29.0-1.fc44 | BSD-2-Clause AND BSD-3-Clause AND CC0-1.0 AND GPL-2.0-or-later AND LGPL-2.0-only AND LGPL-2.0-or-later AND LGPL-3.0-only AND (LGPL-2.1-only OR LGPL-3.0-only) |
| kf6-kcodecs | 6.29.0-1.fc44 | BSD-3-Clause AND CC0-1.0 AND GPL-2.0-or-later AND LGPL-2.0-only AND LGPL-2.0-or-later AND LGPL-2.1-or-later AND MIT AND MPL-1.1 |
| kf6-kcolorscheme | 6.29.0-1.fc44 | BSD-2-Clause and CC0-1.0 and LGPL-2.0-or-later and LGPL-2.1-only and LGPL-3.0-only and (LGPL-2.1-only OR LGPL-3.0-only) |
| kf6-kcompletion | 6.29.0-1.fc44 | CC0-1.0 AND LGPL-2.0-or-later AND LGPL-2.1-or-later |
| kf6-kconfig | 6.29.0-1.fc44 | BSD-2-Clause AND BSD-3-Clause AND CC0-1.0 AND LGPL-2.0-only AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-3.0-only AND MIT |
| kf6-kconfigwidgets | 6.29.0-1.fc44 | CC0-1.0 AND GPL-2.0-or-later AND LGPL-2.0-only AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-3.0-only AND (LGPL-2.1-only OR LGPL-3.0-only) |
| kf6-kcontacts | 6.29.0-1.fc44 | CC0-1.0 AND LGPL-2.0-or-later |
| kf6-kcoreaddons | 6.29.0-1.fc44 | BSD-2-Clause AND BSD-3-Clause AND CC0-1.0 AND GPL-2.0-or-later AND MPL-1.1 AND LGPL-2.0-only AND LGPL-2.1-or-later AND LGPL-3.0-only AND LGPL-2.1-only WITH Qt-LGPL-exception-1.1 |
| kf6-kcrash | 6.29.0-1.fc44 | CC0-1.0 AND LGPL-2.0-or-later |
| kf6-kdbusaddons | 6.29.0-1.fc44 | CC0-1.0 AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-3.0-only |
| kf6-kdeclarative | 6.29.0-1.fc44 | CC0-1.0 AND GPL-2.0-only AND GPL-3.0-only AND LGPL-2.0-or-later AND LGPL-2.1-or-later AND (GPL-2.0-only OR GPL-3.0-only) AND MIT |
| kf6-kded | 6.29.0-1.fc44 | CC0-1.0 AND LGPL-2.0-only AND LGPL-2.0-or-later |
| kf6-kdesu | 6.29.0-1.fc44 | CC0-1.0 AND GPL-2.0-only AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-3.0-only AND (LGPL-2.1-only OR LGPL-3.0-only) |
| kf6-kdnssd | 6.29.0-1.fc44 | BSD-3-Clause AND CC0-1.0 AND LGPL-2.0-or-later |
| kf6-kdoctools | 6.29.0-1.fc44 | BSD-3-Clause AND CC0-1.0 AND GPL-2.0-or-later AND LGPL-2.1-only AND LGPL-2.1-or-later AND LGPL-3.0-only AND (LGPL-2.1-only OR LGPL-3.0-only) |
| kf6-kfilemetadata | 6.29.0-1.fc44 | BSD-3-Clause AND CC0-1.0 AND LGPL-2.1-only AND LGPL-2.1-or-later AND LGPL-3.0-only AND (LGPL-2.1-only OR LGPL-3.0-only) |
| kf6-kglobalaccel | 6.29.0-1.fc44 | CC0-1.0 AND LGPL-2.0-or-later |
| kf6-kguiaddons | 6.29.0-1.fc44 | BSD-2-Clause AND CC0-1.0 AND GPL-2.0-only AND GPL-2.0-or-later AND GPL-3.0-only AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-3.0-only |
| kf6-kholidays | 6.29.0-1.fc44 | BSD-2-Clause AND CC0-1.0 AND GPL-3.0-or-later AND LGPL-2.0-or-later WITH Bison-exception-2.2 |
| kf6-ki18n | 6.29.0-1.fc44 | BSD-3-Clause AND CC0-1.0 AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-3.0-only AND (LGPL-2.1-only OR LGPL-3.0-only) AND ODbl-1.0 |
| kf6-kiconthemes | 6.29.0-1.fc44 | CC0-1.0 AND GPL-2.0-only AND GPL-2.0-or-later AND GPL-3.0-only AND LGPL-2.0-only AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-3.0-only AND (GPL-2.0-only OR GPL-3.0-only) AND (LGPL-2.1-only OR LGPL-3.0-only) |
| kf6-kidletime | 6.29.0-1.fc44 | CC0-1.0 AND GPL-2.0-or-later AND LGPL-2.1-or-later AND MIT |
| kf6-kidletime-x11 | 6.29.0-1.fc44 | CC0-1.0 AND GPL-2.0-or-later AND LGPL-2.1-or-later AND MIT |
| kf6-kimageformats | 6.29.0-1.fc44 | LGPLv2+ |
| kf6-kio-core | 6.29.0-1.fc44 | BSD-2-Clause AND BSD-3-Clause AND CC0-1.0 AND GPL-2.0-only AND GPL-2.0-or-later AND GPL-3.0-only AND LGPL-2.0-only AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-2.1-or-later AND LGPL-3.0-only AND (GPL-2.0-only OR GPL-3.0-only) AND (LGPL-2.1-only OR LGPL-3.0-only) AND MIT |
| kf6-kio-core-libs | 6.29.0-1.fc44 | BSD-2-Clause AND BSD-3-Clause AND CC0-1.0 AND GPL-2.0-only AND GPL-2.0-or-later AND GPL-3.0-only AND LGPL-2.0-only AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-2.1-or-later AND LGPL-3.0-only AND (GPL-2.0-only OR GPL-3.0-only) AND (LGPL-2.1-only OR LGPL-3.0-only) AND MIT |
| kf6-kio-doc | 6.29.0-1.fc44 | BSD-2-Clause AND BSD-3-Clause AND CC0-1.0 AND GPL-2.0-only AND GPL-2.0-or-later AND GPL-3.0-only AND LGPL-2.0-only AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-2.1-or-later AND LGPL-3.0-only AND (GPL-2.0-only OR GPL-3.0-only) AND (LGPL-2.1-only OR LGPL-3.0-only) AND MIT |
| kf6-kio-file-widgets | 6.29.0-1.fc44 | BSD-2-Clause AND BSD-3-Clause AND CC0-1.0 AND GPL-2.0-only AND GPL-2.0-or-later AND GPL-3.0-only AND LGPL-2.0-only AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-2.1-or-later AND LGPL-3.0-only AND (GPL-2.0-only OR GPL-3.0-only) AND (LGPL-2.1-only OR LGPL-3.0-only) AND MIT |
| kf6-kio-gui | 6.29.0-1.fc44 | BSD-2-Clause AND BSD-3-Clause AND CC0-1.0 AND GPL-2.0-only AND GPL-2.0-or-later AND GPL-3.0-only AND LGPL-2.0-only AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-2.1-or-later AND LGPL-3.0-only AND (GPL-2.0-only OR GPL-3.0-only) AND (LGPL-2.1-only OR LGPL-3.0-only) AND MIT |
| kf6-kio-widgets | 6.29.0-1.fc44 | BSD-2-Clause AND BSD-3-Clause AND CC0-1.0 AND GPL-2.0-only AND GPL-2.0-or-later AND GPL-3.0-only AND LGPL-2.0-only AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-2.1-or-later AND LGPL-3.0-only AND (GPL-2.0-only OR GPL-3.0-only) AND (LGPL-2.1-only OR LGPL-3.0-only) AND MIT |
| kf6-kio-widgets-libs | 6.29.0-1.fc44 | BSD-2-Clause AND BSD-3-Clause AND CC0-1.0 AND GPL-2.0-only AND GPL-2.0-or-later AND GPL-3.0-only AND LGPL-2.0-only AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-2.1-or-later AND LGPL-3.0-only AND (GPL-2.0-only OR GPL-3.0-only) AND (LGPL-2.1-only OR LGPL-3.0-only) AND MIT |
| kf6-kirigami | 6.29.0-1.fc44 | BSD-3-Clause AND CC0-1.0 AND FSFAP AND GPL-2.0-or-later AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-2.1-or-later AND LGPL-3.0-only AND (LGPL-2.1-only OR LGPL-3.0-only) AND MIT |
| kf6-kirigami-addons | 1.13.1-1.fc44 | BSD-2-Clause AND CC-BY-SA-4.0 AND CC0-1.0 AND GPL-2.0-only AND GPL-2.0-or-later AND GPL-3.0-only AND LGPL-2.0-only AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-2.1-or-later AND LGPL-3.0-only AND (GPL-2.0-only OR GPL-3.0-only) AND (LGPL-2.1-only OR LGPL-3.0-only) AND LicenseRef-KFQF-Accepted-GPL |
| kf6-kitemmodels | 6.29.0-1.fc44 | CC0-1.0 AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-2.1-or-later AND LGPL-3.0-only |
| kf6-kitemviews | 6.29.0-1.fc44 | CC0-1.0 AND GPL-2.0-or-later AND LGPL-2.0-only AND LGPL-2.0-or-later |
| kf6-kjobwidgets | 6.29.0-1.fc44 | CC0-1.0 AND LGPL-2.0-only AND LGPL-2.0-or-later |
| kf6-knewstuff | 6.29.0-1.fc44 | BSD-2-Clause AND CC0-1.0 AND GPL-2.0-only AND GPL-3.0-only AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-2.1-or-later AND LGPL-3.0-only AND (GPL-2.0-only OR GPL-3.0-only) AND (LGPL-2.1-only OR LGPL-3.0-only) |
| kf6-knotifications | 6.29.0-1.fc44 | BSD-3-Clause AND CC0-1.0 AND LGPL-2.0-only AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-3.0-only AND (LGPL-2.1-only OR LGPL-3.0-only) |
| kf6-knotifyconfig | 6.29.0-1.fc44 | CC0-1.0 AND LGPL-2.0-only |
| kf6-kpackage | 6.29.0-1.fc44 | CC0-1.0 AND GPL-2.0-or-later AND LGPL-2.0-or-later |
| kf6-kparts | 6.29.0-1.fc44 | CC0-1.0 AND GPL-2.0-or-later AND LGPL-2.0-only AND LGPL-2.0-or-later AND LGPL-2.1-or-later AND LGPL-3.0-only AND (LGPL-2.1-only OR LGPL-3.0-only) |
| kf6-kpeople | 6.29.0-1.fc44 | CC0-1.0 AND LGPL-2.1-or-later |
| kf6-kpty | 6.29.0-1.fc44 | BSD-3-Clause AND CC0-1.0 AND GPL-2.0-or-later AND LGPL-2.0-or-later |
| kf6-kquickcharts | 6.29.0-1.fc44 | BSD-2-Clause AND CC0-1.0 AND LGPL-2.1-only AND LGPL-3.0-only AND MIT |
| kf6-krunner | 6.29.0-1.fc44 | BSD-2-Clause AND CC0-1.0 AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-2.1-or-later AND LGPL-3.0-only AND (LGPL-2.1-only OR LGPL-3.0-only) |
| kf6-kservice | 6.29.0-1.fc44 | CC0-1.0 AND LGPL-2.0-only AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-3.0-only AND (LGPL-2.1-only OR LGPL-3.0-only) |
| kf6-kstatusnotifieritem | 6.29.0-1.fc44 | CC0-1.0 AND LGPL-2.0-or-later |
| kf6-ksvg | 6.29.0-1.fc44 | CC0-1.0 AND GPL-2.0-or-later AND LGPL-2.0-or-later |
| kf6-ktexteditor | 6.29.0-1.fc44 | BSD-2-Clause AND CC0-1.0 AND LGPL-2.0-only AND LGPL-2.0-or-later AND MIT |
| kf6-ktexttemplate | 6.29.0-1.fc44 | CC0-1.0 AND LGPL-2.0-or-later AND LGPL-2.1-or-later |
| kf6-ktextwidgets | 6.29.0-1.fc44 | CC0-1.0 AND LGPL-2.0-only AND LGPL-2.0-or-later AND LGPL-2.1-or-later AND LGPL-3.0-only AND (LGPL-2.1-only OR LGPL-3.0-only) |
| kf6-kunitconversion | 6.29.0-1.fc44 | CC0-1.0 AND LGPL-2.0-or-later |
| kf6-kuserfeedback | 6.29.0-1.fc44 | MIT AND CC0-1.0 AND BSD-3-Clause |
| kf6-kwallet | 6.29.0-1.fc44 | BSD-3-Clause AND CC0-1.0 AND LGPL-2.0-only AND LGPL-2.0-or-later AND LGPL-2.1-or-later AND LGPL-3.0-or-later |
| kf6-kwallet-libs | 6.29.0-1.fc44 | BSD-3-Clause AND CC0-1.0 AND LGPL-2.0-only AND LGPL-2.0-or-later AND LGPL-2.1-or-later AND LGPL-3.0-or-later |
| kf6-kwidgetsaddons | 6.29.0-1.fc44 | BSD-3-Clause AND CC0-1.0 AND GPL-2.0-or-later AND LGPL-2.0-only AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-2.1-or-later AND LGPL-3.0-only AND LGPL-3.0-or-later |
| kf6-kwindowsystem | 6.29.0-1.fc44 | CC0-1.0 AND LGPL-2.1-only AND LGPL-2.1-or-later AND LGPL-3.0-only AND MIT |
| kf6-kxmlgui | 6.29.0-1.fc44 | BSD-2-Clause AND CC0-1.0 AND LGPL-2.0-only AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-2.1-or-later AND LGPL-3.0-only AND (LGPL-2.1-only OR LGPL-3.0-only) |
| kf6-modemmanager-qt | 6.29.0-1.fc44 | GPL-2.0-only AND GPL-3.0-only AND LGPL-2.1-only AND LGPL-3.0-only AND (GPL-2.0-only OR GPL-3.0-only) AND (LGPL-2.1-only OR LGPL-3.0-only) |
| kf6-networkmanager-qt | 6.29.0-1.fc44 | LGPL-2.0-or-later AND GPL-2.0-only AND GPL-3.0-only AND LGPL-2.1-only AND LGPL-3.0-only AND (GPL-2.0-only OR GPL-3.0-only) AND (LGPL-2.1-only OR LGPL-3.0-only) AND CC0-1.0 |
| kf6-prison | 6.29.0-1.fc44 | BSD-3-Clause AND CC0-1.0 AND MIT |
| kf6-purpose | 6.29.0-1.fc44 | CC0-1.0 AND GPL-2.0-or-later AND LGPL-2.0-or-later AND LGPL-2.1-or-later |
| kf6-qqc2-desktop-style | 6.29.0-1.fc44 | CC0-1.0 AND GPL-2.0-only AND GPL-2.0-or-later AND GPL-3.0-only AND LGPL-2.0-or-later AND LGPL-2.1-or-later AND LGPL-3.0-only AND LicenseRef-KFQF-Accepted-GPL |
| kf6-solid | 6.29.0-1.fc44 | LGPL-2.1-or-later AND LGPL-2.1-only AND CCO-1.0 AND BSD-3-Clause AND LGPL-3.0-only |
| kf6-sonnet | 6.29.0-1.fc44 | BSD-3-Clause AND CC0-1.0 AND LGPL-2.0-or-later AND LGPL-2.1-or-later |
| kf6-sonnet-hunspell | 6.29.0-1.fc44 | BSD-3-Clause AND CC0-1.0 AND LGPL-2.0-or-later AND LGPL-2.1-or-later |
| kf6-syndication | 6.29.0-1.fc44 | BSD-2-Clause AND CC0-1.0 AND GPL-2.0-or-later AND LGPL-2.0-or-later |
| kf6-syntax-highlighting | 6.29.0-1.fc44 | MIT AND BSD-2-Clause AND BSD-3-Clause AND CC0-1.0 AND GPL-2.0-only AND LGPL-2.0-or-later |
| kf6-threadweaver | 6.29.0-1.fc44 | CC0-1.0 AND LGPL-2.0-or-later |
| kfind | 26.08.0-1.fc44 | GPL-2.0-or-later AND LicenseRef-Callaway-GFDL |
| kglobalacceld | 6.7.4-1.fc44 | CC0-1.0 AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-3.0-only AND (LGPL-2.1-only OR LGPL-3.0-only) |
| khelpcenter | 26.08.0-1.fc44 | GPL-2.0-only OR GPL-3.0-only |
| kimageannotator-common | 0.7.0-8.fc44 | LGPL-3.0-or-later |
| kimageannotator-qt6 | 0.7.0-8.fc44 | LGPL-3.0-or-later |
| kinfocenter | 6.7.4-1.fc44 | BSD-2-Clause AND BSD-3-Clause AND CC0-1.0 AND FSFAP AND GPL-2.0-only AND GPL-2.0-or-later AND GPL-3.0-only AND LGPL-2.1-or-later AND LGPL-3.0-only AND (GPL-2.0-only OR GPL-3.0-only) AND (LGPL-2.1-only OR LGPL-3.0-only) |
| kio-admin | 26.08.0-1.fc44 | (GPL-2.0-only or GPL-3.0-only) and BSD-3-Clause and CC0-1.0 and FSFAP |
| kio-extras | 26.08.0-1.fc44 | GPL-2.0-or-later |
| kio-fuse | 5.1.1-3.fc44 | GPL-3.0-or-later |
| kio-gdrive | 26.08.0-1.fc44 | GPL-2.0-or-later |
| kitty | 0.47.1-1.fc44 | GPL-3.0-only AND LGPL-2.1-or-later AND Zlib AND (MIT AND CC0-1.0) AND BSD-2-Clause AND CC0-1.0 AND MIT |
| kitty-kitten | 0.47.1-1.fc44 | Apache-2.0 AND BSD-2-Clause AND BSD-3-Clause AND GPL-3.0-only AND MIT AND OFL-1.1 |
| kitty-shell-integration | 0.47.1-1.fc44 | GPL-3.0-only AND MIT |
| kitty-terminfo | 0.47.1-1.fc44 | GPL-3.0-only |
| kjournald | 26.08.0-1.fc44 | BSD-3-Clause and CC0-1.0 and MIT and LGPL-2.1-or-later and MIT |
| kjournald-libs | 26.08.0-1.fc44 | BSD-3-Clause and CC0-1.0 and MIT and LGPL-2.1-or-later and MIT |
| kmenuedit | 6.7.4-1.fc44 | CC0-1.0 AND GPL-2.0-only AND GPL-2.0-or-later |
| kmod | 34.2-4.fc44 | GPL-2.0-or-later AND GPL-3.0-or-later AND FSFUL AND FSFULLRWD AND LGPL-2.1-only AND LGPL-2.1-or-later AND X11 |
| kmod-libs | 34.2-4.fc44 | GPL-2.0-or-later AND GPL-3.0-or-later AND FSFUL AND FSFULLRWD AND LGPL-2.1-only AND LGPL-2.1-or-later AND X11 |
| knighttime | 6.7.4-1.fc44 | GPL-3.0-only AND BSD-3-Clause AND MIT AND GPL-2.0-only AND LGPL-2.1-only AND CC0-1.0 AND LGPL-3.0-only |
| konsole | 26.08.0-1.fc44 | CC0-1.0 AND GPL-2.0-only AND GPL-2.0-or-later AND GPL-3.0-only AND LGPL-2.0-only AND LGPL-2.1-only AND LGPL-3.0-only AND (GPL-2.0-only OR GPL-3.0-only) AND (LGPL-2.1-only OR LGPL-3.0-only) |
| konsole-part | 26.08.0-1.fc44 | CC0-1.0 AND GPL-2.0-only AND GPL-2.0-or-later AND GPL-3.0-only AND LGPL-2.0-only AND LGPL-2.1-only AND LGPL-3.0-only AND (GPL-2.0-only OR GPL-3.0-only) AND (LGPL-2.1-only OR LGPL-3.0-only) |
| kpartx | 0.13.1-1.fc44 | GPL-2.0-only AND GPL-3.0-only |
| kpipewire | 6.7.4-1.fc44 | BSD-3-Clause AND CC0-1.0 AND LGPL-2.1-only AND LGPL-3.0-only |
| kpmcore | 26.08.0-1.fc44 | GPL-3.0-or-later AND MIT AND CC-BY-4.0 AND CC0-1.0 |
| kquickimageeditor-qt6 | 0.6.0-6.fc44 | BSD-2-Clause AND CC0-1.0 AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-2.1-or-later AND LGPL-3.0-only |
| krb5-libs | 1.22.2-4.fc44 | Brian-Gladman-2-Clause AND BSD-2-Clause AND (BSD-2-Clause OR GPL-2.0-or-later) AND BSD-2-Clause-first-lines AND BSD-3-Clause AND BSD-4-Clause AND CMU-Mach-nodoc AND FSFULLRWD AND HPND AND HPND-export2-US AND HPND-export-US AND HPND-export-US-acknowledgement AND HPND-export-US-modify AND ISC AND MIT AND MIT-CMU AND OLDAP-2.8 AND OpenVision |
| krdp | 6.7.4-1.fc44 | LGPL-2.1-only OR LGPL-3.0-only |
| krdp-libs | 6.7.4-1.fc44 | LGPL-2.1-only OR LGPL-3.0-only |
| krfb | 26.08.0-1.fc44 | GPL-2.0-only AND LGPL-2.1-only AND GFDL-1.2-no-invariants-only |
| krfb-libs | 26.08.0-1.fc44 | GPL-2.0-only AND LGPL-2.1-only AND GFDL-1.2-no-invariants-only |
| kscreen | 6.7.4-1.fc44 | CC0-1.0 AND GPL-2.0-only AND GPL-2.0-or-later AND GPL-3.0-only AND LGPL-2.0-or-later AND (GPL-2.0-only OR GPL-3.0-only) |
| kscreenlocker | 6.7.4-1.fc44 | BSD-3-Clause AND CC0-1.0 AND GPL-2.0-only AND GPL-2.0-or-later AND GPL-3.0-only AND LGPL-2.1-only AND LGPL-3.0-only AND (GPL-2.0-only OR GPL-3.0-only) AND (LGPL-2.1-only OR LGPL-3.0-only) |
| ksshaskpass | 6.7.4-1.fc44 | GPL-2.0-only |
| ksystemstats | 6.7.4-1.fc44 | BSD-2-Clause AND BSD-3-Clause AND CC0-1.0 AND GPL-2.0-only AND GPL-3.0-only AND (GPL-2.0-only OR GPL-3.0-only) |
| kunifiedpush | 26.08.0-1.fc44 | BSD-2-Clause AND CC0-1.0 AND BSD-3-Clause AND LGPL-2.0-or-later |
| kvantum | 1.1.6-1.fc44 | GPL-3.0-or-later |
| kvantum-data | 1.1.6-1.fc44 | GPL-3.0-or-later |
| kwalletmanager5 | 26.08.0-1.fc44 | GPL-2.0-or-later |
| kwayland | 6.7.4-1.fc44 | BSD-3-Clause AND CC0-1.0 AND LGPL-2.1-only AND LGPL-2.1-or-later AND LGPL-3.0-only AND MIT-CMU AND MIT |
| kwin | 6.7.4-2.fc44 | BSD-2-Clause AND BSD-3-Clause AND CC0-1.0 AND GPL-2.0-only AND GPL-2.0-or-later AND GPL-3.0-only AND GPL-3.0-or-later AND LGPL-2.0-only AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-2.1-or-later AND LGPL-3.0-only AND (GPL-2.0-only OR GPL-3.0-only) AND (LGPL-2.1-only OR LGPL-3.0-only) AND MIT |
| kwin-common | 6.7.4-2.fc44 | BSD-2-Clause AND BSD-3-Clause AND CC0-1.0 AND GPL-2.0-only AND GPL-2.0-or-later AND GPL-3.0-only AND GPL-3.0-or-later AND LGPL-2.0-only AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-2.1-or-later AND LGPL-3.0-only AND (GPL-2.0-only OR GPL-3.0-only) AND (LGPL-2.1-only OR LGPL-3.0-only) AND MIT |
| kwin-libs | 6.7.4-2.fc44 | BSD-2-Clause AND BSD-3-Clause AND CC0-1.0 AND GPL-2.0-only AND GPL-2.0-or-later AND GPL-3.0-only AND GPL-3.0-or-later AND LGPL-2.0-only AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-2.1-or-later AND LGPL-3.0-only AND (GPL-2.0-only OR GPL-3.0-only) AND (LGPL-2.1-only OR LGPL-3.0-only) AND MIT |
| kwrite | 26.08.0-1.fc44 | LGPL-2.0-or-later |
| kwrited | 6.7.4-1.fc44 | CC0-1.0 AND GPL-2.0-or-later |
| kyotocabinet-libs | 1.2.80-9.fc44 | GPL-3.0-only |
| lame | 3.100-21.fc44 | LGPL-2.0-or-later AND LGPL-2.1-or-later |
| lame-libs | 3.100-21.fc44 | LGPL-2.0-or-later AND LGPL-2.1-or-later |
| langpacks-core-en | 4.3-1.fc44 | GPL-2.0-or-later |
| langpacks-en | 4.3-1.fc44 | GPL-2.0-or-later |
| langpacks-fonts-en | 4.3-1.fc44 | GPL-2.0-or-later |
| langtable | 0.0.71-1.fc44 | GPL-3.0-or-later |
| layer-shell-qt | 6.7.4-1.fc44 | BSD-3-Clause AND CC0-1.0 AND LGPL-3.0-or-later AND MIT |
| lcms2 | 2.16-7.fc44 | MIT AND GPL-3.0-or-later |
| leptonica | 1.87.0-4.fc44 | Leptonica |
| less | 704-4.fc44 | (GPL-3.0-only OR BSD-2-Clause) AND GPL-2.0-or-later |
| liba52 | 0.7.4-53.fc44 | GPL-2.0-only |
| libabw | 0.1.3-19.fc44 | MPL-2.0 |
| libaccounts-glib | 1.25-24.fc44 | LicenseRef-Callaway-LGPLv2 |
| libaccounts-qt6 | 1.17-4.fc44 | LGPL-2.1-only |
| libacl | 2.4.0-1.fc44 | LGPL-2.1-or-later |
| libadwaita | 1.9.3-1.fc44 | LGPL-2.1-or-later AND MIT |
| libaio | 0.3.111-23.fc44 | LGPL-2.0-or-later |
| libao | 1.2.0-31.fc44 | GPL-2.0-or-later |
| libaom | 3.13.3-1.fc44 | BSD-3-Clause |
| libappindicator-gtk3 | 12.10.1-10.fc44 | LicenseRef-Callaway-LGPLv2 AND LGPL-3.0-only |
| libarchive | 3.8.7-1.fc44 | BSD-2-Clause AND FSFULLR AND GPL-2.0-or-later WITH Libtool-exception AND BSD-3-Clause AND FSFUL |
| libargon2 | 20190702-10.fc44 | CC0-1.0 OR Apache-2.0 |
| libaribcaption | 1.1.1-4.fc44 | MIT |
| libass | 0.17.4-2.fc44 | ISC |
| libassuan | 2.5.7-5.fc44 | GPL-3.0-or-later AND LGPL-2.1-or-later AND LGPL-3.0-or-later |
| libasyncns | 0.8-34.fc44 | LGPL-2.1-or-later |
| libatasmart | 0.19-32.fc44 | LGPL-2.1-or-later |
| libatomic | 16.2.1-2.fc44 | GPL-3.0-or-later AND LGPL-3.0-or-later AND (GPL-3.0-or-later WITH GCC-exception-3.1) AND (GPL-3.0-or-later WITH Texinfo-exception) AND (LGPL-2.1-or-later WITH GCC-exception-2.0) AND (GPL-2.0-or-later WITH GCC-exception-2.0) AND (GPL-2.0-or-later WITH GNU-compiler-exception) AND BSL-1.0 AND GFDL-1.3-or-later AND Linux-man-pages-copyleft-2-para AND SunPro AND BSD-1-Clause AND BSD-2-Clause AND BSD-2-Clause-Views AND BSD-3-Clause AND BSD-4-Clause AND BSD-Source-Code AND Zlib AND MIT AND Apache-2.0 AND (Apache-2.0 WITH LLVM-Exception) AND ZPL-2.1 AND ISC AND LicenseRef-Fedora-Public-Domain AND HP-1986 AND curl AND Martin-Birgmeier AND HPND-Markus-Kuhn AND dtoa AND SMLNJ AND AMD-newlib AND OAR AND HPND-merchantability-variant AND HPND-Intel |
| libattr | 2.6.0-1.fc44 | LGPL-2.1-or-later |
| libavc1394 | 0.5.4-27.fc44 | GPL-2.0-or-later AND LGPL-2.0-or-later |
| libavcodec-free | 8.1.2-4.fc44 | GPL-3.0-or-later |
| libavdevice-free | 8.1.2-4.fc44 | GPL-3.0-or-later |
| libavfilter-free | 8.1.2-4.fc44 | GPL-3.0-or-later |
| libavformat-free | 8.1.2-4.fc44 | GPL-3.0-or-later |
| libavif | 1.3.0-4.fc44 | BSD-2-Clause AND IJG AND Apache-2.0 AND BSD-3-Clause |
| libavutil-free | 8.1.2-4.fc44 | GPL-3.0-or-later |
| libb2 | 0.98.1-15.fc44 | CC0-1.0 OR Apache-1.0 OR Apache-2.0 |
| libbabeltrace | 1.5.11-17.fc44 | MIT AND GPL-3.0-or-later WITH Bison-exception-2.2 AND LGPL-2.1-only AND BSD-4-Clause-UC |
| libbasicobjects | 0.1.1-61.fc44 | GPL-3.0-or-later |
| libblkid | 2.41.5-1.fc44 | LGPL-2.1-or-later |
| libblockdev | 3.5.0-1.fc44 | LGPL-2.1-or-later |
| libblockdev-crypto | 3.5.0-1.fc44 | LGPL-2.1-or-later |
| libblockdev-fs | 3.5.0-1.fc44 | LGPL-2.1-or-later |
| libblockdev-loop | 3.5.0-1.fc44 | LGPL-2.1-or-later |
| libblockdev-mdraid | 3.5.0-1.fc44 | LGPL-2.1-or-later |
| libblockdev-nvme | 3.5.0-1.fc44 | LGPL-2.1-or-later |
| libblockdev-part | 3.5.0-1.fc44 | LGPL-2.1-or-later |
| libblockdev-smart | 3.5.0-1.fc44 | LGPL-2.1-or-later |
| libblockdev-swap | 3.5.0-1.fc44 | LGPL-2.1-or-later |
| libblockdev-utils | 3.5.0-1.fc44 | LGPL-2.1-or-later |
| libbluray | 1.4.0-3.fc44 | LGPL-2.0-or-later |
| libbpf | 1.6.3-2.fc44 | LGPL-2.1-only OR BSD-2-Clause |
| libbrotli | 1.2.0-3.fc44 | MIT |
| libbs2b | 3.1.0-37.fc44 | MIT |
| libbsd | 0.12.2-7.fc44 | Beerware AND BSD-2-Clause AND BSD-3-Clause AND ISC AND libutil-David-Nugent AND MIT AND LicenseRef-Fedora-Public-Domain |
| libbytesize | 2.12-2.fc44 | LGPL-2.1-or-later |
| libcaca | 0.99-0.82.beta20.fc44 | WTFPL |
| libcamera | 0.7.1-1.fc44 | LGPL-2.1-or-later |
| libcamera-ipa | 0.7.1-1.fc44 | LGPL-2.1-or-later AND BSD-2-Clause |
| libcanberra | 0.30-39.fc44 | LGPL-2.1-or-later |
| libcanberra-gtk3 | 0.30-39.fc44 | LGPL-2.1-or-later |
| libcap | 2.78-1.fc44 | BSD-3-Clause OR GPL-2.0-only |
| libcap-ng | 0.9.5-1.fc44 | LGPL-2.0-or-later |
| libcap-ng-python3 | 0.9.5-1.fc44 | LGPL-2.0-or-later |
| libcbor | 0.13.0-2.fc44 | MIT |
| libcdio | 2.3.0-1.fc44 | GPL-3.0-or-later AND BSD-2-Clause AND LGPL-2.1-or-later |
| libcdio-paranoia | 10.2+2.0.2-6.fc44 | GPL-3.0-or-later |
| libcdr | 0.1.8-5.fc44 | MPL-2.0 AND LicenseRef-Fedora-Public-Domain |
| libchewing | 0.13.1-1.fc44 | (Apache-2.0 OR MIT) AND LGPL-2.1-or-later AND MIT AND (MIT OR Apache-2.0) AND Zlib |
| libchromaprint | 1.6.0-4.fc44 | GPL-2.0-or-later |
| libcloudproviders | 0.4.0-1.fc44 | LGPL-3.0-or-later |
| libcmis | 0.6.3-1.fc44 | GPL-2.0-or-later OR LGPL-2.1-or-later OR MPL-1.1 |
| libcollection | 0.7.0-61.fc44 | LGPL-3.0-or-later |
| libcom_err | 1.47.3-4.fc44 | MIT |
| libcupsfilters | 2.1.1-9.fc44 | Apache-2.0 WITH LLVM-exception |
| libcurl-minimal | 8.18.0-9.fc44 | curl |
| libdaemon | 0.14-33.fc44 | LGPL-2.1-or-later |
| libdatrie | 0.2.14-2.fc44 | LGPL-2.1-or-later |
| libdav1d | 1.5.3-1.fc44 | BSD-2-Clause AND ISC |
| libdbusmenu | 16.04.0-31.fc44 | (LGPL-3.0-only OR LGPL-2.1-only) AND GPL-3.0-only |
| libdbusmenu-gtk3 | 16.04.0-31.fc44 | (LGPL-3.0-only OR LGPL-2.1-only) AND GPL-3.0-only |
| libdc1394 | 2.2.7-9.fc44 | LGPL-2.0-or-later |
| libddcutil | 2.2.1-3.fc44 | GPL-2.0-or-later |
| libdecor | 0.2.5-2.fc44 | MIT |
| libdeflate | 1.26-1.fc44 | MIT |
| libdhash | 0.5.0-61.fc44 | LGPL-3.0-or-later |
| libdisplay-info | 0.3.0-1.fc44 | MIT |
| libdisplay-info-tools | 0.3.0-1.fc44 | MIT |
| libdmtx | 0.7.8-3.fc44 | BSD-2-Clause-Views |
| libdnf5 | 5.4.3.0-2.fc44 | LGPL-2.1-or-later |
| libdnf5-cli | 5.4.3.0-2.fc44 | LGPL-2.1-or-later |
| libdnf5-plugin-expired-pgp-keys | 5.4.3.0-2.fc44 | LGPL-2.1-or-later |
| libdovi | 3.3.2-3.fc44 | MIT AND (Apache-2.0 OR MIT) AND (Unlicense OR MIT) AND (Zlib OR Apache-2.0 OR MIT) |
| libdrm | 2.4.134-1.fc44 | MIT |
| libdvdnav | 7.0.0-1.fc44 | GPL-2.0-or-later AND LGPL-2.1-or-later |
| libdvdread | 7.0.1-1.fc44 | GPL-2.0-or-later AND LGPL-2.1-or-later AND (GPL-2.0-only OR GPL-3.0-only) AND LicenseRef-Fedora-Public-Domain |
| libe-book | 0.1.3-41.fc44 | MPL-2.0 |
| libebur128 | 1.2.6-15.fc44 | MIT |
| libeconf | 0.7.9-3.fc44 | MIT |
| libedit | 3.1-59.20260512cvs.fc44 | BSD-3-Clause AND BSD-2-Clause AND ISC |
| libei | 1.6.0-2.fc44 | MIT |
| libeis | 1.6.0-2.fc44 | MIT |
| libeot | 0.01-35.fc44 | MPL-2.0 |
| libepoxy | 1.5.10-12.fc44 | MIT |
| libepubgen | 0.1.1-22.fc44 | MPL-2.0 |
| liberation-fonts-all | 2.1.5-15.fc44 | OFL-1.1-RFN |
| liberation-mono-fonts | 2.1.5-15.fc44 | OFL-1.1-RFN |
| liberation-sans-fonts | 2.1.5-15.fc44 | OFL-1.1-RFN |
| liberation-serif-fonts | 2.1.5-15.fc44 | OFL-1.1-RFN |
| libertas-firmware | 20260810-1.fc44 | LicenseRef-Callaway-Redistributable-no-modification-permitted |
| libetonyek | 0.1.13-2.fc44 | MPL-2.0 |
| libev | 4.33-15.fc44 | BSD-2-Clause OR GPL-2.0-or-later |
| libevdev | 1.13.7-1.fc44 | MIT |
| libevent | 2.1.12-17.fc44 | BSD-3-Clause AND ISC AND LicenseRef-Fedora-Public-Domain |
| libexif | 0.6.26-1.fc44 | LGPL-2.1-or-later |
| libexttextcat | 3.4.6-13.fc44 | BSD-3-Clause |
| libfakekey | 0.3-27.fc44 | LGPL-2.0-or-later |
| libfdisk | 2.41.5-1.fc44 | LGPL-2.1-or-later |
| libffi | 3.5.2-2.fc44 | MIT AND CC-PDDC AND (GPL-3.0-or-later WITH Texinfo-exception) |
| libfido2 | 1.16.0-5.fc44 | BSD-2-Clause |
| libfontenc | 1.1.8-5.fc44 | MIT |
| libfprint | 1.94.100-1.fc44 | LGPL-2.1-or-later AND NIST-PD |
| libfreehand | 0.1.2-27.fc44 | MPL-2.0 |
| libfsverity | 1.6-4.fc44 | LicenseRef-Callaway-BSD |
| libfyaml | 0.8-9.fc44 | MIT and GPL-2.0-only and BSD-2-Clause |
| libgcc | 16.2.1-2.fc44 | GPL-3.0-or-later AND LGPL-3.0-or-later AND (GPL-3.0-or-later WITH GCC-exception-3.1) AND (GPL-3.0-or-later WITH Texinfo-exception) AND (LGPL-2.1-or-later WITH GCC-exception-2.0) AND (GPL-2.0-or-later WITH GCC-exception-2.0) AND (GPL-2.0-or-later WITH GNU-compiler-exception) AND BSL-1.0 AND GFDL-1.3-or-later AND Linux-man-pages-copyleft-2-para AND SunPro AND BSD-1-Clause AND BSD-2-Clause AND BSD-2-Clause-Views AND BSD-3-Clause AND BSD-4-Clause AND BSD-Source-Code AND Zlib AND MIT AND Apache-2.0 AND (Apache-2.0 WITH LLVM-Exception) AND ZPL-2.1 AND ISC AND LicenseRef-Fedora-Public-Domain AND HP-1986 AND curl AND Martin-Birgmeier AND HPND-Markus-Kuhn AND dtoa AND SMLNJ AND AMD-newlib AND OAR AND HPND-merchantability-variant AND HPND-Intel |
| libgcrypt | 1.12.2-1.fc44 | BSD-3-Clause AND (BSD-3-Clause OR GPL-2.0-only) AND GPL-2.0-or-later AND LGPL-2.1-or-later AND LGPL-2.0-or-later AND MIT-Modern-Variant |
| libgfortran | 16.2.1-2.fc44 | GPL-3.0-or-later AND LGPL-3.0-or-later AND (GPL-3.0-or-later WITH GCC-exception-3.1) AND (GPL-3.0-or-later WITH Texinfo-exception) AND (LGPL-2.1-or-later WITH GCC-exception-2.0) AND (GPL-2.0-or-later WITH GCC-exception-2.0) AND (GPL-2.0-or-later WITH GNU-compiler-exception) AND BSL-1.0 AND GFDL-1.3-or-later AND Linux-man-pages-copyleft-2-para AND SunPro AND BSD-1-Clause AND BSD-2-Clause AND BSD-2-Clause-Views AND BSD-3-Clause AND BSD-4-Clause AND BSD-Source-Code AND Zlib AND MIT AND Apache-2.0 AND (Apache-2.0 WITH LLVM-Exception) AND ZPL-2.1 AND ISC AND LicenseRef-Fedora-Public-Domain AND HP-1986 AND curl AND Martin-Birgmeier AND HPND-Markus-Kuhn AND dtoa AND SMLNJ AND AMD-newlib AND OAR AND HPND-merchantability-variant AND HPND-Intel |
| libglvnd | 1.7.0-9.fc44 | MIT-feh AND MIT-Modern-Variant AND BSD-1-Clause AND BSD-3-Clause AND GPL-3.0-or-later WITH Autoconf-exception-macro |
| libglvnd-egl | 1.7.0-9.fc44 | MIT-feh AND MIT-Modern-Variant AND BSD-1-Clause AND BSD-3-Clause AND GPL-3.0-or-later WITH Autoconf-exception-macro |
| libglvnd-gles | 1.7.0-9.fc44 | MIT-feh AND MIT-Modern-Variant AND BSD-1-Clause AND BSD-3-Clause AND GPL-3.0-or-later WITH Autoconf-exception-macro |
| libglvnd-glx | 1.7.0-9.fc44 | MIT-feh AND MIT-Modern-Variant AND BSD-1-Clause AND BSD-3-Clause AND GPL-3.0-or-later WITH Autoconf-exception-macro |
| libglvnd-opengl | 1.7.0-9.fc44 | MIT-feh AND MIT-Modern-Variant AND BSD-1-Clause AND BSD-3-Clause AND GPL-3.0-or-later WITH Autoconf-exception-macro |
| libgomp | 16.2.1-2.fc44 | GPL-3.0-or-later AND LGPL-3.0-or-later AND (GPL-3.0-or-later WITH GCC-exception-3.1) AND (GPL-3.0-or-later WITH Texinfo-exception) AND (LGPL-2.1-or-later WITH GCC-exception-2.0) AND (GPL-2.0-or-later WITH GCC-exception-2.0) AND (GPL-2.0-or-later WITH GNU-compiler-exception) AND BSL-1.0 AND GFDL-1.3-or-later AND Linux-man-pages-copyleft-2-para AND SunPro AND BSD-1-Clause AND BSD-2-Clause AND BSD-2-Clause-Views AND BSD-3-Clause AND BSD-4-Clause AND BSD-Source-Code AND Zlib AND MIT AND Apache-2.0 AND (Apache-2.0 WITH LLVM-Exception) AND ZPL-2.1 AND ISC AND LicenseRef-Fedora-Public-Domain AND HP-1986 AND curl AND Martin-Birgmeier AND HPND-Markus-Kuhn AND dtoa AND SMLNJ AND AMD-newlib AND OAR AND HPND-merchantability-variant AND HPND-Intel |
| libgpg-error | 1.58-2.fc44 | LGPL-2.1-or-later AND (BSD-3-Clause OR LGPL-2.1-or-later) AND FSFULLR AND GPL-2.0-or-later |
| libgphoto2 | 2.5.33-2.fc44 | GPL-2.0-only AND GPL-2.0-or-later AND LGPL-2.0-only AND LGPL-2.0-or-later AND LGPL-2.1-or-later AND LGPL-3.0-or-later AND BSD-3-Clause AND IJG-short AND (MIT OR Unlicense) |
| libgs | 10.06.0-2.fc44 | AGPL-3.0-or-later |
| libgudev | 238-9.fc44 | LGPL-2.1-or-later |
| libgusb | 0.4.9-5.fc44 | LGPL-2.1-or-later |
| libhandy | 1.8.3-10.fc44 | LGPL-2.1-or-later |
| libhangul | 0.2.0-3.fc44 | LGPL-2.1-or-later |
| libheif | 1.21.2-1.fc44 | LGPL-3.0-or-later and MIT |
| libi2c | 4.4-4.fc44 | LGPL-2.1-or-later |
| libibverbs | 61.0-2.fc44 | GPL-2.0-only OR BSD-2-Clause AND BSD-3-Clause |
| libical | 3.0.20-7.fc44 | LGPL-2.1-only OR MPL-2.0 |
| libICE | 1.1.2-4.fc44 | MIT-open-group |
| libicu | 77.1-3.fc44 | Unicode-DFS-2016 AND BSD-2-Clause AND BSD-3-Clause AND NAIST-2003 AND LicenseRef-Fedora-Public-Domain |
| libidn2 | 2.3.8-3.fc44 | (GPL-2.0-or-later OR LGPL-3.0-or-later) AND GPL-3.0-or-later |
| libiec61883 | 1.2.0-39.fc44 | LicenseRef-Callaway-LGPLv2+ |
| libieee1284 | 0.2.11-48.fc44 | GPL-2.0-or-later |
| libijs | 0.35-26.fc44 | AGPL-3.0-or-later |
| libimagequant | 4.1.0-2.fc44 | Apache-2.0 AND GPL-3.0-or-later AND MIT |
| libimobiledevice | 1.4.0-3.fc44 | LGPL-2.0-or-later AND MIT AND Zlib |
| libimobiledevice-glue | 1.3.2-1.fc44 | LGPL-2.1-or-later |
| libini_config | 1.3.1-61.fc44 | LGPL-3.0-or-later |
| libinput | 1.31.3-1.fc44 | MIT |
| libipt | 2.1.2-4.fc44 | BSD-3-Clause |
| libjpeg-turbo | 3.1.3-1.fc44 | Zlib AND BSD-3-Clause AND MIT AND IJG |
| libjxl | 0.11.2-1.fc44 | BSD-3-Clause AND Apache-2.0 AND Zlib |
| libkcapi | 1.5.0-7.fc44 | BSD-3-Clause OR GPL-2.0-only |
| libkcapi-hasher | 1.5.0-7.fc44 | BSD-3-Clause OR GPL-2.0-only |
| libkcapi-hmaccalc | 1.5.0-7.fc44 | BSD-3-Clause OR GPL-2.0-only |
| libkcddb | 26.08.0-1.fc44 | BSD-3-Clause AND CC0-1.0 AND GPL-2.0-or-later AND LGPL-2.0-or-later |
| libkcddb-doc | 26.08.0-1.fc44 | LicenseRef-Callaway-GFDL |
| libkdcraw | 26.08.0-1.fc44 | BSD-3-Clause AND CC0-1.0 AND GPL-2.0-or-later |
| libkexiv2-qt6 | 26.08.0-1.fc44 | BSD-3-Clause AND CC0-1.0 AND GPL-2.0-or-later |
| libkgapi | 26.08.0-1.fc44 | BSD-3-Clause AND CC0-1.0 AND LGPL-2.1-only AND LGPL-3.0-only |
| libklvanc | 1.6.0-4.fc44 | LGPL-2.1 |
| libksba | 1.6.7-5.fc44 | GPL-3.0-or-later AND LGPL-2.1-or-later AND (LGPL-3.0-or-later OR GPL-2.0-or-later) |
| libkscreen | 6.7.4-1.fc44 | GPL-2.0-or-later |
| libksysguard | 6.7.4-1.fc44 | BSD-2-Clause AND BSD-3-Clause AND CC0-1.0 AND GPL-2.0-only AND GPL-2.0-or-later AND GPL-3.0-only AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-3.0-only AND (GPL-2.0-only OR GPL-3.0-only) AND (LGPL-2.1-only OR LGPL-3.0-only) |
| libksysguard-common | 6.7.4-1.fc44 | BSD-2-Clause AND BSD-3-Clause AND CC0-1.0 AND GPL-2.0-only AND GPL-2.0-or-later AND GPL-3.0-only AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-3.0-only AND (GPL-2.0-only OR GPL-3.0-only) AND (LGPL-2.1-only OR LGPL-3.0-only) |
| libkworkspace6 | 6.7.4-1.fc44 | BSD-2-Clause AND BSD-3-Clause AND CC0-1.0 AND GPL-2.0-only AND GPL-2.0-or-later AND GPL-3.0-only AND LGPL-2.0-only AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-2.1-or-later AND LGPL-3.0-only AND LGPL-3.0-or-later AND (GPL-2.0-only OR GPL-3.0-only) AND (LGPL-2.1-only OR LGPL-3.0-only) AND MIT |
| liblangtag | 0.6.7-7.fc44 | LGPL-3.0-or-later OR MPL-2.0 |
| liblangtag-data | 0.6.7-7.fc44 | Unicode-DFS-2015 |
| liblastlog2 | 2.41.5-1.fc44 | BSD-2-Clause |
| liblc3 | 1.1.3-7.fc44 | Apache-2.0 |
| libldac | 2.0.2.3-19.fc44 | Apache-2.0 |
| libldb | 4.24.6-1.fc44 | LGPL-3.0-or-later |
| liblerc | 4.0.0-10.fc44 | Apache-2.0 |
| liblouis | 3.33.0-7.fc44 | LGPL-2.1-or-later AND LGPL-2.0-or-later |
| liblouis-tables | 3.33.0-7.fc44 | LGPL-2.1-or-later AND LGPL-3.0-or-later |
| liblouisutdml | 2.12.0-8.fc44 | LGPL-3.0-or-later |
| liblouisutdml-utils | 2.12.0-8.fc44 | GPL-3.0-or-later |
| liblqr-1 | 0.4.2-29.fc44 | GPL-3.0-only |
| libmarkdown | 2.2.7-14.fc44 | LicenseRef-Callaway-BSD |
| libmaxminddb | 1.13.3-1.fc44 | Apache-2.0 AND BSD-3-Clause |
| libmbim | 1.32.0-3.fc44 | LGPL-2.1-or-later |
| libmbim-utils | 1.32.0-3.fc44 | GPL-2.0-or-later |
| libmd | 1.2.0-1.fc44 | BSD-2-Clause AND BSD-3-Clause AND ISC AND Beerware AND LicenseRef-Fedora-Public-Domain |
| libmng | 2.0.3-25.fc44 | Zlib |
| libmnl | 1.0.5-9.fc44 | LGPL-2.1-or-later |
| libmodplug | 0.8.9.0-29.fc44 | LicenseRef-Fedora-Public-Domain |
| libmodulemd | 2.15.3-1.fc44 | MIT |
| libmount | 2.41.5-1.fc44 | LGPL-2.1-or-later |
| libmpc | 1.4.1-1.fc44 | LGPL-3.0-or-later AND FSFAP |
| libmpeg2 | 0.5.1-33.fc44 | GPL-2.0-or-later |
| libmspack | 0.10.1-0.16.alpha.fc44 | LGPL-2.1-only AND LicenseRef-Fedora-UltraPermissive AND MIT |
| libmspub | 0.1.5-1.fc44 | MPL-2.0 |
| libmtp | 1.1.22-3.fc44 | LGPL-2.0-or-later AND LGPL-2.1-or-later AND LGPL-2.1-only AND FSFULLR AND LicenseRef-Fedora-UltraPermissive |
| libmusicbrainz5 | 5.1.0-30.fc44 | LGPL-2.1-or-later |
| libmwaw | 0.3.22-8.fc44 | LGPL-2.1-or-later OR MPL-2.0 |
| libmysofa | 1.3.3-4.fc44 | BSD-3-Clause |
| libndp | 1.9-5.fc44 | LGPL-2.1-or-later |
| libnet | 1.3-7.fc44 | BSD-2-Clause AND BSD-3-Clause |
| libnetapi | 4.24.6-1.fc44 | GPL-3.0-or-later AND LGPL-3.0-or-later |
| libnetfilter_conntrack | 1.1.1-1.fc44 | GPL-2.0-or-later |
| libnfnetlink | 1.0.1-32.fc44 | GPL-2.0-or-later |
| libnfsidmap | 2.8.7-7.fc44 | BSD-3-Clause |
| libnftnl | 1.3.1-2.fc44 | GPL-2.0-or-later |
| libnghttp2 | 1.68.0-5.fc44 | MIT |
| libnice | 0.1.23-2.fc44 | LGPL-2.1-or-later OR MPL-1.1 |
| libnl3 | 3.12.0-3.fc44 | LGPL-2.1-only |
| libnotify | 0.8.8-1.fc44 | LGPL-2.1-or-later |
| libnsl2 | 2.0.1-5.fc44 | BSD-3-Clause AND LGPL-2.1-or-later |
| libntlm | 1.8-4.fc44 | LGPL-2.0-or-later |
| libnumbertext | 1.0.11-10.fc44 | ( LGPL-3.0-or-later OR BSD-3-Clause ) AND ( LGPL-3.0-or-later OR CC-BY-SA-3.0 ) |
| libnvme | 1.16.2-1.fc44 | LGPL-2.1-or-later |
| libobjc | 16.2.1-2.fc44 | GPL-3.0-or-later AND LGPL-3.0-or-later AND (GPL-3.0-or-later WITH GCC-exception-3.1) AND (GPL-3.0-or-later WITH Texinfo-exception) AND (LGPL-2.1-or-later WITH GCC-exception-2.0) AND (GPL-2.0-or-later WITH GCC-exception-2.0) AND (GPL-2.0-or-later WITH GNU-compiler-exception) AND BSL-1.0 AND GFDL-1.3-or-later AND Linux-man-pages-copyleft-2-para AND SunPro AND BSD-1-Clause AND BSD-2-Clause AND BSD-2-Clause-Views AND BSD-3-Clause AND BSD-4-Clause AND BSD-Source-Code AND Zlib AND MIT AND Apache-2.0 AND (Apache-2.0 WITH LLVM-Exception) AND ZPL-2.1 AND ISC AND LicenseRef-Fedora-Public-Domain AND HP-1986 AND curl AND Martin-Birgmeier AND HPND-Markus-Kuhn AND dtoa AND SMLNJ AND AMD-newlib AND OAR AND HPND-merchantability-variant AND HPND-Intel |
| libodfgen | 0.1.8-16.fc44 | LGPL-2.1-or-later OR MPL-2.0 |
| liboeffis | 1.6.0-2.fc44 | MIT |
| libogg | 1.3.6-2.fc44 | BSD-3-Clause |
| libopenjph | 0.25.3-3.fc44 | BSD-2-Clause |
| libopenmpt | 0.8.9-1.fc44 | BSD-3-Clause |
| libopusenc | 0.3-2.fc44 | LicenseRef-Callaway-BSD |
| liborcus | 0.21.0-5.fc44 | MPL-2.0 |
| libpagemaker | 0.0.4-28.fc44 | MPL-2.0 |
| libpaper | 2.1.1-10.fc44 | LGPL-2.1-or-later AND LicenseRef-Fedora-Public-Domain AND GPL-3.0-or-later AND LGPL-2.0-or-later AND FSFAP |
| libpasswdqc | 2.0.3-9.fc44 | BSD-3-Clause |
| libpath_utils | 0.2.1-61.fc44 | LGPL-3.0-or-later |
| libpcap | 1.10.6-2.fc44 | ISC AND BSD-2-Clause AND BSD-3-Clause AND BSD-4-Clause-UC |
| libpciaccess | 0.16-17.fc44 | HPND AND MIT |
| libpfm | 4.13.0-20.fc44 | MIT |
| libpinyin | 2.11.91-2.fc44 | GPL-3.0-or-later |
| libpinyin-data | 2.11.91-2.fc44 | GPL-3.0-or-later |
| libpipeline | 1.5.8-4.fc44 | GPL-3.0-or-later |
| libpkgconf | 2.5.1-1.fc44 | ISC AND BSD-4-Clause AND BSD-2-Clause AND pkgconf AND MIT |
| libplacebo | 7.360.1-3.fc44 | LGPL-2.0-or-later |
| libplasma | 6.7.4-1.fc44 | BSD-3-Clause AND CC0-1.0 AND GPL-2.0-only AND GPL-2.0-or-later AND GPL-3.0-only AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-2.1-or-later AND LGPL-3.0-only AND (GPL-2.0-only OR GPL-3.0-only) AND (LGPL-2.1-only OR LGPL-3.0-only) AND Qt-LGPL-exception-1.1 |
| libplist | 2.7.0-1.fc44 | LGPL-2.0-or-later |
| libpng | 1.6.58-1.fc44 | zlib |
| libppd | 2.1.1-3.fc44 | Apache-2.0 WITH LLVM-exception |
| libproxy | 0.5.12-2.fc44 | LGPL-2.1-or-later |
| libproxy-bin | 0.5.12-2.fc44 | LGPL-2.1-or-later |
| libpskc | 2.6.14-1.fc44 | LGPL-2.1-or-later |
| libpsl | 0.21.5-7.fc44 | MIT |
| libpwquality | 1.4.5-15.fc44 | BSD-3-Clause OR GPL-2.0-or-later |
| libqalculate | 5.9.0-1.fc44 | GPL-2.0-or-later |
| libqb | 2.0.9-2.fc44 | LGPL-2.1-or-later |
| libqmi | 1.36.0-3.fc44 | LGPL-2.1-or-later |
| libqmi-utils | 1.36.0-3.fc44 | GPL-2.0-or-later |
| libqrtr-glib | 1.2.2-9.fc44 | LGPL-2.1-or-later |
| libquadmath | 16.2.1-2.fc44 | GPL-3.0-or-later AND LGPL-3.0-or-later AND (GPL-3.0-or-later WITH GCC-exception-3.1) AND (GPL-3.0-or-later WITH Texinfo-exception) AND (LGPL-2.1-or-later WITH GCC-exception-2.0) AND (GPL-2.0-or-later WITH GCC-exception-2.0) AND (GPL-2.0-or-later WITH GNU-compiler-exception) AND BSL-1.0 AND GFDL-1.3-or-later AND Linux-man-pages-copyleft-2-para AND SunPro AND BSD-1-Clause AND BSD-2-Clause AND BSD-2-Clause-Views AND BSD-3-Clause AND BSD-4-Clause AND BSD-Source-Code AND Zlib AND MIT AND Apache-2.0 AND (Apache-2.0 WITH LLVM-Exception) AND ZPL-2.1 AND ISC AND LicenseRef-Fedora-Public-Domain AND HP-1986 AND curl AND Martin-Birgmeier AND HPND-Markus-Kuhn AND dtoa AND SMLNJ AND AMD-newlib AND OAR AND HPND-merchantability-variant AND HPND-Intel |
| libqxp | 0.0.2-33.fc44 | MPL-2.0 |
| librabbitmq | 0.17.0-1.fc44 | MIT |
| libraqm | 0.10.1-4.fc44 | MIT |
| LibRaw | 0.22.2-1.fc44 | BSD-3-Clause and (CDDL-1.0 or LGPL-2.1-only) |
| libraw1394 | 2.1.2-25.fc44 | LicenseRef-Callaway-LGPLv2+ |
| libref_array | 0.1.5-61.fc44 | LGPL-3.0-or-later |
| libreoffice-calc | 26.2.6.1-1.fc44 | MPL-2.0 AND Apache-2.0 AND LGPL-3.0-only AND LGPL-3.0-or-later AND CC0-1.0 AND BSD-3-Clause AND (LGPL-2.1-only OR SISSL) AND (MPL-2.0 OR LGPL-3.0-or-later) AND (MPL-2.0 OR LGPL-2.1-or-later) AND (MPL-1.1 OR GPL-2.0-only OR LGPL-2.1-only) AND MIT |
| libreoffice-core | 26.2.6.1-1.fc44 | MPL-2.0 AND Apache-2.0 AND LGPL-3.0-only AND LGPL-3.0-or-later AND CC0-1.0 AND BSD-3-Clause AND (LGPL-2.1-only OR SISSL) AND (MPL-2.0 OR LGPL-3.0-or-later) AND (MPL-2.0 OR LGPL-2.1-or-later) AND (MPL-1.1 OR GPL-2.0-only OR LGPL-2.1-only) AND MIT |
| libreoffice-data | 26.2.6.1-1.fc44 | MPL-2.0 AND Apache-2.0 AND LGPL-3.0-only AND LGPL-3.0-or-later AND CC0-1.0 AND BSD-3-Clause AND (LGPL-2.1-only OR SISSL) AND (MPL-2.0 OR LGPL-3.0-or-later) AND (MPL-2.0 OR LGPL-2.1-or-later) AND (MPL-1.1 OR GPL-2.0-only OR LGPL-2.1-only) AND MIT |
| libreoffice-draw | 26.2.6.1-1.fc44 | MPL-2.0 AND Apache-2.0 AND LGPL-3.0-only AND LGPL-3.0-or-later AND CC0-1.0 AND BSD-3-Clause AND (LGPL-2.1-only OR SISSL) AND (MPL-2.0 OR LGPL-3.0-or-later) AND (MPL-2.0 OR LGPL-2.1-or-later) AND (MPL-1.1 OR GPL-2.0-only OR LGPL-2.1-only) AND MIT |
| libreoffice-graphicfilter | 26.2.6.1-1.fc44 | MPL-2.0 AND Apache-2.0 AND LGPL-3.0-only AND LGPL-3.0-or-later AND CC0-1.0 AND BSD-3-Clause AND (LGPL-2.1-only OR SISSL) AND (MPL-2.0 OR LGPL-3.0-or-later) AND (MPL-2.0 OR LGPL-2.1-or-later) AND (MPL-1.1 OR GPL-2.0-only OR LGPL-2.1-only) AND MIT |
| libreoffice-impress | 26.2.6.1-1.fc44 | MPL-2.0 AND Apache-2.0 AND LGPL-3.0-only AND LGPL-3.0-or-later AND CC0-1.0 AND BSD-3-Clause AND (LGPL-2.1-only OR SISSL) AND (MPL-2.0 OR LGPL-3.0-or-later) AND (MPL-2.0 OR LGPL-2.1-or-later) AND (MPL-1.1 OR GPL-2.0-only OR LGPL-2.1-only) AND MIT |
| libreoffice-kf6 | 26.2.6.1-1.fc44 | MPL-2.0 AND Apache-2.0 AND LGPL-3.0-only AND LGPL-3.0-or-later AND CC0-1.0 AND BSD-3-Clause AND (LGPL-2.1-only OR SISSL) AND (MPL-2.0 OR LGPL-3.0-or-later) AND (MPL-2.0 OR LGPL-2.1-or-later) AND (MPL-1.1 OR GPL-2.0-only OR LGPL-2.1-only) AND MIT |
| libreoffice-langpack-en | 26.2.6.1-1.fc44 | MPL-2.0 AND Apache-2.0 AND LGPL-3.0-only AND LGPL-3.0-or-later AND CC0-1.0 AND BSD-3-Clause AND (LGPL-2.1-only OR SISSL) AND (MPL-2.0 OR LGPL-3.0-or-later) AND (MPL-2.0 OR LGPL-2.1-or-later) AND (MPL-1.1 OR GPL-2.0-only OR LGPL-2.1-only) AND MIT |
| libreoffice-ogltrans | 26.2.6.1-1.fc44 | MPL-2.0 AND Apache-2.0 AND LGPL-3.0-only AND LGPL-3.0-or-later AND CC0-1.0 AND BSD-3-Clause AND (LGPL-2.1-only OR SISSL) AND (MPL-2.0 OR LGPL-3.0-or-later) AND (MPL-2.0 OR LGPL-2.1-or-later) AND (MPL-1.1 OR GPL-2.0-only OR LGPL-2.1-only) AND MIT |
| libreoffice-opensymbol-fonts | 26.2.6.1-1.fc44 | MPL-2.0 AND Apache-2.0 AND LGPL-3.0-only AND LGPL-3.0-or-later AND CC0-1.0 AND BSD-3-Clause AND (LGPL-2.1-only OR SISSL) AND (MPL-2.0 OR LGPL-3.0-or-later) AND (MPL-2.0 OR LGPL-2.1-or-later) AND (MPL-1.1 OR GPL-2.0-only OR LGPL-2.1-only) AND MIT |
| libreoffice-pdfimport | 26.2.6.1-1.fc44 | MPL-2.0 AND Apache-2.0 AND LGPL-3.0-only AND LGPL-3.0-or-later AND CC0-1.0 AND BSD-3-Clause AND (LGPL-2.1-only OR SISSL) AND (MPL-2.0 OR LGPL-3.0-or-later) AND (MPL-2.0 OR LGPL-2.1-or-later) AND (MPL-1.1 OR GPL-2.0-only OR LGPL-2.1-only) AND MIT |
| libreoffice-pyuno | 26.2.6.1-1.fc44 | MPL-2.0 AND Apache-2.0 AND LGPL-3.0-only AND LGPL-3.0-or-later AND CC0-1.0 AND BSD-3-Clause AND (LGPL-2.1-only OR SISSL) AND (MPL-2.0 OR LGPL-3.0-or-later) AND (MPL-2.0 OR LGPL-2.1-or-later) AND (MPL-1.1 OR GPL-2.0-only OR LGPL-2.1-only) AND MIT |
| libreoffice-ure | 26.2.6.1-1.fc44 | MPL-2.0 AND Apache-2.0 AND LGPL-3.0-only AND LGPL-3.0-or-later AND CC0-1.0 AND BSD-3-Clause AND (LGPL-2.1-only OR SISSL) AND (MPL-2.0 OR LGPL-3.0-or-later) AND (MPL-2.0 OR LGPL-2.1-or-later) AND (MPL-1.1 OR GPL-2.0-only OR LGPL-2.1-only) AND MIT |
| libreoffice-ure-common | 26.2.6.1-1.fc44 | MPL-2.0 AND Apache-2.0 AND LGPL-3.0-only AND LGPL-3.0-or-later AND CC0-1.0 AND BSD-3-Clause AND (LGPL-2.1-only OR SISSL) AND (MPL-2.0 OR LGPL-3.0-or-later) AND (MPL-2.0 OR LGPL-2.1-or-later) AND (MPL-1.1 OR GPL-2.0-only OR LGPL-2.1-only) AND MIT |
| libreoffice-writer | 26.2.6.1-1.fc44 | MPL-2.0 AND Apache-2.0 AND LGPL-3.0-only AND LGPL-3.0-or-later AND CC0-1.0 AND BSD-3-Clause AND (LGPL-2.1-only OR SISSL) AND (MPL-2.0 OR LGPL-3.0-or-later) AND (MPL-2.0 OR LGPL-2.1-or-later) AND (MPL-1.1 OR GPL-2.0-only OR LGPL-2.1-only) AND MIT |
| librepo | 1.20.0-5.fc44 | LGPL-2.1-or-later |
| libreport-filesystem | 2.17.15-10.fc44 | GPL-2.0-or-later |
| librevenge | 0.0.5-13.fc44 | ( LGPL-2.1-or-later OR MPL-2.0 ) AND BSD-3-Clause |
| librist | 0.2.11-1.fc44 | BSD-2-Clause and ISC |
| librsvg2 | 2.62.3-1.fc44 | LGPL-2.1-or-later AND Apache-2.0 AND BSD-3-Clause AND MIT AND MPL-2.0 AND Unicode-3.0 AND Unicode-DFS-2016 AND (0BSD OR MIT OR Apache-2.0) AND (Apache-2.0 OR MIT) AND (BSD-3-Clause OR Apache-2.0) AND (MIT OR Apache-2.0 OR Zlib) AND (Unlicense OR MIT) |
| libsamplerate | 0.2.2-12.fc44 | BSD-2-Clause |
| libsane-airscan | 0.99.36-2.fc44 | GPL-2.0-or-later WITH SANE-exception AND MIT |
| libsane-hpaio | 3.26.4-7.fc44 | GPL-2.0-or-later AND MIT AND BSD-3-Clause-HP AND IJG AND GPL-2.0-only AND LGPL-2.1-or-later AND BSD-2-Clause AND LicenseRef-Fedora-Public-Domain AND python-ldap |
| libsbc | 2.1-2.fc44 | GPL-2.0-only AND LGPL-2.1-or-later |
| libseccomp | 2.6.1-2.fc44 | LGPL-2.1-only |
| libsecret | 0.21.7-10.fc44 | LGPL-2.1-or-later AND Apache-2.0 AND (GPL-2.0-or-later OR TGPPL-1.0) AND LicenseRef-Fedora-Public-Domain AND GCR-docs |
| libselinux | 3.11-1.fc44 | LicenseRef-Fedora-Public-Domain |
| libselinux-utils | 3.11-1.fc44 | LicenseRef-Fedora-Public-Domain |
| libsemanage | 3.11-1.fc44 | LGPL-2.1-or-later |
| libsepol | 3.11-1.fc44 | LGPL-2.1-or-later |
| libshaderc | 2026.1-1.fc44 | Apache-2.0 |
| libshout | 2.4.6-10.fc44 | LGPL-2.0-or-later |
| libsigc++30 | 3.8.1-1.fc44 | LGPL-2.1-or-later |
| libslirp | 4.9.1-3.fc44 | BSD-3-Clause AND MIT |
| libSM | 1.2.5-4.fc44 | MIT AND MIT-open-group |
| libsmartcols | 2.41.5-1.fc44 | LGPL-2.1-or-later |
| libsmbclient | 4.24.6-1.fc44 | GPL-3.0-or-later AND LGPL-3.0-or-later |
| libsndfile | 1.2.2-11.fc44 | LGPL-2.1-or-later AND GPL-2.0-or-later AND BSD-3-Clause |
| libsodium | 1.0.22-1.fc44 | ISC AND BSD-2-Clause AND CC0-1.0 |
| libsolv | 0.7.39-1.fc44 | BSD-3-Clause |
| libsoup3 | 3.6.6-9.fc44 | LGPL-2.0-or-later AND LGPL-2.1-or-later |
| libspectre | 0.2.12-11.fc44 | GPL-2.0-or-later |
| libsrtp | 2.8.0-1.fc44 | BSD-3-Clause |
| libss | 1.47.3-4.fc44 | MIT |
| libssh | 0.12.2-1.fc44 | LGPL-2.1-or-later |
| libssh-config | 0.12.2-1.fc44 | LGPL-2.1-or-later |
| libsss_certmap | 2.13.1-2.fc44 | LGPL-3.0-or-later |
| libsss_idmap | 2.13.1-2.fc44 | LGPL-3.0-or-later |
| libsss_nss_idmap | 2.13.1-2.fc44 | LGPL-3.0-or-later |
| libsss_sudo | 2.13.1-2.fc44 | LGPL-3.0-or-later |
| libstaroffice | 0.0.7-17.fc44 | LGPL-2.1-or-later OR MPL-2.0 |
| libstdc++ | 16.2.1-2.fc44 | GPL-3.0-or-later AND LGPL-3.0-or-later AND (GPL-3.0-or-later WITH GCC-exception-3.1) AND (GPL-3.0-or-later WITH Texinfo-exception) AND (LGPL-2.1-or-later WITH GCC-exception-2.0) AND (GPL-2.0-or-later WITH GCC-exception-2.0) AND (GPL-2.0-or-later WITH GNU-compiler-exception) AND BSL-1.0 AND GFDL-1.3-or-later AND Linux-man-pages-copyleft-2-para AND SunPro AND BSD-1-Clause AND BSD-2-Clause AND BSD-2-Clause-Views AND BSD-3-Clause AND BSD-4-Clause AND BSD-Source-Code AND Zlib AND MIT AND Apache-2.0 AND (Apache-2.0 WITH LLVM-Exception) AND ZPL-2.1 AND ISC AND LicenseRef-Fedora-Public-Domain AND HP-1986 AND curl AND Martin-Birgmeier AND HPND-Markus-Kuhn AND dtoa AND SMLNJ AND AMD-newlib AND OAR AND HPND-merchantability-variant AND HPND-Intel |
| libstemmer | 3.0.1-11.fc44 | BSD-3-Clause |
| libswresample-free | 8.1.2-4.fc44 | GPL-3.0-or-later |
| libswscale-free | 8.1.2-4.fc44 | GPL-3.0-or-later |
| libtalloc | 2.4.4-1.fc44 | LGPL-3.0-or-later |
| libtasn1 | 4.21.0-1.fc44 | GPL-3.0-or-later AND LGPL-2.1-or-later |
| libtdb | 1.4.15-1.fc44 | LGPL-3.0-or-later |
| libtevent | 0.17.1-4.fc44 | LGPL-3.0-or-later |
| libtextstyle | 0.26-5.fc44 | GPL-3.0-or-later |
| libthai | 0.1.30-2.fc44 | LGPL-2.1-or-later |
| libtheora | 1.1.1-41.fc44 | BSD-3-Clause |
| libtiff | 4.7.2-1.fc44 | libtiff |
| libtinysparql | 3.11.1-1.fc44 | LGPL-2.1-or-later |
| libtirpc | 1.3.7-2.fc44 | SISSL AND BSD-3-Clause |
| libtommath | 1.3.1~rc1-7.fc44 | Unlicense |
| libtool-ltdl | 2.5.4-10.fc44 | LGPLv2+ |
| libtraceevent | 1.8.4-5.fc44 | LGPL-2.1-only AND LGPL-2.1-or-later AND GPL-2.0-only AND GPL-2.0-or-later |
| libudfread | 1.2.0-3.fc44 | LGPL-2.0-or-later |
| libudisks2 | 2.11.2-1.fc44 | LGPL-2.0-or-later |
| libultrahdr | 1.4.0^20251202git8cbc983-1.fc44 | Apache-2.0 AND BSD-3-Clause |
| libunibreak | 6.1-5.fc44 | Zlib |
| libunistring | 1.1-11.fc44 | GPL-2.0-or-later OR LGPL-3.0-or-later |
| libunity-gtk3-parser | 0.0.0+17.04.20170403-24.fc44 | LGPL-3.0-only |
| libunwind | 1.8.3-1.fc44 | MIT |
| liburing | 2.13-2.fc44 | (GPL-2.0-only WITH Linux-syscall-note OR MIT) AND (LGPL-2.0-or-later OR MIT) |
| libusb1 | 1.0.30-1.fc44 | LGPL-2.1-or-later |
| libusbmuxd | 2.1.1-1.fc44 | LGPL-2.0-or-later AND GPL-2.0-or-later |
| libuser | 0.64-17.fc44 | LGPL-2.0-or-later |
| libutempter | 1.2.1-20.fc44 | LGPL-2.1-or-later AND LGPL-2.1-only AND BSD-2-Clause |
| libuuid | 2.41.5-1.fc44 | BSD-3-Clause |
| libuv | 1.52.1-2.fc44 | MIT AND CC-BY-4.0 AND ISC AND BSD-2-Clause |
| libv4l | 1.32.0-3.fc44 | LGPL-2.1-or-later AND GPL-2.0-or-later AND IJG-short AND BSD-2-Clause |
| libva | 2.23.0-3.fc44 | MIT AND HPND-sell-variant AND ICU |
| libva-intel-media-driver | 26.2.4-1.fc44 | MIT and BSD |
| libvdpau | 1.5-11.fc44 | MIT |
| libverto | 0.3.2-12.fc44 | MIT |
| libverto-libev | 0.3.2-12.fc44 | MIT |
| libvisio | 0.1.11-1.fc44 | MPL-2.0 |
| libvisual | 0.4.2-4.fc44 | LGPL-2.1-or-later |
| libvmaf | 3.0.0-5.fc44 | BSD-2-Clause-Patent |
| libvncserver | 0.9.15-6.fc44 | GPL-2.0-or-later |
| libvorbis | 1.3.7-14.fc44 | BSD-3-Clause |
| libvpl | 2.17.0-1.fc44 | MIT |
| libvpx | 1.15.0-5.fc44 | BSD-3-Clause |
| libwacom | 2.19.0-1.fc44 | HPND |
| libwacom-data | 2.19.0-1.fc44 | HPND |
| libwayland-client | 1.25.0-1.fc44 | MIT |
| libwayland-cursor | 1.25.0-1.fc44 | MIT |
| libwayland-egl | 1.25.0-1.fc44 | MIT |
| libwayland-server | 1.25.0-1.fc44 | MIT |
| libwbclient | 4.24.6-1.fc44 | GPL-3.0-or-later AND LGPL-3.0-or-later |
| libwebp | 1.6.0-3.fc44 | Apache-2.0 AND BSD-3-Clause WITH AdditionRef-WebM-patent-license AND BSD-3-Clause AND FSFULLRWD |
| libwinpr | 3.30.0-1.fc44 | Apache-2.0 AND HPND AND LGPL-2.1-or-later AND LicenseRef-Fedora-Public-Domain AND OFL-1.1 |
| libwmf-lite | 0.2.13-9.fc44 | LGPL-2.1-or-later AND GPL-2.0-or-later AND GPL-1.0-or-later |
| libwnck3 | 43.3-2.fc44 | LGPL-2.0-or-later |
| libwpd | 0.10.3-24.fc44 | LGPL-2.1-or-later OR MPL-2.0 |
| libwpg | 0.3.4-7.fc44 | LGPL-2.1-or-later OR MPL-2.0 |
| libwps | 0.4.14-7.fc44 | LGPL-2.1-or-later OR MPL-2.0 |
| libX11 | 1.8.13-1.fc44 | MIT AND X11 |
| libX11-common | 1.8.13-1.fc44 | MIT AND X11 |
| libX11-xcb | 1.8.13-1.fc44 | MIT AND X11 |
| libXau | 1.0.12-4.fc44 | MIT-open-group |
| libXaw | 1.0.16-5.fc44 | MIT-open-group AND X11 AND HPND AND HPND-sell-variant AND SMLNJ AND NTP |
| libxcb | 1.17.0-7.fc44 | X11 |
| libXcomposite | 0.4.6-7.fc44 | MIT AND HPND-sell-variant |
| libxcrypt | 4.5.2-3.fc44 | LGPL-2.1-or-later AND BSD-3-Clause AND BSD-2-Clause AND BSD-2-Clause-FreeBSD AND 0BSD AND CC0-1.0 AND LicenseRef-Fedora-Public-Domain |
| libXcursor | 1.2.3-4.fc44 | HPND-sell-variant |
| libxcvt | 0.1.2-11.fc44 | MIT AND HPND-sell-variant |
| libXdamage | 1.1.6-7.fc44 | HPND-sell-variant |
| libXdmcp | 1.1.5-5.fc44 | MIT-open-group |
| libXext | 1.3.6-5.fc44 | MIT-open-group AND X11 AND HPND AND HPND-sell-variant AND SMLNJ AND MIT AND ISC AND HPND-doc AND HPND-doc-sell |
| libXfixes | 6.0.1-7.fc44 | MIT AND HPND-sell-variant |
| libXfont2 | 2.0.9-1.fc44 | BSD-2-Clause AND BSD-4-Clause-UC AND HPND-sell-variant AND MIT-open-group AND SMLNJ AND X11 |
| libXft | 2.3.8-10.fc44 | HPND-sell-variant |
| libXi | 1.8.3-1.fc44 | MIT-open-group AND SMLNJ AND MIT |
| libXinerama | 1.1.5-10.fc44 | MIT AND MIT-open-group AND X11 |
| libxkbcommon | 1.13.1-2.fc44 | MIT AND X11 AND MIT-CMU |
| libxkbcommon-x11 | 1.13.1-2.fc44 | MIT AND X11 AND MIT-CMU |
| libxkbfile | 1.1.3-5.fc44 | MIT-open-group AND HPND AND SMLNJ |
| libxml2 | 2.12.10-6.fc44 | MIT AND ISC-Veillard AND W3C |
| libxmlb | 0.3.29-1.fc44 | LGPL-2.1-or-later |
| libXmu | 1.2.1-5.fc44 | MIT-open-group AND SMLNJ AND X11 AND ISC |
| libXpm | 3.5.17-7.fc44 | MIT AND X11-distribute-modifications-variant |
| libXrandr | 1.5.4-7.fc44 | HPND-sell-variant |
| libXrender | 0.9.12-4.fc44 | HPND-sell-variant |
| libXres | 1.2.2-7.fc44 | X11 |
| libXScrnSaver | 1.2.4-7.fc44 | X11 |
| libxshmfence | 1.3.2-8.fc44 | HPND-sell-variant |
| libxslt | 1.1.43-6.fc44 | MIT |
| libXt | 1.3.1-4.fc44 | MIT AND HPND-sell-variant AND SMLNJ AND MIT-open-group AND X11 |
| libXtst | 1.2.5-4.fc44 | MIT-open-group AND HPND-sell-variant AND X11 AND HPND-doc AND HPND-doc-sell |
| libXv | 1.0.13-4.fc44 | SMLNJ AND HPND-sell-variant |
| libXxf86dga | 1.1.6-7.fc44 | MIT |
| libXxf86vm | 1.1.6-4.fc44 | X11-distribute-modifications-variant |
| libyaml | 0.2.5-18.fc44 | MIT |
| libyuv | 0-0.61.20260213git6067afd.fc44 | BSD-3-Clause |
| libzip | 1.11.4-3.fc44 | BSD-3-Clause |
| libzmf | 0.0.2-42.fc44 | MPL-2.0 |
| libzstd | 1.5.7-5.fc44 | BSD-3-Clause OR GPL-2.0-only |
| lilv-libs | 0.26.4-1.fc44 | MIT |
| linux-atm-libs | 2.5.1-46.fc44 | LGPL-2.0-or-later |
| linux-firmware | 20260810-1.fc44 | GPL-1.0-or-later AND GPL-2.0-or-later AND MIT AND LicenseRef-Callaway-Redistributable-no-modification-permitted |
| linux-firmware-whence | 20260810-1.fc44 | GPL-1.0-or-later AND GPL-2.0-or-later AND MIT AND LicenseRef-Callaway-Redistributable-no-modification-permitted |
| lksctp-tools | 1.0.21-3.fc44 | GPL-2.0-or-later AND LGPL-2.0-only AND MIT |
| llvm-filesystem | 22.1.8-4.fc44 | Apache-2.0 WITH LLVM-exception OR NCSA |
| llvm-libs | 22.1.8-4.fc44 | Apache-2.0 WITH LLVM-exception OR NCSA |
| lmdb-libs | 0.9.34-2.fc44 | OLDAP-2.8 |
| lm_sensors | 3.6.0-24.fc44 | GPL-2.0-or-later AND Linux-man-pages-copyleft-var AND Linux-man-pages-copyleft AND MIT |
| lm_sensors-libs | 3.6.0-24.fc44 | LGPL-2.1-or-later |
| lockdev | 1.0.4-0.54.20111007git.fc44 | LGPL-2.1-or-later |
| logrotate | 3.22.0-5.fc44 | GPL-2.0-or-later |
| lpcnetfreedv | 0.5-10.fc44 | LicenseRef-Callaway-BSD |
| lpsolve | 5.5.2.14-2.fc44 | LGPL-2.1-or-later AND GPL-2.0-or-later WITH Bison-exception-2.2 AND BSD-3-clause |
| lrzsz | 0.12.20-76.fc44 | GPL-2.0-or-later AND GPL-2.0-only |
| lsb_release | 3.3-8.fc44 | GPL-2.0-or-later |
| lsof | 4.98.0-9.fc44 | lsof |
| lttng-ust | 2.14.0-5.fc44 | LGPL-2.1-only AND MIT AND GPL-2.0-only AND BSD-3-Clause AND BSD-2-Clause |
| lua-libs | 5.4.8-5.fc44 | MIT |
| lvm2 | 2.03.38-2.fc44 | GPL-2.0-only |
| lvm2-libs | 2.03.38-2.fc44 | LGPL-2.1-only |
| lz4-libs | 1.10.0-4.fc44 | GPL-2.0-or-later AND BSD-2-Clause |
| lzo | 2.10-16.fc44 | gpl-2.0-or-later |
| m17n-db | 1.8.14-1.fc44 | LGPL-2.1-or-later |
| m17n-lib | 1.8.6-3.fc44 | LGPL-2.1-or-later |
| madan-fonts | 2.000-43.fc44 | GPL-1.0-or-later |
| mailcap | 2.1.54-10.fc44 | LicenseRef-Fedora-Public-Domain AND MIT AND metamail |
| malcontent-libs | 0.14.0-1.fc44 | LGPL-2.1-only AND CC-BY-3.0 |
| man-db | 2.13.1-3.fc44 | GPL-2.0-or-later AND GPL-3.0-or-later |
| man-pages | 6.13-3.fc44 | BSD-2-Clause AND BSD-3-Clause AND BSD-4.3TAHOE AND BSD-4-Clause-UC AND GPL-1.0-or-later AND GPL-2.0-only AND GPL-2.0-or-later AND LicenseRef-Fedora-Public-Domain AND LicenseRef-Fedora-UltraPermissive AND Linux-man-pages-1-para AND Linux-man-pages-copyleft AND Linux-man-pages-copyleft-2-para AND Linux-man-pages-copyleft-var AND MIT AND Spencer-94 |
| mariadb | 11.8.8-3.fc44 | ( GPL-2.0-only OR Apache-2.0 ) AND ( GPL-2.0-or-later OR Apache-2.0 ) AND BSD-2-Clause AND BSD-3-Clause AND CC-BY-4.0 AND GPL-2.0-only AND GPL-2.0-or-later AND GPL-3.0-or-later AND ( GPL-3.0-or-later WITH Bison-exception-2.2 ) AND LGPL-2.0-only AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-2.1-or-later AND OpenSSL AND MIT AND OFL-1.1 AND CC0-1.0 AND PHP-3.0 AND PHP-3.01 AND zlib AND dtoa AND FSFAP AND blessing AND Info-ZIP AND Boehm-GC |
| mariadb-common | 11.8.8-3.fc44 | ( GPL-2.0-only OR Apache-2.0 ) AND ( GPL-2.0-or-later OR Apache-2.0 ) AND BSD-2-Clause AND BSD-3-Clause AND CC-BY-4.0 AND GPL-2.0-only AND GPL-2.0-or-later AND GPL-3.0-or-later AND ( GPL-3.0-or-later WITH Bison-exception-2.2 ) AND LGPL-2.0-only AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-2.1-or-later AND OpenSSL AND MIT AND OFL-1.1 AND CC0-1.0 AND PHP-3.0 AND PHP-3.01 AND zlib AND dtoa AND FSFAP AND blessing AND Info-ZIP AND Boehm-GC |
| mariadb-connector-c | 3.4.9-2.fc44 | LGPL-2.1-or-later AND PHP-3.0 AND PHP-3.01 AND LicenseRef-Fedora-Public-Domain |
| mariadb-connector-c-config | 3.4.9-2.fc44 | LGPL-2.1-or-later AND PHP-3.0 AND PHP-3.01 AND LicenseRef-Fedora-Public-Domain |
| mariadb-errmsg | 11.8.8-3.fc44 | ( GPL-2.0-only OR Apache-2.0 ) AND ( GPL-2.0-or-later OR Apache-2.0 ) AND BSD-2-Clause AND BSD-3-Clause AND CC-BY-4.0 AND GPL-2.0-only AND GPL-2.0-or-later AND GPL-3.0-or-later AND ( GPL-3.0-or-later WITH Bison-exception-2.2 ) AND LGPL-2.0-only AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-2.1-or-later AND OpenSSL AND MIT AND OFL-1.1 AND CC0-1.0 AND PHP-3.0 AND PHP-3.01 AND zlib AND dtoa AND FSFAP AND blessing AND Info-ZIP AND Boehm-GC |
| mcelog | 175-14.fc44 | GPL-2.0-only |
| md4c | 0.5.1-5.fc44 | MIT |
| mdadm | 4.3-11.fc44 | GPL-2.0-or-later |
| media-player-info | 23-20.fc44 | LicenseRef-Callaway-BSD |
| memstrack | 0.2.5-8.fc44 | GPL-3.0-only |
| mesa-dri-drivers | 26.1.8-1.fc44 | MIT AND BSD-3-Clause AND SGI-B-2.0 |
| mesa-filesystem | 26.1.8-1.fc44 | MIT AND BSD-3-Clause AND SGI-B-2.0 |
| mesa-libEGL | 26.1.8-1.fc44 | MIT AND BSD-3-Clause AND SGI-B-2.0 |
| mesa-libgbm | 26.1.8-1.fc44 | MIT AND BSD-3-Clause AND SGI-B-2.0 |
| mesa-libGL | 26.1.8-1.fc44 | MIT AND BSD-3-Clause AND SGI-B-2.0 |
| mesa-libGLU | 9.0.3-8.fc44 | X11 |
| mesa-vulkan-drivers | 26.1.8-1.fc44 | MIT AND BSD-3-Clause AND SGI-B-2.0 |
| micro | 2.0.15-1.fc44 | Apache-2.0 AND BSD-2-Clause AND BSD-3-Clause AND ISC AND JSON AND MIT AND MPL-1.1 AND MPL-2.0 |
| microcode_ctl | 2.1-74.fc44 | GPL-2.0-or-later AND LicenseRef-Fedora-Firmware |
| minizip-ng-compat | 4.1.0-1.fc44 | Zlib |
| mkpasswd | 5.6.6-1.fc44 | GPL-2.0-or-later |
| mobile-broadband-provider-info | 20240407-5.fc44 | CC-PDDC |
| ModemManager | 1.24.2-3.fc44 | GPL-2.0-or-later |
| ModemManager-glib | 1.24.2-3.fc44 | LGPL-2.1-or-later |
| mokutil | 0.7.2-3.fc44 | GPL-3.0-or-later |
| mozilla-filesystem | 1.9-38.fc44 | MPL-1.1 |
| mpage | 2.5.7-24.fc44 | GPL-2.0-or-later |
| mpdecimal | 4.0.1-3.fc44 | BSD-2-Clause |
| mpfr | 4.2.2-3.fc44 | LGPL-3.0-or-later |
| mpg123-libs | 1.32.10-3.fc44 | GPL-2.0-or-later |
| mt7xxx-firmware | 20260810-1.fc44 | LicenseRef-Callaway-Redistributable-no-modification-permitted |
| mtdev | 1.1.6-12.fc44 | MIT |
| mtr | 0.96-1.fc44 | GPL-2.0-only |
| mysql-selinux | 1.0.14-3.fc44 | GPL-3.0-only |
| mythes | 1.2.5-10.fc44 | BSD-3-Clause-Modification AND MIT |
| mythes-en | 3.0-43.fc44 | BSD-3-Clause-Modification AND ClArtistic |
| nano | 8.7.1-2.fc44 | GPL-3.0-or-later |
| nano-default-editor | 8.7.1-2.fc44 | GPL-3.0-or-later |
| ncurses | 6.6-1.fc44 | MIT-open-group |
| ncurses-base | 6.6-1.fc44 | MIT-open-group |
| ncurses-libs | 6.6-1.fc44 | MIT-open-group |
| neon | 0.37.1-1.fc44 | LGPL-2.0-or-later |
| netavark | 1.17.2-1.fc44 | Apache-2.0 AND BSD-3-Clause AND MIT |
| net-snmp-libs | 5.9.5.2-4.fc44 | MIT-CMU AND BSD-3-Clause AND MIT |
| nettle | 3.10.1-3.fc44 | LGPL-3.0-or-later OR GPL-2.0-or-later |
| net-tools | 2.0-0.77.20160912git.fc44 | GPL-2.0-or-later |
| NetworkManager | 1.56.1-2.fc44 | GPL-2.0-or-later AND LGPL-2.1-or-later |
| NetworkManager-bluetooth | 1.56.1-2.fc44 | GPL-2.0-or-later AND LGPL-2.1-or-later |
| NetworkManager-config-connectivity-fedora | 1.56.1-2.fc44 | GPL-2.0-or-later AND LGPL-2.1-or-later |
| NetworkManager-libnm | 1.56.1-2.fc44 | LGPL-2.1-or-later |
| NetworkManager-openconnect | 1.2.10-11.fc44 | GPL-2.0-or-later AND LGPL-2.1-only |
| NetworkManager-openvpn | 1.12.5-4.fc44 | GPL-2.0-or-later |
| NetworkManager-ppp | 1.56.1-2.fc44 | GPL-2.0-or-later AND LGPL-2.1-or-later |
| NetworkManager-vpnc | 1.4.0-6.fc44 | GPL-2.0-or-later |
| NetworkManager-wifi | 1.56.1-2.fc44 | GPL-2.0-or-later AND LGPL-2.1-or-later |
| NetworkManager-wwan | 1.56.1-2.fc44 | GPL-2.0-or-later AND LGPL-2.1-or-later |
| nfs-client-utils | 2.8.7-7.fc44 | GPL-2.0-only AND GPL-2.0-or-later AND BSD-3-Clause AND BSD-2-Clause AND (HPND-export-US-modify AND HPND-sell-variant) AND (GPL-2.0-only WITH Linux-syscall-note OR BSD-3-Clause) |
| nfs-common-utils | 2.8.7-7.fc44 | GPL-2.0-only AND GPL-2.0-or-later AND BSD-3-Clause AND BSD-2-Clause AND (HPND-export-US-modify AND HPND-sell-variant) AND (GPL-2.0-only WITH Linux-syscall-note OR BSD-3-Clause) |
| nfs-utils | 2.8.7-7.fc44 | GPL-2.0-only AND GPL-2.0-or-later AND BSD-3-Clause AND BSD-2-Clause AND (HPND-export-US-modify AND HPND-sell-variant) AND (GPL-2.0-only WITH Linux-syscall-note OR BSD-3-Clause) |
| nfsv3-client-utils | 2.8.7-7.fc44 | GPL-2.0-only AND GPL-2.0-or-later AND BSD-3-Clause AND BSD-2-Clause AND (HPND-export-US-modify AND HPND-sell-variant) AND (GPL-2.0-only WITH Linux-syscall-note OR BSD-3-Clause) |
| nfsv4-client-utils | 2.8.7-7.fc44 | GPL-2.0-only AND GPL-2.0-or-later AND BSD-3-Clause AND BSD-2-Clause AND (HPND-export-US-modify AND HPND-sell-variant) AND (GPL-2.0-only WITH Linux-syscall-note OR BSD-3-Clause) |
| nftables | 1.1.6-2.fc44 | GPL-2.0-only |
| nftables-services | 1.1.6-2.fc44 | GPL-2.0-only |
| ngtcp2 | 1.22.1-1.fc44 | MIT |
| ngtcp2-crypto-gnutls | 1.22.1-1.fc44 | MIT |
| ngtcp2-crypto-ossl | 1.22.1-1.fc44 | MIT |
| nilfs-utils | 2.2.11-8.fc44 | GPL-2.0-or-later |
| nodejs22 | 22.23.1-2.fc44 | Apache-2.0 AND Artistic-2.0 AND BSD-2-Clause AND BSD-3-Clause AND BlueOak-1.0.0 AND CC-BY-3.0 AND CC0-1.0 AND ISC AND MIT |
| nodejs22-bin | 22.23.1-2.fc44 | Apache-2.0 AND Artistic-2.0 AND BSD-2-Clause AND BSD-3-Clause AND BlueOak-1.0.0 AND CC-BY-3.0 AND CC0-1.0 AND ISC AND MIT |
| nodejs22-full-i18n | 22.23.1-2.fc44 | Apache-2.0 AND Artistic-2.0 AND BSD-2-Clause AND BSD-3-Clause AND BlueOak-1.0.0 AND CC-BY-3.0 AND CC0-1.0 AND ISC AND MIT |
| nodejs22-libs | 22.23.1-2.fc44 | Apache-2.0 AND Artistic-2.0 AND BSD-2-Clause AND BSD-3-Clause AND BlueOak-1.0.0 AND CC-BY-3.0 AND CC0-1.0 AND ISC AND MIT |
| noopenh264 | 2.6.0-4.fc44 | BSD-2-Clause and LGPL-2.1-or-later |
| npth | 1.8-4.fc44 | LGPL-2.1-or-later |
| nspr | 4.39.0-3.fc44 | MPL-2.0 |
| nss | 3.126.0-1.fc44 | MPL-2.0 |
| nss-altfiles | 2.23.0-9.fc44 | LGPL-2.1-or-later and MIT |
| nss-mdns | 0.15.1-28.fc44 | LGPL-2.1-or-later |
| nss-softokn | 3.126.0-1.fc44 | MPL-2.0 |
| nss-softokn-freebl | 3.126.0-1.fc44 | MPL-2.0 |
| nss-sysinit | 3.126.0-1.fc44 | MPL-2.0 |
| nss-util | 3.126.0-1.fc44 | MPL-2.0 |
| ntfs-3g | 2026.2.25-1.fc44 | GPL-2.0-or-later |
| ntfs-3g-libs | 2026.2.25-1.fc44 | GPL-2.0-or-later |
| ntfs-3g-system-compression | 1.1-2.fc44 | GPL-2.0-or-later |
| ntfsprogs | 2026.2.25-1.fc44 | GPL-2.0-or-later |
| numactl-libs | 2.0.19-4.fc44 | LGPL-2.1-only and GPL-2.0-only |
| nvme-cli | 2.16-3.fc44 | GPL-2.0-only |
| nxpwireless-firmware | 20260810-1.fc44 | LicenseRef-Callaway-Redistributable-no-modification-permitted |
| ocean-sound-theme | 6.7.4-1.fc44 | CC0-1.0 AND BSD-2-Clause AND CC-BY-SA-4.0 |
| ocfs2-tools | 1.8.9-2.fc44 | GPL-2.0-only |
| okular | 26.08.0-2.fc44 | GPL-2.0-only |
| okular-libs | 26.08.0-2.fc44 | GPL-2.0-only |
| okular-part | 26.08.0-2.fc44 | GPL-2.0-only |
| oniguruma | 6.9.10-4.fc44 | BSD-2-Clause |
| openal-soft | 1.24.2-6.fc44 | LGPL-2.0-or-later AND BSD-3-Clause AND GPL-2.0-or-later AND Apache-2.0 AND (LGPL-2.0-or-later AND BSD-3-Clause) AND (MIT WITH fmt-exception) AND NCL AND MIT AND LicenseRef-Fedora-Public-Domain |
| openapv-libs | 0.2.1.2-1.fc44 | BSD-3-Clause |
| openblas | 0.3.29-2.fc43 | BSD-3-Clause |
| openblas-openmp | 0.3.29-2.fc43 | BSD-3-Clause |
| OpenCL-ICD-Loader | 3.0.6-7.20250722gitad770a1.fc44 | Apache-2.0 |
| openconnect | 9.12-11.fc44 | LGPL-2.1-or-later |
| opencore-amr | 0.1.6-10.fc44 | Apache-2.0 |
| opencv-core | 4.13.0-1.fc44 | BSD-3-Clause AND Apache-2.0 AND ISC |
| opencv-imgproc | 4.13.0-1.fc44 | BSD-3-Clause AND Apache-2.0 AND ISC |
| openexr-libs | 3.2.4-7.fc44 | BSD-3-Clause WITH AdditionRef-OpenEXR-Additional-IP-Rights-Grant OR Apache-2.0 |
| openjpeg | 2.5.4-3.fc44 | BSD-2-Clause AND MIT |
| openldap | 2.6.13-1.fc44 | OLDAP-2.8 |
| openpace | 1.1.3-5.fc44 | GPL-3.0-only |
| openpgm | 5.3.128-6.fc44 | LGPL-2.1-or-later |
| open-sans-fonts | 1.10-25.fc44 | Apache-2.0 |
| opensc | 0.27.1-2.fc44 | LGPL-2.1-or-later AND BSD-3-Clause |
| opensc-libs | 0.27.1-2.fc44 | LGPL-2.1-or-later AND BSD-3-Clause |
| openssh | 10.2p1-14.fc44 | BSD-3-Clause AND BSD-2-Clause AND ISC AND SSH-OpenSSH AND ssh-keyscan AND snprintf AND LicenseRef-Fedora-Public-Domain AND X11-distribute-modifications-variant |
| openssh-askpass | 10.2p1-14.fc44 | BSD-3-Clause AND BSD-2-Clause AND ISC AND SSH-OpenSSH AND ssh-keyscan AND snprintf AND LicenseRef-Fedora-Public-Domain AND X11-distribute-modifications-variant |
| openssh-clients | 10.2p1-14.fc44 | BSD-3-Clause AND BSD-2-Clause AND ISC AND SSH-OpenSSH AND ssh-keyscan AND snprintf AND LicenseRef-Fedora-Public-Domain AND X11-distribute-modifications-variant |
| openssh-server | 10.2p1-14.fc44 | BSD-3-Clause AND BSD-2-Clause AND ISC AND SSH-OpenSSH AND ssh-keyscan AND snprintf AND LicenseRef-Fedora-Public-Domain AND X11-distribute-modifications-variant |
| openssl | 3.5.7-2.fc44 | Apache-2.0 |
| openssl-libs | 3.5.7-2.fc44 | Apache-2.0 |
| open-vm-tools | 13.1.0-2.fc44 | GPL-2.0-only AND W3C AND LGPL-2.1-only AND ICU AND ISC AND MIT |
| open-vm-tools-desktop | 13.1.0-2.fc44 | GPL-2.0-only AND W3C AND LGPL-2.1-only AND ICU AND ISC AND MIT |
| openvpn | 2.7.6-1.fc44 | GPL-2.0-only |
| openxr-libs | 1.1.62-1.fc44 | Apache-2.0 |
| opus | 1.6-2.fc44 | BSD-3-Clause AND BSD-2-Clause |
| opusfile | 0.12-18.fc44 | BSD-3-Clause |
| opus-tools | 0.2-20.fc44 | LicenseRef-Callaway-BSD AND GPL-2.0-only |
| orc | 0.4.41-3.fc44 | BSD-2-Clause AND BSD-3-Clause |
| orca | 50.2-1.fc44 | LGPL-2.1-or-later AND CC-BY-SA-3.0 |
| os-prober | 1.81-11.fc44 | GPL-2.0-or-later AND GPL-1.0-or-later |
| ostree | 2026.3-1.fc44 | LGPL-2.0-or-later |
| ostree-libs | 2026.3-1.fc44 | LGPL-2.0-or-later |
| p11-kit | 0.26.5-1.fc44 | BSD-3-Clause |
| p11-kit-server | 0.26.5-1.fc44 | BSD-3-Clause |
| p11-kit-trust | 0.26.5-1.fc44 | BSD-3-Clause |
| PackageKit-Qt6 | 1.1.4-4.fc44 | LGPL-2.1-only |
| paktype-naskh-basic-fonts | 7.0-4.20231228.fc44 | GPL-2.0-only WITH Font-exception-2.0 |
| pam | 1.7.2-2.fc44 | BSD-3-Clause AND GPL-2.0-or-later |
| pam_afs_session | 2.6-25.fc44 | MIT |
| pam-kwallet | 6.7.4-1.fc44 | LGPL-2.0-or-later |
| pam-libs | 1.7.2-2.fc44 | BSD-3-Clause AND GPL-2.0-or-later |
| pam_passwdqc | 2.0.3-9.fc44 | BSD-3-Clause |
| pango | 1.57.1-1.fc44 | LGPL-2.0-or-later |
| pangomm2.48 | 2.56.2-1.fc44 | LGPL-2.1-or-later |
| paper-icon-theme | 1.5.0-20.20200312gitaa3e8af.fc44 | CC-BY-SA-4.0 |
| papirus-icon-theme | 20250501-2.fc44 | GPL-3.0-only AND CC-BY-SA-4.0 AND LGPL-3.0-or-later |
| papirus-icon-theme-dark | 20250501-2.fc44 | GPL-3.0-only AND CC-BY-SA-4.0 AND LGPL-3.0-or-later |
| paps | 0.8.0-15.fc44 | LGPL-2.0-or-later |
| parted | 3.6-14.fc44 | GPL-3.0-or-later |
| passim | 0.1.12-1.fc44 | LGPL-2.1-or-later |
| passim-libs | 0.1.12-1.fc44 | LGPL-2.1-or-later |
| passt | 0^20260728.gf8df3f1-2.fc44 | GPL-2.0-or-later AND BSD-3-Clause |
| passt-selinux | 0^20260728.gf8df3f1-2.fc44 | GPL-2.0-or-later AND BSD-3-Clause |
| passwdqc | 2.0.3-9.fc44 | BSD-3-Clause |
| passwdqc-utils | 2.0.3-9.fc44 | BSD-3-Clause |
| pcaudiolib | 1.1-19.fc44 | GPL-3.0-or-later |
| pciutils | 3.15.0-1.fc44 | GPL-2.0-or-later |
| pciutils-libs | 3.15.0-1.fc44 | GPL-2.0-or-later |
| pcre2 | 10.47-1.fc44.1 | BSD-3-Clause AND FSFULLR AND X11 AND GPL-2.0-or-later AND FSFAP AND FSFUL AND GPL-3.0-or-later |
| pcre2-syntax | 10.47-1.fc44.1 | BSD-3-Clause AND FSFULLR AND X11 AND GPL-2.0-or-later AND FSFAP AND FSFUL AND GPL-3.0-or-later |
| pcre2-utf16 | 10.47-1.fc44.1 | BSD-3-Clause AND FSFULLR AND X11 AND GPL-2.0-or-later AND FSFAP AND FSFUL AND GPL-3.0-or-later |
| pcre2-utf32 | 10.47-1.fc44.1 | BSD-3-Clause AND FSFULLR AND X11 AND GPL-2.0-or-later AND FSFAP AND FSFUL AND GPL-3.0-or-later |
| pcsc-lite | 2.4.1-2.fc44 | BSD-3-Clause AND BSD-2-Clause AND GPL-3.0-or-later |
| pcsc-lite-ccid | 1.7.1-2.fc44 | BSD-3-Clause AND GPL-2.0-or-later AND LGPL-2.1-or-later |
| pcsc-lite-libs | 2.4.1-2.fc44 | BSD-3-Clause AND BSD-2-Clause AND GPL-3.0-or-later |
| perl-AutoLoader | 5.74-525.fc44 | GPL-1.0-or-later OR Artistic-1.0-Perl |
| perl-B | 1.89-525.fc44 | GPL-1.0-or-later OR Artistic-1.0-Perl |
| perl-base | 2.27-525.fc44 | GPL-1.0-or-later OR Artistic-1.0-Perl |
| perl-Carp | 1.54-521.fc44 | GPL-1.0-or-later OR Artistic-1.0-Perl |
| perl-Class-Struct | 0.68-525.fc44 | GPL-1.0-or-later OR Artistic-1.0-Perl |
| perl-constant | 1.33-522.fc44 | GPL-1.0-or-later OR Artistic-1.0-Perl |
| perl-Data-Dumper | 2.192-523.fc44 | GPL-1.0-or-later OR Artistic-1.0-Perl |
| perl-Digest | 1.20-521.fc44 | GPL-1.0-or-later OR Artistic-1.0-Perl |
| perl-Digest-MD5 | 2.59-521.fc44 | GPL-1.0-or-later OR Artistic-1.0-Perl |
| perl-DynaLoader | 1.57-525.fc44 | GPL-1.0-or-later OR Artistic-1.0-Perl |
| perl-Encode | 3.21-521.fc44 | (GPL-1.0-or-later OR Artistic-1.0-Perl) AND Artistic-2.0 |
| perl-Errno | 1.38-525.fc44 | GPL-1.0-or-later OR Artistic-1.0-Perl |
| perl-Error | 0.17030-3.fc44 | (GPL-1.0-or-later OR Artistic-1.0-Perl) AND X11 |
| perl-Exporter | 5.79-521.fc44 | GPL-1.0-or-later OR Artistic-1.0-Perl |
| perl-Fcntl | 1.20-525.fc44 | GPL-1.0-or-later OR Artistic-1.0-Perl |
| perl-File-Basename | 2.86-525.fc44 | GPL-1.0-or-later OR Artistic-1.0-Perl |
| perl-FileHandle | 2.05-525.fc44 | GPL-1.0-or-later OR Artistic-1.0-Perl |
| perl-File-Path | 2.18-522.fc44 | GPL-1.0-or-later OR Artistic-1.0-Perl |
| perl-File-stat | 1.14-525.fc44 | GPL-1.0-or-later OR Artistic-1.0-Perl |
| perl-File-Temp | 0.231.200-2.fc44 | GPL-1.0-or-later OR Artistic-1.0-Perl |
| perl-Getopt-Long | 2.58-521.fc44 | GPL-2.0-or-later OR Artistic-1.0-Perl |
| perl-Getopt-Std | 1.14-525.fc44 | GPL-1.0-or-later OR Artistic-1.0-Perl |
| perl-Git | 2.55.0-1.fc44 | BSD-3-Clause AND GPL-2.0-only AND GPL-2.0-or-later AND LGPL-2.1-or-later AND MIT |
| perl-HTTP-Tiny | 0.096-1.fc44 | GPL-1.0-or-later OR Artistic-1.0-Perl |
| perl-if | 0.61.000-525.fc44 | GPL-1.0-or-later OR Artistic-1.0-Perl |
| perl-interpreter | 5.42.3-525.fc44 | GPL-1.0-or-later OR Artistic-1.0-Perl |
| perl-IO | 1.55-525.fc44 | GPL-1.0-or-later OR Artistic-1.0-Perl |
| perl-IO-Socket-IP | 0.43-522.fc44 | GPL-1.0-or-later OR Artistic-1.0-Perl |
| perl-IO-Socket-SSL | 2.098-2.fc44 | (GPL-1.0-or-later OR Artistic-1.0-Perl) AND MPL-2.0 |
| perl-IPC-Open3 | 1.24-525.fc44 | GPL-1.0-or-later OR Artistic-1.0-Perl |
| perl-lib | 0.65-525.fc44 | GPL-1.0-or-later OR Artistic-1.0-Perl |
| perl-libnet | 3.15-522.fc44 | GPL-1.0-or-later OR Artistic-1.0-Perl |
| perl-libs | 5.42.3-525.fc44 | (GPL-1.0-or-later OR Artistic-1.0-Perl) AND Martin-Birgmeier AND Spencer-86 AND MIT AND Unicode-3.0 AND LicenseRef-Fedora-Public-Domain |
| perl-locale | 1.13-525.fc44 | GPL-1.0-or-later OR Artistic-1.0-Perl |
| perl-MIME-Base32 | 1.303-25.fc44 | GPL-1.0-or-later OR Artistic-1.0-Perl |
| perl-MIME-Base64 | 3.16-521.fc44 | (GPL-1.0-or-later OR Artistic-1.0-Perl) AND metamail |
| perl-mro | 1.29-525.fc44 | GPL-1.0-or-later OR Artistic-1.0-Perl |
| perl-Net-SSLeay | 1.94-12.fc44 | Artistic-2.0 |
| perl-overload | 1.40-525.fc44 | GPL-1.0-or-later OR Artistic-1.0-Perl |
| perl-overloading | 0.02-525.fc44 | GPL-1.0-or-later OR Artistic-1.0-Perl |
| perl-parent | 0.244-521.fc44 | GPL-1.0-or-later OR Artistic-1.0-Perl |
| perl-PathTools | 3.94-521.fc44 | ( GPL-1.0-or-later OR Artistic-1.0-Perl ) AND BSD-3-Clause |
| perl-Pod-Escapes | 1.07-521.fc44 | GPL-1.0-or-later OR Artistic-1.0-Perl |
| perl-podlators | 6.0.2-521.fc44 | (GPL-1.0-or-later OR Artistic-1.0-Perl) AND FSFAP |
| perl-Pod-Perldoc | 3.28.01-522.fc44 | GPL-1.0-or-later OR Artistic-1.0-Perl |
| perl-Pod-Simple | 3.47-4.fc44 | GPL-1.0-or-later OR Artistic-1.0-Perl |
| perl-Pod-Usage | 2.05-521.fc44 | GPL-1.0-or-later OR Artistic-1.0-Perl |
| perl-POSIX | 2.23-525.fc44 | GPL-1.0-or-later OR Artistic-1.0-Perl |
| perl-Scalar-List-Utils | 1.70-2.fc44 | GPL-1.0-or-later OR Artistic-1.0-Perl |
| perl-SelectSaver | 1.02-525.fc44 | GPL-1.0-or-later OR Artistic-1.0-Perl |
| perl-Socket | 2.043-1.fc44 | GPL-1.0-or-later OR Artistic-1.0-Perl |
| perl-Storable | 3.37-522.fc44 | GPL-1.0-or-later OR Artistic-1.0-Perl |
| perl-Symbol | 1.09-525.fc44 | GPL-1.0-or-later OR Artistic-1.0-Perl |
| perl-Term-ANSIColor | 5.01-522.fc44 | GPL-1.0-or-later OR Artistic-1.0-Perl |
| perl-Term-Cap | 1.18-521.fc44 | GPL-1.0-or-later OR Artistic-1.0-Perl |
| perl-TermReadKey | 2.38-27.fc44 | TermReadKey AND (GPL-1.0-or-later OR Artistic-1.0-Perl) |
| perl-Text-ParseWords | 3.31-521.fc44 | GPL-1.0-or-later OR Artistic-1.0-Perl |
| perl-Text-Tabs+Wrap | 2024.001-521.fc44 | TTWL |
| perl-Time-HiRes | 1.9778-521.fc44 | GPL-1.0-or-later OR Artistic-1.0-Perl |
| perl-Time-Local | 1.350-521.fc44 | GPL-1.0-or-later OR Artistic-1.0-Perl |
| perl-Unicode-Normalize | 1.32-521.fc44 | GPL-1.0-or-later OR Artistic-1.0-Perl |
| perl-URI | 5.36-1.fc44 | GPL-1.0-or-later OR Artistic-1.0-Perl |
| perl-vars | 1.05-525.fc44 | GPL-1.0-or-later OR Artistic-1.0-Perl |
| phonon-backend-vlc-common | 0.12.0-8.fc44 | LGPL-2.1-or-later |
| phonon-common | 4.12.0-11.fc44 | LicenseRef-Callaway-LGPLv2+ |
| phonon-qt6 | 4.12.0-11.fc44 | LicenseRef-Callaway-LGPLv2+ |
| phonon-qt6-backend-vlc | 0.12.0-8.fc44 | LGPL-2.1-or-later |
| pinentry | 1.3.2-3.fc44 | GPL-2.0-or-later |
| pinentry-qt | 1.3.2-3.fc44 | GPL-2.0-or-later |
| pinfo | 0.6.13-10.fc44 | GPL-2.0-only |
| pipewire | 1.6.8-1.fc44 | MIT |
| pipewire-alsa | 1.6.8-1.fc44 | MIT |
| pipewire-config-raop | 1.6.8-1.fc44 | MIT |
| pipewire-gstreamer | 1.6.8-1.fc44 | MIT |
| pipewire-jack-audio-connection-kit | 1.6.8-1.fc44 | MIT |
| pipewire-jack-audio-connection-kit-libs | 1.6.8-1.fc44 | MIT |
| pipewire-libs | 1.6.8-1.fc44 | MIT AND GPL-2.0-or-later AND BSD-2-Clause AND LGPL-2.0-or-later |
| pipewire-plugin-libcamera | 1.6.8-1.fc44 | MIT |
| pipewire-pulseaudio | 1.6.8-1.fc44 | MIT |
| pipewire-utils | 1.6.8-1.fc44 | MIT |
| pixman | 0.46.2-3.fc44 | MIT |
| pkcs11-helper | 1.30.0-5.fc44 | GPL-2.0-only OR BSD-3-Clause |
| pkcs11-provider | 1.1-3.fc44 | Apache-2.0 |
| pkgconf | 2.5.1-1.fc44 | ISC AND BSD-4-Clause AND BSD-2-Clause AND pkgconf AND MIT |
| pkgconf-m4 | 2.5.1-1.fc44 | GPL-2.0-or-later WITH Autoconf-exception-generic |
| pkgconf-pkg-config | 2.5.1-1.fc44 | ISC AND BSD-4-Clause AND BSD-2-Clause AND pkgconf AND MIT |
| plasma5support | 6.7.4-1.fc44 | CC0-1.0 AND GPL-2.0-or-later AND LGPL-2.0-or-later |
| plasma-activities | 6.7.4-1.fc44 | CC0-1.0 AND GPL-2.0-or-later AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-3.0-only AND (LGPL-2.1-only OR LGPL-3.0-only) AND MIT |
| plasma-activities-stats | 6.7.4-1.fc44 | CC0-1.0, GPL-2.0-only AND GPL-2.0-or-later AND GPL-3.0-only AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-3.0-only AND (GPL-2.0-only OR GPL-3.0-only) AND (LGPL-2.1-only OR LGPL-3.0-only) |
| plasma-breeze | 6.7.4-2.fc44 | BSD-3-Clause AND CC0-1.0 AND GPL-2.0-only AND GPL-2.0-or-later AND GPL-3.0-only AND (GPL-2.0-only OR GPL-3.0-only) AND MIT |
| plasma-breeze-common | 6.7.4-2.fc44 | BSD-3-Clause AND CC0-1.0 AND GPL-2.0-only AND GPL-2.0-or-later AND GPL-3.0-only AND (GPL-2.0-only OR GPL-3.0-only) AND MIT |
| plasma-breeze-qt5 | 6.7.4-2.fc44 | BSD-3-Clause AND CC0-1.0 AND GPL-2.0-only AND GPL-2.0-or-later AND GPL-3.0-only AND (GPL-2.0-only OR GPL-3.0-only) AND MIT |
| plasma-breeze-qt6 | 6.7.4-2.fc44 | BSD-3-Clause AND CC0-1.0 AND GPL-2.0-only AND GPL-2.0-or-later AND GPL-3.0-only AND (GPL-2.0-only OR GPL-3.0-only) AND MIT |
| plasma-browser-integration | 6.7.4-1.fc44 | CC0-1.0 AND GPL-2.0-or-later AND GPL-3.0-or-later AND MIT |
| plasma-desktop | 6.7.4-1.fc44 | BSD-2-Clause AND BSD-3-Clause AND CC0-1.0 AND GPL-2.0-only AND GPL-2.0-or-later AND GPL-3.0-only AND LGPL-2.0-only AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-2.1-or-later AND LGPL-3.0-only AND (GPL-2.0-only OR GPL-3.0-only) AND (LGPL-2.1-only OR LGPL-3.0-only) |
| plasma-desktop-doc | 6.7.4-1.fc44 | BSD-2-Clause AND BSD-3-Clause AND CC0-1.0 AND GPL-2.0-only AND GPL-2.0-or-later AND GPL-3.0-only AND LGPL-2.0-only AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-2.1-or-later AND LGPL-3.0-only AND (GPL-2.0-only OR GPL-3.0-only) AND (LGPL-2.1-only OR LGPL-3.0-only) |
| plasma-discover | 6.7.4-1.fc44 | BSD-3-Clause AND CC0-1.0 AND GPL-2.0-only AND GPL-2.0-or-later AND GPL-3.0-only AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-3.0-only AND (GPL-2.0-only OR GPL-3.0-only) AND (LGPL-2.1-only OR LGPL-3.0-only) |
| plasma-discover-flatpak | 6.7.4-1.fc44 | BSD-3-Clause AND CC0-1.0 AND GPL-2.0-only AND GPL-2.0-or-later AND GPL-3.0-only AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-3.0-only AND (GPL-2.0-only OR GPL-3.0-only) AND (LGPL-2.1-only OR LGPL-3.0-only) |
| plasma-discover-kns | 6.7.4-1.fc44 | BSD-3-Clause AND CC0-1.0 AND GPL-2.0-only AND GPL-2.0-or-later AND GPL-3.0-only AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-3.0-only AND (GPL-2.0-only OR GPL-3.0-only) AND (LGPL-2.1-only OR LGPL-3.0-only) |
| plasma-discover-libs | 6.7.4-1.fc44 | BSD-3-Clause AND CC0-1.0 AND GPL-2.0-only AND GPL-2.0-or-later AND GPL-3.0-only AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-3.0-only AND (GPL-2.0-only OR GPL-3.0-only) AND (LGPL-2.1-only OR LGPL-3.0-only) |
| plasma-discover-notifier | 6.7.4-1.fc44 | BSD-3-Clause AND CC0-1.0 AND GPL-2.0-only AND GPL-2.0-or-later AND GPL-3.0-only AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-3.0-only AND (GPL-2.0-only OR GPL-3.0-only) AND (LGPL-2.1-only OR LGPL-3.0-only) |
| plasma-discover-rpm-ostree | 6.7.4-1.fc44 | BSD-3-Clause AND CC0-1.0 AND GPL-2.0-only AND GPL-2.0-or-later AND GPL-3.0-only AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-3.0-only AND (GPL-2.0-only OR GPL-3.0-only) AND (LGPL-2.1-only OR LGPL-3.0-only) |
| plasma-disks | 6.7.4-1.fc44 | BSD-3-Clause AND CC0-1.0 AND FSFAP AND GPL-2.0-only AND GPL-3.0-only AND LGPL-3.0-only AND (GPL-2.0-only OR GPL-3.0-only) AND (LGPL-2.1-only OR LGPL-3.0-only) |
| plasma-drkonqi | 6.7.4-1.fc44 | BSD-2-Clause AND BSD-3-Clause AND CC0-1.0 AND GPL-2.0-only AND GPL-2.0-or-later AND GPL-3.0-only AND LGPL-2.1-only AND LGPL-3.0-only AND LGPL-3.0-or-later AND (GPL-2.0-only OR GPL-3.0-only) AND (LGPL-2.1-only OR LGPL-3.0-only) |
| plasma-integration | 6.7.4-1.fc44 | BSD-3-Clause AND CC0-1.0 AND GPL-2.0-only AND GPL-3.0-only AND LGPL-2.0-only AND LGPL-2.0-or-later AND LGPL-2.1-or-later AND LGPL-3.0-only AND (LGPL-2.1-only OR LGPL-3.0-only) |
| plasma-integration-qt5 | 6.7.4-1.fc44 | BSD-3-Clause AND CC0-1.0 AND GPL-2.0-only AND GPL-3.0-only AND LGPL-2.0-only AND LGPL-2.0-or-later AND LGPL-2.1-or-later AND LGPL-3.0-only AND (LGPL-2.1-only OR LGPL-3.0-only) |
| plasma-keyboard | 6.7.4-1.fc44 | LGPL-2.1-only AND GPL-2.0-only AND CC0-1.0 AND LGPL-3.0-only AND GPL-3.0-or-later AND GPL-2.0-or-later AND GPL-3.0-only |
| plasma-login-manager | 6.7.4-1.fc44 | BSD-3-Clause and CC0-1.0 and (GPL-2.0-only or GPL-3.0-only) and GPL-2.0-or-later and LGPL-2.0-or-later and LGPL-2.1-or-later |
| plasma-lookandfeel-fedora | 6.7.4-1.fc44 | BSD-2-Clause AND BSD-3-Clause AND CC0-1.0 AND GPL-2.0-only AND GPL-2.0-or-later AND GPL-3.0-only AND LGPL-2.0-only AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-2.1-or-later AND LGPL-3.0-only AND LGPL-3.0-or-later AND (GPL-2.0-only OR GPL-3.0-only) AND (LGPL-2.1-only OR LGPL-3.0-only) AND MIT |
| plasma-milou | 6.7.4-1.fc44 | CC0-1.0 AND GPL-2.0-only AND GPL-2.0-or-later AND GPL-3.0-only AND LGPL-2.1-only AND LGPL-3.0-only AND (GPL-2.0-only OR GPL-3.0-only) AND (LGPL-2.1-only OR LGPL-3.0-only) |
| plasma-nm | 6.7.4-1.fc44 | BSD-3-Clause AND CC0-1.0 AND GPL-2.0-only AND GPL-2.0-or-later AND GPL-3.0-only AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-3.0-only AND (GPL-2.0-only OR GPL-3.0-only) AND (LGPL-2.1-only OR LGPL-3.0-only) |
| plasma-nm-openconnect | 6.7.4-1.fc44 | BSD-3-Clause AND CC0-1.0 AND GPL-2.0-only AND GPL-2.0-or-later AND GPL-3.0-only AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-3.0-only AND (GPL-2.0-only OR GPL-3.0-only) AND (LGPL-2.1-only OR LGPL-3.0-only) |
| plasma-nm-openvpn | 6.7.4-1.fc44 | BSD-3-Clause AND CC0-1.0 AND GPL-2.0-only AND GPL-2.0-or-later AND GPL-3.0-only AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-3.0-only AND (GPL-2.0-only OR GPL-3.0-only) AND (LGPL-2.1-only OR LGPL-3.0-only) |
| plasma-nm-vpnc | 6.7.4-1.fc44 | BSD-3-Clause AND CC0-1.0 AND GPL-2.0-only AND GPL-2.0-or-later AND GPL-3.0-only AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-3.0-only AND (GPL-2.0-only OR GPL-3.0-only) AND (LGPL-2.1-only OR LGPL-3.0-only) |
| plasma-pa | 6.7.4-1.fc44 | BSD-3-Clause AND CC0-1.0 AND GPL-2.0-only AND GPL-3.0-only AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-3.0-only AND (GPL-2.0-only OR GPL-3.0-only) AND (LGPL-2.1-only OR LGPL-3.0-only) |
| plasma-print-manager | 6.7.4-1.fc44 | BSD-3-Clause AND GPL-2.0-or-later AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-3.0-only AND (LGPL-2.1-only OR LGPL-3.0-only) |
| plasma-print-manager-libs | 6.7.4-1.fc44 | BSD-3-Clause AND GPL-2.0-or-later AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-3.0-only AND (LGPL-2.1-only OR LGPL-3.0-only) |
| plasma-setup | 6.7.4-1.fc44 | (GPL-2.0-or-later or GPL-3.0-or-later) and GPL-2.0-or-later and GPL-3.0-or-later and (LGPL-2.0-or-later or LGPL-3.0-or-later) and (LGPL-2.1-or-later or LGPL-3.0-or-later) and LGPL-2.1-or-later and BSD-2-Clause and CC0-1.0 |
| plasma-systemmonitor | 6.7.4-1.fc44 | BSD-3-Clause AND CC0-1.0 AND GPL-2.0-only AND GPL-3.0-only AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-3.0-only AND LGPL-3.0-or-later AND (GPL-2.0-only OR GPL-3.0-only) AND (LGPL-2.1-only OR LGPL-3.0-only) |
| plasma-systemsettings | 6.7.4-1.fc44 | BSD-2-Clause AND CC0-1.0 AND GPL-2.0-only AND GPL-2.0-or-later AND GPL-3.0-only AND LGPL-2.0-only AND LGPL-2.1-or-later AND (GPL-2.0-only OR GPL-3.0-only) |
| plasma-thunderbolt | 6.7.4-1.fc44 | BSD-3-Clause AND CC0-1.0 AND GPL-2.0-only AND GPL-3.0-only AND (GPL-2.0-only OR GPL-3.0-only) |
| plasma-vault | 6.7.4-1.fc44 | CC0-1.0 AND GPL-2.0-only AND GPL-3.0-only AND LGPL-2.1-only AND LGPL-3.0-only AND (GPL-2.0-only OR GPL-3.0-only) AND (LGPL-2.1-only OR LGPL-3.0-only) |
| plasma-workspace | 6.7.4-1.fc44 | BSD-2-Clause AND BSD-3-Clause AND CC0-1.0 AND GPL-2.0-only AND GPL-2.0-or-later AND GPL-3.0-only AND LGPL-2.0-only AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-2.1-or-later AND LGPL-3.0-only AND LGPL-3.0-or-later AND (GPL-2.0-only OR GPL-3.0-only) AND (LGPL-2.1-only OR LGPL-3.0-only) AND MIT |
| plasma-workspace-common | 6.7.4-1.fc44 | BSD-2-Clause AND BSD-3-Clause AND CC0-1.0 AND GPL-2.0-only AND GPL-2.0-or-later AND GPL-3.0-only AND LGPL-2.0-only AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-2.1-or-later AND LGPL-3.0-only AND LGPL-3.0-or-later AND (GPL-2.0-only OR GPL-3.0-only) AND (LGPL-2.1-only OR LGPL-3.0-only) AND MIT |
| plasma-workspace-libs | 6.7.4-1.fc44 | BSD-2-Clause AND BSD-3-Clause AND CC0-1.0 AND GPL-2.0-only AND GPL-2.0-or-later AND GPL-3.0-only AND LGPL-2.0-only AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-2.1-or-later AND LGPL-3.0-only AND LGPL-3.0-or-later AND (GPL-2.0-only OR GPL-3.0-only) AND (LGPL-2.1-only OR LGPL-3.0-only) AND MIT |
| plutosvg | 0.0.8-2.fc44 | MIT |
| plutovg | 1.3.3-1.fc44 | MIT AND FTL |
| plymouth | 24.004.60-24.fc44 | GPL-2.0-or-later |
| plymouth-core-libs | 24.004.60-24.fc44 | GPL-2.0-or-later |
| plymouth-graphics-libs | 24.004.60-24.fc44 | GPL-2.0-or-later |
| plymouth-plugin-label | 24.004.60-24.fc44 | GPL-2.0-or-later |
| plymouth-plugin-script | 24.004.60-24.fc44 | GPL-2.0-or-later |
| plymouth-plugin-two-step | 24.004.60-24.fc44 | GPL-2.0-or-later |
| plymouth-scripts | 24.004.60-24.fc44 | GPL-2.0-or-later |
| plymouth-system-theme | 24.004.60-24.fc44 | GPL-2.0-or-later |
| plymouth-theme-spinner | 24.004.60-24.fc44 | GPL-2.0-or-later |
| podman | 5.8.4-1.fc44 | Apache-2.0 AND BSD-2-Clause AND BSD-3-Clause AND ISC AND MIT AND MPL-2.0 |
| podman-sequoia | 0.3.2-2.fc44 | ((MIT OR Apache-2.0) AND Unicode-DFS-2016) AND (0BSD OR MIT OR Apache-2.0) AND Apache-2.0 AND (Apache-2.0 OR MIT) AND (Apache-2.0 WITH LLVM-exception OR Apache-2.0 OR MIT) AND (BSD-2-Clause OR Apache-2.0 OR MIT) AND BSD-3-Clause AND BSL-1.0 AND LGPL-2.0-or-later AND MIT AND (MIT OR Apache-2.0) AND (MIT OR Zlib OR Apache-2.0) AND MPL-2.0 AND Unicode-3.0 AND (Unlicense OR MIT) AND Zlib |
| policycoreutils | 3.11-2.fc44 | GPL-2.0-or-later |
| policycoreutils-python-utils | 3.11-2.fc44 | GPL-2.0-or-later |
| polkit | 127-2.fc44.2 | LGPL-2.0-or-later |
| polkit-kde | 6.7.4-1.fc44 | GPL-2.0-or-later AND CC0-1.0 |
| polkit-libs | 127-2.fc44.2 | LGPL-2.0-or-later |
| polkit-qt5-1 | 0.201.1-1.fc44 | BSD-3-Clause AND GPL-2.0-or-later AND LGPL-2.0-or-later |
| polkit-qt6-1 | 0.201.1-1.fc44 | BSD-3-Clause AND GPL-2.0-or-later AND LGPL-2.0-or-later |
| poly2tri | 0.0^20130501hg26242d0aa7b8-7.fc44 | LicenseRef-Callaway-BSD |
| poppler | 26.01.0-3.fc44 | (GPL-2.0-only OR GPL-3.0-only) AND GPL-2.0-or-later AND LGPL-2.0-or-later AND LGPL-2.1-or-later AND MIT |
| poppler-cpp | 26.01.0-3.fc44 | (GPL-2.0-only OR GPL-3.0-only) AND GPL-2.0-or-later AND LGPL-2.0-or-later AND LGPL-2.1-or-later AND MIT |
| poppler-data | 0.4.11-11.fc44 | (GPL-2.0-only OR GPL-3.0-only) AND BSD-3-Clause |
| poppler-qt6 | 26.01.0-3.fc44 | (GPL-2.0-only OR GPL-3.0-only) AND GPL-2.0-or-later AND LGPL-2.0-or-later AND LGPL-2.1-or-later AND MIT |
| poppler-utils | 26.01.0-3.fc44 | (GPL-2.0-only OR GPL-3.0-only) AND GPL-2.0-or-later AND LGPL-2.0-or-later AND LGPL-2.1-or-later AND MIT |
| popt | 1.19-10.fc44 | MIT AND LicenseRef-Fedora-Public-Domain |
| portaudio | 19.7.0-3.fc44 | MIT |
| powerdevil | 6.7.4-1.fc44 | BSD-3-Clause AND CC0-1.0 AND GPL-2.0-only AND GPL-2.0-or-later AND GPL-3.0-only AND LGPL-2.0-only AND LGPL-2.1-only AND LGPL-2.1-or-later AND LGPL-3.0-only AND (GPL-2.0-only OR GPL-3.0-only) AND (LGPL-2.1-only OR LGPL-3.0-only) |
| ppp | 2.5.1-7.fc44 | bsd-3-clause AND zlib AND licenseref-fedora-public-domain AND bsd-attribution-hpnd-disclaimer AND bsd-4.3tahoe AND bsd-4-clause-uc AND apache-2.0 AND lgpl-2.0-or-later AND (gpl-2.0-or-later OR bsd-2-clause OR bsd-3-clause OR bsd-4-clause) AND gpl-2.0-or-later AND xlock AND gpl-1.0-or-later AND mackerras-3-clause-acknowledgment AND mackerras-3-clause AND hpnd-fenneberg-Livingston AND sun-ppp AND hpnd-inria-imag AND sun-ppp-2000 |
| prefixdevname | 0.2.0-8.fc44 | MIT AND (MIT OR Apache-2.0) AND (Unlicense OR MIT) AND Unicode-DFS-2016 |
| printer-driver-brlaser | 6.2.7-3.fc44 | GPL-2.0-or-later |
| procps-ng | 4.0.6-1.fc44 | GPL-2.0-or-later AND LGPL-2.0-or-later AND LGPL-2.1-or-later |
| protobuf-c | 1.5.2-2.fc44 | BSD-2-Clause |
| psmisc | 23.7-7.fc44 | GPL-2.0-or-later |
| ptouch-driver | 1.7.1-3.fc44 | GPL-2.0-or-later |
| publicsuffix-list-dafsa | 20260116-1.fc44 | MPL-2.0 |
| pugixml | 1.16-1.fc44 | MIT |
| pulseaudio-libs | 17.0-9.fc44 | LGPL-2.1-or-later |
| pulseaudio-libs-glib2 | 17.0-9.fc44 | LGPL-2.1-or-later |
| pulseaudio-qt-qt6 | 1.8.1-1.fc44 | CC0-1.0 AND LGPL-2.1-only AND LGPL-3.0-only |
| pulseaudio-utils | 17.0-9.fc44 | LGPL-2.1-or-later |
| python3 | 3.14.7-1.fc44 | Python-2.0.1 |
| python3-anyio | 4.13.0-1.fc44 | MIT |
| python3-audit | 4.2.1-1.fc44 | LGPL-2.0-or-later |
| python3-brlapi | 0.8.7-8.fc44 | LGPL-2.0-or-later AND LGPL-2.1-or-later AND GPL-2.0-or-later |
| python3-cairo | 1.28.0-5.fc44 | LGPL-2.1-only OR MPL-1.1 |
| python3-certifi | 2026.01.04-1.fc44 | MPL-2.0 |
| python3-charset-normalizer | 3.4.4-2.fc44 | MIT |
| python3-click | 8.3.3-1.fc44 | BSD-3-Clause |
| python3-cups | 2.0.4-8.fc44 | GPL-2.0-or-later |
| python3-dasbus | 1.7-14.fc44 | LGPL-2.1-or-later |
| python3-dateutil | 2.9.0.post0-7.fc44 | (Apache-2.0 AND BSD-3-Clause) OR BSD-3-Clause |
| python3-dbus | 1.4.0-9.fc44 | MIT |
| python3-distro | 1.9.0-11.fc44 | Apache-2.0 |
| python3-enchant | 3.3.0-2.fc44 | LGPL-2.1-or-later |
| python3-file-magic | 5.46-10.fc44 | BSD-2-Clause-Darwin AND BSD-2-Clause |
| python3-firewall | 2.4.4-1.fc44 | GPL-2.0-or-later |
| python3-gobject | 3.56.3-1.fc44 | LGPL-2.1-or-later |
| python3-gobject-base | 3.56.3-1.fc44 | LGPL-2.1-or-later |
| python3-h11 | 0.16.0-6.fc44 | MIT |
| python3-html2text | 2025.4.15-6.fc44 | GPL-3.0-or-later |
| python3-httpcore | 1.0.9-6.fc44 | BSD-3-Clause |
| python3-httpx | 0.28.1-11.fc44 | BSD-3-Clause |
| python3-ibus | 1.5.34-4.fc44 | LGPL-2.1-or-later |
| python3-idna | 3.18-1.fc44 | BSD-3-Clause |
| python3-inotify | 0.9.6-43.fc44 | MIT |
| python3-jmespath | 1.0.1-14.fc44 | MIT |
| python3-langtable | 0.0.71-1.fc44 | GPL-3.0-or-later |
| python3-libs | 3.14.7-1.fc44 | Python-2.0.1 AND MIT AND BSD-3-Clause AND MIT-CMU AND HPND-SMC AND BSD-2-Clause AND dtoa AND Unicode-3.0 |
| python3-libselinux | 3.11-1.fc44 | LicenseRef-Fedora-Public-Domain |
| python3-libsemanage | 3.11-1.fc44 | LGPL-2.1-or-later |
| python3-linux-procfs | 0.7.4-3.fc44 | GPL-2.0-only |
| python3-louis | 3.33.0-7.fc44 | LGPL-2.1-or-later |
| python3-nftables | 1.1.6-2.fc44 | GPL-2.0-only |
| python3-olefile | 0.47-13.fc44 | BSD-2-Clause |
| python3-packaging | 25.0-8.fc44 | BSD-2-Clause OR Apache-2.0 |
| python3-perf | 7.1.10-200.fc44 | ((GPL-2.0-only WITH Linux-syscall-note) OR BSD-2-Clause) AND ((GPL-2.0-only WITH Linux-syscall-note) OR BSD-3-Clause) AND ((GPL-2.0-only WITH Linux-syscall-note) OR CDDL-1.0) AND ((GPL-2.0-only WITH Linux-syscall-note) OR Linux-OpenIB) AND ((GPL-2.0-only WITH Linux-syscall-note) OR MIT) AND ((GPL-2.0-or-later WITH Linux-syscall-note) OR BSD-3-Clause) AND ((GPL-2.0-or-later WITH Linux-syscall-note) OR MIT) AND 0BSD AND BSD-2-Clause AND (BSD-2-Clause OR Apache-2.0) AND BSD-3-Clause AND BSD-3-Clause-Clear AND CC0-1.0 AND GFDL-1.1-no-invariants-or-later AND GPL-1.0-or-later AND (GPL-1.0-or-later OR BSD-3-Clause) AND (GPL-1.0-or-later WITH Linux-syscall-note) AND GPL-2.0-only AND (GPL-2.0-only OR Apache-2.0) AND (GPL-2.0-only OR BSD-2-Clause) AND (GPL-2.0-only OR BSD-3-Clause) AND (GPL-2.0-only OR CDDL-1.0) AND (GPL-2.0-only OR GFDL-1.1-no-invariants-or-later) AND (GPL-2.0-only OR GFDL-1.2-no-invariants-only) AND (GPL-2.0-only OR GFDL-1.2-no-invariants-or-later) AND (GPL-2.0-only WITH Linux-syscall-note) AND GPL-2.0-or-later AND (GPL-2.0-or-later OR BSD-2-Clause) AND (GPL-2.0-or-later OR BSD-3-Clause) AND (GPL-2.0-or-later OR CC-BY-4.0) AND (GPL-2.0-or-later WITH GCC-exception-2.0) AND (GPL-2.0-or-later WITH Linux-syscall-note) AND ISC AND LGPL-2.0-or-later AND (LGPL-2.0-or-later OR BSD-2-Clause) AND (LGPL-2.0-or-later WITH Linux-syscall-note) AND LGPL-2.1-only AND (LGPL-2.1-only OR BSD-2-Clause) AND (LGPL-2.1-only WITH Linux-syscall-note) AND LGPL-2.1-or-later AND (LGPL-2.1-or-later WITH Linux-syscall-note) AND (Linux-OpenIB OR GPL-2.0-only) AND (Linux-OpenIB OR GPL-2.0-only OR BSD-2-Clause) AND Linux-man-pages-copyleft AND MIT AND (MIT OR Apache-2.0) AND (MIT OR GPL-2.0-only) AND (MIT OR GPL-2.0-or-later) AND (MIT OR LGPL-2.1-only) AND (MPL-1.1 OR GPL-2.0-only) AND (X11 OR GPL-2.0-only) AND (X11 OR GPL-2.0-or-later) AND Zlib AND (copyleft-next-0.3.1 OR GPL-2.0-or-later) |
| python3-pexpect | 4.9.0-15.fc44 | ISC AND BSD-3-Clause |
| python3-pillow | 12.3.0-1.fc44 | MIT |
| python3-policycoreutils | 3.11-2.fc44 | GPL-2.0-or-later |
| python3-psutil | 7.2.2-1.fc44 | BSD-3-Clause |
| python3-ptyprocess | 0.7.0-15.fc44 | ISC |
| python3-pyatspi | 2.58.2-1.fc44 | LGPL-2.0-or-later AND GPL-2.0-or-later |
| python3-pyaudio | 0.2.13-11.fc44 | MIT |
| python3-pygdbmi | 0.11.0.0-12.fc44 | MIT |
| python3-pyside6 | 6.11.1-4.fc44 | LGPL-3.0-only OR GPL-3.0-only WITH Qt-GPL-exception-1.0 |
| python3-pysocks | 1.7.1-32.fc44 | BSD-3-Clause |
| python3-pyudev | 0.24.4-3.fc44 | LGPL-2.1-or-later |
| python3-pyxdg | 0.28-1.fc44 | LGPL-2.0-only |
| python3-pyyaml | 6.0.3-3.fc44 | MIT |
| python3-rapidfuzz | 3.14.3-2.fc44 | MIT |
| python3-regex | 2026.7.19-1.fc44 | LicenseRef-Callaway-Python AND CNRI-Python |
| python3-requests | 2.33.1-1.fc44 | Apache-2.0 |
| python3-rpm | 6.0.2-1.fc44 | GPL-2.0-or-later |
| python3-sentry-sdk | 2.48.0-2.fc44 | MIT |
| python3-setools | 4.6.0-6.fc44 | LGPL-2.1-only |
| python3-shiboken6 | 6.11.1-4.fc44 | LGPL-3.0-only OR GPL-3.0-only WITH Qt-GPL-exception-1.0 |
| python3-six | 1.17.0-8.fc44 | MIT |
| python3-speechd | 0.12.1-6.fc44 | GPL-2.0-or-later |
| python3-urllib3 | 2.7.0-1.fc44 | MIT |
| python3-urllib3+socks | 2.7.0-1.fc44 | MIT |
| python-pip-wheel | 26.0.1-2.fc44 | MIT AND Python-2.0.1 AND Apache-2.0 AND BSD-2-Clause AND BSD-3-Clause AND ISC AND MPL-2.0 AND (Apache-2.0 OR BSD-2-Clause) |
| python-unversioned-command | 3.14.7-1.fc44 | Python-2.0.1 |
| qaccessibilityclient-qt6 | 0.6.0-5.fc44 | CC0-1.0 AND LGPL-2.1-only AND LGPL-3.0-only AND (LGPL-2.1-only OR LGPL-3.0-only) |
| qca-qt6 | 2.3.10-4.fc44 | LGPL-2.1-only |
| qca-qt6-ossl | 2.3.10-4.fc44 | LGPL-2.1-only |
| qcom-wwan-firmware | 20260810-1.fc44 | LicenseRef-Callaway-Redistributable-no-modification-permitted |
| qcoro-qt6 | 0.12.0-6.fc44 | MIT |
| qemu-guest-agent | 10.2.2-1.fc44 | Apache-2.0 AND BSD-2-Clause AND BSD-3-Clause AND FSFAP AND GPL-1.0-or-later AND GPL-2.0-only AND GPL-2.0-or-later AND GPL-2.0-or-later WITH GCC-exception-2.0 AND LGPL-2.0-only AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-2.1-or-later AND MIT AND LicenseRef-Fedora-Public-Domain AND CC-BY-3.0 |
| qemu-user-static-aarch64 | 10.2.2-1.fc44 | Apache-2.0 AND BSD-2-Clause AND BSD-3-Clause AND FSFAP AND GPL-1.0-or-later AND GPL-2.0-only AND GPL-2.0-or-later AND GPL-2.0-or-later WITH GCC-exception-2.0 AND LGPL-2.0-only AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-2.1-or-later AND MIT AND LicenseRef-Fedora-Public-Domain AND CC-BY-3.0 |
| qpdf-libs | 12.3.2-1.fc44 | Apache-2.0 OR Artistic-2.0 |
| qqc2-breeze-style | 6.7.4-1.fc44 | CC0-1.0 and GPL-2.0-or-later AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-3.0-only AND (GPL-2.0-only OR GPL-3.0-only) AND (LGPL-2.1-only OR LGPL-3.0-only) |
| qrencode-libs | 4.1.1-12.fc44 | LicenseRef-Callaway-LGPLv2+ |
| qt5-filesystem | 5.15.18-2.fc44 | GPL-3.0-only |
| qt5-qtbase | 5.15.18-2.fc44 | LGPL-3.0-only OR GPL-3.0-only WITH Qt-GPL-exception-1.0 |
| qt5-qtbase-common | 5.15.18-2.fc44 | LGPL-3.0-only OR GPL-3.0-only WITH Qt-GPL-exception-1.0 |
| qt5-qtbase-gui | 5.15.18-2.fc44 | LGPL-3.0-only OR GPL-3.0-only WITH Qt-GPL-exception-1.0 |
| qt5-qtdeclarative | 5.15.18-2.fc44 | LGPL-3.0-only OR GPL-3.0-only WITH Qt-GPL-exception-1.0 |
| qt5-qtgraphicaleffects | 5.15.18-2.fc44 | LGPL-3.0-only OR GPL-3.0-only WITH Qt-GPL-exception-1.0 |
| qt5-qtquickcontrols | 5.15.18-2.fc44 | LGPL-3.0-only OR GPL-3.0-only WITH Qt-GPL-exception-1.0 |
| qt5-qtquickcontrols2 | 5.15.18-2.fc44 | LGPL-3.0-only OR GPL-3.0-only WITH Qt-GPL-exception-1.0 |
| qt5-qtspeech | 5.15.18-2.fc44 | LGPL-3.0-only OR GPL-3.0-only WITH Qt-GPL-exception-1.0 |
| qt5-qtsvg | 5.15.18-2.fc44 | LGPL-3.0-only OR GPL-3.0-only WITH Qt-GPL-exception-1.0 |
| qt5-qtwayland | 5.15.18-2.fc44 | LGPL-3.0-only OR GPL-3.0-only WITH Qt-GPL-exception-1.0 |
| qt5-qtx11extras | 5.15.18-2.fc44 | LGPL-3.0-only OR GPL-3.0-only WITH Qt-GPL-exception-1.0 |
| qt6-filesystem | 6.11.1-1.fc44 | GPL-3.0-only |
| qt6-qt3d | 6.11.1-1.fc44 | LGPL-3.0-only OR GPL-3.0-only WITH Qt-GPL-exception-1.0 |
| qt6-qt5compat | 6.11.1-1.fc44 | LGPL-3.0-only OR GPL-3.0-only WITH Qt-GPL-exception-1.0 |
| qt6-qtbase | 6.11.1-1.fc44 | LGPL-3.0-only OR GPL-3.0-only WITH Qt-GPL-exception-1.0 |
| qt6-qtbase-common | 6.11.1-1.fc44 | LGPL-3.0-only OR GPL-3.0-only WITH Qt-GPL-exception-1.0 |
| qt6-qtbase-gui | 6.11.1-1.fc44 | LGPL-3.0-only OR GPL-3.0-only WITH Qt-GPL-exception-1.0 |
| qt6-qtbase-mysql | 6.11.1-1.fc44 | LGPL-3.0-only OR GPL-3.0-only WITH Qt-GPL-exception-1.0 |
| qt6-qtcharts | 6.11.1-1.fc44 | GPL-3.0-only WITH Qt-GPL-exception-1.0 |
| qt6-qtconnectivity | 6.11.1-1.fc44 | LGPL-3.0-only OR GPL-3.0-only WITH Qt-GPL-exception-1.0 |
| qt6-qtdatavis3d | 6.11.1-1.fc44 | GPL-3.0-only WITH Qt-GPL-exception-1.0 |
| qt6-qtdeclarative | 6.11.1-3.fc44 | LGPL-3.0-only OR GPL-3.0-only WITH Qt-GPL-exception-1.0 |
| qt6-qtgraphs | 6.11.1-1.fc44 | BSD-3-Clause AND GFDL-1.3-no-invariants-only AND GPL-3.0-only |
| qt6-qthttpserver | 6.11.1-1.fc44 | BSD-3-Clause AND GFDL-1.3-no-invariants-only AND GPL-3.0-only WITH Qt-GPL-exception-1.0 |
| qt6-qtimageformats | 6.11.1-1.fc44 | LGPL-3.0-only OR GPL-3.0-only WITH Qt-GPL-exception-1.0 |
| qt6-qtlocation | 6.11.1-1.fc44 | LGPL-3.0-only OR GPL-3.0-only WITH Qt-GPL-exception-1.0 |
| qt6-qtmultimedia | 6.11.1-1.fc44 | LGPL-3.0-only OR GPL-3.0-only WITH Qt-GPL-exception-1.0 |
| qt6-qtnetworkauth | 6.11.1-1.fc44 | GPL-3.0-only WITH Qt-GPL-exception-1.0 |
| qt6-qtpdf | 6.11.1-1.fc44 | (LGPLv2 with exceptions or GPLv3 with exceptions) and BSD and LGPLv2+ and ASL 2.0 and IJG and MIT and GPLv2+ and ISC and OpenSSL and (MPLv1.1 or GPLv2 or LGPLv2) |
| qt6-qtpositioning | 6.11.1-1.fc44 | LGPL-3.0-only OR GPL-3.0-only WITH Qt-GPL-exception-1.0 |
| qt6-qtquick3d | 6.11.1-1.fc44 | LGPL-3.0-only OR GPL-3.0-only WITH Qt-GPL-exception-1.0 |
| qt6-qtquicktimeline | 6.11.1-1.fc44 | GPL-3.0-only WITH Qt-GPL-exception-1.0 |
| qt6-qtremoteobjects | 6.11.1-1.fc44 | LGPL-3.0-only OR GPL-3.0-only WITH Qt-GPL-exception-1.0 |
| qt6-qtscxml | 6.11.1-1.fc44 | LGPL-3.0-only OR GPL-3.0-only WITH Qt-GPL-exception-1.0 |
| qt6-qtsensors | 6.11.1-1.fc44 | LGPL-3.0-only OR GPL-3.0-only WITH Qt-GPL-exception-1.0 |
| qt6-qtserialbus | 6.11.1-1.fc44 | LGPL-3.0-only OR GPL-3.0-only WITH Qt-GPL-exception-1.0 |
| qt6-qtserialport | 6.11.1-1.fc44 | LGPL-3.0-only OR GPL-3.0-only WITH Qt-GPL-exception-1.0 |
| qt6-qtshadertools | 6.11.1-1.fc44 | LGPL-3.0-only OR GPL-3.0-only WITH Qt-GPL-exception-1.0 |
| qt6-qtspeech | 6.11.1-1.fc44 | (GPL-2.0-only OR LGPL-3.0-only OR GPL-3.0-only WITH Qt-GPL-exception-1.0) AND BSD-3-Clause |
| qt6-qtspeech-flite | 6.11.1-1.fc44 | (GPL-2.0-only OR LGPL-3.0-only OR GPL-3.0-only WITH Qt-GPL-exception-1.0) AND BSD-3-Clause |
| qt6-qtspeech-speechd | 6.11.1-1.fc44 | (GPL-2.0-only OR LGPL-3.0-only OR GPL-3.0-only WITH Qt-GPL-exception-1.0) AND BSD-3-Clause |
| qt6-qtsvg | 6.11.1-1.fc44 | LGPL-3.0-only OR GPL-3.0-only WITH Qt-GPL-exception-1.0 |
| qt6-qttools | 6.11.1-1.fc44 | LGPL-3.0-only OR GPL-3.0-only WITH Qt-GPL-exception-1.0 |
| qt6-qttools-common | 6.11.1-1.fc44 | LGPL-3.0-only OR GPL-3.0-only WITH Qt-GPL-exception-1.0 |
| qt6-qttools-libs-designer | 6.11.1-1.fc44 | LGPL-3.0-only OR GPL-3.0-only WITH Qt-GPL-exception-1.0 |
| qt6-qttools-libs-help | 6.11.1-1.fc44 | LGPL-3.0-only OR GPL-3.0-only WITH Qt-GPL-exception-1.0 |
| qt6-qttranslations | 6.11.1-1.fc44 | GPL-3.0-only WITH Qt-GPL-exception-1.0 |
| qt6-qtvirtualkeyboard | 6.11.1-1.fc44 | GPL-3.0-only WITH Qt-GPL-exception-1.0 |
| qt6-qtwayland | 6.11.1-1.fc44 | LGPL-3.0-only OR GPL-3.0-only WITH Qt-GPL-exception-1.0 |
| qt6-qtwebchannel | 6.11.1-1.fc44 | LGPL-3.0-only OR GPL-3.0-only WITH Qt-GPL-exception-1.0 |
| qt6-qtwebengine | 6.11.1-1.fc44 | (LGPLv2 with exceptions or GPLv3 with exceptions) and BSD and LGPLv2+ and ASL 2.0 and IJG and MIT and GPLv2+ and ISC and OpenSSL and (MPLv1.1 or GPLv2 or LGPLv2) |
| qt6-qtwebsockets | 6.11.1-1.fc44 | LGPL-3.0-only OR GPL-3.0-only WITH Qt-GPL-exception-1.0 |
| qt6-qtwebview | 6.11.1-1.fc44 | LGPL-3.0-only OR GPL-3.0-only WITH Qt-GPL-exception-1.0 |
| qtkeychain-qt6 | 0.16.0-1.fc44 | BSD-3-Clause |
| qt-settings | 44.0-1.fc44 | MIT |
| quota | 4.11-2.fc44 | GPL-2.0-only AND GPL-2.0-or-later |
| quota-nls | 4.11-2.fc44 | LGPL-2.1-or-later AND GPL-2.0-only AND GPL-2.0-or-later |
| raptor2 | 2.0.15-50.fc44 | GPL-2.0-or-later OR LicenseRef-Callaway-LGPLv2+ OR Apache-2.0 |
| rasqal | 0.9.33-32.fc44 | LGPL-2.1-or-later OR Apache-2.0 |
| rav1e-libs | 0.8.1-3.fc44 | BSD-2-Clause AND ISC AND MIT AND LicenseRef-BSD-2-Clause-WITH-AdditionRef-AOMPL-1.0 AND (Apache-2.0 OR MIT) AND (Apache-2.0 WITH LLVM-exception OR Apache-2.0 OR MIT) AND (Unlicense OR MIT) |
| rdma-core-common | 61.0-2.fc44 | GPL-2.0-only OR BSD-2-Clause AND BSD-3-Clause |
| re2 | 20251105-4.fc44 | BSD-3-Clause |
| readline | 8.3-4.fc44 | GPL-3.0-or-later AND GPL-2.0-or-later AND GFDL-1.3-no-invariants-or-later |
| realmd | 0.17.1-19.fc44 | LGPL-2.1-or-later |
| realtek-firmware | 20260810-1.fc44 | LicenseRef-Callaway-Redistributable-no-modification-permitted |
| redhat-menus | 12.0.2-39.fc44 | GPL-1.0-or-later |
| redland | 1.0.17-41.fc44 | LGPL-2.1-or-later OR Apache-2.0 |
| rit-meera-new-fonts | 1.6.2-5.fc44 | OFL-1.1 |
| rit-rachana-fonts | 1.5.2-5.fc44 | OFL-1.1 |
| rootfiles | 9.0-6.fc44 | LicenseRef-Not-Copyrightable |
| rpcbind | 1.2.9-2.fc44 | BSD-3-Clause |
| rpm | 6.0.2-1.fc44 | GPL-2.0-or-later |
| rpm-build-libs | 6.0.2-1.fc44 | GPL-2.0-or-later |
| rpm-libs | 6.0.2-1.fc44 | GPL-2.0-or-later OR LGPL-2.1-or-later |
| rpm-ostree | 2026.2-1.fc44 | LGPL-2.0-or-later |
| rpm-ostree-libs | 2026.2-1.fc44 | LGPL-2.0-or-later |
| rpm-plugin-audit | 6.0.2-1.fc44 | GPL-2.0-or-later |
| rpm-plugin-selinux | 6.0.2-1.fc44 | GPL-2.0-or-later |
| rpm-sequoia | 1.10.2-4.fc44 | LGPL-2.0-or-later AND Apache-2.0 AND BSD-3-Clause AND BSL-1.0 AND MIT AND Unicode-3.0 AND Unicode-DFS-2016 AND (Apache-2.0 OR MIT) AND (Unlicense OR MIT) |
| rpm-sign-libs | 6.0.2-1.fc44 | GPL-2.0-or-later |
| rsync | 3.5.0-1.fc44 | GPL-3.0-or-later |
| rtkit | 0.11-70.fc44 | GPL-3.0-or-later AND MIT |
| rubberband-libs | 4.0.0-5.fc44 | GPL-2.0-or-later |
| samba | 4.24.6-1.fc44 | GPL-3.0-or-later AND LGPL-3.0-or-later |
| samba-client | 4.24.6-1.fc44 | GPL-3.0-or-later AND LGPL-3.0-or-later |
| samba-client-libs | 4.24.6-1.fc44 | GPL-3.0-or-later AND LGPL-3.0-or-later |
| samba-common | 4.24.6-1.fc44 | GPL-3.0-or-later AND LGPL-3.0-or-later |
| samba-common-tools | 4.24.6-1.fc44 | GPL-3.0-or-later AND LGPL-3.0-or-later |
| samba-core-libs | 4.24.6-1.fc44 | GPL-3.0-or-later AND LGPL-3.0-or-later |
| samba-dcerpc | 4.24.6-1.fc44 | GPL-3.0-or-later AND LGPL-3.0-or-later |
| samba-ldb-ldap-modules | 4.24.6-1.fc44 | GPL-3.0-or-later AND LGPL-3.0-or-later |
| samba-libs | 4.24.6-1.fc44 | GPL-3.0-or-later AND LGPL-3.0-or-later |
| samba-ndr-libs | 4.24.6-1.fc44 | GPL-3.0-or-later AND LGPL-3.0-or-later |
| samba-usershares | 4.24.6-1.fc44 | GPL-3.0-or-later AND LGPL-3.0-or-later |
| sane-airscan | 0.99.36-2.fc44 | GPL-2.0-or-later WITH SANE-exception AND MIT |
| sane-backends | 1.4.0-6.fc44 | GPL-2.0-or-later WITH SANE-exception AND GPL-2.0-or-later AND GPL-2.0-only AND LGPL-2.0-or-later AND LGPL-2.1-or-later AND LicenseRef-Fedora-Public-Domain AND IJG AND MIT |
| sane-backends-drivers-cameras | 1.4.0-6.fc44 | GPL-2.0-or-later WITH SANE-exception AND GPL-2.0-or-later AND GPL-2.0-only AND LGPL-2.0-or-later AND LGPL-2.1-or-later AND LicenseRef-Fedora-Public-Domain AND IJG AND MIT |
| sane-backends-drivers-scanners | 1.4.0-6.fc44 | GPL-2.0-or-later WITH SANE-exception AND GPL-2.0-or-later AND GPL-2.0-only AND LGPL-2.0-or-later AND LGPL-2.1-or-later AND LicenseRef-Fedora-Public-Domain AND IJG AND MIT |
| sane-backends-libs | 1.4.0-6.fc44 | GPL-2.0-or-later WITH SANE-exception AND GPL-2.0-or-later AND GPL-2.0-only AND LGPL-2.0-or-later AND LGPL-2.1-or-later AND LicenseRef-Fedora-Public-Domain AND IJG AND MIT |
| sdbus-cpp | 2.2.1-2.fc44 | LGPL-2.1-only |
| sddm | 0.21.0-13.fc44 | GPL-2.0-or-later |
| sddm-wayland-plasma | 6.7.4-2.fc44 | BSD-2-Clause AND BSD-3-Clause AND CC0-1.0 AND GPL-2.0-only AND GPL-2.0-or-later AND GPL-3.0-only AND LGPL-2.0-only AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-2.1-or-later AND LGPL-3.0-only AND LGPL-3.0-or-later AND (GPL-2.0-only OR GPL-3.0-only) AND (LGPL-2.1-only OR LGPL-3.0-only) AND MIT |
| sdl2-compat | 2.32.70-1.fc44 | Zlib |
| SDL3 | 3.4.14-1.fc44 | Zlib AND MIT AND Apache-2.0 AND (Apache-2.0 OR MIT) |
| SDL3_image | 3.4.4-1.fc44 | Zlib AND (HPND-Pbmplus AND Zlib) AND MIT AND (MIT OR Unlicense) AND LicenseRef-Fedora-Public-Domain |
| SDL3_ttf | 3.2.2-4.fc44 | Zlib AND MIT |
| sed | 4.9-7.fc44 | GPL-3.0-or-later |
| selinux-policy | 44.7-1.fc44 | GPL-2.0-or-later |
| selinux-policy-targeted | 44.7-1.fc44 | GPL-2.0-or-later |
| serd | 0.32.8-1.fc44 | ISC |
| setup | 2.15.0-28.fc44 | LicenseRef-Fedora-Public-Domain |
| setxkbmap | 1.3.4-7.fc44 | HPND |
| sgml-common | 0.6.3-68.fc44 | GPL-1.0-or-later |
| shadow-utils | 4.19.0-7.fc44 | BSD-3-Clause AND GPL-2.0-or-later |
| shadow-utils-subid | 4.19.0-7.fc44 | BSD-3-Clause AND GPL-2.0-or-later |
| shared-mime-info | 2.4-3.fc44 | GPL-2.0-or-later |
| shim-ia32 | 16.1-5 | BSD-3-Clause |
| shim-x64 | 16.1-5 | BSD-3-Clause |
| signon | 8.60^20240205.c8ad982-5.fc44 | LGPL-2.1-only |
| signon-kwallet-extension | 26.08.0-1.fc44 | GPL-2.0-or-later |
| signon-plugin-oauth2 | 0.25^20231216.fab6988-7.fc44 | LGPL-2.1-or-later |
| signon-qt6 | 8.60^20240205.c8ad982-5.fc44 | LGPL-2.1-only |
| signon-ui | 0.15^20240205.eef943f-6.fc44 | GPL-3.0-only |
| sil-padauk-fonts | 3.003-21.fc44 | OFL-1.1 |
| skopeo | 1.22.2-2.fc44 | Apache-2.0 AND BSD-2-Clause AND BSD-3-Clause AND ISC AND MIT AND MPL-2.0 |
| slang | 2.3.3-9.fc44 | GPL-2.0-or-later |
| slirp4netns | 1.3.1-4.fc44 | GPL-2.0-only |
| smartmontools | 7.5-9.fc44 | GPL-2.0-or-later |
| smartmontools-selinux | 7.5-9.fc44 | GPL-2.0-or-later |
| snappy | 1.2.2-4.fc44 | BSD-3-Clause |
| socat | 1.8.1.1-1.fc44 | GPL-2.0-only |
| sord | 0.16.22-1.fc44 | ISC |
| sos | 4.12.0-1.fc44 | GPL-2.0-only |
| sound-theme-freedesktop | 0.8-31.fc44 | GPL-2.0-only AND GPL-2.0-or-later AND LGPL-2.0-or-later AND CC-BY-SA-3.0 AND CC-BY-3.0 AND CC-BY-4.0 |
| soundtouch | 2.4.0-3.fc44 | LGPL-2.1-or-later |
| source-foundry-hack-fonts | 3.003-7.fc44 | MIT AND Bitstream-Vera |
| source-highlight | 3.1.9-27.fc44 | GPL-3.0-or-later AND GFDL-1.1-or-later AND LicenseRef-Fedora-Public-Domain AND GPL-2.0-only AND GPL-3.0-only AND GPL-3.0-or-later WITH Bison-exception-2.2 |
| soxr | 0.1.3-21.fc44 | LGPL-2.1-or-later |
| spandsp | 0.0.6-22.fc44 | LGPL-2.1-only AND GPL-2.0-only |
| spectacle | 6.7.4-1.fc44 | GPL-2.0-only |
| speech-dispatcher | 0.12.1-6.fc44 | GPL-2.0-or-later AND LGPL-2.1-only OR LGPL-2.0-only |
| speech-dispatcher-espeak-ng | 0.12.1-6.fc44 | GPL-2.0-or-later AND LGPL-2.1-only OR LGPL-2.0-only |
| speech-dispatcher-libs | 0.12.1-6.fc44 | GPL-2.0-or-later |
| speech-dispatcher-utils | 0.12.1-6.fc44 | GPL-2.0-or-later |
| speex | 1.2.0-21.fc44 | BSD-3-clause AND TU-Berlin-1.0 |
| spice-vdagent | 0.23.0-2.fc44 | GPL-3.0-or-later |
| spice-webdavd | 3.0-13.fc44 | LicenseRef-Callaway-LGPLv2+ |
| spirv-tools-libs | 2026.1-1.fc44 | Apache-2.0 |
| splix | 2.0.1-6.fc44 | GPL-2.0-only |
| sqlite-libs | 3.51.2-2.fc44 | blessing |
| sratom | 0.6.22-1.fc44 | MIT |
| srt-libs | 1.5.6-1.fc44 | MPL-2.0 |
| sso-mib-libs | 0.8.0-1.fc44 | LGPL-2.1-only |
| sssd-client | 2.13.1-2.fc44 | LGPL-3.0-or-later |
| sssd-common | 2.13.1-2.fc44 | GPL-3.0-or-later |
| sssd-kcm | 2.13.1-2.fc44 | GPL-3.0-or-later |
| sssd-krb5-common | 2.13.1-2.fc44 | GPL-3.0-or-later |
| sssd-nfs-idmap | 2.13.1-2.fc44 | GPL-3.0-or-later |
| startup-notification | 0.12-33.fc44 | LGPL-2.0-or-later AND MIT |
| stix-fonts | 2.13b171-10.fc44 | OFL-1.1 |
| stoken-libs | 0.93-2.fc44 | LGPL-2.1-or-later |
| sudo | 1.9.17-8.p2.fc44 | ISC |
| sudo-python-plugin | 1.9.17-8.p2.fc44 | ISC |
| svt-av1-libs | 3.1.2-2.fc44 | LicenseRef-BSD-3-Clause-Clear-WITH-AdditionRef-AOMPL-1.0 AND MIT AND ISC AND LicenseRef-Fedora-Public-Domain AND BSD-2-Clause |
| switcheroo-control | 3.0-5.fc44 | GPL-3.0-only |
| system-config-printer | 1.5.18-20.fc44 | GPL-2.0-or-later |
| system-config-printer-libs | 1.5.18-20.fc44 | GPL-2.0-or-later |
| system-config-printer-udev | 1.5.18-20.fc44 | GPL-2.0-or-later |
| systemd | 259.8-1.fc44 | LGPL-2.1-or-later AND MIT AND GPL-2.0-or-later |
| systemd-container | 259.8-1.fc44 | LGPL-2.1-or-later |
| systemd-libs | 259.8-1.fc44 | LGPL-2.1-or-later AND MIT |
| systemd-networkd | 259.8-1.fc44 | LGPL-2.1-or-later |
| systemd-oomd-defaults | 259.8-1.fc44 | LGPL-2.1-or-later |
| systemd-pam | 259.8-1.fc44 | LGPL-2.1-or-later AND MIT AND GPL-2.0-or-later |
| systemd-resolved | 259.8-1.fc44 | LGPL-2.1-or-later AND MIT AND GPL-2.0-or-later |
| systemd-shared | 259.8-1.fc44 | LGPL-2.1-or-later AND MIT |
| systemd-sysusers | 259.8-1.fc44 | LGPL-2.1-or-later AND MIT AND GPL-2.0-or-later |
| systemd-udev | 259.8-1.fc44 | LGPL-2.1-or-later |
| taglib | 2.3-2.fc44 | (LGPL-2.1-only OR MPL-1.1) AND BSD-2-Clause AND LGPL-2.1-only |
| tar | 1.35-8.fc44 | GPL-3.0-or-later |
| tbb | 2022.3.0-3.fc44 | Apache-2.0 AND BSD-3-Clause |
| tcl | 9.0.2-1.fc44 | TCL AND GPL-3.0-or-later WITH Bison-exception-2.2 AND BSD-3-Clause |
| tesseract-common | 5.5.3-1.fc44 | Apache-2.0 |
| tesseract-langpack-eng | 4.1.0-12.fc44 | Apache-2.0 |
| tesseract-libs | 5.5.3-1.fc44 | Apache-2.0 |
| tesseract-tessdata-doc | 4.1.0-12.fc44 | Apache-2.0 |
| thermald | 2.5.12-3.fc44 | GPL-2.0-or-later |
| time | 1.9-28.fc44 | GPL-3.0-or-later AND GFDL-1.3-no-invariants-or-later |
| tiwilink-firmware | 20260810-1.fc44 | LicenseRef-Callaway-Redistributable-no-modification-permitted |
| toolbox | 0.3-4.fc44 | Apache-2.0 |
| tpm2-tools | 5.7-5.fc44 | BSD-3-Clause |
| tpm2-tss | 4.1.3-9.fc44 | BSD-2-Clause |
| tpm2-tss-fapi | 4.1.3-9.fc44 | BSD-2-Clause |
| tree | 2.2.1-4.fc44 | GPL-2.0-or-later AND LGPL-2.1-or-later |
| tslib | 1.24-2.fc44 | LGPL-2.1-only |
| tuned | 2.27.0-1.fc44 | GPL-2.0-or-later AND CC-BY-SA-3.0 |
| tuned-ppd | 2.27.0-1.fc44 | GPL-2.0-or-later AND CC-BY-SA-3.0 |
| twolame-libs | 0.4.0-9.fc44 | LGPL-2.1-or-later |
| tzdata | 2026c-1.fc44 | LicenseRef-Fedora-Public-Domain AND (GPL-2.0-only WITH ClassPath-exception-2.0) |
| tzdata-java | 2026c-1.fc44 | LicenseRef-Fedora-Public-Domain AND (GPL-2.0-only WITH ClassPath-exception-2.0) |
| udev-hid-bpf | 2.2.0.20251121-4.fc44 | GPL-2.0-only AND BSD-2-Clause AND MIT AND Unicode-DFS-2016 AND (LGPL-2.1-only OR BSD-2-Clause) AND (MIT OR Apache-2.0) AND (Unlicense OR MIT) |
| udev-hid-bpf-stable | 2.2.0.20251121-4.fc44 | GPL-2.0-only AND BSD-2-Clause AND MIT AND Unicode-DFS-2016 AND (LGPL-2.1-only OR BSD-2-Clause) AND (MIT OR Apache-2.0) AND (Unlicense OR MIT) |
| udftools | 2.3-13.fc44 | GPL-2.0-or-later |
| udisks2 | 2.11.2-1.fc44 | GPL-2.0-or-later |
| unar | 1.10.8-15.fc44 | LicenseRef-Callaway-LGPLv2+ |
| unbound-anchor | 1.26.0-1.fc44 | BSD-3-Clause |
| unbound-libs | 1.26.0-1.fc44 | BSD-3-Clause |
| unicode-ucd | 17.0.0-2.fc44 | Unicode-3.0 |
| unity-gtk3-module | 0.0.0+17.04.20170403-24.fc44 | LGPL-3.0-only |
| unity-gtk-module-common | 0.0.0+17.04.20170403-24.fc44 | LGPL-3.0-only |
| unzip | 6.0-69.fc44 | Info-ZIP |
| upower | 1.91.3-1.fc44 | GPL-2.0-or-later |
| upower-libs | 1.91.3-1.fc44 | GPL-2.0-or-later |
| uresourced | 0.5.4-5.fc44 | LGPL-2.1-or-later |
| uriparser | 1.0.2-1.fc44 | BSD-3-Clause |
| urw-base35-bookman-fonts | 20200910-27.fc44 | AGPL-3.0-only AND GPL-2.0-or-later |
| urw-base35-c059-fonts | 20200910-27.fc44 | AGPL-3.0-only AND GPL-2.0-or-later |
| urw-base35-d050000l-fonts | 20200910-27.fc44 | AGPL-3.0-only AND GPL-2.0-or-later |
| urw-base35-fonts | 20200910-27.fc44 | AGPL-3.0-only AND GPL-2.0-or-later |
| urw-base35-fonts-common | 20200910-27.fc44 | AGPL-3.0-only AND GPL-2.0-or-later |
| urw-base35-gothic-fonts | 20200910-27.fc44 | AGPL-3.0-only AND GPL-2.0-or-later |
| urw-base35-nimbus-mono-ps-fonts | 20200910-27.fc44 | AGPL-3.0-only AND GPL-2.0-or-later |
| urw-base35-nimbus-roman-fonts | 20200910-27.fc44 | AGPL-3.0-only AND GPL-2.0-or-later |
| urw-base35-nimbus-sans-fonts | 20200910-27.fc44 | AGPL-3.0-only AND GPL-2.0-or-later |
| urw-base35-p052-fonts | 20200910-27.fc44 | AGPL-3.0-only AND GPL-2.0-or-later |
| urw-base35-standard-symbols-ps-fonts | 20200910-27.fc44 | AGPL-3.0-only AND GPL-2.0-or-later |
| urw-base35-z003-fonts | 20200910-27.fc44 | AGPL-3.0-only AND GPL-2.0-or-later |
| usb_modeswitch | 2.6.2-5.fc44 | GPL-2.0-or-later |
| usb_modeswitch-data | 20191128-15.fc44 | GPL-2.0-or-later |
| usbmuxd | 1.1.1^20251205git3ded00c-1.fc44 | GPL-3.0-only OR GPL-2.0-only |
| usbutils | 019-2.fc44 | GPL-2.0-or-later |
| usermode | 1.114-16.fc44 | GPL-2.0-or-later |
| userspace-rcu | 0.15.6-1.fc44 | LGPL-2.1-or-later |
| util-linux | 2.41.5-1.fc44 | GPL-1.0-or-later AND GPL-2.0-only AND GPL-2.0-or-later AND GPL-3.0-or-later AND LGPL-2.1-or-later AND BSD-2-Clause AND BSD-3-Clause AND BSD-4-Clause-UC AND LicenseRef-Fedora-Public-Domain |
| util-linux-core | 2.41.5-1.fc44 | GPL-2.0-only AND GPL-2.0-or-later AND BSD-2-Clause AND BSD-3-Clause AND BSD-4-Clause-UC AND LicenseRef-Fedora-Public-Domain |
| vazirmatn-vf-fonts | 33.003-16.fc44 | OFL-1.1 |
| vid.stab | 1.1.1-8.fc44 | GPL-2.0-or-later |
| vim-data | 9.2.967-1.fc44 | Vim AND LGPL-2.1-or-later AND MIT AND GPL-1.0-only AND (GPL-2.0-only OR Vim) AND Apache-2.0 AND BSD-2-Clause AND BSD-3-Clause AND GPL-2.0-or-later AND GPL-3.0-or-later AND OPUBL-1.0 AND Apache-2.0 WITH Swift-exception |
| vim-minimal | 9.2.967-1.fc44 | Vim AND LGPL-2.1-or-later AND MIT AND GPL-1.0-only AND (GPL-2.0-only OR Vim) AND Apache-2.0 AND BSD-2-Clause AND BSD-3-Clause AND GPL-2.0-or-later AND GPL-3.0-or-later AND OPUBL-1.0 AND Apache-2.0 WITH Swift-exception |
| virtualbox-guest-additions | 7.2.14-1.fc44 | GPL-3.0-only AND (GPL-3.0-only OR CDDL-1.0) |
| virt-what | 1.27-5.fc44 | GPL-2.0-or-later |
| vlc | 3.0.23-10.fc44 | GPL-2.0-or-later AND LGPL-2.1-or-later AND BSD-2-Clause AND BSD-3-Clause |
| vlc-cli | 3.0.23-10.fc44 | GPL-2.0-or-later AND LGPL-2.1-or-later AND BSD-2-Clause AND BSD-3-Clause |
| vlc-gui-qt | 3.0.23-10.fc44 | GPL-2.0-or-later AND LGPL-2.1-or-later AND BSD-2-Clause AND BSD-3-Clause |
| vlc-libs | 3.0.23-10.fc44 | GPL-2.0-or-later AND LGPL-2.1-or-later AND BSD-2-Clause AND BSD-3-Clause |
| vlc-plugin-ffmpeg | 3.0.23-10.fc44 | GPL-2.0-or-later AND LGPL-2.1-or-later AND BSD-2-Clause AND BSD-3-Clause |
| vlc-plugin-gstreamer | 3.0.23-10.fc44 | GPL-2.0-or-later AND LGPL-2.1-or-later AND BSD-2-Clause AND BSD-3-Clause |
| vlc-plugin-lua | 3.0.23-10.fc44 | GPL-2.0-or-later AND LGPL-2.1-or-later AND BSD-2-Clause AND BSD-3-Clause |
| vlc-plugin-pipewire | 3-7.fc44 | GPL-3.0-or-later |
| vlc-plugin-pulseaudio | 3.0.23-10.fc44 | GPL-2.0-or-later AND LGPL-2.1-or-later AND BSD-2-Clause AND BSD-3-Clause |
| vlc-plugins-base | 3.0.23-10.fc44 | GPL-2.0-or-later AND LGPL-2.1-or-later AND BSD-2-Clause AND BSD-3-Clause |
| vlc-plugins-video-out | 3.0.23-10.fc44 | GPL-2.0-or-later AND LGPL-2.1-or-later AND BSD-2-Clause AND BSD-3-Clause |
| vo-amrwbenc | 0.1.3-24.fc44 | Apache-2.0 |
| volume_key-libs | 0.3.12-29.fc44 | GPL-2.0-only AND (MPL-1.1 OR GPL-2.0-or-later OR LGPL-2.1-or-later) |
| vpnc | 0.5.3^20241114.git11e15a1-4.fc44 | GPL-2.0-or-later and BSD-2-Clause |
| vpnc-script | 20230907-7.git5b9e7e4c.fc44 | GPL-2.0-or-later |
| vulkan-loader | 1.4.341.0-1.fc44 | Apache-2.0 |
| vulkan-tools | 1.4.341.0-1.fc44 | Apache-2.0 |
| wavpack | 5.9.0-2.fc44 | BSD-3-Clause AND BSD-2-Clause AND LicenseRef-Fedora-Public-Domain |
| wayland-utils | 1.3.0-3.fc44 | MIT |
| webrtc-audio-processing | 2.1-5.fc44 | BSD-3-Clause |
| wget2 | 2.2.1-2.fc44 | GPL-3.0-or-later AND LGPL-3.0-or-later AND GFDL-1.3-or-later |
| wget2-libs | 2.2.1-2.fc44 | GPL-3.0-or-later AND LGPL-3.0-or-later AND GFDL-1.3-or-later |
| wget2-wget | 2.2.1-2.fc44 | GPL-3.0-or-later AND LGPL-3.0-or-later AND GFDL-1.3-or-later |
| which | 2.25-1.fc44 | GPL-3.0-only |
| whois | 5.6.6-1.fc44 | GPL-2.0-or-later |
| whois-nls | 5.6.6-1.fc44 | GPL-2.0-or-later |
| wireguard-tools | 1.0.20260223-1.fc44 | GPL-2.0-only |
| wireless-regdb | 2026.05.30-1.fc44 | ISC |
| wireplumber | 0.5.14-1.fc44 | MIT |
| wireplumber-libs | 0.5.14-1.fc44 | MIT |
| wl-clipboard | 2.2.1^git20251124.e808203-2.fc44 | GPL-3.0-or-later |
| words | 3.0-63.fc44 | LicenseRef-Fedora-Public-Domain |
| wpa_supplicant | 2.11-9.fc44 | BSD-3-Clause |
| wsdd | 0.8-6.fc44 | MIT |
| xapian-core-libs | 1.4.30-2.fc44 | GPL-2.0-or-later |
| xcb-util | 0.4.1-9.fc44 | X11-distribute-modifications-variant |
| xcb-util-cursor | 0.1.6-2.fc44 | X11-distribute-modifications-variant |
| xcb-util-image | 0.4.1-9.fc44 | X11-distribute-modifications-variant |
| xcb-util-keysyms | 0.4.1-9.fc44 | X11-distribute-modifications-variant |
| xcb-util-renderutil | 0.3.10-9.fc44 | X11-distribute-modifications-variant AND HPND-sell-variant |
| xcb-util-wm | 0.4.2-9.fc44 | X11-distribute-modifications-variant |
| xdg-dbus-proxy | 0.1.8-1.fc44 | LGPL-2.1-or-later |
| xdg-desktop-portal | 1.22.1-1.fc44 | LGPL-2.1-or-later |
| xdg-desktop-portal-gtk | 1.15.3-3.fc44 | LGPL-2.0-or-later |
| xdg-desktop-portal-kde | 6.7.4-1.fc44 | BSD-2-Clause AND CC0-1.0 AND GPL-2.0-or-later AND LGPL-2.0-or-later AND LGPL-2.1-only AND LGPL-3.0-only AND (LGPL-2.1-only OR LGPL-3.0-only) |
| xdg-user-dirs | 0.18-11.fc43 | GPL-2.0-or-later AND MIT |
| xdg-utils | 1.2.1-5.fc44 | MIT |
| xdpyinfo | 1.3.4-4.fc44 | MIT |
| xdriinfo | 1.0.7-6.fc44 | MIT |
| xevd-libs | 0.5.0-6.fc44 | BSD-3-Clause |
| xeve-libs | 0.5.1-6.fc44 | BSD-3-Clause |
| xfsprogs | 7.1.1-1.fc44 | GPL-1.0-or-later AND LGPL-2.1-or-later |
| xhost | 1.0.9-11.fc44 | MIT AND ICU |
| xkbcomp | 1.5.0-2.fc44 | MIT-open-group AND HPND-DEC |
| xkeyboard-config | 2.47-1.fc44 | HPND AND HPND-sell-variant AND X11 AND X11-distribute-modifications-variant AND MIT AND MIT-open-group AND xkeyboard-config-Zinoviev |
| xmessage | 1.0.7-8.fc44 | X11 |
| xml-common | 0.6.3-68.fc44 | GPL-1.0-or-later |
| xmlsec1 | 1.2.41-4.fc44 | MIT |
| xmlsec1-nss | 1.2.41-4.fc44 | MIT |
| xmlsec1-openssl | 1.2.41-4.fc44 | MIT |
| xmodmap | 1.0.11-10.fc44 | MIT AND MIT-open-group |
| xorg-x11-server-Xwayland | 24.1.13-1.fc44 | MIT |
| xorg-x11-xauth | 1.1.5-1.fc44 | MIT-open-group |
| xorg-x11-xinit | 1.4.3-4.fc44 | X11-distribute-modifications-variant AND MIT-open-group |
| xprop | 1.2.8-5.fc44 | MIT |
| xrandr | 1.5.3-4.fc44 | HPND-sell-variant |
| xrdb | 1.2.2-7.fc44 | HPND-DEC AND MIT-open-group |
| xsettingsd | 1.0.2-13.fc44 | LicenseRef-Callaway-BSD |
| xvidcore | 1.3.7-19.fc44 | GPL-2.0-or-later |
| xwaylandvideobridge | 0.5.2-1.fc44 | (GPL-2.0-only or GPL-3.0-only) and LGPL-2.0-or-later and BSD-3-Clause |
| xxhash-libs | 0.8.3-4.fc44 | BSD-2-Clause |
| xz | 5.8.2-2.fc44 | 0BSD AND GPL-2.0-or-later AND LicenseRef-Fedora-Public-Domain |
| xz-libs | 5.8.2-2.fc44 | 0BSD |
| yajl | 2.1.0-40.fc44 | ISC |
| yyjson | 0.12.0-2.fc44 | MIT |
| zchunk-libs | 1.5.4-1.fc44 | BSD-2-Clause AND MIT |
| zeromq | 4.3.5-22.fc43 | MPL-2.0 AND BSD-3-Clause AND MIT |
| zimg | 3.0.6-3.fc44 | WTFPL |
| zip | 3.0-45.fc44 | Info-ZIP |
| zix | 0.8.0-2.fc44 | ISC |
| zlib-ng-compat | 2.3.3-3.fc44 | Zlib |
| zram-generator | 1.2.1-5.fc44 | MIT AND (MIT OR Apache-2.0) |
| zram-generator-defaults | 1.2.1-5.fc44 | MIT AND (MIT OR Apache-2.0) |
| zstd | 1.5.7-5.fc44 | BSD-3-Clause OR GPL-2.0-only |
| zvbi | 0.2.44-3.fc44 | GPL-2.0-or-later AND LGPL-2.0-or-later AND LGPL-2.1-or-later AND BSD-2-Clause AND MIT |
| zxcvbn-c | 2.6-2.fc44 | MIT |
| zxing-cpp | 2.2.1-6.fc44 | Apache-2.0 AND MIT |
