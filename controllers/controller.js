const fs = require('fs');
const fsp = require('fs').promises;
const sharp = require('sharp');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const ffprobePath = require('ffprobe-static').path;
const path = require('path');
const pdfThumbnail = require('pdf-thumbnail');
const File = require('../models/File.js');

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

const createDirectory = async (dir) => {
    try {
        await fsp.mkdir(dir, { recursive: true });
        console.log(`Directory created: ${dir}`);
    } catch (error) {
        if (error.code !== 'EEXIST') {
            console.error(`Error creating directory: ${dir}`, error);
        }
    }
};

(async () => {
    await createDirectory('uploads/files');
    await createDirectory('uploads/thumbnails');
})();

module.exports ={
    uploadFile: async (req,res)=>{
        try {
            const file = req.file;
            if (!file) {
                return res.status(400).send('No file uploaded');
            }
    
            const mimeType = file.mimetype;
            let thumbnailPath = '';
    
            if (mimeType.startsWith('image/')) {
                // Process image using sharp
                thumbnailPath = `uploads/thumbnails/${Date.now()}-thumbnail${path.extname(file.originalname)}`;
                await sharp(file.path)
                    .resize(200) // Resize the image to 200px width, maintaining aspect ratio
                    .toFile(thumbnailPath);
            } else if (mimeType.startsWith('video/')) {
                // Process video using ffmpeg
                thumbnailPath = `uploads/thumbnails/${Date.now()}-thumbnail.png`;
                await new Promise((resolve, reject) => {
                    ffmpeg(file.path)
                        .on('end', resolve)
                        .on('error', reject)
                        .screenshots({
                            count: 1,
                            folder: path.dirname(thumbnailPath),
                            filename: path.basename(thumbnailPath),
                            size: '200x?'
                        });
                });
            } else if (mimeType === 'application/pdf') {
                // Process PDF using pdf-thumbnail
                thumbnailPath = `uploads/thumbnails/${Date.now()}-thumbnail.png`;
                const pdfBuffer = await fsp.readFile(file.path);
                const thumbnailBuffer = await pdfThumbnail(pdfBuffer, { resize: { width: 200, height: 200 } });
                await fsp.writeFile(thumbnailPath, thumbnailBuffer);
            } 
             else {
                return res.status(400).send('Unsupported file type');
            }
    
            // Save file data to MongoDB
            const newFile = new File({
                originalname: file.originalname,
                filename: file.filename,
                path: file.path,
                thumbnailPath: thumbnailPath,
                mimeType: file.mimetype,
                additionalData: req.body
            });
    
            await newFile.save();
    
            res.json({
                message: 'File and thumbnail uploaded successfully!',
                file: {
                    originalname: file.originalname,
                    filename: file.filename,
                    path: file.path
                },
                thumbnail: {
                    path: thumbnailPath
                },
                additionalData: req.body
            });
        } catch (error) {
            console.error('Error uploading file:', error);
            res.status(500).send('Error uploading file');
        }
    },
    downloadFile: async (req,res)=>{
        try {
            const filename = req.params.filename;
            const file = await File.findOne({ filename: filename });
            if (!file) {
                return res.status(404).send('File not found');
            }
    
            fs.stat(file.path, (err, stats) => {
                if (err) {
                    console.error('File not found:', err);
                    return res.status(404).send('File not found');
                }
                res.setHeader('Content-Type', `${file.mimeType}`);
                res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
                const fileStream = fs.createReadStream(file.path);
                console.log(fileStream);
                fileStream.pipe(res);
            });
        } catch (error) {
            console.error('Error downloading file:', error);
            res.status(500).send('Error downloading file');
        }
    },
}
