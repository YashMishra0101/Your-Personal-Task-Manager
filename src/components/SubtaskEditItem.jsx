import React, { useState, useRef, useEffect } from "react";
import { CheckSquare, X, Pencil, Check, XCircle } from "lucide-react";

export default function SubtaskEditItem({ subtask, onUpdate, onRemove }) {
    const [isEditing, setIsEditing] = useState(false);
    const [editedText, setEditedText] = useState(subtask.text);
    const inputRef = useRef(null);

    useEffect(() => {
        if (isEditing) {
            inputRef.current?.focus();
        }
    }, [isEditing]);

    const handleSave = () => {
        if (editedText.trim()) {
            onUpdate(subtask.id, editedText.trim());
            setIsEditing(false);
        }
    };

    const handleCancel = () => {
        setEditedText(subtask.text);
        setIsEditing(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            handleSave();
        } else if (e.key === "Escape") {
            handleCancel();
        }
    };

    if (isEditing) {
        return (
            <div className="flex items-center gap-2 p-2 bg-background border border-primary/50 rounded-lg ring-2 ring-primary/10 transition-all">
                <CheckSquare size={18} className="text-primary shrink-0 ml-1" />
                <input
                    ref={inputRef}
                    type="text"
                    value={editedText}
                    onChange={(e) => setEditedText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={handleSave} // Optional: save on blur, or could be cancel
                    className="flex-1 bg-transparent border-none text-sm text-foreground focus:ring-0 p-1"
                />
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={handleSave}
                        onMouseDown={(e) => e.preventDefault()} // Prevent blur from firing before click
                        className="p-1 hover:bg-green-500/10 text-green-600 rounded transition-all"
                        title="Save"
                    >
                        <Check size={16} strokeWidth={2.5} />
                    </button>
                    <button
                        type="button"
                        onClick={handleCancel}
                        onMouseDown={(e) => e.preventDefault()} // Prevent blur from firing before click
                        className="p-1 hover:bg-red-500/10 text-red-500 rounded transition-all"
                        title="Cancel"
                    >
                        <XCircle size={16} strokeWidth={2.5} />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-3 p-3 bg-surface rounded-lg border border-border/50 group hover:border-border transition-all">
            <CheckSquare size={18} className="text-muted-foreground shrink-0" />
            <span
                className="flex-1 text-sm text-foreground cursor-pointer"
                onClick={() => setIsEditing(true)}
                title="Click to edit"
            >
                {subtask.text}
            </span>
            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="p-1 hover:bg-primary/10 text-primary rounded transition-all"
                    title="Edit subtask"
                >
                    <Pencil size={16} strokeWidth={2.5} />
                </button>
                <button
                    type="button"
                    onClick={() => onRemove(subtask.id)}
                    className="p-1 hover:bg-red-500/10 text-red-500 rounded transition-all"
                    title="Remove subtask"
                >
                    <X size={16} strokeWidth={2.5} />
                </button>
            </div>
        </div>
    );
}
