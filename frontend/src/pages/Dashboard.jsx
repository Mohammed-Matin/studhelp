
const Dashboard = () => {
    return (
        <div className="p-6 max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-xl font-semibold mb-2">My Clubs</h2>
                    <p className="text-gray-600">List of active clubs.</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-xl font-semibold mb-2">Upcoming Events</h2>
                    <p className="text-gray-600">Calendar view coming soon.</p>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
