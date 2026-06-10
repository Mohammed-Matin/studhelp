import { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { CalendarDays, Clock3 } from "lucide-react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import { isManager } from "../utils/clubRoles";
import { SUGGESTED_BANNERS } from "../utils/images";
import CustomSelect from "../components/CustomSelect";
import NumberInput from "../components/NumberInput";

const HOURS = Array.from({ length: 24 }, (_, hour) => hour);
const MINUTES = Array.from({ length: 12 }, (_, index) => index * 5);
const padTime = (value) => String(value).padStart(2, "0");

const ScheduleField = ({
  label,
  value,
  onChange,
  placeholder,
  description,
  Icon,
  popperPlacement = "bottom-start",
}) => {
  const selectedDate = value ? new Date(value) : null;
  const selectedHour = selectedDate?.getHours();
  const selectedMinute = selectedDate?.getMinutes();

  const handleDateChange = (date) => {
    if (!date) {
      onChange(null);
      return;
    }

    const next = new Date(date);
    next.setHours(selectedHour ?? 7, selectedMinute ?? 0, 0, 0);
    onChange(next);
  };

  const handleTimeChange = (part, nextValue) => {
    const next = selectedDate && !Number.isNaN(selectedDate.getTime())
      ? new Date(selectedDate)
      : new Date();

    if (part === "hour") {
      next.setHours(nextValue);
    } else {
      next.setMinutes(nextValue);
    }

    next.setSeconds(0, 0);
    onChange(next);
  };

  const renderTimePanel = () => (
    <div className="event-time-panel">
      <div className="event-time-column event-time-hours">
        <p className="event-time-label">Hour</p>
        <div className="event-time-grid event-time-grid-hours">
          {HOURS.map((hour) => (
            <button
              key={hour}
              type="button"
              onClick={() => handleTimeChange("hour", hour)}
              className={`event-time-option ${
                selectedHour === hour ? "event-time-option-active" : ""
              }`}
            >
              {padTime(hour)}
            </button>
          ))}
        </div>
      </div>
      <div className="event-time-column event-time-minutes">
        <p className="event-time-label">Minute</p>
        <div className="event-time-grid event-time-grid-minutes">
          {MINUTES.map((minute) => (
            <button
              key={minute}
              type="button"
              onClick={() => handleTimeChange("minute", minute)}
              className={`event-time-option ${
                selectedMinute === minute ? "event-time-option-active" : ""
              }`}
            >
              {padTime(minute)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <label className="block text-sm font-medium text-theme-muted mb-1">
        {label}
      </label>
      <div className="relative group">
        <div className="pointer-events-none absolute inset-y-0 left-4 z-10 flex items-center text-cyan-500/70 group-hover:text-cyan-400 transition-colors">
          <Icon className="h-4 w-4" />
        </div>
        <DatePicker
          selected={selectedDate}
          onChange={handleDateChange}
          dateFormat="MMMM d, yyyy h:mm aa"
          placeholderText={placeholder || "Select date and time"}
          wrapperClassName="event-date-picker-wrapper"
          className="event-date-picker-input input-dark w-full cursor-pointer hover:border-cyan-500/30 transition-colors"
          popperPlacement={popperPlacement}
          popperClassName="event-date-picker-popper"
          calendarContainer={({ className, children }) => (
            <div className={`${className} event-date-picker-panel`}>
              <div className="event-calendar-panel">{children}</div>
              {renderTimePanel()}
            </div>
          )}
          required
        />
      </div>
      {description && <p className="mt-1.5 text-xs text-theme-faint">{description}</p>}
    </div>
  );
};

const CreateEventPage = () => {
  const { clubId } = useParams();
  const navigate = useNavigate();
  const [club, setClub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [clashes, setClashes] = useState([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    banner_url: "",
    start_time: "",
    end_time: "",
    participation_type: "BOTH",
    max_teams: "",
    max_participants: "",
  });

  useEffect(() => {
    const fetchClub = async () => {
      try {
        const res = await axiosInstance.get(`/clubs/${clubId}`);
        setClub(res.data);
        if (!isManager(res.data.userRole)) {
          setError("Only club managers can create events");
        }
      } catch (err) {
        setError("Club not found");
      } finally {
        setLoading(false);
      }
    };
    if (clubId) fetchClub();
  }, [clubId]);

  useEffect(() => {
    const checkClashes = async () => {
      if (!form.start_time || !form.end_time) {
        setClashes([]);
        return;
      }
      try {
        const res = await axiosInstance.get("/events/clashes", {
          params: {
            club_id: clubId,
            start_time: new Date(form.start_time).toISOString(),
            end_time: new Date(form.end_time).toISOString(),
          },
        });
        setClashes(res.data);
      } catch {
        setClashes([]);
      }
    };
    const timer = setTimeout(checkClashes, 500);
    return () => clearTimeout(timer);
  }, [form.start_time, form.end_time, clubId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.title.trim() || !form.start_time || !form.end_time) {
      setError("Title, start time, and end time are required");
      return;
    }
    if (new Date(form.start_time) >= new Date(form.end_time)) {
      setError("End time must be after start time");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        club_id: clubId,
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        banner_url: form.banner_url.trim() || undefined,
        start_time: new Date(form.start_time).toISOString(),
        end_time: new Date(form.end_time).toISOString(),
        participation_type: form.participation_type,
        max_teams: form.max_teams ? parseInt(form.max_teams) : null,
        max_participants: form.max_participants
          ? parseInt(form.max_participants)
          : null,
      };
      const res = await axiosInstance.post("/events", payload);
      navigate(`/events/${res.data.id}`);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.details?.[0]?.message ||
          "Failed to create event",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07070f] flex items-center justify-center">
        <p className="text-slate-400 animate-pulse">Loading...</p>
      </div>
    );
  }

  if (!club || !isManager(club.userRole)) {
    return (
      <div className="p-6 max-w-2xl mx-auto text-center min-h-screen bg-[#07070f]">
        <p className="text-red-400 mb-4">
          {error || "You do not have permission to create events for this club"}
        </p>
        <Link to={`/clubs/${clubId}`} className="text-cyan-400 hover:underline">
          ← Back to Club
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07070f]">
      <div className="relative border-b border-white/5 py-12 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div className="relative max-w-3xl mx-auto">
          <Link
            to={`/clubs/${clubId}`}
            className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-sm transition mb-4"
          >
            <span>←</span> Back to {club.name}
          </Link>
          <p className="text-xs tracking-[0.2em] uppercase text-purple-400 mb-2">
            Host an Event
          </p>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-white">
            Create <span className="text-gradient">Event</span>
          </h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="glass-card rounded-2xl overflow-visible glow-border">
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-300 rounded-lg p-3 text-sm">
                {error}
              </div>
            )}

            {clashes.length > 0 && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 text-sm">
                <p className="font-medium text-amber-300">
                  Schedule clash detected
                </p>
                <p className="text-amber-200/70 mt-1">
                  Overlaps with: {clashes.map((c) => c.title).join(", ")}
                </p>
              </div>
            )}

            <section>
              <h2 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider mb-4">
                Basic Details
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-theme-muted mb-1">
                    Event Title *
                  </label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) =>
                      setForm({ ...form, title: e.target.value })
                    }
                    placeholder="e.g. Hackathon 2026"
                    className="input-dark"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-theme-muted mb-1">
                    Description
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                    placeholder="Describe the event, rules, prizes, eligibility..."
                    rows={5}
                    className="input-dark resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-theme-muted mb-1">
                    Banner Image URL
                  </label>
                  <input
                    type="url"
                    value={form.banner_url}
                    onChange={(e) =>
                      setForm({ ...form, banner_url: e.target.value })
                    }
                    placeholder="https://images.unsplash.com/..."
                    className="input-dark"
                  />
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {SUGGESTED_BANNERS.map((url) => (
                      <button
                        key={url}
                        type="button"
                        onClick={() => setForm({ ...form, banner_url: url })}
                        className="w-20 h-12 rounded-lg overflow-hidden border border-white/10 hover:border-purple-500/50 transition"
                      >
                        <img
                          src={url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-theme-faint mt-1">
                    Saved to database when event is created
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider mb-4">
                Schedule
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ScheduleField
                  label="Start Date & Time *"
                  value={form.start_time}
                  onChange={(date) =>
                    setForm({ ...form, start_time: date ? date.toISOString() : "" })
                  }
                  placeholder="Select start date..."
                  description="When does the magic begin?"
                  Icon={CalendarDays}
                />
                <ScheduleField
                  label="End Date & Time *"
                  value={form.end_time}
                  onChange={(date) =>
                    setForm({ ...form, end_time: date ? date.toISOString() : "" })
                  }
                  placeholder="Select end date..."
                  description="When does it wrap up?"
                  Icon={Clock3}
                  popperPlacement="bottom-end"
                />
              </div>
            </section>

            <section>
              <h2 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider mb-4">
                Participation
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-theme-muted mb-1">
                    Type
                  </label>
                  <CustomSelect
                    value={form.participation_type}
                    onChange={(e) =>
                      setForm({ ...form, participation_type: e.target.value })
                    }
                    options={[
                      { value: "BOTH", label: "Solo & Team" },
                      { value: "SOLO", label: "Solo Only" },
                      { value: "TEAM", label: "Team Only" },
                    ]}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-theme-muted mb-1">
                    Max Teams
                  </label>
                  <NumberInput
                    min="1"
                    value={form.max_teams}
                    onChange={(e) =>
                      setForm({ ...form, max_teams: e.target.value })
                    }
                    placeholder="Unlimited"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-theme-muted mb-1">
                    Max Participants
                  </label>
                  <NumberInput
                    min="1"
                    value={form.max_participants}
                    onChange={(e) =>
                      setForm({ ...form, max_participants: e.target.value })
                    }
                    placeholder="Unlimited"
                  />
                </div>
              </div>
            </section>

            <div className="flex gap-3 justify-end pt-4 border-t border-white/10">
              <Link to={`/clubs/${clubId}`} className="btn-ghost">
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary disabled:opacity-50"
              >
                {submitting ? "Creating..." : "Create Event"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateEventPage;
