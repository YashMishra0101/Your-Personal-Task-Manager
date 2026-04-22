import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useNotes } from "../context/NoteContext";
import Layout from "../components/Layout";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Save,
  X,
  CalendarCheck,
  Clock,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "../lib/utils";
import ConfirmDialog from "../components/ConfirmDialog";
import { toast } from "sonner";

export default function NoteDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { notes, updateNote, deleteNote } = useNotes();

  const note = notes.find((n) => n.id === id);

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ title: "", content: "" });
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Initialise form data when note loads or editing starts
  const startEditing = () => {
    setFormData({ title: note.title || "", content: note.content || "" });
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.content.trim()) return toast.error("Note content is required");
    try {
      setIsSaving(true);
      await updateNote(note.id, formData);
      toast.success("Note updated");
      setIsEditing(false);
    } catch {
      toast.error("Failed to save note");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteNote(note.id);
      toast.success("Note deleted");
      navigate("/notes");
    } catch {
      toast.error("Failed to delete note");
    }
  };

  // ── Loading state: notes not yet fetched ─────────────────────────────────
  if (notes.length === 0) {
    return (
      <Layout title="Loading...">
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  // ── Not found ─────────────────────────────────────────────────────────────
  if (!note) {
    return (
      <Layout title="Note Not Found">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-xl font-bold text-primary mb-2">Note Not Found</h3>
          <p className="text-muted-foreground mb-6">
            The note you're looking for doesn't exist.
          </p>
          <button
            onClick={() => navigate("/notes")}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium shadow-lg"
          >
            Back to Notes
          </button>
        </div>
      </Layout>
    );
  }

  const updatedDate = note.updatedAt ? parseISO(note.updatedAt) : null;
  const createdDate = note.createdAt ? parseISO(note.createdAt) : null;

  return (
    <Layout title="Note Details">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 pb-24">

        {/* ── Navigation & Actions ─────────────────────────────────────── */}
        <div className="flex flex-col gap-4 mb-10">
          {/* Back */}
          <button
            onClick={() => navigate("/notes")}
            className="flex items-center gap-2 px-4 py-3 bg-transparent border border-border/60 text-muted-foreground hover:bg-muted/50 hover:text-foreground rounded-2xl transition-all font-semibold active:scale-95 group self-start"
          >
            <ArrowLeft size={20} className="transition-transform group-hover:-translate-x-1" />
            <span>Back</span>
          </button>

          {/* Action buttons */}
          <div className="flex items-center justify-between gap-3">
            {!isEditing ? (
              <button
                onClick={startEditing}
                className="flex items-center gap-2 px-5 py-3 bg-primary/5 text-primary hover:bg-primary hover:text-white rounded-2xl transition-all font-semibold active:scale-95"
              >
                <Pencil size={18} />
                <span>Edit</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={cancelEditing}
                className="flex items-center gap-2 px-5 py-3 bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground rounded-2xl transition-all font-semibold active:scale-95 border border-border/60"
              >
                <X size={18} />
                <span>Cancel</span>
              </button>
            )}

            <button
              onClick={() => setShowDeleteDialog(true)}
              className="flex items-center gap-2 px-5 py-3 bg-red-500/5 text-red-500 hover:bg-red-500 hover:text-white rounded-2xl transition-all font-semibold active:scale-95"
            >
              <Trash2 size={18} />
              <span>Delete</span>
            </button>
          </div>
        </div>

        {/* ── Content ───────────────────────────────────────────────────── */}
        <form onSubmit={handleSave} className="grid grid-cols-1 gap-10">

          {/* Title card */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground uppercase tracking-widest pl-1">
              <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
              Title
            </div>
            <div className="bg-surface p-8 rounded-3xl border border-border/60 shadow-sm">
              {isEditing ? (
                <input
                  type="text"
                  placeholder="Give it a title..."
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full text-2xl sm:text-3xl font-bold bg-transparent outline-none border-none focus:ring-0 p-0 text-foreground placeholder:text-muted-foreground/30 tracking-tight leading-tight"
                  autoFocus
                />
              ) : (
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight leading-tight text-foreground break-words">
                  {note.title || (
                    <span className="text-muted-foreground/40 italic font-medium">
                      Untitled Note
                    </span>
                  )}
                </h1>
              )}
            </div>
          </div>

          {/* Content card */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground uppercase tracking-widest pl-1">
              <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
              Content
            </div>
            <div className="bg-surface p-8 rounded-3xl border border-border/60 shadow-sm">
              {isEditing ? (
                <textarea
                  placeholder="Write your thoughts here..."
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={10}
                  className="w-full text-lg font-medium bg-transparent outline-none border-none focus:ring-0 p-0 resize-none leading-relaxed text-foreground placeholder:text-muted-foreground/30"
                />
              ) : (
                <p className={cn(
                  "text-lg leading-relaxed whitespace-pre-wrap break-words",
                  note.content ? "text-foreground/90" : "text-muted-foreground italic"
                )}>
                  {note.content || "No content for this note."}
                </p>
              )}
            </div>
          </div>

          {/* Save button — only in edit mode */}
          {isEditing && (
            <div className="flex justify-start">
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save size={18} strokeWidth={2.5} />
                <span>{isSaving ? "Saving..." : "Save Changes"}</span>
              </button>
            </div>
          )}

          {/* ── Timestamps ──────────────────────────────────────────────── */}
          {!isEditing && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Last updated */}
              {updatedDate && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground uppercase tracking-widest pl-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                    Last Updated
                  </div>
                  <div className="bg-surface p-6 rounded-3xl border border-border/60 shadow-sm h-full flex flex-col justify-center min-h-[120px]">
                    <div className="flex items-center gap-5">
                      <div className="p-4 bg-blue-500/10 rounded-2xl text-blue-600 shrink-0">
                        <CalendarCheck size={28} strokeWidth={1.5} />
                      </div>
                      <div>
                        <div className="text-xl font-bold tabular-nums text-foreground">
                          {format(updatedDate, "MMM d, yyyy")}
                        </div>
                        <div className="text-sm font-medium text-muted-foreground mt-1 flex items-center gap-1.5">
                          <Clock size={13} />
                          {format(updatedDate, "h:mm a")}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Created on */}
              {createdDate && (
                <div className="space-y-3 mt-6 md:mt-0">
                  <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground uppercase tracking-widest pl-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                    Created On
                  </div>
                  <div className="bg-surface p-6 rounded-3xl border border-border/60 shadow-sm h-full flex flex-col justify-center min-h-[120px]">
                    <div className="flex items-center gap-5">
                      <div className="p-4 bg-purple-500/10 rounded-2xl text-purple-600 shrink-0">
                        <CalendarCheck size={28} strokeWidth={1.5} />
                      </div>
                      <div>
                        <div className="text-xl font-bold tabular-nums text-foreground">
                          {format(createdDate, "MMM d, yyyy")}
                        </div>
                        <div className="text-sm font-medium text-muted-foreground mt-1 flex items-center gap-1.5">
                          <Clock size={13} />
                          {format(createdDate, "h:mm a")}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </form>
      </div>

      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Delete Note"
        message={`This will permanently remove "${note.title || "this note"}". Are you sure?`}
        confirmText="Delete Note"
        cancelText="Keep Note"
        variant="danger"
      />
    </Layout>
  );
}
