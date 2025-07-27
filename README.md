# LOVESF - 3D Gallery Creator

A beautiful 3D gallery web application where users can create custom photo galleries with music and 3D flip animations.

## 🚀 Deployment ke Vercel

### Persiapan
1. Push project ke GitHub repository
2. Login ke [Vercel](https://vercel.com)
3. Import repository dari GitHub

### File Konfigurasi
- `vercel.json` - Konfigurasi deployment Vercel
- `package.json` - Dependencies dan scripts
- `.gitignore` - Mengecualikan file yang tidak perlu

### Auto-Cleanup System
Project ini memiliki sistem pembersihan otomatis:
- **File expired setelah 2 hari** dari tanggal upload
- **Cron job berjalan setiap 12 jam** (00:00 dan 12:00)  
- **Cleanup saat startup** server (5 detik setelah start)

### Environment Variables (Opsional)
Di Vercel dashboard, Anda bisa menambahkan:
- `PORT` - Port server (default: 3000)

## Features

- ✨ Upload up to 7 custom images
- 💖 Custom mirror text effects  
- 🎵 3 opsi musik: None, Default, Custom
- 🎯 3D flip card animations with perspective control
- 📱 Mobile-friendly with touch controls
- 🔗 Unique shareable links for each gallery
- ❤️ Clean QR codes for easy sharing
- 🌧️ Falling hearts animation
- 🧹 Auto-cleanup file expired (2 hari)
- 📂 Professional corporate design

## Installation

1. Install dependencies:
```bash
npm install
```

## Running the Server

### Option 1: Command Line
```bash
# Local access only
npm start

# Network access (recommended)
npm run network
```

### Option 2: Batch File (Windows)
Double-click `start.bat` for easy startup with network access.

### Option 3: Development Mode
```bash
npm run dev
```

## Network Access 📱

When you start the server, you'll see output like:
```
🚀 LOVESF Server running on:
   Local:    http://localhost:3000
   Local:    http://127.0.0.1:3000
   Network:  http://192.168.1.100:3000

📱 For mobile access, use the Network URL above
💡 Make sure your device is on the same WiFi network
```

**To access from other devices:**
1. Make sure all devices are on the same WiFi network
2. Use the Network URL (e.g., `http://192.168.1.100:3000`)
3. Test the gallery on phones, tablets, or other computers

## How to Use

1. **Create Gallery**: Go to the homepage and upload your images (max 7)
2. **Add Custom Text**: Enter text that will appear with glow effect
3. **Generate**: Click "Create 3D Love Gallery" 
4. **Share**: Get a unique link and heart-shaped QR code
5. **View**: Navigate to your gallery to see the 3D effects

## Gallery Features

- **3D Falling Effect**: Text and images fall from top (stay upright)
- **3D Perspective Control**: 
  - Desktop: Arrow buttons (↑↓←→)
  - Mobile: Swipe to change viewing angle
  - Keyboard: Arrow keys
- **Heart QR Code**: Original QR in center with love frame
- **Download QR**: Save QR code as PNG file
- **Responsive Design**: Works on all devices

## API Endpoints

- `GET /` - Homepage with gallery creator
- `GET /gallery/:id` - View specific gallery
- `POST /api/create-gallery` - Create new gallery
- `GET /api/gallery/:id` - Get gallery data

## File Structure

```
├── server.js              # Express server
├── package.json           # Dependencies
├── start.bat              # Windows startup script
├── public/
│   ├── index.html         # Gallery creator page
│   └── gallery.html       # Gallery viewer page
├── uploads/               # Uploaded images
└── galleries/             # Gallery data files
```

## Dependencies

- **Express.js** - Web server framework
- **Multer** - File upload handling
- **QRCode** - QR code generation
- **Canvas** - Heart QR frame generation
- **UUID** - Unique ID generation
- **fs-extra** - Enhanced file system operations

## Network Testing

Perfect for testing across devices:
- **Desktop**: Create galleries
- **Mobile**: Test 3D effects and touch controls
- **Tablet**: Test responsive design
- **Multiple users**: Share and view galleries

## Browser Support

- Chrome/Edge (recommended)
- Firefox
- Safari
- Mobile browsers

## Firewall Notes

If you can't access from other devices:
1. Check Windows Firewall settings
2. Allow Node.js through firewall
3. Ensure port 3000 is not blocked

## Notes

- Images are stored locally in the `uploads` folder
- Gallery data is saved as JSON files
- Maximum file size: 5MB per image
- Supported formats: JPG, PNG, GIF
- QR codes link directly to gallery URLs
- Server binds to 0.0.0.0 for network access

Enjoy creating magical 3D love galleries! 💕
