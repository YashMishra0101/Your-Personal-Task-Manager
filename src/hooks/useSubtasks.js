import { useState } from "react";

export function useSubtasks(initialSubtasks = []) {
  const [subtasks, setSubtasks] = useState(initialSubtasks);
  const [newSubtaskText, setNewSubtaskText] = useState("");
  const [draggedSubtaskId, setDraggedSubtaskId] = useState(null);

  const addSubtask = () => {
    if (!newSubtaskText.trim()) return;

    const newSubtask = {
      id: Date.now().toString(),
      text: newSubtaskText.trim(),
      completed: false,
    };

    setSubtasks((prev) => [...prev, newSubtask]);
    setNewSubtaskText("");
  };

  const updateSubtaskText = (subtaskId, newText) => {
    setSubtasks((prev) =>
      prev.map((st) => (st.id === subtaskId ? { ...st, text: newText } : st))
    );
  };

  const removeSubtask = (subtaskId) => {
    setSubtasks((prev) => prev.filter((st) => st.id !== subtaskId));
  };

  const moveSubtask = (subtaskId, direction) => {
    setSubtasks((prev) => {
      const currentIndex = prev.findIndex((st) => st.id === subtaskId);
      if (currentIndex === -1) return prev;

      const targetIndex =
        direction === "up" ? currentIndex - 1 : currentIndex + 1;

      if (targetIndex < 0 || targetIndex >= prev.length) return prev;

      const reordered = [...prev];
      [reordered[currentIndex], reordered[targetIndex]] = [
        reordered[targetIndex],
        reordered[currentIndex],
      ];
      return reordered;
    });
  };

  const handleSubtaskKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addSubtask();
    }
  };

  const handleDragStart = (subtaskId) => {
    setDraggedSubtaskId(subtaskId);
  };

  const handleDragEnd = () => {
    setDraggedSubtaskId(null);
  };

  const handleDrop = (targetSubtaskId) => {
    if (!draggedSubtaskId || draggedSubtaskId === targetSubtaskId) return;

    setSubtasks((prev) => {
      const draggedIndex = prev.findIndex((st) => st.id === draggedSubtaskId);
      const targetIndex = prev.findIndex((st) => st.id === targetSubtaskId);
      if (draggedIndex === -1 || targetIndex === -1) return prev;

      const reordered = [...prev];
      const [draggedItem] = reordered.splice(draggedIndex, 1);
      reordered.splice(targetIndex, 0, draggedItem);
      return reordered;
    });
  };

  return {
    subtasks,
    setSubtasks,
    newSubtaskText,
    setNewSubtaskText,
    draggedSubtaskId,
    addSubtask,
    updateSubtaskText,
    removeSubtask,
    moveSubtask,
    handleSubtaskKeyPress,
    handleDragStart,
    handleDragEnd,
    handleDrop,
  };
}
