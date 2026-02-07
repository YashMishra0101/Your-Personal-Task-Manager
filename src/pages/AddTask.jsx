import React, { useState, useRef } from "react";
import { useTasks } from "../context/TaskContext";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { ArrowLeft, Clock, Calendar as CalendarIcon } from "lucide-react";
import { endOfDay, format, addDays, startOfDay } from "date-fns";

export default function AddTask() {
  const { addTask, requestNotificationPermission } = useTasks();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [includeLastDay, setIncludeLastDay] = useState(true);
  const [alarmEnabled, setAlarmEnabled] = useState(false);
  const [alarmDate, setAlarmDate] = useState("");
  const [alarmTime, setAlarmTime] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dateInputRef = useRef(null);
  const alarmDateInputRef = useRef(null);
  const alarmTimeInputRef = useRef(null);

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

    await addTask({
      title,
      description: description.trim(),
      deadline,
      includeLastDay,
      alarm: alarmEnabled
        ? {
          enabled: true,
          date: alarmDate,
          time: alarmTime,
          triggered: false,
        }
        : null,
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
            autoFocus
          />
        </div>

        {/* Description Field */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">
            Description <span className="text-xs">(Optional)</span>
          </label>
          <textarea
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
            <label className="text-sm font-medium text-muted-foreground">
              Deadline (Optional)
            </label>
            <div className="relative">
              <input
                ref={dateInputRef}
                type="date"
                value={date}
                min={format(new Date(), "yyyy-MM-dd")}
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

          {/* Alarm Settings */}
          <div className="space-y-4 pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                <span className="font-medium text-foreground">Set Alarm</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={alarmEnabled}
                  onChange={async (e) => {
                    const checked = e.target.checked;
                    setAlarmEnabled(checked);
                    if (checked) {
                      await requestNotificationPermission();
                    }
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            {alarmEnabled && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    Alarm Date
                  </label>
                  <div className="relative">
                    <input
                      ref={alarmDateInputRef}
                      type="date"
                      required={alarmEnabled}
                      min={format(new Date(), "yyyy-MM-dd")}
                      value={alarmDate}
                      onChange={(e) => setAlarmDate(e.target.value)}
                      className="w-full p-3 pr-12 rounded-xl bg-muted/50 border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 text-primary transition-all"
                    />
                    <CalendarIcon
                      size={20}
                      onClick={() => alarmDateInputRef.current?.showPicker()}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground cursor-pointer hover:text-primary transition-colors"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    Alarm Time
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        ref={alarmTimeInputRef}
                        type="time"
                        required={alarmEnabled}
                        value={alarmTime}
                        onChange={(e) => setAlarmTime(e.target.value)}
                        className="w-full p-3 pr-12 rounded-xl bg-muted/50 border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 text-primary transition-all"
                      />
                      <Clock
                        size={20}
                        onClick={() => alarmTimeInputRef.current?.showPicker()}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground cursor-pointer hover:text-primary transition-colors"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => alarmTimeInputRef.current?.blur()}
                      className="px-4 py-3 bg-surface border border-border text-primary font-semibold rounded-xl hover:bg-surface-hover transition-colors shadow-sm"
                    >
                      Done
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="pt-8">
          <button
            type="submit"
            disabled={isSubmitting || !title}
            className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Creating..." : "Create Task"}
          </button>
        </div>
      </form>
    </Layout>
  );
}
