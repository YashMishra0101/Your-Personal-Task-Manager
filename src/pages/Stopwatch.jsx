import React, { useState, useRef, useEffect } from "react";
import Layout from "../components/Layout";
import { useStopwatch } from "../context/StopwatchContext";
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  Trash2,
  Plus,
  Timer,
  Search,
  History,
  Clock,
  Edit3,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { cn } from "../lib/utils";
import ConfirmDialog from "../components/ConfirmDialog";
import StopwatchOutcomeDialog from "../components/StopwatchOutcomeDialog";

/** Format milliseconds → HH:MM:SS */
function formatTime(ms) {
  if (ms < 0) ms = 0;
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/** Format ms into a human-readable duration string */
function formatDuration(ms) {
  if (ms < 1000) return "< 1s";
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const parts = [];
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  if (s > 0 || parts.length === 0) parts.push(`${s}s`);
  return parts.join(" ");
}

/** Format ISO date string to readable format */
function formatDate(isoStr) {
  if (!isoStr) return "";
  const d = new Date(isoStr);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  const timeStr = d.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (d.toDateString() === now.toDateString()) return `Today at ${timeStr}`;
  if (d.toDateString() === yesterday.toDateString())
    return `Yesterday at ${timeStr}`;
  return `${d.toLocaleDateString([], { month: "short", day: "numeric" })} at ${timeStr}`;
}

// ─── Individual Stopwatch Card ───

function StopwatchCard({ entry, computeElapsed, onPause, onResume, onStop, onRestore, onDelete, onUpdateLabel }) {
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [editLabel, setEditLabel] = useState(entry.label);
  const [showLaps, setShowLaps] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showOutcomeDialog, setShowOutcomeDialog] = useState(false);
  const inputRef = useRef(null);

  const elapsed = computeElapsed(entry);
  const isRunning = entry.status === "running";
  const isPaused = entry.status === "paused";
  const isStopped = entry.status === "stopped";

  useEffect(() => {
    if (isEditingLabel && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditingLabel]);

  const handleSaveLabel = () => {
    const trimmed = editLabel.trim();
    if (trimmed && trimmed !== entry.label) {
      onUpdateLabel(entry.id, trimmed);
      toast.success("Label updated");
    }
    setIsEditingLabel(false);
    setEditLabel(trimmed || entry.label);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSaveLabel();
    if (e.key === "Escape") {
      setEditLabel(entry.label);
      setIsEditingLabel(false);
    }
  };

  const isCompletedOutcome = isStopped && entry.outcome === "completed";
  const isNotCompletedOutcome = isStopped && entry.outcome === "not_completed";

  const statusConfig = {
    running: {
      dot: "bg-green-500",
      text: "text-green-600 dark:text-green-400",
      bg: "bg-green-50 dark:bg-green-500/10",
      label: "Running",
      pulse: true,
      icon: null,
    },
    paused: {
      dot: "bg-yellow-500",
      text: "text-yellow-600 dark:text-yellow-400",
      bg: "bg-yellow-50 dark:bg-yellow-500/10",
      label: "Paused",
      pulse: false,
      icon: null,
    },
    completed: {
      dot: "bg-emerald-500",
      text: "text-emerald-700 dark:text-emerald-400",
      bg: "bg-emerald-500/10 border border-emerald-500/20",
      label: "Task Completed",
      pulse: false,
      icon: CheckCircle2,
    },
    not_completed: {
      dot: "bg-red-500",
      text: "text-red-600 dark:text-red-400",
      bg: "bg-red-500/10 border border-red-500/20",
      label: "Not Completed",
      pulse: false,
      icon: XCircle,
    },
    stopped: {
      dot: "bg-muted-foreground/40",
      text: "text-muted-foreground",
      bg: "bg-muted/50",
      label: "Stopped",
      pulse: false,
      icon: null,
    },
  };

  const statusKey = isStopped
    ? isCompletedOutcome
      ? "completed"
      : isNotCompletedOutcome
      ? "not_completed"
      : "stopped"
    : entry.status;

  const status = statusConfig[statusKey] || statusConfig.stopped;
  const StatusIcon = status.icon;

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.97 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className={cn(
          "bg-surface border border-border/50 rounded-2xl shadow-sm overflow-hidden transition-all",
          isRunning && "ring-1 ring-green-500/20",
          isCompletedOutcome && "border-emerald-500/25",
          isNotCompletedOutcome && "border-red-500/25"
        )}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-3 flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {isEditingLabel ? (
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onBlur={handleSaveLabel}
                  maxLength={60}
                  className="flex-1 min-w-0 text-base font-bold bg-transparent outline-hidden border-b-2 border-primary/30 focus:border-primary transition-colors py-0.5"
                />
                <button
                  onClick={handleSaveLabel}
                  className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-500/10 rounded-lg transition-colors shrink-0"
                >
                  <Check size={16} strokeWidth={2.5} />
                </button>
                <button
                  onClick={() => {
                    setEditLabel(entry.label);
                    setIsEditingLabel(false);
                  }}
                  className="p-1 text-muted-foreground hover:bg-surface-hover rounded-lg transition-colors shrink-0"
                >
                  <X size={16} strokeWidth={2.5} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group/label">
                <h3 className="text-base font-bold text-primary truncate">
                  {entry.label}
                </h3>
                <button
                  onClick={() => {
                    setEditLabel(entry.label);
                    setIsEditingLabel(true);
                  }}
                  className="p-1 text-muted-foreground/0 group-hover/label:text-muted-foreground hover:text-primary hover:bg-surface-hover rounded-lg transition-all shrink-0"
                  aria-label="Edit label"
                >
                  <Edit3 size={13} strokeWidth={2.5} />
                </button>
              </div>
            )}

            {/* Status Badge */}
            <div className="flex items-center flex-wrap gap-2 mt-1.5">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest",
                  status.bg,
                  status.text
                )}
              >
                {StatusIcon ? (
                  <StatusIcon size={11} strokeWidth={2.75} />
                ) : (
                  <span
                    className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      status.dot,
                      status.pulse && "animate-pulse"
                    )}
                  />
                )}
                {status.label}
              </span>
              <span className="text-[10px] text-muted-foreground/60 font-medium">
                {formatDate(entry.createdAt)}
              </span>
            </div>
          </div>
        </div>

        {/* Timer Display */}
        <div className="px-5 py-4 flex items-center justify-center">
          <div
            className={cn(
              "text-4xl sm:text-5xl font-black tabular-nums tracking-tight transition-colors",
              isRunning
                ? "text-green-600 dark:text-green-400"
                : isStopped
                ? "text-muted-foreground/60"
                : "text-primary"
            )}
            style={{ fontFamily: "'Plus Jakarta Sans', monospace" }}
          >
            {formatTime(elapsed)}
          </div>
        </div>

        {/* Controls */}
        <div className="px-5 pb-4 flex items-center justify-center gap-3">
          {isRunning && (
            <>
              <button
                onClick={() => onPause(entry.id)}
                className="flex items-center gap-2 px-5 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-yellow-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <Pause size={16} strokeWidth={2.5} />
                Pause
              </button>
              <button
                onClick={() => setShowOutcomeDialog(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-red-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <Square size={14} strokeWidth={2.5} fill="currentColor" />
                Stop
              </button>
            </>
          )}

          {isPaused && (
            <>
              <button
                onClick={() => onResume(entry.id)}
                className="flex items-center gap-2 px-5 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-green-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <Play size={16} strokeWidth={2.5} fill="currentColor" />
                Resume
              </button>
              <button
                onClick={() => setShowOutcomeDialog(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-red-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <Square size={14} strokeWidth={2.5} fill="currentColor" />
                Stop
              </button>
            </>
          )}

          {isStopped && (
            <>
              <button
                onClick={() => onRestore(entry.id)}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <RotateCcw size={16} strokeWidth={2.5} />
                Move to Active
              </button>
              <button
                onClick={() => setShowDeleteDialog(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-red-50 dark:bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl font-bold text-sm hover:shadow-lg hover:shadow-red-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <Trash2 size={16} strokeWidth={2.5} />
                Delete
              </button>
            </>
          )}
        </div>

        {/* Laps / Sessions */}
        {entry.laps && entry.laps.length > 0 && (
          <div className="border-t border-border/40">
            <button
              onClick={() => setShowLaps(!showLaps)}
              className="w-full px-5 py-3 flex items-center justify-between text-sm font-semibold text-muted-foreground hover:text-primary hover:bg-surface-hover/50 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Clock size={14} />
                {entry.laps.length} Session{entry.laps.length !== 1 ? "s" : ""}
              </span>
              {showLaps ? (
                <ChevronUp size={16} />
              ) : (
                <ChevronDown size={16} />
              )}
            </button>

            <AnimatePresence>
              {showLaps && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-5 pb-4 space-y-1.5 max-h-48 overflow-y-auto scrollbar-hide">
                    {entry.laps.map((lap, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between py-2 px-3 rounded-xl bg-muted/30 text-xs"
                      >
                        <span className="font-bold text-muted-foreground">
                          Session {i + 1}
                        </span>
                        <span className="font-bold tabular-nums text-primary">
                          {formatDuration(lap.durationMs)}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Stopped Info */}
        {isStopped && entry.stoppedAt && (
          <div className="px-5 py-3 bg-muted/20 border-t border-border/30 text-xs text-muted-foreground font-medium flex items-center justify-between gap-2 flex-wrap">
            <span className="flex items-center gap-2">
              <History size={12} />
              Finished {formatDate(entry.stoppedAt)} · Total:{" "}
              <span className="font-bold text-primary">
                {formatDuration(elapsed)}
              </span>
            </span>
            {isCompletedOutcome && (
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                Completed
              </span>
            )}
            {isNotCompletedOutcome && (
              <span className="text-[11px] font-bold text-red-600 dark:text-red-400">
                Not Completed
              </span>
            )}
          </div>
        )}
      </motion.div>

      <StopwatchOutcomeDialog
        isOpen={showOutcomeDialog}
        onClose={() => setShowOutcomeDialog(false)}
        onOutcome={(outcome) => {
          onStop(entry.id, outcome);
          toast.success(
            outcome === "completed"
              ? "Session saved as Task Completed"
              : "Session saved as Not Completed"
          );
        }}
        sessionLabel={entry.label}
        elapsedText={formatTime(elapsed)}
        isPaused={isPaused}
      />

      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={() => {
          onDelete(entry.id);
          toast.success("Stopwatch deleted");
        }}
        title="Delete Stopwatch"
        message={`This will permanently remove "${entry.label}" and its session history. Are you sure?`}
        confirmText="Delete"
        cancelText="Keep It"
        variant="danger"
      />
    </>
  );
}

// ─── Main Page ───

export default function Stopwatch() {
  const {
    entries,
    loading,
    computeElapsed,
    createStopwatch,
    pauseStopwatch,
    resumeStopwatch,
    stopStopwatch,
    restoreStopwatch,
    updateLabel,
    deleteStopwatch,
  } = useStopwatch();

  const [showNewForm, setShowNewForm] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("active"); // active | history
  const [historyFilter, setHistoryFilter] = useState("all"); // all | completed | not_completed
  const newLabelRef = useRef(null);

  useEffect(() => {
    if (showNewForm && newLabelRef.current) {
      newLabelRef.current.focus();
    }
  }, [showNewForm]);

  const handleCreate = () => {
    createStopwatch(newLabel);
    toast.success("Stopwatch started!");
    setNewLabel("");
    setShowNewForm(false);
  };

  const handleRestore = async (id) => {
    await restoreStopwatch(id);
    setViewMode("active");
    toast.success("Session moved to Active — ready to resume");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleCreate();
    if (e.key === "Escape") {
      setNewLabel("");
      setShowNewForm(false);
    }
  };

  // Filter entries
  const activeEntries = entries.filter(
    (e) =>
      (e.status === "running" || e.status === "paused") &&
      (e.label || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const historyEntries = entries.filter(
    (e) =>
      e.status === "stopped" &&
      (e.label || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const completedHistoryCount = historyEntries.filter(
    (e) => e.outcome === "completed"
  ).length;
  const notCompletedHistoryCount = historyEntries.filter(
    (e) => e.outcome === "not_completed"
  ).length;

  const filteredHistoryEntries = historyEntries.filter((e) => {
    if (historyFilter === "completed") return e.outcome === "completed";
    if (historyFilter === "not_completed") return e.outcome === "not_completed";
    return true;
  });

  const displayedEntries =
    viewMode === "active" ? activeEntries : filteredHistoryEntries;

  return (
    <Layout title="Stopwatch">
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Top Bar */}
        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
          {/* Search */}
          <div className="relative w-full sm:max-w-sm">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/60"
              size={18}
            />
            <input
              type="text"
              placeholder="Search stopwatches..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 bg-surface border border-border/50 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-hidden transition-all text-sm font-semibold shadow-sm"
            />
          </div>

          {/* New Stopwatch Button */}
          <button
            onClick={() => setShowNewForm(!showNewForm)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-primary text-primary-foreground rounded-2xl font-bold shadow-lg shadow-primary/25 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Plus size={20} />
            <span>New Stopwatch</span>
          </button>
        </div>

        {/* New Stopwatch Form */}
        <AnimatePresence>
          {showNewForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="bg-surface border border-border/50 rounded-2xl p-5 shadow-sm">
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    ref={newLabelRef}
                    type="text"
                    placeholder="e.g. Study Session, Workout, Coding..."
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    onKeyDown={handleKeyDown}
                    maxLength={60}
                    className="flex-1 px-4 py-3 bg-background border border-border/50 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-hidden transition-all text-sm font-semibold"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleCreate}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-green-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                      <Play size={16} strokeWidth={2.5} fill="white" />
                      Start
                    </button>
                    <button
                      onClick={() => {
                        setShowNewForm(false);
                        setNewLabel("");
                      }}
                      className="flex items-center justify-center px-4 py-3 bg-surface-hover hover:bg-border text-muted-foreground rounded-xl font-bold text-sm transition-colors"
                    >
                      <X size={18} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>
                <p className="mt-2 text-xs text-muted-foreground/60 font-medium">
                  Label is optional — leave blank for "Untitled Timer". Press Enter to start.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* View Toggle & History Outcome Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center bg-surface p-1.5 rounded-2xl border border-border/50 shadow-sm w-fit">
            <button
              onClick={() => setViewMode("active")}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200",
                viewMode === "active"
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:text-primary hover:bg-surface-hover"
              )}
            >
              <Timer size={16} strokeWidth={2.5} />
              <span>Active</span>
              {activeEntries.length > 0 && (
                <span
                  className={cn(
                    "ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-black",
                    viewMode === "active"
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-primary/10 text-primary"
                  )}
                >
                  {activeEntries.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setViewMode("history")}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200",
                viewMode === "history"
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:text-primary hover:bg-surface-hover"
              )}
            >
              <History size={16} strokeWidth={2.5} />
              <span>History</span>
              {historyEntries.length > 0 && (
                <span
                  className={cn(
                    "ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-black",
                    viewMode === "history"
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-primary/10 text-primary"
                  )}
                >
                  {historyEntries.length}
                </span>
              )}
            </button>
          </div>

          {viewMode === "history" && historyEntries.length > 0 && (
            <div className="flex items-center flex-wrap bg-surface p-1.5 rounded-2xl border border-border/50 shadow-sm w-fit gap-1">
              <button
                onClick={() => setHistoryFilter("all")}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-bold transition-all",
                  historyFilter === "all"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-primary hover:bg-surface-hover"
                )}
              >
                All ({historyEntries.length})
              </button>
              <button
                onClick={() => setHistoryFilter("completed")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all",
                  historyFilter === "completed"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                )}
              >
                <CheckCircle2 size={13} strokeWidth={2.5} />
                Completed ({completedHistoryCount})
              </button>
              <button
                onClick={() => setHistoryFilter("not_completed")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all",
                  historyFilter === "not_completed"
                    ? "bg-red-500 text-white shadow-xs"
                    : "text-red-600 dark:text-red-400 hover:bg-red-500/10"
                )}
              >
                <XCircle size={13} strokeWidth={2.5} />
                Not Completed ({notCompletedHistoryCount})
              </button>
            </div>
          )}
        </div>

        {/* Entries List */}
        {loading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-48 bg-surface border border-border/50 rounded-2xl"
              />
            ))}
          </div>
        ) : displayedEntries.length > 0 ? (
          <motion.div layout className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatePresence mode="popLayout">
              {displayedEntries.map((entry) => (
                <StopwatchCard
                  key={entry.id}
                  entry={entry}
                  computeElapsed={computeElapsed}
                  onPause={pauseStopwatch}
                  onResume={resumeStopwatch}
                  onStop={stopStopwatch}
                  onRestore={handleRestore}
                  onDelete={deleteStopwatch}
                  onUpdateLabel={updateLabel}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-surface rounded-3xl flex items-center justify-center text-primary/20 mb-4 border border-border/50 shadow-xs">
              {viewMode === "active" ? (
                <Timer size={32} />
              ) : (
                <History size={32} />
              )}
            </div>
            <h3 className="text-xl font-bold text-primary mb-2">
              {searchTerm
                ? "No matching stopwatches"
                : viewMode === "active"
                ? "No active stopwatches"
                : historyFilter === "completed"
                ? "No completed sessions"
                : historyFilter === "not_completed"
                ? "No incomplete sessions"
                : "No stopwatch history yet"}
            </h3>
            <p className="text-muted-foreground max-w-xs mx-auto text-sm leading-relaxed">
              {searchTerm
                ? "Try adjusting your search terms."
                : viewMode === "active"
                ? "Start a new stopwatch to track your study sessions, workouts, or anything else."
                : historyFilter !== "all"
                ? "Try switching the filter to see all recorded sessions."
                : "Stopped stopwatches will appear here as your history."}
            </p>
            {!searchTerm && viewMode === "active" && (
              <button
                onClick={() => setShowNewForm(true)}
                className="mt-6 text-primary font-bold hover:underline"
              >
                Start your first stopwatch
              </button>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
