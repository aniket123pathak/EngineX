import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import ProblemDetailPage from "./pages/ProblemDetailPage";
import SolveProblemPage from "./pages/SolveProblemPage";
import CreateProblemPage from "./pages/CreateProblemPage";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import { Toaster } from "react-hot-toast";
import UserProfilePage from "./pages/UserProfilePage";
import LeaderboardPage from "./pages/LeaderboardPage";
import ContestsPage from "./pages/ContestsPage";
import ContestDetailPage from "./pages/ContestDetailPage";

export default function App() {
  return (
    <div className="min-h-screen bg-white font-sans text-black antialiased">
      <Toaster position="top-right" />
      <Navbar />
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/contests"
          element={
            <ProtectedRoute>
              <ContestsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/contests/:id"
          element={
            <ProtectedRoute>
              <ContestDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <UserProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/problems/:id"
          element={
            <ProtectedRoute>
              <ProblemDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/problems/:id/solve"
          element={
            <ProtectedRoute>
              <SolveProblemPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/create-problem"
          element={
            <ProtectedRoute>
              <CreateProblemPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
}
