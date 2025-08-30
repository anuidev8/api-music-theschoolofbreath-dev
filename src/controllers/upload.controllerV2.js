const multer = require('multer');
const {GridFsStorage} = require('multer-gridfs-storage');
const Grid = require('gridfs-stream');
const Music = require("../models/music.model");
const { mongoUri } = require('../configs/vars');
const crypto = require('crypto');
const path = require('path');
// Create storage engine
/* const storage = new GridFsStorage({
    url: mongoUri,
    file: (req, file) => {
      return new Promise((resolve, reject) => {
        crypto.randomBytes(16, (err, buf) => {
          if (err) {
            return reject(err);
          }
          const filename = buf.toString('hex') + path.extname(file.originalname);
          const fileInfo = {
            filename: filename,
            bucketName: file.mimetype.startsWith('audio') ? 'audioUploads' : 'imageUploads'
          };
          resolve(fileInfo);
        });
      });
    }
  }); */
 /*  exports.upload = multer({ storage }); */


  const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { log } = require('console');


cloudinary.config({ 
  cloud_name: 'dnmjmjdsj', 
  api_key: '253432229145898', 
  api_secret: 'uNpeHJJ1poJH_lJP8ry_uEgnDaM'
});
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'MyApp',
        format: async (req, file) => {
            if (file.mimetype.startsWith('image/')) {
                return 'png';
            } else if (file.mimetype.startsWith('audio/')) {
                return 'mp3';
            }
        },
        public_id: (req, file) => file.fieldname + '_' + Date.now(),
    },
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('audio/')) {
        cb(null, true);
    } else {
        cb(new Error('Not an image or audio file!'), false);
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter
}).fields([{ name: 'imageFile', maxCount: 1 }, { name: 'audioFile', maxCount: 1 }]);




  exports.uploadFile = async (req, res, next) => {
    try {

        upload(req, res, function (err) {
            if (err instanceof multer.MulterError) {
                // A Multer error occurred when uploading.
                return res.status(500).json({ error: err.message });
            } else if (err) {
                // An unknown error occurred when uploading.
                return res.status(500).json({ error: err.message });
            }
    
            // Everything went fine.
            // Files are available in req.files
            let response = {};
            if (req.files['imageFile']) {
                response.imageUrl = req.files['imageFile'][0].path;
            }
            if (req.files['audioFile']) {
                response.audioUrl = req.files['audioFile'][0].path;
            }
    
            res.json(response);
        });
    } catch (error) {
      next(error);
    }
  };



  exports.uploadFileByCloud = async (req, res, next) => {
    try {
        upload(req, res, function (err) {
            if (err instanceof multer.MulterError) {
                // A Multer error occurred when uploading.
                return res.status(500).json({ error: err.message });
            } else if (err) {
                // An unknown error occurred when uploading.
                return res.status(500).json({ error: err.message });
            }
    
            // Everything went fine.
            // Files are available in req.files
            let response = {};
            if (req.files['imageFile']) {
                response.imageUrl = req.files['imageFile'][0].path;
            }
            if (req.files['audioFile']) {
                response.audioUrl = req.files['audioFile'][0].path;
            }
    
            res.json(response);
        });
       /*  const newMusic = new Music({
            name: req.body.name,
            description:req.body.description,
            audioFilename: req.files['audioFile'][0].path,
            imageFilename: req.files['imageFile'][0].path
          });
        
          newMusic.save((err, music) => {
            if (err) return res.status(500).send(err);
            res.status(201).send({ music: music, message: 'Audio and image files uploaded successfully' });
          }); */
    } catch (error) {
      next(error);
    }
  };

  exports.deleteMusicFile = async (req, res) => {
    try {
      // Find the music item by id
      const music = await Music.findById(req.params.id);
      if (!music) {
        return res.status(404).json({ message: 'Music item not found' });
      }
  
      // Delete the audio file
      await gfs.files.deleteOne({ filename: music.audioFilename });
  
      // Delete the image file, if it exists
      if (music.imageFilename) {
        await gfs.files.deleteOne({ filename: music.imageFilename });
      }
  
      // Delete the music item from the collection
      await Music.findByIdAndRemove(req.params.id);
  
      res.status(200).json({ message: 'Music item and associated files deleted successfully' });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }