import axios from "axios";
import base64 from base-64;
import dotenv from 'dotenv';              // Used to load environment variables from a .env file
dotenv.config({ path: '.env'});           // Populate dotenv with environment data from .env file

// Your WordPress username and password
const username = process.env.WP_UserID;
const password = process.env.WP_KEY;
const wpURL = process.env.WP_URL;

console.log(username, password, wpURL);

// Set up the Axios headers
const axiosConfig = {
    headers: {
        Authorization: "Basic " + Buffer.from(`${username}:${password}`).toString('base64'),
            "Content-Type": "application/json",
    }
};

// The API endpoint
const apiUrl = wpURL + '/wp-json/elementor/v1/form-submissions';

// Making the API call
axios.get(apiUrl, axiosConfig)
    .then(response => {
        console.log('Data:', response.data);
    })
    .catch(error => {
        console.error('Error:', error);
    });
