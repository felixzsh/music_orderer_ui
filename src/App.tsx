import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { BlankPage } from './components/BlankPage';
import { ProtectedOrdererRoute } from './components/ProtectedOrdererRoute';
import { AdminLogin } from './pages/AdminLogin';
import { AdminOrdererRoute } from './components/AdminOrdererRoute';

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