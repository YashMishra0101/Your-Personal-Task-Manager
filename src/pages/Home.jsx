import React, { useMemo, useState } from "react";
import { useTasks } from "../context/TaskContext";
import Layout from "../components/Layout";
import TaskCard from "../components/TaskCard";
import { Link } from "react-router-dom";
import { Plus, LayoutGrid, Calendar, Search } from "lucide-react";
import { format, parseISO, isSameDay } from "date-fns";
import { cn } from "../lib/utils";

export default function Home() {
  const { tasks, loading, reorderTasks } = useTasks();
  const [filterMode, setFilterMode] = useState("all"); // 'all' or 'by-date'
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [localOrderIds, setLocalOrderIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const activeTasks = tasks.filter((t) => {
    const isNotCompleted = !t.completed;
    const matchesSearch =
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.description || "").toLowerCase().includes(searchTerm.toLowerCase());
    return isNotCompleted && matchesSearch;
  });
  const tasksWithDeadlines = activeTasks.filter((t) => t.deadline);
  const orderedActiveTasks = useMemo(() => {
    // Context already sorts by manualOrder → createdAt desc.
    // We only need to overlay the ephemeral drag order (localOrderIds).
    if (localOrderIds.length === 0) return activeTasks;

    const taskById = new Map(activeTasks.map((task) => [task.id, task]));
    const activeTaskIds = new Set(activeTasks.map((task) => task.id));
    const contextOrder = activeTasks.map((task) => task.id);

    const mergedOrder = localOrderIds
      .filter((taskId) => activeTaskIds.has(taskId))
      .concat(contextOrder.filter((taskId) => !localOrderIds.includes(taskId)));

    return mergedOrder.map((taskId) => taskById.get(taskId)).filter(Boolean);
  }, [activeTasks, localOrderIds]);

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

  const handleDragStart = (taskId) => {
    setDraggedTaskId(taskId);
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
  };

  const handleDropTask = async (targetTaskId) => {
    if (!draggedTaskId || draggedTaskId === targetTaskId) return;

    const currentOrder = orderedActiveTasks.map((task) => task.id);
    const draggedIndex = currentOrder.indexOf(draggedTaskId);
    const targetIndex = currentOrder.indexOf(targetTaskId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const nextOrder = [...currentOrder];
    const [movedTaskId] = nextOrder.splice(draggedIndex, 1);
    nextOrder.splice(targetIndex, 0, movedTaskId);

    // Apply the drag order immediately for a responsive feel
    setLocalOrderIds(nextOrder);
    setDraggedTaskId(null);

    // Persist to Firestore, then clear the local override so the context's
    // canonical sort (manualOrder → createdAt desc) takes over.
    // This ensures any task created after a drag still appears at the top.
    await reorderTasks(nextOrder);
    setLocalOrderIds([]);
  };

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
      ) : tasks.filter(t => !t.completed).length > 0 ? (
        <div className="space-y-6">
          {/* Search Bar */}
          <div className="relative w-full max-w-2xl mx-auto sm:mx-0">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/60"
              size={18}
            />
            <input
              type="text"
              placeholder="Search your tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 bg-surface border border-border/50 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-hidden transition-all text-sm font-semibold shadow-sm"
            />
          </div>

          {activeTasks.length > 0 ? (
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

                {/* Active Tasks Counter */}
                <div className="bg-surface p-1.5 rounded-2xl border border-border/50 shadow-sm w-fit mb-0.5">
                  <span className="flex items-center px-4 py-2.5 rounded-xl font-semibold text-sm bg-primary text-primary-foreground shadow-md">
                    {activeTasks.length} {searchTerm ? "Matching Tasks" : "Active Tasks"}
                  </span>
                </div>
              </div>

              {/* Tasks Display */}
              {filterMode === "all" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {orderedActiveTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      draggable
                      isDragging={draggedTaskId === task.id}
                      onDragStart={() => handleDragStart(task.id)}
                      onDragEnd={handleDragEnd}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => handleDropTask(task.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-8">
                  {tasksWithDeadlines.length > 0 && (
                    <section>
                      <div className="flex items-center gap-3 mb-5 px-1">
                        <div className="h-1.5 w-1.5 rounded-full bg-orange-500"></div>
                        <h3 className="text-lg font-bold text-orange-500">Upcoming Deadlines</h3>
                        <div className="h-px flex-1 bg-linear-to-r from-border to-transparent"></div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {tasksWithDeadlines.map((task) => (
                          <TaskCard key={task.id} task={task} />
                        ))}
                      </div>
                    </section>
                  )}

                  {groupTasksByDate(activeTasks).map((group) => (
                    <section key={format(group.date, "yyyy-MM-dd")}>
                      <div className="flex items-center gap-3 mb-5 px-1">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
                        <h3 className="text-lg font-bold text-primary">{formatDateHeader(group.date)}</h3>
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
              <div className="w-20 h-20 bg-surface rounded-3xl flex items-center justify-center text-primary/20 mb-4 border border-border/50 shadow-xs">
                <Search size={32} />
              </div>
              <h3 className="text-xl font-bold text-primary mb-2">No matching tasks found</h3>
              <p className="text-muted-foreground max-w-xs mx-auto text-sm">
                Try adjusting your search terms or clear the filter.
              </p>
              <button 
                onClick={() => setSearchTerm("")}
                className="mt-6 text-primary font-bold hover:underline"
              >
                Clear search
              </button>
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
