# PharmaPro — Pharmacy Management System

![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white) ![Express](https://img.shields.io/badge/Express-4-000000?logo=express)

> Full-stack pharmacy system: inventory, point of sale, purchase orders, suppliers, customers, staff and reports.

## Overview
A production project built and deployed by **Mahmoud Hasan**. This repository holds the source code only. The client's secrets,
databases, uploaded files and personal data are not included; where the code needs them, they are replaced with placeholders.

**Tech stack:** Node.js 18+ · Express · JWT · JSON store · Vanilla JS

## Features
- REST API (Express) with JWT authentication, staff roles and bcrypt-hashed passwords
- Security middleware: Helmet, rate limiting, CORS, one central error handler
- Medication stock and stock movements, with alerts for low stock and near expiry
- Point of sale with PDF invoices (PDFKit), purchase orders, suppliers
- Customers, staff, pharmacy settings, dashboard statistics
- Second, static front-end (`dashboard/`) with inventory, sales, reports and AI assistant pages

## Project structure
```
server/src/server.js        entry point
server/src/routes/          REST routes
server/src/controllers/     business logic
server/src/middleware/      auth, upload, errors
server/src/db/jsonStore.js  file-based data store
server/src/public/          web client
dashboard/                  static dashboard UI
```

## Getting started
```bash
cd server
cp .env.example .env   # set JWT secret and demo credentials
npm install
npm start              # http://localhost:3000
```

## Security & privacy
- No credentials in the repository. API keys, passwords and database settings are placeholders (`CHANGE_ME`, `YOUR_…`, `your_db_password`).
- Runtime data (customers, messages, appointments, logs, uploads) is left out.
- Personal names, phone numbers and addresses in the default content are replaced with sample data (e.g. Max Mustermann, +49 151 00000000, Musterstraße 1).

## Author
**Mahmoud Hasan** · [GitHub](https://github.com/MahmoudHasan2)
