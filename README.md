# 🎯 Personal Task Manager (v4.0)

<div align="center">

[![React 19](https://img.shields.io/badge/React_19-61dafb?style=for-the-badge&logo=react&logoColor=white)](https://react.dev)
[![Vite 8](https://img.shields.io/badge/Vite_8-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![Tailwind 4](https://img.shields.io/badge/Tailwind_4-38bdf8?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Firebase](https://img.shields.io/badge/Firebase-ffca28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com)
[![PWA](https://img.shields.io/badge/PWA-Enabled-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)
[![Tracking](https://img.shields.io/badge/Tracking-Zero-000000?style=for-the-badge&logo=ghostery&logoColor=white)](#)
[![Security](https://img.shields.io/badge/Security-Highest-red?style=for-the-badge&logo=securityscorecard&logoColor=white)](#)
[![Free of Cost](https://img.shields.io/badge/Free_of_Cost-100%25-brightgreen?style=for-the-badge)](#)

[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)
[![Open Source](https://img.shields.io/badge/Open_Source-%E2%9D%A4-brightgreen?style=for-the-badge&logo=open-source-initiative&logoColor=white)](https://github.com/YashMishra0101/Personal-Task-Manager)
[![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-brightgreen.svg?style=for-the-badge)](https://github.com/YashMishra0101/Personal-Task-Manager/graphs/commit-activity)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-blue.svg?style=for-the-badge)](https://github.com/YashMishra0101/Personal-Task-Manager/pulls)

### 🧑‍💻 Explore the Project • 🐛 Report a Bug • 💡 Request Feature

</div>

---

## 📸 Visual Preview

<div align="center">

| <img src="src/assets/1.png" width="400" alt="Dashboard Overview" /> | <img src="src/assets/2.png" width="400" alt="Security Checks" /> |
| :---: | :---: |
| <img src="src/assets/3.png" width="400" alt="Task Creation" /> | <img src="src/assets/4.png" width="400" alt="Dark Mode Support" /> |
| <img src="src/assets/5.png" width="400" alt="Task Details" /> | <img src="src/assets/6.png" width="400" alt="Deadline Tracking" /> |
| <img src="src/assets/7.png" width="400" alt="Mobile View" /> | <img src="src/assets/8.png" width="400" alt="Session Audit" /> |
| <img src="src/assets/9.png" width="400" alt="PIN Security" /> | <img src="src/assets/10.png" width="400" alt="Profile Settings" /> |
| <img src="src/assets/11.png" width="400" alt="New Feature Preview" /> | <img src="src/assets/12.png" width="400" alt="Final Task Complete" /> |

</div>

---

## 💎 Why This Project?

This is more than just another **To-Do List**. It is a **Production-Ready Task Management Ecosystem** engineered for high performance, **Robust Security** and a **Seamless Offline-First Experience**. It provides **Multiple Premium Features Completely Free of Cost**, while ensuring total **Privacy**, **Security** and **Absolute Data Ownership**.

> **Born from personal necessity** — not just a project, but my **daily driver**. It's a tool I couldn’t find elsewhere, so I built it to solve my own needs and actively use it every day.

---
## ✨ Feature Deep-Dive

### 🧠 Task Management Features

- **📊 Professional Filtering System**
  - **🗂️ All Tasks (Default)** — Clean, ungrouped grid view for a high-level overview.
  - **📅 By Date** — Smart grouping with relative headers (**Today**, **Yesterday**) and full date labels.
- **⏳ Smart Deadline Prioritization** — Automatically surfaces urgent and upcoming task deadlines at the top of your "By Date" view.
- **🕒 Custom Time Picker** — High-precision time selection implementation with full **12-hour AM/PM** support.
- **✅ Subtasks / Checklist** — Break complex tasks into smaller actionable steps with independent progress tracking.
- **🔄 Drag-and-Drop Reordering** — A high-performance manual reordering system to organize your workspace exactly how you want.
- **🚨 Deadline Tracking** — Dynamic visual indicators and relative countdowns for overdue, urgent, and upcoming tasks.
- **📌 Active Tasks Counter** — Real-time persistent overview of your total pending workload.
- **⚡ One-Click Actions** — Engineered for speed: instantly complete, edit, or delete tasks directly from the dashboard.
- **📖 Detailed Task View** — Rich description support with perfectly formatted date and time metadata.
- **📈 Task Progress Tracking** — Granular completion updates (**0–100%**) with support for marking tasks as "Unsuccessful" for comprehensive productivity auditing.
- **📓 Personal Notes** — A dedicated space for random thoughts and ideas with a minimalist editor and instant search.
- **💰 100% Free & No-Cost Setup** — There are no hidden fees, subscriptions, or payment methods required. You own the code, you own the data, and you pay absolutely nothing to keep it running.
- **📱 Install Anywhere** — Optimized PWA support; install on your **PC, Laptop, or Mobile** device for a seamless "Use Everywhere" experience.

## 🛡️ Privacy & Security
Security isn't a feature; it's the foundation.

- **🚫 Zero-Ad & Zero-Tracking**: No tracking, no analytics, no third-party distractions. 100% focused on your data.
- **⚙️ Full Data Sovereignty**: By cloning this repo and setting up your own Firebase instance, you have **100% control** over your infrastructure.
- **🛡️ Multi-Layered Security**: Optimized integration of Firebase Auth + Custom Security Key + Local App PIN Lock.
- **🔐 Dual-Phase Login**: After standard Firebase Authentication, a secondary **Security Key** verifies the database access permission.
- **🔒 App Lock System**: Configurable PIN-lock (4/6/8 digits) with "Session-based" or "Duration-based" timeouts.
  - **🛠️ Full In-App Control**: Once the app is unlocked, you have **full authority** to update, change, or disable your PIN at any time.
  - **🚫 Forbidden Reset Policy**: For maximum security, there is **no "Forgot PIN" option**. Access must be regained manually via the Firebase Console (Owner only).
- **🕵️ Device Audit**: A comprehensive real-time log of every browser and device that has accessed your account, with unique identifiers and session tracking.
- **💰 Spark Plan Optimized**: Engineered to run efficiently on the **Firebase Free (Spark) Tier**, giving you a production-ready system with $0 infrastructure costs.

---

## 🏗️ Technical Highlights

### ⚡ Cutting-Edge Stack
- **React 19 & Vite 8**: Built on the bleeding edge for optimal developer experience and sub-second HMR.
- **Tailwind CSS 4**: Utilizing the latest JIT engine for ultra-lightweight production CSS.
- **Framer Motion**: Purpose-built micro-interactions that make the UI feel alive and responsive.
- **Offline-First (PWA)**: Using Workbox for intelligent caching. The app works flawlessly in a tunnel or on a plane.

### 🧠 Advanced Architecture
- **Persistent Firestore Cache**: Custom implementation of `persistentLocalCache` for instant data access even on cold starts.
- **Atomic Context State**: State management split via dedicated Context Providers (Auth, AppLock, Tasks) to minimize re-renders.
- **Intelligent Deduplication**: Module-level session management to prevent duplicate Firestore writes during React's StrictMode double-mounts.

---

## 🛠️ Installation & Setup

### Prerequisites
- **Node.js** 20+
- **pnpm** (Recommended) or npm

### Setup Steps
1. **Clone the Repo**
   ```bash
   git clone https://github.com/YashMishra0101/Personal-Task-Manager.git
   cd Personal-Task-Manager
   ```

2. **Install Dependencies**
   ```bash
   pnpm install
   ```

3. **Configure Environment**
   Create a `.env` file from the example:
   ```bash
   cp .env.example .env
   ```
   Fill in your Firebase credentials.

### 🛠️ Detailed Firebase Setup

1. **Create a Firebase Project**: 
   - Go to [Firebase Console](https://console.firebase.google.com/).
   - Click "Add Project" and follow the setup wizard.
   - **Plan**: The free **Spark Plan** is totally sufficient for this application.

2. **Enable Authentication**:
   - Navigate to **Build > Authentication**.
   - Enable the **Email/Password** provider.
   - (Optional) Create your primary user account here or use the app's login flow to register if enabled in rules.

3. **Create Firestore Database**:
   - Navigate to **Build > Firestore Database**.
   - Create a database in **Production Mode** (or test mode if you're quick, but production is recommended).
   - Choose a location nearest to you.

4. **Initialize Security Key**:
   - In Firestore, create a collection named `security`.
   - Create a document with the exact ID `key`.
   - Add a field named `securityKey` (String) and set its value (e.g., `MySecretKey123`).

5. **Register Web App**:
   - Go to **Project Settings (⚙️ icon)**.
   - Click the `</>` icon at the bottom to register a Web App.
   - Copy the `firebaseConfig` object values into your `.env` file.

### 🏁 6. Start Developing
   ```bash
   pnpm dev
   ```

---


## 🤝 Contributing

This is a developer-friendly project! We value:
- **Clean Code**: Follow the existing ESLint and Prettier configs.
- **Performance**: Keep the bundle size small and logic efficient.
- **UX**: Ensure every new feature feels premium.


---

## 📄 License & Attribution

Licensed under the **MIT License**.

> 💡 **Note**: While the license allows free use, I appreciate attribution by linking back to this repository in your project's 'About' section.


> "Great things are done by a series of small things brought together."

<div align="center">

### Built by [Yash RK Mishra](https://github.com/YashMishra0101) with AI tools 👨‍💻

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/yash-mishra-356280223/)
[![X](https://img.shields.io/badge/X-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/YashRKMishra1)

**[⭐ Star this repository to show your support!](#)**

</div>
