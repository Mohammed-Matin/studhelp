import { z } from 'zod';

const clubRoleEnum = z.enum([
    'CORE_COMMITTEE',
    'EXECUTIVE',
    'TECHNICAL',
    'DESIGN',
    'PUBLICITY',
    'ADMINISTRATIVE_SPONSORS',
    'CUSTOM',
]);

export const createClubSchema = z.object({
    name: z.string().min(1, 'Club name is required').max(255, 'Name cannot exceed 255 characters'),
    description: z.string().max(5000, 'Description too long').optional(),
});

export const updateClubSchema = z.object({
    name: z.string().min(1).max(255).optional(),
    description: z.string().max(5000).optional(),
    logo_url: z.string().url('Invalid logo URL').optional().or(z.literal('')),
    cover_url: z.string().url('Invalid cover URL').optional().or(z.literal('')),
});

export const joinRequestSchema = z.object({
    message: z.string().max(1000, 'Message too long').optional(),
    requested_role: clubRoleEnum.optional(),
});

export const addMemberSchema = z.object({
    user_id: z.string().uuid('Invalid user ID'),
    role_tag: clubRoleEnum.optional(),
});

export const updateMemberRoleSchema = z.object({
    role_tag: clubRoleEnum,
});

export const followerMessageSchema = z.object({
    message: z.string().min(1, 'Message is required').max(2000, 'Message too long'),
});

export const budgetTransactionSchema = z.object({
    type: z.enum(['INCOME', 'EXPENSE']),
    category: z.string().min(1, 'Category is required').max(50),
    amount: z.coerce.number().positive('Amount must be positive'),
    description: z.string().max(500).optional(),
});

export function validateBody(schema) {
    return (req, res, next) => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            return res.status(422).json({
                error: 'Validation failed',
                details: result.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
            });
        }
        req.body = result.data;
        next();
    };
}
