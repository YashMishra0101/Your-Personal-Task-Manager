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
  Bell,
} from "lucide-react";
import { format, isPast, parseISO, differenceInMinutes } from "date-fns";
import { formatDeadlineDisplay } from "../lib/timeUtils";
import { cn } from "../lib/utils";
import ConfirmDialog from "../components/ConfirmDialog";
import { toast } from "sonner";

export default function TaskDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { tasks, toggleTaskCompletion, deleteTask } = useTasks();

  const [task, setTask] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const foundTask = tasks.find((t) => t.id === id);
    if (foundTask) {
      setTask(foundTask);
    }
    setLoading(false);
  }, [id, tasks]);

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

  return (
    <Layout title="Task Details">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 pb-24">
        {/* Navigation & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-muted-foreground hover:text-primary transition-colors group self-start sm:self-auto"
          >
            <div className="p-2 rounded-full group-hover:bg-primary/10 transition-colors">
              <ArrowLeft size={24} />
            </div>
            <span className="font-semibold text-lg ml-2">Back</span>
          </button>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            {!task.completed && (
              <Link
                to={`/edit/${task.id}`}
                className="flex items-center gap-2 px-5 py-3 bg-primary/5 text-primary hover:bg-primary hover:text-white rounded-2xl transition-all font-semibold active:scale-95"
              >
                <Pencil size={18} />
                <span>Edit</span>
              </Link>
            )}
            <button
              onClick={() => setShowDeleteDialog(true)}
              className="flex items-center gap-2 px-5 py-3 bg-red-500/5 text-red-500 hover:bg-red-500 hover:text-white rounded-2xl transition-all font-semibold active:scale-95"
            >
              <Trash2 size={18} />
              <span>Delete</span>
            </button>
          </div>
        </div>

        {/* Header - Status & Title */}
        <div className="mb-12">
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <button
              onClick={handleToggleComplete}
              className={cn(
                "inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold border transition-all cursor-pointer shadow-sm active:scale-95",
                task.completed
                  ? "bg-green-500/10 border-green-500/20 text-green-600"
                  : "bg-surface border-border text-foreground hover:border-primary/50"
              )}
            >
              {task.completed ? (
                <CheckCircle size={18} className="text-green-600" />
              ) : (
                <Circle size={18} className="text-muted-foreground" />
              )}
              <span>{task.completed ? "Completed" : "Active Task"}</span>
            </button>

            {isOverdue && !task.completed && (
              <span className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-bold bg-red-500/10 text-red-500 border border-red-500/20">
                <Clock size={16} />
                Overdue
              </span>
            )}
          </div>

          <h1
            className={cn(
              "text-5xl md:text-6xl font-black tracking-tight leading-[1.1] text-foreground wrap-break-word break-all",
              task.completed && "opacity-50 decoration-4 decoration-current line-through"
            )}
          >
            {task.title}
          </h1>
        </div>

        {/* Content Section */}
        <div className="grid grid-cols-1 gap-10">

          {/* Description Card */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground uppercase tracking-widest pl-1">
              <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
              Description
            </div>
            <div className="bg-surface p-8 rounded-4xl border border-border/60 shadow-sm">
              <p className={cn(
                "text-lg leading-relaxed whitespace-pre-wrap wrap-break-word break-all",
                task.description ? "text-foreground/90" : "text-muted-foreground italic"
              )}>
                {task.description || "No specific details provided for this task."}
              </p>
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
              <div className="bg-surface p-6 rounded-4xl border border-border/60 shadow-sm h-full flex flex-col justify-center min-h-[140px]">
                {task.deadline ? (
                  <div className="flex items-center gap-5">
                    <div className={cn(
                      "p-4 rounded-2xl shrink-0",
                      isOverdue ? "bg-red-500/10 text-red-500" : "bg-blue-500/10 text-blue-600"
                    )}>
                      <Calendar size={32} strokeWidth={1.5} />
                    </div>
                    <div>
                      <div className="text-2xl font-bold tabular-nums text-foreground">
                        {formatDeadlineDisplay(task.deadline)}
                      </div>
                      <div className={cn(
                        "text-sm font-medium mt-1 inline-flex items-center gap-1.5",
                        isOverdue ? "text-red-500" : "text-muted-foreground"
                      )}>
                        {isOverdue ? (
                          "Overdue"
                        ) : timeDetails?.isLastDay ? (
                          <span className="flex items-center gap-1.5">
                            <Clock size={14} /> 1 day left <span className="text-red-500 font-bold text-xs bg-red-50 px-1.5 py-0.5 rounded ml-1">Last Day</span>
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
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground uppercase tracking-widest pl-1">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                Created On
              </div>
              <div className="bg-surface p-6 rounded-4xl border border-border/60 shadow-sm h-full flex flex-col justify-center min-h-[140px]">
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

            {/* Alarm Settings - Full Width if Set */}
            {task.alarm && task.alarm.enabled && (
              <div className="space-y-3 md:col-span-2 mt-6">
                <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground uppercase tracking-widest pl-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                  Alarm
                </div>
                <div className="bg-surface p-6 rounded-4xl border border-border/60 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center gap-5">
                    <div className="p-4 bg-orange-500/10 rounded-2xl text-orange-600 shrink-0">
                      <Bell size={32} strokeWidth={1.5} />
                    </div>
                    <div>
                      <div className="text-3xl font-black tabular-nums text-foreground">
                        {task.alarm.time}
                      </div>
                      <div className="text-sm font-medium text-muted-foreground mt-1 flex items-center gap-1.5">
                        <Calendar size={14} />
                        {task.alarm.date ? format(new Date(task.alarm.date), "EEEE, MMMM d") : ""}
                      </div>
                    </div>
                  </div>

                  {task.alarm.triggered ? (
                    <div className="px-4 py-2 bg-orange-500/10 text-orange-600 rounded-xl font-bold text-sm border border-orange-500/20">
                      Ringed
                    </div>
                  ) : (
                    <div className="px-4 py-2 bg-green-500/10 text-green-600 rounded-xl font-bold text-sm border border-green-500/20">
                      Active
                    </div>
                  )}
                </div>
              </div>
            )}
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
