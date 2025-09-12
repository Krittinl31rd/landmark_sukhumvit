import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/UserContext";

export default function ProtectedRoute({ children }) {
  const { auth } = useAuth();

  if (!auth?.token) {
    return <Navigate to="/" />;
  }

  return children;
}
