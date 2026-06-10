import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import UserSearchInput from '../components/UserSearchInput';
import ClubChatPanel from '../components/ClubChatPanel';
import CustomSelect from '../components/CustomSelect';
import NumberInput from '../components/NumberInput';
import {
    CLUB_ROLES,
    formatRole,
    isManager,
    isClubHead,
    canManageGallery,
} from '../utils/clubRoles';
import { getClubCover, getClubLogo, getEventBanner, SUGGESTED_COVERS } from '../utils/images';

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
            <div className="min-h-screen bg-[#07070f] flex items-center justify-center">
                <div className="text-slate-400 text-lg animate-pulse">Loading club...</div>
            </div>
        );
    }

    if (!club) {
        return (
            <div className="min-h-screen bg-[#07070f] flex items-center justify-center">
                <div className="text-slate-400 text-lg">Club not found</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#07070f]">
            {/* Cover Image */}
            <div className="relative h-72 md:h-96 overflow-hidden">
                <img src={getClubCover(club)} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#07070f] via-[#07070f]/50 to-purple-900/30" />
                <div className="absolute inset-0 bg-grid opacity-30" />
            </div>

            {/* Club Info Section */}
            <div className="max-w-6xl mx-auto px-4 -mt-20 relative z-10">
                <div className="flex flex-col md:flex-row md:items-end gap-4 md:gap-6">
                    {/* Logo */}
                    <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl border-4 border-purple-500/40 shadow-2xl shadow-purple-500/20 overflow-hidden flex-shrink-0 ring-2 ring-cyan-400/20">
                        <img src={getClubLogo(club)} alt={club.name} className="w-full h-full object-cover" />
                    </div>

                    {/* Name & Stats */}
                    <div className="flex-1 pb-2">
                        <p className="text-xs tracking-[0.2em] uppercase text-cyan-400 mb-1">SVNIT Club</p>
                        <h1 className="font-display text-3xl md:text-4xl font-bold text-white drop-shadow-lg">{club.name}</h1>
                        <p className="text-slate-300 text-sm mt-2 line-clamp-2 max-w-xl">{club.description}</p>
                        <div className="flex gap-6 mt-4 text-sm">
                            <span className="glass-card px-3 py-1 rounded-full text-cyan-300"><strong className="text-white">{club.member_count || 0}</strong> members</span>
                            <span className="glass-card px-3 py-1 rounded-full text-purple-300"><strong className="text-white">{club.follower_count || 0}</strong> followers</span>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pb-2">
                        {isMember ? (
                            <span className="px-4 py-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg text-sm font-medium capitalize">
                                {formatRole(club.userRole)}
                            </span>
                        ) : (
                            <>
                                <button
                                    onClick={handleFollow}
                                    className={`px-5 py-2 rounded-lg font-medium text-sm transition btn-ghost ${
                                        club.isFollower ? 'border-cyan-500/50 text-cyan-300' : ''
                                    }`}
                                >
                                    {club.isFollower ? 'Following' : 'Follow'}
                                </button>
                                <button
                                    onClick={() => setShowJoinModal(true)}
                                    disabled={club.pendingRequest}
                                    className={`px-5 py-2 rounded-lg font-medium text-sm transition ${
                                        club.pendingRequest
                                            ? 'opacity-40 cursor-not-allowed btn-ghost'
                                            : 'btn-primary'
                                    }`}
                                >
                                    {club.pendingRequest ? 'Request Pending' : 'Join Club'}
                                </button>
                            </>
                        )}
                        {userIsManager && (
                            <Link to={`/clubs/${id}/events/new`} className="btn-primary text-sm">
                                + Host Event
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="max-w-6xl mx-auto px-4 mt-8">
                <div className="flex gap-1 overflow-x-auto glass-card rounded-xl p-1.5">
                    {displayTabs.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-5 py-2.5 text-sm font-medium rounded-lg transition whitespace-nowrap ${
                                activeTab === tab
                                    ? 'bg-purple-600/30 text-purple-200 border border-purple-500/40'
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
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
            <div className="bg-theme-elevated rounded-xl shadow-xl max-w-md w-full p-6 border border-theme-nav">
                <h3 className="text-lg font-semibold mb-4 text-theme">Request to Join Club</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-theme-muted mb-1">Preferred Role</label>
                        <CustomSelect
                            value={requestedRole}
                            onChange={(e) => setRequestedRole(e.target.value)}
                            options={CLUB_ROLES.filter(r => r.value !== 'CORE_COMMITTEE')}
                            className="w-full bg-theme-nav"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-theme-muted mb-1">Message</label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Why do you want to join?"
                            rows={3}
                            className="w-full px-3 py-2 border border-theme-nav rounded-lg text-sm bg-theme-nav text-theme focus:ring-2 focus:ring-cyan-400 outline-none resize-none theme-textarea"
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
        return <div className="text-center text-theme-muted py-12">No gallery images yet</div>;
    }

    return (
        <div>
            {canUpload && (
                <div className="glass-card rounded-xl p-4 mb-6 glow-border">
                    <label className="block text-sm font-medium text-theme-muted mb-2">Add Photo</label>
                    <div className="flex gap-3 items-start">
                        <input
                            type="text"
                            placeholder="Caption (optional)"
                            value={caption}
                            onChange={(e) => setCaption(e.target.value)}
                            className="flex-1 input-dark"
                        />
                        <label className={`btn-primary px-4 py-2 text-sm cursor-pointer ${uploading ? 'opacity-50' : ''}`}>
                            {uploading ? 'Uploading...' : 'Choose'}
                            <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
                        </label>
                    </div>
                </div>
            )}
            {images.length === 0 && canUpload ? (
                <div className="text-center text-theme-muted py-12">Upload your first photo!</div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {images.map((img) => (
                        <div key={img.id} className="group relative glass-card rounded-xl overflow-hidden aspect-square">
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
        return <div className="text-center text-theme-muted py-12">No members yet</div>;
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
                <div className="glass-card rounded-xl p-4">
                    {showAddForm ? (
                        <form onSubmit={handleAddMember} className="space-y-3">
                            <div>
                                <label className="block text-xs font-medium text-theme-muted mb-1">Search User</label>
                                {selectedUser ? (
                                    <div className="flex items-center gap-3 bg-[var(--input-bg)] border border-theme rounded-lg px-3 py-2">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                                            {(selectedUser.full_name || selectedUser.username)?.charAt(0)?.toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-theme">{selectedUser.full_name || selectedUser.username}</p>
                                            <p className="text-xs text-theme-muted">@{selectedUser.username}</p>
                                        </div>
                                        <button type="button" onClick={() => setSelectedUser(null)} className="text-theme-muted hover:text-theme text-sm">
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
                                    <label className="block text-xs font-medium text-theme-muted mb-1">Role</label>
                                    <CustomSelect
                                        value={roleTag}
                                        onChange={(e) => setRoleTag(e.target.value)}
                                        options={CLUB_ROLES}
                                        className="w-40"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={!selectedUser || adding}
                                    className="btn-primary px-4 py-2 text-sm disabled:opacity-50"
                                >
                                    {adding ? 'Adding...' : 'Add Member'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setShowAddForm(false); setSelectedUser(null); }}
                                    className="px-4 py-2 text-theme-muted hover:text-theme text-sm transition"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    ) : (
                        <button onClick={() => setShowAddForm(true)} className="btn-primary px-4 py-2 text-sm">
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
                        <h3 className="text-sm font-semibold text-theme-muted uppercase tracking-wider mb-3">
                            {formatRole(role)}
                            <span className="ml-2 text-theme-faint font-normal">({roleMembers.length})</span>
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {roleMembers.map((m) => (
                                <div key={m.user_id} className="flex items-center gap-3 glass-card rounded-lg p-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                                        {(m.full_name || m.username)?.charAt(0)?.toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm truncate text-theme">{m.full_name || m.username}</p>
                                        <p className="text-xs text-theme-muted">@{m.username}</p>
                                        {isClubHead && m.role_tag !== 'CORE_COMMITTEE' && (
                                            <div className="mt-1 w-36">
                                                <CustomSelect
                                                    value={m.role_tag}
                                                    onChange={(e) => handleRoleChange(m.user_id, e.target.value)}
                                                    options={CLUB_ROLES}
                                                    className="py-1 px-2 text-xs"
                                                />
                                            </div>
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
        UPCOMING: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30',
        LIVE: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
        PAST: 'bg-slate-500/20 text-slate-400 border border-slate-500/30',
        POSTPONED: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
        CANCELLED: 'bg-red-500/20 text-red-300 border border-red-500/30',
    };

    const filtered = filter === 'ALL' ? events : events.filter((e) => e.status === filter);

    if (loading) return <div className="text-center text-theme-muted py-12">Loading events...</div>;

    return (
        <div>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div className="flex gap-2 flex-wrap">
                    {['ALL', 'UPCOMING', 'LIVE', 'PAST'].map((s) => (
                        <button
                            key={s}
                            onClick={() => setFilter(s)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                                filter === s ? 'bg-purple-600/40 text-purple-200 border border-purple-500/40' : 'text-slate-400 hover:bg-white/5'
                            }`}
                        >
                            {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
                        </button>
                    ))}
                </div>
                {isManager && (
                    <Link
                        to={`/clubs/${club.id}/events/new`}
                        className="btn-primary px-4 py-2 text-sm"
                    >
                        + Host Event
                    </Link>
                )}
            </div>

            {filtered.length === 0 ? (
                <div className="text-center text-theme-muted py-12">
                    {isManager ? (
                        <div>
                            <p className="mb-3">No events yet — host your first event!</p>
                            <Link to={`/clubs/${club.id}/events/new`} className="text-cyan-400 hover:text-cyan-300 transition hover:underline font-medium">
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
                        <Link key={event.id} to={`/events/${event.id}`} className="glass-card rounded-xl overflow-hidden hover:scale-[1.01] transition-all block group glow-border">
                            <div className="h-36 overflow-hidden relative">
                                <img src={getEventBanner(event)} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f1a] to-transparent" />
                            </div>
                            <div className="p-5">
                                <div className="flex items-start justify-between mb-2">
                                    <h3 className="font-display font-semibold text-white group-hover:text-purple-300 transition">{event.title}</h3>
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ml-2 ${statusColors[event.status] || ''}`}>
                                        {event.status}
                                    </span>
                                </div>
                                <p className="text-sm text-slate-400 line-clamp-2 mb-3">{event.description || ''}</p>
                                <div className="flex items-center gap-4 text-xs text-slate-500">
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
        <div className="glass-card rounded-xl p-6 max-w-3xl">
            <h2 className="text-lg font-semibold mb-3">About</h2>
            <p className="text-theme-muted leading-relaxed">{club.description || 'No description provided.'}</p>
            <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
                <div>
                    <span className="text-theme-faint">Created</span>
                    <p className="font-medium text-theme">{new Date(club.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                    <span className="text-theme-faint">Members</span>
                    <p className="font-medium text-theme">{club.member_count || 0}</p>
                </div>
                <div>
                    <span className="text-theme-faint">Followers</span>
                    <p className="font-medium text-theme">{club.follower_count || 0}</p>
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

    if (loading) return <div className="text-center text-theme-muted py-12">Loading dashboard...</div>;
    if (!dashboard) return <div className="text-center text-theme-muted py-12">Failed to load dashboard</div>;

    return (
        <div className="space-y-6">
            {/* Budget Overview */}
            {dashboard.budget && (
                <div className="glass-card rounded-xl p-6">
                    <h2 className="text-lg font-semibold mb-4">Budget Overview</h2>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-4 text-center">
                            <p className="text-2xl font-bold text-cyan-400">₹{Number(dashboard.budget.balance).toLocaleString()}</p>
                            <p className="text-sm text-cyan-500 mt-1">Balance</p>
                        </div>
                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4 text-center">
                            <p className="text-2xl font-bold text-emerald-400">+₹{Number(dashboard.budget.totalIncome).toLocaleString()}</p>
                            <p className="text-sm text-emerald-500 mt-1">Income</p>
                        </div>
                        <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-4 text-center">
                            <p className="text-2xl font-bold text-rose-400">-₹{Number(dashboard.budget.totalExpense).toLocaleString()}</p>
                            <p className="text-sm text-rose-500 mt-1">Expenses</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Pending Requests */}
            <div className="glass-card rounded-xl p-6">
                <h2 className="text-lg font-semibold mb-4">
                    Join Requests
                    {dashboard.pendingRequests > 0 && (
                        <span className="ml-2 text-sm text-theme-muted">({dashboard.pendingRequests} pending)</span>
                    )}
                </h2>
                <RequestsList clubId={club.id} onApprove={handleApprove} />
            </div>

            {/* Recent Events */}
            {dashboard.recentEvents?.length > 0 && (
                <div className="glass-card rounded-xl p-6">
                    <h2 className="text-lg font-semibold mb-4">Recent Events</h2>
                    <div className="space-y-2">
                        {dashboard.recentEvents.map((ev) => (
                            <Link key={ev.id} to={`/events/${ev.id}`}
                                  className="flex items-center justify-between bg-theme-elevated border border-theme rounded-lg p-3 hover:bg-[var(--hover-bg)] transition text-theme">
                                <span className="font-medium text-sm">{ev.title}</span>
                                <span className="text-xs text-theme-muted">{ev.status} · {new Date(ev.start_time).toLocaleDateString()}</span>
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
                <div className="glass-card rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-theme">{club.member_count || 0}</p>
                    <p className="text-sm text-theme-muted mt-1">Members</p>
                </div>
                <div className="glass-card rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-theme">{club.follower_count || 0}</p>
                    <p className="text-sm text-theme-muted mt-1">Followers</p>
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
        <div className="glass-card rounded-xl p-6">
            <h2 className="font-display text-lg font-semibold text-white mb-1">Club Settings</h2>
            <p className="text-xs text-slate-500 mb-4">Image URLs are saved to the database and shown across the platform.</p>
            {message && (
                <div className={`mb-4 p-3 rounded-lg text-sm ${message.includes('success') ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30' : 'bg-red-500/10 text-red-300 border border-red-500/30'}`}>
                    {message}
                </div>
            )}
            {(form.cover_url || form.logo_url) && (
                <div className="mb-4 rounded-xl overflow-hidden h-32 relative">
                    <img src={form.cover_url || getClubCover({ ...club, cover_url: form.cover_url })} alt="" className="w-full h-full object-cover opacity-60" />
                    <div className="absolute bottom-2 left-2 w-12 h-12 rounded-lg overflow-hidden border-2 border-purple-500/50">
                        <img src={form.logo_url || getClubLogo(club)} alt="" className="w-full h-full object-cover" />
                    </div>
                </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Club Name</label>
                    <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                           className="input-dark" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
                    <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                              rows={4} className="input-dark resize-none" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Logo URL</label>
                    <input type="url" value={form.logo_url} onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
                           placeholder="https://images.unsplash.com/..." className="input-dark" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Cover Image URL</label>
                    <input type="url" value={form.cover_url} onChange={(e) => setForm({ ...form, cover_url: e.target.value })}
                           placeholder="https://images.unsplash.com/..." className="input-dark" />
                    <div className="flex gap-2 mt-2 flex-wrap">
                        {SUGGESTED_COVERS.map((url) => (
                            <button key={url} type="button" onClick={() => setForm({ ...form, cover_url: url })}
                                    className="w-16 h-10 rounded-lg overflow-hidden border border-white/10 hover:border-purple-500/50 transition">
                                <img src={url} alt="" className="w-full h-full object-cover" />
                            </button>
                        ))}
                    </div>
                </div>
                <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
                    {saving ? 'Saving...' : 'Save Changes'}
                </button>
            </form>
        </div>

        {isClubHead && (
            <div className="glass-card rounded-xl border-rose-500/30 p-6">
                <h2 className="text-lg font-semibold text-rose-400 mb-2">Danger Zone</h2>
                <p className="text-sm text-theme-muted mb-4">
                    Deleting this club permanently removes all members, events, gallery, budget records, and chat history. This cannot be undone.
                </p>
                <div className="space-y-3">
                    <div>
                        <label className="block text-sm font-medium text-theme-muted mb-1">
                            Type <strong>{club.name}</strong> to confirm
                        </label>
                        <input
                            type="text"
                            value={confirmName}
                            onChange={(e) => setConfirmName(e.target.value)}
                            placeholder={club.name}
                            className="input-dark border-rose-500/30 focus:border-rose-500 focus:ring-rose-500/20"
                        />
                    </div>
                    <button
                        type="button"
                        onClick={handleDeleteClub}
                        disabled={deleting || confirmName !== club.name}
                        className="px-6 py-2 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg text-sm font-medium hover:bg-rose-500/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
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
        <div className="glass-card rounded-xl p-6 max-w-xl">
            <h2 className="text-lg font-semibold mb-2">Contact Club</h2>
            <p className="text-theme-muted text-sm mb-6">
                Send a message to the club committee. They will be able to reply from their dashboard.
            </p>
            {sent ? (
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4 text-emerald-300 text-sm">
                    Message sent! The club committee will get back to you.
                    <button onClick={() => setSent(false)} className="block mt-2 text-emerald-400 hover:text-emerald-300 underline">
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
                        className="input-dark resize-none w-full"
                        required
                    />
                    <button type="submit" disabled={sending}
                            className="btn-primary px-6 py-2 text-sm disabled:opacity-50">
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
        <div className="glass-card rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">Follower Messages</h2>
            <div className="space-y-3">
                {messages.slice(0, 5).map((msg) => (
                    <div key={msg.id} className="bg-[var(--input-bg)] border border-theme rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                            <p className="font-medium text-sm text-theme">{msg.full_name || msg.username}</p>
                            <span className="text-xs text-theme-muted">{new Date(msg.created_at).toLocaleDateString()}</span>
                        </div>
                        <p className="text-sm text-theme-muted">{msg.message}</p>
                        {msg.admin_reply ? (
                            <p className="text-sm text-cyan-300 mt-2 bg-cyan-500/10 border border-cyan-500/20 rounded p-2">Reply: {msg.admin_reply}</p>
                        ) : replying === msg.id ? (
                            <div className="mt-3 flex gap-2">
                                <input type="text" value={replyText} onChange={(e) => setReplyText(e.target.value)}
                                       placeholder="Type your reply..." className="flex-1 input-dark !py-1.5" />
                                <button onClick={() => handleReply(msg.id)} className="btn-primary !px-3 !py-1.5 !text-xs">Send</button>
                                <button onClick={() => setReplying(null)} className="px-3 py-1.5 text-theme-muted hover:text-theme text-xs transition">Cancel</button>
                            </div>
                        ) : (
                            <button onClick={() => setReplying(msg.id)} className="mt-2 text-cyan-400 hover:text-cyan-300 text-xs font-medium hover:underline">Reply</button>
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
        <div className="glass-card rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Budget Transactions</h2>
                <button onClick={() => setShowForm(!showForm)} className="btn-primary !px-3 !py-1.5 !text-xs">
                    {showForm ? 'Cancel' : '+ Add Transaction'}
                </button>
            </div>
            {showForm && (
                <form onSubmit={handleAdd} className="bg-[var(--input-bg)] border border-theme rounded-lg p-4 mb-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                    <CustomSelect
                        value={form.type} 
                        onChange={(e) => setForm({ ...form, type: e.target.value })}
                        options={[
                            { value: 'INCOME', label: 'Income' },
                            { value: 'EXPENSE', label: 'Expense' }
                        ]}
                    />
                    <input type="text" placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                           className="input-dark !py-2" required />
                    <NumberInput placeholder="Amount" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })}
                           className="[&>input]:!bg-[var(--input-bg)] [&>input]:border-theme [&>input]:rounded-lg [&>input]:px-3 [&>input]:py-2 [&>input]:text-sm" min="0.01" step="0.01" required />
                    <button type="submit" className="btn-primary !px-4 !py-2">Add</button>
                </form>
            )}
            {transactions.length === 0 ? (
                <p className="text-theme-muted text-sm">No transactions yet</p>
            ) : (
                <div className="space-y-2">
                    {transactions.map((tx) => (
                        <div key={tx.id} className="flex items-center justify-between bg-theme-elevated border border-theme rounded-lg p-3 text-sm">
                            <div>
                                <span className="font-medium text-theme">{tx.category}</span>
                                {tx.description && <span className="text-theme-faint ml-2">— {tx.description}</span>}
                            </div>
                            <span className={`font-semibold ${tx.type === 'INCOME' ? 'text-emerald-400' : 'text-rose-400'}`}>
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

    if (loading) return <p className="text-theme-muted text-sm">Loading...</p>;
    if (requests.length === 0) return <p className="text-theme-muted text-sm">No pending requests</p>;

    return (
        <div className="space-y-2">
            {requests.map((req) => (
                <div key={req.id} className="flex items-center justify-between bg-[var(--input-bg)] border border-theme rounded-lg p-3">
                    <div>
                        <p className="font-medium text-sm text-theme">{req.full_name} <span className="text-theme-faint">@{req.username}</span></p>
                        <p className="text-xs text-theme-muted">{req.message || 'No message'} · {req.requested_role?.replace(/_/g, ' ')}</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => onApprove(req.id, 'APPROVED')} className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs rounded hover:bg-emerald-500/30 transition">Accept</button>
                        <button onClick={() => onApprove(req.id, 'REJECTED')} className="px-3 py-1 bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs rounded hover:bg-rose-500/30 transition">Reject</button>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ClubPage;
