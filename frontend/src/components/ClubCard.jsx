import { Link } from 'react-router-dom';
import { getClubCover, getClubLogo } from '../utils/images';

const ClubCard = ({ club, badge, badgeColor = 'purple' }) => {
    const badgeStyles = {
        green: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        purple: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
        cyan: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    };

    return (
        <Link
            to={`/clubs/${club.id}`}
            className="group block rounded-2xl overflow-hidden glass-card glow-border hover:scale-[1.02] transition-all duration-300 animate-fade-up"
        >
            <div className="relative h-36 overflow-hidden">
                <img
                    src={getClubCover(club)}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 card-image-overlay" />
                {badge && (
                    <span className={`absolute top-3 right-3 px-2.5 py-1 text-xs font-semibold rounded-full border ${badgeStyles[badgeColor]}`}>
                        {badge}
                    </span>
                )}
            </div>
            <div className="p-4 flex gap-3">
                <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-purple-500/30 flex-shrink-0 -mt-8 relative z-10 shadow-lg">
                    <img src={getClubLogo(club)} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0 pt-1">
                    <h3 className="font-display font-semibold text-theme group-hover:text-purple-400 transition truncate">
                        {club.name}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                        {club.description || 'Explore events and connect with members'}
                    </p>
                    <div className="flex gap-4 mt-2 text-xs text-slate-500">
                        <span>{club.member_count || 0} members</span>
                        <span>{club.follower_count || 0} followers</span>
                    </div>
                </div>
            </div>
        </Link>
    );
};

export default ClubCard;
