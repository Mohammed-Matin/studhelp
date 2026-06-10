import { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import Button from '../components/Button';

const AdminDashboard = () => {
    const [pendingStudents, setPendingStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);

    const fetchPendingStudents = async () => {
        try {
            const res = await axiosInstance.get('/user/pending');
            setPendingStudents(res.data);
        } catch (err) {
            console.error('Failed to fetch pending students:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPendingStudents();
    }, []);

    const handleVerification = async (userId, status) => {
        setActionLoading(userId);
        try {
            await axiosInstance.patch(`/user/verify/${userId}`, { status });
            setPendingStudents((prev) => prev.filter((s) => s.id !== userId));
        } catch (err) {
            console.error(`Failed to ${status.toLowerCase()} user:`, err);
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) {
        return <div className="p-6 text-center text-theme-muted">Loading pending students...</div>;
    }

    return (
        <div className="p-6 max-w-7xl mx-auto animate-fade-up">
            <h1 className="text-3xl font-display font-bold mb-6 text-theme">Admin Dashboard</h1>

            <div className="glass-card rounded-2xl glow-border">
                <div className="p-5 border-b border-theme">
                    <h2 className="text-xl font-semibold text-theme">Pending Verifications</h2>
                    <p className="text-sm text-theme-muted mt-1">
                        {pendingStudents.length} student{pendingStudents.length !== 1 ? 's' : ''} awaiting verification
                    </p>
                </div>

                {pendingStudents.length === 0 ? (
                    <div className="p-12 text-center text-theme-muted">
                        No pending students. Everything is up to date!
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-[var(--input-bg)] text-left text-theme-muted border-b border-theme">
                                    <th className="p-4 font-medium">Name</th>
                                    <th className="p-4 font-medium">Username</th>
                                    <th className="p-4 font-medium">Email</th>
                                    <th className="p-4 font-medium">Admission No</th>
                                    <th className="p-4 font-medium">Branch</th>
                                    <th className="p-4 font-medium">Semester</th>
                                    <th className="p-4 font-medium">Bonafide</th>
                                    <th className="p-4 font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pendingStudents.map((student) => (
                                    <tr key={student.id} className="border-b border-theme last:border-0 hover:bg-[var(--hover-bg)] transition-colors text-theme">
                                        <td className="p-4">{student.full_name}</td>
                                        <td className="p-4">{student.username}</td>
                                        <td className="p-4 text-theme-muted">{student.email}</td>
                                        <td className="p-4 font-mono text-xs">{student.admission_no}</td>
                                        <td className="p-4">{student.branch}</td>
                                        <td className="p-4">{student.semester}</td>
                                        <td className="p-4">
                                            {student.bonafide_url ? (
                                                <a
                                                    href={student.bonafide_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-cyan-400 hover:text-cyan-300 hover:underline font-medium"
                                                >
                                                    View
                                                </a>
                                            ) : (
                                                <span className="text-theme-faint">None</span>
                                            )}
                                        </td>
                                        <td className="p-4 flex gap-2">
                                            <Button
                                                onClick={() => handleVerification(student.id, 'VERIFIED')}
                                                isLoading={actionLoading === student.id}
                                                className="!bg-emerald-500/20 hover:!bg-emerald-500/30 !text-emerald-400 !border !border-emerald-500/30 !px-3 !py-1 !text-xs transition-all"
                                            >
                                                Verify
                                            </Button>
                                            <Button
                                                onClick={() => handleVerification(student.id, 'REJECTED')}
                                                isLoading={actionLoading === student.id}
                                                className="!bg-rose-500/20 hover:!bg-rose-500/30 !text-rose-400 !border !border-rose-500/30 !px-3 !py-1 !text-xs transition-all"
                                            >
                                                Reject
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
