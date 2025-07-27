const path = require('path');
const fs = require('fs-extra');

export default async function handler(req, res) {
  const { filename } = req.query;
  const musicDir = '/tmp/music';
  const filePath = path.join(musicDir, filename);
  
  try {
    if (await fs.pathExists(filePath)) {
      const fileBuffer = await fs.readFile(filePath);
      const ext = path.extname(filename).toLowerCase();
      
      let contentType = 'application/octet-stream';
      if (ext === '.mp3') contentType = 'audio/mpeg';
      else if (ext === '.wav') contentType = 'audio/wav';
      else if (ext === '.ogg') contentType = 'audio/ogg';
      else if (ext === '.m4a') contentType = 'audio/mp4';
      
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=31536000');
      res.send(fileBuffer);
    } else {
      res.status(404).json({ error: 'File not found' });
    }
  } catch (error) {
    console.error('Error serving music file:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
