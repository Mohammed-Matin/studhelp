
const ChatInterface = () => {
    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] max-w-4xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden mt-4">
            <div className="bg-gray-100 p-4 border-b">
                <h2 className="text-lg font-semibold">Chat / Messages</h2>
            </div>
            <div className="flex-1 p-4 overflow-y-auto">
                <div className="flex flex-col gap-4">
                    <div className="self-start bg-gray-200 rounded-lg p-3 max-w-[80%]">
                        <p className="text-sm">Hello, this is a message.</p>
                    </div>
                    <div className="self-end bg-blue-100 rounded-lg p-3 max-w-[80%]">
                        <p className="text-sm">Hi there! This is a reply.</p>
                    </div>
                </div>
            </div>
            <div className="p-4 border-t bg-gray-50 flex gap-2">
                <input type="text" className="flex-1 border rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-300" placeholder="Type a message..." />
                <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Send</button>
            </div>
        </div>
    );
};

export default ChatInterface;
