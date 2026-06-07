import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Dashboard from '../pages/Dashboard';
import ClubView from '../pages/ClubView';
import EventView from '../pages/EventView';
import ChatInterface from '../pages/ChatInterface';

// Use proper UUIDs for routing mock data
const dummyClubId = '123e4567-e89b-12d3-a456-426614174000';
const dummyEventId = '123e4567-e89b-12d3-a456-426614174001';

// Layout wrapper component for authenticated views
const AppLayout = ({ children }) => (
  <div className="min-h-screen bg-gray-50 flex flex-col">
    {/* Simple Navigation Bar */}
    <nav className="bg-white shadow px-6 py-4 flex justify-between items-center">
      <div className="font-bold text-xl text-blue-600">College Event SaaS</div>
      <div className="flex gap-4">
        <Link to="/dashboard" className="text-gray-600 hover:text-blue-600">Dashboard</Link>
        <Link to={`/clubs/${dummyClubId}`} className="text-gray-600 hover:text-blue-600">Sample Club</Link>
        <Link to={`/events/${dummyEventId}`} className="text-gray-600 hover:text-blue-600">Sample Event</Link>
        <Link to="/chat" className="text-gray-600 hover:text-blue-600">Chat</Link>
        <Link to="/login" className="text-gray-600 hover:text-blue-600">Logout</Link>
      </div>
    </nav>

    {/* Main Content Area */}
    <main className="flex-1 p-4">
      {children}
    </main>
  </div>
);

const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Redirect root to login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* App Routes (wrapped in layout) */}
        <Route path="/dashboard" element={<AppLayout><Dashboard /></AppLayout>} />
        <Route path="/student/dashboard" element={<Navigate to="/dashboard" replace />} />
        <Route path="/admin/dashboard" element={<AppLayout><Dashboard /></AppLayout>} />

        <Route path="/clubs/:id" element={<AppLayout><ClubView /></AppLayout>} />
        <Route path="/events/:id" element={<AppLayout><EventView /></AppLayout>} />
        <Route path="/chat" element={<AppLayout><ChatInterface roomId={dummyEventId} currentUserId="123e4567-e89b-12d3-a456-426614174002" /></AppLayout>} />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
