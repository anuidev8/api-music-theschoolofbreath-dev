const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'API Documentation',
      version: '1.0.0',
      description: 'Express API Documentation',
      contact: {
        name: 'Your Name',
      },
    },
    servers: [
      {
        url: 'api-music-two.vercel.app', // Replace with your Vercel URL
      },
      {
        url: 'http://localhost:3001', // Update this to match your development or production URL
      },
    ],
  },
  apis: ['./src/controllers/*.js','./src/routes/*.js'], // Path to your route files
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

module.exports = (app) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));
};
