const mongoose = require('mongoose');

/**
 * Establishes a connection to MongoDB.
 * Exits the process on failure — a broken DB connection is unrecoverable at startup.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // Mongoose 8+ no longer needs useNewUrlParser / useUnifiedTopology
    });

    console.log(`✅ MongoDB connected: ${conn.connection.host}`);

    // Surface connection events in development
    if (process.env.NODE_ENV === 'development') {
      mongoose.set('debug', false); // set true for query logging
    }
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
