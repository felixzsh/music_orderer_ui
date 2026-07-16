import { Navigate } from 'react-router-dom';
import { AdminOrdererPage } from '../pages/AdminOrdererPage';

function isAdminTokenValid(): boolean {
  const token = localStorage.getItem('auth_token');
  if (!token) return false;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.role !== 'admin') return false;
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      localStorage.removeItem('auth_token');
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function AdminOrdererRoute() {
  if (!isAdminTokenValid()) {
    return <Navigate to="/" replace />;
  }

  return <AdminOrdererPage />;
}
