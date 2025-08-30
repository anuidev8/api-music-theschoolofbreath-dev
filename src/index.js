require('dotenv').config()
const swaggerSetup = require('../swagger');
const app = require('./configs/server')
const PORT = process.env.PORT || 8080; 
require('./configs/database')
swaggerSetup(app);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
