const supabase = require('../config/supabase');

const requireAuth = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  // Verify the token by getting the user
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return res.status(401).json({ error: 'Unauthorized', details: error?.message });
  }

  req.user = user;
  next();
};

module.exports = requireAuth;