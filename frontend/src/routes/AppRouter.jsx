import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/Login';
import Register from '../pages/Register';

const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Redirect root to login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Placeholder routes for dashboard redirects */}
        <Route path="/admin/dashboard" element={<div className="p-8 text-center text-2xl font-bold">Admin Dashboard</div>} />
        <Route path="/student/dashboard" element={<div className="p-8 text-center text-2xl font-bold">Student Dashboard</div>} />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
