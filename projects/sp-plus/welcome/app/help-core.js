/* SP+ help core: the logic behind the manual, with no DOM in it.
 *
 * Two surfaces render this corpus. Welcome shows it as one step of a
 * first-run wizard; the Help app shows it on its own, pinned to the task
 * bar, with no wizard around it. Their PRESENTATION should differ, because
 * a step in a sequence and a reference you open at 4pm are not the same
 * thing. Their MEANING must not: an advisor who searches "printr wont wrk"
 * has to get the same article in both, or the help is lying somewhere.
 *
 * So everything that decides WHAT the advisor sees lives here, and each
 * surface owns only how it draws it. This file is loaded verbatim by both;
 * it is one file installed to two places, never two files kept in step by
 * hand.
 *
 * No modules and no build step: Welcome runs from file:// inside
 * QtWebEngine, where ES module imports are blocked by the origin rules.
 * A plain script defining one global is what actually works in both.
 */
(function (root) {
  'use strict';

  // Blurbs for the category tiles. A category with no entry still shows,
  // with an honest line rather than a blank tile.
  var CATEGORY_NOTES = {
    'Start here': 'The first few minutes and your map.',
    'Your files': 'Where your work lives, and what is backed up.',
    'Everyday work': 'The apps and devices you use every day.',
    'Fix a problem': 'Step-by-step help for something that went wrong.',
    'Safety and privacy': 'What is protected and what stays private.',
    'Updates and recovery': 'Restarts, updates and finding your way back.',
    'Get more help': 'When you want the Assistant or a person.'
  };
  var CATEGORY_FALLBACK = 'Guides we have written for this part of the computer.';

  // The advisor's vocabulary mapped onto ours. Left side is what they type.
  var SYNONYMS = {
    'internet':'wifi network online connect','wifi':'internet network online connect',
    'online':'internet wifi network','network':'wifi internet online',
    'print':'printer printing paper','printer':'print printing paper','printing':'printer print',
    'scan':'scanner scanning document','scanner':'scan scanning',
    'password':'passwords login sign in bitwarden','passwords':'password login bitwarden',
    'login':'password sign in log in','email':'mail message inbox','mail':'email inbox',
    'word':'libreoffice writer document','excel':'libreoffice calc spreadsheet',
    'office':'libreoffice word excel document','doc':'document libreoffice writer',
    'screen':'monitor display','monitor':'screen display','display':'screen monitor',
    'sound':'audio volume speakers','audio':'sound volume speakers','volume':'sound audio',
    'save':'saving files documents','file':'files documents folder','folder':'files documents',
    'usb':'flash drive thumb drive external stick','stick':'usb flash drive',
    'backup':'backups copy protected','copy':'backup backups',
    'update':'updates restart upgrade','restart':'reboot update restarts',
    'reboot':'restart updates','slow':'performance speed',
    'lost':'stolen missing lost','stolen':'lost missing theft',
    'lock':'screen lock privacy locked','locked':'lock screen locked out',
    'encrypt':'encryption recovery key','key':'recovery key encryption',
    'assistant':'fin help ask','fin':'assistant help ask','help':'assistant fin support',
    'camera':'video calls microphone webcam','video':'camera calls microphone',
    'bluetooth':'wireless devices pairing','share':'shared sharing folder portal',
    'portal':'file portal cloud shared','cloud':'portal file online',
    'windows':'coming from windows migration','pdf':'pdfs reading signing'
  };

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>]/g, function (c) {
      return {'&': '&amp;', '<': '&lt;', '>': '&gt;'}[c];
    });
  }

  function inline(s) {
    return esc(s)
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  }

  function markdown(text) {
    var list = false, out = '', lines = String(text || '').split('\n');
    for (var i = 0; i < lines.length; i++) {
      var s = lines[i].trim();
      if (!s) { if (list) { out += '</ul>'; list = false; } continue; }
      if (s.charAt(0) === '#') {
        if (list) { out += '</ul>'; list = false; }
        var level = Math.min(3, s.match(/^#+/)[0].length);
        out += '<h' + level + '>' + inline(s.slice(level).trim()) + '</h' + level + '>';
        continue;
      }
      if (s.slice(0, 2) === '- ') {
        if (!list) { out += '<ul>'; list = true; }
        out += '<li>' + inline(s.slice(2)) + '</li>';
        continue;
      }
      if (/^\d+\.\s/.test(s)) {
        if (!list) { out += '<ul>'; list = true; }
        out += '<li>' + inline(s.replace(/^\d+\.\s/, '')) + '</li>';
        continue;
      }
      if (s.charAt(0) === '>') {
        out += '<p><strong>' + inline(s.slice(1).trim()) + '</strong></p>';
        continue;
      }
      out += '<p>' + inline(s) + '</p>';
    }
    return out + (list ? '</ul>' : '');
  }

  /* Suggested Fin prompts.
   *
   * The manual writes these as a bulleted, bolded, quoted line beginning
   * "Fin, ...". They are the most directly useful thing on the page and the
   * hardest to use: an advisor reading a suggestion has to retype it into a
   * terminal without a typo, which is exactly the moment the frightened
   * newcomer gives up. Pulling them out lets each one be copied whole.
   *
   * Extraction is by line shape rather than by section heading, because the
   * headings above them are written freely and differ in every article.
   * Anything not matching stays in the prose, so a change in the manual
   * degrades to "no copy button here", never to a mangled article.
   */
  var PROMPT_LINE = /^\s*[-*]\s*\*\*\s*"(Fin,[^"]*)"\s*\*\*\s*$/;

  function extractPrompts(md) {
    var found = [], seen = {}, lines = String(md || '').split('\n');
    for (var i = 0; i < lines.length; i++) {
      var m = lines[i].match(PROMPT_LINE);
      if (!m) continue;
      var text = m[1].replace(/\s+/g, ' ').trim();
      if (!text || seen[text]) continue;
      seen[text] = true;
      found.push(text);
    }
    return found;
  }

  // The prompts are lifted into their own panel, so leaving them in the body
  // too would show the advisor the same sentence twice on one screen.
  function stripPrompts(md) {
    return String(md || '').split('\n')
      .filter(function (line) { return !PROMPT_LINE.test(line); })
      .join('\n');
  }

  function categoriesOf(articles) {
    var out = {};
    (articles || []).forEach(function (a) {
      if (!a || !a.category || out[a.category]) return;
      out[a.category] = CATEGORY_NOTES[a.category] || CATEGORY_FALLBACK;
    });
    return out;
  }

  var normalise = function (s) {
    return String(s || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
  };
  var tokenise = function (s) {
    return normalise(s).split(/\s+/).filter(function (w) { return w.length > 1; });
  };

  // Small edit distance, capped: enough for a slip or a doubled letter, not
  // enough to match an unrelated word. Bounded so a long query stays cheap.
  function within(a, b, limit) {
    if (a === b) return 0;
    if (Math.abs(a.length - b.length) > limit) return limit + 1;
    var prev = [], i, j;
    for (i = 0; i <= b.length; i++) prev.push(i);
    for (i = 1; i <= a.length; i++) {
      var row = [i], best = i;
      for (j = 1; j <= b.length; j++) {
        var cost = a[i - 1] === b[j - 1] ? 0 : 1;
        row[j] = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + cost);
        if (row[j] < best) best = row[j];
      }
      if (best > limit) return limit + 1;
      prev = row;
    }
    return prev[b.length];
  }

  function expand(words) {
    var out = [];
    words.forEach(function (w) {
      out.push(w);
      (SYNONYMS[w] || '').split(' ').forEach(function (s) { if (s) out.push(s); });
    });
    return out;
  }

  function buildIndex(articles) {
    return (articles || []).map(function (article) {
      var headings = (article.markdown.match(/^#{1,3}\s+.*$/gm) || [])
        .map(function (line) { return line.replace(/^#+\s*/, ''); }).join(' ');
      var body = article.markdown.replace(/^#{1,3}\s+.*$/gm, ' ');
      return {
        article: article,
        title: normalise(article.title),
        titleWords: expand(tokenise(article.title)),
        headWords: expand(tokenise(headings)),
        bodyWords: (function () {
          var set = {};
          tokenise(body).forEach(function (w) { set[w] = true; });
          return set;
        }()),
        category: normalise(article.category)
      };
    });
  }

  // Word-boundary match against an already-normalised string.
  //
  // Substring matching gave short query words credit for landing inside a
  // longer, unrelated word: "no" in "no internet" matched the "no" inside
  // "Printer not printing", scored as a title hit, and pulled the printing
  // guide into a question about the network. Titles are normalised to
  // letters, digits and spaces, so a boundary test is exact here.
  function hasWord(haystack, word) {
    var i = haystack.indexOf(word);
    while (i !== -1) {
      var before = i === 0 ? ' ' : haystack.charAt(i - 1);
      var afterAt = i + word.length;
      var after = afterAt >= haystack.length ? ' ' : haystack.charAt(afterAt);
      if (before === ' ' && after === ' ') return true;
      i = haystack.indexOf(word, i + 1);
    }
    return false;
  }

  // Weighted so a title match always outranks a passing mention in the body.
  //
  // Two properties here were added after a coverage run over the whole
  // manual, not from reading the code:
  //
  //   - An EXACT title match must win outright. Substring credit alone is
  //     not enough, because a short title is a substring of a longer one:
  //     searching "Printing" scored "Printer not printing" just as highly
  //     and ranked it first, so the guide the advisor named came second to
  //     a guide about a fault they may not have.
  //
  //   - A hit is "strong" only if the query touched its title, headings or
  //     category. Body-only hits are passing mentions. "no internet"
  //     returned the printing guide because its body happens to say
  //     "network" and "connect", which reads as a search that did not
  //     understand the question.
  function scoreEntry(entry, words, raw) {
    var score = 0, strong = false;
    if (raw.length > 2 && entry.title === raw) score += 60;
    else if (raw.length > 2 && entry.title.indexOf(raw) !== -1) score += 40;
    if (score) strong = true;
    words.forEach(function (word) {
      if (hasWord(entry.title, word)) { score += 12; strong = true; }
      else if (entry.titleWords.some(function (t) { return t.indexOf(word) === 0; })) { score += 10; strong = true; }
      else if (word.length > 3 && entry.titleWords.some(function (t) { return within(t, word, 1) <= 1; })) { score += 7; strong = true; }
      if (hasWord(entry.category, word)) { score += 4; strong = true; }
      if (entry.headWords.some(function (h) { return h.indexOf(word) === 0; })) { score += 5; strong = true; }
      else if (word.length > 3 && entry.headWords.some(function (h) { return within(h, word, 1) <= 1; })) { score += 3; strong = true; }
      if (entry.bodyWords[word]) score += 2;
    });
    return {score: score, strong: strong};
  }

  function search(index, query, limit) {
    var raw = normalise(query).trim();
    var typed = tokenise(query);
    if (!typed.length) return [];
    var words = expand(typed);
    var scored = index.map(function (entry) {
      var hit = scoreEntry(entry, words, raw);
      return {entry: entry, score: hit.score, strong: hit.strong};
    }).filter(function (hit) { return hit.score >= 7; })
      .sort(function (a, b) {
        return b.score - a.score ||
          a.entry.article.title.localeCompare(b.entry.article.title);
      });
    if (!scored.length) return [];
    // A fixed threshold alone let weak body mentions ride along behind a
    // strong title match, so "no internet" answered with Printing and No
    // sound. Six results where two are right reads as a search that does not
    // understand the question. Anything far below the best match is dropped.
    var best = scored[0].score;
    // Once anything has matched a title, heading or category, a body-only
    // mention is noise rather than a weaker answer, so it is dropped
    // outright instead of being ranked below.
    var haveStrong = scored.some(function (hit) { return hit.strong; });
    return scored.filter(function (hit) {
      if (haveStrong && !hit.strong) return false;
      return hit.score >= Math.max(9, best * 0.5);
    }).slice(0, limit || 5).map(function (hit) { return hit.entry.article; });
  }

  root.SPPlusHelp = {
    CATEGORY_NOTES: CATEGORY_NOTES,
    CATEGORY_FALLBACK: CATEGORY_FALLBACK,
    SYNONYMS: SYNONYMS,
    esc: esc,
    inline: inline,
    markdown: markdown,
    extractPrompts: extractPrompts,
    stripPrompts: stripPrompts,
    categoriesOf: categoriesOf,
    normalise: normalise,
    tokenise: tokenise,
    buildIndex: buildIndex,
    search: search
  };
}(typeof window !== 'undefined' ? window : this));
