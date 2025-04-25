const express = require('express');
const router = express.Router();
const { findDocuments } = require('../db/database');
const { aggregate } = require('../aggregation/pipeline');
const { authenticate, ownerOrAdmin } = require('../auth/middleware');

// Run an aggregation pipeline
router.post('/:collection', authenticate, ownerOrAdmin, async (req, res) => {
  try {
    const { collection } = req.params;
    const { pipeline } = req.body;
    
    if (!pipeline || !Array.isArray(pipeline)) {
      return res.status(400).json({ error: 'Pipeline must be an array of stages' });
    }
    
    // Get all documents for this collection
    const documents = await findDocuments(collection);
    
    // Run the aggregation pipeline
    const result = await aggregate(documents, pipeline);
    
    res.json(result);
  } catch (error) {
    if (error.message.includes('does not exist')) {
      res.status(404).json({ error: error.message });
    } else if (error.message.includes('Unsupported')) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

module.exports = router; 