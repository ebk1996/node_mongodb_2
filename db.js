require('dotenv').config();
const { MongoClient } = require('mongodb');

async function connect() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not set in environment. Create a .env file with MONGODB_URI or set the environment variable.');
  }

  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    const db = client.db('sample_mflix');
    return { db, client };
  } catch (err) {
    console.error('Connection failed:', err);
    // Ensure client is closed on failure
    try { await client.close(); } catch (e) {}
    throw err;
  }
}

module.exports = connect;