# Test Bank Reviewer

AI-powered test bank review tool with Claude pre-evaluation, human approval workflow, and Google Sheets integration.

## Features

- **Passphrase auth:** `gabriel` = Reviewer mode, `lauren` = Admin mode (24h session)
- **Reviewer view (Gabriel):** One Q&A at a time, progress bar, Claude verdict + confidence, approve/override/skip buttons
- **Admin view (Lauren):** Import Q&A banks, review progress by subject, Claude memory management
- **Claude pre-evaluation:** Background batch queue evaluates all questions via Claude API
- **Per-subject memory:** Stores Claude mistakes → improves future prompts automatically
- **Mock data mode:** Works fully without Google Sheets — load sample mortgage exam questions with one click

## Stack

- **Next.js 14** — App router + API routes
- **Convex** — Realtime database (shiny-bass-900)
- **Anthropic Claude** — AI evaluation (claude-3-5-haiku)
- **Tailwind CSS** — Styling

## Setup

```bash
cp .env.example .env.local
# Add ANTHROPIC_API_KEY

npm install
npx convex dev   # In separate terminal
npm run dev
```

## Google Sheets Integration (TODO)

The app works in mock data mode without Sheets. To enable real sheet import:

1. Create a Google Cloud project
2. Enable the Google Sheets API
3. Create a service account and download JSON credentials
4. Set `GOOGLE_SERVICE_ACCOUNT_JSON` env var to the JSON string
5. Share your Google Sheet with the service account email
6. Set `GOOGLE_SHEET_ID` to your spreadsheet ID

Sheet format expected:
| Question | Correct Answer | Option A | Option B | Option C | Option D |

See `TODO` comments in `src/components/AdminView.tsx` and `src/app/api/evaluate/route.ts`.

## Claude Background Evaluation

Call `POST /api/evaluate` with `{ question, correctAnswer, subject, subjectMemory }` to evaluate a single question.

For production, set up a cron job or Convex action to process the evaluation queue automatically.

## Auth Notes

Passphrases set via env vars:
- `NEXT_PUBLIC_REVIEWER_PASS` (default: gabriel)
- `NEXT_PUBLIC_ADMIN_PASS` (default: lauren)

Session stored in `sessionStorage` (browser tab only — no persistent auth yet).

## TODO
- [ ] Set up Google Sheets service account credentials
- [ ] Add bidirectional sheet sync (write approved verdicts back)
- [ ] Build background Convex action for automatic queue processing
- [ ] Add email notifications when review is complete
- [ ] Export reviewed Q&A to PDF
