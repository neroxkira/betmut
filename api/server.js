const express = require('express');
const multer = require('multer');
const QRCode = require('qrcode');
const { createCanvas, loadImage } = require('canvas');
const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');

const app = express();

// Middleware
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure directories exist untuk Vercel
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

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'public', 'index.html'));
});

app.get('/gallery/:id', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'public', 'gallery.html'));
});

// Serve uploaded files
app.get('/api/uploads/:filename', (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(uploadsDir, filename);
  
  if (fs.existsSync(filePath)) {
    const ext = path.extname(filename).toLowerCase();
    let contentType = 'application/octet-stream';
    if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
    else if (ext === '.png') contentType = 'image/png';
    else if (ext === '.gif') contentType = 'image/gif';
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    res.sendFile(filePath);
  } else {
    res.status(404).json({ error: 'File not found' });
  }
});

// Serve music files
app.get('/api/music/:filename', (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(musicDir, filename);
  
  if (fs.existsSync(filePath)) {
    const ext = path.extname(filename).toLowerCase();
    let contentType = 'application/octet-stream';
    if (ext === '.mp3') contentType = 'audio/mpeg';
    else if (ext === '.wav') contentType = 'audio/wav';
    else if (ext === '.ogg') contentType = 'audio/ogg';
    else if (ext === '.m4a') contentType = 'audio/mp4';
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    res.sendFile(filePath);
  } else {
    res.status(404).json({ error: 'File not found' });
  }
});

// Serve default music files
app.get('/music/default/:filename', (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(process.cwd(), 'music', 'default', filename);
  
  if (fs.existsSync(filePath)) {
    const ext = path.extname(filename).toLowerCase();
    let contentType = 'application/octet-stream';
    if (ext === '.mp3') contentType = 'audio/mpeg';
    else if (ext === '.wav') contentType = 'audio/wav';
    else if (ext === '.ogg') contentType = 'audio/ogg';
    else if (ext === '.m4a') contentType = 'audio/mp4';
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    res.sendFile(filePath);
  } else {
    res.status(404).json({ error: 'File not found' });
  }
});

// API to create new gallery
app.post('/api/create-gallery', upload.fields([
  { name: 'images', maxCount: 7 },
  { name: 'music', maxCount: 1 }
]), async (req, res) => {
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
    } else if (musicType === 'default') {
      // Get random default music from local folder
      const defaultMusicPath = path.join(process.cwd(), 'music', 'default');
      try {
        const defaultMusicFiles = await fs.readdir(defaultMusicPath);
        const audioFiles = defaultMusicFiles.filter(file => {
          const ext = path.extname(file).toLowerCase();
          return ['.mp3', '.wav', '.ogg', '.m4a'].includes(ext);
        });
        
        if (audioFiles.length > 0) {
          const randomMusic = audioFiles[Math.floor(Math.random() * audioFiles.length)];
          musicPath = `/music/default/${randomMusic}`;
          console.log('Selected default music:', randomMusic);
        } else {
          console.warn('No audio files found in music/default directory');
        }
      } catch (error) {
        console.error('Error reading default music directory:', error);
      }
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

    const galleryUrl = `${req.protocol}://${req.get('host')}/gallery/${galleryId}`;
    
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

// API to get gallery data
app.get('/api/gallery/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const galleryPath = path.join(galleriesDir, `${id}.json`);
    
    if (!await fs.pathExists(galleryPath)) {
      return res.status(404).json({ error: 'Gallery not found' });
    }

    const galleryData = await fs.readJson(galleryPath);
    res.json(galleryData);

  } catch (error) {
    console.error('Error fetching gallery:', error);
    res.status(500).json({ error: 'Failed to fetch gallery' });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
    }
  }
  res.status(500).json({ error: error.message });
});

// Export untuk Vercel
module.exports = app;
