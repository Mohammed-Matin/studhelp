
const ClubView = () => {
    return (
        <div className="p-6 max-w-5xl mx-auto">
            <h1 className="text-3xl font-bold mb-4">Club Details</h1>
            <div className="bg-white p-6 rounded-lg shadow mb-6">
                <h2 className="text-2xl font-semibold">Description</h2>
                <p className="text-gray-600 mt-2">Information about the club goes here.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold">Members</h3>
                    <p className="text-sm text-gray-500 mt-1">Manage core committee and members.</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold">Events</h3>
                    <p className="text-sm text-gray-500 mt-1">View club events.</p>
                </div>
            </div>
        </div>
    );
};

export default ClubView;
