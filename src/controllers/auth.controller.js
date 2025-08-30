const { Types } = require("mongoose");
const {
  clientUrl,
  img,
  BasicMatiRues,
  urlBackend,
} = require("../configs/vars");
const User = require("../models/user.model");
const bcrypt = require('bcryptjs');
const crypto = require("crypto");
const nodemailer = require('nodemailer')
const axios = require("axios");
const availableTags  = [
  { id: '1', name: 'Enrolled_Holistic Membership', },
  { id: '2', name: 'Enrolled_to_Sleep_Membership',  },
  { id: '3', name: 'Purchased_9-Day Breathwork Course' },
  { id: '4', name: 'Purchased_9-Day Meditation Course',  },
  { id: '5', name: 'Purchased_Swara_Yoga_Course',  },
  { id: '6', name: 'Purchased_9-Day Bliss Course',  },
  { id: '7', name: 'Purchased_12-Day ThirdEye Course',  }, 
 
];

const validateUserData = async (userData) => {
  const validationError = new User(userData).validateSync();
  if (!validationError) return null;

  return Object.values(validationError.errors).map(err => ({
    field: err.path,
    reason: err.message.replace(/\\|"/gi, "")
  }));
};

const findUserByEmail = async (email) => {
  return User.findOne({ email: email.toLowerCase() });
};

exports.store = async (req, res, next) => {
  try {
    const userExists = await findUserByEmail(req.body.email);
    if (userExists) return res.status(400).json({ success: false, info: "Email is already registered", data: 801 });

    const validationErrors = await validateUserData(req.body);
    if (validationErrors) return res.status(400).json({ success: false, info: "Invalid data structure", data: validationErrors });

    const newUser = new User({ ...req.body, email: req.body.email.toLowerCase() });
    const savedUser = await newUser.save();

    if (!savedUser._id) return res.status(400).json({ success: false, info: "Fatal Error, unable to store User, try later" });

    const tokenData = { type: savedUser.role === "user" ? 1 : 2, email: savedUser.email, password: req.body.password };
    const resp = await User.findAndGenerateToken(tokenData);

    if (!resp || !resp.success) return res.status(400).json({ ...resp, success: false });

    return res.status(200).json({ success: true, token: resp.token, user: resp.user });
  } catch (error) {
    next(error);
  }
};

const getFieldValue = (fields, slug) => {
  const field = fields.find(f => f.slug === slug);
  return field ? field.value : '';
};

exports.login = async (req, res, next) => {
  try {
    let em = req.body.email;
    req.body.email = em;

    // First check Systeme.io before any local validation
    try {
      const response = await axios.get(`https://api.systeme.io/api/contacts?email=${em}`, {
        headers: {
          'x-api-key': process.env.API_SYSTEME_KEY
        },
      });

      const contact = response.data?.items[0];
      if (contact) {
        // Check if user has any of the available tags
        const userTags = contact.tags.map(tag => tag.name);
        const hasValidTag = userTags.some(tag => 
          availableTags.some(availableTag => availableTag.name === tag)
        );

        if (hasValidTag) {
          // Check if user already exists in our DB
          let existingUser = await User.findOne({ email: em });
          
          if (!existingUser) {
            // Get fields from Systeme.io response
            const fullName = getFieldValue(contact.fields, 'first_name');

            // Create new user with fields from Systeme.io
            const newUser = new User({
              email: em,
              password: 'welcome123', // Will be hashed by the model
              fullName: fullName,
            });

            await newUser.save();
            // Set the password for the request
            req.body.password = 'welcome123';
          }
        }
      }
    } catch (error) {
      console.error('Systeme.io API Error:', error);
    }

    // Now try local authentication
    const resp = await User.findAndGenerateToken(req.body);
    
    if (resp === null || !resp.success) {
      return res.status(400).json({ 
        success: false, 
        info: "Credentials not found" 
      });
    }

    return res.status(200).json({ 
      success: true, 
      token: resp.token, 
      user: resp.user 
    });

  } catch (error) {
    return next(error);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const userId = req.user._id; // Assuming the user's ID is stored in req.user
    const { newPassword,token } = req.body;

    // Validate Passwords
   

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, info: "User not found" });
    }


    if (!isMatch) {
      return res.status(401).json({ success: false, info: "Current password is incorrect" });
    }

    // Hash New Password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update Password in Database
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ success: true, info: "Password updated successfully" });
  } catch (error) {
    next(error);
  }
};

// Function to generate a password reset token
exports.generateResetToken = async (req, res, next) => {
 try {
  const userEmail = req.body.email;
  const user = await User.findOne({ email: userEmail });

  if (!user) {
      return res.status(404).json({ message: "User not found" });
  }

  // Generate token
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Set token in the database with an expiration
  user.resetPasswordToken = resetToken;
  user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
  await user.save();

 
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true, // upgrade later with STARTTLS
    auth: {
      user: "theschoolofbreathai@gmail.com",
      pass: "gepo slfp eljw odcz",
    },
  });

  const resetUrl = `https://sleepappmusic.vercel.app/app/change-password/${resetToken}`;
  const mailOptions = {
      from: 'meditatewithabhi@gmail.com',
      to: user.email,
      subject: 'Password Reset',
      text: `Please click on the following link, or paste this into your browser to complete the process: ${resetUrl}`
  };

  transporter.sendMail(mailOptions, function(error, info) {
      if (error) {
          return res.status(500).json({ message: "Error sending email" });
      }
      res.status(200).json({ message: 'Email sent' });
  });
 } catch (error) {
  console.log(error);
 }
};

exports.resetPassword = async (req, res, next) => {
  const { token, newPassword } = req.body;

  const user = await User.findOne({ 
      resetPasswordToken: token, 
      resetPasswordExpires: { $gt: Date.now() } 
  });

  if (!user) {
      return res.status(400).json({ message: "Password reset token is invalid or has expired." });
  }
  // Update the password
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  user.password = hashedPassword; // make sure to hash the password if needed
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  res.status(200).json({ message: "Password has been updated." });
};










