# ChamaCloud USSD Server

A Node.js USSD handler for ChamaCloud, built for Africa's Talking.

## USSD Menu Flow

```
Welcome to ChamaCloud 🌱
1. My Groups          → Lists your groups with progress %
2. Contribute         → Pick group → Enter amount → Confirm
3. My Savings Balance → Summary of all group savings
4. Join a Group       → Enter Group ID → Confirm
5. My Profile         → Name, phone, email
0. Exit
```

All protected actions require PIN entry (your account password).

---

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Run locally
```bash
npm run dev
```

### 3. Expose locally for testing (use ngrok)
```bash
npx ngrok http 3000
```
Copy the HTTPS URL e.g. `https://abc123.ngrok.io`

---

## Africa's Talking Setup

1. Go to [africastalking.com](https://africastalking.com) and create an account
2. Create a USSD channel — they'll assign you a shortcode e.g. `*384*123#`
3. Set the **Callback URL** to:
   ```
   https://your-server.com/ussd
   ```
4. Make sure your server is publicly accessible (deploy to Render, Railway, or use ngrok for testing)

---

## Deployment (Render)

1. Push this folder to a GitHub repo
2. Create a new **Web Service** on [render.com](https://render.com)
3. Set:
   - **Build command:** `npm install`
   - **Start command:** `npm start`
   - **Environment:** Node

---

## API Authentication

The USSD server authenticates users with their **phone number + PIN** (their ChamaCloud account password) via:
```
POST /api/auth/token/
{ phone_number, password }
```

Tokens are stored per-session in memory. For production, replace the `sessions` object with **Redis**.

---

## Adjustments You May Need

| What | Where in index.js |
|------|-------------------|
| Auth endpoint | `apiPost("/auth/token/", ...)` |
| Profile endpoint | `apiGet("/auth/profile/", ...)` |
| Contributions endpoint | `apiPost("/contributions/", ...)` |
| Join group endpoint | `apiPost("/groups/:id/join/", ...)` |

Check these against your actual API docs at:
`https://chama-cloud-api.onrender.com/api/docs/`