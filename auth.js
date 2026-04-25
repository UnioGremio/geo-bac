/*  GeoBac — Access Gate (License Key)
    Adaugă în <head> pe paginile subiecte:
    <script src="auth.js"></script>

    Cum funcționează:
    - La load, verifică localStorage pentru cheie validă
    - Dacă nu există sau e invalidă → redirect la login.html
    - Cheia are format: GB-XXXX-XXXX-XXXX (16 chars hex)
    - Verificare: checksum integrat (ultimul char = XOR al celorlalte)
*/
(function(){
  var KEY_STORAGE = 'geobac_license';
  var EMAIL_STORAGE = 'geobac_email';

  // Validează format GB-XXXX-XXXX-XXXX + checksum
  window.GeoBacAuth = {
    validate: function(key){
      if(!key || typeof key !== 'string') return false;
      var clean = key.toUpperCase().trim().replace(/\s/g,'');
      // Format: GB-XXXX-XXXX-XXXX
      var match = clean.match(/^GB-([A-Z0-9]{4})-([A-Z0-9]{4})-([A-Z0-9]{4})$/);
      if(!match) return false;

      // Checksum: ultimul char e XOR al code-urilor celor 11 dinainte (mod 36)
      var body = match[1] + match[2] + match[3]; // 12 chars
      var chars = body.substring(0, 11);
      var expected = body.charAt(11);
      var sum = 0;
      for(var i=0;i<chars.length;i++){
        sum ^= chars.charCodeAt(i);
      }
      var alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      var computed = alphabet.charAt(sum % 36);
      return computed === expected;
    },

    getKey: function(){
      try { return localStorage.getItem(KEY_STORAGE); } catch(e){ return null; }
    },

    getEmail: function(){
      try { return localStorage.getItem(EMAIL_STORAGE); } catch(e){ return null; }
    },

    setKey: function(key, email){
      try {
        localStorage.setItem(KEY_STORAGE, key.toUpperCase().trim());
        if(email) localStorage.setItem(EMAIL_STORAGE, email);
        return true;
      } catch(e){ return false; }
    },

    clear: function(){
      try {
        localStorage.removeItem(KEY_STORAGE);
        localStorage.removeItem(EMAIL_STORAGE);
      } catch(e){}
    },

    isUnlocked: function(){
      var k = this.getKey();
      return k && this.validate(k);
    },

    // Folosită pe paginile protejate — redirecționează dacă nu e unlocked
    gate: function(){
      if(!this.isUnlocked()){
        var returnTo = encodeURIComponent(location.pathname.split('/').pop() || 'index.html');
        location.href = 'login.html?return=' + returnTo;
      }
    }
  };

  // Auto-gate pe paginile subiecte (dacă scriptul e încărcat pe europa/romania/vecini)
  var page = (location.pathname.split('/').pop() || '').toLowerCase();
  var protectedPages = ['europa.html', 'romania.html', 'vecini.html'];
  if(protectedPages.indexOf(page) !== -1){
    // Gate imediat (înainte ca pagina să afișeze ceva)
    if(!window.GeoBacAuth.isUnlocked()){
      var returnTo = encodeURIComponent(page);
      location.href = 'login.html?return=' + returnTo;
    }
  }
})();
