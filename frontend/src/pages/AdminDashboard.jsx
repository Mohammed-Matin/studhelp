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
        return <div className="p-6 text-center text-gray-500">Loading pending students...</div>;
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

            <div className="bg-white rounded-lg shadow">
                <div className="p-4 border-b">
                    <h2 className="text-xl font-semibold">Pending Verifications</h2>
                    <p className="text-sm text-gray-500 mt-1">
                        {pendingStudents.length} student{pendingStudents.length !== 1 ? 's' : ''} awaiting verification
                    </p>
                </div>

                {pendingStudents.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        No pending students. Everything is up to date!
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 text-left">
                                    <th className="p-3 font-medium">Name</th>
                                    <th className="p-3 font-medium">Username</th>
                                    <th className="p-3 font-medium">Email</th>
                                    <th className="p-3 font-medium">Admission No</th>
                                    <th className="p-3 font-medium">Branch</th>
                                    <th className="p-3 font-medium">Semester</th>
                                    <th className="p-3 font-medium">Bonafide</th>
                                    <th className="p-3 font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pendingStudents.map((student) => (
                                    <tr key={student.id} className="border-t hover:bg-gray-50">
                                        <td className="p-3">{student.full_name}</td>
                                        <td className="p-3">{student.username}</td>
                                        <td className="p-3">{student.email}</td>
                                        <td className="p-3">{student.admission_no}</td>
                                        <td className="p-3">{student.branch}</td>
                                        <td className="p-3">{student.semester}</td>
                                        <td className="p-3">
                                            {student.bonafide_url ? (
                                                <a
                                                    href={student.bonafide_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:underline"
                                                >
                                                    View
                                                </a>
                                            ) : (
                                                <span className="text-gray-400">None</span>
                                            )}
                                        </td>
                                        <td className="p-3 flex gap-2">
                                            <Button
                                                onClick={() => handleVerification(student.id, 'VERIFIED')}
                                                isLoading={actionLoading === student.id}
                                                className="!bg-green-600 hover:!bg-green-700 !px-3 !py-1 !text-sm"
                                            >
                                                Verify
                                            </Button>
                                            <Button
                                                onClick={() => handleVerification(student.id, 'REJECTED')}
                                                isLoading={actionLoading === student.id}
                                                className="!bg-red-600 hover:!bg-red-700 !px-3 !py-1 !text-sm"
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
