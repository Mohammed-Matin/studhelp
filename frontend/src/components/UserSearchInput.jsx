import { useState, useEffect, useRef } from 'react';
import axiosInstance from '../api/axiosInstance';

const UserSearchInput = ({ onSelect, excludeIds = [], placeholder = 'Search by name or username...' }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const wrapperRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (query.length < 2) {
            setResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            setLoading(true);
            try {
                const res = await axiosInstance.get(`/messages/search?q=${encodeURIComponent(query)}`);
                const excluded = new Set(excludeIds);
                setResults(res.data.filter((u) => !excluded.has(u.id)));
                setOpen(true);
            } catch (err) {
                console.error('User search error:', err);
                setResults([]);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query, excludeIds]);

    const handleSelect = (user) => {
        onSelect(user);
        setQuery('');
        setResults([]);
        setOpen(false);
    };

    return (
        <div ref={wrapperRef} className="relative w-full">
            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => query.length >= 2 && setOpen(true)}
                placeholder={placeholder}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                autoComplete="off"
            />
            {loading && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">Searching...</span>
            )}
            {open && query.length >= 2 && (
                <div className="absolute z-20 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {results.length === 0 && !loading ? (
                        <p className="px-3 py-2 text-sm text-gray-400">No users found</p>
                    ) : (
                        results.map((user) => (
                            <button
                                key={user.id}
                                type="button"
                                onClick={() => handleSelect(user)}
                                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-blue-50 text-left transition"
                            >
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                    {(user.full_name || user.username)?.charAt(0)?.toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-medium truncate">{user.full_name || user.username}</p>
                                    <p className="text-xs text-gray-500">@{user.username}</p>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default UserSearchInput;
