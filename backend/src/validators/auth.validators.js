import { z } from 'zod';

export const registerSchema = z.object({
    username: z.string().min(1, 'Username is required').max(50, 'Username cannot exceed 50 characters'),
    full_name: z.string().min(1, 'Full name is required').max(150, 'Full name cannot exceed 150 characters'),
    svnit_email: z.string().email('Invalid email address').endsWith('@svnit.ac.in', 'Email must end with @svnit.ac.in'),
    branch: z.string().min(1, 'Branch is required').max(100, 'Branch cannot exceed 100 characters'),
    semester: z.coerce.number().int().min(1, 'Semester must be between 1 and 8').max(8, 'Semester must be between 1 and 8'),
    degree: z.enum(['BTECH', 'MTECH', 'PHD', 'MSC'], { errorMap: () => ({ message: 'Invalid degree type' }) }),
    gender: z.enum(['MALE', 'FEMALE', 'OTHER'], { errorMap: () => ({ message: 'Invalid gender type' }) }),
    admission_no: z.string().min(1, 'Admission number is required').max(20, 'Admission number cannot exceed 20 characters'),
    mobile_no: z.string().regex(/^[0-9]{10,15}$/, 'Invalid mobile number format'),
    password: z.string().min(8, 'Password must be at least 8 characters long'),
});

export const loginSchema = z.object({
    identifier: z.string().min(1, 'Username or Email is required'),
    password: z.string().min(1, 'Password is required'),
});
