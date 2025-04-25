const express = require('express');
const router = express.Router();
const {
  insertDocument,
  findDocuments,
  updateDocument,
  deleteDocument
} = require('../db/database');

// Get all documents in a collection
router.get('/:collection', async (req, res) => {
  try {
    const { collection } = req.params;
    let query = {};
    
    // Parse query parameters for filtering
    if (req.query.filter) {
      try {
        query = JSON.parse(req.query.filter);
      } catch (e) {
        return res.status(400).json({ error: 'Invalid filter format. Must be valid JSON' });
      }
    }
    
    const documents = await findDocuments(collection, query);
    res.json(documents);
  } catch (error) {
    if (error.message.includes('does not exist')) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// Insert a document
router.post('/:collection', async (req, res) => {
  try {
    const { collection } = req.params;
    const document = req.body;
    
    if (!document || typeof document !== 'object' || Array.isArray(document)) {
      return res.status(400).json({ error: 'Document must be a valid object' });
    }
    
    const insertedDocument = await insertDocument(collection, document);
    res.status(201).json(insertedDocument);
  } catch (error) {
    if (error.message.includes('does not exist')) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// Update a document
router.patch('/:collection/:id', async (req, res) => {
  try {
    const { collection, id } = req.params;
    const update = req.body;
    
    if (!update || typeof update !== 'object' || Array.isArray(update)) {
      return res.status(400).json({ error: 'Update must be a valid object' });
    }
    
    const updatedDocument = await updateDocument(collection, id, update);
    res.json(updatedDocument);
  } catch (error) {
    if (error.message.includes('not found')) {
      res.status(404).json({ error: error.message });
    } else if (error.message.includes('does not exist')) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// Delete a document
router.delete('/:collection/:id', async (req, res) => {
  try {
    const { collection, id } = req.params;
    const result = await deleteDocument(collection, id);
    res.json(result);
  } catch (error) {
    if (error.message.includes('not found')) {
      res.status(404).json({ error: error.message });
    } else if (error.message.includes('does not exist')) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

module.exports = router; 