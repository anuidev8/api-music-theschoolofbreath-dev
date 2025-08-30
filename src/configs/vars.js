//TODO: cambiar a variables de entorno
module.exports = {
    port: process.env.PORT || 8085,
    allowedOrigins: ["*"],
    mongoUri: process.env.NODE_ENV == 'production' ? process.env.MONGO_URI_DEV : process.env.MONGO_URI_DEV,
    jwtSecret: process.env.JWT_SECRET || '5up3r53cr3tk3y',
    resendKey: process.env.ROSSI_KEY,
    sendEmail: process.env.SEND_EMAIL,
    receiveEmail: process.env.RECEIVE_EMAIL,
    AWS: {
        awsId: process.env.AWS_ID,
        awsSecret: process.env.AWS_SECRET,
        awsBucketName: process.env.AWS_BUCKET_NAME
    },
    STRIPE:{
        secret: process.env.STRIPE_SECRET_KEY,
        webhookSecret: process.env.WEB_HOOK_KEY
    },
    GROQ_API_KEY: process.env.GROQ_API_KEY,
    SMTP: {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: process.env.SMTP_PORT || 587,
        secure: process.env.SMTP_SECURE === 'true' || false,
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
}