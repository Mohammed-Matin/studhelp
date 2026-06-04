import { z } from 'zod';

export const loginSchema = z.object({
  identifier: z.string().min(1, 'Username or Email is required'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
});

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_FILE_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];

export const registerSchema = z.object({
  username: z.string().min(1, 'Username is required').max(50, 'Username cannot exceed 50 characters'),
  full_name: z.string().min(1, 'Full name is required').max(150, 'Full name cannot exceed 150 characters'),
  branch: z.string().min(1, 'Branch is required').max(100, 'Branch cannot exceed 100 characters'),
  degree: z.enum(['BTECH', 'MTECH', 'PHD', 'MSC'], { errorMap: () => ({ message: 'Invalid degree type' }) }),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER'], { errorMap: () => ({ message: 'Invalid gender type' }) }),
  admission_no: z.string().min(1, 'Admission number is required').max(20, 'Admission number cannot exceed 20 characters'),
  semester: z.number().int().min(1, 'Semester must be between 1 and 8').max(8, 'Semester must be between 1 and 8'),
  mobile_no: z.string().regex(/^[0-9]{10,15}$/, 'Invalid mobile number format'),
  svnit_email: z.string().email('Invalid email address').endsWith('@svnit.ac.in', 'Email must end with @svnit.ac.in'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  bonafide_file: z.any()
    .refine((files) => files?.length === 1, 'Bonafide file is required.')
    .refine((files) => files?.[0]?.size <= MAX_FILE_SIZE, `Max file size is 5MB.`)
    .refine(
      (files) => ACCEPTED_FILE_TYPES.includes(files?.[0]?.type),
      'Only .pdf, .png, .jpg and .jpeg formats are supported.'
    ),
});
