/*  GeoBac — Auth cu Supabase (email + parolă)
Adaugă în <head> pe paginile protejate:
<script src="auth.js"></script>
*/

const SUPABASE_URL = ‘https://bxbefvelonocuheavsri.supabase.co’;
const SUPABASE_ANON_KEY = ‘eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4YmVmdmVsb25vY3VoZWF2c3JpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyMTk5MzAsImV4cCI6MjA5Mjc5NTkzMH0.lRJX8JITWrBl1Mb6IeETtwBddTEOw7FI5isa9oGsGDA’;

// Încarcă Supabase SDK
(function () {
var script = document.createElement(‘script’);
script.src = ‘https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2’;
script.onload = function () {
window._supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.GeoBacAuth._init();
};
document.head.appendChild(script);
})();

window.GeoBacAuth = {
_client: null,
_session: null,

_init: async function () {
this._client = window._supabase;

```
// Ascultă schimbări de sesiune
this._client.auth.onAuthStateChange((event, session) => {
  this._session = session;
});

// Verifică sesiunea curentă
const { data } = await this._client.auth.getSession();
this._session = data.session;

// Gate automat pe paginile protejate
var page = (location.pathname.split('/').pop() || '').toLowerCase();
var protectedPages = ['europa.html', 'romania.html', 'vecini.html'];
if (protectedPages.indexOf(page) !== -1) {
  await this._gate(page);
}
```

},

_gate: async function (page) {
if (!this._session) {
location.href = ‘login.html?return=’ + encodeURIComponent(page);
return;
}

```
// Verifică dacă userul are acces premium
const isPremium = await this.isPremium();
if (!isPremium) {
  location.href = 'login.html?upgrade=1';
}
```

},

isPremium: async function () {
if (!this._session) return false;
const userId = this._session.user.id;
const { data } = await this._client
.from(‘profiles’)
.select(‘is_premium’)
.eq(‘id’, userId)
.single();
return data && data.is_premium === true;
},

login: async function (email, password) {
const { data, error } = await this._client.auth.signInWithPassword({ email, password });
if (error) throw error;
this._session = data.session;
return data;
},

register: async function (email, password) {
const { data, error } = await this._client.auth.signUp({ email, password });
if (error) throw error;
return data;
},

logout: async function () {
await this._client.auth.signOut();
this._session = null;
location.href = ‘index.html’;
},

resetPassword: async function (email) {
const { error } = await this._client.auth.resetPasswordForEmail(email, {
redirectTo: location.origin + ‘/reset-password.html’
});
if (error) throw error;
},

getUser: function () {
return this._session ? this._session.user : null;
},

isLoggedIn: function () {
return !!this._session;
}
};
