const mongoose = require('mongoose');

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    console.error('FATAL: MONGO_URI environment variable is not set.');
    console.error('Please add MONGO_URI to your Render environment variables.');
    process.exit(1);
  }

  const MAX_RETRIES = 5;
  let retries = 0;

  // Connection options — required for stable Atlas connections on Render
  const mongoOptions = {
    serverSelectionTimeoutMS: 30000, // 30s — Render DNS can be slow
    connectTimeoutMS: 30000,
    socketTimeoutMS: 45000,
    tls: true,                      // enforce TLS for Atlas
    retryWrites: true,
    w: 'majority',
    maxPoolSize: 10,
  };

  while (retries < MAX_RETRIES) {
    try {
      const conn = await mongoose.connect(process.env.MONGO_URI, mongoOptions);
      console.log(`MongoDB Connected: ${conn.connection.host}`);
      return;
    } catch (error) {
      retries++;
      console.error(`Error connecting to MongoDB (attempt ${retries}/${MAX_RETRIES}): ${error.message}`);
      if (retries >= MAX_RETRIES) {
        console.error('Max retries reached. Exiting.');
        process.exit(1);
      }
      // Wait 5 seconds before retrying (give DNS time to resolve)
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
};

module.exports = connectDB;
