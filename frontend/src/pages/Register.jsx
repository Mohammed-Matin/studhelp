import { useState } from "react";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, Link } from 'react-router-dom';
import { registerSchema } from '../validators/authValidators';
import axiosInstance from '../api/axiosInstance';
import InputField from '../components/InputField';
import FilePicker from '../components/FilePicker';
import Button from '../components/Button';
import FormError from '../components/FormError';

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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-4xl w-full bg-white rounded-lg shadow p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Student Registration</h2>
          <p className="text-sm text-gray-600 mt-2">Create your account to get started</p>
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
              <label htmlFor="degree" className="text-sm font-medium text-gray-700">Degree</label>
              <select
                id="degree"
                className={`px-4 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                  errors.degree ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                }`}
                {...register('degree')}
              >
                <option value="">Select Degree</option>
                <option value="BTECH">B.Tech</option>
                <option value="MTECH">M.Tech</option>
                <option value="PHD">Ph.D</option>
                <option value="MSC">M.Sc</option>
              </select>
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
              <label htmlFor="semester" className="text-sm font-medium text-gray-700">Semester</label>
              <input
                id="semester"
                type="number"
                min="1"
                max="8"
                className={`px-4 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                  errors.semester ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                }`}
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
              <label htmlFor="gender" className="text-sm font-medium text-gray-700">Gender</label>
              <select
                id="gender"
                className={`px-4 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                  errors.gender ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                }`}
                {...register('gender')}
              >
                <option value="">Select Gender</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
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
            <Button type="submit" isLoading={isLoading} className="w-full md:w-1/2">
              Register
            </Button>
          </div>
        </form>

        <div className="mt-6 text-center text-sm">
          <span className="text-gray-600">Already have an account? </span>
          <Link to="/login" className="text-blue-600 hover:text-blue-500 font-medium">
            Sign in here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
