const express = require('express');
const User = require('../models/user');
const bcrypt = require('bcrypt');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const logger = require('../logger');

// Helper function to remove password from the user object before sending the response
function getUserDataWithoutPassword(user) {
  const { password, ...userDataWithoutPassword } = user.dataValues;
  return userDataWithoutPassword;
}

// Route for creating a new user
router.post('/', async (req, res) => {
  try {
    // Check if user with provided email already exists
    const existingUser = await User.findOne({ where: { username: req.body.username } });
    if (existingUser) {
      logger.warn('user exists');
      return res.status(400).end();
      
      
    }

    // Create new user with hashed password
    const newUser = await User.create({
      username: req.body.username,
      password: req.body.password,
      first_name: req.body.first_name,
      last_name: req.body.last_name,
    });

    // Send back the new user data without the password
    
    res.status(201).json(getUserDataWithoutPassword(newUser));
    logger.debug('201 user created');
   
  } catch (error) {
    
    res.status(500).end();
    logger.error("500 internal server error");
  }
});

// Route for updating user information
router.put('/self', authMiddleware, async (req, res) => {
  try {
    // Assuming the email is attached to the request by the auth middleware
    const user = await User.findOne({ where: { username: req.auth.user } });
    if (!user) {
     logger.error('404 found not');
      return res.status(404).end();
      
    }

    // Check if the submitted content is the same as the existing content
    if (user.first_name === req.body.first_name &&
        user.last_name === req.body.last_name &&
        await bcrypt.compare(req.body.password, user.password)) {
      // If content is unchanged, return a 400 Bad Request
      logger.error('400 bad request');
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
    logger.debug('204 user data changes');
    //logger.info
  } catch (error) {
   
    res.status(500).end();
    logger.error('500 internal server error');
  }
});



// Route for getting user information
router.get('/self', authMiddleware, async (req, res) => {
  try {
    // Assuming the email is attached to the request by the auth middleware
    const user = await User.findOne({ where: { username: req.auth.user } });
    if (!user) {
      logger.error('404 not found');
      return res.status(404).end();
      
    }

    // Send back the user data without the password
   logger.debug('200 ok response');
    res.status(200).json(getUserDataWithoutPassword(user));
    
  } catch (error) {
   logger.error('500 internal server error');
    res.status(500).end();
    
  }
});

module.exports = router;
