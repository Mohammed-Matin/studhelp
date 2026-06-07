import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const EventView = () => {
    const { id } = useParams();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEvent = async () => {
            try {
                // Wired to backend API
                const response = await axios.get(`/api/v1/events/${id}`);
                const data = response.data;
                // Add mock data for fields not yet returned
                setEvent({
                    id: data.id || id,
                    title: data.title || 'Annual Tech Hackathon',
                    clubName: data.clubName || 'Tech Club',
                    status: data.status || 'UPCOMING',
                    date: data.start_time || '2024-12-01',
                    description: data.description || 'Join us for a 48-hour coding marathon. Build amazing projects and win prizes!',
                    entryFee: data.entry_fee || 500,
                    participants: data.participants || 120,
                    teams: data.teams || [
                        { id: 1, name: 'Code Wizards' },
                        { id: 2, name: 'Byte Me' }
                    ]
                });
            } catch (error) {
                console.error("Error fetching event details", error);
            } finally {
                setLoading(false);
            }
        };

        fetchEvent();
    }, [id]);

    if (loading) return <div className="p-6">Loading...</div>;
    if (!event) return <div className="p-6">Event not found.</div>;

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-2">
                <h1 className="text-3xl font-bold">{event.title}</h1>
                <span className="bg-blue-100 text-blue-800 text-sm font-semibold px-2.5 py-0.5 rounded">
                    {event.status}
                </span>
            </div>
            <p className="text-sm text-gray-500 mb-6">Hosted by {event.clubName} | Date: {event.date}</p>

            <div className="bg-white p-6 rounded-lg shadow mb-6">
                <h2 className="text-xl font-semibold mb-2">Details</h2>
                <p className="text-gray-700">{event.description}</p>
                <div className="mt-4 flex gap-8">
                    <div>
                        <span className="block text-sm text-gray-500">Entry Fee</span>
                        <span className="font-semibold">₹{event.entryFee}</span>
                    </div>
                    <div>
                        <span className="block text-sm text-gray-500">Participants</span>
                        <span className="font-semibold">{event.participants}</span>
                    </div>
                </div>
            </div>

            <div className="flex gap-4 mb-8">
                <button className="bg-blue-600 text-white px-6 py-2 rounded shadow hover:bg-blue-700 font-medium">
                    Register Now
                </button>
                <button className="bg-green-600 text-white px-6 py-2 rounded shadow hover:bg-green-700 font-medium">
                    Create Team
                </button>
            </div>

            <div className="bg-white p-6 rounded-lg shadow mb-6">
                <h2 className="text-xl font-semibold mb-4">Registered Teams</h2>
                <ul className="divide-y divide-gray-200">
                    {event.teams.map(team => (
                        <li key={team.id} className="py-2 text-gray-700">
                            {team.name}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default EventView;
