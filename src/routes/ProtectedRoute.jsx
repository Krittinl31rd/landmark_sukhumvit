import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/UserContext";

export default function ProtectedRoute({ children, allowRoles }) {
  const { auth } = useAuth();

  if (!auth?.token) {
    return <Navigate to="/" replace />;
  }

  if (allowRoles && !allowRoles.includes(auth?.user?.role_id)) {
    return <Navigate to="/403" replace />;
  }

  return children;
}
