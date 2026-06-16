import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Redirects unauthenticated users to the login page.
 */
export default function ProtectedRoute({ children }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
