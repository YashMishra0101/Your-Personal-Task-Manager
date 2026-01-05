# Task Manager

A modern task management application built with React and Firebase. This app helps you organize your daily tasks with an intuitive interface, complete with dark mode support and enhanced security features.

![Task Manager](https://img.shields.io/badge/Status-Production%20Ready-green)
![React](https://img.shields.io/badge/React-18.3-blue)
![Firebase](https://img.shields.io/badge/Firebase-12.7-orange)

## Preview

![Login Page](C:/Users/yashr/.gemini/antigravity/brain/ff5d4323-62e6-489e-8c00-455606997fe2/login_page_1767645060804.png)

## Features

### Task Management

- Create, edit, and delete tasks with ease
- Set deadlines with date and time pickers
- Mark tasks as complete and track your progress
- View tasks organized by "Created Today" and "Remaining"
- See your completed tasks in a separate view
- Quick statistics showing pending and completed task counts

### Security & Authentication

- Secure email/password authentication powered by Firebase
- Password reset functionality via email
- Protected routes ensuring only authenticated users can access tasks

### User Experience

- **Dark/Light Mode**: Automatically detects your system preference, with a manual toggle available
- **Responsive Design**: Works seamlessly on mobile, tablet, and desktop
- **Smooth Animations**: Powered by Framer Motion for a polished feel
- **Toast Notifications**: Get instant feedback for all your actions
- **Confirmation Dialogs**: Prevents accidental deletions
- **Accessibility**: Built with ARIA labels, keyboard navigation, and semantic HTML

### Progressive Web App (PWA)

- Install the app on your device without visiting an app store
- Works offline after initial load
- Fast performance with cached assets
- Full-screen standalone mode (no browser UI)
- Mobile-optimized with bottom navigation for easy thumb access
- Automatic updates via service worker

## Getting Started

### What You'll Need

- Node.js version 16 or higher
- pnpm package manager (or npm as an alternative)
- A Firebase account (free tier works fine)

### Setup Instructions

**1. Clone and Install**

```bash
git clone <repository-url>
cd Task Manager
pnpm install
```

> **Note:** This project uses pnpm. If you don't have it installed, run `npm install -g pnpm` or use `npm install` as an alternative.

**2. Firebase Configuration**

Head over to the [Firebase Console](https://console.firebase.google.com) and:

- Create a new project
- Enable Email/Password authentication in the Authentication section
- Create a Firestore database
- Copy your Firebase configuration details

**3. Environment Variables**

Create a `.env` file in the root directory with your Firebase credentials:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

**4. Run the App**

```bash
pnpm run dev
```

Open your browser and navigate to `http://localhost:5173`

## Project Structure

```
Task Manager/
├── public/              # Static assets and PWA files
├── src/
│   ├── assets/         # Images and icons
│   ├── components/     # Reusable React components
│   │   ├── ConfirmDialog.jsx
│   │   ├── Layout.jsx
│   │   ├── Navbar.jsx
│   │   ├── ProtectedRoute.jsx
│   │   ├── TaskCard.jsx
│   │   └── ThemeToggle.jsx
│   ├── context/        # React Context for state management
│   │   ├── AuthContext.jsx
│   │   └── TaskContext.jsx
│   ├── lib/            # Utility functions and Firebase config
│   │   ├── device.js
│   │   ├── firebase.js
│   │   ├── timeUtils.js
│   │   └── utils.js
│   ├── pages/          # Page components
│   │   ├── AddTask.jsx
│   │   ├── Completed.jsx
│   │   ├── EditTask.jsx
│   │   ├── ForgotPassword.jsx
│   │   ├── Home.jsx
│   │   ├── Login.jsx
│   │   ├── NotFound.jsx
│   │   └── Signup.jsx
│   ├── App.jsx         # Main app with routing
│   ├── main.jsx        # Entry point
│   └── index.css       # Global styles
├── .env                # Your Firebase credentials (never commit this!)
├── .gitignore
├── package.json
└── README.md
```

## Security Features

### Security Best Practices

The app follows several security best practices:

- Environment variables are gitignored to prevent credential leaks
- Firebase Security Rules should be configured (see deployment section)
- All forms include input validation
- Password requirements enforce a minimum of 6 characters
- Error messages are designed to not expose sensitive information

## Theme System

The app includes a sophisticated theme system with two modes:

- **Light Theme**: Clean design with a fresh green color palette
- **Dark Theme**: Professional black color scheme that's easy on the eyes

The theme automatically matches your operating system preference, but you can manually toggle between light and dark mode using the button in the header.

## Tech Stack

- **React 18** - Frontend framework
- **Vite 7** - Build tool and dev server
- **React Router DOM 7** - Client-side routing
- **Firebase** - Authentication and Firestore database
- **Tailwind CSS 4** - Utility-first styling
- **Framer Motion** - Animation library
- **Lucide React** - Icon library
- **Sonner** - Toast notifications
- **date-fns** - Date formatting and manipulation
- **vite-plugin-pwa** - Progressive Web App support with Workbox
- **uuid** - Unique device ID generation

## Database Structure

The app uses two main Firestore collections:

### Users Collection

```javascript
{
  uid: "user_id",
  email: "user@example.com",
  createdAt: "2024-01-01T00:00:00.000Z"
}
```

### Tasks Collection

```javascript
{
  id: "task_id",
  title: "Task title",
  deadline: "2024-01-01T00:00:00.000Z", // optional
  completed: false,
  createdAt: "2024-01-01T00:00:00.000Z"
}
```

## Deployment

### Building for Production

```bash
pnpm run build
```

This creates an optimized production build in the `dist/` directory.

### Deploying to Vercel

Vercel is the recommended deployment platform:

1. Push your code to a GitHub repository
2. Import the project in your Vercel dashboard
3. Add your environment variables in the Vercel project settings
4. Click deploy and you're done!

### Installing as a PWA

Once deployed, users can install the app on their devices:

**On Desktop (Chrome/Edge):**

1. Visit your deployed URL
2. Look for the install icon (⊕) in the address bar
3. Click it, or go to the browser menu and select "Install Task Manager"
4. The app will open in its own window without browser UI

**On Mobile (Android Chrome):**

1. Open the deployed URL in Chrome
2. Tap "Add to Home Screen" when prompted
3. If you don't see the prompt, tap the menu and select "Add to Home Screen"
4. The app icon will appear on your home screen
5. Tap it to open the app in full-screen mode

**Benefits of PWA Installation:**

- No app store required
- Works offline after first visit
- Faster loading times
- Native app-like experience

### Firebase Security Rules

Don't forget to set up Firestore security rules in your Firebase console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own user document
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }

    // Tasks can be read/written by any authenticated user
    // You may want to add userId field to tasks and restrict access
    match /tasks/{taskId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Contributing

Contributions are welcome! If you'd like to improve this project, feel free to fork the repository and submit a pull request.

## License

This project is open source and available under the MIT License.

## Future Enhancements

Here are some features that could be added in the future:

- [ ] Task categories and custom tags
- [ ] Search and filter functionality
- [ ] Priority levels for tasks
- [ ] Recurring tasks
- [ ] Task sharing and collaboration
- [ ] Email notifications for upcoming deadlines
- [ ] Data export and import functionality

## Support

If you run into any issues or have questions, please open an issue in the repository.

---

Built with React and Firebase
