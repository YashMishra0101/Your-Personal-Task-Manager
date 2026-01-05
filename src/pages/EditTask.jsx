import React, { useState, useEffect, useRef } from "react";
import { useTasks } from "../context/TaskContext";
import { useNavigate, useParams } from "react-router-dom";
import Layout from "../components/Layout";
import { format, endOfDay, addDays, startOfDay } from "date-fns";
import { Clock, Calendar as CalendarIcon } from "lucide-react";

export default function EditTask() {
  const { tasks, updateTask } = useTasks();
  const navigate = useNavigate();
  const { id } = useParams();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [taskNotFound, setTaskNotFound] = useState(false);

  const dateInputRef = useRef(null);

  useEffect(() => {
    const task = tasks.find((t) => t.id === id);
    if (task) {
      setTitle(task.title);
      setDescription(task.description || "");
      if (task.deadline) {
        const deadlineDate = new Date(task.deadline);
        setDate(format(deadlineDate, "yyyy-MM-dd"));
      }
    } else if (tasks.length > 0) {
      // Tasks are loaded but task not found
      setTaskNotFound(true);
    }
  }, [id, tasks]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);

    let deadline = null;
    if (date) {
      // User specified only date - default to end of that day (11:59:59 PM)
      const selectedDate = new Date(date);
      deadline = endOfDay(selectedDate).toISOString();
    }

    await updateTask(id, {
      title,
      description: description.trim(),
      deadline,
    });

    setIsSubmitting(false);
    navigate("/");
  };

  if (taskNotFound) {
    return (
      <Layout title="Edit Task">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-bold text-primary mb-2">
            Task Not Found
          </h3>
          <p className="text-muted-foreground max-w-xs mx-auto mb-6">
            The task you're looking for doesn't exist or has been deleted.
          </p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium shadow-lg hover:bg-primary/90 transition-colors"
          >
            Go to Home
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Edit Task">
      <form onSubmit={handleSubmit} className="space-y-6 mt-4">
        {/* Heading Field */}
        <div className="space-y-2">
          <label
            htmlFor="edit-title"
            className="text-sm font-medium text-muted-foreground"
          >
            Heading <span className="text-red-500">*</span>
          </label>
          <input
            id="edit-title"
            type="text"
            placeholder="e.g. Update documentation"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-4 rounded-xl bg-muted/50 border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 text-lg placeholder:text-muted-foreground/50 text-primary transition-all"
            required
            autoFocus
          />
        </div>

        {/* Description Field */}
        <div className="space-y-2">
          <label
            htmlFor="edit-description"
            className="text-sm font-medium text-muted-foreground"
          >
            Description <span className="text-xs">(Optional)</span>
          </label>
          <textarea
            id="edit-description"
            placeholder="Add more details about this task..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full p-4 rounded-xl bg-muted/50 border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 text-base placeholder:text-muted-foreground/50 text-primary transition-all resize-none"
          />
        </div>

        <div className="grid grid-cols-1 gap-4">
          {/* Deadline Field */}
          <div className="space-y-2">
            <label
              htmlFor="edit-date"
              className="text-sm font-medium text-muted-foreground"
            >
              Deadline
            </label>
            <div className="relative">
              <input
                id="edit-date"
                ref={dateInputRef}
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-3 pr-12 rounded-xl bg-muted/50 border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 text-primary transition-all"
              />
              <CalendarIcon
                size={20}
                onClick={() => dateInputRef.current?.showPicker()}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground cursor-pointer hover:text-primary transition-colors"
              />
            </div>
          </div>
        </div>

        <div className="pt-8 flex gap-3">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex-1 py-4 bg-surface border border-border text-primary rounded-xl font-bold hover:bg-surface-hover transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !title}
            className="flex-1 py-4 bg-primary text-primary-foreground rounded-xl font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </Layout>
  );
}
