import React, { useState } from "react";
import Layout from "../components/Layout";
import { useNotes } from "../context/NoteContext";
import NoteCard from "../components/NoteCard";
import { Plus, X, Save, Search, StickyNote } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { cn } from "../lib/utils";

export default function Notes() {
  const { notes, loading, addNote, updateNote, deleteNote } = useNotes();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({ title: "", content: "" });

  const filteredNotes = notes.filter(
    (n) =>
      n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openAddModal = () => {
    setEditingNote(null);
    setFormData({ title: "", content: "" });
    setIsModalOpen(true);
  };

  const openEditModal = (note) => {
    setEditingNote(note);
    setFormData({ title: note.title, content: note.content });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.content.trim()) return toast.error("Note content is required");

    try {
      if (editingNote) {
        await updateNote(editingNote.id, formData);
        toast.success("Note updated");
      } else {
        await addNote(formData);
        toast.success("Note saved");
      }
      setIsModalOpen(false);
    } catch (e) {
      toast.error("Something went wrong");
    }
  };

  const handleDelete = (id) => {
    toast("Delete this note?", {
      description: "This action cannot be undone.",
      action: {
        label: "Delete",
        onClick: () => {
          deleteNote(id);
          toast.success("Note deleted");
        },
      },
      cancel: {
        label: "Cancel",
      },
    });
  };

  return (
    <Layout title="My Notes">
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/60"
              size={18}
            />
            <input
              type="text"
              placeholder="Search your notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-surface border border-border/50 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-hidden transition-all text-sm font-medium"
            />
          </div>

          <button
            onClick={openAddModal}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-2xl font-bold shadow-lg shadow-primary/25 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Plus size={20} />
            <span>New Note</span>
          </button>
        </div>

        {/* Notes Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-surface border border-border/50 rounded-2xl"></div>
            ))}
          </div>
        ) : filteredNotes.length > 0 ? (
          <motion.div 
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <AnimatePresence mode="popLayout">
              {filteredNotes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  onEdit={openEditModal}
                  onDelete={handleDelete}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-surface rounded-3xl flex items-center justify-center text-primary/20 mb-4 border border-border/50 shadow-xs">
              <StickyNote size={32} />
            </div>
            <h3 className="text-xl font-bold text-primary mb-2">
              {searchTerm ? "No matching notes found" : "No notes yet"}
            </h3>
            <p className="text-muted-foreground max-w-xs mx-auto text-sm leading-relaxed">
              {searchTerm 
                ? "Try adjusting your search terms or clear the filter." 
                : "Capture your ideas, thoughts, and quick notes here."}
            </p>
            {!searchTerm && (
               <button
               onClick={openAddModal}
               className="mt-6 text-primary font-bold hover:underline"
             >
               Create your first note
             </button>
            )}
          </div>
        )}
      </div>

      {/* Editor Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl bg-surface border border-border/60 rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="px-8 py-6 border-b border-border/50 flex items-center justify-between bg-primary/5">
                <h2 className="text-xl font-black text-primary tracking-tight">
                  {editingNote ? "Edit Note" : "Create Note"}
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-muted-foreground hover:text-primary hover:bg-surface-hover rounded-xl transition-colors"
                >
                  <X size={20} strokeWidth={2.5} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
                <div className="p-8 space-y-6 overflow-y-auto scrollbar-hide">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
                      Title (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="Give it a title..."
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full text-2xl font-black placeholder:text-muted-foreground/20 bg-transparent outline-hidden border-none focus:ring-0 p-0"
                      autoFocus
                    />
                  </div>

                  <div className="space-y-2 flex-1">
                     <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
                      Content
                    </label>
                    <textarea
                      placeholder="Write your thoughts here..."
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      className="w-full min-h-[300px] text-lg font-medium placeholder:text-muted-foreground/20 bg-transparent outline-hidden border-none focus:ring-0 p-0 resize-none leading-relaxed"
                    />
                  </div>
                </div>

                <div className="p-8 bg-surface/50 backdrop-blur-md border-t border-border/50 flex justify-end items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-6 py-3 text-sm font-bold text-muted-foreground hover:text-primary transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-8 py-3 bg-primary text-primary-foreground rounded-2xl font-black shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    <Save size={18} strokeWidth={2.5} />
                    <span>Save Note</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Layout>
  );
}
