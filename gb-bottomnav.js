/* GeoBac — bară de navigare jos (gb-bottomnav) (mobil) pentru paginile de geografie.
   Se adaugă pe fiecare pagină cu o singură linie, înainte de </body>:
   <script src="gb-bottomnav.js" defer></script>
   Meniul se modifică DOAR aici. */
(function () {
  // ── Setări: modifici aici ──
  var ITEMS = [
    { href: 'europa.html',          icon: '🌍', label: 'Europa',    match: ['europa'] },
    { href: 'romania.html',         icon: '🗺', label: 'România',   match: ['romania'] },
    { href: 'vecini.html',          icon: '🤝', label: 'Vecini',    match: ['vecini'] },
    { href: 'exercitii.html',       icon: '📝', label: 'Ex. BAC',   match: ['exercitii'] },
    { href: 'exercitii-harta.html', icon: '🎯', label: 'Ex. Hartă', match: ['exercitii-harta'] },
    { href: 'https://geo-bac.com/protected/subiecte', icon: '📚', label: 'Teorie', match: ['subiecte'] }
  ];
  // Bara apare doar pe aceste pagini (istoria și subiectele gratuite rămân fără ea)
  var SHOW_ON = ['europa', 'romania', 'vecini', 'exercitii', 'exercitii-harta', 'subiecte'];

  var page = (location.pathname.split('/').pop() || '').replace(/\.html$/, '').toLowerCase();
  if (SHOW_ON.indexOf(page) === -1) return;

  // Încarcă nav.css din același loc cu nav.js
  var me = document.currentScript || document.querySelector('script[src$="gb-bottomnav.js"]');
  var base = me && me.src ? me.src.replace(/gb-bottomnav\.js.*$/, '') : '';
  var css = document.createElement('link');
  css.rel = 'stylesheet';
  css.href = base + 'gb-bottomnav.css';
  document.head.appendChild(css);

  function build() {
    if (document.getElementById('gbBottomNav')) return;
    var nav = document.createElement('nav');
    nav.id = 'gbBottomNav';
    nav.className = 'gb-bottom-nav';
    nav.setAttribute('aria-label', 'Navigare principală');
    ITEMS.forEach(function (it) {
      var a = document.createElement('a');
      a.href = it.href;
      if (it.target) { a.target = it.target; a.rel = 'noopener'; }
      a.className = 'gb-bn-item' + (it.match.indexOf(page) !== -1 ? ' active' : '');
      if (it.match.indexOf(page) !== -1) a.setAttribute('aria-current', 'page');
      a.innerHTML = '<span class="gb-bn-icon" aria-hidden="true">' + it.icon + '</span><span class="gb-bn-label">' + it.label + '</span>';
      nav.appendChild(a);
    });
    document.body.appendChild(nav);
    document.body.classList.add('has-gb-bottom-nav');
  }
  if (document.body) build(); else document.addEventListener('DOMContentLoaded', build);
})();
