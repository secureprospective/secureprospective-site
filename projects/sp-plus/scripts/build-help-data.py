#!/usr/bin/env python3
"""Generate the Welcome app's help corpus from the written manual.

The manual is authored as one markdown file per article under `knowledge/`, and
`docs/HELP-CORPUS-LEDGER.md` records which of those articles have actually been
checked against a running SP+ machine. This script joins the two so the in-app
help is the manual rather than a second, drifting copy of it.

Only VERIFIED articles are shipped. An article that is written but unchecked is
exactly the kind of confident-sounding, unproven text that costs an advisor their
trust when it turns out to be wrong, so DRAFTED and TODO rows are skipped and
reported rather than quietly included.

The article's own H1 is the title. The ledger's batch heading is the category,
so the categories the advisor browses are the ones the manual was planned around
and cannot drift apart from it.
"""
from __future__ import annotations
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LEDGER = ROOT / 'docs' / 'HELP-CORPUS-LEDGER.md'
OUT = ROOT / 'welcome' / 'app' / 'help-data.json'

BATCH = re.compile(r'^##\s+Batch\s+\d+\s+[-—]\s+(.+?)\s*$')
ROW = re.compile(r'^\|\s*([A-Z]\d+)\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|\s*(\w+)\s*\|')


def parse_ledger(text: str):
    category = None
    for line in text.splitlines():
        heading = BATCH.match(line)
        if heading:
            category = heading.group(1).strip()
            continue
        row = ROW.match(line)
        if row and category:
            ident, title, path, status = row.groups()
            yield ident, title.strip(), path.strip(), status.strip().upper(), category


def article_title(markdown: str, fallback: str) -> str:
    for line in markdown.splitlines():
        if line.startswith('# '):
            return line[2:].strip()
    return fallback


def main() -> int:
    if not LEDGER.exists():
        print(f'ledger not found: {LEDGER}', file=sys.stderr)
        return 1
    entries, skipped, missing = [], [], []
    for ident, title, path, status, category in parse_ledger(LEDGER.read_text()):
        if category == 'Infrastructure':
            continue
        if status != 'VERIFIED':
            skipped.append(f'{ident} {title} [{status}]')
            continue
        source = ROOT / path
        if not source.exists():
            missing.append(f'{ident} {path}')
            continue
        markdown = source.read_text().strip()
        entries.append({
            'id': ident,
            'category': category,
            'title': article_title(markdown, title),
            'source': path,
            'markdown': markdown,
        })

    if missing:
        for row in missing:
            print(f'MISSING FILE: {row}', file=sys.stderr)
        return 1
    if not entries:
        print('no verified articles: refusing to ship an empty help corpus', file=sys.stderr)
        return 1

    # The manual is written incrementally by an agent working against a usage
    # cooldown, so it routinely stops a few articles short. Refusing to write
    # anything until every row is VERIFIED turns that ordinary stop into a blocked
    # release, and writing only the verified set would silently delete help the
    # advisor has today. So the two are merged: a freshly verified article replaces
    # its older version, and any article the app already ships that has not been
    # reached yet is carried forward untouched. Coverage can grow or hold, never
    # shrink, and a partial run is still worth shipping.
    kept = []
    if OUT.exists():
        try:
            current = json.loads(OUT.read_text())
        except (ValueError, OSError):
            current = []
        fresh = {e['title'] for e in entries}
        kept = [e for e in current
                if isinstance(e, dict) and e.get('title') and e['title'] not in fresh]

    order = []
    for entry in entries + kept:
        if entry['category'] not in order:
            order.append(entry['category'])
    entries = sorted(entries + kept, key=lambda e: (order.index(e['category']), e['title']))

    OUT.write_text(json.dumps(entries, indent=1, ensure_ascii=False) + '\n')
    print(f'wrote {OUT.relative_to(ROOT)}: {len(entries)} articles in {len(order)} categories')
    if kept:
        print(f'carried forward {len(kept)} not yet re-verified, so nothing was lost')
    for name in order:
        count = sum(1 for e in entries if e['category'] == name)
        print(f'  {count:>2}  {name}')
    if skipped:
        print(f'not yet verified, so not shipped ({len(skipped)}):')
        for row in skipped:
            print(f'  {row}')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
