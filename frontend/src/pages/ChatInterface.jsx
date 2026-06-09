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
  const [clubChats, setClubChats] = useState([]);
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

  const fetchClubChats = useCallback(async () => {
    try {
      const res = await axiosInstance.get("/messages/clubs");
      setClubChats(res.data);
    } catch (err) {
      console.error("Error fetching club chats:", err);
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
      fetchClubChats();
    });

    fetchConversations();
    fetchClubChats();

    return () => {
      RECENT_IDS.clear();
      socketRef.current.disconnect();
    };
  }, [fetchConversations, fetchClubChats, user?.id]);

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

  const selectClubChat = (club) => {
    setShowSearch(false);
    setSearchQuery("");
    setSearchResults([]);
    setActiveChat({
      id: club.id,
      name: club.name,
      type: "CLUB",
    });
    socketRef.current?.emit("join_group", { groupType: "CLUB", groupId: club.id });
  };

  const isMe = (senderId) => senderId === user?.id;

  const isActive = (id, type) =>
    activeChat?.id === id && activeChat?.type === type;

  const listItemClass = (active) =>
    `w-full px-4 py-3 text-left border-b border-theme flex items-center gap-3 transition ${
      active
        ? "bg-purple-500/15 border-l-2 border-l-purple-500"
        : "hover:bg-white/5 border-l-2 border-l-transparent"
    }`;

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Left Sidebar */}
      <div className="w-80 glass-card border-r border-theme flex flex-col shrink-0">
        <div className="p-3 border-b border-theme relative">
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => setShowSearch(true)}
            className="input-dark"
          />
          {showSearch && searchResults.length > 0 && (
            <div className="absolute top-full left-3 right-3 glass-card glow-border rounded-lg mt-1 z-10 overflow-hidden">
              {searchResults.map((u) => (
                <button
                  key={u.id}
                  onClick={() => startDM(u)}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-white/5 flex items-center gap-2 transition"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold keep-white">
                    {(u.full_name || u.username)?.charAt(0)?.toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-theme text-sm">{u.full_name || u.username}</p>
                    <p className="text-xs text-theme-muted">@{u.username}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-3 border-b border-theme bg-purple-500/10">
            <p className="text-xs font-semibold text-purple-400 uppercase tracking-wider">
              Club Chats
            </p>
          </div>
          {clubChats.length === 0 ? (
            <div className="p-4 text-center text-theme-faint text-sm border-b border-theme">
              Join a club to access member chats
            </div>
          ) : (
            clubChats.map((club) => (
              <button
                key={club.id}
                onClick={() => selectClubChat(club)}
                className={listItemClass(isActive(club.id, "CLUB"))}
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shrink-0 text-sm keep-white">
                  {club.logo_url ? (
                    <img src={club.logo_url} alt="" className="w-full h-full rounded-xl object-cover" />
                  ) : (
                    club.name?.charAt(0)?.toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate text-theme">{club.name}</p>
                  <p className="text-xs text-theme-muted capitalize">
                    {club.user_role?.replace(/_/g, " ").toLowerCase()}
                  </p>
                  {club.last_message && (
                    <p className="text-xs text-theme-faint truncate mt-0.5">
                      {club.last_message}
                    </p>
                  )}
                </div>
              </button>
            ))
          )}

          <div className="p-3 border-b border-theme bg-cyan-500/10">
            <p className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
              Direct Messages
            </p>
          </div>
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-theme-faint text-sm">
              No conversations yet. Search for someone to message.
            </div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.user_id}
                onClick={() => selectConversation(conv)}
                className={listItemClass(isActive(conv.user_id, "dm"))}
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold shrink-0 keep-white">
                  {(conv.full_name || conv.username)?.charAt(0)?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate text-theme">
                    {conv.full_name || conv.username}
                  </p>
                  <p className="text-xs text-theme-muted truncate">
                    @{conv.username}
                  </p>
                  {conv.last_message && (
                    <p className="text-xs text-theme-faint truncate mt-0.5">
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
      <div className="flex-1 flex flex-col min-w-0">
        {activeChat ? (
          <>
            <div className="glass-card border-b border-theme px-6 py-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold shrink-0 keep-white">
                {activeChat.name?.charAt(0)?.toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-theme">{activeChat.name}</p>
                <p className="text-xs text-theme-muted">
                  {activeChat.type === "dm"
                    ? `@${activeChat.username}`
                    : activeChat.type === "CLUB"
                      ? "Club member chat"
                      : activeChat.type}
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-theme-muted my-20">
                  <p>No messages yet</p>
                  <p className="text-sm mt-1 text-theme-faint">
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
                  const mine = isMe(msg.sender_id);
                  return (
                    <div
                      key={msg.id || idx}
                      className={`flex ${mine ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[70%] px-4 py-2.5 ${
                          mine
                            ? "bg-gradient-to-br from-purple-600 to-blue-600 text-white rounded-2xl rounded-br-sm"
                            : "glass-card border border-theme rounded-2xl rounded-bl-sm"
                        }`}
                      >
                        {!mine && activeChat.type !== "dm" && (
                          <p
                            className={`text-xs font-medium mb-1 ${
                              isAnonymous ? "text-theme-faint italic" : "text-cyan-400"
                            }`}
                          >
                            {isAnonymous ? "🕵️ Anonymous" : displayName}
                          </p>
                        )}
                        {mine && isAnonymous && (
                          <p className="text-xs font-medium mb-1 text-purple-200 italic">
                            Anonymous
                          </p>
                        )}
                        <p className={`text-sm ${mine ? "keep-white" : "text-theme"}`}>
                          {msg.content}
                        </p>
                        <p
                          className={`text-xs mt-1 ${
                            mine ? "text-purple-200" : "text-theme-faint"
                          }`}
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

            <div className="glass-card border-t border-theme px-6 py-4">
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  className="input-dark flex-1"
                />
                <div className="flex items-center gap-2">
                  {activeChat.type !== "dm" && (
                    <label className="flex items-center gap-1.5 cursor-pointer select-none text-xs text-theme-muted hover:text-theme transition">
                      <input
                        type="checkbox"
                        checked={anonymous}
                        onChange={(e) => setAnonymous(e.target.checked)}
                        className="w-3.5 h-3.5 rounded border-theme bg-theme-elevated text-purple-500 focus:ring-purple-500/50 cursor-pointer"
                      />
                      <span className="hidden sm:inline">Anonymous</span>
                      <span className="sm:hidden">🕵️</span>
                    </label>
                  )}
                  <button onClick={handleSend} className="btn-primary px-6 py-2.5 text-sm">
                    Send
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center animate-fade-up">
              <p className="text-5xl mb-4">💬</p>
              <p className="text-lg text-theme">Select a conversation</p>
              <p className="text-sm mt-1 text-theme-muted">
                Open a club chat or search for someone to message
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;
