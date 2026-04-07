import React, { useState, useRef } from "react";
import { useTasks } from "../context/TaskContext";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { Calendar as CalendarIcon, Plus, CheckSquare } from "lucide-react";
import { format } from "date-fns";
import SubtaskEditItem from "../components/SubtaskEditItem";
import TimePicker from "../components/TimePicker";
import { useSubtasks } from "../hooks/useSubtasks";

export default function AddTask() {
  const { addTask } = useTasks();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [includeLastDay, setIncludeLastDay] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    subtasks,
    newSubtaskText,
    setNewSubtaskText,
    addSubtask,
    updateSubtaskText,
    removeSubtask,
    moveSubtask,
    handleSubtaskKeyPress,
    draggedSubtaskId,
    handleDragStart,
    handleDragEnd,
    handleDrop,
  } = useSubtasks([]);

  const dateInputRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);

    let deadline = null;
    if (date || time) {
      const selectedDate = date ? new Date(date) : new Date();
      if (time) {
        const [hours, minutes] = time.split(":");
        selectedDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
      } else {
        selectedDate.setHours(23, 59, 59, 999);
      }
      deadline = selectedDate.toISOString();
    }

    await addTask({
      title,
      description: description.trim(),
      deadline,
      timeValue: time || null,
      dateValue: date || null,
      includeLastDay,
      subtasks: subtasks.length > 0 ? subtasks : null, // Only save if there are subtasks
    });

    setIsSubmitting(false);
    navigate("/");
  };

  return (
    <Layout title="Add New Task">
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
                {subtasks.map((subtask, index) => (
                  <SubtaskEditItem
                    key={subtask.id}
                    subtask={subtask}
                    onUpdate={updateSubtaskText}
                    onRemove={removeSubtask}
                    onMoveUp={() => moveSubtask(subtask.id, "up")}
                    onMoveDown={() => moveSubtask(subtask.id, "down")}
                    canMoveUp={index > 0}
                    canMoveDown={index < subtasks.length - 1}
                    draggable
                    isDragging={draggedSubtaskId === subtask.id}
                    onDragStart={() => handleDragStart(subtask.id)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleDrop(subtask.id)}
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

        {/* Deadline & Time Field */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
            <label className="text-foreground">Deadline & Time (Optional)</label>
          </div>
          <div className="p-4 bg-background border border-border rounded-xl space-y-4 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 transition-all">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <input
                  id="date"
                  ref={dateInputRef}
                  type="date"
                  min={format(new Date(), "yyyy-MM-dd")}
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
              <TimePicker
                value={time}
                onChange={setTime}
                onClear={() => setTime("")}
                placeholder="Select time"
              />
            </div>
          </div>
        </div>

        {/* Include Last Day Toggle */}
        {(date || time) && (
          <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-xl border border-border">
            <input
              type="checkbox"
              id="includeLastDay"
              checked={includeLastDay}
              onChange={(e) => setIncludeLastDay(e.target.checked)}
              className="w-5 h-5 mt-0.5 rounded border-border text-primary focus:ring-2 focus:ring-primary/20 cursor-pointer"
            />
            <label
              htmlFor="includeLastDay"
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

        <div className="pt-8 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={() => navigate("/")}
            disabled={isSubmitting}
            className="w-full sm:w-1/3 py-4 bg-muted/50 text-muted-foreground rounded-xl font-bold hover:bg-muted hover:text-foreground active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-border/50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !title}
            className="w-full sm:w-2/3 py-4 bg-primary text-primary-foreground rounded-xl font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Creating..." : "Create Task"}
          </button>
        </div>
      </form>
    </Layout >
  );
}
