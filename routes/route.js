const express = require('express');
const controller = require('../controllers/controller.js');
const router = express();
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/files');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

router.post('/upload',upload.single('file'),controller.uploadFile);
router.get('/download/:filename',controller.downloadFile);

module.exports = router;