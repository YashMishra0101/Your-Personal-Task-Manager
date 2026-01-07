import React from "react";
import Navbar from "./Navbar";
import ThemeToggle from "./ThemeToggle";
import InstallPrompt from "./InstallPrompt";
import OfflineIndicator from "./OfflineIndicator";
import { useAuth } from "../context/AuthContext";
import { useUI } from "../context/UIContext";
import { useNavigate } from "react-router-dom";
import { Menu } from "lucide-react";

export default function Layout({ children, title }) {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { openMobileSidebar } = useUI();

  return (
    <div className="min-h-screen bg-background text-primary transition-colors duration-300 font-sans flex md:flex-row">
      {/* Sidebar only renders here on desktop due to CSS in Navbar, but Navbar is fixed bottom on mobile */}
      <Navbar />

      <div className="flex-1 w-full min-h-screen bg-background md:bg-surface/50 flex flex-col relative pb-24 md:pb-0 overflow-hidden">
        {/* Header */}
        <header className="px-4 py-3 md:px-6 md:py-4 flex items-center justify-between bg-surface/80 backdrop-blur-md sticky top-0 z-40 border-b border-border shadow-sm h-16">
          {/* Hamburger Menu (Mobile) */}
          <button
            onClick={openMobileSidebar}
            className="md:hidden p-2 -ml-2 mr-2 text-primary/80 hover:text-primary hover:bg-surface-hover rounded-xl transition-colors"
            aria-label="Open menu"
          >
            <Menu size={22} strokeWidth={2.5} />
          </button>

          {/* Main Heading - Centered on Mobile (adjusted for button presence) */}
          <div className="flex-1 min-w-0 flex items-center">
            <h1 className="text-lg sm:text-xl md:text-2xl font-black bg-linear-to-r from-primary to-accent bg-clip-text text-transparent uppercase tracking-wider truncate">
              {title || "Task Manager"}
            </h1>
          </div>

          <div className="flex items-center space-x-3 absolute right-2 md:static font-semibold">
            <OfflineIndicator />
            <ThemeToggle />
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 px-4 md:px-8 py-6 overflow-y-auto scrollbar-hide max-w-7xl mx-auto w-full">
          {children}
        </main>

        {/* PWA Install Prompt */}
        <InstallPrompt />
      </div>
    </div>
  );
}
