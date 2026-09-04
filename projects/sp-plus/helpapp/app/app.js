/* SP+ Help: the pinned manual.
 *
 * Same corpus and same search as the help step inside Welcome, both from
 * help-core.js, which this app fetches from the one installed copy rather
 * than shipping its own. What differs is the frame: Welcome is a wizard step
 * with a route rail around it, this is a reference an advisor opens on its
 * own at the moment something has broken.
 *
 * Asking Fin differs too. Welcome talks to its Qt shell; here the question
 * goes to the local help server, which runs `fin --ask` as the advisor and
 * returns the answer.
 */
(function () {
  'use strict';

  var H = window.SPPlusHelp;
  var askForm = document.getElementById('ask-form');
  var askInput = document.getElementById('ask-fin');
  var askSubmit = document.getElementById('ask-submit');
  var askFeedback = document.getElementById('ask-feedback');
  var askFeedbackCopy = document.getElementById('ask-feedback-copy');
  var askDismiss = document.getElementById('ask-dismiss');
  var helpHome = document.getElementById('help-home');
  var helpHeading = document.getElementById('help-heading');
  var helpLede = document.getElementById('help-lede');
  var helpContent = document.getElementById('help-content');
  var crumbs = document.getElementById('breadcrumbs');
  var promptPanel = document.getElementById('prompt-panel');
  var promptList = document.getElementById('prompt-list');
  var offlineNote = document.getElementById('offline-note');

  var articles = [];
  var categories = {};
  var index = [];
  var view = {kind: 'root'};
  var esc = H.esc;

  function crumb(label, action) {
    var b = document.createElement('button');
    b.className = 'crumb-button';
    b.textContent = label;
    b.addEventListener('click', action);
    crumbs.appendChild(b);
  }

  function renderPrompts(article) {
    var prompts = article ? H.extractPrompts(article.markdown) : [];
    if (!prompts.length) { promptPanel.hidden = true; promptList.innerHTML = ''; return; }
    promptPanel.hidden = false;
    promptList.innerHTML = prompts.map(function (text, i) {
      return '<li class="prompt-item"><p class="prompt-text">' + esc(text) + '</p>' +
        '<button class="secondary-action prompt-copy" type="button" data-copy="' + i +
        '" aria-label="Copy this to send to Fin">COPY</button></li>';
    }).join('');
    Array.prototype.forEach.call(promptList.querySelectorAll('[data-copy]'), function (button) {
      button.addEventListener('click', function () {
        copyPrompt(button, prompts[Number(button.dataset.copy)]);
      });
    });
  }

  // This app is served over http on loopback, a secure context, so the async
  // clipboard is available here. It still falls back, because a browser can
  // refuse the permission and the advisor should be told what to do instead
  // rather than watching a button do nothing.
  function copyPrompt(button, text) {
    function done(ok) {
      button.textContent = ok ? 'COPIED' : 'PRESS CTRL+C';
      if (!ok) {
        try { window.getSelection().selectAllChildren(button.previousElementSibling); }
        catch (e) { /* selection is a convenience, not the operation */ }
      }
      setTimeout(function () { button.textContent = 'COPY'; }, 2200);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { done(true); },
                                              function () { legacyCopy(text, done); });
      return;
    }
    legacyCopy(text, done);
  }

  function legacyCopy(text, done) {
    var ok = false;
    try {
      var scratch = document.createElement('textarea');
      scratch.value = text;
      scratch.setAttribute('readonly', '');
      scratch.style.position = 'fixed';
      scratch.style.opacity = '0';
      document.body.appendChild(scratch);
      scratch.select();
      ok = document.execCommand('copy');
      document.body.removeChild(scratch);
    } catch (e) { ok = false; }
    done(ok);
  }

  function render() {
    crumbs.innerHTML = '';
    renderPrompts(null);
    helpHome.hidden = view.kind === 'root';

    if (view.kind === 'root') {
      helpHeading.textContent = 'PICK A STARTING POINT.';
      helpLede.textContent = 'Choose a topic, follow it at your own pace, then come back when you are ready.';
      helpLede.textContent = 'Every guide in the manual is listed here. '
        + 'Open one directly, or pick a topic to read it on its own.';
      var rootIndex = [];
      helpContent.innerHTML = '<div class="trail-index">' +
        Object.keys(categories).map(function (name) {
          var inTopic = articles.filter(function (a) { return a.category === name; });
          var links = inTopic.map(function (a) {
            var at = rootIndex.length;
            rootIndex.push(a);
            return '<li><button class="trail-link" data-root-article="' + at + '">' +
              esc(a.title) + '</button></li>';
          }).join('');
          return '<section class="trail-group">' +
            '<button class="trail-card" data-category="' + esc(name) + '"><b>' +
            esc(name) + '</b><small>' + esc(categories[name]) + '</small></button>' +
            (links ? '<ul class="trail-links">' + links + '</ul>' : '') +
            '</section>';
        }).join('') + '</div>';
      wireCategories();
      Array.prototype.forEach.call(
        helpContent.querySelectorAll('[data-root-article]'), function (b) {
          b.addEventListener('click', function () {
            var a = rootIndex[Number(b.getAttribute('data-root-article'))];
            if (!a) return;
            view = {kind: 'article', category: a.category, article: a};
            render();
          });
        });
      return;
    }

    crumb('HELP TOPICS', function () { view = {kind: 'root'}; render(); });

    if (view.kind === 'search') {
      var found = view.results;
      helpHeading.textContent = found.length ? 'WHAT WE FOUND.' : 'NOTHING MATCHED THAT YET.';
      helpLede.textContent = found.length
        ? 'The closest guides for what you typed.'
        : 'Fin can still answer this in your own words.';
      var browse = '<div class="search-browse"><span>OR BROWSE EVERY TOPIC</span><div class="browse-chips">' +
        Object.keys(categories).map(function (name) {
          return '<button class="browse-chip" data-category="' + esc(name) + '">' + esc(name) + '</button>';
        }).join('') + '</div></div>';
      helpContent.innerHTML = (found.length
        ? '<div class="trail-grid trail-grid--compact">' + found.map(function (a) {
            return '<button class="trail-card" data-found="1"><b>' + esc(a.title) +
              '</b><small>' + esc(a.category) + '</small></button>';
          }).join('') + '</div>'
        : '<div class="search-empty"><p>Nothing here matches those words yet. That is our gap, not your mistake.</p>' +
          '<p>Fin reads plain English and can answer from the whole manual, so pressing ASK FIN above is the fastest way on.</p></div>') + browse;
      wireCategories();
      Array.prototype.forEach.call(helpContent.querySelectorAll('[data-found]'), function (b, i) {
        b.addEventListener('click', function () {
          view = {kind: 'article', category: found[i].category, article: found[i]};
          render();
        });
      });
      return;
    }

    if (view.kind === 'category') {
      var cat = view.category;
      helpHeading.textContent = cat.toUpperCase() + '.';
      helpLede.textContent = categories[cat];
      var entries = articles.filter(function (a) { return a.category === cat; });
      helpContent.innerHTML = '<div class="trail-grid trail-grid--compact">' +
        entries.map(function (a) {
          return '<button class="trail-card" data-article="1"><b>' + esc(a.title) +
            '</b><small>READ THIS GUIDE HERE</small></button>';
        }).join('') + '</div>';
      Array.prototype.forEach.call(helpContent.querySelectorAll('[data-article]'), function (b, i) {
        b.addEventListener('click', function () {
          view = {kind: 'article', category: cat, article: entries[i]};
          render();
        });
      });
      return;
    }

    var a = view.article;
    crumb(view.category, function () { view = {kind: 'category', category: view.category}; render(); });
    crumb(a.title, function () {});
    helpHeading.textContent = a.title.toUpperCase();
    helpLede.textContent = 'From the SP+ manual, stored on this computer.';
    renderPrompts(a);
    helpContent.innerHTML = '<div class="article-reader">' +
      H.markdown(H.stripPrompts(a.markdown)) + '</div>';
    helpContent.scrollTop = 0;
    window.scrollTo(0, 0);
  }

  function wireCategories() {
    Array.prototype.forEach.call(helpContent.querySelectorAll('[data-category]'), function (b) {
      b.addEventListener('click', function () {
        askInput.value = '';
        view = {kind: 'category', category: b.dataset.category};
        render();
      });
    });
  }

  // One field searches the manual and asks Fin, exactly as in Welcome. An
  // advisor should never have to decide which of two boxes their problem
  // belongs in before they can type anything.
  askInput.addEventListener('input', function () {
    var query = askInput.value.trim();
    if (query.length < 2) {
      if (view.kind === 'search') { view = {kind: 'root'}; render(); }
      return;
    }
    view = {kind: 'search', query: query, results: H.search(index, query, 5)};
    render();
  });

  function showAsk(message, kind) {
    askFeedback.hidden = false;
    askFeedback.dataset.kind = kind || '';
    askFeedbackCopy.textContent = message;
  }

  function resetAsk() {
    askFeedback.hidden = true;
    askFeedback.dataset.kind = '';
    askFeedbackCopy.textContent = '';
    askInput.disabled = false;
    askSubmit.disabled = false;
    askForm.setAttribute('aria-busy', 'false');
    askSubmit.textContent = 'ASK FIN';
  }

  askForm.addEventListener('submit', function (event) {
    event.preventDefault();
    var question = askInput.value.trim();
    if (!question) { askInput.focus(); return; }
    askInput.disabled = true;
    askSubmit.disabled = true;
    askSubmit.textContent = 'ASKING...';
    askForm.setAttribute('aria-busy', 'true');
    showAsk('Fin is reading your question.', '');
    fetch('/api/ask', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({question: question})
    }).then(function (r) { return r.json(); }).then(function (result) {
      askInput.disabled = false;
      askSubmit.disabled = false;
      askSubmit.textContent = 'ASK FIN';
      askForm.setAttribute('aria-busy', 'false');
      if (result && result.ok) showAsk(result.answer, 'answer');
      else showAsk((result && result.reason ? result.reason : 'Fin did not answer.') +
                   ' You can open Fin from Applications and ask there.', 'error');
    }).catch(function () {
      askInput.disabled = false;
      askSubmit.disabled = false;
      askSubmit.textContent = 'ASK FIN';
      askForm.setAttribute('aria-busy', 'false');
      showAsk('Help could not reach Fin on this computer. The manual above still works.', 'error');
    });
  });

  askDismiss.addEventListener('click', function () {
    resetAsk();
    view = {kind: 'root'};
    render();
  });
  helpHome.addEventListener('click', function () {
    resetAsk();
    askInput.value = '';
    view = {kind: 'root'};
    render();
  });

  function showOffline() { offlineNote.hidden = navigator.onLine; }
  window.addEventListener('online', showOffline);
  window.addEventListener('offline', showOffline);
  showOffline();

  fetch('/help-data.json').then(function (r) { return r.json(); }).then(function (data) {
    articles = data;
    categories = H.categoriesOf(articles);
    index = H.buildIndex(articles);
    render();
    window.spHelpReady = {articles: articles.length, categories: Object.keys(categories).length};
  }).catch(function () {
    helpContent.textContent = 'Help could not load right now. Close this window and open Help again.';
  });

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('/sw.js').catch(function () {
        // Offline caching is a bonus. The app is still fully usable without it.
      });
    });
  }

  // Named hooks so a gate drives the app the way an advisor does, rather than
  // reaching into private state.
  window.spHelp = {
    go: function (kind, payload) { view = Object.assign({kind: kind}, payload || {}); render(); },
    search: function (q) { askInput.value = q; askInput.dispatchEvent(new Event('input')); },
    // Open a guide the way a reader reaches it, by its name, so a test walks
    // the same path an advisor does instead of assigning private state.
    openByTitle: function (title) {
      var found = null;
      articles.forEach(function (a) { if (a.title === title) found = a; });
      if (!found) return false;
      view = {kind: 'article', category: found.category, article: found};
      render();
      return true;
    },
    results: function () {
      return Array.prototype.map.call(
        helpContent.querySelectorAll('.trail-card b'),
        function (n) { return n.textContent; });
    },
    copyButtons: function () { return promptList.querySelectorAll('.prompt-copy').length; },
    readerText: function () {
      var r = helpContent.querySelector('.article-reader');
      return r ? r.textContent.length : 0;
    },
    state: function () { return {kind: view.kind, title: view.article ? view.article.title : null}; },
    categories: function () { return Object.keys(categories); },
    rootLinks: function () {
      return Array.prototype.map.call(
        helpContent.querySelectorAll('.trail-link'),
        function (n) { return n.textContent; });
    },
    articles: function () { return articles.map(function (a) { return a.title; }); },
    prompts: function () { return Array.prototype.map.call(
      promptList.querySelectorAll('.prompt-text'), function (n) { return n.textContent; }); }
  };
}());
