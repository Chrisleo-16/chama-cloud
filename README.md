# ☁️ Chama-Cloud

**Money in Motion Hackathon Submission**

Chama-Cloud is a transparent, two-sided FinTech marketplace designed to revolutionize how investment groups (Chamas) manage funds and procure bulk goods securely using M-Pesa and Cryptographic QR Vouchers.

---

## 📖 About The Project

### The Problem
Traditional Chamas (investment groups) struggle with transparent fund management and secure physical procurement. When a Chama raises money to buy bulk goods from a wholesaler, the process relies on manual cash handling, is highly prone to fraud, and lacks a verified digital trail connecting the funds raised to the inventory dispensed.

### The Solution
Chama-Cloud bridges the gap between digital savings and physical fulfillment. 
* **For Merchants:** Group members can seamlessly contribute to their specific Chama goals via automated **M-Pesa STK Pushes**. 
* **The Magic:** Once a Chama's target goal hits 100%, the platform automatically generates a secure, UUID-backed **QR-code voucher**. 
* **For Wholesalers:** Vetted wholesalers use our dedicated dashboard to scan these merchant vouchers in-store, instantly verifying the funds and safely dispensing the exact goods without cash ever changing hands.

---

## 🚀 Live Demo & Links

* **Live Web App (Frontend):** `https://chama-cloud.vercel.app/`
* **Live API (Backend):** `https://chama-cloud-api.onrender.com`
* **Video Pitch & Demo:** `https://drive.google.com/file/d/1njufDrRzk_M1g_-l8qLR58QeAie5GdUn/view?usp=sharing`
---

## 🔑 Test Accounts

To fully experience our multi-role routing and authorization system, please use the following credentials on the live site:

### 1. The Admin (Superuser)
* **Phone:** `0711111111`
* **Password:** `password123`
* **Access:** Navigate to `https://chama-cloud-api.onrender.com/admin/` to verify Wholesaler KYC documents.

### 2. The Wholesaler
* **Phone:** `0721211010`
* **Password:** `Muganda_001`
* **Access:** Logs into the main app and is routed to the Wholesaler Dashboard to view pending Chama pipelines, the voucher ledger, and access the QR Scanner.

### 3. The Merchant (Chama Member)
* **Phone:** `0745366650`
* **Password:** `Muganda_001`
* **Access:** Logs into the main app to view groups, make live STK Push contributions, and view their generated QR claim vouchers.

---

## 📸 Screenshots



| Merchant Dashboard | M-Pesa Integration | Wholesaler QR Scanner |
| :---: | :---: | :---: |
| ![Merchant View](assets/MerchantView.jpg) | ![M-Pesa Prompt](assets/M-Pesa.jpg) | ![QR Scanner](assets/QRScan.jpg) |

---

## ✨ Key Features

* **Role-Based Routing:** Custom JWT authentication instantly routes Admins, Wholesalers, and Merchants to their distinct dashboards upon login.
* **Automated Payments:** Live integration with the Safaricom Daraja API (M-Pesa Express/STK Push).
* **Automated Reconciliation:** M-Pesa Callback webhooks instantly update group funding progress in real-time. No manual data entry.
* **Secure Fulfillment:** Cryptographic UUID-based QR Code generation triggers the second a Chama hits 100% funding.
* **In-App Scanner:** Wholesalers can use their device camera to scan and mark orders as claimed, preventing double-dipping fraud.
* **Wholesaler KYC:** Built-in verification toggles to ensure Chamas only deal with legally vetted, legitimate businesses.

---

## 🛠️ Built With (Tech Stack)

**Frontend:**
* React.js
* TailwindCSS
* React Router DOM
* QR Code libraries (`qrcode.react` / `html5-qrcode`)
* Hosted on Vercel

**Backend:**
* Python & Django
* Django REST Framework (DRF)
* SimpleJWT (Authentication)
* PostgreSQL (Hosted on Neon)
* Hosted on Render

**External APIs & Tools:**
* Safaricom Daraja API (B2C & M-Pesa Express)
* Swagger/OpenAPI (API Documentation)

---

## 💻 Local Setup & Installation

Follow these steps to run the complete environment on your local machine.

### Prerequisites
* Python 3.12+
* Node.js & npm
* PostgreSQL

### 1. Backend Setup (Django)

```bash
# Clone the repository
git clone [Insert Repository Link]
cd chama-cloud/backend

# Create and activate a virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows use: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

```
#### Environment Variables (`.env`)
Create a `.env` file in the root of the `backend` directory and add the following required variables:

```env
# --- .env.example ---
SECRET_KEY=your_django_secret_key_here
DEBUG=True
DATABASE_URL=postgres://user:password@host:port/dbname

# Safaricom Daraja API Credentials (Sandbox)
MPESA_CONSUMER_KEY=your_daraja_consumer_key
MPESA_CONSUMER_SECRET=your_daraja_consumer_secret
MPESA_SHORTCODE=174379
MPESA_PASSKEY=your_daraja_passkey
```

#### Run the Server
```bash
# Apply database migrations
python manage.py migrate

# Create a local superuser
python manage.py createsuperuser

# Start the development server
python manage.py runserver
```
#### 2. Frontend Setup(React)
```bash
cd chama-cloud/frontend

# Install dependencies
npm install

# Start the React development server
npm start
```
#### 👥 Team Collaborators

Roney Baraka - Backend Architecture

Chrisben Evans - Frontend Development 

Vivian Chebii- UI/UX

Joshua Gichuki - QA/Testing
 
Victor Mongare - Backend Architecture

