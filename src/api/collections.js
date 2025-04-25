const express = require('express');
const router = express.Router();
const {
  createCollection,
  listCollections,
  deleteCollection
} = require('../db/database');

// Get all collections
router.get('/', async (req, res) => {
  try {
    const collections = await listCollections();
    res.json(collections);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new collection
router.post('/', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Collection name is required' });
    }
    
    const collection = await createCollection(name);
    res.status(201).json(collection);
  } catch (error) {
    if (error.message.includes('already exists')) {
      res.status(409).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// Delete a collection
router.delete('/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const result = await deleteCollection(name);
    res.json(result);
  } catch (error) {
    if (error.message.includes('does not exist')) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

module.exports = router; 