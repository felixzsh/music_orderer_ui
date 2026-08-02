import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { BlankPage } from './components/BlankPage';
import { ProtectedOrdererRoute } from './components/ProtectedOrdererRoute';
import { AdminLogin } from './pages/AdminLogin';
import { RequireAdmin } from './components/RequireAdmin';
import { AppShell } from './components/AppShell';
import { OrderingView } from './components/OrderingView';
import { HubStatusPage } from './pages/HubStatusPage';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={<AdminLogin />}
        />
        <Route
          path="/ordering"
          element={
            <RequireAdmin>
              <AppShell isAdmin activeView="ordering">
                <OrderingView isAdmin />
              </AppShell>
            </RequireAdmin>
          }
        />
        <Route
          path="/hub"
          element={
            <RequireAdmin>
              <AppShell isAdmin activeView="hub">
                <HubStatusPage />
              </AppShell>
            </RequireAdmin>
          }
        />
        <Route
          path="/orderer"
          element={<ProtectedOrdererRoute />}
        />
        <Route
          path="*"
          element={<BlankPage message="Página no encontrada" />}
        />
      </Routes>
    </Router>
  );
}
