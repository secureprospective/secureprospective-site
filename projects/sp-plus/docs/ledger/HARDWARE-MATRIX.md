# SP+ Hardware Matrix

One row per machine SP+ has been installed on. Row zero is the Dell, verified live from CT105 on 2026-08-26.

| Field | Value |
|---|---|
| ID | HW-00 |
| Machine | Dell Inspiron 5737 (2014) |
| Role | Bare-metal Phase 0 test machine; the product's PERFORMANCE FLOOR |
| Host/IP | 192.168.1.201, user `trader` |
| BIOS | Dell A08, 2014-04-30 |
| Firmware mode | UEFI, GPT partition table |
| Secure Boot | Present, currently DISABLED in firmware; enabling it is Gate 0.B |
| TPM | NONE — `/dev/tpm*` absent |
| CPU | Intel Core i5-4200U (Haswell-ULT) |
| RAM | 7.6 GB |
| Disk | ST1000LM024 HN-M101MBB, 931 GB, MECHANICAL 5400rpm HDD, single disk |
| GPU | Intel Haswell-ULT integrated [8086:0a16] |
| Wi-Fi | Intel Wireless 7260 [8086:08b1] |
| Ethernet | Realtek RTL810xE |
| Prior OS | LMDE 7, kernel 6.12.101 (to be wiped) |
| SP+ status | NOT YET INSTALLED |

## HW-00 notes

- Free to wipe as of 2026-08-26. Formerly a thinkorswim trading machine; that use has ended and the data is gone. Single disk — an install destroys all 931 GB.
- Chosen deliberately by Christopher as representative of the OLD/LOW end of the target advisor's hardware. If SP+ performs acceptably here it performs acceptably anywhere.
- The mechanical HDD makes this the honest test of bootc update performance, because bootc pulls and writes whole container images.
- No TPM means Spike C (TPM2 enrollment, PCR 7 invalidation) CANNOT be gated on this machine. It is QEMU+swtpm only until a TPM-equipped machine exists. See T-01.
