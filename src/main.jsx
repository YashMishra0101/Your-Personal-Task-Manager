import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";
import { TaskProvider } from "./context/TaskContext";
import { NoteProvider } from "./context/NoteContext";
import { AuthProvider } from "./context/AuthContext";
import { UIProvider } from "./context/UIContext";
import { AppLockProvider } from "./context/AppLockContext";
import { Toaster } from "sonner";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AppLockProvider>
          <NoteProvider>
            <TaskProvider>
              <UIProvider>
                {/* Global UI State Provider */}
                <App />
                <Toaster
                  position="top-center"
                  richColors
                  closeButton
                  toastOptions={{
                    style: {
                      borderRadius: "12px",
                    },
                  }}
                />
              </UIProvider>
            </TaskProvider>
          </NoteProvider>
        </AppLockProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
