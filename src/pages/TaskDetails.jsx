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
  RotateCcw,
  CalendarCheck,
} from "lucide-react";
import { format, isPast, parseISO, differenceInMinutes } from "date-fns";
import { formatDeadlineDisplay } from "../lib/timeUtils";
import { cn } from "../lib/utils";
import ConfirmDialog from "../components/ConfirmDialog";
import { toast } from "sonner";

export default function TaskDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { tasks, toggleTaskCompletion, deleteTask, updateTask } = useTasks();

  const [task, setTask] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [isUnsuccessful, setIsUnsuccessful] = useState(false);
  const [isSavingProgress, setIsSavingProgress] = useState(false);

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

  const handleToggleComplete = async () => {
    try {
      await toggleTaskCompletion(task.id, task.completed);
      toast.success(task.completed ? "Task reactivated" : "Task completed");
    } catch (error) {
      toast.error("Failed to update task");
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
    if (!task) return;
    try {
      setIsSavingProgress(true);
      await updateTask(task.id, {
        completionPercentage: isUnsuccessful ? 0 : completionPercentage,
        isUnsuccessful,
      });
      toast.success("Task progress updated");
    } catch (error) {
      toast.error("Failed to update task progress");
    } finally {
      setIsSavingProgress(false);
    }
  };

  return (
    <Layout title="Task Details">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 pb-24">
        {/* Navigation & Actions */}
        <div className="flex flex-col gap-4 mb-10">
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-3 bg-transparent border border-border/60 text-muted-foreground hover:bg-muted/50 hover:text-foreground rounded-2xl transition-all font-semibold active:scale-95 group self-start"
          >
            <ArrowLeft size={20} className="transition-transform group-hover:-translate-x-1" />
            <span>Back</span>
          </button>

          {/* Action Buttons - Responsive Layout */}
          <div className="flex items-center justify-between gap-3">
            {/* Edit Button - Left on mobile, always visible */}
            {!task.completed && (
              <Link
                to={`/edit/${task.id}`}
                className="flex items-center gap-2 px-5 py-3 bg-primary/5 text-primary hover:bg-primary hover:text-white rounded-2xl transition-all font-semibold active:scale-95"
              >
                <Pencil size={18} />
                <span>Edit</span>
              </Link>
            )}

            {/* Spacer on mobile if no edit button */}
            {task.completed && <div className="flex-1 sm:hidden"></div>}

            {/* Delete Button - Right aligned */}
            <button
              onClick={() => setShowDeleteDialog(true)}
              className="flex items-center gap-2 px-5 py-3 bg-red-500/5 text-red-500 hover:bg-red-500 hover:text-white rounded-2xl transition-all font-semibold active:scale-95"
            >
              <Trash2 size={18} />
              <span>Delete</span>
            </button>
          </div>
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

              {/* Status Indicator - Smaller and better positioned */}
              <button
                onClick={handleToggleComplete}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer shadow-sm active:scale-95",
                  task.completed
                    ? "bg-green-500/10 border-green-500/20 text-green-600"
                    : "bg-surface border-border text-foreground hover:border-primary/50"
                )}
              >
                {task.completed ? (
                  <CheckCircle size={14} className="text-green-600" />
                ) : (
                  <Circle size={14} className="text-muted-foreground" />
                )}
                <span>{task.completed ? "Completed" : "Active"}</span>
              </button>
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
            <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground uppercase tracking-widest pl-1">
              <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
              Task Progress
            </div>
            <div className="bg-surface p-6 rounded-3xl border border-border/60 shadow-sm space-y-5">
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
                  disabled={isUnsuccessful}
                  onChange={(e) => setCompletionPercentage(Number(e.target.value))}
                  className="w-full accent-primary disabled:opacity-50"
                />
              </div>

              <label className="flex items-center gap-3 p-3 rounded-xl border border-border/60 bg-background cursor-pointer">
                <input
                  type="checkbox"
                  checked={isUnsuccessful}
                  onChange={(e) => setIsUnsuccessful(e.target.checked)}
                  className="w-5 h-5 rounded border-border text-primary focus:ring-primary/20"
                />
                <span className="text-sm font-medium text-foreground">
                  Mark as Unsuccessful
                </span>
              </label>

              <button
                type="button"
                onClick={handleSaveProgress}
                disabled={isSavingProgress}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50"
              >
                {isSavingProgress ? "Saving..." : "Save Progress"}
              </button>
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
    </Layout>
  );
}
