const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect('mongodb://localhost:27017/mydatabase');
        console.log(`Connection Successfull: ${conn.connection.host}`)
    } catch (error) {
        console.log(error.message);
    }
}
module.exports = connectDB;
