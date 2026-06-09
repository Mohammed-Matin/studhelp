import { useState, useEffect, useRef, useCallback } from "react";
import { io } from "socket.io-client";
import { config } from "../config/config";
import axiosInstance from "../api/axiosInstance";
import { getUser } from "../utils/auth";

const SOCKET_URL = config.apiBaseUrl.replace("/api/v1", "");
const RECENT_IDS = new Set();

const ChatInterface = () => {
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const activeChatRef = useRef(null);
  const user = getUser();
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [input, setInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [anonymous, setAnonymous] = useState(false);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await axiosInstance.get("/messages/conversations");
      setConversations(res.data);
    } catch (err) {
      console.error("Error fetching conversations:", err);
    }
  }, []);

  const loadMessages = useCallback(async () => {
    if (!activeChat) return;
    try {
      if (activeChat.type === "dm") {
        const res = await axiosInstance.get(`/messages/dm/${activeChat.id}`);
        setMessages(res.data);
      } else if (activeChat.type === "CLUB" || activeChat.type === "EVENT") {
        const res = await axiosInstance.get(
          `/messages/group/${activeChat.type}/${activeChat.id}`,
        );
        setMessages(res.data);
      }
    } catch (err) {
      console.error("Error loading messages:", err);
    }
  }, [activeChat]);

  useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);

  useEffect(() => {
    socketRef.current = io(SOCKET_URL);

    if (user?.id) {
      socketRef.current.emit("join_dm", user.id);
    }

    socketRef.current.on("connect", () => {
      console.log("Socket connected");
    });

    socketRef.current.on("receive_message", (messageData) => {
      if (RECENT_IDS.has(messageData.id)) return;
      RECENT_IDS.add(messageData.id);
      if (RECENT_IDS.size > 200) {
        const iter = RECENT_IDS.values().next();
        if (iter.value) RECENT_IDS.delete(iter.value);
      }

      const chat = activeChatRef.current;
      if (chat) {
        const isRelevant =
          chat.type === "dm"
            ? messageData.sender_id === chat.id ||
              messageData.receiver_id === chat.id
            : messageData.group_type === chat.type &&
              messageData.receiver_id === chat.id;
        if (isRelevant) {
          setMessages((prev) => [...prev, messageData]);
        }
      }
      fetchConversations();
    });

    fetchConversations();

    return () => {
      RECENT_IDS.clear();
      socketRef.current.disconnect();
    };
  }, [fetchConversations, user?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (activeChat) loadMessages();
  }, [activeChat, loadMessages]);

  const handleSend = async () => {
    if (!input.trim() || !activeChat) return;
    try {
      const content = input;
      const is_anonymous = anonymous;
      setInput("");
      if (activeChat.type === "dm") {
        await axiosInstance.post("/messages/dm", {
          receiver_id: activeChat.id,
          content,
        });
      } else {
        await axiosInstance.post(
          `/messages/group/${activeChat.type}/${activeChat.id}`,
          { content, is_anonymous },
        );
      }
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  const handleSearch = async (q) => {
    setSearchQuery(q);
    if (q.length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await axiosInstance.get(`/messages/search?q=${q}`);
      setSearchResults(res.data);
    } catch (err) {
      console.error("Search error:", err);
    }
  };

  const startDM = async (targetUser) => {
    setShowSearch(false);
    setSearchQuery("");
    setSearchResults([]);
    setActiveChat({
      id: targetUser.id,
      name: targetUser.full_name || targetUser.username,
      username: targetUser.username,
      type: "dm",
    });
    if (user?.id) {
      socketRef.current.emit("join_dm", targetUser.id);
    }
  };

  const selectConversation = (conv) => {
    startDM({
      id: conv.user_id,
      full_name: conv.full_name,
      username: conv.username,
    });
  };

  const isMe = (senderId) => senderId === user?.id;

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-gray-50">
      {/* Left Sidebar */}
      <div className="w-80 bg-white border-r flex flex-col">
        {/* Search */}
        <div className="p-3 border-b relative">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => setShowSearch(true)}
              className="flex-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          {showSearch && searchResults.length > 0 && (
            <div className="absolute top-full left-3 right-3 bg-white border rounded-lg shadow-lg mt-1 z-10">
              {searchResults.map((u) => (
                <button
                  key={u.id}
                  onClick={() => startDM(u)}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                >
                  <div className="w-8 h-8 rounded-full bg-linear-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                    {(u.full_name || u.username)?.charAt(0)?.toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium">{u.full_name || u.username}</p>
                    <p className="text-xs text-gray-500">@{u.username}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-3 border-b bg-gray-50">
            <p className="text-xs font-semibold text-gray-500 uppercase">
              Direct Messages
            </p>
          </div>
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-gray-400 text-sm">
              No conversations yet. Search for someone to message.
            </div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.user_id}
                onClick={() => selectConversation(conv)}
                className={`w-full px-4 py-3 text-left hover:bg-gray-50 border-b flex items-center gap-3 transition ${
                  activeChat?.id === conv.user_id && activeChat?.type === "dm"
                    ? "bg-blue-50"
                    : ""
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-linear-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold shrink-0">
                  {(conv.full_name || conv.username)?.charAt(0)?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {conv.full_name || conv.username}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    @{conv.username}
                  </p>
                  {conv.last_message && (
                    <p className="text-xs text-gray-400 truncate mt-0.5">
                      {conv.last_message}
                    </p>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Chat */}
      <div className="flex-1 flex flex-col">
        {activeChat ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b px-6 py-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-linear-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold shrink-0">
                {activeChat.name?.charAt(0)?.toUpperCase()}
              </div>
              <div>
                <p className="font-semibold">{activeChat.name}</p>
                <p className="text-xs text-gray-500">
                  {activeChat.type === "dm"
                    ? `@${activeChat.username}`
                    : activeChat.type}
                </p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-gray-400 my-20">
                  <p>No messages yet</p>
                  <p className="text-sm mt-1">
                    Send a message to start the conversation
                  </p>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isAnonymous = msg.is_anonymous;
                  const displayName = isAnonymous
                    ? "Anonymous"
                    : msg.sender_name || "Unknown";
                  const timeStr = msg.timestamp
                    ? new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "";
                  return (
                    <div
                      key={msg.id || idx}
                      className={`flex ${isMe(msg.sender_id) ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[70%] ${
                          isMe(msg.sender_id)
                            ? "bg-blue-600 text-white rounded-2xl rounded-br-sm"
                            : "bg-white border shadow-sm rounded-2xl rounded-bl-sm"
                        } px-4 py-2.5`}
                      >
                        {!isMe(msg.sender_id) && activeChat.type !== "dm" && (
                          <p
                            className={`text-xs font-medium mb-1 ${isAnonymous ? "text-gray-400 italic" : "text-blue-600"}`}
                          >
                            {isAnonymous ? "🕵️ Anonymous" : displayName}
                          </p>
                        )}
                        {isMe(msg.sender_id) && isAnonymous && (
                          <p className="text-xs font-medium mb-1 text-blue-200 italic">
                            Anonymous
                          </p>
                        )}
                        <p className="text-sm">{msg.content}</p>
                        <p
                          className={`text-xs mt-1 ${isMe(msg.sender_id) ? "text-blue-200" : "text-gray-400"}`}
                        >
                          {timeStr}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="bg-white border-t px-6 py-4">
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  className="flex-1 px-4 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <div className="flex items-center gap-2">
                  {activeChat.type !== "dm" && (
                    <label className="flex items-center gap-1.5 cursor-pointer select-none text-xs text-gray-500 hover:text-gray-700">
                      <input
                        type="checkbox"
                        checked={anonymous}
                        onChange={(e) => setAnonymous(e.target.checked)}
                        className="w-3.5 h-3.5 rounded border-gray-300 text-gray-500 focus:ring-gray-400 cursor-pointer"
                      />
                      <span className="hidden sm:inline">Anonymous</span>
                      <span className="sm:hidden">🕵️</span>
                    </label>
                  )}
                  <button
                    onClick={handleSend}
                    className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition shadow-sm"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <p className="text-5xl mb-4">💬</p>
              <p className="text-lg">Select a conversation</p>
              <p className="text-sm mt-1">
                Choose a chat from the sidebar or search for someone
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;
