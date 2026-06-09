import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import PageHero from '../components/PageHero';
import ClubCard from '../components/ClubCard';

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
        <div className="min-h-screen">
            <PageHero
                label="SVNIT Surat • Club Ecosystem"
                title={<>Discover <span className="text-gradient">Clubs</span></>}
                subtitle="Where innovation meets community. Explore techno-cultural clubs, host events, and connect with brilliant minds across campus."
            >
                <div className="flex flex-wrap gap-4">
                    <Link to="/clubs/new" className="btn-primary">+ Create Club</Link>
                    <div className="flex items-center gap-6 text-sm text-slate-400">
                        <span><strong className="text-white text-lg">{clubs.length}</strong> clubs</span>
                        <span><strong className="text-white text-lg">{myClubIds.size}</strong> joined</span>
                    </div>
                </div>
            </PageHero>

            <div className="max-w-7xl mx-auto px-6 py-10">
                <div className="mb-8">
                    <input
                        type="text"
                        placeholder="Search clubs by name or description..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="input-dark max-w-lg"
                    />
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-56 rounded-2xl glass-card animate-pulse" />
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="glass-card rounded-2xl p-16 text-center">
                        <p className="text-slate-400 text-lg mb-4">
                            {search ? 'No clubs match your search' : 'No clubs yet'}
                        </p>
                        {!search && (
                            <Link to="/clubs/new" className="btn-primary inline-block">
                                Launch the first club
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filtered.map((club) => {
                            const isMember = myClubIds.has(club.id);
                            const isFollowing = followedIds.has(club.id);
                            let badge = null;
                            let badgeColor = 'purple';
                            if (isMember) { badge = 'Member'; badgeColor = 'green'; }
                            else if (isFollowing) { badge = 'Following'; badgeColor = 'cyan'; }
                            return (
                                <ClubCard key={club.id} club={club} badge={badge} badgeColor={badgeColor} />
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClubsListPage;
