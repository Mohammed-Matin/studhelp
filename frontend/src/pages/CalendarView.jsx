import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import PageHero from '../components/PageHero';
import { getEventBanner } from '../utils/images';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const CalendarView = () => {
    const now = new Date();
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [year, setYear] = useState(now.getFullYear());
    const [events, setEvents] = useState({ upcoming: [], live: [], past: [] });
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(null);

    const fetchEvents = useCallback(async () => {
        setLoading(true);
        try {
            const res = await axiosInstance.get(`/events/calendar?month=${month}&year=${year}`);
            setEvents(res.data);
        } catch (err) {
            console.error('Error fetching calendar:', err);
        } finally {
            setLoading(false);
        }
    }, [month, year]);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    const daysInMonth = new Date(year, month, 0).getDate();
    const firstDayOfWeek = new Date(year, month - 1, 1).getDay();
    const today = new Date();

    const isToday = (d) =>
        d === today.getDate() && month === today.getMonth() + 1 && year === today.getFullYear();

    const getEventsForDate = (day) => {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return [...events.upcoming, ...events.live].filter((e) => {
            const start = new Date(e.start_time).toISOString().split('T')[0];
            const end = new Date(e.end_time).toISOString().split('T')[0];
            return start <= dateStr && end >= dateStr;
        });
    };

    const prevMonth = () => {
        if (month === 1) { setMonth(12); setYear(year - 1); }
        else setMonth(month - 1);
    };

    const nextMonth = () => {
        if (month === 12) { setMonth(1); setYear(year + 1); }
        else setMonth(month + 1);
    };

    const statusColors = {
        UPCOMING: 'bg-blue-500',
        LIVE: 'bg-green-500',
        POSTPONED: 'bg-yellow-500',
        CANCELLED: 'bg-red-500',
    };

    const selectedEvents = selectedDate ? getEventsForDate(selectedDate) : [];

    return (
        <div className="min-h-screen">
            <PageHero
                label="Campus Events"
                title={<>Event <span className="text-gradient">Calendar</span></>}
                subtitle="Track upcoming fests, workshops, and club events across SVNIT."
            />

            <div className="max-w-6xl mx-auto px-6 py-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Calendar Grid */}
                <div className="lg:col-span-2 glass-card rounded-xl overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                        <button onClick={prevMonth} className="p-2 hover:bg-white/10 rounded-lg text-slate-300">&larr;</button>
                        <h2 className="text-lg font-display font-semibold text-white">{MONTHS[month - 1]} {year}</h2>
                        <button onClick={nextMonth} className="p-2 hover:bg-white/10 rounded-lg text-slate-300">&rarr;</button>
                    </div>

                    {/* Day names */}
                    <div className="grid grid-cols-7 border-b border-white/10">
                        {DAYS.map((d) => (
                            <div key={d} className="p-2 text-center text-xs font-semibold text-slate-500 uppercase">{d}</div>
                        ))}
                    </div>

                    {/* Days */}
                    <div className="grid grid-cols-7">
                        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                            <div key={`empty-${i}`} className="aspect-square p-1" />
                        ))}
                        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                            const dayEvents = getEventsForDate(day);
                            const hasEvents = dayEvents.length > 0;
                            return (
                                <button
                                    key={day}
                                    onClick={() => setSelectedDate(selectedDate === day ? null : day)}
                                    className={`aspect-square p-1 relative hover:bg-white/5 transition text-slate-300 ${
                                        isToday(day) ? 'bg-purple-500/20' : ''
                                    } ${selectedDate === day ? 'ring-2 ring-purple-500 bg-purple-500/10' : ''}`}
                                >
                                    <span className={`text-sm ${isToday(day) ? 'font-bold text-purple-300' : ''}`}>
                                        {day}
                                    </span>
                                    {hasEvents && (
                                        <div className="flex gap-0.5 justify-center mt-0.5">
                                            {dayEvents.slice(0, 3).map((e) => (
                                                <div key={e.id} className={`w-1.5 h-1.5 rounded-full ${statusColors[e.status] || 'bg-gray-300'}`} />
                                            ))}
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Event List Panel */}
                <div className="glass-card rounded-xl p-6">
                    <h3 className="font-display font-semibold text-white mb-4">
                        {selectedDate
                            ? `${MONTHS[month - 1]} ${selectedDate}, ${year}`
                            : 'Select a date'}
                    </h3>
                    {loading ? (
                        <p className="text-gray-400 text-sm">Loading...</p>
                    ) : selectedDate ? (
                        selectedEvents.length === 0 ? (
                            <p className="text-gray-400 text-sm">No events on this day</p>
                        ) : (
                            <div className="space-y-3">
                                {selectedEvents.map((event) => (
                                    <Link key={event.id} to={`/events/${event.id}`}
                                          className="block bg-white/5 rounded-lg p-3 hover:bg-white/10 transition overflow-hidden">
                                        <div className="h-16 -mx-3 -mt-3 mb-2 overflow-hidden">
                                            <img src={getEventBanner(event)} alt="" className="w-full h-full object-cover opacity-70" />
                                        </div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`w-2 h-2 rounded-full ${statusColors[event.status] || 'bg-slate-500'}`} />
                                            <span className="font-medium text-sm text-white">{event.title}</span>
                                        </div>
                                        <p className="text-xs text-slate-400">{event.club_name}</p>
                                        <p className="text-xs text-slate-500 mt-1">
                                            {new Date(event.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            {' - '}
                                            {new Date(event.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </Link>
                                ))}
                            </div>
                        )
                    ) : (
                        <div className="space-y-4">
                            {events.live.length > 0 && (
                                <div>
                                    <h4 className="text-xs font-semibold text-emerald-400 uppercase mb-2">Live Now</h4>
                                    {events.live.map((e) => (
                                        <Link key={e.id} to={`/events/${e.id}`}
                                              className="block bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 mb-2 text-sm font-medium text-emerald-300">
                                            {e.title}
                                        </Link>
                                    ))}
                                </div>
                            )}
                            {events.upcoming.length > 0 && (
                                <div>
                                    <h4 className="text-xs font-semibold text-cyan-400 uppercase mb-2">Upcoming</h4>
                                    {events.upcoming.slice(0, 5).map((e) => (
                                        <Link key={e.id} to={`/events/${e.id}`}
                                              className="block bg-white/5 rounded-lg p-3 mb-2 text-sm hover:bg-white/10 transition">
                                            <p className="font-medium text-white">{e.title}</p>
                                            <p className="text-xs text-slate-500">{new Date(e.start_time).toLocaleDateString()}</p>
                                        </Link>
                                    ))}
                                </div>
                            )}
                            {events.upcoming.length === 0 && events.live.length === 0 && (
                                <p className="text-gray-400 text-sm">No events this month</p>
                            )}
                        </div>
                    )}
                </div>
            </div>
            </div>
        </div>
    );
};

export default CalendarView;
