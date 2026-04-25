# GeoBac — Fișiere de deploy

## Conținut
- `index.html` — landing page (gratuit, public)
- `login.html` — activare cu cheie de licență (gratuit, public)
- `auth.js` — sistemul de gate cu chei (validare client-side)
- `nav.js` — navigația platformei (sub paywall)
- `romania.html` — Subiectul II: Marile unități de relief
- `europa.html` — Subiectul I: Relieful Europei
- `vecini.html` — Subiectul III: România și vecinii

## NU urca pe GitHub
- `admin.html` — generator de chei (rămâne local pe calculatorul tău!)

## Pași
1. Creează cont GitHub (dacă n-ai)
2. Creează un repo nou (poate fi privat sau public)
3. Urcă toate fișierele de mai sus în root-ul repo-ului
4. Conectează repo-ul la Cloudflare Pages
5. Deploy → vei primi URL `geobac.pages.dev`
6. Adaugă custom domain (geobac.ro) după ce-l cumperi

## După deploy
- Modifică `BUY_URL` în `index.html` cu URL-ul real de la Lemon Squeezy
- Generează chei pentru clienți cu `admin.html` (local pe calculatorul tău)
- Trimite cheia + email la fiecare client după plată

Pentru detalii vezi `DEPLOYMENT.md` (separat, pentru tine).
