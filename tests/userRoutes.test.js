require('dotenv').config();
const request = require('supertest');
const app = require('../app.js'); // Assuming your app is defined in app.js
const EmailTracking = require('../src/models/email_tracking.js');

const username = process.env.DB_USER;
const password = process.env.DB_PASSWORD;

const authString = `${username}:${password}`;
const base64AuthString = Buffer.from(authString).toString('base64');

global.BASE64_ENCODED_AUTH_STRING = base64AuthString;

// Outside of your individual test cases but inside the describe block
let userCredentials = null;
jest.setTimeout(60000); 
describe('User routes integration tests', () => {
    // Test Case 1 ///
  it('should create a new account and validate it exists', async () => {
    const userData = {
      username: 'pooja@example.com',
      password: 'password',
      first_name: 'Pooja',
      last_name: 'Kannan'
    };

    // Make a POST request to create a new user
    const createResponse = await request(app)
      .post('/v1/user')
      .send(userData);

    expect(createResponse.status).toBe(201);
    
   const emailTracking = await EmailTracking.findOne({
    where: { username: userData.username }});
    const verifyResponse = await request(app)
    .get(`/v1/user/verify?token=${emailTracking.verification_token}`);
    expect(verifyResponse.status).toBe(200);

  


    // Set user credentials to be used in the next test
    userCredentials = {
      username: userData.username,
      password: userData.password,
    };
     
    // Make a GET request to validate the new user
    const getAuthString = Buffer.from(`${userData.username}:${userData.password}`).toString('base64');

    const getResponse = await request(app)
      .get('/v1/user/self')
      .set('Authorization', `Basic ${getAuthString}`);

    expect(getResponse.status).toBe(200);
    expect(getResponse.body).toMatchObject({
      username: userData.username,
      first_name: userData.first_name,
      last_name: userData.last_name
    });
  });


// Test Case 2 ///
  it('should update an existing account and validate it was updated', async () => {
    // Check if the userCredentials were set by the previous test
    expect(userCredentials).not.toBeNull();

    const updatedUserData = {
      first_name: 'Noumaan',
      last_name: 'Ahmed',
      password: 'newpassword' // Assume this is the new password
    };

    // Encode the updated credentials for authentication
    const updateAuthString = Buffer.from(`${userCredentials.username}:${userCredentials.password}`).toString('base64');


    // Make a PUT request to update the user
    const response = await request(app)
      .put('/v1/user/self')
      .set('Authorization', `Basic ${updateAuthString}`)
      .send(updatedUserData);

    expect(response.status).toBe(204);



    // Set user credentials to be used in the next test
   const newUserCredentials = {
        username: userCredentials.username,
        password: updatedUserData.password,
      };

      const newUpdateAuthString = Buffer.from(`${newUserCredentials.username}:${newUserCredentials.password}`).toString('base64');



// After update, make a GET request to validate the updated user
const getUpdatedResponse = await request(app)
  .get('/v1/user/self')
  .set('Authorization', `Basic ${newUpdateAuthString}`);

expect(getUpdatedResponse.status).toBe(200);
expect(getUpdatedResponse.body).toMatchObject({
  first_name: updatedUserData.first_name,
  last_name: updatedUserData.last_name,
  username:userCredentials.username,
  
  // Add more properties as needed to match the updated user data
});
});


  });

 