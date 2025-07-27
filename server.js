const express = require('express');
const multer = require('multer');
const QRCode = require('qrcode');
const { createCanvas, loadImage } = require('canvas');
const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');
const cron = require('node-cron');
const { cleanupExpiredFiles } = require('./cleanup');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

fs.ensureDirSync('public');
fs.ensureDirSync('uploads');
fs.ensureDirSync('galleries');
fs.ensureDirSync('music');
fs.ensureDirSync('music/default');

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
      cb(null, 'music/');
    } else {
      cb(null, 'uploads/');
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

app.use('/uploads', express.static('uploads'));
app.use('/galleries', express.static('galleries'));
app.use('/music', express.static('music'));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/gallery/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'gallery.html'));
});

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
      musicPath = `/music/${req.files.music[0].filename}`;
    } else if (musicType === 'default') {
      const defaultMusicFiles = await fs.readdir('music/default').catch(() => []);
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
    }

    const galleryData = {
      id: galleryId,
      customText: customText || 'Love',
      musicType: musicType || 'none',
      musicPath: musicPath,
      images: req.files.images.map(file => ({
        filename: file.filename,
        originalname: file.originalname,
        path: `/uploads/${file.filename}`
      })),
      createdAt: new Date().toISOString()
    };

    await fs.writeJson(`galleries/${galleryId}.json`, galleryData);

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

app.get('/api/gallery/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const galleryPath = `galleries/${id}.json`;
    
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

app.get('/api/status', async (req, res) => {
  try {
    const foldersToCheck = ['galleries', 'uploads', 'qr', 'music'];
    const status = {
      server: 'running',
      timestamp: new Date().toISOString(),
      folders: {}
    };
    
    for (const folderName of foldersToCheck) {
      const folderPath = path.join(__dirname, folderName);
      try {
        if (await fs.pathExists(folderPath)) {
          const files = await fs.readdir(folderPath);
          status.folders[folderName] = files.length;
        } else {
          status.folders[folderName] = 0;
        }
      } catch (error) {
        status.folders[folderName] = 'error';
      }
    }
    
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get status' });
  }
});

app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
    }
  }
  res.status(500).json({ error: error.message });
});

app.listen(PORT, '0.0.0.0', () => {
  const os = require('os');
  const interfaces = os.networkInterfaces();
  
  console.log(`🚀 LOVESF Server running on:`);
  console.log(`   Local:    http://localhost:${PORT}`);
  console.log(`   Local:    http://127.0.0.1:${PORT}`);
  
  Object.keys(interfaces).forEach(name => {
    interfaces[name].forEach(iface => {
      if (iface.family === 'IPv4' && !iface.internal) {
        console.log(`   Network:  http://${iface.address}:${PORT}`);
      }
    });
  });
  
  console.log(`\n📱 For mobile access, use the Network URL above`);
  console.log(`💡 Make sure your device is on the same WiFi network\n`);
});

cron.schedule('0 */12 * * *', async () => {
  console.log('🕒 Running scheduled cleanup...');
  try {
    await cleanupExpiredFiles();
  } catch (error) {
    console.error('❌ Scheduled cleanup failed:', error);
  }
});
setTimeout(async () => {
  console.log('🧹 Running initial cleanup...');
  try {
    await cleanupExpiredFiles();
  } catch (error) {
    console.error('❌ Initial cleanup failed:', error);
  }
}, 5000);
