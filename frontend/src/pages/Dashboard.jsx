import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { isVerified, isAdmin, getUser } from '../utils/auth';

const Dashboard = () => {
    const user = getUser();
    const [myClubs, setMyClubs] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchMyClubs = async () => {
        try {
            const res = await axiosInstance.get('/clubs/mine');
            setMyClubs(res.data);
        } catch (err) {
            console.error('Error fetching clubs:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMyClubs();
    }, []);

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
            <p className="text-gray-600 mb-6">Welcome, {user?.full_name || user?.username}!</p>

            {!isVerified() && !isAdmin() && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                    <div className="flex items-start gap-3">
                        <span className="text-yellow-600 text-lg font-bold">!</span>
                        <div>
                            <h3 className="font-semibold text-yellow-800">Account Not Verified</h3>
                            <p className="text-yellow-700 text-sm mt-1">
                                Your account is pending verification. An admin will review your bonafide
                                certificate shortly.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Quick Actions */}
            <div className="flex gap-4 mb-8 flex-wrap">
                <Link to="/calendar"
                      className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition shadow-sm">
                    View Calendar
                </Link>
                {myClubs.length > 0 && (
                    <Link to={`/clubs/${myClubs[0].id}`}
                          className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition shadow-sm">
                        My Club
                    </Link>
                )}
            </div>

            {/* My Clubs */}
            <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">My Clubs</h2>
                {loading ? (
                    <p className="text-gray-400">Loading...</p>
                ) : myClubs.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
                        <p className="text-gray-500 mb-3">You haven't joined any clubs yet</p>
                        <span className="text-gray-400 text-sm">Clubs will appear here once you join or create one</span>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {myClubs.map((club) => (
                            <Link key={club.id} to={`/clubs/${club.id}`}
                                  className="bg-white rounded-xl shadow-sm border p-5 hover:shadow-md transition group">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                                        {club.name?.charAt(0)?.toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold group-hover:text-blue-600 transition">{club.name}</h3>
                                        <p className="text-xs text-gray-500 capitalize">{club.user_role?.replace(/_/g, ' ').toLowerCase()}</p>
                                    </div>
                                </div>
                                <div className="flex gap-4 text-sm text-gray-500">
                                    <span>{club.member_count || 0} members</span>
                                    <span>{club.follower_count || 0} followers</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl shadow-sm border p-5">
                    <h3 className="font-semibold mb-1">Clubs</h3>
                    <p className="text-2xl font-bold text-blue-600">{myClubs.length}</p>
                </div>
                <Link to="/calendar" className="bg-white rounded-xl shadow-sm border p-5 hover:shadow-md transition block">
                    <h3 className="font-semibold mb-1">Events</h3>
                    <p className="text-2xl font-bold text-indigo-600">View Calendar →</p>
                </Link>
                <Link to="/chat" className="bg-white rounded-xl shadow-sm border p-5 hover:shadow-md transition block">
                    <h3 className="font-semibold mb-1">Messages</h3>
                    <p className="text-2xl font-bold text-green-600">Open Chat →</p>
                </Link>
            </div>
        </div>
    );
};

export default Dashboard;
