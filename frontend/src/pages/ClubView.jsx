import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from '../api/axiosConfig.js';

const ClubView = () => {
    const { id } = useParams();
    const [club, setClub] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchClub = async () => {
            try {
                // Now wired to backend API
                const response = await axios.get(`/api/v1/clubs/${id}`);
                const data = response.data;
                // Add mock members and events if not provided by backend yet
                setClub({
                    id: data.id || id,
                    name: data.name || 'Tech Club',
                    description: data.description || 'The official tech club of the college.',
                    members: data.members || [
                        { id: 1, name: 'Alice', role: 'Core Committee' },
                        { id: 2, name: 'Bob', role: 'Executive' }
                    ],
                    events: data.events || [
                        { id: 1, title: 'Hackathon 2024', status: 'Upcoming' }
                    ]
                });
            } catch (error) {
                console.error("Error fetching club details", error);
            } finally {
                setLoading(false);
            }
        };

        fetchClub();
    }, [id]);

    if (loading) return <div className="p-6">Loading...</div>;
    if (!club) return <div className="p-6">Club not found.</div>;

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <h1 className="text-3xl font-bold mb-4">{club.name}</h1>
            <div className="bg-white p-6 rounded-lg shadow mb-6">
                <h2 className="text-2xl font-semibold">Description</h2>
                <p className="text-gray-600 mt-2">{club.description}</p>
                <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                    Request to Join
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-2">Members</h3>
                    <ul className="divide-y divide-gray-200">
                        {club.members.map(member => (
                            <li key={member.id} className="py-2 flex justify-between">
                                <span>{member.name}</span>
                                <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">{member.role}</span>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-2">Events</h3>
                    <ul className="divide-y divide-gray-200">
                        {club.events.map(event => (
                            <li key={event.id} className="py-2 flex justify-between">
                                <span>{event.title}</span>
                                <span className="text-sm text-blue-600">{event.status}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default ClubView;
