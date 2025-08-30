const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const { Storage } = require('@google-cloud/storage');
const mongoose = require('mongoose');
const Music = require("../models/music.model");
const fs = require('fs');
const { log } = require('console');
// Decode the environment variable to a temporary file

// Initialize Google Cloud Storage
const storage = new Storage({
  credentials: JSON.parse(Buffer.from(process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64, 'base64').toString('ascii'))
});


const bucketName = 'sleepmusic';

const uploadFileToStorage = async (file, isPoster = false) => {
  // Determine the file path based on whether it's a poster
  const filePath = isPoster ? `images/${file.originalname}` : file.originalname;

  const blob = storage.bucket(bucketName).file(filePath);
  const blobStream = blob.createWriteStream();

  await new Promise((resolve, reject) => {
      blobStream.on('error', reject);
      blobStream.on('finish', resolve);
      blobStream.end(file.buffer);
  });

  return `https://storage.googleapis.com/${bucketName}/${blob.name}`;
};

async function deleteFileFromStorage(fileName, isPoster = false) {
  // Determine the file path based on whether it's a poster
  const filePath = isPoster ? `images/${fileName}` : fileName;

  await storage.bucket(bucketName).file(filePath).delete();
}

exports.uploadFiles = async (req, res, next) => {
    try {
        // Ensure both sound and poster files are uploaded
        if (!req.files.audioFile || !req.files.imageFile) {
            return res.status(400).send({message:'Both sound and poster files are required.'});
        }

        const audioFile = req.files.audioFile[0]; // Assuming `audioFile` is the field name for the sound file
        const imageFile = req.files.imageFile[0]; // Assuming `imageFile` is the field name for the poster file

        // Function to upload file to Google Cloud Storage and return the URL
        const uploadFileToStorage = async (file, isPoster = false) => {
          // Determine the file path based on whether it's a poster
          const filePath = isPoster ? `images/${file.originalname}` : file.originalname;
      
          const blob = storage.bucket(bucketName).file(filePath);
          const blobStream = blob.createWriteStream();
      
          await new Promise((resolve, reject) => {
              blobStream.on('error', reject);
              blobStream.on('finish', resolve);
              blobStream.end(file.buffer);
          });
      
          return `https://storage.googleapis.com/${bucketName}/${blob.name}`;
      };
      

        // Upload files
        const audioFileUrl = await uploadFileToStorage(audioFile);
        const imageFileUrl = await uploadFileToStorage(imageFile,true);

        // Save music details in MongoDB
        const music = new Music({
            // Add other music details here, e.g., title, artist
            name: req.body.name,
            categories:req.body.categoryId,
            description:req.body.description,
            audioFilename: audioFileUrl,
            imageFilename: imageFileUrl,
            isPremium:req.body.isPremium
        });

        await music.save();

        res.status(200).send({
            message: 'Music uploaded and saved successfully.',
            data: {
                soundUrl: audioFileUrl,
                posterUrl: imageFileUrl,
                // Include any other details you saved
            }
        });
    } catch (error) {
        return res.status(500).send({ message: error.message });
    }
};

exports.editMusicItem = async (req, res) => {
  try {
      const { musicId } = req.params; // Music item's ID from URL parameter
      const musicItem = await Music.findById(musicId);
      const updateData = {
        name: req.body.name,
        categories: req.body.categoryId,
        description: req.body.description,
        isPremium:req.body.isPremium === 'true'
       
    }
      if (!musicItem) {
          return res.status(404).send({message: 'Music item not found.'});
      }

      // Check for new file uploads and delete old files if new ones are provided
      if (req.files && req.files.audioFile) {
          if (musicItem.audioFilename) {
              const oldaudioFileName = musicItem.audioFilename.split('/').pop();
              await deleteFileFromStorage(oldaudioFileName);
          }
          const newaudioFile = req.files.audioFile[0];
          updateData.audioFilename = await uploadFileToStorage(newaudioFile); // Update with new sound URL
      }

      if (req.files && req.files.imageFile) {
          if (musicItem.imageFilename) {
              const oldimageFileName = musicItem.imageFilename.split('/').pop();
              await deleteFileFromStorage(oldimageFileName,true);
          }
          const newimageFile = req.files.imageFile[0];
          updateData.imageFilename = await uploadFileToStorage(newimageFile, true); // Update with new poster URL
      }

      // Save the updated music item in the database
      const updatedMusic = await Music.findByIdAndUpdate(musicId, updateData, { new: true });

      res.status(200).send({
          message: 'Music item updated successfully.',
          data: updatedMusic,
      });
  } catch (error) {
      res.status(500).send({ message: error.message });
  }
};

exports.deleteMusicItem = async (req, res) =>{
  const { musicId } = req.params;

    try {
        const musicItem = await Music.findById(musicId);
      

        if (!musicItem) {
            return res.status(404).send({ message: 'Music item not found.' });
        }


        // Delete the music item from the database
        await Music.deleteOne({ _id: musicId });

        res.status(200).send({ message: 'Music item and related files deleted successfully.' });
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
}

