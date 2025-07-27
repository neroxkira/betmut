const fs = require('fs-extra');
const path = require('path');
async function cleanupExpiredFiles() {
    console.log('🧹 Starting cleanup process...');
    
    const now = Date.now();
    const twoDaysInMs = 2 * 24 * 60 * 60 * 1000;
    
    const foldersToClean = ['galleries', 'uploads', 'qr', 'music'];
    let totalDeleted = 0;
    
    for (const folderName of foldersToClean) {
        const folderPath = path.join(__dirname, folderName);
        
        try {
            if (!await fs.pathExists(folderPath)) {
                console.log(`📁 Folder ${folderName} tidak ditemukan, skip...`);
                continue;
            }
            
            const files = await fs.readdir(folderPath);
            console.log(`📂 Checking ${files.length} files in ${folderName}...`);
            
            for (const file of files) {
                const filePath = path.join(folderPath, file);
                
                try {
                    const stats = await fs.stat(filePath);
                    const fileAge = now - stats.mtime.getTime();
                    
                    if (fileAge > twoDaysInMs) {
                        await fs.remove(filePath);
                        console.log(`🗑️  Deleted expired file: ${folderName}/${file} (${Math.round(fileAge / (24 * 60 * 60 * 1000))} days old)`);
                        totalDeleted++;
                    }
                } catch (error) {
                    console.error(`❌ Error processing file ${filePath}:`, error.message);
                }
            }
        } catch (error) {
            console.error(`❌ Error reading folder ${folderName}:`, error.message);
        }
    }
    
    console.log(`✅ Cleanup completed! Total files deleted: ${totalDeleted}`);
    return totalDeleted;
}
if (require.main === module) {
    cleanupExpiredFiles()
        .then(() => {
            console.log('🎉 Cleanup script finished successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Cleanup script failed:', error);
            process.exit(1);
        });
}

module.exports = { cleanupExpiredFiles };
