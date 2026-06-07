import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from '../api/axiosConfig.js';

const registerSchema = z.object({
    username: z.string().min(3, "Username must be at least 3 characters").max(50),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    full_name: z.string().max(150).optional(),
    admission_no: z.string().max(20).optional(),
    branch: z.string().max(100).optional(),
    semester: z.string().optional(),
    degree: z.enum(['BTECH', 'MTECH', 'PHD', 'MSC']).optional(),
    gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
    mobile_no: z.string().max(15).optional(),
    bonafide: z.any().optional(),
});

const Register = () => {
    const navigate = useNavigate();
    const [serverError, setServerError] = useState('');

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
        resolver: zodResolver(registerSchema)
    });

    const onSubmit = async (data) => {
        try {
            setServerError('');
            const formData = new FormData();

            // Append all text fields
            Object.keys(data).forEach(key => {
                if (key !== 'bonafide' && data[key]) {
                    formData.append(key, data[key]);
                }
            });

            // Append file if exists
            if (data.bonafide && data.bonafide[0]) {
                formData.append('bonafide', data.bonafide[0]);
            }

            const response = await axios.post('/api/v1/user/register', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            console.log("Registration successful", response.data);
            navigate('/login');
        } catch (error) {
            console.error("Registration failed", error);
            setServerError(error.response?.data?.error || 'Registration failed. Please try again.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Create an account</h2>
                </div>

                {serverError && (
                    <div className="bg-red-50 text-red-700 p-3 rounded text-sm text-center">
                        {typeof serverError === 'string' ? serverError : JSON.stringify(serverError)}
                    </div>
                )}

                <form className="mt-8 space-y-4" onSubmit={handleSubmit(onSubmit)}>
                    <div>
                        <input
                            {...register("username")}
                            type="text"
                            className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="Username *"
                        />
                        {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username.message}</p>}
                    </div>

                    <div>
                        <input
                            {...register("email")}
                            type="email"
                            className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="Email *"
                        />
                        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                    </div>

                    <div>
                        <input
                            {...register("password")}
                            type="password"
                            className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="Password *"
                        />
                        {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <input
                                {...register("full_name")}
                                type="text"
                                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                placeholder="Full Name"
                            />
                        </div>
                        <div>
                            <input
                                {...register("admission_no")}
                                type="text"
                                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                placeholder="Admission No"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <select {...register("degree")} className="appearance-none relative block w-full px-3 py-2 border border-gray-300 text-gray-500 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                                <option value="">Degree...</option>
                                <option value="BTECH">B.Tech</option>
                                <option value="MTECH">M.Tech</option>
                                <option value="PHD">PhD</option>
                                <option value="MSC">MSc</option>
                            </select>
                        </div>
                        <div>
                            <input
                                {...register("branch")}
                                type="text"
                                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                placeholder="Branch"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <input
                                {...register("semester")}
                                type="number"
                                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                placeholder="Semester (Number)"
                            />
                        </div>
                        <div>
                            <select {...register("gender")} className="appearance-none relative block w-full px-3 py-2 border border-gray-300 text-gray-500 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                                <option value="">Gender...</option>
                                <option value="MALE">Male</option>
                                <option value="FEMALE">Female</option>
                                <option value="OTHER">Other</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <input
                            {...register("mobile_no")}
                            type="text"
                            className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="Mobile No"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Bonafide Certificate (PDF/Image)</label>
                        <input
                            {...register("bonafide")}
                            type="file"
                            accept=".pdf,image/*"
                            className="appearance-none relative block w-full px-3 py-2 border border-gray-300 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
                        >
                            {isSubmitting ? 'Registering...' : 'Register'}
                        </button>
                    </div>

                    <div className="text-center mt-4">
                        <Link to="/login" className="text-sm text-blue-600 hover:text-blue-500">
                            Already have an account? Sign in.
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Register;
