const path = require('path');
const fs = require('fs-extra');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;
    const galleriesDir = '/tmp/galleries';
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
}
