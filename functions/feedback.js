// pages/api/submitForm.js
const sanityClient = require('@sanity/client');

const client = sanityClient({
  projectId: process.env.SANITY_PROJECT_ID,
  dataset: process.env.SANITY_DATASET,
  token: process.env.SANITY_WRITE_TOKEN,
  useCdn: true, // Set to true for production
});

exports.handler = async function (event, context, callback) {
  if (event.httpMethod !== 'POST') {
    return callback(null, {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method Not Allowed' }),
    });
  }

  const { name, email, message } = JSON.parse(event.body);

  try {
    // Use the Sanity client to write data to Sanity CMS
    const result = await client.create({
      _type: 'comment', // Replace with your Sanity document type\
      _id: 'drafts.',
      name,
      email,
      message,
    });

    console.log('Data written to Sanity CMS:', result);

    return callback(null, {
      statusCode: 200,
      body: JSON.stringify({ message: 'Form submitted successfully!' }),
    });
  } catch (error) {
    console.error('Error writing data to Sanity CMS:', error);
    return callback(null, {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error' }),
    });
  }
};