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

  const getDetailedTimeLeft = (deadline) => {
    if (!deadline) return null;
    const end = parseISO(deadline);
    const now = new Date();

    if (isPast(end)) return { days: 0, isOverdue: true };

    const totalMinutes = differenceInMinutes(end, now);
    // Add 1 to include the deadline day itself (inclusive calculation)
    const days = Math.floor(totalMinutes / (24 * 60)) + 1;

    return { days, isOverdue: false };
  };

  const timeDetails = getDetailedTimeLeft(task.deadline);
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
      <div className="max-w-5xl mx-auto px-4 py-8 pb-24">
        {/* Navigation & Actions Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate(-1)}
            className="group flex items-center gap-2 px-3 py-2 -ml-7 md:-ml-3 mr-2 md:mr-0 text-muted-foreground hover:text-primary rounded-xl transition-all"
          >
            <div className="p-2 bg-surface group-hover:bg-surface-hover rounded-full transition-colors border border-transparent group-hover:border-border">
              <ArrowLeft size={20} />
            </div>
            <span className="font-medium hidden sm:inline">Back</span>
          </button>

          <div className="flex items-center gap-3 -mr-4 md:mr-0">
            {!task.completed && (
              <Link
                to={`/edit/${task.id}`}
                className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 bg-surface border border-border hover:border-primary/50 text-foreground hover:text-primary rounded-xl transition-all shadow-sm active:scale-95 text-sm font-semibold"
              >
                <Pencil size={18} />
                <span className="hidden sm:inline">Edit</span>
              </Link>
            )}
            <button
              onClick={() => setShowDeleteDialog(true)}
              className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 bg-surface border border-border hover:border-red-500/50 text-foreground hover:text-red-500 rounded-xl transition-all shadow-sm active:scale-95 text-sm font-semibold"
            >
              <Trash2 size={18} />
              <span className="hidden sm:inline">Delete</span>
            </button>
          </div>
        </div>

        {/* Hero Section */}
        <div className="mb-12 space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleToggleComplete}
              className={cn(
                "inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold border transition-all cursor-pointer",
                task.completed
                  ? "bg-primary/10 border-primary/20 text-primary"
                  : "bg-surface border-border text-muted-foreground hover:border-primary/50 hover:text-primary"
              )}
            >
              {task.completed ? (
                <CheckCircle size={16} />
              ) : (
                <Circle size={16} />
              )}
              <span>{task.completed ? "Completed" : "Active"}</span>
            </button>
            {isOverdue && !task.completed && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-red-500/10 text-red-500 border border-red-500/20">
                <Clock size={14} />
                Overdue
              </span>
            )}
          </div>

          <h1
            className={cn(
              "text-4xl md:text-5xl font-black tracking-tight leading-tight text-foreground break-words break-all",
              task.completed && "opacity-60 decoration-4 decoration-primary/30"
            )}
          >
            {task.title}
          </h1>
        </div>

        {/* Content Section */}
        <div className="space-y-8 md:space-y-12">
          {/* Description */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <span className="w-1 h-4 bg-primary rounded-full"></span>
              Description
            </h3>
            <div className="bg-surface/50 backdrop-blur-sm p-8 rounded-3xl border border-border/50 text-lg leading-relaxed text-foreground/90 whitespace-pre-wrap shadow-sm break-words break-all">
              {task.description ? (
                task.description
              ) : (
                <span className="text-muted-foreground italic">
                  No description provided for this task.
                </span>
              )}
            </div>
          </div>

          {/* Timeline Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-12 md:gap-8">
            {/* Target Date */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <span className="w-1 h-4 bg-accent rounded-full"></span>
                Target Date
              </h3>
              <div className="bg-surface p-6 rounded-3xl border border-border shadow-sm h-full">
                {task.deadline ? (
                  <div className="flex items-start gap-4">
                    <div
                      className={cn(
                        "p-3 rounded-2xl",
                        isOverdue
                          ? "bg-red-500/10 text-red-500"
                          : "bg-primary/10 text-primary"
                      )}
                    >
                      <Calendar size={28} />
                    </div>
                    <div>
                      <div
                        className={cn(
                          "font-bold text-2xl md:text-3xl tabular-nums",
                          isOverdue ? "text-red-500" : "text-primary"
                        )}
                      >
                        {formatDeadlineDisplay(task.deadline)}
                      </div>
                      <div className="text-xs font-medium mt-1 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-muted/50 text-muted-foreground">
                        <Clock size={12} />
                        {isOverdue
                          ? "Overdue"
                          : `${timeDetails?.days} days remaining`}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-4 opacity-50">
                    <div className="p-3 bg-muted/30 rounded-2xl text-muted-foreground">
                      <Calendar size={28} />
                    </div>
                    <div>
                      <div className="font-medium text-foreground text-xl">
                        No Deadline Set
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Created On */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <span className="w-1 h-4 bg-muted-foreground/50 rounded-full"></span>
                Created On
              </h3>
              <div className="bg-surface p-6 rounded-3xl border border-border shadow-sm h-full flex items-center">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-muted/30 rounded-2xl text-muted-foreground">
                    <CalendarCheck size={28} />
                  </div>
                  <div>
                    <div className="font-bold text-2xl md:text-3xl tabular-nums text-foreground">
                      {task.createdAt
                        ? format(parseISO(task.createdAt), "EEE, MMM d")
                        : "N/A"}
                    </div>
                    <div className="text-xs font-medium mt-1 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-muted/50 text-muted-foreground">
                      <Clock size={12} />
                      {task.createdAt
                        ? format(parseISO(task.createdAt), "h:mm a")
                        : ""}
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
