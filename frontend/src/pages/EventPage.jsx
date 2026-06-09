import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { getUser } from '../utils/auth';

const EventPage = () => {
    const { id } = useParams();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showTeamForm, setShowTeamForm] = useState(false);
    const [teamName, setTeamName] = useState('');
    const user = getUser();

    const fetchEvent = useCallback(async () => {
        try {
            const res = await axiosInstance.get(`/events/${id}`);
            setEvent(res.data);
        } catch (err) {
            console.error('Error fetching event:', err);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        if (id) fetchEvent();
    }, [id, fetchEvent]);

    const handleRegister = async () => {
        try {
            await axiosInstance.post(`/events/${id}/register`);
            fetchEvent();
        } catch (err) {
            alert(err.response?.data?.error || 'Registration failed');
        }
    };

    const handleUnregister = async () => {
        try {
            await axiosInstance.delete(`/events/${id}/register`);
            fetchEvent();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to unregister');
        }
    };

    const handleCancel = async () => {
        if (!confirm('Cancel this event?')) return;
        try {
            await axiosInstance.patch(`/events/${id}/cancel`);
            fetchEvent();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to cancel');
        }
    };

    const handleStatusChange = async (status) => {
        try {
            await axiosInstance.patch(`/events/${id}`, { status });
            fetchEvent();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to update');
        }
    };

    const handleCreateTeam = async (e) => {
        e.preventDefault();
        try {
            await axiosInstance.post('/teams', {
                event_id: id,
                leader_id: user?.id,
                team_name: teamName,
            });
            setTeamName('');
            setShowTeamForm(false);
            fetchEvent();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to create team');
        }
    };

    const handleJoinTeam = async (teamId) => {
        try {
            await axiosInstance.post('/teams/invite', { team_id: teamId, user_id: user?.id });
            fetchEvent();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to join team');
        }
    };

    const handleDeleteTeam = async (teamId) => {
        if (!confirm('Delete this team?')) return;
        try {
            await axiosInstance.delete(`/teams/${teamId}`);
            fetchEvent();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to delete team');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-gray-500">Loading event...</div>
            </div>
        );
    }

    if (!event) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-gray-500">Event not found</div>
            </div>
        );
    }

    const canManage = event.canManage;
    const isOrganizer = event.isOrganizer;
    const statusColors = {
        UPCOMING: 'bg-blue-100 text-blue-800',
        LIVE: 'bg-green-100 text-green-800',
        PAST: 'bg-gray-100 text-gray-800',
        POSTPONED: 'bg-yellow-100 text-yellow-800',
        CANCELLED: 'bg-red-100 text-red-800',
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Banner */}
            <div className="relative h-48 md:h-64 bg-gradient-to-r from-indigo-600 to-purple-700 overflow-hidden">
                {event.banner_url && (
                    <img src={event.banner_url} alt="" className="w-full h-full object-cover opacity-50" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                    <div className="max-w-6xl mx-auto">
                        <Link to={`/clubs/${event.club_id}`} className="text-white/70 hover:text-white text-sm mb-1 block">
                            ← {event.club_name}
                        </Link>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl md:text-3xl font-bold">{event.title}</h1>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[event.status] || 'bg-gray-100'}`}>
                                {event.status}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Clash Warning */}
                    {event.clashes?.length > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                            <p className="text-red-700 font-medium text-sm">⚠ Time Clash Detected</p>
                            <p className="text-red-600 text-sm mt-1">
                                This event overlaps with: {event.clashes.map(c => c.title).join(', ')}
                            </p>
                        </div>
                    )}

                    {/* Description */}
                    <div className="bg-white rounded-xl shadow-sm border p-6">
                        <h2 className="text-lg font-semibold mb-3">About Event</h2>
                        <p className="text-gray-600 leading-relaxed">{event.description || 'No description'}</p>
                    </div>

                    {/* Date & Time */}
                    <div className="bg-white rounded-xl shadow-sm border p-6">
                        <h2 className="text-lg font-semibold mb-4">Date & Time</h2>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-gray-500">Start</p>
                                <p className="font-medium">{new Date(event.start_time).toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-gray-500">End</p>
                                <p className="font-medium">{new Date(event.end_time).toLocaleString()}</p>
                            </div>
                        </div>
                    </div>

                    {/* Teams Section */}
                    <div className="bg-white rounded-xl shadow-sm border p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold">Teams ({event.teams?.length || 0})</h2>
                            {!isOrganizer && !event.isRegistered && event.participation_type !== 'SOLO' && (
                                <button onClick={() => setShowTeamForm(!showTeamForm)}
                                        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                                    + Create Team
                                </button>
                            )}
                        </div>

                        {showTeamForm && (
                            <form onSubmit={handleCreateTeam} className="bg-gray-50 rounded-lg p-4 mb-4 space-y-3">
                                <input type="text" placeholder="Team name" value={teamName}
                                       onChange={(e) => setTeamName(e.target.value)}
                                       className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" required />
                                <div className="flex gap-2 justify-end">
                                    <button type="button" onClick={() => setShowTeamForm(false)}
                                            className="px-3 py-1.5 text-gray-600 text-sm">Cancel</button>
                                    <button type="submit" className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                                        Create
                                    </button>
                                </div>
                            </form>
                        )}

                        {event.teams?.length > 0 ? (
                            <div className="space-y-2">
                                {event.teams.map((team) => {
                                    const isLeader = team.leader_id === user?.id;
                                    return (
                                        <div key={team.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                                            <div>
                                                <p className="font-medium text-sm">{team.team_name}</p>
                                                <p className="text-xs text-gray-500">By @{team.leader_name} · {team.member_count} members</p>
                                            </div>
                                            <div className="flex gap-2">
                                                {!event.isRegistered && (
                                                    <button onClick={() => handleJoinTeam(team.id)}
                                                            className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700">
                                                        Join
                                                    </button>
                                                )}
                                                {(canManage || isLeader) && (
                                                    <button onClick={() => handleDeleteTeam(team.id)}
                                                            className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700">
                                                        Delete
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-gray-400 text-sm text-center py-4">No teams yet</p>
                        )}
                    </div>

                    {/* Organizers (committee view) */}
                    {canManage && event.organizers?.length > 0 && (
                        <div className="bg-white rounded-xl shadow-sm border p-6">
                            <h2 className="text-lg font-semibold mb-4">Organizing Team</h2>
                            <div className="flex flex-wrap gap-2">
                                {event.organizers.map((org) => (
                                    <span key={org.user_id} className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-sm">
                                        {org.full_name || org.username}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-4">
                    {/* Actions Card */}
                    <div className="bg-white rounded-xl shadow-sm border p-6">
                        <h3 className="font-semibold mb-4">Participation</h3>
                        <div className="text-sm text-gray-600 mb-4">
                            <p>Type: <strong>{event.participation_type}</strong></p>
                            <p>Registered: <strong>{event.registrationCount || 0}</strong></p>
                        </div>

                        {isOrganizer ? (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-700">
                                You are an organizer — cannot participate
                            </div>
                        ) : event.isRegistered ? (
                            <button onClick={handleUnregister} className="w-full px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700">
                                Unregister
                            </button>
                        ) : (
                            <div className="space-y-2">
                                <button
                                    onClick={handleRegister}
                                    disabled={event.status === 'PAST' || event.status === 'CANCELLED'}
                                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                                >
                                    {event.status === 'UPCOMING' || event.status === 'LIVE' ? 'Register Now' : 'Registration Closed'}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Committee Controls */}
                    {canManage && (
                        <div className="bg-white rounded-xl shadow-sm border p-6">
                            <h3 className="font-semibold mb-4">Manage Event</h3>
                            <div className="space-y-2">
                                {event.status === 'UPCOMING' && (
                                    <button
                                        onClick={() => handleStatusChange('LIVE')}
                                        className="w-full px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
                                    >
                                        Mark as Live
                                    </button>
                                )}
                                {event.status === 'LIVE' && (
                                    <button
                                        onClick={() => handleStatusChange('PAST')}
                                        className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700"
                                    >
                                        Mark as Ended
                                    </button>
                                )}
                                {(event.status === 'UPCOMING' || event.status === 'POSTPONED') && (
                                    <button
                                        onClick={handleCancel}
                                        className="w-full px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
                                    >
                                        Cancel Event
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Info Card */}
                    <div className="bg-white rounded-xl shadow-sm border p-6 text-sm">
                        <h3 className="font-semibold mb-3">Event Info</h3>
                        <div className="space-y-2 text-gray-600">
                            <p>Club: <Link to={`/clubs/${event.club_id}`} className="text-blue-600 hover:underline">{event.club_name}</Link></p>
                            <p>Created: {new Date(event.created_at).toLocaleDateString()}</p>
                            <p>Organizers: {event.organizers?.length || 0}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EventPage;
