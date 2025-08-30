const nodemailer = require('nodemailer');
const { sendEmail, receiveEmail, SMTP } = require("../configs/vars");

// Email reply functionality
exports.sendEmailReply = async (req, res, next) => {
  try {
    const { 
      originalMessageId, 
      to, 
      subject, 
      text, 
      smtpConfig 
    } = req.body;

    // Validate required fields
    if (!originalMessageId || !to || !subject || !text) {
      return res.status(400).json({ 
        success: false, 
        message: "Missing required fields: originalMessageId, to, subject, text" 
      });
    }

    // Use provided SMTP config or default to environment variables
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: 465,           // or 587 if using STARTTLS
      secure: true,        // true for 465, false for 587
      auth: {
        user: process.env.SMTP_USER,   // full email address
        pass: process.env.SMTP_PASS            // exact password
      }
    });
    

    const mailOptions = {
      from: smtpConfig?.from || `"meditatewithabhi" <connect@meditatewithabhi.com>`,
      to: to,
      subject: subject.startsWith('Re:') ? subject : `Re: ${subject}`,
      text: text,
      inReplyTo: originalMessageId,
      references: originalMessageId,
    
    };

    const result = await transporter.sendMail(mailOptions);

    return res.status(200).json({ 
      success: true, 
      message: "Email reply sent successfully",
      messageId: result.messageId 
    });

  } catch (error) {
    console.error('Error sending email reply:', error);
    return res.status(500).json({ 
      success: false, 
      message: "Failed to send email reply",
      error: error.message 
    });
  }
};

// Get email configuration (for frontend to know available settings)
exports.getEmailConfig = async (req, res, next) => {
  try {
    const config = {
      defaultFrom: sendEmail,
      defaultTo: receiveEmail,
      smtpHost: SMTP.host,
      smtpPort: SMTP.port,
      smtpSecure: SMTP.secure
    };

    return res.status(200).json({ 
      success: true, 
      data: config 
    });

  } catch (error) {
    console.error('Error getting email config:', error);
    return res.status(500).json({ 
      success: false, 
      message: "Failed to get email configuration",
      error: error.message 
    });
  }
}; 