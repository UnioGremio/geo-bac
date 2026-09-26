// functions/istorie-privat/_middleware.js
//
// Protejează TOATE fișierele din folderul /istorie-privat/ de pe site
// (orice pagină .html din el, indiferent câte sunt sau cum se leagă
// între ele) cu autentificare HTTP Basic.
//
// Ce înseamnă asta practic: când cineva accesează o adresă de tip
// geo-bac.com/istorie-privat/orice-fisier.html, browserul arată un
// pop-up NATIV (gri, al browserului, nu o pagină construită de noi)
// care cere user + parolă. Fără ele corecte, fișierul nu se încarcă
// deloc — nici conținutul, nici altceva.
//
// Legăturile dintre fișiere (harta-test.html?year=..., cap3-batalii-
// test.html?ruler=... etc.) NU sunt afectate — acest fișier nu modifică
// paginile, doar le verifică accesul înainte de a le servi.
//
// ÎNAINTE DE PUBLICARE, adaugă în Cloudflare Pages → proiectul tău →
// Settings → Variables and Secrets (pentru Production ȚI Preview):
//
//   ISTORIE_USER     = un nume, ales de tine (poate fi orice, ex: traian)
//   ISTORIE_PASSWORD = o parolă lungă, aleasă de tine — tip Secret
//
// Alege-le diferite de ADMIN_TOKEN (parola de la recenzii) — nu trebuie
// să fie aceeași.

export async function onRequest(context) {
  const { request, env, next } = context;

  const user = env.ISTORIE_USER;
  const pass = env.ISTORIE_PASSWORD;

  // "Fail-closed": dacă ai uitat să setezi variabilele în Cloudflare,
  // blocăm tot accesul, în loc să-l lăsăm liber din greșeală.
  if (!user || !pass) {
    return new Response('Acces indisponibil (configurare lipsă).', { status: 503 });
  }

  const authHeader = request.headers.get('Authorization') || '';
  const expected = 'Basic ' + btoa(`${user}:${pass}`);

  if (authHeader === expected) {
    return next(); // parola e corectă → lasă fișierul static să se încarce normal
  }

  return new Response('Acces restricționat.', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Istorie - acces privat"',
      'Cache-Control': 'no-store',
    },
  });
}
