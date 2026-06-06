import React, { useState } from "react";
import { useTasks } from "../context/TaskContext";
import { formatDeadlineDisplay, getRemainingTime } from "../lib/timeUtils";
import {
  Check,
  Clock,
  Calendar,
  RotateCcw,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../lib/utils";
import { isPast, parseISO } from "date-fns";
import { Link, useNavigate } from "react-router-dom";
import OutcomeDialog from "./OutcomeDialog";
import { toast } from "sonner";

export default function TaskCard({
  task,
  draggable = false,
  isDragging = false,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}) {
  const { toggleTaskCompletion, markTaskOutcome } = useTasks();
  const navigate = useNavigate();
  const [showOutcomeDialog, setShowOutcomeDialog] = useState(false);
  const isOverdue = task.deadline && isPast(parseISO(task.deadline));
  const completionPercentage =
    typeof task.completionPercentage === "number"
      ? task.completionPercentage
      : task.completed
      ? 100
      : 0;
  const completionLabel = task.progressDisabled
    ? "Progress disabled"
    : task.isUnsuccessful
    ? "Unsuccessful"
    : `${completionPercentage}% complete`;

  const handleLeftIconClick = async (e) => {
    e.stopPropagation();
    try {
      if (task.completed) {
        await toggleTaskCompletion(task.id, true);
        toast.success("Task moved to active");
      } else {
        setShowOutcomeDialog(true);
      }
    } catch (error) {
      toast.error("Failed to update task");
    }
  };

  const handleOutcome = async (isSuccessful) => {
    try {
      await markTaskOutcome(task.id, isSuccessful);
      toast.success(isSuccessful ? "Task completed successfully" : "Task marked as not completed");
    } catch (error) {
      toast.error("Failed to update task");
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
        draggable={draggable}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onClick={handleCardClick}
        className={cn(
          "group flex items-center p-4 mb-3 bg-surface hover:bg-surface-hover rounded-2xl shadow-sm border border-border transition-all cursor-pointer relative overflow-hidden active:scale-[0.98]",
          task.completed ? "opacity-60" : "",
          isDragging ? "opacity-60" : ""
        )}
      >
        {/* Checkbox */}
        <button
          onClick={handleLeftIconClick}
          className={cn(
            "shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors mr-4 z-10",
            task.completed
              ? task.isUnsuccessful
                ? "bg-red-500 border-red-500"
                : "bg-primary border-primary"
              : "border-muted-foreground/30 group-hover:border-primary"
          )}
          aria-label={
            task.completed ? "Reactivate task" : "Mark as complete"
          }
        >
          {task.completed && (
            task.isUnsuccessful ? (
              <X
                size={14}
                className="text-white"
                strokeWidth={3}
              />
            ) : (
              <Check
                size={14}
                className="text-primary-foreground"
                strokeWidth={3}
              />
            )
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
          {task.completed && !task.progressDisabled && (
            <p className="mt-1 text-[11px] font-semibold text-muted-foreground">
              {completionLabel}
            </p>
          )}

          {/* Subtasks Progress (if any) */}
          {task.subtasks && task.subtasks.length > 0 && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent transition-all duration-300"
                  style={{
                    width: `${(task.subtasks.filter(st => st.completed).length / task.subtasks.length) * 100}%`
                  }}
                ></div>
              </div>
              <span className="text-xs text-muted-foreground font-medium tabular-nums">
                {task.subtasks.filter(st => st.completed).length}/{task.subtasks.length}
              </span>
            </div>
          )}

          {!task.completed && task.deadline && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs mt-1">
              <span className={cn(
                "flex items-center space-x-1",
                isOverdue ? "text-red-500" : "text-muted-foreground"
              )}>
                {(task.timeValue && !task.dateValue && task.dateValue !== undefined) ? (
                  <Clock size={12} />
                ) : (
                  <Calendar size={12} />
                )}
                <span>{formatDeadlineDisplay(task.deadline, task.timeValue, task.dateValue)}</span>
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
        <div className="shrink-0 ml-2 z-10 flex items-center">
          {task.completed && (
            <button
              onClick={handleLeftIconClick}
              title="Reactivate Task"
              className="p-1.5 text-accent bg-accent/10 hover:bg-accent hover:text-white rounded-lg transition-colors shadow-sm"
            >
              <RotateCcw size={16} />
            </button>
          )}
        </div>
      </motion.div>

      <OutcomeDialog
        isOpen={showOutcomeDialog}
        onClose={() => setShowOutcomeDialog(false)}
        onOutcome={handleOutcome}
      />
    </>
  );
}
