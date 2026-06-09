import { Navigate } from 'react-router-dom';
import { isAuthenticated, isAdmin, isVerified, clearToken } from '../utils/auth';

const ProtectedRoute = ({ children, requireAdmin = false, requireVerified = false }) => {
    if (!isAuthenticated()) {
        clearToken();
        return <Navigate to="/login" replace />;
    }

    if (requireAdmin && !isAdmin()) {
        return <Navigate to="/dashboard" replace />;
    }

    if (requireVerified && !isVerified()) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
};

export default ProtectedRoute;
