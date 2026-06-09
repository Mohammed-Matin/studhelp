import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';


const TABS = ['Gallery', 'Members', 'Events', 'About'];
const MANAGER_ROLES = ['CORE_COMMITTEE', 'EXECUTIVE'];
const GALLERY_ROLES = ['CORE_COMMITTEE', 'EXECUTIVE', 'DESIGN', 'PUBLICITY'];

const ClubPage = () => {
    const { id } = useParams();
    const [club, setClub] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('Gallery');

    const fetchClub = useCallback(async () => {
        try {
            const res = await axiosInstance.get(`/clubs/${id}`);
            setClub(res.data);
        } catch (err) {
            console.error('Error fetching club:', err);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        if (id) fetchClub();
    }, [id, fetchClub]);

    const handleFollow = async () => {
        try {
            if (club.isFollower) {
                await axiosInstance.delete(`/clubs/${id}/follow`);
            } else {
                await axiosInstance.post(`/clubs/${id}/follow`);
            }
            fetchClub();
        } catch (err) {
            console.error('Error toggling follow:', err);
        }
    };

    const handleRequestJoin = async () => {
        try {
            await axiosInstance.post(`/clubs/${id}/requests`, { message: 'I want to join!' });
            fetchClub();
        } catch (err) {
            console.error('Error requesting join:', err);
        }
    };

    const isManager = club?.userRole && MANAGER_ROLES.includes(club.userRole);
    const canManageGallery = club?.userRole && GALLERY_ROLES.includes(club.userRole);
    const displayTabs = isManager ? [...TABS, 'Dashboard'] : TABS;

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-gray-500 text-lg">Loading club...</div>
            </div>
        );
    }

    if (!club) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-gray-500 text-lg">Club not found</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Cover Image */}
            <div className="relative h-64 md:h-80 bg-gradient-to-r from-blue-600 to-indigo-700 overflow-hidden">
                {club.cover_url && (
                    <img src={club.cover_url} alt="" className="w-full h-full object-cover opacity-60" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            </div>

            {/* Club Info Section */}
            <div className="max-w-6xl mx-auto px-4 -mt-20 relative z-10">
                <div className="flex flex-col md:flex-row md:items-end gap-4 md:gap-6">
                    {/* Logo */}
                    <div className="w-32 h-32 md:w-40 md:h-40 rounded-xl border-4 border-white shadow-lg overflow-hidden bg-white flex-shrink-0">
                        {club.logo_url ? (
                            <img src={club.logo_url} alt={club.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-4xl font-bold">
                                {club.name?.charAt(0)?.toUpperCase()}
                            </div>
                        )}
                    </div>

                    {/* Name & Stats */}
                    <div className="flex-1 pb-2">
                        <h1 className="text-2xl md:text-3xl font-bold text-white drop-shadow-sm">{club.name}</h1>
                        <p className="text-white/80 text-sm mt-1 line-clamp-2">{club.description}</p>
                        <div className="flex gap-6 mt-3 text-white/90 text-sm">
                            <span><strong className="text-white">{club.member_count || 0}</strong> members</span>
                            <span><strong className="text-white">{club.follower_count || 0}</strong> followers</span>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pb-2">
                        {club.userRole ? (
                            <span className="px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium">
                                {club.userRole.replace(/_/g, ' ')}
                            </span>
                        ) : (
                            <>
                                <button
                                    onClick={handleFollow}
                                    className={`px-6 py-2 rounded-lg font-medium text-sm transition ${
                                        club.isFollower
                                            ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                            : 'bg-blue-600 text-white hover:bg-blue-700'
                                    }`}
                                >
                                    {club.isFollower ? 'Following' : 'Follow'}
                                </button>
                                <button
                                    onClick={handleRequestJoin}
                                    disabled={club.pendingRequest}
                                    className={`px-6 py-2 rounded-lg font-medium text-sm transition ${
                                        club.pendingRequest
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                    }`}
                                >
                                    {club.pendingRequest ? 'Requested' : 'Join'}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="max-w-6xl mx-auto px-4 mt-8 border-b bg-white rounded-t-xl shadow-sm">
                <div className="flex gap-0 -mb-px overflow-x-auto">
                    {displayTabs.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-3 text-sm font-medium border-b-2 transition whitespace-nowrap ${
                                activeTab === tab
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Content */}
            <div className="max-w-6xl mx-auto px-4 py-6">
                {activeTab === 'Gallery' && <GalleryTab club={club} canUpload={canManageGallery} />}
                {activeTab === 'Members' && <MembersTab club={club} />}
                {activeTab === 'Events' && <EventsTab club={club} isManager={isManager} />}
                {activeTab === 'About' && <AboutTab club={club} />}
                {activeTab === 'Dashboard' && <DashboardTab club={club} onUpdate={fetchClub} />}
            </div>
        </div>
    );
};

// ─── Gallery Tab ──────────────────────────────────────────────

const GalleryTab = ({ club, canUpload }) => {
    const [images, setImages] = useState(club.gallery || []);
    const [uploading, setUploading] = useState(false);
    const [caption, setCaption] = useState('');

    useEffect(() => {
        if (club.gallery) setImages(club.gallery);
    }, [club.gallery]);

    const handleUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('image', file);
            formData.append('caption', caption);
            const res = await axiosInstance.post(`/clubs/${club.id}/gallery`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setImages((prev) => [res.data, ...prev]);
            setCaption('');
            e.target.value = '';
        } catch (err) {
            console.error('Upload failed:', err);
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (imageId) => {
        if (!confirm('Delete this image?')) return;
        try {
            await axiosInstance.delete(`/clubs/${club.id}/gallery/${imageId}`);
            setImages((prev) => prev.filter((img) => img.id !== imageId));
        } catch (err) {
            console.error('Delete failed:', err);
        }
    };

    if (images.length === 0 && !canUpload) {
        return <div className="text-center text-gray-400 py-12">No gallery images yet</div>;
    }

    return (
        <div>
            {canUpload && (
                <div className="bg-white rounded-xl p-4 mb-6 shadow-sm border">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Add Photo</label>
                    <div className="flex gap-3 items-start">
                        <input
                            type="text"
                            placeholder="Caption (optional)"
                            value={caption}
                            onChange={(e) => setCaption(e.target.value)}
                            className="flex-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        <label className={`px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium cursor-pointer hover:bg-blue-700 transition ${uploading ? 'opacity-50' : ''}`}>
                            {uploading ? 'Uploading...' : 'Choose'}
                            <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
                        </label>
                    </div>
                </div>
            )}
            {images.length === 0 && canUpload ? (
                <div className="text-center text-gray-400 py-12">Upload your first photo!</div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {images.map((img) => (
                        <div key={img.id} className="group relative bg-white rounded-xl overflow-hidden shadow-sm border aspect-square">
                            <img src={img.image_url} alt={img.caption || ''} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition flex items-end p-3">
                                {img.caption && (
                                    <p className="text-white text-sm opacity-0 group-hover:opacity-100 transition line-clamp-2">{img.caption}</p>
                                )}
                            </div>
                            {canUpload && (
                                <button
                                    onClick={() => handleDelete(img.id)}
                                    className="absolute top-2 right-2 bg-red-500 text-white w-7 h-7 rounded-full text-xs opacity-0 group-hover:opacity-100 transition hover:bg-red-600"
                                >
                                    ×
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// ─── Members Tab ──────────────────────────────────────────────

const MembersTab = ({ club }) => {
    const members = club.members || [];
    if (members.length === 0) {
        return <div className="text-center text-gray-400 py-12">No members yet</div>;
    }

    const grouped = members.reduce((acc, m) => {
        const role = m.role_tag || 'CUSTOM';
        if (!acc[role]) acc[role] = [];
        acc[role].push(m);
        return acc;
    }, {});

    const roleOrder = ['CORE_COMMITTEE', 'EXECUTIVE', 'TECHNICAL', 'DESIGN', 'PUBLICITY', 'ADMINISTRATIVE_SPONSORS', 'CUSTOM'];

    return (
        <div className="space-y-6">
            {roleOrder.map((role) => {
                const roleMembers = grouped[role];
                if (!roleMembers) return null;
                return (
                    <div key={role}>
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                            {role.replace(/_/g, ' ')}
                            <span className="ml-2 text-gray-400 font-normal">({roleMembers.length})</span>
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {roleMembers.map((m) => (
                                <div key={m.user_id} className="flex items-center gap-3 bg-white rounded-lg p-3 shadow-sm border">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-sm font-bold">
                                        {(m.full_name || m.username)?.charAt(0)?.toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-medium text-sm">{m.full_name || m.username}</p>
                                        <p className="text-xs text-gray-500">@{m.username}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

// ─── Events Tab ───────────────────────────────────────────────

const EventsTab = ({ club, isManager }) => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    const fetchEvents = useCallback(async () => {
        try {
            const res = await axiosInstance.get(`/events?club_id=${club.id}`);
            setEvents(res.data);
        } catch (err) {
            console.error('Error fetching events:', err);
        } finally {
            setLoading(false);
        }
    }, [club.id]);

    useEffect(() => {
        fetchEvents();
    }, [club.id, fetchEvents]);

    const handleCreate = async (formData) => {
        try {
            await axiosInstance.post('/events', { club_id: club.id, ...formData });
            setShowForm(false);
            fetchEvents();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to create event');
        }
    };

    const statusColors = {
        UPCOMING: 'bg-blue-100 text-blue-800',
        LIVE: 'bg-green-100 text-green-800',
        PAST: 'bg-gray-100 text-gray-600',
        POSTPONED: 'bg-yellow-100 text-yellow-800',
        CANCELLED: 'bg-red-100 text-red-800',
    };

    if (loading) return <div className="text-center text-gray-400 py-12">Loading events...</div>;

    return (
        <div>
            {isManager && (
                <div className="mb-6">
                    {showForm ? (
                        <EventCreateForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} />
                    ) : (
                        <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                            + Create Event
                        </button>
                    )}
                </div>
            )}
            {events.length === 0 && !showForm ? (
                <div className="text-center text-gray-400 py-12">No events yet</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {events.map((event) => (
                        <Link key={event.id} to={`/events/${event.id}`} className="bg-white rounded-xl shadow-sm border p-5 hover:shadow-md transition block">
                            <div className="flex items-start justify-between mb-2">
                                <h3 className="font-semibold text-gray-900">{event.title}</h3>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[event.status] || ''}`}>
                                    {event.status}
                                </span>
                            </div>
                            <p className="text-sm text-gray-500 line-clamp-2 mb-3">{event.description || ''}</p>
                            <div className="flex items-center gap-4 text-xs text-gray-400">
                                <span>{new Date(event.start_time).toLocaleDateString()}</span>
                                <span>{event.participation_type}</span>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
};

// ─── Event Create Form ───────────────────────────────────────

const EventCreateForm = ({ onSubmit, onCancel }) => {
    const [form, setForm] = useState({
        title: '', description: '', start_time: '', end_time: '',
        participation_type: 'BOTH',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!form.title || !form.start_time || !form.end_time) {
            alert('Title, start time, and end time are required');
            return;
        }
        if (new Date(form.start_time) >= new Date(form.end_time)) {
            alert('End time must be after start time');
            return;
        }
        onSubmit({
            ...form,
            start_time: new Date(form.start_time).toISOString(),
            end_time: new Date(form.end_time).toISOString(),
        });
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
            <h3 className="font-semibold">Create Event</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                    <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                           className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" required />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" rows={3} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Time *</label>
                    <input type="datetime-local" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                           className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Time *</label>
                    <input type="datetime-local" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                           className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Participation</label>
                    <select value={form.participation_type} onChange={(e) => setForm({ ...form, participation_type: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                        <option value="BOTH">Solo & Team</option>
                        <option value="SOLO">Solo Only</option>
                        <option value="TEAM">Team Only</option>
                    </select>
                </div>
            </div>
            <div className="flex gap-3 justify-end">
                <button type="button" onClick={onCancel} className="px-4 py-2 text-gray-600 text-sm hover:text-gray-800">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Create Event</button>
            </div>
        </form>
    );
};

// ─── About Tab ────────────────────────────────────────────────

const AboutTab = ({ club }) => {
    return (
        <div className="bg-white rounded-xl shadow-sm border p-6 max-w-3xl">
            <h2 className="text-lg font-semibold mb-3">About</h2>
            <p className="text-gray-600 leading-relaxed">{club.description || 'No description provided.'}</p>
            <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
                <div>
                    <span className="text-gray-500">Created</span>
                    <p className="font-medium">{new Date(club.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                    <span className="text-gray-500">Members</span>
                    <p className="font-medium">{club.member_count || 0}</p>
                </div>
                <div>
                    <span className="text-gray-500">Followers</span>
                    <p className="font-medium">{club.follower_count || 0}</p>
                </div>
            </div>
        </div>
    );
};

// ─── Dashboard Tab ────────────────────────────────────────────

const DashboardTab = ({ club, onUpdate }) => {
    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchDashboard = useCallback(async () => {
        try {
            const res = await axiosInstance.get(`/clubs/${club.id}/dashboard`);
            setDashboard(res.data);
        } catch (err) {
            console.error('Error fetching dashboard:', err);
        } finally {
            setLoading(false);
        }
    }, [club.id]);

    useEffect(() => {
        fetchDashboard();
    }, [club.id, fetchDashboard]);

    const handleApprove = async (requestId, status) => {
        try {
            await axiosInstance.patch(`/clubs/${club.id}/requests/${requestId}`, { status });
            fetchDashboard();
            onUpdate();
        } catch (err) {
            console.error('Error handling request:', err);
        }
    };

    if (loading) return <div className="text-center text-gray-400 py-12">Loading dashboard...</div>;
    if (!dashboard) return <div className="text-center text-gray-400 py-12">Failed to load dashboard</div>;

    return (
        <div className="space-y-6">
            {/* Budget Overview */}
            {dashboard.budget && (
                <div className="bg-white rounded-xl shadow-sm border p-6">
                    <h2 className="text-lg font-semibold mb-4">Budget Overview</h2>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-blue-50 rounded-lg p-4 text-center">
                            <p className="text-2xl font-bold text-blue-700">₹{Number(dashboard.budget.balance).toLocaleString()}</p>
                            <p className="text-sm text-blue-600 mt-1">Balance</p>
                        </div>
                        <div className="bg-green-50 rounded-lg p-4 text-center">
                            <p className="text-2xl font-bold text-green-700">+₹{Number(dashboard.budget.totalIncome).toLocaleString()}</p>
                            <p className="text-sm text-green-600 mt-1">Income</p>
                        </div>
                        <div className="bg-red-50 rounded-lg p-4 text-center">
                            <p className="text-2xl font-bold text-red-700">-₹{Number(dashboard.budget.totalExpense).toLocaleString()}</p>
                            <p className="text-sm text-red-600 mt-1">Expenses</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Pending Requests */}
            {dashboard.pendingRequests > 0 && (
                <div className="bg-white rounded-xl shadow-sm border p-6">
                    <h2 className="text-lg font-semibold mb-4">
                        Join Requests
                        <span className="ml-2 text-sm text-gray-500">({dashboard.pendingRequests} pending)</span>
                    </h2>
                    <RequestsList clubId={club.id} onApprove={handleApprove} />
                </div>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl shadow-sm border p-4 text-center">
                    <p className="text-2xl font-bold text-gray-800">{club.member_count || 0}</p>
                    <p className="text-sm text-gray-500 mt-1">Members</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm border p-4 text-center">
                    <p className="text-2xl font-bold text-gray-800">{club.follower_count || 0}</p>
                    <p className="text-sm text-gray-500 mt-1">Followers</p>
                </div>
            </div>
        </div>
    );
};

const RequestsList = ({ clubId, onApprove }) => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchRequests = useCallback(async () => {
        try {
            const res = await axiosInstance.get(`/clubs/${clubId}/requests`);
            setRequests(res.data);
        } catch (err) {
            console.error('Error fetching requests:', err);
        } finally {
            setLoading(false);
        }
    }, [clubId]);

    useEffect(() => {
        fetchRequests();
    }, [clubId, fetchRequests]);

    if (loading) return <p className="text-gray-400 text-sm">Loading...</p>;
    if (requests.length === 0) return <p className="text-gray-400 text-sm">No pending requests</p>;

    return (
        <div className="space-y-2">
            {requests.map((req) => (
                <div key={req.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                    <div>
                        <p className="font-medium text-sm">{req.full_name} <span className="text-gray-500">@{req.username}</span></p>
                        <p className="text-xs text-gray-500">{req.message || 'No message'} · {req.requested_role?.replace(/_/g, ' ')}</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => onApprove(req.id, 'APPROVED')} className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700">Accept</button>
                        <button onClick={() => onApprove(req.id, 'REJECTED')} className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700">Reject</button>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ClubPage;
