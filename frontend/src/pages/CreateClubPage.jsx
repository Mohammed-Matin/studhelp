import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import Button from '../components/Button';

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
        <div className="p-6 max-w-2xl mx-auto">
            <Link to="/clubs" className="text-blue-600 hover:underline text-sm mb-4 inline-block">
                ← Back to Clubs
            </Link>

            <div className="bg-white rounded-xl shadow-sm border p-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Create a Club</h1>
                <p className="text-gray-600 text-sm mb-6">
                    Start a new club and become its Core Committee head. You can add members and host events after creation.
                </p>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Club Name *</label>
                        <input
                            type="text"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            placeholder="e.g. Coding Club SVNIT"
                            className="w-full px-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            maxLength={255}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            placeholder="What does your club do? What events do you host?"
                            rows={5}
                            className="w-full px-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                        />
                    </div>

                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-800">
                        <p className="font-medium mb-1">As club creator you will be:</p>
                        <ul className="list-disc list-inside space-y-1 text-blue-700">
                            <li>Assigned as <strong>Core Committee</strong> (club head)</li>
                            <li>Able to add members and manage roles</li>
                            <li>Able to create and host events</li>
                            <li>Able to manage budget and join requests</li>
                        </ul>
                    </div>

                    <div className="flex gap-3 justify-end pt-2">
                        <Link
                            to="/clubs"
                            className="px-5 py-2.5 text-gray-600 text-sm font-medium hover:text-gray-800"
                        >
                            Cancel
                        </Link>
                        <Button type="submit" isLoading={loading}>
                            Create Club
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateClubPage;
