const requireSuperAdmin = (req, res, next) => {
    if (req.user && req.user.user.role === 'superadmin') {
        next();
    } else {
        res.status(403).json({ message: 'Access denied. Super Admin privileges required.' });
    }
};

const requireSuperAdminOrSadmin = (req, res, next) => {
    // Allow if role is superadmin OR username is 'sadmin'
    if (req.user && (req.user.user.role === 'superadmin' || req.user.user.username === 'sadmin')) {
        next();
    } else {
        res.status(403).json({ message: 'Access denied. Super Admin or Sadmin privileges required.' });
    }
};

module.exports = { requireSuperAdmin, requireSuperAdminOrSadmin };
