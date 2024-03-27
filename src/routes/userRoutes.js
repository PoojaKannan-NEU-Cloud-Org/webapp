const express = require('express');
const User = require('../models/user');
const bcrypt = require('bcrypt');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const logger = require('../logger');


const EmailTracking = require('../models/email_tracking');

//PUBSUB_FN
// Import the Pub/Sub client library
const { PubSub } = require('@google-cloud/pubsub');

// Create a Pub/Sub client
const pubSubClient = new PubSub();

// Function to publish a message to a Pub/Sub topic
async function publishMessage(userData, topicName) {
    try {
      // Retrieve the Pub/Sub topic
      const topic = pubSubClient.topic(topicName);
  
      // Convert message data to JSON string
      const dataBuffer = Buffer.from(JSON.stringify(userData));
  
      // Publish the message
      const messageId = await topic.publish(dataBuffer);
      console.log(`Message ${messageId} published.`);
      return messageId;
    } catch(error) {
     console.error('Error publishing message:', error);
     throw error;
    }
}
//Token generation
function generateToken(length) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    token += characters.charAt(randomIndex);
  }

  return token;
}

// Helper function to remove password from the user object before sending the response
function getUserDataWithoutPassword(user) {
  const { password, ...userDataWithoutPassword } = user.dataValues;
  return userDataWithoutPassword;
}



// Route for verifying user email
router.get('/verify', async (req, res) => {
  try {
    const verificationToken = req.query.token;
   console.log(verificationToken);
    // Find the user with the verification token
    const user = await EmailTracking.findOne({
      where: { verification_token: verificationToken }
    });

    if (!user) {
      logger.error('User not found for verification token:', verificationToken);
      return res.status(404).send('User not found for verification token');
    }
    // Check if verification token has expired
    const currentTime = new Date();
    // Calculate the expiration time (2 minutes from now)
    const expirationTime = new Date(user.timestamp.getTime() + (2 * 60 * 1000)); // 2 minutes * 60 seconds/minute * 1000 milliseconds/second

    // Compare the expiration time with the current time
    const isExpired = expirationTime <= currentTime
    if (isExpired) {
      // console.log(tokenexpire);
      logger.error('Verification token has expired:', verificationToken);

      return res.status(400).send('Verification token has expired');
    }

    // If user is found and verification token is valid, update their account to mark it as verified
    user.is_verified = true;
    await user.save();

    logger.debug('User email verified:', user.username);
    return res.status(200).send('Email verified successfully');
  } catch(error) {
    logger.error('Error verifying user email:', error);
    console.log(error);
    return res.status(500).send('Internal server error');
  }
});


// Route for creating a new user
router.post('/', async (req, res) => {
  try {
    // Check if user with provided email already exists
    const existingUser = await User.findOne({ where: { username: req.body.username } });
    if (existingUser) {
      const emailTracking = await EmailTracking.findOne({ where: { username: req.body.username } });
      if(emailTracking != null && !emailTracking.is_verified) {
        // Check if user is not verified
        // Generate a new token (you need to implement this function)
        // const newUser = await User.create({
        //   username: req.body.username,
        //   password: req.body.password,
        //   first_name: req.body.first_name,
        //   last_name: req.body.last_name,
        // });
        const newVerificationToken = generateToken(16);
        try{
        await publishMessage({
          email: existingUser.username, // Assuming email is the username
          verificationToken: newVerificationToken,
        }, 'verify_email');}
        catch(error){}

        // Optionally, update the user record with the new verification token
        await emailTracking.update({ verification_token: newVerificationToken });
        logger.warn('User exists but is not verified. A new verification token has been sent.');
        return res.status(200).end();
      }
      logger.warn('User exists');
      return res.status(400).end();
    }
    const verificationToken = generateToken(16);
    // Create new user with hashed password
    const newUser = await User.create({
      username: req.body.username,
      password: req.body.password,
      first_name: req.body.first_name,
      last_name: req.body.last_name,
    });

    // Publish message for email verification
    try{
    await publishMessage({
      email: newUser.username,
      verificationToken: verificationToken,
    }, 'verify_email');}
    catch(error){}

    // Track the email sent in EmailTracking table

    await EmailTracking.create({
      username: newUser.username,
      is_verified: false,
      verification_token: verificationToken,
    });
    // Send back the new user data without the password
    res.status(201).json(getUserDataWithoutPassword(newUser));
    logger.debug('User created successfully');
  } catch(error) {
    console.log(error);
    logger.error('Error creating user:', error);
    res.status(500).end();
  }
});

// Middleware to check if user is verified before allowing access to '/v1/self'
const checkVerification = async (req, res, next) => {
  try {
    // Assuming the email is attached to the request by the auth middleware
    const emailTracking = await EmailTracking.findOne({ where: { username: req.auth.user } });
    if (!emailTracking || !emailTracking.is_verified) {
      logger.error('User not verified or not found');
      return res.status(403).send('Access forbidden. User not verified.');
    }
    next();
  } catch(error) {
    logger.error('Error checking user verification:', error);
    return res.status(500).send('Internal server error');
  }
};
// Route for updating user information
router.put('/self', authMiddleware, checkVerification, async (req, res) => {
  try {
    // Assuming the email is attached to the request by the auth middleware
    const user = await User.findOne({ where: { username: req.auth.user } });
    if (!user) {
      logger.error('User not found');
      return res.status(404).end();
    }

    // Check if the submitted content is the same as the existing content
    if (user.first_name === req.body.first_name &&
      user.last_name === req.body.last_name &&
      await bcrypt.compare(req.body.password, user.password)) {
      // If content is unchanged, return a 400 Bad Request
      logger.error('No changes to update');
      return res.status(400).end();
    }

    // Update user information (only firstName, lastName, and password)
    const updatedFields = {};
    if (user.first_name !== req.body.first_name) {
      updatedFields.first_name = req.body.first_name;
    }
    if (user.last_name !== req.body.last_name) {
      updatedFields.last_name = req.body.last_name;
    }
    if (req.body.password && !(await bcrypt.compare(req.body.password, user.password))) {
      // Only update the password if it is different
      updatedFields.password = req.body.password;
    }

    await user.update(updatedFields);

    // Send back updated user data without the password
    res.status(204).end();
    logger.debug('User data updated successfully');
  } catch(error) {
    logger.error('Error updating user:', error);
    res.status(500).end();
  }
});

// Route for getting user information
router.get('/self', authMiddleware, checkVerification, async (req, res) => {
  try {
    // Assuming the email is attached to the request by the auth middleware
    const user = await User.findOne({ where: { username: req.auth.user } });
    if (!user) {
      logger.error('User not found');
      return res.status(404).end();
    }

    // Send back the user data without the password
    res.status(200).json(getUserDataWithoutPassword(user));
    logger.debug('User data retrieved successfully');
  } catch(error) {
    logger.error('Error retrieving user data:', error);
    res.status(500).end();
  }
});

module.exports = router;
