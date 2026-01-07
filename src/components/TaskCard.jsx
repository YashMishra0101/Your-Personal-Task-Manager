import React, { useState } from "react";
import { useTasks } from "../context/TaskContext";
import { formatDeadlineDisplay, getRemainingTime } from "../lib/timeUtils";
import {
  Check,
  Clock,
  Calendar,
  Trash2,
  Pencil,
  RotateCcw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../lib/utils";
import { isPast, parseISO } from "date-fns";
import { Link, useNavigate } from "react-router-dom";
import ConfirmDialog from "./ConfirmDialog";
import { toast } from "sonner";

export default function TaskCard({ task }) {
  const { toggleTaskCompletion, deleteTask } = useTasks();
  const navigate = useNavigate();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const isOverdue = task.deadline && isPast(parseISO(task.deadline));

  const handleToggleComplete = async (e) => {
    e.stopPropagation();
    try {
      await toggleTaskCompletion(task.id, task.completed);
      toast.success(task.completed ? "Task moved to active" : "Task completed");
    } catch (error) {
      toast.error("Failed to update task");
    }
  };

  const handleDelete = async (e) => {
    e?.stopPropagation();
    try {
      await deleteTask(task.id);
      toast.success("Task deleted successfully");
    } catch (error) {
      toast.error("Failed to delete task");
    }
  };

  const handleCardClick = () => {
    navigate(`/task/${task.id}`);
  };

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, x: -100 }}
        onClick={handleCardClick}
        className={cn(
          "group flex items-center p-4 mb-3 bg-surface hover:bg-surface-hover rounded-2xl shadow-sm border border-border transition-all cursor-pointer relative overflow-hidden active:scale-[0.98]",
          task.completed ? "opacity-60" : ""
        )}
      >
        {/* Checkbox */}
        <button
          onClick={handleToggleComplete}
          className={cn(
            "shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors mr-4 z-10",
            task.completed
              ? "bg-primary border-primary"
              : "border-muted-foreground/30 group-hover:border-primary"
          )}
          aria-label={
            task.completed ? "Mark as incomplete" : "Mark as complete"
          }
        >
          {task.completed && (
            <Check
              size={14}
              className="text-primary-foreground"
              strokeWidth={3}
            />
          )}
        </button>

        {/* Info */}
        <div className="flex-1 min-w-0 z-10">
          <h3
            className={cn(
              "text-base font-medium wrap-break-word line-clamp-2 transition-all",
              task.completed
                ? "line-through text-muted-foreground"
                : "text-primary"
            )}
          >
            {task.title}
          </h3>

          {!task.completed && task.deadline && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs mt-1">
              <span className={cn(
                "flex items-center space-x-1",
                isOverdue ? "text-red-500" : "text-muted-foreground"
              )}>
                <Calendar size={12} />
                <span>{formatDeadlineDisplay(task.deadline)}</span>
              </span>
              {(() => {
                const timeRemaining = getRemainingTime(
                  task.deadline,
                  task.includeLastDay
                );
                const isLastDay = timeRemaining === "LAST_DAY";
                return (
                  <span className={cn(
                    "flex items-center space-x-1 font-medium",
                    isOverdue ? "text-red-500" : "text-muted-foreground"
                  )}>
                    <Clock size={12} />
                    {isLastDay ? (
                      <span>
                        1 day remaining{" "}
                        <span className="text-red-500 font-bold">
                          (Last Day)
                        </span>
                      </span>
                    ) : (
                      <span>{timeRemaining}</span>
                    )}
                  </span>
                );
              })()}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div
          className={cn(
            "shrink-0 ml-2 z-10",
            task.completed ? "flex" : "hidden group-hover:flex"
          )}
        >
          {task.completed ? (
            <button
              onClick={handleToggleComplete}
              title="Reactivate Task"
              className="p-1.5 text-accent bg-accent/10 hover:bg-accent hover:text-white rounded-lg transition-colors shadow-sm"
            >
              <RotateCcw size={16} />
            </button>
          ) : (
            <div className="flex items-center gap-1">
              <Link
                to={`/edit/${task.id}`}
                onClick={(e) => e.stopPropagation()}
                className="p-1.5 text-muted-foreground hover:text-accent hover:bg-accent/10 rounded-lg transition-colors"
              >
                <Pencil size={16} />
              </Link>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteDialog(true);
                }}
                className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
          )}
        </div>
      </motion.div>

      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Delete Task"
        message={`Are you sure you want to delete "${task.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </>
  );
}
