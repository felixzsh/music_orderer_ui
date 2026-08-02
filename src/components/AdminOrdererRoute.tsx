import { RequireAdmin } from './RequireAdmin';
import { AdminOrdererPage } from '../pages/AdminOrdererPage';

export function AdminOrdererRoute() {
  return (
    <RequireAdmin>
      <AdminOrdererPage />
    </RequireAdmin>
  );
}
