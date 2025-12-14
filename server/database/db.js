const mongoose = require('mongoose');

const Connection = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/Details', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Database connected successfully');
    } catch (error) {
        console.log('Error while connecting to the database', error.message);
        console.log('Server will continue without database connection');
        // Don't throw error - let server start without DB
    }
};

module.exports = Connection;