
const EventView = () => {
    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-2">Event Title</h1>
            <p className="text-sm text-gray-500 mb-6">Status: Upcoming | Date: TBD</p>

            <div className="bg-white p-6 rounded-lg shadow mb-6">
                <h2 className="text-xl font-semibold mb-2">Details</h2>
                <p className="text-gray-700">Detailed description of the event.</p>
            </div>

            <div className="flex gap-4">
                <button className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700">Register</button>
                <button className="bg-gray-200 text-gray-800 px-4 py-2 rounded shadow hover:bg-gray-300">View Teams</button>
            </div>
        </div>
    );
};

export default EventView;
