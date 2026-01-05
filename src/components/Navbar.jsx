import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  ListTodo,
  PlusCircle,
  CheckCircle,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { cn } from "../lib/utils";
import { useAuth } from "../context/AuthContext";
import { useUI } from "../context/UIContext";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { isMobileSidebarOpen, closeMobileSidebar } = useUI();

  const handleLogout = async (e) => {
    e?.preventDefault();
    try {
      await logout();
      navigate("/login");
    } catch (e) {
      console.error("Logout failed", e);
    }
  };

  const mainNavItems = [
    { to: "/", icon: ListTodo, label: "My Tasks" },
    { to: "/add", icon: PlusCircle, label: "Add New Task" },
    { to: "/completed", icon: CheckCircle, label: "Completed" },
  ];

  return (
    <>
      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-surface/90 backdrop-blur-xl border-t border-border flex items-center justify-around px-2 z-50 pb-safe shadow-[0_-4px_12px_-1px_rgba(0,0,0,0.05)]">
        {mainNavItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center justify-center space-y-1 transition-all w-1/3 py-1",
                isActive ? "text-primary scale-105" : "text-muted-foreground"
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[10px] font-bold uppercase tracking-tighter truncate w-full text-center px-1">
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-60"
            onClick={closeMobileSidebar}
          />
        )}
      </AnimatePresence>

      {/* Mobile Sidebar (Settings & Logout) */}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="md:hidden fixed left-0 top-0 bottom-0 w-72 bg-surface z-70 shadow-2xl flex flex-col"
          >
            <div className="p-6 border-b border-border flex justify-between items-center bg-primary/5">
              <span className="text-sm font-black uppercase tracking-widest text-primary">
                Account Settings
              </span>
              <button
                onClick={closeMobileSidebar}
                className="p-2 text-muted-foreground hover:text-primary hover:bg-surface-hover rounded-xl transition-colors"
                aria-label="Close settings"
              >
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>

            <div className="flex-1 p-6 flex flex-col">
              <div className="mt-auto pt-6 border-t border-border">
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-4 w-full py-4 px-5 rounded-2xl text-red-500 bg-red-50 hover:bg-red-500 hover:text-white transition-all font-black"
                >
                  <LogOut size={20} strokeWidth={2.5} />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>

            <div className="p-6 bg-muted/20 text-[10px] text-center text-muted-foreground font-medium">
              Personal Task Manager v2.0
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <nav className="hidden md:flex flex-col w-64 h-screen bg-surface border-r border-border sticky top-0 shrink-0 shadow-[4px_0_12px_-1px_rgba(0,0,0,0.02)]">
        <div className="p-8">
          <h1 className="text-xl font-black bg-linear-to-br from-primary to-accent bg-clip-text text-transparent">
            Task Manager
          </h1>
        </div>

        <div className="flex-1 px-4 space-y-2">
          <div className="mb-4 px-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">
            Navigation
          </div>
          {mainNavItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  "flex items-center space-x-3 w-full py-3.5 px-5 rounded-xl transition-all font-bold",
                  isActive
                    ? "text-primary bg-primary/10 border-r-4 border-primary shadow-sm"
                    : "text-muted-foreground hover:text-primary hover:bg-surface-hover"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                  <span className="text-sm">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>

        <div className="p-4 mt-auto space-y-2 pb-8">
          <div className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 mb-2">
            System
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 w-full py-3 px-5 rounded-xl text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-all font-bold"
          >
            <LogOut size={18} />
            <span className="text-sm">Sign Out</span>
          </button>
        </div>
      </nav>
    </>
  );
}
