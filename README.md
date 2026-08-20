# Hayat Dubai Real Estate AI

Hayat Luxury Properties' public Dubai real-estate knowledge browser. It combines a controlled 52-section knowledge base, indexed official-document passages, detailed deterministic search, and an optional evidence-bound Gemini answer layer.

## What the site contains

- 2,158 controlled knowledge entries across 52 sections
- Official-document passage retrieval with permanent Source IDs
- Detailed figures, requirements, procedures, risks, and related controls
- Hayat AI answers cross-matched against retrieved knowledge and document evidence
- Hayat Luxury Properties branding, offices, WhatsApp, phone, and email contacts
- English and Arabic question handling in the AI response

## AI safety design

The Gemini API key is used only by the server route at `app/api/ask/route.ts`; it is never sent to browser code. The client first retrieves the strongest matching knowledge entries and official-document passages. Gemini receives that evidence and is instructed to answer only from it, preserve permanent Source IDs, distinguish official rules from market practice, and disclose missing or conflicting evidence.

If Gemini is not configured, temporarily unavailable, or the free allowance is exhausted, the controlled search and official-document results continue to work normally.

## Local setup

Requirements: Node.js 22.13 or newer.

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Add a Google AI Studio key to `.env.local`:

```text
GEMINI_API_KEY=your_key
GEMINI_MODEL=gemini-2.5-flash
```

Never commit `.env.local` or a real API key.

## Validation

```bash
npm run lint
npm run build
```

## Deployment

This is a full-stack application because `/api/ask` securely calls Gemini on the server. It must be deployed to a server-capable host; plain GitHub Pages cannot protect the API key or execute the route. GitHub stores and versions the source, while the hosting platform stores `GEMINI_API_KEY` as an encrypted environment secret.

Current Sites configuration is preserved in `.openai/hosting.json`.

## Ownership and contact

Hayat Luxury Properties  
Developed by Osama Bakir  
Phone: +971 58 506 6899  
Email: ossama@hayatluxuryproperties.com

This browser provides controlled information and does not replace transaction-specific legal advice or live authority verification.
