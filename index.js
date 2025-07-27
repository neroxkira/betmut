const path = require('path');
const fs = require('fs');

export default function handler(req, res) {
  const { url } = req;
  
  // Handle root path
  if (url === '/') {
    const indexPath = path.join(process.cwd(), 'public', 'index.html');
    const indexFile = fs.readFileSync(indexPath, 'utf8');
    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(indexFile);
  }
  if (url.startsWith('/gallery/')) {
    const galleryPath = path.join(process.cwd(), 'public', 'gallery.html');
    const galleryFile = fs.readFileSync(galleryPath, 'utf8');
    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(galleryFile);
  }

  const filePath = path.join(process.cwd(), 'public', url);
  
  try {
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      let contentType = 'text/plain';
      
      if (ext === '.html') contentType = 'text/html';
      else if (ext === '.css') contentType = 'text/css';
      else if (ext === '.js') contentType = 'application/javascript';
      else if (ext === '.json') contentType = 'application/json';
      else if (ext === '.png') contentType = 'image/png';
      else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
      else if (ext === '.gif') contentType = 'image/gif';
      else if (ext === '.svg') contentType = 'image/svg+xml';
      else if (ext === '.ico') contentType = 'image/x-icon';
      
      const fileContent = fs.readFileSync(filePath);
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=31536000');
      return res.status(200).send(fileContent);
    }
  } catch (error) {
    console.error('Error serving static file:', error);
  }
  res.status(404).json({ error: 'Not Found' });
}
