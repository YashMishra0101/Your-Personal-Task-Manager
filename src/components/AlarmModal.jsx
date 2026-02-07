import React from "react";
import { useTasks } from "../context/TaskContext";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X } from "lucide-react";

export default function AlarmModal() {
    const { activeAlarm, stopAlarm } = useTasks();

    if (!activeAlarm) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="bg-surface border border-border rounded-2xl shadow-xl w-full max-w-sm overflow-hidden"
                >
                    {/* Header */}
                    <div className="bg-primary/10 p-6 flex flex-col items-center justify-center border-b border-border">
                        <motion.div
                            animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
                            transition={{ repeat: Infinity, duration: 2, repeatDelay: 1 }}
                            className="p-4 bg-white rounded-full shadow-lg mb-4"
                        >
                            <Bell size={32} className="text-primary fill-primary" />
                        </motion.div>
                        <h2 className="text-2xl font-bold text-foreground">Alarm Ringing!</h2>
                        <p className="text-muted-foreground mt-1 text-center">
                            It's time for your task
                        </p>
                    </div>

                    {/* Body */}
                    <div className="p-6">
                        <div className="bg-muted/30 p-4 rounded-xl mb-6 text-center border border-border">
                            <h3 className="font-semibold text-lg text-foreground line-clamp-2">
                                {activeAlarm.title}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                {activeAlarm.alarm?.time}
                            </p>
                        </div>

                        <button
                            onClick={stopAlarm}
                            className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold text-lg shadow-lg shadow-primary/20 hover:shadow-primary/40 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                        >
                            <X size={20} />
                            Dismiss Alarm
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
