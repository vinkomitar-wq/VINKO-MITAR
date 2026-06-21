# PHUKET CHARTER — čisti izvozni paket (s ugrađenim popravcima)

Ovo je TVOJ postojeći app, izvučen iz AI Studija, sa **svim našim popravcima
već ugrađenima u kod**. Gemini ovome više ne može pristupiti čim ga hostaš
izvan AI Studija.

## Što je već popravljeno u ovom kodu
- AgentContext.tsx — kraj gubljenja agenata (kanonski email-ID, merge, bez
  auto-dedup upisa) + HYBRID LOGIN (Firebase Auth prvo, stara provjera fallback)
- CaptainWorkspaceModal.tsx + App.tsx — agenti se više ne dvostruče pod uid-om
- main.tsx — uklonjen mrtvi "SECURITY BREACH" kod
- Novi admin alati u src/components/:
  - AgentDebugPanel.tsx (pregled svih agenata + reaktivacija)
  - AgentMergeTool.tsx (spajanje duplikata, bez window.confirm)
  - AgentAuthMigration.tsx (kreiranje Firebase Auth računa)
  - ContactFieldSwap.tsx (zamjena WhatsApp/LINE za Chana)
- firestore.rules — pojačan (customers PII + mail spam-relay zaštita)

## Što ti je AI Studio radio automatski, a sad moraš sam
AI Studio je sam ubacivao ove tajne/varijable. Izvan njega ih postavi ručno
(u .env datoteci ili u panelu "Environment variables" tvog hostinga):

    GEMINI_API_KEY=...                 # tvoj Gemini API ključ
    APP_URL=https://tvoj-host-url      # URL gdje je app hostan
    VITE_GOOGLE_MAPS_API_KEY=...       # Google Maps (ako koristiš karte)
    GOOGLE_MAPS_PLATFORM_KEY=...
    VITE_GOOGLE_MAPS_PLATFORM_KEY=...
    VITE_GOOGLE_MAPS_MAP_ID=...

Firebase config je već u `firebase-applet-config.json` (apiKey je javan po
dizajnu, to NIJE tajna — sigurnost dolazi od Firestore pravila + Auth).

## Kako se gradi (lokalno ili na hostingu)
Treba Node 18+ i npm.

    npm install            # instalira ovisnosti
    npm run dev            # lokalni razvoj (Express + Vite)
    npm run build          # produkcijski build -> dist/
    npm start              # pokrece produkciju (node dist/server.cjs)

## VAŽNO — gdje ovo MOŽEŠ hostati
Ovo NIJE čisti statički sajt — ima Express server (server.ts) + Gemini AI.
Zato treba host koji pokreće Node, NE samo statički "app maker".

DOBRE opcije (pokreću Node server):
- Google Cloud Run (gdje već jesi)
- Render.com
- Railway.app
- Fly.io

NE radi na: GitHub Pages, čisti Netlify/Vercel static (jer ne pokreću server).
(Vercel/Netlify mogu uz serverless funkcije, ali traži prilagodbu.)

Tipično na Render/Railway:
1. Spoji ovaj kod (git repo ili upload zip-a)
2. Build command:  npm install && npm run build
3. Start command:  npm start
4. Dodaj environment varijable (gore navedene)

## Firestore pravila
Pravila se NE deployaju iz koda — objavljuju se ručno u Firebase Console:
Firestore Database -> named baza (ai-studio-9ef1e50a-...) -> Security -> Publish.
Sadržaj je u `firestore.rules`.

## Napomena o scratch datotekama
U rootu su ostale neke radne datoteke iz prošlih sesija (log.txt, output.txt,
states.txt, dur.txt, check_*.ts, query_user*.ts, recover.ts, restore_*.ts,
*.js skripte). One NISU dio aplikacije — slobodno ih obriši, ne utječu na build.
