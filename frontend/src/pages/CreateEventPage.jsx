import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import Button from '../components/Button';
import { isManager } from '../utils/clubRoles';

const CreateEventPage = () => {
    const { clubId } = useParams();
    const navigate = useNavigate();
    const [club, setClub] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [clashes, setClashes] = useState([]);
    const [form, setForm] = useState({
        title: '',
        description: '',
        banner_url: '',
        start_time: '',
        end_time: '',
        participation_type: 'BOTH',
        max_teams: '',
        max_participants: '',
    });

    useEffect(() => {
        const fetchClub = async () => {
            try {
                const res = await axiosInstance.get(`/clubs/${clubId}`);
                setClub(res.data);
                if (!isManager(res.data.userRole)) {
                    setError('Only club managers can create events');
                }
            } catch (err) {
                setError('Club not found');
            } finally {
                setLoading(false);
            }
        };
        if (clubId) fetchClub();
    }, [clubId]);

    useEffect(() => {
        const checkClashes = async () => {
            if (!form.start_time || !form.end_time) {
                setClashes([]);
                return;
            }
            try {
                const res = await axiosInstance.get('/events/clashes', {
                    params: {
                        club_id: clubId,
                        start_time: new Date(form.start_time).toISOString(),
                        end_time: new Date(form.end_time).toISOString(),
                    },
                });
                setClashes(res.data);
            } catch {
                setClashes([]);
            }
        };
        const timer = setTimeout(checkClashes, 500);
        return () => clearTimeout(timer);
    }, [form.start_time, form.end_time, clubId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!form.title.trim() || !form.start_time || !form.end_time) {
            setError('Title, start time, and end time are required');
            return;
        }
        if (new Date(form.start_time) >= new Date(form.end_time)) {
            setError('End time must be after start time');
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                club_id: clubId,
                title: form.title.trim(),
                description: form.description.trim() || undefined,
                banner_url: form.banner_url.trim() || undefined,
                start_time: new Date(form.start_time).toISOString(),
                end_time: new Date(form.end_time).toISOString(),
                participation_type: form.participation_type,
                max_teams: form.max_teams ? parseInt(form.max_teams) : null,
                max_participants: form.max_participants ? parseInt(form.max_participants) : null,
            };
            const res = await axiosInstance.post('/events', payload);
            navigate(`/events/${res.data.id}`);
        } catch (err) {
            setError(
                err.response?.data?.error ||
                err.response?.data?.details?.[0]?.message ||
                'Failed to create event'
            );
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <p className="text-gray-500">Loading...</p>
            </div>
        );
    }

    if (!club || !isManager(club.userRole)) {
        return (
            <div className="p-6 max-w-2xl mx-auto text-center">
                <p className="text-red-600 mb-4">{error || 'You do not have permission to create events for this club'}</p>
                <Link to={`/clubs/${clubId}`} className="text-blue-600 hover:underline">← Back to Club</Link>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-3xl mx-auto">
            <Link to={`/clubs/${clubId}`} className="text-blue-600 hover:underline text-sm mb-4 inline-block">
                ← Back to {club.name}
            </Link>

            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-600 to-purple-700 px-8 py-6 text-white">
                    <h1 className="text-2xl font-bold">Create Event</h1>
                    <p className="text-white/80 text-sm mt-1">Host a new event for {club.name}</p>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
                            {error}
                        </div>
                    )}

                    {clashes.length > 0 && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm">
                            <p className="font-medium text-yellow-800">Schedule clash detected</p>
                            <p className="text-yellow-700 mt-1">
                                Overlaps with: {clashes.map((c) => c.title).join(', ')}
                            </p>
                        </div>
                    )}

                    <section>
                        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Basic Details</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Event Title *</label>
                                <input
                                    type="text"
                                    value={form.title}
                                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                                    placeholder="e.g. Hackathon 2026"
                                    className="w-full px-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    placeholder="Describe the event, rules, prizes, eligibility..."
                                    rows={5}
                                    className="w-full px-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Banner Image URL</label>
                                <input
                                    type="url"
                                    value={form.banner_url}
                                    onChange={(e) => setForm({ ...form, banner_url: e.target.value })}
                                    placeholder="https://..."
                                    className="w-full px-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Schedule</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Start Time *</label>
                                <input
                                    type="datetime-local"
                                    value={form.start_time}
                                    onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                                    className="w-full px-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">End Time *</label>
                                <input
                                    type="datetime-local"
                                    value={form.end_time}
                                    onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                                    className="w-full px-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    required
                                />
                            </div>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Participation</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                <select
                                    value={form.participation_type}
                                    onChange={(e) => setForm({ ...form, participation_type: e.target.value })}
                                    className="w-full px-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    <option value="BOTH">Solo & Team</option>
                                    <option value="SOLO">Solo Only</option>
                                    <option value="TEAM">Team Only</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Max Teams</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={form.max_teams}
                                    onChange={(e) => setForm({ ...form, max_teams: e.target.value })}
                                    placeholder="Unlimited"
                                    className="w-full px-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Max Participants</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={form.max_participants}
                                    onChange={(e) => setForm({ ...form, max_participants: e.target.value })}
                                    placeholder="Unlimited"
                                    className="w-full px-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        </div>
                    </section>

                    <div className="flex gap-3 justify-end pt-4 border-t">
                        <Link
                            to={`/clubs/${clubId}`}
                            className="px-5 py-2.5 text-gray-600 text-sm font-medium hover:text-gray-800"
                        >
                            Cancel
                        </Link>
                        <Button type="submit" isLoading={submitting}>
                            Create Event
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateEventPage;
