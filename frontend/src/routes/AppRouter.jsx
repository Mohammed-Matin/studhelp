import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
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
import ThemeToggle from '../components/ThemeToggle';
import ThreeBackground from '../components/ThreeBackground';
import Footer from '../components/Footer';
import { isAdmin, clearToken } from '../utils/auth';

const handleLogout = () => {
    clearToken();
    window.location.href = '/login';
};

const NavLink = ({ to, children }) => {
    const { pathname } = useLocation();
    const active = pathname === to || (to !== '/dashboard' && pathname.startsWith(to));
    return (
        <Link
            to={to}
            className={`text-sm font-medium transition px-3 py-1.5 rounded-lg ${
                active
                    ? 'text-theme bg-white/10'
                    : 'text-theme-muted hover:text-theme hover:bg-white/5'
            }`}
        >
            {children}
        </Link>
    );
};

const AppLayout = ({ children }) => (
    <div className="min-h-screen flex flex-col bg-theme relative">
        <ThreeBackground intensity={0.85} />
        <nav className="sticky top-0 z-50 border-b border-theme-nav bg-theme-nav backdrop-blur-xl">
            <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                <Link to="/dashboard" className="font-display font-bold text-xl tracking-tight">
                    <span className="text-gradient">Stud</span>
                    <span className="text-theme">Help</span>
                </Link>
                <div className="flex gap-1 items-center">
                    <NavLink to="/dashboard">Home</NavLink>
                    <NavLink to="/clubs">Clubs</NavLink>
                    <NavLink to="/calendar">Events</NavLink>
                    <NavLink to="/chat">Chat</NavLink>
                    <NavLink to="/profile">Profile</NavLink>
                    {isAdmin() && <NavLink to="/admin/dashboard">Admin</NavLink>}
                    <div className="ml-2 pl-2 border-l border-theme flex items-center gap-2">
                        <ThemeToggle />
                        <NotificationBell />
                    </div>
                    <button
                        onClick={handleLogout}
                        className="ml-2 text-sm text-red-400 hover:text-red-300 font-medium px-3 py-1.5"
                    >
                        Logout
                    </button>
                </div>
            </div>
        </nav>
        <main className="flex-1 relative z-10">
            {children}
        </main>
        <Footer />
    </div>
);

const AppRouter = () => {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/" element={<Navigate to="/login" replace />} />

                <Route path="/dashboard" element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
                <Route path="/student/dashboard" element={<Navigate to="/dashboard" replace />} />
                <Route path="/admin/dashboard" element={<ProtectedRoute requireAdmin><AppLayout><AdminDashboard /></AppLayout></ProtectedRoute>} />
                <Route path="/calendar" element={<ProtectedRoute><AppLayout><CalendarView /></AppLayout></ProtectedRoute>} />
                <Route path="/clubs" element={<ProtectedRoute><AppLayout><ClubsListPage /></AppLayout></ProtectedRoute>} />
                <Route path="/clubs/new" element={<ProtectedRoute><AppLayout><CreateClubPage /></AppLayout></ProtectedRoute>} />
                <Route path="/clubs/:clubId/events/new" element={<ProtectedRoute><AppLayout><CreateEventPage /></AppLayout></ProtectedRoute>} />
                <Route path="/clubs/:id" element={<ProtectedRoute><AppLayout><ClubPage /></AppLayout></ProtectedRoute>} />
                <Route path="/events/:id" element={<ProtectedRoute><AppLayout><EventPage /></AppLayout></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><AppLayout><ProfilePage /></AppLayout></ProtectedRoute>} />
                <Route path="/chat" element={<ProtectedRoute><AppLayout><ChatInterface /></AppLayout></ProtectedRoute>} />
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        </BrowserRouter>
    );
};

export default AppRouter;
