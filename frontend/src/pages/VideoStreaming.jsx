import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Users, MessageCircle } from 'lucide-react';

const dummyParticipants = [
    { id: 1, name: 'You', isYou: true, avatar: 'Y' },
    { id: 2, name: 'Ananya Sharma', avatar: 'A' },
    { id: 3, name: 'Rahul Verma', avatar: 'R' },
    { id: 4, name: 'Priya Patel', avatar: 'P' },
];

const dummyMessages = [
    { id: 1, sender: 'Ananya Sharma', text: 'Can you hear me?', time: '2:30 PM' },
    { id: 2, sender: 'Rahul Verma', text: 'Yes, coming through clearly', time: '2:31 PM' },
    { id: 3, sender: 'Priya Patel', text: 'Let me share my screen', time: '2:32 PM' },
];

const VideoStreaming = () => {
    const [searchParams] = useSearchParams();
    const roomName = searchParams.get('room') || 'General Meeting';
    const [micOn, setMicOn] = useState(true);
    const [camOn, setCamOn] = useState(true);
    const [showChat, setShowChat] = useState(false);
    const [chatMsg, setChatMsg] = useState('');
    const [messages, setMessages] = useState(dummyMessages);

    return (
        <div className="h-[calc(100vh-4rem)] bg-gray-900 flex flex-col">
            {/* Top Bar */}
            <div className="bg-gray-800 px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link to="/dashboard" className="text-white/60 hover:text-white text-sm">← Back</Link>
                    <h1 className="text-white font-semibold">{roomName}</h1>
                </div>
                <div className="flex items-center gap-2 text-white/60 text-sm">
                    <Users className="w-4 h-4" />
                    <span>{dummyParticipants.length} participants</span>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Video Grid */}
                <div className="flex-1 p-4 grid grid-cols-2 gap-4 content-start">
                    {/* Local Video (dummy placeholder) */}
                    <div className="relative bg-gray-800 rounded-xl overflow-hidden aspect-video flex items-center justify-center">
                        {camOn ? (
                            <div className="text-center">
                                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold mx-auto mb-2">
                                    Y
                                </div>
                                <p className="text-white/80 text-sm">You</p>
                            </div>
                        ) : (
                            <div className="text-center">
                                <div className="w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center mx-auto mb-2">
                                    <VideoOff className="w-8 h-8 text-gray-400" />
                                </div>
                                <p className="text-white/60 text-sm">Camera Off</p>
                            </div>
                        )}
                        <span className="absolute bottom-2 left-3 text-xs text-white/60 bg-black/40 px-2 py-0.5 rounded">
                            You
                        </span>
                    </div>

                    {/* Remote Participants (dummy) */}
                    {dummyParticipants.filter(p => !p.isYou).map((p) => (
                        <div key={p.id} className="relative bg-gray-800 rounded-xl overflow-hidden aspect-video flex items-center justify-center">
                            <div className="text-center">
                                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-3xl font-bold mx-auto mb-2">
                                    {p.avatar}
                                </div>
                                <p className="text-white/80 text-sm">{p.name}</p>
                            </div>
                            <span className="absolute bottom-2 left-3 text-xs text-white/60 bg-black/40 px-2 py-0.5 rounded">
                                {p.name}
                            </span>
                            <span className="absolute top-2 right-2 flex items-center gap-1 bg-green-500/20 text-green-400 text-xs px-2 py-0.5 rounded-full">
                                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                                Live
                            </span>
                        </div>
                    ))}
                </div>

                {/* Chat Sidebar */}
                {showChat && (
                    <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
                        <div className="p-4 border-b border-gray-700">
                            <h3 className="text-white font-semibold flex items-center gap-2">
                                <MessageCircle className="w-4 h-4" />
                                In-Chat Messages
                            </h3>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {messages.map((msg) => (
                                <div key={msg.id} className="bg-gray-700/50 rounded-lg p-3">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-blue-400 text-xs font-medium">{msg.sender}</span>
                                        <span className="text-gray-500 text-xs">{msg.time}</span>
                                    </div>
                                    <p className="text-white text-sm">{msg.text}</p>
                                </div>
                            ))}
                        </div>
                        <div className="p-4 border-t border-gray-700">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Type a message..."
                                    value={chatMsg}
                                    onChange={(e) => setChatMsg(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && chatMsg.trim()) {
                                            setMessages([...messages, {
                                                id: Date.now(),
                                                sender: 'You',
                                                text: chatMsg,
                                                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                                            }]);
                                            setChatMsg('');
                                        }
                                    }}
                                    className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className="bg-gray-800 px-6 py-4 flex items-center justify-center gap-4">
                <button
                    onClick={() => setMicOn(!micOn)}
                    className={`p-3 rounded-full transition ${micOn ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-red-600 text-white'}`}
                    title={micOn ? 'Mute' : 'Unmute'}
                >
                    {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                </button>
                <button
                    onClick={() => setCamOn(!camOn)}
                    className={`p-3 rounded-full transition ${camOn ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-red-600 text-white'}`}
                    title={camOn ? 'Camera Off' : 'Camera On'}
                >
                    {camOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                </button>
                <button
                    onClick={() => setShowChat(!showChat)}
                    className={`p-3 rounded-full transition ${showChat ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-white'}`}
                    title="Chat"
                >
                    <MessageCircle className="w-5 h-5" />
                </button>
                <button
                    onClick={() => window.history.back()}
                    className="p-3 rounded-full bg-red-600 text-white hover:bg-red-700 transition"
                    title="Leave"
                >
                    <PhoneOff className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};

export default VideoStreaming;
