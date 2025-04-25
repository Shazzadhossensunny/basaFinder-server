# 🏡 BasaFinder Backend (basafinder-server)

BasaFinder is a smart rental and housing solution connecting **tenants**, **landlords**, and **admins** through a secure and efficient platform. This is the **backend repository**, built with **Node.js**, **Express**, **MongoDB**, and **TypeScript**.

## 🔗 Vercel Live Link

[https://basafinder-server-next.vercel.app/](https://basafinder-server-next.vercel.app/)

## 🔗 GitHub Repository

[https://github.com/Shazzadhossensunny/basaFinder-server](https://github.com/Shazzadhossensunny/basaFinder-server)

---

## ⚙️ Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/Shazzadhossensunny/basaFinder-server.git
cd basaFinder-server
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Environment Variables

Create a `.env` file in the root directory and copy the following:

```
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/basaFinderDB
BCRYPT_SALT_ROUNDS=10
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
JWT_ACCESS_EXPIRES_IN=15d
JWT_REFRESH_EXPIRES_IN=365d

SMTP_HOST=smtp.zoho.com
SMTP_PORT=465
EMAIL_SECURE=true
SMTP_USER=your_email@zohomail.com
SMTP_PASS=your_password
EMAIL_FROM=Your Name <your_email@zohomail.com>

SP_ENDPOINT=https://sandbox.shurjopayment.com/api
SP_USERNAME=sp_sandbox
SP_PASSWORD=your_sandbox_password
SP_PREFIX=NOK
SP_RETURN_URL=https://yourdomain.com/api/payments/callback
SP_CANCEL_URL=https://yourdomain.com/api/payments/cancel
```

### 4. Run the Server

#### In Development:

```bash
npm run start:dev
```

#### In Production:

```bash
npm run build
npm run start:prod
```

---

## 🧰 Tech Stack

- **Node.js**
- **Express.js**
- **MongoDB** with **Mongoose**
- **TypeScript**
- **Zod** for schema validation
- **JWT** for Authentication
- **Bcrypt** for password hashing
- **Nodemailer** for email notifications
- **ShurjoPay** Integration for payments

## ✅ Features

### 🔐 Authentication & Security

- Role-based auth with JWT
- Password hashing using Bcrypt
- Email verification (optional)

### 👤 User Roles

- **Admin**
- **Landlord**
- **Tenant**

### 🏘️ Listings (Rental Houses)

- Landlords can post, update, and delete listings
- Admins can moderate listings

### 📩 Rental Requests

- Tenants can send rental requests to landlords
- Landlords can approve/reject and share contact

### 💳 Payment System

- Integrated with **SurjoPay**
- Payment initiated after landlord approval

### 🧰 Utilities & Middleware

- `apiError` for custom error handling
- `globalError` for centralized error handling
- `auth` middleware for protected routes
- `queryBuilder` utility for filtering and pagination
- Zod-based validation for all inputs

---

## 🧪 Testing & Linting

```bash
npm run lint         # Check code quality
npm run lint:fix     # Fix lint issues
npm run prettier     # Format files with Prettier
```

---

## ✉️ Contact

Maintained by **Shazzad Hossen Sunny**
Email: shazzadhossensunny@gmail.com

---
