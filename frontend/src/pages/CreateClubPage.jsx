import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import PageHero from '../components/PageHero';

const CreateClubPage = () => {
    const navigate = useNavigate();
    const [form, setForm] = useState({ name: '', description: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!form.name.trim()) {
            setError('Club name is required');
            return;
        }
        setLoading(true);
        try {
            const res = await axiosInstance.post('/clubs', {
                name: form.name.trim(),
                description: form.description.trim() || undefined,
            });
            navigate(`/clubs/${res.data.id}`);
        } catch (err) {
            setError(err.response?.data?.error || err.response?.data?.details?.[0]?.message || 'Failed to create club');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen">
            <PageHero
                label="Launch Something New"
                title={<>Create a <span className="text-gradient">Club</span></>}
                subtitle="Build your community, host events, and lead the next wave of campus innovation."
            />

            <div className="max-w-2xl mx-auto px-6 py-10">
                <Link to="/clubs" className="text-cyan-400 hover:text-cyan-300 text-sm mb-6 inline-block">
                    ← Back to Clubs
                </Link>

                <div className="glass-card rounded-2xl p-8 glow-border">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 text-red-300 rounded-lg p-3 mb-4 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Club Name *</label>
                            <input
                                type="text"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                placeholder="e.g. Robotics Club SVNIT"
                                className="input-dark"
                                maxLength={255}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
                            <textarea
                                value={form.description}
                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                                placeholder="What does your club do? What events do you host?"
                                rows={5}
                                className="input-dark resize-none"
                            />
                        </div>

                        <div className="glass-card rounded-xl p-4 text-sm border-purple-500/20">
                            <p className="font-medium text-purple-300 mb-2">As club creator you become:</p>
                            <ul className="space-y-1 text-slate-400">
                                <li>• <strong className="text-white">Core Committee</strong> head</li>
                                <li>• Able to add members, host events, manage budget</li>
                                <li>• Set custom logo & cover images in Settings after creation</li>
                            </ul>
                        </div>

                        <div className="flex gap-3 justify-end pt-2">
                            <Link to="/clubs" className="btn-ghost">Cancel</Link>
                            <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50">
                                {loading ? 'Creating...' : 'Create Club'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreateClubPage;
