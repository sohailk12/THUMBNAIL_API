const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
    originalname: String,
    filename: String,
    path: String,
    thumbnailPath: String,
    mimeType: String,
    additionalData: mongoose.Schema.Types.Mixed
});

const File = new mongoose.model('File', fileSchema);

module.exports = File;
