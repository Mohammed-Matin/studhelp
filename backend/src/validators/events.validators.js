import { z } from 'zod';

export const createEventSchema = z.object({
    club_id: z.string().uuid('Invalid club ID'),
    title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
    description: z.string().max(10000).optional(),
    banner_url: z.string().url('Invalid banner URL').optional().or(z.literal('')),
    start_time: z.string().min(1, 'Start time is required'),
    end_time: z.string().min(1, 'End time is required'),
    participation_type: z.enum(['SOLO', 'TEAM', 'BOTH']).optional(),
    max_teams: z.coerce.number().int().positive().optional().nullable(),
    max_participants: z.coerce.number().int().positive().optional().nullable(),
}).refine(
    (data) => new Date(data.start_time) < new Date(data.end_time),
    { message: 'End time must be after start time', path: ['end_time'] }
);

export const updateEventSchema = z.object({
    title: z.string().min(1).max(255).optional(),
    description: z.string().max(10000).optional(),
    banner_url: z.string().url().optional().or(z.literal('')),
    start_time: z.string().optional(),
    end_time: z.string().optional(),
    status: z.enum(['UPCOMING', 'LIVE', 'PAST', 'POSTPONED', 'CANCELLED']).optional(),
    participation_type: z.enum(['SOLO', 'TEAM', 'BOTH']).optional(),
    max_teams: z.coerce.number().int().positive().optional().nullable(),
    max_participants: z.coerce.number().int().positive().optional().nullable(),
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
