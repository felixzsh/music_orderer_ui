import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AppShell } from './AppShell';
import { OrderingView } from './OrderingView';
import { BlankPage } from './BlankPage';
import { API_BASE_URL } from '../constants/api';
import { authHeaders } from '../utils/headers';

interface UserData {
  phone: string;
  name: string;
  session_id: string;
  expires_at: string;
}

interface ValidationResponse {
  valid: boolean;
  user?: UserData;
  message?: string;
  error?: string;
}

export const ProtectedOrdererRoute = () => {
  const [searchParams] = useSearchParams();
  const [validationState, setValidationState] = useState<'loading' | 'valid' | 'invalid'>('loading');
  const [userData, setUserData] = useState<UserData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const validateToken = async () => {
      const token = searchParams.get('token');

      if (!token) {
        setValidationState('invalid');
        setErrorMessage('Token no proporcionado');
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/validate-token`, {
          method: 'POST',
          headers: authHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({ token }),
        });

        const result: ValidationResponse = await response.json();

        if (result.valid && result.user) {
          localStorage.setItem('auth_token', token);
          setUserData(result.user);
          setValidationState('valid');
        } else {
          setValidationState('invalid');
          setErrorMessage('Token inválido');
        }
      } catch (error) {
        console.error('Error validating token:', error);
        setValidationState('invalid');
        setErrorMessage('Error de conexión');
      }
    };

    validateToken();
  }, [searchParams]);

  if (validationState === 'loading') {
    return <BlankPage message="Validando acceso..." />;
  }

  if (validationState === 'invalid') {
    return <BlankPage message={`Acceso denegado: ${errorMessage}`} />;
  }

  // Token válido: misma cáscara compartida (header + day/night) pero solo vista de ordenar.
  return (
    <AppShell isAdmin={false} activeView="ordering">
      <OrderingView isAdmin={false} userPhone={userData!.phone} />
    </AppShell>
  );
};
