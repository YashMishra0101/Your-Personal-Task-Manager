import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useTasks } from "../context/TaskContext";
import Layout from "../components/Layout";
import {
  ArrowLeft,
  Clock,
  Calendar,
  Pencil,
  Trash2,
  CheckCircle,
  Circle,
  CalendarCheck,
  ToggleLeft,
  ToggleRight,
  XCircle,
  RotateCcw,
} from "lucide-react";
import { format, isPast, parseISO, differenceInMinutes } from "date-fns";
import { formatDeadlineDisplay } from "../lib/timeUtils";
import { cn } from "../lib/utils";
import ConfirmDialog from "../components/ConfirmDialog";
import OutcomeDialog from "../components/OutcomeDialog";
import { toast } from "sonner";

export default function TaskDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { tasks, toggleTaskCompletion, markTaskOutcome, deleteTask, updateTask } = useTasks();

  const [task, setTask] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showOutcomeDialog, setShowOutcomeDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [isUnsuccessful, setIsUnsuccessful] = useState(false);
  const [isSavingProgress, setIsSavingProgress] = useState(false);
  const [progressDisabled, setProgressDisabled] = useState(false);
  const [isTogglingProgress, setIsTogglingProgress] = useState(false);

  useEffect(() => {
    const foundTask = tasks.find((t) => t.id === id);
    if (foundTask) {
      setTask(foundTask);
      setCompletionPercentage(
        typeof foundTask.completionPercentage === "number"
          ? foundTask.completionPercentage
          : 0
      );
      setIsUnsuccessful(!!foundTask.isUnsuccessful);
      setProgressDisabled(!!foundTask.progressDisabled);
    }
    setLoading(false);
  }, [id, tasks]);

  // Toggle subtask completion
  const toggleSubtask = async (subtaskId) => {
    if (!task) return;

    const updatedSubtasks = task.subtasks.map(st =>
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    );

    try {
      await updateTask(task.id, {
        subtasks: updatedSubtasks,
      });
      toast.success("Subtask updated");
    } catch (error) {
      toast.error("Failed to update subtask");
    }
  };

  if (loading) {
    return (
      <Layout title="Loading...">
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  if (!task) {
    return (
      <Layout title="Task Not Found">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-bold text-primary mb-2">
            Task Not Found
          </h3>
          <p className="text-muted-foreground mb-6">
            The task you're looking for doesn't exist.
          </p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium shadow-lg"
          >
            Go back Home
          </button>
        </div>
      </Layout>
    );
  }

  const getDetailedTimeLeft = (deadline, includeLastDay = true) => {
    if (!deadline) return null;
    const end = parseISO(deadline);
    const now = new Date();

    if (isPast(end)) return { days: 0, isOverdue: true, isLastDay: false };

    const totalMinutes = differenceInMinutes(end, now);
    // Calculate days based on includeLastDay preference
    let days = Math.floor(totalMinutes / (24 * 60));
    if (includeLastDay) {
      days = days + 1;
    }

    const isLastDay = days === 1 && includeLastDay;

    return { days, isOverdue: false, isLastDay };
  };

  const timeDetails = getDetailedTimeLeft(task.deadline, task.includeLastDay);
  const isOverdue = timeDetails?.isOverdue;

  const handleMarkOutcome = async (isSuccessful) => {
    try {
      await markTaskOutcome(task.id, isSuccessful);
      toast.success(isSuccessful ? "Task completed successfully" : "Task marked as not completed");
    } catch (error) {
      toast.error("Failed to update task");
    }
  };

  const handleReactivate = async () => {
    try {
      await toggleTaskCompletion(task.id, true);
      toast.success("Task reactivated");
    } catch (error) {
      toast.error("Failed to reactivate task");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteTask(task.id);
      toast.success("Task deleted");
      navigate("/");
    } catch (error) {
      toast.error("Failed to delete task");
    }
  };

  const handleSaveProgress = async () => {
    if (!task || task.completed) return;
    try {
      setIsSavingProgress(true);
      await updateTask(task.id, {
        completionPercentage: completionPercentage,
      });
      toast.success("Task progress updated");
    } catch (error) {
      toast.error("Failed to update task progress");
    } finally {
      setIsSavingProgress(false);
    }
  };

  const handleToggleProgressDisabled = async () => {
    if (!task || task.completed) return;
    const next = !progressDisabled;
    try {
      setIsTogglingProgress(true);
      await updateTask(task.id, { progressDisabled: next });
      setProgressDisabled(next);
      toast.success(next ? "Task progress tracking disabled" : "Task progress tracking enabled");
    } catch (error) {
      toast.error("Failed to update progress setting");
    } finally {
      setIsTogglingProgress(false);
    }
  };

  return (
    <Layout title="Task Details">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 pb-24">
        {/* Navigation & Actions */}
        <div className="flex flex-col gap-4 mb-10">
          {task.completed ? (
            /* ── Completed: Back (left) ↔ Delete (right) in one row ── */
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 px-4 py-3 bg-transparent border border-border/60 text-muted-foreground hover:bg-muted/50 hover:text-foreground rounded-2xl transition-all font-semibold active:scale-95 group"
              >
                <ArrowLeft size={20} className="transition-transform group-hover:-translate-x-1" />
                <span>Back</span>
              </button>

              <button
                onClick={() => setShowDeleteDialog(true)}
                className="flex items-center gap-2 px-5 py-3 bg-red-500/5 text-red-500 hover:bg-red-500 hover:text-white rounded-2xl transition-all font-semibold active:scale-95"
              >
                <Trash2 size={18} />
                <span>Delete</span>
              </button>
            </div>
          ) : (
            /* ── Active: Back on top row, Edit + Delete on second row ── */
            <>
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 px-4 py-3 bg-transparent border border-border/60 text-muted-foreground hover:bg-muted/50 hover:text-foreground rounded-2xl transition-all font-semibold active:scale-95 group self-start"
              >
                <ArrowLeft size={20} className="transition-transform group-hover:-translate-x-1" />
                <span>Back</span>
              </button>

              <div className="flex items-center justify-between gap-3">
                <Link
                  to={`/edit/${task.id}`}
                  className="flex items-center gap-2 px-5 py-3 bg-primary/5 text-primary hover:bg-primary hover:text-white rounded-2xl transition-all font-semibold active:scale-95"
                >
                  <Pencil size={18} />
                  <span>Edit</span>
                </Link>

                <button
                  onClick={() => setShowDeleteDialog(true)}
                  className="flex items-center gap-2 px-5 py-3 bg-red-500/5 text-red-500 hover:bg-red-500 hover:text-white rounded-2xl transition-all font-semibold active:scale-95"
                >
                  <Trash2 size={18} />
                  <span>Delete</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Content Section */}
        <div className="grid grid-cols-1 gap-10">
          {/* Task Heading Card - Consistent with other fields */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground uppercase tracking-widest pl-1">
                <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                Task Heading
              </div>

              {/* Status Actions */}
              <div className="flex items-center gap-2">
                {!task.completed ? (
                  <button
                    onClick={() => setShowOutcomeDialog(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer shadow-sm active:scale-95 bg-green-500/10 border-green-500/20 text-green-600 hover:bg-green-500/20"
                  >
                    <CheckCircle size={14} /> Complete Task
                  </button>
                ) : (
                  <button
                    onClick={handleReactivate}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer shadow-sm active:scale-95",
                      task.isUnsuccessful
                        ? "bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500/20"
                        : "bg-green-500/10 border-green-500/20 text-green-600 hover:bg-green-500/20"
                    )}
                  >
                    <RotateCcw size={14} /> Reactivate Task
                  </button>
                )}
              </div>
            </div>

            {/* Heading in white box */}
            <div className="bg-surface p-8 rounded-3xl border border-border/60 shadow-sm">
              <h1
                className={cn(
                  "text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight leading-tight text-foreground wrap-break-word",
                  task.completed && "opacity-50 decoration-2 decoration-current line-through"
                )}
              >
                {task.title}
              </h1>

              {/* Overdue indicator inside heading box */}
              {isOverdue && !task.completed && (
                <div className="mt-4 pt-4 border-t border-border/50">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-red-500/10 text-red-500 border border-red-500/20">
                    <Clock size={14} />
                    Overdue
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Description Card */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground uppercase tracking-widest pl-1">
              <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
              Description
            </div>
            <div className="bg-surface p-8 rounded-3xl border border-border/60 shadow-sm">
              <p className={cn(
                "text-lg leading-relaxed whitespace-pre-wrap wrap-break-word",
                task.description ? "text-foreground/90" : "text-muted-foreground italic"
              )}>
                {task.description || "No specific details provided for this task."}
              </p>
            </div>
          </div>

          {/* Subtasks Section */}
          {task.subtasks && task.subtasks.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground uppercase tracking-widest pl-1">
                <div className="w-1.5 h-1.5 rounded-full bg-accent"></div>
                Subtasks
              </div>
              <div className="bg-surface p-6 rounded-3xl border border-border/60 shadow-sm">
                <div className="space-y-3">
                  {task.subtasks.map((subtask) => (
                    <label
                      key={subtask.id}
                      htmlFor={`subtask-${subtask.id}`}
                      className={cn(
                        "flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer group",
                        subtask.completed
                          ? "bg-primary/5 border-primary/20"
                          : "bg-background border-border hover:border-primary/50 hover:bg-muted/30"
                      )}
                    >
                      <input
                        id={`subtask-${subtask.id}`}
                        type="checkbox"
                        checked={subtask.completed}
                        onChange={() => toggleSubtask(subtask.id)}
                        disabled={task.completed}
                        className="w-5 h-5 mt-0.5 rounded border-2 border-border checked:border-primary checked:bg-primary text-primary-foreground focus:ring-2 focus:ring-primary/20 cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      <span className={cn(
                        "flex-1 text-base leading-relaxed transition-all",
                        subtask.completed
                          ? "text-muted-foreground line-through"
                          : "text-foreground"
                      )}>
                        {subtask.text}
                      </span>
                    </label>
                  ))}

                  {/* Progress Indicator */}
                  <div className="pt-3 mt-3 border-t border-border/50">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground font-medium">
                        Progress
                      </span>
                      <span className="font-bold text-primary">
                        {task.subtasks.filter(st => st.completed).length} / {task.subtasks.length} completed
                      </span>
                    </div>
                    <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-300 rounded-full"
                        style={{
                          width: `${(task.subtasks.filter(st => st.completed).length / task.subtasks.length) * 100}%`
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Task Progress Section */}
          <div className="space-y-3">
            {/* Section header */}
            <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground uppercase tracking-widest pl-1">
              <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
              Task Progress
            </div>

            <div className="bg-surface p-6 rounded-3xl border border-border/60 shadow-sm space-y-5">

              {/* ─── Disabled state: progress tracking turned off ─── */}
              {progressDisabled ? (
                <div className="flex items-center gap-3 p-4 bg-muted/40 border border-border/60 rounded-2xl">
                  <div className="p-2 bg-muted rounded-xl text-muted-foreground shrink-0">
                    <ToggleLeft size={16} />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Progress tracking is disabled for this task.
                  </p>
                </div>
              ) : (
                /* ─── Normal / read-only progress UI ─── */
                <>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-muted-foreground">
                        Completion
                      </span>
                      <span className="text-sm font-bold text-primary">
                        {isUnsuccessful ? "Unsuccessful" : `${completionPercentage}%`}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={1}
                      value={completionPercentage}
                      disabled={isUnsuccessful || task.completed}
                      onChange={(e) => {
                        if (task.completed) return;
                        setCompletionPercentage(Number(e.target.value));
                      }}
                      className={cn(
                        "w-full accent-primary disabled:opacity-50",
                        task.completed ? "cursor-not-allowed" : ""
                      )}
                    />
                  </div>

                  {/* Disable / Enable Progress toggle + Save — only when task is active */}
                  {!task.completed && (
                    <div className="flex items-center gap-3 pt-1">
                      <button
                        type="button"
                        onClick={handleSaveProgress}
                        disabled={isSavingProgress}
                        className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50"
                      >
                        {isSavingProgress ? "Saving..." : "Save Progress"}
                      </button>

                      <button
                        type="button"
                        onClick={handleToggleProgressDisabled}
                        disabled={isTogglingProgress}
                        title={progressDisabled ? "Enable progress tracking" : "Disable progress tracking"}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold border transition-all active:scale-95 disabled:opacity-50",
                          progressDisabled
                            ? "bg-muted/60 border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                            : "bg-muted/40 border-border/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <ToggleRight size={15} />
                        {isTogglingProgress ? "Saving..." : "Disable Progress"}
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* Disable → Enable button shown when progress is off and task is active */}
              {progressDisabled && !task.completed && (
                <button
                  type="button"
                  onClick={handleToggleProgressDisabled}
                  disabled={isTogglingProgress}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold border border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 transition-all active:scale-95 disabled:opacity-50"
                >
                  <ToggleRight size={15} />
                  {isTogglingProgress ? "Saving..." : "Enable Progress"}
                </button>
              )}
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Target Date */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground uppercase tracking-widest pl-1">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                Target Date
              </div>
              <div className="bg-surface p-6 rounded-3xl border border-border/60 shadow-sm h-full flex flex-col justify-center min-h-[140px]">
                {task.deadline ? (
                  <div className="flex items-center gap-5">
                    <div className={cn(
                      "p-4 rounded-2xl shrink-0",
                      isOverdue ? "bg-red-500/10 text-red-500" : "bg-blue-500/10 text-blue-600"
                    )}>
                      {(task.timeValue && !task.dateValue && task.dateValue !== undefined) ? (
                        <Clock size={32} strokeWidth={1.5} />
                      ) : (
                        <Calendar size={32} strokeWidth={1.5} />
                      )}
                    </div>
                    <div>
                      <div className="text-2xl font-bold tabular-nums text-foreground">
                        {formatDeadlineDisplay(task.deadline, task.timeValue, task.dateValue)}
                      </div>
                      <div className={cn(
                        "text-sm font-medium mt-1 inline-flex items-center gap-1.5",
                        isOverdue ? "text-red-500" : "text-muted-foreground"
                      )}>
                        {isOverdue ? (
                          "Overdue"
                        ) : timeDetails?.isLastDay ? (
                          <span className="flex items-center gap-1.5">
                            <Clock size={14} /> 1 day left <span className="text-red-500 font-bold text-xs bg-red-50 dark:bg-red-500/10 px-1.5 py-0.5 rounded ml-1">Last Day</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5">
                            <Clock size={14} /> {timeDetails?.days} days left
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-4 opacity-50">
                    <div className="p-4 bg-muted/50 rounded-2xl text-muted-foreground">
                      <Calendar size={32} />
                    </div>
                    <span className="text-xl font-medium text-muted-foreground">No Date Set</span>
                  </div>
                )}
              </div>
            </div>

            {/* Created On */}
            <div className="space-y-3 mt-6 md:mt-0">
              <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground uppercase tracking-widest pl-1">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                Created On
              </div>
              <div className="bg-surface p-6 rounded-3xl border border-border/60 shadow-sm h-full flex flex-col justify-center min-h-[140px]">
                <div className="flex items-center gap-5">
                  <div className="p-4 bg-purple-500/10 rounded-2xl text-purple-600 shrink-0">
                    <CalendarCheck size={32} strokeWidth={1.5} />
                  </div>
                  <div>
                    <div className="text-2xl font-bold tabular-nums text-foreground">
                      {task.createdAt ? format(parseISO(task.createdAt), "MMM d, yyyy") : "N/A"}
                    </div>
                    <div className="text-sm font-medium text-muted-foreground mt-1 flex items-center gap-1.5">
                      <Clock size={14} />
                      {task.createdAt ? format(parseISO(task.createdAt), "h:mm a") : ""}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Delete Task"
        message={`This will permanently remove "${task.title}". Are you sure?`}
        confirmText="Delete Task"
        cancelText="Keep Task"
        variant="danger"
      />

      <OutcomeDialog
        isOpen={showOutcomeDialog}
        onClose={() => setShowOutcomeDialog(false)}
        onOutcome={handleMarkOutcome}
      />
    </Layout>
  );
}
