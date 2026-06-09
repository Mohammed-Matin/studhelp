import { useState, useEffect, useRef, useCallback } from 'react';
import axiosInstance from '../api/axiosInstance';
import { getUser, setUser } from '../utils/auth';

const BRANCHES = [
    'Computer Engineering', 'Information Technology', 'Electronics Engineering',
    'Electrical Engineering', 'Mechanical Engineering', 'Civil Engineering',
    'Chemical Engineering', 'Engineering Physics'
];
const DEGREES = ['BTech', 'MTech', 'PhD', 'MBA', 'BSc', 'MSc'];
const GENDERS = ['Male', 'Female', 'Other'];
const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

const Field = ({ label, value }) => (
    <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-xl">
        <span className="text-sm text-gray-500">{label}</span>
        <span className="text-sm font-medium text-gray-900">{value || '—'}</span>
    </div>
);

const EditableField = ({ label, name, type = 'text', options, value, onChange }) => {
    if (options) {
        return (
            <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">{label}</label>
                <select name={name} value={value} onChange={onChange}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white transition">
                    <option value="">Select {label}</option>
                    {options.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
            </div>
        );
    }
    return (
        <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">{label}</label>
            <input type={type} name={name} value={value} onChange={onChange}
                   className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition" />
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
                    <div className="flex justify-center"><div className="w-24 h-24 bg-gray-200 rounded-full" /></div>
                    <div className="h-6 bg-gray-200 rounded w-1/3 mx-auto" />
                    <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-gray-200 rounded-xl" />)}</div>
                </div>
            </div>
        );
    }

    const avatarInitial = (profile.full_name || cachedUser?.username || 'U').charAt(0).toUpperCase();
    const statusColor = profile.status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-700' :
                        profile.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700';

    return (
        <div className="max-w-2xl mx-auto py-10 px-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Cover */}
                <div className="h-32 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600" />

                {/* Avatar */}
                <div className="px-8 pb-8">
                    <div className="flex justify-between items-start -mt-12 mb-6">
                        <div className="relative group">
                            <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center">
                                {profile.avatar_url ? (
                                    <img src={profile.avatar_url} alt="avatar"
                                         className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-3xl font-bold text-white">{avatarInitial}</span>
                                )}
                            </div>
                            <button onClick={handleAvatarClick} disabled={uploading}
                                    className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full shadow-md border flex items-center justify-center hover:bg-gray-50 transition disabled:opacity-50">
                                {uploading ? (
                                    <svg className="animate-spin w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                ) : (
                                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                )}
                            </button>
                            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                        </div>

                        <button onClick={toggleEdit}
                                className={`mt-16 px-5 py-2 rounded-xl text-sm font-medium transition shadow-sm flex items-center gap-2 ${
                                    editing
                                        ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        : 'bg-blue-600 text-white hover:bg-blue-700'
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

                    {/* Name & Status */}
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-gray-900">{profile.full_name || cachedUser?.username}</h1>
                        <div className="flex items-center gap-3 mt-1.5">
                            <span className="text-sm text-gray-500">@{cachedUser?.username}</span>
                            <span className="text-gray-300">|</span>
                            <span className="text-sm text-gray-500">{profile.email}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-3">
                            <span className={`px-3 py-0.5 text-xs font-medium rounded-full ${statusColor}`}>
                                {profile.status}
                            </span>
                            <span className="text-xs text-gray-400">
                                Admission: {profile.admission_no || 'N/A'}
                            </span>
                        </div>
                    </div>

                    {/* Message */}
                    {msg && (
                        <div className={`mb-6 px-4 py-3 rounded-xl text-sm flex items-center gap-2 ${
                            msg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                            <span>{msg.type === 'success' ? '✓' : '✕'}</span>
                            {msg.text}
                        </div>
                    )}

                    {/* View Mode */}
                    {!editing && (
                        <div className="space-y-2">
                            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Personal Information</h2>
                            <Field label="Full Name" value={profile.full_name} />
                            <Field label="Branch" value={profile.branch} />
                            <Field label="Semester" value={profile.semester?.toString()} />
                            <Field label="Degree" value={profile.degree} />
                            <Field label="Gender" value={profile.gender} />
                            <Field label="Mobile No" value={profile.mobile_no} />
                            <div className="pt-3 mt-3 border-t border-gray-100">
                                <Field label="Email" value={profile.email} />
                                <Field label="Admission No" value={profile.admission_no} />
                                <Field label="Registered" value={new Date(profile.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })} />
                            </div>
                        </div>
                    )}

                    {/* Edit Mode */}
                    {editing && (
                        <form onSubmit={handleSave} className="space-y-5">
                            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Edit Information</h2>

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
                                        className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition disabled:opacity-50 text-sm">
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                                <button type="button" onClick={toggleEdit}
                                        className="px-6 py-3 bg-gray-100 text-gray-600 rounded-xl font-medium hover:bg-gray-200 transition text-sm">
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
