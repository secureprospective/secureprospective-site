/* Every article in the manual must be findable from the search bar.
 *
 * A corpus can be complete and still be unreachable: an advisor only ever
 * meets an article through the search field or a category tile, so an
 * article that no query surfaces is, from where they sit, missing. This
 * checks the search itself rather than the JSON, and it runs on the same
 * help-core.js that both Welcome and the Help app load, so it cannot pass
 * against a copy that is not what ships.
 */
import { readFileSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';

const [corePath, dataPath] = process.argv.slice(2);
if (!corePath || !dataPath) {
  console.error('usage: help-search-coverage.mjs <help-core.js> <help-data.json>');
  process.exit(2);
}

const sandbox = { window: {} };
createContext(sandbox);
runInContext(readFileSync(corePath, 'utf8'), sandbox);
const H = sandbox.window.SPPlusHelp;
if (!H) { console.error('help-core.js defined no SPPlusHelp global'); process.exit(1); }

const articles = JSON.parse(readFileSync(dataPath, 'utf8'));
const index = H.buildIndex(articles);
const fails = [];

// 1. Its own title must find it, and find it first. This is the query an
//    advisor makes when someone has told them the name of a guide.
for (const a of articles) {
  const hits = H.search(index, a.title, 5);
  if (!hits.length) {
    fails.push(`title search finds nothing: ${a.title}`);
  } else if (hits[0].title !== a.title) {
    fails.push(`title search ranks the wrong article first: "${a.title}" -> "${hits[0].title}"`);
  }
}

// 2. Reachability from real words, not the full title. Every article must be
//    in the top 5 for at least one of its own significant title words.
for (const a of articles) {
  const words = H.tokenise(a.title).filter(w => w.length > 3);
  const reachable = words.some(w =>
    H.search(index, w, 5).some(h => h.title === a.title));
  if (words.length && !reachable) {
    fails.push(`no single title word reaches it: ${a.title}`);
  }
}

// 3. The misspellings a frightened advisor actually types.
const typed = [
  ['printr wont wrk', /print/i],
  ['recovry key', /recovery|encrypt/i],
  ['passwrd', /password|login|bitwarden/i],
  ['no internet', /wi-?fi|internet|network|online|connect/i],
  ['cant find my files', /file|folder|save/i],
  ['excel', /libreoffice|calc|spreadsheet/i],
];
for (const [query, want] of typed) {
  const hits = H.search(index, query, 5);
  if (!hits.length) fails.push(`typed query found nothing: ${query}`);
  else if (!hits.some(h => want.test(h.title) || want.test(h.category)))
    fails.push(`typed query "${query}" returned only: ${hits.map(h => h.title).join(' | ')}`);
}

// 4. Nonsense must find nothing, so the app can hand the advisor to Fin
//    instead of showing a shelf of irrelevant guides.
const nonsense = H.search(index, 'zzzq wobblefish quux', 5);
if (nonsense.length) {
  fails.push(`nonsense query returned ${nonsense.length} results: ${nonsense.map(h => h.title).join(' | ')}`);
}

// 5. Every category must be reachable by name.
for (const cat of Object.keys(H.categoriesOf(articles))) {
  if (!H.search(index, cat, 5).length) fails.push(`category name finds nothing: ${cat}`);
}

if (fails.length) {
  console.log(`HELP_SEARCH_COVERAGE FAILED (${fails.length} of ${articles.length} articles checked)`);
  for (const f of fails) console.log('  - ' + f);
  process.exit(1);
}
console.log(`HELP_SEARCH_COVERAGE_OK every one of ${articles.length} articles is reachable from the search bar`);
