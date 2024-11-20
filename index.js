const express = require('express');
const router = require('./routes/route.js');
const cors = require('cors');
const connectDB = require('./config/db.js');

const app = express();

app.use(express.json());

app.use(cors());
connectDB();

app.use('/',router);

app.listen(3000,()=>{
    console.log('Server started on PORT: 3000');
})

