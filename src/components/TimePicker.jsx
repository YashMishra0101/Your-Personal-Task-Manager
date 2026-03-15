import React, { useState, useEffect, useRef } from "react";
import { Clock, Check, X } from "lucide-react";
import { cn } from "../lib/utils";

export default function TimePicker({ value, onChange, placeholder = "Select time", onClear }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const [hours, setHours] = useState("12");
  const [minutes, setMinutes] = useState("00");
  const [period, setPeriod] = useState("AM");

  useEffect(() => {
    if (value) {
      const [h, m] = value.split(":");
      const hrRef = parseInt(h, 10);
      setMinutes(m || "00");
      if (hrRef >= 12) {
        setPeriod("PM");
        setHours(hrRef > 12 ? String(hrRef - 12).padStart(2, "0") : "12");
      } else {
        setPeriod("AM");
        setHours(hrRef === 0 ? "12" : String(hrRef).padStart(2, "0"));
      }
    } else {
      const now = new Date();
      let hr = now.getHours();
      const min = now.getMinutes();
      setPeriod(hr >= 12 ? "PM" : "AM");
      hr = hr % 12 || 12;
      setHours(String(hr).padStart(2, "0"));
      setMinutes(String(min).padStart(2, "0"));
    }
  }, [value, isOpen]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSet = () => {
    let finalHour = parseInt(hours, 10);
    if (period === "PM" && finalHour !== 12) {
      finalHour += 12;
    } else if (period === "AM" && finalHour === 12) {
      finalHour = 0;
    }
    const finalTime = `${String(finalHour).padStart(2, "0")}:${minutes}`;
    onChange(finalTime);
    setIsOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    if (onClear) onClear();
    setIsOpen(false);
  };

  const formatDisplayTime = () => {
    if (!value) return "";
    const [h, m] = value.split(":");
    let hr = parseInt(h, 10);
    const p = hr >= 12 ? "PM" : "AM";
    hr = hr % 12 || 12;
    return `${String(hr).padStart(2, "0")}:${m} ${p}`;
  };

  const hoursList = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));
  const minutesList = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div 
        className={cn(
          "relative flex items-center w-full p-3 rounded-xl bg-muted/50 border transition-all cursor-pointer h-full min-h-[50px]",
          isOpen ? "border-primary ring-2 ring-primary/20 text-primary" : "border-border text-primary hover:border-primary/50"
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex-1 select-none pr-6">
          {value ? formatDisplayTime() : <span className="text-muted-foreground/50">{placeholder}</span>}
        </div>
        <Clock size={20} className="absolute right-4 text-muted-foreground pointer-events-none" />
        
        {value && onClear && (
          <div 
            className="absolute right-12 z-10 p-1 bg-surface-hover rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
            onClick={handleClear}
            title="Clear Time"
          >
            <X size={14} strokeWidth={3} />
          </div>
        )}
      </div>

      {isOpen && (
        <div className="absolute z-50 bottom-full mb-2 p-3 bg-surface border border-border/60 rounded-2xl shadow-xl w-[260px] sm:w-[320px] right-0 origin-bottom-right">
          <div className="flex gap-2 h-48 mb-3">
            {/* Hours */}
            <div className="flex-1 flex flex-col bg-muted/30 rounded-xl overflow-hidden border border-border/50">
              <div className="text-[10px] sm:text-xs font-bold text-center py-2 bg-muted/50 text-muted-foreground tracking-widest shrink-0">HR</div>
              <div className="flex-1 overflow-y-auto hidden-scrollbar snap-y snap-mandatory relative scroll-smooth py-16">
                {hoursList.map(h => (
                  <div 
                    key={h}
                    onClick={() => setHours(h)}
                    className={cn(
                      "h-8 flex items-center justify-center cursor-pointer font-medium snap-center transition-all text-sm m-1 rounded-lg",
                      hours === h ? "bg-primary text-primary-foreground font-bold shadow-sm" : "hover:bg-primary/10 text-foreground"
                    )}
                  >
                    {h}
                  </div>
                ))}
              </div>
            </div>

            {/* Minutes */}
            <div className="flex-1 flex flex-col bg-muted/30 rounded-xl overflow-hidden border border-border/50">
              <div className="text-[10px] sm:text-xs font-bold text-center py-2 bg-muted/50 text-muted-foreground tracking-widest shrink-0">MIN</div>
              <div className="flex-1 overflow-y-auto hidden-scrollbar snap-y snap-mandatory relative scroll-smooth py-16">
                {minutesList.map(m => (
                  <div 
                    key={m}
                    onClick={() => setMinutes(m)}
                    className={cn(
                      "h-8 flex items-center justify-center cursor-pointer font-medium snap-center transition-all text-sm m-1 rounded-lg",
                      minutes === m ? "bg-primary text-primary-foreground font-bold shadow-sm" : "hover:bg-primary/10 text-foreground"
                    )}
                  >
                    {m}
                  </div>
                ))}
              </div>
            </div>

            {/* AM/PM */}
            <div className="flex-1 flex flex-col gap-2">
              <button 
                type="button"
                onClick={() => setPeriod("AM")}
                className={cn(
                  "flex-1 rounded-xl text-xs sm:text-sm font-bold border transition-all active:scale-95",
                  period === "AM" ? "bg-primary text-primary-foreground border-primary shadow-sm" : "bg-muted/30 text-muted-foreground hover:bg-muted/50 border-transparent"
                )}
              >
                AM
              </button>
              <button 
                type="button"
                onClick={() => setPeriod("PM")}
                className={cn(
                  "flex-1 rounded-xl text-xs sm:text-sm font-bold border transition-all active:scale-95",
                  period === "PM" ? "bg-primary text-primary-foreground border-primary shadow-sm" : "bg-muted/30 text-muted-foreground hover:bg-muted/50 border-transparent"
                )}
              >
                PM
              </button>
            </div>
          </div>

          <div className="flex gap-2 sm:gap-3">
            <button 
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex-1 py-2 sm:py-3 rounded-xl text-sm font-bold text-muted-foreground bg-muted/50 hover:bg-muted hover:text-foreground transition-all active:scale-95"
            >
              Cancel
            </button>
            <button 
              type="button"
              onClick={handleSet}
              className="flex-1 py-2 sm:py-3 rounded-xl text-sm font-bold bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-primary/40 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Check size={16} strokeWidth={3} className="hidden sm:block" />
              Set Time
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
