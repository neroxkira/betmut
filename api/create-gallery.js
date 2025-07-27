const express = require('express');
const multer = require('multer');
const QRCode = require('qrcode');
const { createCanvas, loadImage } = require('canvas');
const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');

const baseDir = '/tmp';
const uploadsDir = path.join(baseDir, 'uploads');
const galleriesDir = path.join(baseDir, 'galleries');
const musicDir = path.join(baseDir, 'music');

fs.ensureDirSync(uploadsDir);
fs.ensureDirSync(galleriesDir);
fs.ensureDirSync(musicDir);

function createHeartShapedQR(qrDataUrl) {
  return new Promise(async (resolve, reject) => {
    try {
      const canvas = createCanvas(500, 500);
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 500, 500);
      const img = await loadImage(qrDataUrl);
      const qrSize = 400;
      const qrX = (500 - qrSize) / 2;
      const qrY = (500 - qrSize) / 2;
      ctx.drawImage(img, qrX, qrY, qrSize, qrSize);
      resolve(canvas.toDataURL());
    } catch (err) {
      console.error('Error creating QR:', err);
      resolve(qrDataUrl);
    }
  });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'music') {
      cb(null, musicDir);
    } else {
      cb(null, uploadsDir);
    }
  },
  filename: (req, file, cb) => {
    const uniqueName = uuidv4() + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'music') {
      const allowedTypes = /mp3|wav|ogg|m4a/;
      const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
      const mimetype = allowedTypes.test(file.mimetype) || file.mimetype.includes('audio');
      
      if (mimetype && extname) {
        return cb(null, true);
      } else {
        cb(new Error('Only audio files are allowed for music!'));
      }
    } else {
      const allowedTypes = /jpeg|jpg|png|gif/;
      const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
      const mimetype = allowedTypes.test(file.mimetype);
      
      if (mimetype && extname) {
        return cb(null, true);
      } else {
        cb(new Error('Only image files are allowed!'));
      }
    }
  }
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  upload.fields([
    { name: 'images', maxCount: 7 },
    { name: 'music', maxCount: 1 }
  ])(req, res, async (err) => {
    if (err) {
      console.error('Upload error:', err);
      return res.status(400).json({ error: err.message });
    }

    try {
      const { customText, musicType } = req.body;
      const galleryId = uuidv4();
      
      if (!req.files || !req.files.images || req.files.images.length === 0) {
        return res.status(400).json({ error: 'At least one image is required' });
      }

      if (req.files.images.length > 7) {
        return res.status(400).json({ error: 'Maximum 7 images allowed' });
      }

      let musicPath = null;
      if (musicType === 'custom' && req.files.music && req.files.music.length > 0) {
        musicPath = `/api/music/${req.files.music[0].filename}`;
      }

      const galleryData = {
        id: galleryId,
        customText: customText || 'Love',
        musicType: musicType || 'none',
        musicPath: musicPath,
        images: req.files.images.map(file => ({
          filename: file.filename,
          originalname: file.originalname,
          path: `/api/uploads/${file.filename}`
        })),
        createdAt: new Date().toISOString()
      };

      await fs.writeJson(path.join(galleriesDir, `${galleryId}.json`), galleryData);

      const galleryUrl = `${req.headers.origin || 'https://' + req.headers.host}/gallery/${galleryId}`;
      
      const qrCodeDataUrl = await QRCode.toDataURL(galleryUrl, {
        width: 500,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#ffffff'
        },
        errorCorrectionLevel: 'H'
      });

      const heartQrDataUrl = await createHeartShapedQR(qrCodeDataUrl);

      res.json({
        success: true,
        galleryId,
        galleryUrl,
        qrCode: heartQrDataUrl
      });

    } catch (error) {
      console.error('Error creating gallery:', error);
      res.status(500).json({ error: 'Failed to create gallery' });
    }
  });
}
