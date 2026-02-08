const requireSuperAdmin = (req, res, next) => {
    if (req.user && req.user.user.role === 'superadmin') {
        next();
    } else {
        res.status(403).json({ message: 'Access denied. Super Admin privileges required.' });
    }
};

module.exports = requireSuperAdmin;
