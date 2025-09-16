import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../state/AuthProvider";

export default function Protected({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="h-[60vh] grid place-items-center text-sm text-gray-600">Carregando autenticação…</div>;
  }
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return children;
}
