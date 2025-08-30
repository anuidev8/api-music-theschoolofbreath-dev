
const API_KEY = 'yeY8FGZ8TNFhDQ3LV5c76wazrrpqOqNQ'
exports.apiKeyAuth = (req, res, next) => {
    const apiKey = req.headers['x-api-key-auth'];
  
    if (!apiKey || apiKey !== API_KEY) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or missing API key'
      });
    }
  
    next();
  };