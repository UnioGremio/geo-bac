/* GeoBac — progres salvat în contul elevului (Supabase).
   Pagina își păstrează progresul în localStorage ca până acum; acest fișier îl trimite
   automat în cont și îl aduce înapoi pe alt telefon / alt browser.

   Folosire în pagină (după ce progress.js e încărcat):
     GeoProgress.track(['cheie-localstorage-1', 'cheie-localstorage-2']);
     window.addEventListener('geoprogress:updated', function(){ ...recitește din localStorage... });
*/
(function () {
  if (window.GeoProgress) return;

  var SUPABASE_URL = 'https://bxbefvelonocuheavsri.supabase.co';
  var ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4YmVmdmVsb25vY3VoZWF2c3JpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyMTk5MzAsImV4cCI6MjA5Mjc5NTkzMH0.lRJX8JITWrBl1Mb6IeETtwBddTEOw7FI5isa9oGsGDA';
  var TOKEN_KEY = 'sb-bxbefvelonocuheavsri-auth-token';
  var META_KEY = 'gb-prog-meta';   // { cheie: moment ultima modificare locală }
  var USER_KEY = 'gb-prog-user';   // ultimul cont care a folosit acest browser
  var PUSH_DELAY = 1500;
  var AUTO_KEYS = ['geo-bac-ultima', 'geo-bac-zile'];   // ultima pagină + zilele de activitate
  var PAGES = {
    'europa': 'Europa — harta',
    'romania': 'România — harta',
    'vecini': 'Vecini și formule',
    'subiecte': 'Teorie',
    'exercitii-harta': 'Exerciții pe hartă'
  };

  var _set = Storage.prototype.setItem;
  var _get = Storage.prototype.getItem;
  var _rem = Storage.prototype.removeItem;

  var tracked = [];
  var applying = false;
  var dirty = {};
  var timer = null;
  var userId = null;
  var cachedToken = null;
  var syncPromise = null;

  function lsGet(k) { try { return _get.call(localStorage, k); } catch (e) { return null; } }
  function lsSet(k, v) { try { _set.call(localStorage, k, v); } catch (e) {} }
  function lsRem(k) { try { _rem.call(localStorage, k); } catch (e) {} }
  function readMeta() { try { return JSON.parse(lsGet(META_KEY) || '{}') || {}; } catch (e) { return {}; } }
  function writeMeta(m) { lsSet(META_KEY, JSON.stringify(m)); }
  function parseVal(raw) { if (raw === null || raw === undefined) return null; try { return JSON.parse(raw); } catch (e) { return raw; } }
  function isEmpty(v) {
    if (v === null || v === undefined || v === '') return true;
    if (Array.isArray(v)) return v.length === 0;
    if (typeof v === 'object') return Object.keys(v).length === 0;
    return false;
  }
  function same(a, b) { return JSON.stringify(a) === JSON.stringify(b); }
  function union(a, b) {
    var out = a.slice();
    b.forEach(function (x) { if (out.indexOf(x) === -1) out.push(x); });
    return out;
  }

  function getSession() {
    try {
      var d = JSON.parse(lsGet(TOKEN_KEY) || 'null');
      return d && d.access_token ? d : null;
    } catch (e) { return null; }
  }
  function jwtSub(t) {
    try {
      var p = t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      while (p.length % 4) p += '=';
      return JSON.parse(atob(p)).sub || null;
    } catch (e) { return null; }
  }

  // Token valid (îl reîmprospătează dacă a expirat)
  function getToken() {
    var s = getSession();
    if (!s) return Promise.resolve(null);
    var now = Date.now() / 1000;
    if (!s.expires_at || now < s.expires_at - 60) { cachedToken = s.access_token; return Promise.resolve(cachedToken); }
    if (!s.refresh_token) return Promise.resolve(null);
    return fetch(SUPABASE_URL + '/auth/v1/token?grant_type=refresh_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': ANON_KEY },
      body: JSON.stringify({ refresh_token: s.refresh_token })
    }).then(function (r) { return r.json(); }).then(function (d) {
      if (d && d.access_token) { lsSet(TOKEN_KEY, JSON.stringify(d)); cachedToken = d.access_token; return cachedToken; }
      return null;
    }).catch(function () { return null; });
  }

  function api(method, path, body, extra, keepalive) {
    return getToken().then(function (token) {
      if (!token) throw new Error('fără sesiune');
      var h = { 'apikey': ANON_KEY, 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' };
      if (extra) for (var k in extra) h[k] = extra[k];
      return fetch(SUPABASE_URL + path, { method: method, headers: h, body: body ? JSON.stringify(body) : undefined, keepalive: !!keepalive });
    });
  }

  function push(keys, keepalive) {
    if (!keys.length || !userId) return Promise.resolve();
    var meta = readMeta();
    var rows = keys.map(function (k) {
      var v = parseVal(lsGet(k));
      return { user_id: userId, key: k, value: v === null ? [] : v, updated_at: meta[k] || new Date().toISOString() };
    });
    return api('POST', '/rest/v1/progress?on_conflict=user_id,key', rows,
      { 'Prefer': 'resolution=merge-duplicates,return=minimal' }, keepalive)
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); keys.forEach(function (k) { delete dirty[k]; }); })
      .catch(function () { /* rămâne în "dirty"; se reîncearcă la următoarea modificare */ });
  }

  function flush(keepalive) {
    clearTimeout(timer); timer = null;
    return push(Object.keys(dirty), keepalive);
  }

  function markDirty(k) {
    var meta = readMeta();
    meta[k] = new Date().toISOString();
    writeMeta(meta);
    dirty[k] = true;
    if (!timer) timer = setTimeout(function () { flush(false); }, PUSH_DELAY);
  }

  // Interceptează scrierile în localStorage doar pentru cheile urmărite
  Storage.prototype.setItem = function (k) {
    _set.apply(this, arguments);
    if (this === localStorage && !applying && tracked.indexOf(k) !== -1) markDirty(k);
  };

  function applyLocal(k, value, ts, meta) {
    applying = true;
    lsSet(k, JSON.stringify(value));
    applying = false;
    meta[k] = ts;
  }

  function sync() {
    if (syncPromise) return syncPromise;
    syncPromise = getToken().then(function (token) {
      if (!token) return;
      userId = jwtSub(token);
      if (!userId) return;

      // alt cont pe același browser: nu amestecăm progresul
      var prev = lsGet(USER_KEY);
      var switched = !!(prev && prev !== userId);
      if (switched) { tracked.forEach(lsRem); lsRem(META_KEY); }
      lsSet(USER_KEY, userId);

      return api('GET', '/rest/v1/progress?select=key,value,updated_at&key=in.(' + tracked.join(',') + ')')
        .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
        .then(function (rows) {
          var server = {};
          (rows || []).forEach(function (row) { server[row.key] = row; });
          var meta = readMeta();
          var changed = [], toPush = [];

          tracked.forEach(function (k) {
            var localVal = parseVal(lsGet(k));
            var localTs = meta[k];
            var row = server[k];

            if (!row) {
              if (!isEmpty(localVal)) { meta[k] = new Date().toISOString(); toPush.push(k); }
              return;
            }
            if (!localTs) {
              // prima sincronizare pe acest browser
              if (isEmpty(localVal)) { applyLocal(k, row.value, row.updated_at, meta); changed.push(k); return; }
              if (Array.isArray(localVal) && Array.isArray(row.value)) {
                var merged = union(row.value, localVal);
                if (!same(merged, localVal)) { applyLocal(k, merged, row.updated_at, meta); changed.push(k); }
                if (!same(merged, row.value)) { meta[k] = new Date().toISOString(); toPush.push(k); }
                else meta[k] = row.updated_at;
                return;
              }
              if (!same(localVal, row.value)) { applyLocal(k, row.value, row.updated_at, meta); changed.push(k); }
              else meta[k] = row.updated_at;
              return;
            }
            var lt = Date.parse(localTs), st = Date.parse(row.updated_at);
            if (lt > st) { toPush.push(k); }
            else if (st > lt) {
              if (!same(localVal, row.value)) { applyLocal(k, row.value, row.updated_at, meta); changed.push(k); }
              else meta[k] = row.updated_at;
            }
          });

          writeMeta(meta);
          toPush.forEach(function (k) { dirty[k] = true; });
          var p = toPush.length ? flush(false) : Promise.resolve();
          // după schimbarea contului, pagina trebuie să recitească (altfel păstrează în memorie progresul vechi)
          if (switched) tracked.forEach(function (k) { if (changed.indexOf(k) === -1) changed.push(k); });
          if (changed.length) {
            try { window.dispatchEvent(new CustomEvent('geoprogress:updated', { detail: { keys: changed } })); } catch (e) {}
          }
          return p;
        });
    }).catch(function () {});
    return syncPromise;
  }

  function today() {
    var d = new Date();
    return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
  }
  function recordVisit() {
    if (!userId) return;
    var page = (location.pathname.split('/').pop() || '').replace(/\.html$/, '').toLowerCase();
    if (!PAGES[page]) return;
    // ultima pagină vizitată
    lsSet('geo-bac-ultima', JSON.stringify({ p: page, t: PAGES[page], ts: new Date().toISOString() }));
    markDirty('geo-bac-ultima');
    // zilele de activitate (ultimele 120)
    var days = parseVal(lsGet('geo-bac-zile'));
    if (!Array.isArray(days)) days = [];
    var t = today();
    if (days.indexOf(t) === -1) {
      days.push(t); days.sort(); if (days.length > 120) days = days.slice(days.length - 120);
      lsSet('geo-bac-zile', JSON.stringify(days));
      markDirty('geo-bac-zile');
    }
  }

  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') flush(true); });
  window.addEventListener('pagehide', function () { flush(true); });

  window.GeoProgress = {
    track: function (keys) {
      (keys || []).concat(AUTO_KEYS).forEach(function (k) { if (tracked.indexOf(k) === -1) tracked.push(k); });
      return sync().then(recordVisit);
    },
    // doar înregistrează vizita (pagini care nu au progres propriu)
    visit: function () { return window.GeoProgress.track([]); },
    // citește rânduri direct din cont (pentru pagina „Contul meu")
    fetch: function (keys) {
      return getToken().then(function (token) {
        if (!token) throw new Error('fără sesiune');
        return api('GET', '/rest/v1/progress?select=key,value,updated_at&key=in.(' + keys.join(',') + ')');
      }).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
        .then(function (rows) { var m = {}; (rows || []).forEach(function (x) { m[x.key] = x.value; }); return m; });
    },
    // GET generic spre Supabase REST, cu sesiunea elevului (ex. starea abonamentului)
    rest: function (path) {
      return api('GET', path).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
    },
    session: function () {
      var s = getSession(); if (!s) return null;
      return { userId: jwtSub(s.access_token), email: (s.user && s.user.email) || '' };
    },
    // șterge tot progresul contului + de pe acest browser
    deleteAll: function () {
      return getToken().then(function (token) {
        var id = token && jwtSub(token);
        if (!id) throw new Error('fără sesiune');
        return api('DELETE', '/rest/v1/progress?user_id=eq.' + id, null, { 'Prefer': 'return=minimal' });
      }).then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        AUTO_KEYS.concat(tracked).forEach(lsRem); lsRem(META_KEY);
        dirty = {};
      });
    },
    flush: function () { return flush(false); },
    // la delogare: curăță progresul local ca să nu rămână pe un telefon împrumutat
    clearLocal: function () { tracked.forEach(lsRem); lsRem(META_KEY); lsRem(USER_KEY); }
  };
})();
