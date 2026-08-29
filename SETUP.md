# MORZÉA — Firebase + GPT-5.6 Intelligent Concierge

This package **adds** Firebase telemetry and an evidence-led AI concierge to the current MORZÉA GitHub Pages site. It does not remove the current hero, product galleries, NOURISH section, ritual, origin, newsletter, cart or bilingual behavior.

## Architecture

```text
GitHub Pages / MORZÉA
        |
        |-- Firebase Anonymous Auth
        |-- Cloud Firestore
        |      MORZEA_Visitors
        |      MORZEA_Events
        |      MORZEA_Leads
        |      MORZEA_AI_Sessions
        |      MORZEA_AI_Messages
        |      MORZEA_Errors
        |
        +-- Google Apps Script Web App
                  |
                  +-- OpenAI Responses API / GPT-5.6
                  +-- OpenAI Web Search
                  +-- MORZÉA canonical knowledge JSON
```

## 1. Firebase: register the MORZÉA web app

Firebase Console → Project `ex-experience` → Project settings → General → Your apps.

If no Web app exists for MORZÉA:
1. Add app → Web.
2. Nickname: `MORZEA Web`.
3. Register app.
4. Copy the `firebaseConfig` values.

Open `morzea-config.js` and replace:

```js
apiKey: "PASTE_FIREBASE_API_KEY",
authDomain: "ex-experience.firebaseapp.com",
projectId: "ex-experience",
storageBucket: "PASTE_FIREBASE_STORAGE_BUCKET",
messagingSenderId: "PASTE_FIREBASE_MESSAGING_SENDER_ID",
appId: "PASTE_FIREBASE_APP_ID"
```

Do **not** invent these values. Copy them from Firebase.

## 2. Enable Anonymous Authentication

Firebase Console → Authentication → Sign-in method → Anonymous → Enable.

Anonymous Auth gives every visitor a Firebase UID so Firestore rules can accept append-only telemetry without making the whole database public.

## 3. Publish Firestore rules

Firebase Console → Firestore Database → Rules.

Replace/publish with `firestore.rules`.

The rules intentionally:
- allow visitors to write only records tied to their own Firebase UID;
- block client reads of analytics, leads and AI logs;
- block arbitrary writes to all other collections.

## 4. Google Apps Script backend

Create a new Google Apps Script project.

Replace `Code.gs` with:

`apps-script/Code.gs`

If you can edit the manifest, use:

`apps-script/appsscript.json`

### Script Properties

Apps Script → Project Settings → Script properties.

Create:

```text
OPENAI_API_KEY = your secret OpenAI API key
OPENAI_MODEL = gpt-5.6
```

Never place `OPENAI_API_KEY` in GitHub, `index.html`, `app.js`, `morzea-config.js`, or browser code.

## 5. Deploy Apps Script

Deploy → New deployment → Web app.

```text
Execute as: Me
Who has access: Anyone
```

Deploy and copy the URL ending in `/exec`.

In `morzea-config.js`:

```js
agent: {
  enabled: true,
  endpoint: "https://script.google.com/macros/s/........../exec",
  ...
}
```

Use the `/exec` URL, not `/dev`.

## 6. Upload these files to the MORZÉA repository

At repository root:

```text
index.html
styles.css
app.js
morzea-config.js
morzea-firebase.js
morzea-agent.js
firestore.rules
```

Create:

```text
knowledge/morzea-knowledge.json
```

`app.js` is preserved from the current site package. The existing site functions remain intact.

## 7. What will be logged

### MORZEA_Visitors
- Firebase anonymous UID
- session ID
- first/last path
- referrer
- language
- timezone
- device type
- viewport/screen size
- user agent
- UTM campaign fields
- page-view count
- timestamps

### MORZEA_Events
- page view
- product card view
- product gallery selection
- product detail open
- add/remove from bag
- bag open
- checkout preview
- language switch
- hero film restart
- newsletter submit event
- AI open/close/question/answer/error
- 30s / 60s / 180s engagement milestones

### MORZEA_Leads
- newsletter email when voluntarily submitted
- session and language metadata

### MORZEA_AI_Messages / MORZEA_AI_Sessions
- customer questions
- assistant answers
- model/source count
- session metadata

### MORZEA_Errors
- JavaScript errors and unhandled promise rejections

No client-side code collects a visitor's raw IP address.

## 8. Evidence standard for the assistant

Brand-specific facts come from `knowledge/morzea-knowledge.json`, distilled from the MORZÉA narrative/copy system.

For factual questions that may require external evidence, the Apps Script backend enables OpenAI Web Search and instructs GPT-5.6 to prioritize:
1. official Moroccan authorities/regulators;
2. Saudi SFDA for Saudi regulatory matters;
3. UNESCO / FAO / WIPO;
4. peer-reviewed research;
5. academic institutions.

The agent is explicitly forbidden from inventing certificates, product purity, organic status, manufacturing origin, clinical efficacy or historical etymology.

## 9. Test checklist

After deployment:

1. Open MORZÉA in a private/incognito window.
2. Firebase → Authentication → confirm an Anonymous user is created.
3. Firestore → confirm `MORZEA_Visitors` and `MORZEA_Events`.
4. Click a product gallery image → event should appear.
5. Add a product to bag → `add_to_bag`.
6. Submit newsletter → `MORZEA_Leads`.
7. Open concierge and ask:
   - Arabic: `ما هو طقس MORZÉA؟`
   - English: `What makes cosmetic argan oil different from culinary argan oil?`
8. Confirm `MORZEA_AI_Messages` and `MORZEA_AI_Sessions`.
9. Ask a medical-treatment question; the agent should avoid diagnosing and make the cosmetic/medical boundary clear.

## 10. Production hardening

Before paid traffic:
- enable Firebase App Check;
- set OpenAI project spend limits and alerts;
- review Firestore rules in Rules Playground / Emulator;
- add a privacy page explaining analytics and AI conversation logging;
- optionally move the AI backend from Apps Script to Cloud Run / Cloud Functions if traffic becomes high.
