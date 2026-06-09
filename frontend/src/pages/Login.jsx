import { useState } from "react";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { loginSchema } from '../validators/authValidators';
import axiosInstance from '../api/axiosInstance';
import { setToken, setUser } from '../utils/auth';
import InputField from '../components/InputField';
import Button from '../components/Button';
import FormError from '../components/FormError';

const Login = () => {
    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: zodResolver(loginSchema)
    });
  const [globalError, setGlobalError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const registered = location.state?.registered;

    const onSubmit = async (data) => {
        setIsLoading(true);
        setGlobalError('');
        try {
            const response = await axiosInstance.post('/user/login', data);
            const { token, role, user } = response.data;

            setToken(token);
            setUser(user);

            if (role === 'ADMIN') {
                navigate('/admin/dashboard');
            } else {
                navigate('/student/dashboard');
            }
        } catch (error) {
            setGlobalError(error.response?.data?.error || 'Login failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="max-w-md w-full bg-white rounded-lg shadow p-8">
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900">Welcome Back</h2>
                    <p className="text-sm text-gray-600 mt-2">Sign in to your account</p>
                </div>

        {registered && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-green-700 text-sm">Registration successful! Please sign in after an admin verifies your account.</p>
          </div>
        )}
        {globalError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <FormError message={globalError} />
          </div>
        )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <InputField
                        id="identifier"
                        label="Username or Email"
                        placeholder="Enter your username or email"
                        error={errors.identifier}
                        {...register('identifier')}
                    />

                    <InputField
                        id="password"
                        label="Password"
                        type="password"
                        placeholder="Enter your password"
                        error={errors.password}
                        {...register('password')}
                    />

                    <Button type="submit" isLoading={isLoading} className="w-full">
                        Sign In
                    </Button>
                </form>

                <div className="mt-6 text-center text-sm">
                    <span className="text-gray-600">Don't have an account? </span>
                    <Link to="/register" className="text-blue-600 hover:text-blue-500 font-medium">
                        Register here
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Login;
