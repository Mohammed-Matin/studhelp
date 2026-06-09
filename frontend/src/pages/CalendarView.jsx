import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';

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
        <div className="p-6 max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Calendar</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Calendar Grid */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b">
                        <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg">&larr;</button>
                        <h2 className="text-lg font-semibold">{MONTHS[month - 1]} {year}</h2>
                        <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg">&rarr;</button>
                    </div>

                    {/* Day names */}
                    <div className="grid grid-cols-7 border-b">
                        {DAYS.map((d) => (
                            <div key={d} className="p-2 text-center text-xs font-semibold text-gray-500 uppercase">{d}</div>
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
                                    className={`aspect-square p-1 relative hover:bg-gray-50 transition ${
                                        isToday(day) ? 'bg-blue-50' : ''
                                    } ${selectedDate === day ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`}
                                >
                                    <span className={`text-sm ${isToday(day) ? 'font-bold text-blue-600' : ''}`}>
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
                <div className="bg-white rounded-xl shadow-sm border p-6">
                    <h3 className="font-semibold mb-4">
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
                                          className="block bg-gray-50 rounded-lg p-3 hover:shadow-sm transition">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`w-2 h-2 rounded-full ${statusColors[event.status] || 'bg-gray-300'}`} />
                                            <span className="font-medium text-sm">{event.title}</span>
                                        </div>
                                        <p className="text-xs text-gray-500">{event.club_name}</p>
                                        <p className="text-xs text-gray-400 mt-1">
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
                                    <h4 className="text-xs font-semibold text-green-600 uppercase mb-2">Live Now</h4>
                                    {events.live.map((e) => (
                                        <Link key={e.id} to={`/events/${e.id}`}
                                              className="block bg-green-50 rounded-lg p-3 mb-2 text-sm font-medium text-green-800">
                                            {e.title}
                                        </Link>
                                    ))}
                                </div>
                            )}
                            {events.upcoming.length > 0 && (
                                <div>
                                    <h4 className="text-xs font-semibold text-blue-600 uppercase mb-2">Upcoming</h4>
                                    {events.upcoming.slice(0, 5).map((e) => (
                                        <Link key={e.id} to={`/events/${e.id}`}
                                              className="block bg-blue-50 rounded-lg p-3 mb-2 text-sm">
                                            <p className="font-medium">{e.title}</p>
                                            <p className="text-xs text-gray-500">{new Date(e.start_time).toLocaleDateString()}</p>
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
    );
};

export default CalendarView;
