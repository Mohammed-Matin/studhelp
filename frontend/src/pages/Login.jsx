import { useState } from "react";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { loginSchema } from '../validators/authValidators';
import axiosInstance from '../api/axiosInstance';
import { setToken, setUser } from '../utils/auth';
import FormError from '../components/FormError';
import InputField from '../components/InputField';
import ThemeToggle from '../components/ThemeToggle';
import ThreeBackground from '../components/ThreeBackground';
import TypewriterText from '../components/TypewriterText';
import { getHeroImage } from '../utils/images';

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
            navigate(role === 'ADMIN' ? '/admin/dashboard' : '/dashboard');
        } catch (error) {
            setGlobalError(error.response?.data?.error || 'Login failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-theme relative">
            <ThreeBackground intensity={1} />
            <div className="absolute top-5 right-5 z-20">
                <ThemeToggle />
            </div>

            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden z-10">
                <img src={getHeroImage()} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" />
                <div className="absolute inset-0 hero-overlay" />
                <div className="absolute inset-0 bg-grid opacity-30" />
                <div className="relative z-10 flex flex-col justify-center p-16">
                    <p className="text-xs tracking-[0.3em] uppercase text-cyan-400 mb-4">
                        <TypewriterText text="SVNIT SURAT" speed={60} delay={300} />
                    </p>
                    <h1 className="font-display text-5xl font-bold text-theme leading-tight">
                        Where <span className="text-gradient">Innovation</span><br />Meets Community
                    </h1>
                    <p className="mt-6 text-theme-muted max-w-md">
                        Clubs, events, and campus collaboration — inspired by the spirit of techno-cultural fests like Mindbend.
                    </p>
                </div>
            </div>

            <div className="flex-1 flex items-center justify-center p-6 relative z-10">
                <div className="max-w-md w-full glass-card rounded-2xl p-8 glow-border animate-fade-up">
                    <div className="text-center mb-8">
                        <h2 className="font-display text-2xl font-bold text-theme">Welcome Back</h2>
                        <p className="text-sm text-theme-muted mt-2">Sign in to StudHelp</p>
                    </div>

                    {registered && (
                        <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                            <p className="text-emerald-300 text-sm">Registration successful! Sign in after admin verification.</p>
                        </div>
                    )}
                    {globalError && (
                        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                            <FormError message={globalError} />
                        </div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        <InputField
                            id="identifier"
                            label="Username or Email"
                            placeholder="Enter username or email"
                            error={errors.identifier}
                            {...register('identifier')}
                        />
                        <InputField
                            id="password"
                            type="password"
                            label="Password"
                            placeholder="Enter password"
                            error={errors.password}
                            {...register('password')}
                        />
                        <button type="submit" disabled={isLoading} className="btn-primary w-full disabled:opacity-50">
                            {isLoading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>

                    <div className="mt-6 text-center text-sm">
                        <span className="text-slate-500">Don&apos;t have an account? </span>
                        <Link to="/register" className="text-purple-400 hover:text-purple-300 font-medium">Register</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
