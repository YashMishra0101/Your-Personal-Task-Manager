import React, { useState } from "react";
import { useTasks } from "../context/TaskContext";
import Layout from "../components/Layout";
import TaskCard from "../components/TaskCard";
import { Link } from "react-router-dom";
import { Plus, LayoutGrid, Calendar } from "lucide-react";
import { format, parseISO, isSameDay } from "date-fns";
import { cn } from "../lib/utils";

export default function Home() {
  const { tasks, loading } = useTasks();
  const [filterMode, setFilterMode] = useState("all"); // 'all' or 'by-date'

  const activeTasks = tasks.filter((t) => !t.completed);

  // Group tasks by date
  const groupTasksByDate = (tasksList) => {
    const grouped = {};

    tasksList.forEach((task) => {
      if (!task.createdAt) return;

      const taskDate = parseISO(task.createdAt);
      const dateKey = format(taskDate, "yyyy-MM-dd");

      if (!grouped[dateKey]) {
        grouped[dateKey] = {
          date: taskDate,
          tasks: [],
        };
      }

      grouped[dateKey].tasks.push(task);
    });

    // Sort by date (newest first)
    return Object.values(grouped).sort((a, b) => b.date - a.date);
  };

  const tasksByDate = groupTasksByDate(activeTasks);

  const formatDateHeader = (date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (isSameDay(date, today)) {
      return "Today";
    } else if (isSameDay(date, yesterday)) {
      return "Yesterday";
    } else {
      return format(date, "EEEE, MMMM d, yyyy");
    }
  };

  return (
    <Layout title="My Tasks">
      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground animate-pulse">
          <div className="h-4 w-32 bg-surface-hover rounded mb-2"></div>
          <div className="h-4 w-24 bg-surface-hover rounded"></div>
        </div>
      ) : activeTasks.length > 0 ? (
        <div className="space-y-6">
          {/* Filter Toggle + Active Tasks */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            {/* Filter Toggle */}
            <div className="flex items-center bg-surface p-1.5 rounded-2xl border border-border/50 shadow-sm w-fit">
              <button
                onClick={() => setFilterMode("all")}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200",
                  filterMode === "all"
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:text-primary hover:bg-surface-hover"
                )}
              >
                <LayoutGrid size={16} strokeWidth={2.5} />
                <span>All Tasks</span>
              </button>
              <button
                onClick={() => setFilterMode("by-date")}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200",
                  filterMode === "by-date"
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:text-primary hover:bg-surface-hover"
                )}
              >
                <Calendar size={16} strokeWidth={2.5} />
                <span>By Date</span>
              </button>
            </div>

            {/* Active Tasks */}
            <div className="bg-surface p-1.5 rounded-2xl border border-border/50 shadow-sm w-fit mb-0.5">
              <span className="flex items-center px-4 py-2.5 rounded-xl font-semibold text-sm bg-primary text-primary-foreground shadow-md">
                {activeTasks.length} Active Tasks
              </span>
            </div>
          </div>

          {/* Tasks Display */}
          {filterMode === "all" ? (
            // All Tasks View - No Grouping
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeTasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          ) : (
            // By Date View - Grouped by Creation Date
            <div className="space-y-8">
              {tasksByDate.map((group) => (
                <section key={format(group.date, "yyyy-MM-dd")}>
                  <div className="flex items-center gap-3 mb-5 px-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
                    <h3 className="text-lg font-bold text-primary">
                      {formatDateHeader(group.date)}
                    </h3>
                    <div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold">
                      {group.tasks.length}
                    </div>
                    <div className="h-px flex-1 bg-linear-to-r from-border to-transparent"></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {group.tasks.map((task) => (
                      <TaskCard key={task.id} task={task} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-48 h-48 mb-6 bg-surface-hover rounded-full flex items-center justify-center border border-border">
            <div className="text-6xl">✨</div>
          </div>
          <h3 className="text-xl font-bold text-primary mb-2">
            All Caught Up!
          </h3>
          <p className="text-muted-foreground max-w-xs mx-auto">
            You have no active tasks. Tap the + button to add a new one.
          </p>

          <Link
            to="/add"
            className="mt-8 px-6 py-3 bg-primary text-primary-foreground rounded-full font-medium shadow-lg hover:bg-primary/90 transition-colors flex items-center"
          >
            <Plus className="mr-2" size={20} /> Add Task
          </Link>
        </div>
      )}
    </Layout>
  );
}
