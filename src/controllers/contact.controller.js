const axios = require("axios");
exports.getContacts = async (req, res, next) => {
    try {
      const {email} = req.query
      const response = await axios.get(`https://api.systeme.io/api/contacts?email=${email}`, {
        headers: {
          'x-api-key': process.env.API_SYSTEME_KEY // Replace with the actual API key
        }
      });
      
      return res.status(200).json({ info: "OK", success: true, data: response.data });
    } catch (error) {
      next(error);
    }
  };

  exports.getAllContacts = async (req, res, next) => {
    try {
      const response = await axios.get(`https://api.systeme.io/api/contacts`, {
        headers: {
          'x-api-key': process.env.API_SYSTEME_KEY // Replace with the actual API key
        }
      });
      
    

      return res.status(200).json(response.data);
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  };

  exports.getSubscriptions = async (req, res, next) => {
    try {
      const { contactId } = req.params;
     
      const response = await axios.get(`https://api.systeme.io/api/payment/subscriptions?contact=${contactId}`,
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.API_SYSTEME_KEY
        }
      });
  
    
  
      return res.status(200).json(response.data);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      res.status(500).json({ error: 'Failed to fetch subscriptions' });
    }
  };

  