import React, { useState, useEffect, useRef } from "react";
import { useTasks } from "../context/TaskContext";
import { useNavigate, useParams } from "react-router-dom";
import Layout from "../components/Layout";
import { format, endOfDay } from "date-fns";
import { Calendar as CalendarIcon, Plus, CheckSquare } from "lucide-react";
import SubtaskEditItem from "../components/SubtaskEditItem";

export default function EditTask() {
  const { tasks, updateTask } = useTasks();
  const navigate = useNavigate();
  const { id } = useParams();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [includeLastDay, setIncludeLastDay] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [taskNotFound, setTaskNotFound] = useState(false);

  // Subtasks state
  const [subtasks, setSubtasks] = useState([]);
  const [newSubtaskText, setNewSubtaskText] = useState("");

  const dateInputRef = useRef(null);

  useEffect(() => {
    const task = tasks.find((t) => t.id === id);
    if (task) {
      setTitle(task.title);
      setDescription(task.description || "");
      setIncludeLastDay(
        task.includeLastDay !== undefined ? task.includeLastDay : true
      );
      setSubtasks(task.subtasks || []);
      if (task.deadline) {
        const deadlineDate = new Date(task.deadline);
        setDate(format(deadlineDate, "yyyy-MM-dd"));
      }
    } else if (tasks.length > 0) {
      setTaskNotFound(true);
    }
  }, [id, tasks]);

  // Add new subtask
  const addSubtask = () => {
    if (!newSubtaskText.trim()) return;

    const newSubtask = {
      id: Date.now().toString(),
      text: newSubtaskText.trim(),
      completed: false,
    };

    setSubtasks([...subtasks, newSubtask]);
    setNewSubtaskText("");
  };

  // Update subtask text
  const updateSubtaskText = (subtaskId, newText) => {
    setSubtasks(subtasks.map(st =>
      st.id === subtaskId ? { ...st, text: newText } : st
    ));
  };

  // Remove subtask
  const removeSubtask = (subtaskId) => {
    setSubtasks(subtasks.filter(st => st.id !== subtaskId));
  };

  // Handle Enter key in subtask input
  const handleSubtaskKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addSubtask();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);

    let deadline = null;
    if (date) {
      const selectedDate = new Date(date);
      deadline = endOfDay(selectedDate).toISOString();
    }

    await updateTask(id, {
      title,
      description: description.trim(),
      deadline,
      includeLastDay,
      subtasks: subtasks.length > 0 ? subtasks : null,
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
            className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold"
          >
            Go Home
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
          <label className="text-sm font-medium text-muted-foreground">
            Heading <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="e.g. Complete project proposal"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-4 rounded-xl bg-muted/50 border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 text-lg placeholder:text-muted-foreground/50 text-primary transition-all"
            required
          />
        </div>

        {/* Description Field */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">
            Description (Optional)
          </label>
          <textarea
            placeholder="Add more details about your task..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full p-4 rounded-xl bg-muted/50 border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/50 text-primary resize-none transition-all"
          />
        </div>

        {/* Subtasks Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
            <label className="text-foreground">Subtasks / Checklist (Optional)</label>
          </div>
          <div className="p-4 bg-background border border-border rounded-xl space-y-3 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 transition-all">
            {/* Add Subtask Input */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add a subtask..."
                value={newSubtaskText}
                onChange={(e) => setNewSubtaskText(e.target.value)}
                onKeyPress={handleSubtaskKeyPress}
                className="flex-1 p-3 rounded-xl bg-muted/50 border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm placeholder:text-muted-foreground/50 text-primary transition-all"
              />
              <button
                type="button"
                onClick={addSubtask}
                disabled={!newSubtaskText.trim()}
                className="px-4 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
              >
                <Plus size={18} strokeWidth={2.5} />
                <span className="hidden sm:inline">Add</span>
              </button>
            </div>

            {/* Subtasks List */}
            {subtasks.length > 0 && (
              <div className="space-y-2 pt-2">
                {subtasks.map((subtask) => (
                  <SubtaskEditItem
                    key={subtask.id}
                    subtask={subtask}
                    onUpdate={(id, newText) => updateSubtaskText(id, newText)}
                    onRemove={removeSubtask}
                  />
                ))}
                <div className="text-xs text-muted-foreground pt-1 flex items-center gap-1.5">
                  <CheckSquare size={12} />
                  <span>{subtasks.length} subtask{subtasks.length !== 1 ? 's' : ''} added</span>
                </div>
              </div>
            )}
          </div>
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

          {/* Include Last Day Toggle */}
          {date && (
            <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-xl border border-border">
              <input
                type="checkbox"
                id="edit-includeLastDay"
                checked={includeLastDay}
                onChange={(e) => setIncludeLastDay(e.target.checked)}
                className="w-5 h-5 mt-0.5 rounded border-border text-primary focus:ring-2 focus:ring-primary/20 cursor-pointer"
              />
              <label
                htmlFor="edit-includeLastDay"
                className="text-sm text-foreground cursor-pointer flex-1"
              >
                <span className="font-medium">
                  Include deadline day in remaining days count
                </span>
                <span className="block text-xs text-muted-foreground mt-1">
                  When enabled, the deadline day is counted as a remaining day.
                  On the last day, you'll see a special "Last Day" indicator.
                </span>
              </label>
            </div>
          )}
        </div>

        <div className="pt-8">
          <button
            type="submit"
            disabled={isSubmitting || !title}
            className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </Layout>
  );
}
