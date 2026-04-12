import React from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import AddTask from "./pages/AddTask";
import EditTask from "./pages/EditTask";
import Completed from "./pages/Completed";
import Login from "./pages/Login";
import SecurityKey from "./pages/SecurityKey";
import NotFound from "./pages/NotFound";
import TaskDetails from "./pages/TaskDetails";
import DeviceActivity from "./pages/DeviceActivity";
import AppLockSettings from "./pages/AppLockSettings";
import AppUnlock from "./pages/AppUnlock";
import Notes from "./pages/Notes";
import ProtectedRoute from "./components/ProtectedRoute";
import SecurityRoute from "./components/SecurityRoute";

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/security-check"
          element={
            <SecurityRoute>
              <SecurityKey />
            </SecurityRoute>
          }
        />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
          path="/notes"
          element={
            <ProtectedRoute>
              <Notes />
            </ProtectedRoute>
          }
        />
        <Route
          path="/add"
          element={
            <ProtectedRoute>
              <AddTask />
            </ProtectedRoute>
          }
        />
        <Route
          path="/edit/:id"
          element={
            <ProtectedRoute>
              <EditTask />
            </ProtectedRoute>
          }
        />
        <Route
          path="/completed"
          element={
            <ProtectedRoute>
              <Completed />
            </ProtectedRoute>
          }
        />
        <Route
          path="/device-activity"
          element={
            <ProtectedRoute>
              <DeviceActivity />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app-lock"
          element={
            <ProtectedRoute>
              <AppLockSettings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/unlock"
          element={
            <ProtectedRoute>
              <AppUnlock />
            </ProtectedRoute>
          }
        />
        <Route
          path="/task/:id"
          element={
            <ProtectedRoute>
              <TaskDetails />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}
