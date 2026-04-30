/*  GeoBac — Platform Navigation + Page Header + Dark Theme
    Adaugă în orice pagină: <script src="nav.js"></script>  */

(function(){
  var NH = 44;   // nav height
  var HH = 52;   // header height
  var TOTAL = NH + HH; // 96px total top offset
  var HERE = location.pathname.split('/').pop() || 'index.html';

  // ─── Detect page ───
  var isEuropa = HERE === 'europa.html';
  var isRomania = HERE === 'romania.html';
  var isVecini = HERE === 'vecini.html';
  var isMap = isEuropa || isRomania; // pages that need header + dark theme

  // ─── Fonts ───
  if (!document.querySelector('link[href*="Outfit"]')) {
    var fontLink = document.createElement('link');
    fontLink.rel = 'stylesheet';
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&display=swap';
    document.head.appendChild(fontLink);
  }

  // ─── CSS ───
  var css = document.createElement('style');
  css.textContent = [
    // Platform nav
    '.pnav{position:fixed;top:0;left:0;right:0;z-index:9999;height:' + NH + 'px;',
    'backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);',
    'background:rgba(12,17,23,0.92);border-bottom:1px solid rgba(255,255,255,0.08);',
    'display:flex;align-items:center;justify-content:space-between;padding:0 20px;',
    "font-family:'Outfit',sans-serif;box-sizing:border-box;}",
    '.pnav *{box-sizing:border-box;margin:0;padding:0;}',
    '.pnav-logo{font-weight:800;font-size:17px;color:#e8e6e1;text-decoration:none;',
    'display:flex;align-items:center;gap:7px;}',
    '.pnav-logo .pd{width:7px;height:7px;border-radius:50%;background:#00d4aa;',
    'box-shadow:0 0 10px #00d4aa;flex-shrink:0;}',
    '.pnav-logo em{font-style:normal;',
    'background:linear-gradient(135deg,#00d4aa,#5b9cf6);',
    '-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}',
    '.pnav-pills{display:flex;gap:3px;background:rgba(255,255,255,0.04);',
    'border-radius:10px;padding:3px;border:1px solid rgba(255,255,255,0.06);}',
    '.pnav-p{padding:5px 14px;border-radius:7px;font-weight:600;font-size:12px;',
    'color:rgba(232,230,225,0.55);text-decoration:none;transition:all .2s;white-space:nowrap;}',
    '.pnav-p:hover{color:#e8e6e1;background:rgba(255,255,255,0.06);}',
    '.pnav-p.on{color:#0c1117;background:#00d4aa;box-shadow:0 2px 8px rgba(0,212,170,0.25);}',
    // Page header
    '.phdr{position:fixed;top:' + NH + 'px;left:0;right:0;z-index:9998;height:' + HH + 'px;',
    'background:rgba(14,17,23,0.95);border-bottom:1px solid rgba(255,255,255,0.06);',
    'display:flex;align-items:center;padding:0 20px;gap:16px;',
    "font-family:'Outfit',sans-serif;box-sizing:border-box;backdrop-filter:blur(12px);}",
    '.phdr-title{font-weight:800;font-size:15px;color:#e8e6e1;white-space:nowrap;}',
    '.phdr-title em{font-style:normal;color:#00d4aa;}',
    '.phdr-title .num{color:#5b9cf6;font-size:13px;margin-left:2px;}',
    '.phdr-sub{font-size:11px;color:rgba(232,230,225,0.35);letter-spacing:0.5px;',
    'text-transform:uppercase;border-left:1px solid rgba(255,255,255,0.08);padding-left:14px;white-space:nowrap;}',
    '.phdr-nav{display:flex;gap:5px;margin-left:auto;flex-wrap:nowrap;overflow-x:auto;}',
    '.phdr-btn{display:flex;align-items:center;gap:5px;padding:6px 12px;border-radius:8px;',
    'border:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.03);',
    'color:rgba(232,230,225,0.65);font-size:11px;font-weight:600;cursor:pointer;',
    "font-family:'Outfit',sans-serif;transition:all .18s;white-space:nowrap;}",
    '.phdr-btn:hover{background:rgba(255,255,255,0.08);color:#e8e6e1;border-color:rgba(0,212,170,0.3);}',
    '.phdr-btn.active{background:rgba(0,212,170,0.15);border-color:rgba(0,212,170,0.4);color:#00d4aa;}',
    // Responsive
    '@media(max-width:600px){',
    '  .pnav{padding:0 12px;}',
    '  .pnav-pills{gap:1px;padding:2px;}',
    '  .pnav-p{padding:4px 8px;font-size:10px;}',
    '  .pnav-logo{font-size:15px;}',
    '  .phdr{padding:0 10px;gap:8px;}',
    '  .phdr-sub{display:none;}',
    '  .phdr-btn{padding:5px 8px;font-size:10px;gap:3px;}',
    '  .phdr-title{font-size:13px;}',
    '}'
  ].join('\n');
  document.head.appendChild(css);

  // ─── Push page content down ───
  var topOffset = isMap ? TOTAL : NH;
  document.body.style.paddingTop = topOffset + 'px';

  // ─── Dark theme for map pages ───
  if (isMap) {
    document.body.style.background = '#0c1117';
    document.body.style.color = '#e8e6e1';
  }

  // ─── Fix sticky headers ───
  setTimeout(function(){
    var headers = document.querySelectorAll('header');
    for(var i=0;i<headers.length;i++){
      var cs = getComputedStyle(headers[i]);
      if(cs.position === 'sticky') headers[i].style.top = topOffset + 'px';
    }
  }, 150);

  // ─── Fix fixed-position elements ───
  setTimeout(function(){
    var els = document.querySelectorAll('*');
    for(var i=0;i<els.length;i++){
      var el = els[i];
      if(el.className && typeof el.className === 'string' &&
         (el.className.indexOf('pnav') !== -1 || el.className.indexOf('phdr') !== -1)) continue;
      var cs = getComputedStyle(el);
      if(cs.position !== 'fixed') continue;
      var t = parseInt(cs.top);
      if(isNaN(t) || cs.top === 'auto') continue;
      // Full-height panels
      if(t === 0 && (cs.height === '100vh' || el.style.height === '100vh')){
        el.style.top = topOffset + 'px';
        el.style.height = 'calc(100vh - ' + topOffset + 'px)';
        continue;
      }
      // Buttons and panels with small top values
      if(t < 300){
        el.style.top = (t + topOffset) + 'px';
      }
    }
  }, 300);

  // ─── Build platform nav ───
  var pages = [
    { href: 'europa.html',  label: '\u{1F30D} Europa',  file: 'europa.html' },
    { href: 'romania.html', label: '\u{1F5FA} România', file: 'romania.html' },
    { href: 'vecini.html',  label: '\u{1F91D} Vecini',  file: 'vecini.html' }
  ];

  var nav = document.createElement('nav');
  nav.className = 'pnav';

  var logo = document.createElement('a');
  logo.href = 'index.html';
  logo.className = 'pnav-logo';
  logo.innerHTML = '<span class="pd"></span>Geo<em>Bac</em>';

  var pills = document.createElement('div');
  pills.className = 'pnav-pills';

  for(var i=0;i<pages.length;i++){
    var a = document.createElement('a');
    a.href = pages[i].href;
    a.className = 'pnav-p';
    if(HERE === pages[i].file) a.className += ' on';
    a.textContent = pages[i].label;
    pills.appendChild(a);
  }

  nav.appendChild(logo);
  nav.appendChild(pills);

  // ─── Logout button ───
  var logoutBtn = document.createElement('button');
  logoutBtn.textContent = 'Ieși din cont';
  logoutBtn.style.cssText = 'margin-left:auto;padding:5px 12px;border-radius:7px;font-weight:600;font-size:11px;color:rgba(232,230,225,0.45);background:none;border:1px solid rgba(255,255,255,0.08);cursor:pointer;font-family:inherit;transition:all 0.15s;white-space:nowrap;';
  logoutBtn.onmouseover = function(){ this.style.color='#ff6b6b'; this.style.borderColor='rgba(255,107,107,0.35)'; };
  logoutBtn.onmouseout  = function(){ this.style.color='rgba(232,230,225,0.45)'; this.style.borderColor='rgba(255,255,255,0.08)'; };
  logoutBtn.onclick = function(){
    if(window.GeoBacAuth) window.GeoBacAuth.lock();
    location.href = 'login.html';
  };
  nav.appendChild(logoutBtn);

  document.body.insertBefore(nav, document.body.firstChild);

  // ─── Build page header with shortcuts (only for map pages) ───
  if (!isMap) return;

  var hdr = document.createElement('div');
  hdr.className = 'phdr';

  // Title
  var title = document.createElement('div');
  title.className = 'phdr-title';

  var sub = document.createElement('div');
  sub.className = 'phdr-sub';

  var shortcuts = [];

  if (isEuropa) {
    title.innerHTML = 'Geo<em>Bac</em> <span class="num">I</span>';
    sub.textContent = 'Relieful Europei';
    shortcuts = [
      { label: '📖 Materie',    target: 'matbtn' },
      { label: '🏛 Capitale',   target: 'capbtn' },
      { label: '🌡 Climatic',   target: 'climodbtn_eu' },
      { label: '🌿 Biopedo',    target: 'biopbtn_eu' },
      { label: '⛏ Resurse',    target: 'resbtn_eu' }
    ];
  } else if (isRomania) {
    title.innerHTML = 'Geo<em>Bac</em> <span class="num">II</span>';
    sub.textContent = 'Relieful României';
    shortcuts = [
      { label: '📖 Materie',    target: 'matbtn_ro' },
      { label: '🌡 Climatic',   target: 'climodbtn' },
      { label: '🌿 Biopedo',    target: 'biopedobtn' },
      { label: '⛏ Resurse',    target: 'resbtn' }
    ];
  }

  var navDiv = document.createElement('div');
  navDiv.className = 'phdr-nav';

  shortcuts.forEach(function(s){
    var btn = document.createElement('button');
    btn.className = 'phdr-btn';
    btn.textContent = s.label;
    btn.setAttribute('data-target', s.target);
    btn.onclick = function(){
      var targetBtn = document.getElementById(s.target);
      if(targetBtn){
        targetBtn.click();
        // Toggle active state on shortcut
        var allBtns = navDiv.querySelectorAll('.phdr-btn');
        for(var j=0;j<allBtns.length;j++){
          if(allBtns[j] === btn){
            btn.classList.toggle('active');
          } else {
            // For materie, keep independent; for modes, only one active
            if(s.target.indexOf('mat') === -1 && allBtns[j].getAttribute('data-target').indexOf('mat') === -1){
              allBtns[j].classList.remove('active');
            }
          }
        }
      }
    };
    navDiv.appendChild(btn);
  });

  hdr.appendChild(title);
  hdr.appendChild(sub);
  hdr.appendChild(navDiv);

  // Insert after pnav
  nav.parentNode.insertBefore(hdr, nav.nextSibling);

  // ─── Style existing page elements for dark theme ───
  setTimeout(function(){
    // Europa-specific dark adjustments
    if (isEuropa) {
      // h1 title
      var h1 = document.querySelector('h1');
      if(h1) { h1.style.color = 'rgba(232,230,225,0.5)'; }
      // Controls bar
      var ctrl = document.getElementById('controls');
      if(ctrl) {
        ctrl.style.background = 'rgba(20,27,36,0.8)';
        ctrl.style.borderRadius = '8px';
        ctrl.style.padding = '6px 10px';
        ctrl.style.margin = '4px auto';
        ctrl.style.maxWidth = '1100px';
      }
      // Legend
      var leg = document.getElementById('legenda');
      if(leg) {
        leg.style.background = 'rgba(20,27,36,0.85)';
        leg.style.borderColor = 'rgba(255,255,255,0.06)';
        leg.style.color = 'rgba(232,230,225,0.7)';
      }
      // Filter buttons
      var fbtns = document.querySelectorAll('.fbtn');
      for(var k=0;k<fbtns.length;k++){
        fbtns[k].style.background = 'rgba(255,255,255,0.06)';
        fbtns[k].style.borderColor = 'rgba(255,255,255,0.1)';
        fbtns[k].style.color = 'rgba(232,230,225,0.6)';
      }
    }
    // Romania-specific dark adjustments
    if (isRomania) {
      // Legend title
      var lt = document.getElementById('leg-title');
      if(lt) { lt.style.color = 'rgba(232,230,225,0.5)'; }
      // Legend items
      var leg = document.getElementById('legenda');
      if(leg) {
        leg.style.background = 'rgba(20,27,36,0.8)';
        leg.style.borderRadius = '8px';
        leg.style.padding = '6px 10px';
      }
      var litems = document.querySelectorAll('.leg-item');
      for(var k=0;k<litems.length;k++){
        litems[k].style.color = 'rgba(232,230,225,0.7)';
      }
      // Controls
      var ctrl = document.getElementById('controls');
      if(ctrl) {
        ctrl.style.background = 'rgba(20,27,36,0.8)';
        ctrl.style.borderRadius = '8px';
        ctrl.style.padding = '6px 10px';
      }
      // Group buttons
      var gbtns = document.querySelectorAll('.gbtn');
      for(var k=0;k<gbtns.length;k++){
        gbtns[k].style.background = 'rgba(255,255,255,0.06)';
        gbtns[k].style.borderColor = 'rgba(255,255,255,0.1)';
        gbtns[k].style.color = 'rgba(232,230,225,0.55)';
      }
      // Control labels
      var clbls = document.querySelectorAll('.ctrl-label');
      for(var k=0;k<clbls.length;k++){
        clbls[k].style.color = 'rgba(232,230,225,0.35)';
      }
      // Control separators
      var cseps = document.querySelectorAll('.ctrl-sep');
      for(var k=0;k<cseps.length;k++){
        cseps[k].style.background = 'rgba(255,255,255,0.08)';
      }
    }

    // Shared: style fixed buttons to match dark theme
    var fixedBtns = [
      'matbtn','matbtn_ro','capbtn',
      'climodbtn','climodbtn_eu','biopedobtn','biopbtn_eu',
      'resbtn','resbtn_eu'
    ];
    fixedBtns.forEach(function(id){
      var el = document.getElementById(id);
      if(!el) return;
      el.style.background = 'rgba(20,27,36,0.92)';
      el.style.borderColor = 'rgba(255,255,255,0.12)';
      el.style.color = '#e8e6e1';
      el.style.backdropFilter = 'blur(12px)';
      el.style.boxShadow = '0 4px 16px rgba(0,0,0,0.4)';
    });

    // Style fixed panels to dark theme
    var panels = [
      'matpanel','matpanel_ro','climopanel','climopanel_eu',
      'biopedopanel','bioppanel_eu','respanel','respanel_eu',
      'climotoggle','capmenu','grupa-panel'
    ];
    panels.forEach(function(id){
      var el = document.getElementById(id);
      if(!el) return;
      el.style.background = 'rgba(20,27,36,0.97)';
      el.style.borderColor = 'rgba(255,255,255,0.1)';
      el.style.color = '#d4ddf0';
      el.style.boxShadow = '0 8px 32px rgba(0,0,0,0.5)';
    });

    // Style materie panels content
    var matPanels = document.querySelectorAll('#matpanel, #matpanel_ro');
    matPanels.forEach(function(p){
      p.style.background = 'rgba(14,17,23,0.98)';
    });

    // Tabs and chapters in materie
    var tabs = document.querySelectorAll('.mattab, .mattab_ro, .matchap');
    for(var k=0;k<tabs.length;k++){
      tabs[k].style.color = 'rgba(232,230,225,0.5)';
    }

    // Mat content styling
    var matC = document.querySelectorAll('#matcontent, #matcontent_ro');
    matC.forEach(function(el){
      el.style.color = '#c8d0e0';
    });

    // Close buttons
    var closeBtns = document.querySelectorAll('#matclose, #matclose_ro, .gp-close');
    for(var k=0;k<closeBtns.length;k++){
      closeBtns[k].style.color = 'rgba(232,230,225,0.5)';
    }
  }, 400);
})();
