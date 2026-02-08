const requireExternalUser = (req, res, next) => {
    if (req.user && req.user.user.userType === 'external') {
        next();
    } else {
        res.status(403).json({ message: 'Access denied. External user access required.' });
    }
};

const requireInternalUser = (req, res, next) => {
    if (req.user && req.user.user.userType === 'internal') {
        next();
    } else {
        res.status(403).json({ message: 'Access denied. Internal user access required.' });
    }
};

const allowReadOnlyAccess = (req, res, next) => {
    // Allow GET requests for external users, block others
    if (req.method === 'GET') {
        next();
    } else if (req.user && req.user.user.userType === 'internal') {
        next();
    } else {
        res.status(403).json({ message: 'Access denied. Read-only access for external users.' });
    }
};

module.exports = {
    requireExternalUser,
    requireInternalUser,
    allowReadOnlyAccess
};