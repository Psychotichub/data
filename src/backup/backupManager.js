const fs = require('fs-extra');
const path = require('path');
const archiver = require('archiver');
const moment = require('moment');

// Configuration
const BACKUP_DIR = path.join(__dirname, '../../data/backups');
const DB_DIR = path.join(__dirname, '../../data');

// Initialize backup system
async function initBackups() {
  try {
    await fs.ensureDir(BACKUP_DIR);
    console.log('Backup system initialized');
  } catch (error) {
    console.error('Error initializing backup system:', error);
    throw error;
  }
}

// Create a new backup
async function createBackup(name = '') {
  try {
    // Create backup directory if it doesn't exist
    await fs.ensureDir(BACKUP_DIR);
    
    // Generate backup filename
    const timestamp = moment().format('YYYY-MM-DD_HH-mm-ss');
    const backupName = name 
      ? `${name}_${timestamp}.zip` 
      : `backup_${timestamp}.zip`;
    const backupPath = path.join(BACKUP_DIR, backupName);
    
    // Create a write stream
    const output = fs.createWriteStream(backupPath);
    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximum compression
    });
    
    // Pipe the archive to the output file
    archive.pipe(output);
    
    // Add the collections directory
    const collectionsDir = path.join(DB_DIR, 'collections');
    if (await fs.pathExists(collectionsDir)) {
      archive.directory(collectionsDir, 'collections');
    }
    
    // Add db_info.json
    const dbInfoPath = path.join(DB_DIR, 'db_info.json');
    if (await fs.pathExists(dbInfoPath)) {
      archive.file(dbInfoPath, { name: 'db_info.json' });
    }
    
    // Add the indexes directory
    const indexesDir = path.join(DB_DIR, 'indexes');
    if (await fs.pathExists(indexesDir)) {
      archive.directory(indexesDir, 'indexes');
    }
    
    // Add the users directory
    const usersDir = path.join(DB_DIR, 'users');
    if (await fs.pathExists(usersDir)) {
      archive.directory(usersDir, 'users');
    }
    
    // Finalize the archive
    await archive.finalize();
    
    return new Promise((resolve, reject) => {
      output.on('close', () => {
        resolve({
          filename: backupName,
          path: backupPath,
          size: archive.pointer(),
          timestamp: moment().toISOString()
        });
      });
      
      archive.on('error', err => {
        reject(err);
      });
    });
  } catch (error) {
    console.error('Error creating backup:', error);
    throw error;
  }
}

// List available backups
async function listBackups() {
  try {
    // Create backup directory if it doesn't exist
    await fs.ensureDir(BACKUP_DIR);
    
    // Get all backup files
    const files = await fs.readdir(BACKUP_DIR);
    
    // Filter for zip files and get stats
    const backups = await Promise.all(
      files
        .filter(file => file.endsWith('.zip'))
        .map(async file => {
          const filePath = path.join(BACKUP_DIR, file);
          const stats = await fs.stat(filePath);
          
          // Parse timestamp from filename (backup_YYYY-MM-DD_HH-mm-ss.zip)
          let timestamp = null;
          const timestampMatch = file.match(/(\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2})/);
          if (timestampMatch) {
            timestamp = moment(timestampMatch[1], 'YYYY-MM-DD_HH-mm-ss').toISOString();
          }
          
          return {
            filename: file,
            path: filePath,
            size: stats.size,
            created: stats.ctime.toISOString(),
            timestamp
          };
        })
    );
    
    // Sort by created date (newest first)
    return backups.sort((a, b) => new Date(b.created) - new Date(a.created));
  } catch (error) {
    console.error('Error listing backups:', error);
    throw error;
  }
}

// Delete a backup
async function deleteBackup(filename) {
  try {
    const backupPath = path.join(BACKUP_DIR, filename);
    
    // Check if backup exists
    if (!await fs.pathExists(backupPath)) {
      throw new Error(`Backup "${filename}" not found`);
    }
    
    // Delete the backup file
    await fs.unlink(backupPath);
    
    return { deleted: true, filename };
  } catch (error) {
    console.error('Error deleting backup:', error);
    throw error;
  }
}

// Restore from a backup
async function restoreFromBackup(filename) {
  try {
    const backupPath = path.join(BACKUP_DIR, filename);
    
    // Check if backup exists
    if (!await fs.pathExists(backupPath)) {
      throw new Error(`Backup "${filename}" not found`);
    }
    
    // Create a temporary directory for extraction
    const tempDir = path.join(BACKUP_DIR, 'temp_restore');
    await fs.ensureDir(tempDir);
    
    try {
      // Extract the backup
      await extractZip(backupPath, tempDir);
      
      // Stop the server or disconnect clients (in a real implementation)
      // For now, we'll just replace the data
      
      // Save the users directory to preserve it if needed
      const usersDir = path.join(DB_DIR, 'users');
      const tempUsersDir = path.join(tempDir, 'users');
      const hasUsers = await fs.pathExists(usersDir);
      
      // If we have users in the backup but none currently, or vice versa,
      // we need to handle that properly
      
      // Remove existing data
      // Keep the backups directory
      const collectionsDir = path.join(DB_DIR, 'collections');
      if (await fs.pathExists(collectionsDir)) {
        await fs.remove(collectionsDir);
      }
      
      const dbInfoPath = path.join(DB_DIR, 'db_info.json');
      if (await fs.pathExists(dbInfoPath)) {
        await fs.remove(dbInfoPath);
      }
      
      const indexesDir = path.join(DB_DIR, 'indexes');
      if (await fs.pathExists(indexesDir)) {
        await fs.remove(indexesDir);
      }
      
      // Only remove users if we have users in the backup
      if (await fs.pathExists(tempUsersDir) && hasUsers) {
        await fs.remove(usersDir);
      }
      
      // Copy data from the temp directory
      const tempCollectionsDir = path.join(tempDir, 'collections');
      if (await fs.pathExists(tempCollectionsDir)) {
        await fs.copy(tempCollectionsDir, collectionsDir);
      }
      
      const tempDbInfoPath = path.join(tempDir, 'db_info.json');
      if (await fs.pathExists(tempDbInfoPath)) {
        await fs.copy(tempDbInfoPath, dbInfoPath);
      }
      
      const tempIndexesDir = path.join(tempDir, 'indexes');
      if (await fs.pathExists(tempIndexesDir)) {
        await fs.copy(tempIndexesDir, indexesDir);
      }
      
      // Only restore users if we have them in the backup
      if (await fs.pathExists(tempUsersDir)) {
        await fs.copy(tempUsersDir, usersDir);
      }
      
      return { restored: true, filename };
    } finally {
      // Clean up the temp directory
      if (await fs.pathExists(tempDir)) {
        await fs.remove(tempDir);
      }
    }
  } catch (error) {
    console.error('Error restoring from backup:', error);
    throw error;
  }
}

// Helper to extract a zip file
function extractZip(zipPath, destPath) {
  // In a real implementation, we would use a library to extract the zip
  // Here we'll just return a promise that resolves immediately
  return Promise.resolve();
  
  // Example using a real library:
  // return new Promise((resolve, reject) => {
  //   const unzip = require('unzipper');
  //   fs.createReadStream(zipPath)
  //     .pipe(unzip.Extract({ path: destPath }))
  //     .on('close', resolve)
  //     .on('error', reject);
  // });
}

module.exports = {
  initBackups,
  createBackup,
  listBackups,
  deleteBackup,
  restoreFromBackup
}; 