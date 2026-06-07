import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

// In a real app, this would be an environment variable
const SOCKET_URL = 'http://localhost:3000';

const ChatInterface = ({ roomId = 'global', currentUserId = 'user123' }) => {
    const socketRef = useRef(null);
    const [messages, setMessages] = useState([]);
    const [messageInput, setMessageInput] = useState('');

    useEffect(() => {
        // Initialize Socket connection
        socketRef.current = io(SOCKET_URL);

        socketRef.current.on('connect', () => {
            console.log('Connected to socket server');
            socketRef.current.emit('join_room', roomId);
        });

        // Listen for incoming messages
        socketRef.current.on('receive_message', (messageData) => {
            setMessages((prev) => [...prev, messageData]);
        });

        return () => {
            socketRef.current.disconnect();
        };
    }, [roomId]);

    const sendMessage = () => {
        if (messageInput.trim() !== '' && socketRef.current) {
            const messageData = {
                room: roomId,
                senderId: currentUserId,
                content: messageInput,
                timestamp: new Date().toISOString(),
                isAnonymous: false
            };

            // Emit to server
            socketRef.current.emit('send_message', messageData);
            setMessageInput('');
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] max-w-4xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden mt-4">
            <div className="bg-gray-100 p-4 border-b flex justify-between items-center">
                <h2 className="text-lg font-semibold">Chat / Room: {roomId}</h2>
            </div>

            <div className="flex-1 p-4 overflow-y-auto bg-gray-50 flex flex-col gap-4">
                {messages.length === 0 ? (
                    <div className="text-center text-gray-500 my-auto">No messages yet. Start the conversation!</div>
                ) : (
                    messages.map((msg, idx) => {
                        const isMe = msg.senderId === currentUserId;
                        return (
                            <div key={idx} className={`max-w-[80%] p-3 rounded-lg ${isMe ? 'self-end bg-blue-100 text-blue-900' : 'self-start bg-white border shadow-sm text-gray-800'}`}>
                                <p className="text-sm">{msg.content}</p>
                                <span className="text-xs text-gray-400 mt-1 block">
                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        );
                    })
                )}
            </div>

            <div className="p-4 border-t bg-white flex gap-2">
                <input
                    type="text"
                    className="flex-1 border rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-300"
                    placeholder="Type a message..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                />
                <button
                    onClick={sendMessage}
                    className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 font-medium transition-colors"
                >
                    Send
                </button>
            </div>
        </div>
    );
};

export default ChatInterface;
