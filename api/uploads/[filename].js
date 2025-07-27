const path = require('path');
const fs = require('fs-extra');

export default async function handler(req, res) {
  const { filename } = req.query;
  const uploadsDir = '/tmp/uploads';
  const filePath = path.join(uploadsDir, filename);
  
  try {
    if (await fs.pathExists(filePath)) {
      const fileBuffer = await fs.readFile(filePath);
      const ext = path.extname(filename).toLowerCase();
      
      let contentType = 'application/octet-stream';
      if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
      else if (ext === '.png') contentType = 'image/png';
      else if (ext === '.gif') contentType = 'image/gif';
      
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=31536000');
      res.send(fileBuffer);
    } else {
      res.status(404).json({ error: 'File not found' });
    }
  } catch (error) {
    console.error('Error serving file:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
