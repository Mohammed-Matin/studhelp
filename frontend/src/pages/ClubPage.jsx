import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import UserSearchInput from '../components/UserSearchInput';
import ClubChatPanel from '../components/ClubChatPanel';
import {
    CLUB_ROLES,
    formatRole,
    isManager,
    isClubHead,
    canManageGallery,
} from '../utils/clubRoles';

const BASE_TABS = ['Gallery', 'Members', 'Events', 'About'];

const ClubPage = () => {
    const { id } = useParams();
    const [club, setClub] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('Gallery');
    const [showJoinModal, setShowJoinModal] = useState(false);

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

    const handleRequestJoin = async ({ message, requested_role }) => {
        try {
            await axiosInstance.post(`/clubs/${id}/requests`, { message, requested_role });
            setShowJoinModal(false);
            fetchClub();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to submit join request');
        }
    };

    const userIsManager = isManager(club?.userRole);
    const userIsClubHead = isClubHead(club?.userRole);
    const userCanManageGallery = canManageGallery(club?.userRole);
    const isMember = !!club?.userRole;

    const displayTabs = [...BASE_TABS];
    if (isMember) displayTabs.splice(3, 0, 'Chat');
    if (userIsManager) displayTabs.push('Dashboard');
    if (userIsManager) displayTabs.push('Settings');
    if (!isMember) displayTabs.push('Contact');

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
                        {isMember ? (
                            <span className="px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium capitalize">
                                {formatRole(club.userRole)}
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
                                    onClick={() => setShowJoinModal(true)}
                                    disabled={club.pendingRequest}
                                    className={`px-6 py-2 rounded-lg font-medium text-sm transition ${
                                        club.pendingRequest
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                    }`}
                                >
                                    {club.pendingRequest ? 'Request Pending' : 'Request to Join'}
                                </button>
                            </>
                        )}
                        {userIsManager && (
                            <Link
                                to={`/clubs/${id}/events/new`}
                                className="px-6 py-2 bg-purple-600 text-white rounded-lg font-medium text-sm hover:bg-purple-700 transition"
                            >
                                + Host Event
                            </Link>
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
                {activeTab === 'Gallery' && <GalleryTab club={club} canUpload={userCanManageGallery} />}
                {activeTab === 'Members' && (
                    <MembersTab club={club} isClubHead={userIsClubHead} onUpdate={fetchClub} />
                )}
                {activeTab === 'Events' && <EventsTab club={club} isManager={userIsManager} />}
                {activeTab === 'About' && <AboutTab club={club} />}
                {activeTab === 'Chat' && isMember && (
                    <ClubChatPanel clubId={club.id} clubName={club.name} />
                )}
                {activeTab === 'Dashboard' && userIsManager && (
                    <DashboardTab club={club} onUpdate={fetchClub} />
                )}
                {activeTab === 'Settings' && userIsManager && (
                    <SettingsTab club={club} onUpdate={fetchClub} isClubHead={userIsClubHead} />
                )}
                {activeTab === 'Contact' && !isMember && (
                    <ContactTab club={club} />
                )}
            </div>

            {showJoinModal && (
                <JoinRequestModal
                    onSubmit={handleRequestJoin}
                    onClose={() => setShowJoinModal(false)}
                />
            )}
        </div>
    );
};

// ─── Join Request Modal ───────────────────────────────────────

const JoinRequestModal = ({ onSubmit, onClose }) => {
    const [message, setMessage] = useState('');
    const [requestedRole, setRequestedRole] = useState('CUSTOM');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        await onSubmit({ message, requested_role: requestedRole });
        setSubmitting(false);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                <h3 className="text-lg font-semibold mb-4">Request to Join Club</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Role</label>
                        <select
                            value={requestedRole}
                            onChange={(e) => setRequestedRole(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            {CLUB_ROLES.filter((r) => r.value !== 'CORE_COMMITTEE').map((r) => (
                                <option key={r.value} value={r.value}>{r.label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Why do you want to join?"
                            rows={3}
                            className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                        />
                    </div>
                    <div className="flex gap-3 justify-end">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 text-sm">Cancel</button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
                        >
                            {submitting ? 'Submitting...' : 'Submit Request'}
                        </button>
                    </div>
                </form>
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

const MembersTab = ({ club, isClubHead, onUpdate }) => {
    const [members, setMembers] = useState(club.members || []);
    const [showAddForm, setShowAddForm] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [roleTag, setRoleTag] = useState('CUSTOM');
    const [adding, setAdding] = useState(false);

    useEffect(() => {
        setMembers(club.members || []);
    }, [club.members]);

    const handleAddMember = async (e) => {
        e.preventDefault();
        if (!selectedUser) {
            alert('Please search and select a user');
            return;
        }
        setAdding(true);
        try {
            await axiosInstance.post(`/clubs/${club.id}/members`, {
                user_id: selectedUser.id,
                role_tag: roleTag,
            });
            setShowAddForm(false);
            setSelectedUser(null);
            setRoleTag('CUSTOM');
            onUpdate();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to add member');
        } finally {
            setAdding(false);
        }
    };

    const handleRoleChange = async (userId, role_tag) => {
        try {
            await axiosInstance.patch(`/clubs/${club.id}/members/${userId}`, { role_tag });
            onUpdate();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to update role');
        }
    };

    const handleRemoveMember = async (userId) => {
        if (!confirm('Remove this member from the club?')) return;
        try {
            await axiosInstance.delete(`/clubs/${club.id}/members/${userId}`);
            onUpdate();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to remove member');
        }
    };

    if (members.length === 0 && !isClubHead) {
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
            {isClubHead && (
                <div className="bg-white rounded-xl shadow-sm border p-4">
                    {showAddForm ? (
                        <form onSubmit={handleAddMember} className="space-y-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Search User</label>
                                {selectedUser ? (
                                    <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                                            {(selectedUser.full_name || selectedUser.username)?.charAt(0)?.toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium">{selectedUser.full_name || selectedUser.username}</p>
                                            <p className="text-xs text-gray-500">@{selectedUser.username}</p>
                                        </div>
                                        <button type="button" onClick={() => setSelectedUser(null)} className="text-gray-400 hover:text-gray-600 text-sm">
                                            Change
                                        </button>
                                    </div>
                                ) : (
                                    <UserSearchInput
                                        onSelect={setSelectedUser}
                                        excludeIds={members.map((m) => m.user_id)}
                                        placeholder="Type name or username (min 2 chars)..."
                                    />
                                )}
                            </div>
                            <div className="flex flex-wrap gap-3 items-end">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Role</label>
                                    <select
                                        value={roleTag}
                                        onChange={(e) => setRoleTag(e.target.value)}
                                        className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    >
                                        {CLUB_ROLES.map((r) => (
                                            <option key={r.value} value={r.value}>{r.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <button
                                    type="submit"
                                    disabled={!selectedUser || adding}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {adding ? 'Adding...' : 'Add Member'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setShowAddForm(false); setSelectedUser(null); }}
                                    className="px-4 py-2 text-gray-600 text-sm"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    ) : (
                        <button onClick={() => setShowAddForm(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                            + Add Member
                        </button>
                    )}
                </div>
            )}

            {roleOrder.map((role) => {
                const roleMembers = grouped[role];
                if (!roleMembers) return null;
                return (
                    <div key={role}>
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                            {formatRole(role)}
                            <span className="ml-2 text-gray-400 font-normal">({roleMembers.length})</span>
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {roleMembers.map((m) => (
                                <div key={m.user_id} className="flex items-center gap-3 bg-white rounded-lg p-3 shadow-sm border">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                                        {(m.full_name || m.username)?.charAt(0)?.toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm truncate">{m.full_name || m.username}</p>
                                        <p className="text-xs text-gray-500">@{m.username}</p>
                                        {isClubHead && m.role_tag !== 'CORE_COMMITTEE' && (
                                            <select
                                                value={m.role_tag}
                                                onChange={(e) => handleRoleChange(m.user_id, e.target.value)}
                                                className="mt-1 text-xs border rounded px-1 py-0.5"
                                            >
                                                {CLUB_ROLES.map((r) => (
                                                    <option key={r.value} value={r.value}>{r.label}</option>
                                                ))}
                                            </select>
                                        )}
                                    </div>
                                    {isClubHead && m.role_tag !== 'CORE_COMMITTEE' && (
                                        <button
                                            onClick={() => handleRemoveMember(m.user_id)}
                                            className="text-red-500 hover:text-red-700 text-xs font-medium flex-shrink-0"
                                        >
                                            Remove
                                        </button>
                                    )}
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
    const [events, setEvents] = useState(club.events || []);
    const [loading, setLoading] = useState(!club.events?.length);
    const [filter, setFilter] = useState('ALL');

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

    const statusColors = {
        UPCOMING: 'bg-blue-100 text-blue-800',
        LIVE: 'bg-green-100 text-green-800',
        PAST: 'bg-gray-100 text-gray-600',
        POSTPONED: 'bg-yellow-100 text-yellow-800',
        CANCELLED: 'bg-red-100 text-red-800',
    };

    const filtered = filter === 'ALL' ? events : events.filter((e) => e.status === filter);

    if (loading) return <div className="text-center text-gray-400 py-12">Loading events...</div>;

    return (
        <div>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div className="flex gap-2 flex-wrap">
                    {['ALL', 'UPCOMING', 'LIVE', 'PAST'].map((s) => (
                        <button
                            key={s}
                            onClick={() => setFilter(s)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                                filter === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
                        </button>
                    ))}
                </div>
                {isManager && (
                    <Link
                        to={`/clubs/${club.id}/events/new`}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700"
                    >
                        + Host Event
                    </Link>
                )}
            </div>

            {filtered.length === 0 ? (
                <div className="text-center text-gray-400 py-12">
                    {isManager ? (
                        <div>
                            <p className="mb-3">No events yet — host your first event!</p>
                            <Link to={`/clubs/${club.id}/events/new`} className="text-blue-600 hover:underline font-medium">
                                Create Event
                            </Link>
                        </div>
                    ) : (
                        'No events yet'
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filtered.map((event) => (
                        <Link key={event.id} to={`/events/${event.id}`} className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition block group">
                            {event.banner_url && (
                                <div className="h-32 bg-gray-100 overflow-hidden">
                                    <img src={event.banner_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition" />
                                </div>
                            )}
                            <div className="p-5">
                                <div className="flex items-start justify-between mb-2">
                                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition">{event.title}</h3>
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ml-2 ${statusColors[event.status] || ''}`}>
                                        {event.status}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-500 line-clamp-2 mb-3">{event.description || ''}</p>
                                <div className="flex items-center gap-4 text-xs text-gray-400">
                                    <span>{new Date(event.start_time).toLocaleDateString()}</span>
                                    <span>{event.participation_type}</span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
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
            <div className="bg-white rounded-xl shadow-sm border p-6">
                <h2 className="text-lg font-semibold mb-4">
                    Join Requests
                    {dashboard.pendingRequests > 0 && (
                        <span className="ml-2 text-sm text-gray-500">({dashboard.pendingRequests} pending)</span>
                    )}
                </h2>
                <RequestsList clubId={club.id} onApprove={handleApprove} />
            </div>

            {/* Recent Events */}
            {dashboard.recentEvents?.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border p-6">
                    <h2 className="text-lg font-semibold mb-4">Recent Events</h2>
                    <div className="space-y-2">
                        {dashboard.recentEvents.map((ev) => (
                            <Link key={ev.id} to={`/events/${ev.id}`}
                                  className="flex items-center justify-between bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition">
                                <span className="font-medium text-sm">{ev.title}</span>
                                <span className="text-xs text-gray-500">{ev.status} · {new Date(ev.start_time).toLocaleDateString()}</span>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Follower Messages */}
            <FollowerMessagesSection clubId={club.id} />

            {/* Budget Transactions */}
            <BudgetSection clubId={club.id} />

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

// ─── Settings Tab (Managers) ──────────────────────────────────

const SettingsTab = ({ club, onUpdate, isClubHead }) => {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        name: club.name || '',
        description: club.description || '',
        logo_url: club.logo_url || '',
        cover_url: club.cover_url || '',
    });
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [confirmName, setConfirmName] = useState('');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage('');
        try {
            await axiosInstance.patch(`/clubs/${club.id}`, {
                name: form.name.trim(),
                description: form.description.trim() || undefined,
                logo_url: form.logo_url.trim() || undefined,
                cover_url: form.cover_url.trim() || undefined,
            });
            setMessage('Club updated successfully');
            onUpdate();
        } catch (err) {
            setMessage(err.response?.data?.error || 'Failed to update club');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteClub = async () => {
        if (confirmName !== club.name) {
            alert('Club name does not match. Type the exact name to confirm deletion.');
            return;
        }
        if (!confirm(`Permanently delete "${club.name}"? All events, members, and data will be removed.`)) return;

        setDeleting(true);
        try {
            await axiosInstance.delete(`/clubs/${club.id}`);
            navigate('/clubs');
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to delete club');
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="space-y-6 max-w-2xl">
        <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4">Club Settings</h2>
            {message && (
                <div className={`mb-4 p-3 rounded-lg text-sm ${message.includes('success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {message}
                </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Club Name</label>
                    <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                           className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                              rows={4} className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
                    <input type="url" value={form.logo_url} onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
                           placeholder="https://..." className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cover Image URL</label>
                    <input type="url" value={form.cover_url} onChange={(e) => setForm({ ...form, cover_url: e.target.value })}
                           placeholder="https://..." className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <button type="submit" disabled={saving}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                    {saving ? 'Saving...' : 'Save Changes'}
                </button>
            </form>
        </div>

        {isClubHead && (
            <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
                <h2 className="text-lg font-semibold text-red-700 mb-2">Danger Zone</h2>
                <p className="text-sm text-gray-600 mb-4">
                    Deleting this club permanently removes all members, events, gallery, budget records, and chat history. This cannot be undone.
                </p>
                <div className="space-y-3">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Type <strong>{club.name}</strong> to confirm
                        </label>
                        <input
                            type="text"
                            value={confirmName}
                            onChange={(e) => setConfirmName(e.target.value)}
                            placeholder={club.name}
                            className="w-full px-3 py-2 border border-red-200 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none"
                        />
                    </div>
                    <button
                        type="button"
                        onClick={handleDeleteClub}
                        disabled={deleting || confirmName !== club.name}
                        className="px-6 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {deleting ? 'Deleting...' : 'Delete Club Permanently'}
                    </button>
                </div>
            </div>
        )}
        </div>
    );
};

// ─── Contact Tab (Non-members / Students) ─────────────────────

const ContactTab = ({ club }) => {
    const [message, setMessage] = useState('');
    const [sent, setSent] = useState(false);
    const [sending, setSending] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!message.trim()) return;
        setSending(true);
        try {
            await axiosInstance.post(`/clubs/${club.id}/messages`, { message: message.trim() });
            setSent(true);
            setMessage('');
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to send message');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border p-6 max-w-xl">
            <h2 className="text-lg font-semibold mb-2">Contact Club</h2>
            <p className="text-gray-600 text-sm mb-6">
                Send a message to the club committee. They will be able to reply from their dashboard.
            </p>
            {sent ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-700 text-sm">
                    Message sent! The club committee will get back to you.
                    <button onClick={() => setSent(false)} className="block mt-2 text-green-800 underline">
                        Send another message
                    </button>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Ask about membership, events, or collaborations..."
                        rows={4}
                        className="w-full px-4 py-3 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                        required
                    />
                    <button type="submit" disabled={sending}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                        {sending ? 'Sending...' : 'Send Message'}
                    </button>
                </form>
            )}
        </div>
    );
};

const FollowerMessagesSection = ({ clubId }) => {
    const [messages, setMessages] = useState([]);
    const [replying, setReplying] = useState(null);
    const [replyText, setReplyText] = useState('');

    const fetchMessages = useCallback(async () => {
        try {
            const res = await axiosInstance.get(`/clubs/${clubId}/messages`);
            setMessages(res.data);
        } catch (err) {
            console.error('Error fetching messages:', err);
        }
    }, [clubId]);

    useEffect(() => {
        fetchMessages();
    }, [clubId, fetchMessages]);

    const handleReply = async (messageId) => {
        if (!replyText.trim()) return;
        try {
            await axiosInstance.patch(`/clubs/${clubId}/messages/${messageId}`, { admin_reply: replyText.trim() });
            setReplying(null);
            setReplyText('');
            fetchMessages();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to send reply');
        }
    };

    if (messages.length === 0) return null;

    return (
        <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4">Follower Messages</h2>
            <div className="space-y-3">
                {messages.slice(0, 5).map((msg) => (
                    <div key={msg.id} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                            <p className="font-medium text-sm">{msg.full_name || msg.username}</p>
                            <span className="text-xs text-gray-400">{new Date(msg.created_at).toLocaleDateString()}</span>
                        </div>
                        <p className="text-sm text-gray-700">{msg.message}</p>
                        {msg.admin_reply ? (
                            <p className="text-sm text-blue-700 mt-2 bg-blue-50 rounded p-2">Reply: {msg.admin_reply}</p>
                        ) : replying === msg.id ? (
                            <div className="mt-3 flex gap-2">
                                <input type="text" value={replyText} onChange={(e) => setReplyText(e.target.value)}
                                       placeholder="Type your reply..." className="flex-1 px-3 py-1.5 border rounded-lg text-sm" />
                                <button onClick={() => handleReply(msg.id)} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium">Send</button>
                                <button onClick={() => setReplying(null)} className="px-3 py-1.5 text-gray-600 text-xs">Cancel</button>
                            </div>
                        ) : (
                            <button onClick={() => setReplying(msg.id)} className="mt-2 text-blue-600 text-xs font-medium hover:underline">Reply</button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

const BudgetSection = ({ clubId }) => {
    const [transactions, setTransactions] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ type: 'EXPENSE', category: '', amount: '', description: '' });

    const fetchTransactions = useCallback(async () => {
        try {
            const res = await axiosInstance.get(`/clubs/${clubId}/budget/transactions?limit=10`);
            setTransactions(res.data.transactions || []);
        } catch (err) {
            console.error('Error fetching transactions:', err);
        }
    }, [clubId]);

    useEffect(() => {
        fetchTransactions();
    }, [clubId, fetchTransactions]);

    const handleAdd = async (e) => {
        e.preventDefault();
        try {
            await axiosInstance.post(`/clubs/${clubId}/budget/transactions`, {
                ...form,
                amount: parseFloat(form.amount),
            });
            setShowForm(false);
            setForm({ type: 'EXPENSE', category: '', amount: '', description: '' });
            fetchTransactions();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to add transaction');
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Budget Transactions</h2>
                <button onClick={() => setShowForm(!showForm)} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700">
                    {showForm ? 'Cancel' : '+ Add Transaction'}
                </button>
            </div>
            {showForm && (
                <form onSubmit={handleAdd} className="bg-gray-50 rounded-lg p-4 mb-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                    <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                            className="px-3 py-2 border rounded-lg text-sm">
                        <option value="INCOME">Income</option>
                        <option value="EXPENSE">Expense</option>
                    </select>
                    <input type="text" placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                           className="px-3 py-2 border rounded-lg text-sm" required />
                    <input type="number" placeholder="Amount" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })}
                           className="px-3 py-2 border rounded-lg text-sm" min="0.01" step="0.01" required />
                    <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">Add</button>
                </form>
            )}
            {transactions.length === 0 ? (
                <p className="text-gray-400 text-sm">No transactions yet</p>
            ) : (
                <div className="space-y-2">
                    {transactions.map((tx) => (
                        <div key={tx.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3 text-sm">
                            <div>
                                <span className="font-medium">{tx.category}</span>
                                {tx.description && <span className="text-gray-500 ml-2">— {tx.description}</span>}
                            </div>
                            <span className={`font-semibold ${tx.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                                {tx.type === 'INCOME' ? '+' : '-'}₹{Number(tx.amount).toLocaleString()}
                            </span>
                        </div>
                    ))}
                </div>
            )}
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
