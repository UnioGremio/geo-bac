/*  GeoBac — Access Gate (Supabase Auth + Payment Check)
    Adaugă în <head> pe paginile protejate:
    <script src="auth.js"></script>

    IMPORTANT: Înainte de a folosi acest fișier, creează tabelul în Supabase:
    
    create table plati (
      user_id uuid references auth.users(id) primary key,
      email text,
      order_id text,
      creat_la timestamp default now()
    );

    Și activează RLS + adaugă policy de citire:
    alter table plati enable row level security;
    create policy "Userii pot vedea propria plată"
      on plati for select
      using (auth.uid() = user_id);
*/
(function(){
  var SUPABASE_URL = 'https://bxbefvelonocuheavsri.supabase.co';
  var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4YmVmdmVsb25vY3VoZWF2c3JpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyMTk5MzAsImV4cCI6MjA5Mjc5NTkzMH0.lRJX8JITWrBl1Mb6IeETtwBddTEOw7FI5isa9oGsGDA';

  // ======================================================
  // Paginile protejate — doar userii LOGAȚI + PLĂTIȚI pot accesa
  // ======================================================
  var PROTECTED = ['europa.html','romania.html','vecini.html','subiecte.html','exercitii.html','subiecte-ani-precedenti.html'];

  var page = (location.pathname.split('/').pop() || '').toLowerCase();
  if(PROTECTED.indexOf(page) === -1) return;

  // Overlay imediat — ascunde conținutul până se verifică
  var overlay = document.createElement('div');
  overlay.id = 'auth-overlay';
  overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:#0c1117;z-index:99999;display:flex;align-items:center;justify-content:center;';
  overlay.innerHTML = '<div style="text-align:center;color:#c8bfaa;font-family:system-ui,sans-serif;"><div style="width:32px;height:32px;border:3px solid rgba(0,212,170,0.2);border-top-color:#00d4aa;border-radius:50%;animation:spin 0.8s linear infinite;margin:0 auto 16px;"></div><p style="font-size:14px;">Se verifică accesul...</p></div><style>@keyframes spin{to{transform:rotate(360deg)}}</style>';
  document.documentElement.appendChild(overlay);

  function redirectToLogin(){
    location.href = 'login.html?return=' + encodeURIComponent(page);
  }

  function redirectToPayment(){
    // Înlocuiește cu link-ul tău real de LemonSqueezy
    location.href = 'index.html?motiv=neplata';
  }

  function removeOverlay(){
    var el = document.getElementById('auth-overlay');
    if(el) el.remove();
  }

  function getSession(){
    try {
      var raw = localStorage.getItem('sb-bxbefvelonocuheavsri-auth-token');
      if(!raw) return null;
      var data = JSON.parse(raw);
      return (data && data.access_token) ? data : null;
    } catch(e){ return null; }
  }

  // Verifică dacă userul există în Supabase Auth și returnează user-ul
  function verifyToken(token, cb){
    var xhr = new XMLHttpRequest();
    xhr.open('GET', SUPABASE_URL + '/auth/v1/user', true);
    xhr.setRequestHeader('Authorization', 'Bearer ' + token);
    xhr.setRequestHeader('apikey', SUPABASE_ANON_KEY);
    xhr.timeout = 6000;
    xhr.onload = function(){
      try {
        var u = JSON.parse(xhr.responseText);
        // Returnăm user-ul complet (cu id) pentru a verifica plata
        cb((u && u.id) ? u : null);
      } catch(e){ cb(null); }
    };
    xhr.onerror = xhr.ontimeout = function(){ cb(null); };
    xhr.send();
  }

  // ======================================================
  // VERIFICARE PLATĂ — verificăm is_premium în tabelul "profiles"
  // ======================================================
  function checkPayment(token, userId, cb){
    var xhr = new XMLHttpRequest();
    xhr.open('GET', SUPABASE_URL + '/rest/v1/profiles?id=eq.' + userId + '&select=is_premium&limit=1', true);
    xhr.setRequestHeader('Authorization', 'Bearer ' + token);
    xhr.setRequestHeader('apikey', SUPABASE_ANON_KEY);
    xhr.setRequestHeader('Accept', 'application/json');
    xhr.timeout = 6000;
    xhr.onload = function(){
      try {
        var rows = JSON.parse(xhr.responseText);
        // Acces permis doar dacă is_premium === true
        cb(Array.isArray(rows) && rows.length > 0 && rows[0].is_premium === true);
      } catch(e){ cb(false); }
    };
    xhr.onerror = xhr.ontimeout = function(){ cb(false); };
    xhr.send();
  }

  function doRefresh(refreshTok, cb){
    var xhr = new XMLHttpRequest();
    xhr.open('POST', SUPABASE_URL + '/auth/v1/token?grant_type=refresh_token', true);
    xhr.setRequestHeader('Content-Type','application/json');
    xhr.setRequestHeader('apikey', SUPABASE_ANON_KEY);
    xhr.timeout = 6000;
    xhr.onload = function(){
      try {
        var d = JSON.parse(xhr.responseText);
        if(d.access_token){
          localStorage.setItem('sb-bxbefvelonocuheavsri-auth-token', JSON.stringify(d));
          cb(d.access_token);
        } else { cb(null); }
      } catch(e){ cb(null); }
    };
    xhr.onerror = xhr.ontimeout = function(){ cb(null); };
    xhr.send(JSON.stringify({refresh_token: refreshTok}));
  }

  // Expus pentru nav.js (logout etc.)
  window.GeoBacAuth = {
    isUnlocked: function(){ return !!getSession(); },
    clear: function(){ try{ localStorage.removeItem('sb-bxbefvelonocuheavsri-auth-token'); }catch(e){} },
    logout: function(){ this.clear(); location.href='login.html'; }
  };

  // ======================================================
  // GATE PRINCIPAL
  // 1. Verifică sesiunea locală
  // 2. Verifică tokenul cu Supabase Auth
  // 3. Verifică plata în tabelul "plati"
  // ======================================================
  function runGate(token){
    verifyToken(token, function(user){
      if(!user){
        redirectToLogin();
        return;
      }
      // User e logat → verificăm acum dacă a plătit
      checkPayment(token, user.id, function(hasPaid){
        if(hasPaid){
          removeOverlay(); // ✅ Logat + Plătit → acces permis
        } else {
          redirectToPayment(); // ❌ Logat dar neplătit → redirect la plată
        }
      });
    });
  }

  var session = getSession();

  if(!session){
    redirectToLogin();
    return;
  }

  var now = Date.now() / 1000;
  var expired = session.expires_at && now > session.expires_at;

  if(expired && session.refresh_token){
    doRefresh(session.refresh_token, function(newToken){
      if(newToken){ runGate(newToken); }
      else { redirectToLogin(); }
    });
  } else if(expired){
    redirectToLogin();
  } else {
    runGate(session.access_token);
  }

})();
