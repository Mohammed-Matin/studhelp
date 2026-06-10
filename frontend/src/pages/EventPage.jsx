import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { getUser } from '../utils/auth';
import { getEventBanner } from '../utils/images';

const EventPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
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

    const handleDeleteEvent = async () => {
        if (!confirm(`Permanently delete "${event.title}"? This cannot be undone.`)) return;
        try {
            await axiosInstance.delete(`/events/${id}`);
            navigate(`/clubs/${event.club_id}`);
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to delete event');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#07070f] flex items-center justify-center">
                <div className="text-slate-400 animate-pulse">Loading event...</div>
            </div>
        );
    }

    if (!event) {
        return (
            <div className="min-h-screen bg-[#07070f] flex items-center justify-center">
                <div className="text-slate-400">Event not found</div>
            </div>
        );
    }

    const canManage = event.canManage;
    const isOrganizer = event.isOrganizer;
    const statusColors = {
        UPCOMING: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30',
        LIVE: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
        PAST: 'bg-slate-500/20 text-slate-400 border border-slate-500/30',
        POSTPONED: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
        CANCELLED: 'bg-red-500/20 text-red-300 border border-red-500/30',
    };

    return (
        <div className="min-h-screen bg-[#07070f]">
            {/* Banner */}
            <div className="relative h-56 md:h-80 overflow-hidden">
                <img src={getEventBanner(event)} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-linear-to-t from-[#07070f] via-[#07070f]/60 to-purple-900/20" />
                <div className="absolute inset-0 bg-grid opacity-20" />
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                    <div className="max-w-6xl mx-auto">
                        <Link to={`/clubs/${event.club_id}`} className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-sm transition mb-4">
                            <span>←</span> Back to {event.club_name}
                        </Link>
                        <p className="text-xs tracking-[0.2em] uppercase text-purple-300 mb-2">Campus Event</p>
                        <div className="flex items-center gap-3 flex-wrap">
                            <h1 className="font-display text-3xl md:text-4xl font-bold">{event.title}</h1>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[event.status] || ''}`}>
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
                        <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4">
                            <p className="text-rose-400 font-medium text-sm">⚠ Time Clash Detected</p>
                            <p className="text-rose-300 text-sm mt-1">
                                This event overlaps with: {event.clashes.map(c => c.title).join(', ')}
                            </p>
                        </div>
                    )}

                    {/* Description */}
                    <div className="glass-card rounded-xl p-6">
                        <h2 className="text-lg font-display font-semibold text-white mb-3">About Event</h2>
                        <p className="text-slate-400 leading-relaxed">{event.description || 'No description'}</p>
                    </div>

                    {/* Date & Time */}
                    <div className="glass-card rounded-xl p-6">
                        <h2 className="text-lg font-display font-semibold text-white mb-4">Date & Time</h2>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-theme-muted">Start</p>
                                <p className="font-medium text-theme">{new Date(event.start_time).toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-theme-muted">End</p>
                                <p className="font-medium text-theme">{new Date(event.end_time).toLocaleString()}</p>
                            </div>
                        </div>
                    </div>

                    {/* Teams Section */}
                    <div className="glass-card rounded-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-display font-semibold text-white">Teams ({event.teams?.length || 0})</h2>
                            {!isOrganizer && !event.isRegistered && event.participation_type !== 'SOLO' && (
                                <button onClick={() => setShowTeamForm(!showTeamForm)}
                                        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                                    + Create Team
                                </button>
                            )}
                        </div>

                        {showTeamForm && (
                            <form onSubmit={handleCreateTeam} className="bg-(--input-bg) border border-theme rounded-lg p-4 mb-4 space-y-3">
                                <input type="text" placeholder="Team name" value={teamName}
                                       onChange={(e) => setTeamName(e.target.value)}
                                       className="input-dark w-full" required />
                                <div className="flex gap-2 justify-end">
                                    <button type="button" onClick={() => setShowTeamForm(false)}
                                            className="px-3 py-1.5 text-theme-muted hover:text-theme text-sm transition">Cancel</button>
                                    <button type="submit" className="btn-primary px-4! py-1.5! text-sm!">
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
                                        <div key={team.id} className="flex items-center justify-between bg-theme-elevated border border-theme rounded-lg p-3">
                                            <div>
                                                <p className="font-medium text-sm text-theme">{team.team_name}</p>
                                                <p className="text-xs text-theme-muted">By @{team.leader_name} · {team.member_count} members</p>
                                            </div>
                                            <div className="flex gap-2">
                                                {!event.isRegistered && (
                                                    <button onClick={() => handleJoinTeam(team.id)}
                                                            className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs rounded hover:bg-emerald-500/30 transition">
                                                        Join
                                                    </button>
                                                )}
                                                {(canManage || isLeader) && (
                                                    <button onClick={() => handleDeleteTeam(team.id)}
                                                            className="px-3 py-1 bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs rounded hover:bg-rose-500/30 transition">
                                                        Delete
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-theme-muted text-sm text-center py-4">No teams yet</p>
                        )}
                    </div>

                    {/* Organizers (committee view) */}
                    {canManage && event.organizers?.length > 0 && (
                        <div className="glass-card rounded-xl p-6">
                            <h2 className="text-lg font-display font-semibold text-white mb-4">Organizing Team</h2>
                            <div className="flex flex-wrap gap-2">
                                {event.organizers.map((org) => (
                                    <span key={org.user_id} className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-3 py-1 rounded-full text-sm">
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
                    <div className="glass-card rounded-xl p-6">
                        <h3 className="font-semibold mb-4">Participation</h3>
                        <div className="text-sm text-slate-400 mb-4">
                            <p>Type: <strong>{event.participation_type}</strong></p>
                            <p>Registered: <strong>{event.registrationCount || 0}</strong></p>
                        </div>

                        {isOrganizer ? (
                            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-sm text-amber-300">
                                You are an organizer — cannot participate
                            </div>
                        ) : event.isRegistered ? (
                            <button onClick={handleUnregister} className="w-full px-4 py-2 bg-rose-500/20 border border-rose-500/30 text-rose-400 rounded-lg text-sm font-medium hover:bg-rose-500/30 transition">
                                Unregister
                            </button>
                        ) : (
                            <div className="space-y-2">
                                <button
                                    onClick={handleRegister}
                                    disabled={event.status === 'PAST' || event.status === 'CANCELLED'}
                                    className="btn-primary w-full px-4 py-2 text-sm disabled:opacity-50"
                                >
                                    {event.status === 'UPCOMING' || event.status === 'LIVE' ? 'Register Now' : 'Registration Closed'}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Committee Controls */}
                    {canManage && (
                        <div className="glass-card rounded-xl p-6">
                            <h3 className="font-semibold mb-4">Manage Event</h3>
                            <div className="space-y-2">
                                {event.status === 'UPCOMING' && (
                                    <button
                                        onClick={() => handleStatusChange('LIVE')}
                                        className="w-full px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-lg text-sm font-medium hover:bg-emerald-500/30 transition"
                                    >
                                        Mark as Live
                                    </button>
                                )}
                                {event.status === 'LIVE' && (
                                    <button
                                        onClick={() => handleStatusChange('PAST')}
                                        className="w-full px-4 py-2 bg-slate-500/20 border border-slate-500/30 text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-500/30 transition"
                                    >
                                        Mark as Ended
                                    </button>
                                )}
                                {(event.status === 'UPCOMING' || event.status === 'POSTPONED') && (
                                    <button
                                        onClick={handleCancel}
                                        className="w-full px-4 py-2 bg-amber-500/20 border border-amber-500/30 text-amber-400 rounded-lg text-sm font-medium hover:bg-amber-500/30 transition"
                                    >
                                        Cancel Event
                                    </button>
                                )}
                                <button
                                    onClick={handleDeleteEvent}
                                    className="w-full px-4 py-2 bg-rose-500/20 border border-rose-500/30 text-rose-400 rounded-lg text-sm font-medium hover:bg-rose-500/30 transition mt-2"
                                >
                                    Delete Event Permanently
                                </button>
                            </div>
                            <p className="text-xs text-theme-muted mt-3">
                                Cancel keeps the event visible as cancelled. Delete removes it completely.
                            </p>
                        </div>
                    )}

                    {/* Info Card */}
                    <div className="glass-card rounded-xl p-6 text-sm">
                        <h3 className="font-semibold mb-3">Event Info</h3>
                        <div className="space-y-2 text-slate-400">
                            <p className="flex items-center gap-2">
                                Club: 
                                <Link to={`/clubs/${event.club_id}`} className="bg-purple-500/10 text-purple-300 border border-purple-500/30 px-2.5 py-0.5 rounded-md hover:bg-purple-500/20 transition text-xs font-medium inline-flex items-center">
                                    {event.club_name}
                                </Link>
                            </p>
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
