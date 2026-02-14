# ColdFlow - Outreach CRM

A professional cold email tracking CRM that works with n8n workflows.

## Features

- **Dashboard**: Track sent emails, opens, clicks, and replies
- **Sender Accounts**: Monitor your 20 Zoho email accounts
- **Activity Feed**: Real-time tracking of all email events
- **Analytics**: View performance trends
- **n8n Integration**: Full integration with your automation workflows

## Deployment on Vercel

### Option 1: One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/cold-email-crm)

### Option 2: Manual Deploy

1. Push this repo to your GitHub account
2. Go to [vercel.com](https://vercel.com) and sign in
3. Click "Add New Project"
4. Import your GitHub repo
5. Click "Deploy"
6. Copy your production URL (e.g., `https://your-project.vercel.app`)

## n8n Setup

After deploying, update your n8n workflows:

1. Open `n8n_cold_outreach_workflow.json` in n8n
2. Replace `YOUR_CRM_URL` with your Vercel URL
3. Update account emails and passwords
4. Set up Zoho SMTP credentials

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/track/activity` | POST | Track sent, opened, clicked, replied |
| `/api/accounts` | GET | Get all sender accounts |
| `/api/contacts` | GET | Get all leads |

### Track Activity Example

```bash
curl -X POST https://your-crm.vercel.app/api/track/activity \
  -H "Content-Type: application/json" \
  -d '{
    "action": "sent",
    "from": "outreach1@yourdomain.com",
    "to": "lead@company.com",
    "subject": "Quick idea for Company",
    "is_warmup": false
  }'
```

## Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## n8n Workflow Files

- `n8n_cold_outreach_workflow.json` - Import for cold email sending
- `n8n_warmup_workflow.json` - Import for background warmup

## Tech Stack

- Next.js 14
- TypeScript
- Recharts
- localStorage (client-side data)

## License

MIT
