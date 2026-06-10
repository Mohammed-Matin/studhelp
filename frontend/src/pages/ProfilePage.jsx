import { useState, useEffect, useRef, useCallback } from 'react';
import axiosInstance from '../api/axiosInstance';
import { getUser, setUser } from '../utils/auth';
import CustomSelect from '../components/CustomSelect';

const BRANCHES = [
    'Computer Engineering', 'Information Technology', 'Electronics Engineering',
    'Electrical Engineering', 'Mechanical Engineering', 'Civil Engineering',
    'Chemical Engineering', 'Engineering Physics'
];
const DEGREES = ['BTech', 'MTech', 'PhD', 'MBA', 'BSc', 'MSc'];
const GENDERS = ['Male', 'Female', 'Other'];
const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

const Field = ({ label, value }) => (
    <div className="flex items-center justify-between py-3 px-4 bg-theme-elevated rounded-xl border border-theme">
        <span className="text-sm text-theme-muted">{label}</span>
        <span className="text-sm font-medium text-theme">{value || '—'}</span>
    </div>
);

const EditableField = ({ label, name, type = 'text', options, value, onChange }) => {
    if (options) {
        return (
            <div>
                <label className="block text-xs font-medium text-theme-muted mb-1.5">{label}</label>
                <CustomSelect
                    name={name}
                    value={value}
                    onChange={onChange}
                    options={[
                        { value: '', label: `Select ${label}` },
                        ...options.map(o => ({ value: o, label: o }))
                    ]}
                />
            </div>
        );
    }
    return (
        <div>
            <label className="block text-xs font-medium text-theme-muted mb-1.5">{label}</label>
            <input type={type} name={name} value={value} onChange={onChange} className="input-dark" />
        </div>
    );
};

const ProfilePage = () => {
    const cachedUser = getUser();
    const fileRef = useRef(null);
    const [profile, setProfile] = useState(null);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [msg, setMsg] = useState(null);
    const [form, setForm] = useState({
        full_name: '', branch: '', semester: '', degree: '', gender: '', mobile_no: ''
    });

    const syncForm = (p) => {
        setForm({
            full_name: p.full_name || '',
            branch: p.branch || '',
            semester: p.semester?.toString() || '',
            degree: p.degree || '',
            gender: p.gender || '',
            mobile_no: p.mobile_no || ''
        });
    };

    const fetchProfile = useCallback(async () => {
        try {
            const res = await axiosInstance.get('/user/profile');
            setProfile(res.data);
            syncForm(res.data);
        } catch (err) {
            console.error('Fetch profile error:', err);
        }
    }, []);

    useEffect(() => { fetchProfile(); }, [fetchProfile]);

    const handleChange = (e) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const toggleEdit = () => {
        if (editing) {
            syncForm(profile);
        }
        setEditing(!editing);
        setMsg(null);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMsg(null);
        try {
            const res = await axiosInstance.patch('/user/profile', form);
            setProfile(res.data);
            setUser(res.data);
            setEditing(false);
            setMsg({ type: 'success', text: 'Profile updated!' });
            setTimeout(() => setMsg(null), 3000);
        } catch (err) {
            setMsg({ type: 'error', text: err.response?.data?.error || 'Failed to update' });
        } finally {
            setSaving(false);
        }
    };

    const handleAvatarClick = () => fileRef.current?.click();

    const handleAvatarUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const fd = new FormData();
            fd.append('avatar', file);
            const res = await axiosInstance.post('/user/avatar', fd, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setProfile((prev) => ({ ...prev, avatar_url: res.data.avatar_url }));
            setUser({ ...cachedUser, avatar_url: res.data.avatar_url });
            setMsg({ type: 'success', text: 'Avatar updated!' });
            setTimeout(() => setMsg(null), 3000);
        } catch {
            setMsg({ type: 'error', text: 'Upload failed' });
        } finally {
            setUploading(false);
        }
    };

    if (!profile) {
        return (
            <div className="max-w-2xl mx-auto py-16 px-4">
                <div className="animate-pulse space-y-6">
                    <div className="flex justify-center"><div className="w-24 h-24 glass-card rounded-full" /></div>
                    <div className="h-6 glass-card rounded w-1/3 mx-auto" />
                    <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-12 glass-card rounded-xl" />)}</div>
                </div>
            </div>
        );
    }

    const avatarInitial = (profile.full_name || cachedUser?.username || 'U').charAt(0).toUpperCase();
    const statusColor = profile.status === 'VERIFIED'
        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
        : profile.status === 'PENDING'
            ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
            : 'bg-red-500/20 text-red-300 border-red-500/30';

    return (
        <div className="max-w-2xl mx-auto py-10 px-4 animate-fade-up">
            <div className="glass-card glow-border rounded-2xl overflow-hidden">
                <div className="h-32 bg-gradient-to-r from-cyan-500/80 via-purple-600/80 to-fuchsia-600/80" />

                <div className="px-8 pb-8">
                    <div className="flex justify-between items-start -mt-12 mb-6">
                        <div className="relative group">
                            <div className="w-24 h-24 rounded-full border-4 border-[var(--bg-deep)] shadow-lg overflow-hidden bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center">
                                {profile.avatar_url ? (
                                    <img src={profile.avatar_url} alt="avatar"
                                         className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-3xl font-bold text-white keep-white">{avatarInitial}</span>
                                )}
                            </div>
                            <button onClick={handleAvatarClick} disabled={uploading}
                                    className="absolute bottom-0 right-0 w-8 h-8 bg-theme-elevated rounded-full shadow-md border border-theme flex items-center justify-center hover-bg-theme transition disabled:opacity-50">
                                {uploading ? (
                                    <svg className="animate-spin w-4 h-4 text-theme-muted" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                ) : (
                                    <svg className="w-4 h-4 text-theme-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                )}
                            </button>
                            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                        </div>

                        <button onClick={toggleEdit}
                                className={`mt-16 px-5 py-2 rounded-xl text-sm font-medium transition flex items-center gap-2 ${
                                    editing ? 'btn-ghost' : 'btn-primary'
                                }`}>
                            {editing ? (
                                <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                    Cancel
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                    </svg>
                                    Edit Profile
                                </>
                            )}
                        </button>
                    </div>

                    <div className="mb-8">
                        <h1 className="font-display text-2xl font-bold text-theme">{profile.full_name || cachedUser?.username}</h1>
                        <div className="flex items-center gap-3 mt-1.5">
                            <span className="text-sm text-theme-muted">@{cachedUser?.username}</span>
                            <span className="text-theme-faint">|</span>
                            <span className="text-sm text-theme-muted">{profile.email}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-3">
                            <span className={`px-3 py-0.5 text-xs font-medium rounded-full border ${statusColor}`}>
                                {profile.status}
                            </span>
                            <span className="text-xs text-theme-faint">
                                Admission: {profile.admission_no || 'N/A'}
                            </span>
                        </div>
                    </div>

                    {msg && (
                        <div className={`mb-6 px-4 py-3 rounded-xl text-sm flex items-center gap-2 ${
                            msg.type === 'success'
                                ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                                : 'bg-red-500/10 text-red-300 border border-red-500/30'
                        }`}>
                            <span>{msg.type === 'success' ? '✓' : '✕'}</span>
                            {msg.text}
                        </div>
                    )}

                    {!editing && (
                        <div className="space-y-2">
                            <h2 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-3">Personal Information</h2>
                            <Field label="Full Name" value={profile.full_name} />
                            <Field label="Branch" value={profile.branch} />
                            <Field label="Semester" value={profile.semester?.toString()} />
                            <Field label="Degree" value={profile.degree} />
                            <Field label="Gender" value={profile.gender} />
                            <Field label="Mobile No" value={profile.mobile_no} />
                            <div className="pt-3 mt-3 border-t border-theme">
                                <Field label="Email" value={profile.email} />
                                <Field label="Admission No" value={profile.admission_no} />
                                <Field label="Registered" value={new Date(profile.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })} />
                            </div>
                        </div>
                    )}

                    {editing && (
                        <form onSubmit={handleSave} className="space-y-5">
                            <h2 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">Edit Information</h2>

                            <EditableField label="Full Name" name="full_name" value={form.full_name} onChange={handleChange} />
                            <div className="grid grid-cols-2 gap-4">
                                <EditableField label="Branch" name="branch" options={BRANCHES} value={form.branch} onChange={handleChange} />
                                <EditableField label="Semester" name="semester" options={SEMESTERS.map(String)} value={form.semester} onChange={handleChange} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <EditableField label="Degree" name="degree" options={DEGREES} value={form.degree} onChange={handleChange} />
                                <EditableField label="Gender" name="gender" options={GENDERS} value={form.gender} onChange={handleChange} />
                            </div>
                            <EditableField label="Mobile No" name="mobile_no" type="tel" value={form.mobile_no} onChange={handleChange} />

                            <div className="flex gap-3 pt-2">
                                <button type="submit" disabled={saving}
                                        className="flex-1 btn-primary py-3 disabled:opacity-50 text-sm">
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                                <button type="button" onClick={toggleEdit}
                                        className="px-6 py-3 btn-ghost text-sm">
                                    Cancel
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
