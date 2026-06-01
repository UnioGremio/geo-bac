(function(){
  var SUPABASE_URL = 'https://bxbefvelonocuheavsri.supabase.co';
  var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4YmVmdmVsb25vY3VoZWF2c3JpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyMTk5MzAsImV4cCI6MjA5Mjc5NTkzMH0.lRJX8JITWrBl1Mb6IeETtwBddTEOw7FI5isa9oGsGDA';

  var PROTECTED = ['europa','romania','vecini','exercitii','subiecte','subiecte-ani-precedenti'];

  var page = (location.pathname.split('/').pop() || '').toLowerCase().replace(/\.html$/,'');
  if(!PROTECTED.includes(page)) return;

  var overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:#0c1117;z-index:99999;display:flex;align-items:center;justify-content:center;';
  overlay.innerHTML = '<div style="text-align:center;color:#c8bfaa;font-family:system-ui,sans-serif;"><div style="width:32px;height:32px;border:3px solid rgba(0,212,170,0.2);border-top-color:#00d4aa;border-radius:50%;animation:spin 0.8s linear infinite;margin:0 auto 16px;"></div><p style="font-size:14px;">Se verifică accesul...</p></div><style>@keyframes spin{to{transform:rotate(360deg)}}</style>';
  document.documentElement.appendChild(overlay);

  function getSession(){
    try {
      var raw = localStorage.getItem('sb-bxbefvelonocuheavsri-auth-token');
      if(!raw) return null;
      var data = JSON.parse(raw);
      return (data && data.access_token) ? data : null;
    } catch(e){ return null; }
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
          cb(true);
        } else { cb(false); }
      } catch(e){ cb(false); }
    };
    xhr.onerror = xhr.ontimeout = function(){ cb(false); };
    xhr.send(JSON.stringify({refresh_token: refreshTok}));
  }

  function checkPremium(token, cb){
    var xhr = new XMLHttpRequest();
    xhr.open('GET', SUPABASE_URL + '/rest/v1/profiles?select=is_premium&limit=1', true);
    xhr.setRequestHeader('apikey', SUPABASE_ANON_KEY);
    xhr.setRequestHeader('Authorization', 'Bearer ' + token);
    xhr.timeout = 6000;
    xhr.onload = function(){
      try {
        var d = JSON.parse(xhr.responseText);
        if(Array.isArray(d) && d.length > 0 && d[0].is_premium === true){
          cb(true);
        } else {
          cb(false);
        }
      } catch(e){ cb(false); }
    };
    xhr.onerror = xhr.ontimeout = function(){ cb(false); };
    xhr.send();
  }

  function proceed(){
    var session = getSession();
    var token = session ? session.access_token : null;
    if(!token){ location.href = 'login.html?return=' + page; return; }

    checkPremium(token, function(isPremium){
      if(!isPremium){
        // Nu are abonament activ — redirect la pagina de plată
        location.href = 'index.html?noaccess=1';
        return;
      }
      document.cookie = 'sb-access-token=' + encodeURIComponent(token) + ';path=/;max-age=60;SameSite=Strict';
      location.replace('/protected/' + page);
    });
  }

  window.GeoBacAuth = {
    logout: function(){
      try{ localStorage.removeItem('sb-bxbefvelonocuheavsri-auth-token'); }catch(e){}
      document.cookie = 'sb-access-token=;path=/;max-age=0';
      location.href = 'login.html';
    }
  };

  var session = getSession();
  if(!session){ location.href = 'login.html?return=' + page; return; }

  var now = Date.now() / 1000;
  var expired = session.expires_at && now > session.expires_at;

  if(expired && session.refresh_token){
    doRefresh(session.refresh_token, function(ok){
      if(ok){ proceed(); } else { location.href = 'login.html?return=' + page; }
    });
  } else if(expired){
    location.href = 'login.html?return=' + page;
  } else {
    proceed();
  }

})();
