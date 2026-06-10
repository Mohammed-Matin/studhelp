import { useState } from "react";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, Link } from 'react-router-dom';
import { registerSchema } from '../validators/authValidators';
import axiosInstance from '../api/axiosInstance';
import InputField from '../components/InputField';
import FilePicker from '../components/FilePicker';
import FormError from '../components/FormError';
import ThemeToggle from '../components/ThemeToggle';
import ThreeBackground from '../components/ThreeBackground';
import CustomSelect from '../components/CustomSelect';
import NumberInput from '../components/NumberInput';

const Register = () => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(registerSchema)
  });
  const [globalError, setGlobalError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    setIsLoading(true);
    setGlobalError('');
    try {
      const formData = new FormData();
      Object.keys(data).forEach(key => {
        if (key === 'bonafide_file') {
          formData.append(key, data[key][0]);
        } else {
          formData.append(key, data[key]);
        }
      });

      await axiosInstance.post('/user/register', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      navigate('/login', { state: { registered: true } });
    } catch (error) {
      console.log('Registration error response:', error.response?.data);
      setGlobalError(error.response?.data?.error || error.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-theme p-4 relative">
      <ThreeBackground intensity={0.7} />
      <div className="absolute top-5 right-5 z-20">
        <ThemeToggle />
      </div>
      <div className="max-w-4xl w-full glass-card rounded-2xl p-8 glow-border relative z-10 animate-fade-up">
        <div className="text-center mb-8">
          <h2 className="font-display text-2xl font-bold text-theme">Student Registration</h2>
          <p className="text-sm text-theme-muted mt-2">Create your account to get started</p>
        </div>

        {globalError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <FormError message={globalError} />
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <InputField
              id="username"
              label="Username"
              placeholder="johndoe"
              error={errors.username}
              {...register('username')}
            />

            <InputField
              id="full_name"
              label="Full Name"
              placeholder="John Doe"
              error={errors.full_name}
              {...register('full_name')}
            />

            <InputField
              id="svnit_email"
              label="SVNIT Email"
              type="email"
              placeholder="john@svnit.ac.in"
              error={errors.svnit_email}
              {...register('svnit_email')}
            />

            <div className="flex flex-col gap-1 w-full">
              <label htmlFor="degree" className="text-sm font-medium text-theme-muted">Degree</label>
              <CustomSelect
                id="degree"
                placeholder="Select Degree"
                options={[
                  { value: '', label: 'Select Degree' },
                  { value: 'BTECH', label: 'B.Tech' },
                  { value: 'MTECH', label: 'M.Tech' },
                  { value: 'PHD', label: 'Ph.D' },
                  { value: 'MSC', label: 'M.Sc' }
                ]}
                className={errors.degree ? '!border-red-500 !bg-red-500/10' : ''}
                {...register('degree')}
              />
              {errors.degree && <FormError message={errors.degree.message} />}
            </div>

            <InputField
              id="branch"
              label="Branch"
              placeholder="Computer Engineering"
              error={errors.branch}
              {...register('branch')}
            />

            <div className="flex flex-col gap-1 w-full">
              <label htmlFor="semester" className="text-sm font-medium text-theme-muted">Semester</label>
              <NumberInput
                id="semester"
                min="1"
                max="8"
                className={errors.semester ? '[&>input]:!border-red-500 [&>input]:!bg-red-500/10' : ''}
                {...register('semester', { valueAsNumber: true })}
              />
              {errors.semester && <FormError message={errors.semester.message} />}
            </div>

            <InputField
              id="admission_no"
              label="Admission Number"
              placeholder="U28CSXXX"
              error={errors.admission_no}
              {...register('admission_no')}
            />

            <InputField
              id="mobile_no"
              label="Mobile Number"
              placeholder="1234567890"
              error={errors.mobile_no}
              {...register('mobile_no')}
            />

            <div className="flex flex-col gap-1 w-full">
              <label htmlFor="gender" className="text-sm font-medium text-theme-muted">Gender</label>
              <CustomSelect
                id="gender"
                placeholder="Select Gender"
                options={[
                  { value: '', label: 'Select Gender' },
                  { value: 'MALE', label: 'Male' },
                  { value: 'FEMALE', label: 'Female' },
                  { value: 'OTHER', label: 'Other' }
                ]}
                className={errors.gender ? '!border-red-500 !bg-red-500/10' : ''}
                {...register('gender')}
              />
              {errors.gender && <FormError message={errors.gender.message} />}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField
              id="password"
              label="Password"
              type="password"
              placeholder="Enter your password"
              error={errors.password}
              {...register('password')}
            />

            <FilePicker
              id="bonafide_file"
              label="Bonafide Certificate (PDF/PNG/JPG max 5MB)"
              accept=".pdf,.png,.jpg,.jpeg"
              error={errors.bonafide_file}
              {...register('bonafide_file')}
            />
          </div>

          <div className="flex justify-center mt-8">
            <button type="submit" disabled={isLoading} className="btn-primary w-full md:w-1/2 disabled:opacity-50">
              {isLoading ? 'Registering...' : 'Register'}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center text-sm">
          <span className="text-theme-muted">Already have an account? </span>
          <Link to="/login" className="text-purple-400 hover:text-purple-300 font-medium">
            Sign in here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
