const express = require('express');
const router = express.Router();
const { findDocuments } = require('../db/database');
const {
  createIndex,
  getIndex,
  listIndexes,
  deleteIndex
} = require('../indexes/indexManager');
const { authenticate, requireAdmin, ownerOrAdmin } = require('../auth/middleware');

// Get all indexes for a collection
router.get('/:collection', authenticate, ownerOrAdmin, async (req, res) => {
  try {
    const { collection } = req.params;
    const indexes = await listIndexes(collection);
    res.json(indexes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new index
router.post('/:collection', authenticate, ownerOrAdmin, async (req, res) => {
  try {
    const { collection } = req.params;
    const { field } = req.body;
    
    if (!field) {
      return res.status(400).json({ error: 'Field name is required' });
    }
    
    // Get all documents for this collection
    const documents = await findDocuments(collection);
    
    // Create the index
    const result = await createIndex(collection, field, documents);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get index details
router.get('/:collection/:field', authenticate, ownerOrAdmin, async (req, res) => {
  try {
    const { collection, field } = req.params;
    const index = await getIndex(collection, field);
    
    if (!index) {
      return res.status(404).json({ error: `Index for ${collection}.${field} not found` });
    }
    
    res.json(index);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete an index
router.delete('/:collection/:field', authenticate, ownerOrAdmin, async (req, res) => {
  try {
    const { collection, field } = req.params;
    const result = await deleteIndex(collection, field);
    res.json(result);
  } catch (error) {
    if (error.message.includes('not found') || error.message.includes('does not exist')) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

module.exports = router; 