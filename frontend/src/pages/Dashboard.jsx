import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, PlusCircle, CalendarDays, MessageCircle } from 'lucide-react';
import axiosInstance from '../api/axiosInstance';
import { isVerified, isAdmin, getUser } from '../utils/auth';
import PageHero from '../components/PageHero';
import ClubCard from '../components/ClubCard';
import TypewriterText from '../components/TypewriterText';
import { getHeroImage } from '../utils/images';

const Dashboard = () => {
    const user = getUser();
    const [myClubs, setMyClubs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axiosInstance.get('/clubs/mine')
            .then((res) => setMyClubs(res.data))
            .catch((err) => console.error('Error fetching clubs:', err))
            .finally(() => setLoading(false));
    }, []);

    const quickLinks = [
        { to: '/clubs', label: 'Browse Clubs', desc: 'Discover communities', color: 'from-cyan-500 to-blue-600', icon: Users },
        { to: '/clubs/new', label: 'Create Club', desc: 'Start something new', color: 'from-purple-500 to-violet-600', icon: PlusCircle },
        { to: '/calendar', label: 'Events Calendar', desc: 'Upcoming fests', color: 'from-fuchsia-500 to-pink-600', icon: CalendarDays },
        { to: '/chat', label: 'Messages', desc: 'Club & DM chat', color: 'from-emerald-500 to-teal-600', icon: MessageCircle },
    ];

    return (
        <div className="min-h-screen">
            <PageHero
                label={
                    <TypewriterText
                        text={`Welcome back, ${user?.full_name || user?.username || 'there'}`}
                    />
                }
                title={<>Your <span className="text-gradient">Command Center</span></>}
                subtitle="Manage clubs, track events, and stay connected with your campus community."
                image={getHeroImage()}
            />

            <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">
                {!isVerified() && !isAdmin() && (
                    <div className="glass-card rounded-xl p-4 border-amber-500/30 bg-amber-500/5">
                        <div className="flex items-start gap-3">
                            <span className="text-amber-400 text-lg">⚠</span>
                            <div>
                                <h3 className="font-semibold text-amber-300">Account Pending Verification</h3>
                                <p className="text-amber-200/70 text-sm mt-1">
                                    An admin will review your bonafide certificate shortly.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {quickLinks.map((item) => {
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.to}
                                to={item.to}
                                className="group glass-card rounded-2xl p-5 hover:scale-[1.02] transition-all duration-300"
                            >
                                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.color} mb-3 flex items-center justify-center opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300`}>
                                    <Icon className="w-5 h-5 text-white keep-white" strokeWidth={2} />
                                </div>
                                <h3 className="font-display font-semibold text-white group-hover:text-purple-300 transition">
                                    {item.label}
                                </h3>
                                <p className="text-xs text-slate-500 mt-1">{item.desc}</p>
                            </Link>
                        );
                    })}
                </div>

                <section>
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <p className="text-xs tracking-[0.2em] uppercase text-cyan-400 mb-1">Your Communities</p>
                            <h2 className="font-display text-2xl font-bold text-white">My Clubs</h2>
                        </div>
                        <Link to="/clubs" className="btn-ghost text-sm">View all →</Link>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2].map((i) => <div key={i} className="h-56 rounded-2xl glass-card animate-pulse" />)}
                        </div>
                    ) : myClubs.length === 0 ? (
                        <div className="glass-card rounded-2xl p-12 text-center">
                            <p className="text-slate-400 mb-4">You haven&apos;t joined any clubs yet</p>
                            <div className="flex gap-4 justify-center">
                                <Link to="/clubs" className="btn-primary">Browse Clubs</Link>
                                <Link to="/clubs/new" className="btn-ghost">Create Club</Link>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {myClubs.map((club) => (
                                <ClubCard
                                    key={club.id}
                                    club={club}
                                    badge={club.user_role?.replace(/_/g, ' ')}
                                    badgeColor="green"
                                />
                            ))}
                        </div>
                    )}
                </section>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                        { label: 'Clubs Joined', value: myClubs.length, accent: 'text-cyan-400' },
                        { label: 'Role', value: myClubs[0]?.user_role?.replace(/_/g, ' ') || '—', accent: 'text-purple-400', small: true },
                        { label: 'Platform', value: 'StudHelp', accent: 'text-fuchsia-400' },
                    ].map((stat) => (
                        <div key={stat.label} className="glass-card rounded-2xl p-6 text-center">
                            <p className="text-xs uppercase tracking-wider text-slate-500 mb-2">{stat.label}</p>
                            <p className={`font-display font-bold ${stat.small ? 'text-lg capitalize' : 'text-3xl'} ${stat.accent}`}>
                                {stat.value}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
