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
- **📱 Install Anywhere (Progressive Web App)** — Engineered with PWA support, allowing native-like installation. 
  - **Mobile:** Open the hosted link in your browser, tap the browser menu, and select "**Add to Home screen**".
  - **Desktop/Laptop:** Click the **Install** icon located directly inside the browser's URL address bar.
  - > **⚠️ Browser Compatibility Note:** It is highly recommended to use **Google Chrome** for installation. Some browsers (like Brave) may occasionally block PWA prompts or hide the install buttons on both mobile and desktop platforms.

## 🛡️ Privacy & Security
Security isn't a feature; it's the foundation.

- **🚫 Zero-Ad & Zero-Tracking**: No tracking, no analytics, no third-party distractions. 100% focused on your data.
- **⚙️ Full Data Sovereignty**: By cloning this repo and setting up your own Firebase instance, you have **100% control** over your infrastructure.
- **🛡️ Multi-Layered Security**: Optimized integration of Firebase Auth + Custom Security Key + Local App PIN Lock.
- **🔐 Dual-Phase Login**: After standard Firebase Authentication, a secondary **Security Key** verifies the database access permission.
- **🔒 App Lock System**: Configurable PIN-lock (4/6/8 digits) with "Session-based" or "Duration-based" timeouts.
  - **🛠️ Full In-App Control**: Once the app is unlocked, you have **full authority** to update, change, or disable your PIN at any time.
  - **🔑 Secure Reset Policy**: User can reset PIN using both password and security key simultaneously. This prevents unauthorized users from altering the lock without full credentials.
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
   - In the Firebase console navigation menu, click **Build** to open the dropdown.
   - Click on **Authentication**.
   - **Create Your Account**: You have to create your login email and password directly inside the Firebase Authentication console. For security reasons, the app only has a "Login" page and does not have a "Create Account" page. You will use these Firebase credentials to log into your Task Manager.

3. **Create Firestore Database**:
   - In the navigation menu, click **Build** to open the dropdown.
   - Click on **Firestore Database**.
   - Create a database in **Production Mode** (or test mode if you're quick, but production is recommended).
   - Choose a location nearest to you.

4. **Configure Firestore Database Rules**:
   To keep your database safe from public attackers while still allowing your app to work, you need to set up rules that only grant access to logged-in users.
   - In the Firebase console navigation menu, click **Build** to open the dropdown.
   - Click on **Firestore Database**.
   - Click on the **Rules** tab.
   - By default, the code editor will probably say `false`. Replace whatever is there with this exact code:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if request.auth != null;
       }
     }
   }
   ```
   > [!TIP]
   > **What does this do?** It tells Firebase to completely block anyone trying to read or delete your database from the internet — *unless* they are currently logged into an account you created!

5. **Initialize Security Key**:
   - In Firestore, create a collection named `security`.
   - Create a document with the exact ID `key`.
   - Add a field named `securityKey` (String) and set its value (e.g., `8175BSPA@&+?ctje`).

6. **Register Web App**:
   - Go to **Project Settings (⚙️ icon)**.
   - Click the `</>` icon at the bottom to register a Web App.
   - Rename the provided `.env.example` file in your root folder to `.env`. This `.env` file is where you will add your credentials.
   - You have to replace the placeholder values shown below with the actual `firebaseConfig` keys generated by the Firebase Console:

   ```env
   # Firebase Configuration
   # Replace these with your own project configuration from the Firebase Console
   VITE_FIREBASE_API_KEY=your_api_key_here
   VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

### 🏁 7. Start Developing
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
