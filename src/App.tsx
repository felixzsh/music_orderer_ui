import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { BlankPage } from './components/BlankPage';
import { ProtectedOrdererRoute } from './components/ProtectedOrdererRoute';
import { AdminLogin } from './pages/AdminLogin';
import { AdminOrdererRoute } from './components/AdminOrdererRoute';
import { RequireAdmin } from './components/RequireAdmin';
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
          path="/admin"
          element={<AdminOrdererRoute />}
        />
        <Route
          path="/hub"
          element={
            <RequireAdmin>
              <HubStatusPage />
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
