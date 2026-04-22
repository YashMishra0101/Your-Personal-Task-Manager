import React from "react";
import { format, parseISO } from "date-fns";
import { Trash2, Edit3 } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

export default function NoteCard({ note, onEdit, onDelete }) {
  const navigate = useNavigate();
  const date = note.updatedAt ? parseISO(note.updatedAt) : new Date();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4 }}
      onClick={() => navigate(`/note/${note.id}`)}
      className="group bg-surface hover:bg-surface-hover border border-border/50 rounded-2xl p-5 shadow-xs transition-all duration-300 flex flex-col h-full cursor-pointer"
    >
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-bold text-primary text-base line-clamp-2 leading-tight pr-2 break-words">
          {note.title || "Untitled Note"}
        </h3>
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-primary/5 px-2 py-1 rounded-md transition-opacity shrink-0">
          {format(date, "MMM d")}
        </span>
      </div>
      
      <p className="text-muted-foreground text-sm leading-relaxed line-clamp-6 flex-1 whitespace-pre-wrap break-words">
        {note.content}
      </p>

      <div className="mt-5 pt-4 border-t border-border/40 flex justify-between items-center transition-opacity duration-300">
        <span className="text-[10px] text-muted-foreground/60 font-medium italic">
          Updated {format(date, "h:mm a")}
        </span>
        <div className="flex items-center space-x-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(note, true);
            }}
            className="p-2 text-primary/60 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
            title="Edit note"
          >
            <Edit3 size={16} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(note.id);
            }}
            className="p-2 text-red-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
            title="Delete note"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
