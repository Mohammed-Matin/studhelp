import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import { Bell } from 'lucide-react';
import { config } from '../config/config';
import axiosInstance from '../api/axiosInstance';
import { getUser } from '../utils/auth';

const SOCKET_URL = config.apiBaseUrl.replace('/api/v1', '');

const TYPE_ICONS = {
    EVENT_CREATED: '📅',
    CLUB_FOLLOWED: '👤',
    EVENT_REGISTRATION: '✅',
};

const NotificationBell = () => {
    const user = getUser();
    const socketRef = useRef(null);
    const panelRef = useRef(null);
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);

    const fetchNotifications = useCallback(async () => {
        try {
            const res = await axiosInstance.get('/notifications?limit=15');
            setNotifications(res.data.notifications);
            setUnreadCount(res.data.unread_count);
        } catch (err) {
            console.error('Error fetching notifications:', err);
        }
    }, []);

    const fetchUnreadCount = useCallback(async () => {
        try {
            const res = await axiosInstance.get('/notifications/unread-count');
            setUnreadCount(res.data.unread_count);
        } catch (err) {
            console.error('Error fetching unread count:', err);
        }
    }, []);

    useEffect(() => {
        fetchUnreadCount();

        if (!user?.id) return;

        socketRef.current = io(SOCKET_URL);
        socketRef.current.on('connect', () => {
            socketRef.current.emit('join_notifications', user.id);
        });
        socketRef.current.on('new_notification', (notification) => {
            setNotifications((prev) => [notification, ...prev].slice(0, 15));
            setUnreadCount((c) => c + 1);
        });

        return () => socketRef.current?.disconnect();
    }, [user?.id, fetchUnreadCount]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (panelRef.current && !panelRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleToggle = async () => {
        if (!open) {
            setLoading(true);
            await fetchNotifications();
            setLoading(false);
        }
        setOpen(!open);
    };

    const handleMarkRead = async (id, e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        try {
            await axiosInstance.patch(`/notifications/${id}/read`);
            setNotifications((prev) => prev.filter((n) => n.id !== id));
            setUnreadCount((c) => Math.max(0, c - 1));
        } catch (err) {
            console.error('Error marking notification read:', err);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await axiosInstance.patch('/notifications/read-all');
            setNotifications([]);
            setUnreadCount(0);
        } catch (err) {
            console.error('Error marking all read:', err);
        }
    };

    const handleNotificationClick = async (notification) => {
        if (!notification.is_read) {
            await handleMarkRead(notification.id);
        }
        setOpen(false);
    };

    return (
        <div className="relative" ref={panelRef}>
            <button
                onClick={handleToggle}
                className="relative p-2 text-slate-400 hover:text-white transition rounded-lg hover:bg-white/10"
                aria-label="Notifications"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 glass-card rounded-xl shadow-xl z-50 overflow-hidden glow-border">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                        <h3 className="font-semibold text-sm text-white">Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllRead}
                                className="text-xs font-medium text-purple-400 hover:text-purple-300 transition-colors"
                            >
                                Mark all as read
                            </button>
                        )}
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                        {loading ? (
                            <p className="text-center text-slate-500 text-sm py-8">Loading...</p>
                        ) : notifications.length === 0 ? (
                            <p className="text-center text-slate-500 text-sm py-8">No notifications yet</p>
                        ) : (
                            notifications.map((n) => (
                                <Link
                                    key={n.id}
                                    to={n.link || '#'}
                                    onClick={() => handleNotificationClick(n)}
                                    className="block px-4 py-3 border-b border-white/5 hover:bg-[var(--hover-bg)] transition bg-[var(--input-bg)]/50 group"
                                >
                                    <div className="flex gap-3 relative">
                                        <span className="text-lg flex-shrink-0">
                                            {TYPE_ICONS[n.type] || '🔔'}
                                        </span>
                                        <div className="min-w-0 flex-1 pr-6">
                                            <p className="text-sm font-semibold text-theme">
                                                {n.title}
                                            </p>
                                            <p className="text-xs text-theme-muted mt-0.5 line-clamp-2">{n.message}</p>
                                            <p className="text-xs text-theme-faint mt-1">
                                                {new Date(n.created_at).toLocaleString()}
                                            </p>
                                        </div>
                                        <button 
                                            onClick={(e) => handleMarkRead(n.id, e)}
                                            title="Mark as read"
                                            className="absolute right-0 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border border-purple-500/50 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-purple-500/20 transition-all text-purple-400 focus:opacity-100"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                        </button>
                                        <span className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-purple-500 rounded-full flex-shrink-0 group-hover:opacity-0 transition-opacity shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
