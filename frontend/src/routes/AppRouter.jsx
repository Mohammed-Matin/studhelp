import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Dashboard from '../pages/Dashboard';
import AdminDashboard from '../pages/AdminDashboard';
import ClubPage from '../pages/ClubPage';
import ClubsListPage from '../pages/ClubsListPage';
import CreateClubPage from '../pages/CreateClubPage';
import CreateEventPage from '../pages/CreateEventPage';
import EventPage from '../pages/EventPage';
import CalendarView from '../pages/CalendarView';
import ChatInterface from '../pages/ChatInterface';
import ProfilePage from '../pages/ProfilePage';
import ProtectedRoute from '../components/ProtectedRoute';
import NotificationBell from '../components/NotificationBell';
import { isAdmin, clearToken } from '../utils/auth';

const handleLogout = () => {
    clearToken();
    window.location.href = '/login';
};

const AppLayout = ({ children }) => (
    <div className="min-h-screen bg-gray-50 flex flex-col">
        <nav className="bg-white shadow px-6 py-4 flex justify-between items-center">
            <Link to="/dashboard" className="font-bold text-xl text-blue-600">StudHelp</Link>
            <div className="flex gap-4 items-center">
                <Link to="/dashboard" className="text-gray-600 hover:text-blue-600">Dashboard</Link>
                <Link to="/clubs" className="text-gray-600 hover:text-blue-600">Clubs</Link>
                <Link to="/calendar" className="text-gray-600 hover:text-blue-600">Calendar</Link>
                <Link to="/profile" className="text-gray-600 hover:text-blue-600">Profile</Link>
                {isAdmin() && (
                    <Link to="/admin/dashboard" className="text-gray-600 hover:text-blue-600">Admin</Link>
                )}
                <Link to="/chat" className="text-gray-600 hover:text-blue-600">Chat</Link>
                <NotificationBell />
                <button onClick={handleLogout} className="text-red-600 hover:text-red-700 font-medium">
                    Logout
                </button>
            </div>
        </nav>
        <main className="flex-1">
            {children}
        </main>
    </div>
);

const AppRouter = () => {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/" element={<Navigate to="/login" replace />} />

                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <AppLayout><Dashboard /></AppLayout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/student/dashboard"
                    element={<Navigate to="/dashboard" replace />}
                />
                <Route
                    path="/admin/dashboard"
                    element={
                        <ProtectedRoute requireAdmin>
                            <AppLayout><AdminDashboard /></AppLayout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/calendar"
                    element={
                        <ProtectedRoute>
                            <AppLayout><CalendarView /></AppLayout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/clubs"
                    element={
                        <ProtectedRoute>
                            <AppLayout><ClubsListPage /></AppLayout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/clubs/new"
                    element={
                        <ProtectedRoute>
                            <AppLayout><CreateClubPage /></AppLayout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/clubs/:clubId/events/new"
                    element={
                        <ProtectedRoute>
                            <AppLayout><CreateEventPage /></AppLayout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/clubs/:id"
                    element={
                        <ProtectedRoute>
                            <AppLayout><ClubPage /></AppLayout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/events/:id"
                    element={
                        <ProtectedRoute>
                            <AppLayout><EventPage /></AppLayout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/profile"
                    element={
                        <ProtectedRoute>
                            <AppLayout><ProfilePage /></AppLayout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/chat"
                    element={
                        <ProtectedRoute>
                            <AppLayout><ChatInterface /></AppLayout>
                        </ProtectedRoute>
                    }
                />
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        </BrowserRouter>
    );
};

export default AppRouter;
