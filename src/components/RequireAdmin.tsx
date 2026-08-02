import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

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

export function RequireAdmin({ children }: { children: ReactNode }) {
  const location = useLocation();

  if (!isAdminTokenValid()) {
    // Lleva el destino original para que el login redirija de vuelta.
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}
