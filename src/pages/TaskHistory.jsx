import React from "react";
import { useTasks } from "../context/TaskContext";
import Layout from "../components/Layout";
import TaskCard from "../components/TaskCard";
import { History } from "lucide-react";

export default function TaskHistory() {
  const { tasks } = useTasks();
  const completedTasks = tasks.filter((t) => t.completed);

  return (
    <Layout title="Task Records">
      {completedTasks.length > 0 ? (
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-1">
            <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
            <h3 className="text-lg font-bold text-primary">
              Task Records
            </h3>
            <div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold">
              {completedTasks.length}
            </div>
            <div className="h-px flex-1 bg-linear-to-r from-border to-transparent"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {completedTasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-48 h-48 mb-6 bg-surface-hover rounded-full flex items-center justify-center border border-border text-muted-foreground">
            <History size={64} strokeWidth={1.5} />
          </div>
          <h3 className="text-xl font-bold text-primary mb-2">
            No task records yet
          </h3>
          <p className="text-muted-foreground max-w-xs mx-auto">
            Tasks you complete or mark as not completed will appear here for your records.
          </p>
        </div>
      )}
    </Layout>
  );
}
