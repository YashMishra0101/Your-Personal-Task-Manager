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
import {
  format,
  isPast,
  parseISO,
  differenceInDays,
  intervalToDuration,
  addDays,
} from "date-fns";
import { getRemainingTime, formatDeadlineDisplay } from "../lib/timeUtils";
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

  const timeLeft = getRemainingTime(task.deadline);
  const isOverdue = task.deadline && isPast(parseISO(task.deadline));

  const getDetailedTimeLeft = (deadline) => {
    if (!deadline) return null;
    const end = parseISO(deadline);
    const now = new Date();

    if (isPast(end)) return { days: 0, hours: 0, minutes: 0, isOverdue: true };

    const days = differenceInDays(end, now);

    // add days to start to get the remainder duration
    const daysAdded = addDays(now, days);

    // Get the duration for the remainder
    const duration = intervalToDuration({
      start: daysAdded,
      end: end,
    });

    const hours = duration.hours || 0;
    const minutes = duration.minutes || 0;

    return { days, hours, minutes, isOverdue: false };
  };

  const timeDetails = getDetailedTimeLeft(task.deadline);

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
      <div className="max-w-3xl mx-auto space-y-8 mt-6 pb-24 md:pb-12 px-4">
        {/* Header Section */}
        <div className="flex items-start justify-between gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 text-muted-foreground hover:text-primary hover:bg-surface-hover rounded-xl transition-all"
            aria-label="Go back"
          >
            <ArrowLeft size={24} />
          </button>

          <div className="flex gap-2">
            {!task.completed && (
              <Link
                to={`/edit/${task.id}`}
                className="p-2.5 text-primary bg-primary/10 hover:bg-primary hover:text-white rounded-xl transition-all shadow-sm active:scale-95"
              >
                <Pencil size={20} />
              </Link>
            )}
            <button
              onClick={() => setShowDeleteDialog(true)}
              className="p-2.5 text-red-500 bg-red-500/10 hover:bg-red-500 hover:text-white rounded-xl transition-all shadow-sm active:scale-95"
            >
              <Trash2 size={20} />
            </button>
          </div>
        </div>

        {/* Priority/Status Badge */}
        <div className="flex flex-wrap items-center gap-4">
          <button
            onClick={handleToggleComplete}
            className={cn(
              "flex items-center space-x-2.5 px-5 py-2.5 rounded-full text-sm font-bold transition-all shadow-md active:scale-95",
              task.completed
                ? "bg-primary text-primary-foreground"
                : "bg-surface border-2 border-primary text-primary hover:bg-primary/5"
            )}
          >
            {task.completed ? <CheckCircle size={18} /> : <Circle size={18} />}
            <span>{task.completed ? "Completed" : "Active Task"}</span>
          </button>

          {task.completed && (
            <button
              onClick={handleToggleComplete}
              className="flex items-center space-x-2 px-4 py-2 text-sm font-semibold bg-accent/10 text-accent hover:bg-accent hover:text-white rounded-xl transition-all shadow-sm"
              title="Reactivate Task"
            >
              <RotateCcw size={18} />
              <span>Reactivate</span>
            </button>
          )}
        </div>

        {/* Task Content */}
        <div className="space-y-8">
          <h1
            className={cn(
              "text-3xl md:text-5xl font-black break-words break-all leading-tight tracking-tight",
              task.completed
                ? "line-through text-muted-foreground/50"
                : "text-primary bg-linear-to-br from-primary to-primary/70 bg-clip-text"
            )}
          >
            {task.title}
          </h1>

          {/* Description Card */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 flex items-center gap-2">
              <span className="w-8 h-[2px] bg-primary/50 rounded-full"></span>
              Description
            </h4>
            <div className="bg-surface p-8 rounded-4xl border border-border shadow-sm text-lg leading-relaxed whitespace-pre-wrap break-words break-all text-foreground/90">
              {task.description || (
                <span className="text-muted-foreground/40 italic flex items-center gap-2">
                  No description provided.
                </span>
              )}
            </div>
          </div>

          {/* Details Card (Consolidated) */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 flex items-center gap-2">
              <span className="w-8 h-[2px] bg-accent/50 rounded-full"></span>
              Timeline
            </h4>

            <div className="bg-surface p-6 rounded-4xl border border-border shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border/50 gap-6 md:gap-0">
                {/* Created At */}
                <div className="flex flex-col items-center justify-center p-4 text-center space-y-2">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Created On
                  </span>
                  <div className="p-3 bg-muted/20 rounded-2xl text-muted-foreground mb-1">
                    <CalendarCheck size={28} />
                  </div>
                  <div>
                    <span className="font-bold text-lg text-primary block">
                      {task.createdAt
                        ? format(parseISO(task.createdAt), "MMM d, yyyy")
                        : "N/A"}
                    </span>
                    <span className="text-sm text-muted-foreground font-medium">
                      {task.createdAt
                        ? format(parseISO(task.createdAt), "h:mm a")
                        : ""}
                    </span>
                  </div>
                </div>

                {/* Deadline Days */}
                {task.deadline && (
                  <div className="flex flex-col items-center justify-center p-4 text-center space-y-2">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Days Remaining
                    </span>
                    <div className="p-3 bg-accent/10 rounded-2xl text-accent mb-1">
                      <Calendar size={28} />
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span
                        className={cn(
                          "font-black text-4xl",
                          timeDetails?.isOverdue
                            ? "text-red-500"
                            : "text-primary"
                        )}
                      >
                        {timeDetails?.days}
                      </span>
                      <span className="text-sm font-bold text-muted-foreground">
                        Days
                      </span>
                    </div>
                  </div>
                )}

                {/* Deadline Hours/Mins */}
                {task.deadline && (
                  <div className="flex flex-col items-center justify-center p-4 text-center space-y-2">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Time Left
                    </span>
                    <div className="p-3 bg-primary/10 rounded-2xl text-primary mb-1">
                      <Clock size={28} />
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span
                        className={cn(
                          "font-black text-3xl",
                          timeDetails?.isOverdue
                            ? "text-red-500"
                            : "text-primary"
                        )}
                      >
                        {timeDetails?.hours}
                      </span>
                      <span className="text-xs font-bold text-muted-foreground mr-2">
                        hr
                      </span>
                      <span
                        className={cn(
                          "font-black text-3xl",
                          timeDetails?.isOverdue
                            ? "text-red-500"
                            : "text-primary"
                        )}
                      >
                        {timeDetails?.minutes}
                      </span>
                      <span className="text-xs font-bold text-muted-foreground">
                        min
                      </span>
                    </div>
                  </div>
                )}
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
