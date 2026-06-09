import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
const ClubsListPage = () => {
    const [clubs, setClubs] = useState([]);
    const [myClubIds, setMyClubIds] = useState(new Set());
    const [followedIds, setFollowedIds] = useState(new Set());
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [clubsRes, mineRes, followingRes] = await Promise.all([
                    axiosInstance.get('/clubs'),
                    axiosInstance.get('/clubs/mine'),
                    axiosInstance.get('/clubs/following'),
                ]);
                setClubs(clubsRes.data);
                setMyClubIds(new Set(mineRes.data.map((c) => c.id)));
                setFollowedIds(new Set(followingRes.data.map((c) => c.id)));
            } catch (err) {
                console.error('Error fetching clubs:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const filtered = clubs.filter((club) =>
        club.name?.toLowerCase().includes(search.toLowerCase()) ||
        club.description?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Clubs</h1>
                    <p className="text-gray-600 mt-1">Discover and join clubs at SVNIT</p>
                </div>
                <Link
                    to="/clubs/new"
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition shadow-sm text-center"
                >
                    + Create Club
                </Link>
            </div>

            <div className="mb-6">
                <input
                    type="text"
                    placeholder="Search clubs..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full max-w-md px-4 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
            </div>

            {loading ? (
                <p className="text-gray-400 text-center py-12">Loading clubs...</p>
            ) : filtered.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
                    <p className="text-gray-500 mb-4">
                        {search ? 'No clubs match your search' : 'No clubs yet'}
                    </p>
                    {!search && (
                        <Link to="/clubs/new" className="text-blue-600 hover:underline font-medium">
                            Be the first to create one
                        </Link>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filtered.map((club) => {
                        const isMember = myClubIds.has(club.id);
                        const isFollowing = followedIds.has(club.id);
                        return (
                            <Link
                                key={club.id}
                                to={`/clubs/${club.id}`}
                                className="bg-white rounded-xl shadow-sm border p-5 hover:shadow-md transition group block"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl flex-shrink-0 overflow-hidden">
                                        {club.logo_url ? (
                                            <img src={club.logo_url} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            club.name?.charAt(0)?.toUpperCase()
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition truncate">
                                                {club.name}
                                            </h3>
                                            {isMember && (
                                                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                                                    Member
                                                </span>
                                            )}
                                            {!isMember && isFollowing && (
                                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                                                    Following
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-500 line-clamp-2 mt-1">
                                            {club.description || 'No description'}
                                        </p>
                                        <div className="flex gap-4 mt-3 text-xs text-gray-400">
                                            <span>{club.member_count || 0} members</span>
                                            <span>{club.follower_count || 0} followers</span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default ClubsListPage;
