# Residex - Residential Management Platform

A modern web platform designed to streamline the management of residential buildings and collective properties in Morocco. Residex enables property managers (syndics) to efficiently handle charges, payments, expenses, documents, and communication with property owners and tenants.

## 🎯 Project Goal

Residex aims to modernize and simplify residential building management by replacing informal tools (WhatsApp, Excel, paper documents) with a transparent, traceable, bilingual (FR/AR), and accessible online solution.

## 🧑‍💼 User Types & Roles

| Role | Description |
|------|-------------|
| 🛠️ **Syndic (Admin)** | Full management access: residents, payments, expenses, documents, notifications |
| 👤 **Resident (User)** | View payments, debts, announcements, download documents |

*Future: External management company role*

## ✅ Core Features

### A. 🔐 Authentication
- Syndic login system
- JWT security
- Admin-only registration

### B. 👥 Resident Management
- Add/Edit/Delete residents
- Link residents to buildings/apartments
- Track: name, apt number, phone, email, status (owner/tenant)

### C. 💰 Monthly Charges Tracking
- Set global monthly amounts
- Automatic resident allocation
- Monthly charge generation

### D. ✅ Payment Management
- Mark residents as paid/overdue
- Payment history by month
- Payment status in resident profiles

### E. 💸 Expense Management
- Add expenses with:
  - Amount & description
  - Categories (cleaning, electricity, repairs...)
  - Date & receipt uploads
- Monthly/annual expense views

### F. 📊 Financial Dashboard
- Revenue tracking (total payments)
- Total expenses
- Current balance
- Outstanding payments list

### G. 📢 Notifications & Announcements
- Broadcast messages to all residents
- Payment reminders, upcoming work notifications
- Email/WhatsApp integration (Phase 2)

### H. 📄 Document Archive
- Upload/Download:
  - General assembly minutes
  - Contracts, internal regulations, quotes
- Organized by categories

### I. 🏢 Multi-Residence Support (Future)
- Manage multiple buildings
- Separate residents, payments, expenses per building

## 🔁 Supported Operations

| Operation | User | Technical Details |
|-----------|------|-------------------|
| Login | Syndic | Email + password authentication |
| Add/Edit Resident | Syndic | MongoDB entry creation |
| Create Monthly Charge | Syndic | Bulk assignment |
| Mark Payment | Syndic | Status update |
| Add Expense | Syndic | File upload + data storage |
| View Dashboard | Syndic | MongoDB aggregation |
| Download Documents | All | Cloudinary file links |
| Send Notification | Syndic | Email/WhatsApp API |
| View Payment Status | Resident | Read-only access |
| View Announcements | Resident | Read-only access |

## 📱 Interface Modules

### For Syndics:
- Main dashboard (balance, charts)
- Resident management
- Payment tracking
- Expenses and receipts
- Charge creation
- Message broadcasting
- Document uploads

### For Residents:
- Personal login
- Payment history
- Notifications
- Document access

## 🛠️ Tech Stack

### Frontend (Client)
- **React.js** - User interface
- **CSS3** - Styling
- **Axios** - API communication

### Backend (Server)
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **Cloudinary** - File storage

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/salahe03/residex.git
   cd residex
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install
   
   # Install client dependencies
   cd client
   npm install
   
   # Install server dependencies
   cd ../server
   npm install
   ```

3. **Environment Setup**
   ```bash
   # In server directory, create .env file
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   CLOUDINARY_CLOUD_NAME=your_cloudinary_name
   CLOUDINARY_API_KEY=your_cloudinary_key
   CLOUDINARY_API_SECRET=your_cloudinary_secret
   ```

4. **Run the application**
   ```bash
   # Start the backend server (from server directory)
   npm start
   
   # Start the frontend (from client directory)
   npm start
   ```

The application will run on:
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:5000`

## 📝 Project Status

🚧 **In Development** - Core features being implemented

## 🤝 Contributing

This is a personal learning project. Feedback and suggestions are welcome!

## 📄 License

This project is for educational purposes.
