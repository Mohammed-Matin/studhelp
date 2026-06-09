import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { config } from '../config/config';
import axiosInstance from '../api/axiosInstance';
import { getUser } from '../utils/auth';

const SOCKET_URL = config.apiBaseUrl.replace('/api/v1', '');

const ClubChatPanel = ({ clubId, clubName, compact = false }) => {
    const user = getUser();
    const socketRef = useRef(null);
    const messagesEndRef = useRef(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);

    const loadMessages = useCallback(async () => {
        try {
            const res = await axiosInstance.get(`/messages/group/CLUB/${clubId}`);
            setMessages(res.data);
        } catch (err) {
            console.error('Error loading club messages:', err);
        } finally {
            setLoading(false);
        }
    }, [clubId]);

    useEffect(() => {
        socketRef.current = io(SOCKET_URL);

        socketRef.current.on('connect', () => {
            socketRef.current.emit('join_group', { groupType: 'CLUB', groupId: clubId });
        });

        socketRef.current.on('receive_message', (msg) => {
            if (msg.group_type === 'CLUB' && msg.receiver_id === clubId) {
                setMessages((prev) => {
                    if (prev.some((m) => m.id === msg.id)) return prev;
                    return [...prev, msg];
                });
            }
        });

        loadMessages();

        return () => {
            socketRef.current?.emit('leave_group', { groupType: 'CLUB', groupId: clubId });
            socketRef.current?.disconnect();
        };
    }, [clubId, loadMessages]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (e) => {
        e?.preventDefault();
        if (!input.trim() || sending) return;
        setSending(true);
        try {
            await axiosInstance.post(`/messages/group/CLUB/${clubId}`, { content: input.trim() });
            setInput('');
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to send message');
        } finally {
            setSending(false);
        }
    };

    const isMe = (senderId) => senderId === user?.id;

    return (
        <div className={`flex flex-col bg-white rounded-xl shadow-sm border overflow-hidden ${compact ? 'h-[420px]' : 'h-[calc(100vh-16rem)]'}`}>
            <div className="px-4 py-3 border-b bg-gradient-to-r from-indigo-50 to-blue-50">
                <h3 className="font-semibold text-gray-900">{clubName} — Member Chat</h3>
                <p className="text-xs text-gray-500">Discuss with fellow club members</p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loading ? (
                    <p className="text-center text-gray-400 text-sm py-8">Loading messages...</p>
                ) : messages.length === 0 ? (
                    <p className="text-center text-gray-400 text-sm py-8">
                        No messages yet. Start the conversation!
                    </p>
                ) : (
                    messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex ${isMe(msg.sender_id) ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${
                                    isMe(msg.sender_id)
                                        ? 'bg-blue-600 text-white rounded-br-sm'
                                        : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                                }`}
                            >
                                {!isMe(msg.sender_id) && (
                                    <p className="text-xs font-medium text-blue-600 mb-0.5">
                                        {msg.sender_full_name || msg.sender_name}
                                    </p>
                                )}
                                <p>{msg.content}</p>
                                <p className={`text-xs mt-1 ${isMe(msg.sender_id) ? 'text-blue-200' : 'text-gray-400'}`}>
                                    {msg.timestamp
                                        ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                        : ''}
                                </p>
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} className="border-t p-3 flex gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Message club members..."
                    className="flex-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <button
                    type="submit"
                    disabled={!input.trim() || sending}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                    Send
                </button>
            </form>
        </div>
    );
};

export default ClubChatPanel;
