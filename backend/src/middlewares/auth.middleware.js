export const authenticateUser = (req, res, next) => {
    // Basic JWT verification logic placeholder
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    try {
        // In a real app: const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // req.user = decoded;

        // Mock verification
        if (token === 'mock-invalid-token') throw new Error('Invalid token');

        req.user = { id: '123e4567-e89b-12d3-a456-426614174002', role: 'STUDENT' };
        next();
    } catch (error) {
        res.status(400).json({ error: 'Invalid token.' });
    }
};

export const authorizeAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }
    next();
};
