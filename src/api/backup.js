const express = require('express');
const router = express.Router();
const {
  createBackup,
  listBackups,
  deleteBackup,
  restoreFromBackup
} = require('../backup/backupManager');
const { authenticate, requireAdmin } = require('../auth/middleware');

// List all backups
router.get('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const backups = await listBackups();
    res.json(backups);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new backup
router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name } = req.body;
    const backup = await createBackup(name);
    res.status(201).json(backup);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a backup
router.delete('/:filename', authenticate, requireAdmin, async (req, res) => {
  try {
    const { filename } = req.params;
    const result = await deleteBackup(filename);
    res.json(result);
  } catch (error) {
    if (error.message.includes('not found')) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// Restore from a backup
router.post('/restore/:filename', authenticate, requireAdmin, async (req, res) => {
  try {
    const { filename } = req.params;
    const result = await restoreFromBackup(filename);
    res.json(result);
  } catch (error) {
    if (error.message.includes('not found')) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

module.exports = router; 