import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from '../api/axiosConfig.js';

const loginSchema = z.object({
    identifier: z.string().min(1, "Username or Email is required"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

const Login = () => {
    const navigate = useNavigate();
    const [serverError, setServerError] = useState('');

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
        resolver: zodResolver(loginSchema)
    });

    const onSubmit = async (data) => {
        try {
            setServerError('');
            const response = await axios.post('/api/v1/user/login', data);

            // Store JWT token
            const { token, user } = response.data;
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));

            console.log("Login successful", user);
            navigate('/dashboard');
        } catch (error) {
            console.error("Login failed", error);
            setServerError(error.response?.data?.error || 'Login failed. Please check your credentials.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Sign in to your account</h2>
                </div>

                {serverError && (
                    <div className="bg-red-50 text-red-700 p-3 rounded text-sm text-center">
                        {typeof serverError === 'string' ? serverError : JSON.stringify(serverError)}
                    </div>
                )}

                <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div>
                            <input
                                {...register("identifier")}
                                type="text"
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                placeholder="Username or Email"
                            />
                            {errors.identifier && <p className="text-red-500 text-xs mt-1 mb-2 px-1">{errors.identifier.message}</p>}
                        </div>
                        <div>
                            <input
                                {...register("password")}
                                type="password"
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                placeholder="Password"
                            />
                            {errors.password && <p className="text-red-500 text-xs mt-1 px-1">{errors.password.message}</p>}
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
                        >
                            {isSubmitting ? 'Signing in...' : 'Sign in'}
                        </button>
                    </div>

                    <div className="text-center mt-4">
                        <Link to="/register" className="text-sm text-blue-600 hover:text-blue-500">
                            Don't have an account? Register here.
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;
