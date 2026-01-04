import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  ListTodo,
  PlusCircle,
  CheckCircle,
  LogOut,
  Smartphone,
} from "lucide-react";
import { cn } from "../lib/utils";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async (e) => {
    e.preventDefault();
    try {
      await logout();
      navigate("/login");
    } catch (e) {
      console.error("Logout failed", e);
    }
  };

  const navItems = [
    { to: "/", icon: ListTodo, label: "Tasks" },
    { to: "/add", icon: PlusCircle, label: "Add" },
    { to: "/completed", icon: CheckCircle, label: "Done" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 md:static md:w-64 md:h-screen bg-surface border-t md:border-t-0 md:border-r border-border pb-safe pt-2 md:pt-6 px-6 md:px-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] md:shadow-none z-50 shrink-0">
      <div className="max-w-md md:max-w-none mx-auto md:mx-0 flex md:flex-col justify-between md:justify-start items-center md:items-stretch h-16 md:h-full">
        <div className="flex md:flex-col justify-between md:justify-start items-center md:items-stretch w-full md:space-y-2 md:flex-1">
          {/* Helper for desktop logo area if needed, or just spacers */}
          <div className="hidden md:block mb-8 px-4">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Menu
            </span>
          </div>

          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  "flex flex-col md:flex-row items-center justify-center md:justify-start space-y-1 md:space-y-0 md:space-x-3 md:w-full md:py-3 md:px-4 rounded-xl transition-all duration-200",
                  isActive
                    ? "text-primary md:bg-primary/10"
                    : "text-muted-foreground hover:text-primary hover:bg-surface-hover"
                )
              }
            >
              <Icon size={24} strokeWidth={2.5} className="md:w-5 md:h-5" />
              <span className="text-xs md:text-sm font-medium">{label}</span>
            </NavLink>
          ))}

          {/* Mobile Logout Button (Visible only on mobile) */}
          <button
            onClick={handleLogout}
            className="md:hidden flex flex-col items-center justify-center space-y-1 text-muted-foreground hover:text-red-500 transition-colors"
          >
            <LogOut size={24} strokeWidth={2.5} />
            <span className="text-xs font-medium">Logout</span>
          </button>
        </div>

        {/* Desktop - Settings and Logout Section (Bottom) */}
        <div className="hidden md:block mt-auto pb-6 space-y-2">
          <NavLink
            to="/devices"
            className={({ isActive }) =>
              cn(
                "flex items-center space-x-3 w-full py-3 px-4 rounded-xl transition-colors",
                isActive
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-primary hover:bg-surface-hover"
              )
            }
          >
            <Smartphone size={20} />
            <span className="text-sm font-medium">Devices</span>
          </NavLink>

          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 w-full py-3 px-4 rounded-xl text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
          >
            <LogOut size={20} />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
