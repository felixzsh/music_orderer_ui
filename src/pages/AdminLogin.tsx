import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../constants/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';

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

export function AdminLogin() {
  const [secret, setSecret] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from || '/ordering';

  useEffect(() => {
    if (isAdminTokenValid()) {
      navigate(from, { replace: true });
    }
  }, [navigate, from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret }),
      });

      const result = await response.json();

      if (result.success && result.token) {
        localStorage.setItem('auth_token', result.token);
        navigate(from, { replace: true });
      } else {
        setError(result.error || 'Error de autenticación');
      }
    } catch {
      setError('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-background">
      <Card className="w-[90%] sm:w-80">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Acceso Admin</CardTitle>
          <CardDescription>Ingresa la clave de administrador</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="password"
              placeholder="Clave de administrador"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              autoFocus
            />
            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={loading || !secret}>
              {loading ? 'Validando...' : 'Ingresar'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
