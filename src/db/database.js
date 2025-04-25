const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { queryWithIndex, updateIndexForDocument, removeDocumentFromIndexes, deleteCollectionIndexes } = require('../indexes/indexManager');

// Database configuration
const DB_DIR = path.join(__dirname, '../../data');
const COLLECTIONS_DIR = path.join(DB_DIR, 'collections');
const DB_INFO_FILE = path.join(DB_DIR, 'db_info.json');

// Default database info
const defaultDBInfo = {
  name: 'PsychoticDB',
  version: '1.0.0',
  created: new Date().toISOString(),
  collections: []
};

// Initialize the database
async function initDB() {
  try {
    // Ensure directories exist
    await fs.ensureDir(DB_DIR);
    await fs.ensureDir(COLLECTIONS_DIR);
    
    // Create or load database info
    if (!await fs.pathExists(DB_INFO_FILE)) {
      await fs.writeJson(DB_INFO_FILE, defaultDBInfo, { spaces: 2 });
      console.log('Database initialized with default settings');
    } else {
      console.log('Database already initialized');
    }
    
    return getDBInfo();
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// Get database info
async function getDBInfo() {
  try {
    return await fs.readJson(DB_INFO_FILE);
  } catch (error) {
    console.error('Error reading database info:', error);
    throw error;
  }
}

// Create a new collection
async function createCollection(name) {
  try {
    // Validate name
    if (!name || typeof name !== 'string') {
      throw new Error('Collection name must be a non-empty string');
    }
    
    // Check if collection already exists
    const dbInfo = await getDBInfo();
    if (dbInfo.collections.includes(name)) {
      throw new Error(`Collection "${name}" already exists`);
    }
    
    // Create collection directory
    const collectionDir = path.join(COLLECTIONS_DIR, name);
    await fs.ensureDir(collectionDir);
    
    // Create collection metadata file
    const metadataFile = path.join(collectionDir, 'metadata.json');
    await fs.writeJson(metadataFile, {
      name,
      created: new Date().toISOString(),
      documentCount: 0
    }, { spaces: 2 });
    
    // Update database info
    dbInfo.collections.push(name);
    await fs.writeJson(DB_INFO_FILE, dbInfo, { spaces: 2 });
    
    return { name, created: new Date().toISOString(), documentCount: 0 };
  } catch (error) {
    console.error(`Error creating collection "${name}":`, error);
    throw error;
  }
}

// List all collections
async function listCollections() {
  try {
    const dbInfo = await getDBInfo();
    return Promise.all(dbInfo.collections.map(async name => {
      const metadataFile = path.join(COLLECTIONS_DIR, name, 'metadata.json');
      return await fs.readJson(metadataFile);
    }));
  } catch (error) {
    console.error('Error listing collections:', error);
    throw error;
  }
}

// Delete a collection
async function deleteCollection(name) {
  try {
    // Check if collection exists
    const dbInfo = await getDBInfo();
    if (!dbInfo.collections.includes(name)) {
      throw new Error(`Collection "${name}" does not exist`);
    }
    
    // Delete collection directory
    const collectionDir = path.join(COLLECTIONS_DIR, name);
    await fs.remove(collectionDir);
    
    // Delete collection indexes
    await deleteCollectionIndexes(name);
    
    // Update database info
    dbInfo.collections = dbInfo.collections.filter(c => c !== name);
    await fs.writeJson(DB_INFO_FILE, dbInfo, { spaces: 2 });
    
    return { deleted: true, name };
  } catch (error) {
    console.error(`Error deleting collection "${name}":`, error);
    throw error;
  }
}

// Insert a document into a collection
async function insertDocument(collectionName, document) {
  try {
    // Check if collection exists
    const dbInfo = await getDBInfo();
    if (!dbInfo.collections.includes(collectionName)) {
      throw new Error(`Collection "${collectionName}" does not exist`);
    }
    
    // Generate ID if not provided
    const id = document._id || uuidv4();
    const documentWithId = { ...document, _id: id };
    
    // Write document to file
    const collectionDir = path.join(COLLECTIONS_DIR, collectionName);
    const documentFile = path.join(collectionDir, `${id}.json`);
    await fs.writeJson(documentFile, documentWithId, { spaces: 2 });
    
    // Update collection metadata
    const metadataFile = path.join(collectionDir, 'metadata.json');
    const metadata = await fs.readJson(metadataFile);
    metadata.documentCount++;
    await fs.writeJson(metadataFile, metadata, { spaces: 2 });
    
    // Update indexes
    const indexes = await listIndexes(collectionName);
    for (const index of indexes) {
      await updateIndexForDocument(collectionName, index.field, documentWithId);
    }
    
    return documentWithId;
  } catch (error) {
    console.error(`Error inserting document into "${collectionName}":`, error);
    throw error;
  }
}

// Find documents in a collection
async function findDocuments(collectionName, query = {}) {
  try {
    // Check if collection exists
    const dbInfo = await getDBInfo();
    if (!dbInfo.collections.includes(collectionName)) {
      throw new Error(`Collection "${collectionName}" does not exist`);
    }
    
    // Read all documents
    const collectionDir = path.join(COLLECTIONS_DIR, collectionName);
    const files = await fs.readdir(collectionDir);
    
    // Filter out metadata file
    const documentFiles = files.filter(file => file !== 'metadata.json');
    
    // Read all documents
    const documents = await Promise.all(
      documentFiles.map(async file => {
        const filePath = path.join(collectionDir, file);
        return await fs.readJson(filePath);
      })
    );
    
    // Use indexing to accelerate the query if possible
    const filteredDocuments = await queryWithIndex(collectionName, query, documents);
    
    // If the index didn't filter (or we used a basic index), apply additional filters
    if (Object.keys(query).length > 0) {
      return filteredDocuments.filter(doc => {
        return Object.keys(query).every(key => {
          if (typeof query[key] === 'object' && query[key] !== null) {
            // Handle operators
            const operators = query[key];
            return Object.keys(operators).every(op => {
              switch (op) {
                case '$eq': return doc[key] === operators[op];
                case '$ne': return doc[key] !== operators[op];
                case '$gt': return doc[key] > operators[op];
                case '$gte': return doc[key] >= operators[op];
                case '$lt': return doc[key] < operators[op];
                case '$lte': return doc[key] <= operators[op];
                default: return false;
              }
            });
          } else {
            // Simple equality check
            return doc[key] === query[key];
          }
        });
      });
    }
    
    return filteredDocuments;
  } catch (error) {
    console.error(`Error finding documents in "${collectionName}":`, error);
    throw error;
  }
}

// Update a document in a collection
async function updateDocument(collectionName, id, update) {
  try {
    // Check if collection exists
    const dbInfo = await getDBInfo();
    if (!dbInfo.collections.includes(collectionName)) {
      throw new Error(`Collection "${collectionName}" does not exist`);
    }
    
    // Read document
    const collectionDir = path.join(COLLECTIONS_DIR, collectionName);
    const documentFile = path.join(collectionDir, `${id}.json`);
    
    if (!await fs.pathExists(documentFile)) {
      throw new Error(`Document with ID "${id}" not found in collection "${collectionName}"`);
    }
    
    const document = await fs.readJson(documentFile);
    
    // Apply updates
    const updatedDocument = { ...document };
    
    if (update.$set) {
      Object.keys(update.$set).forEach(key => {
        updatedDocument[key] = update.$set[key];
      });
    }
    
    if (update.$unset) {
      Object.keys(update.$unset).forEach(key => {
        delete updatedDocument[key];
      });
    }
    
    // Write updated document
    await fs.writeJson(documentFile, updatedDocument, { spaces: 2 });
    
    // Update indexes
    const indexes = await listIndexes(collectionName);
    for (const index of indexes) {
      await updateIndexForDocument(collectionName, index.field, updatedDocument);
    }
    
    return updatedDocument;
  } catch (error) {
    console.error(`Error updating document in "${collectionName}":`, error);
    throw error;
  }
}

// Delete a document from a collection
async function deleteDocument(collectionName, id) {
  try {
    // Check if collection exists
    const dbInfo = await getDBInfo();
    if (!dbInfo.collections.includes(collectionName)) {
      throw new Error(`Collection "${collectionName}" does not exist`);
    }
    
    // Delete document file
    const collectionDir = path.join(COLLECTIONS_DIR, collectionName);
    const documentFile = path.join(collectionDir, `${id}.json`);
    
    if (!await fs.pathExists(documentFile)) {
      throw new Error(`Document with ID "${id}" not found in collection "${collectionName}"`);
    }
    
    // Remove document from indexes before deleting it
    await removeDocumentFromIndexes(collectionName, id);
    
    // Delete the file
    await fs.unlink(documentFile);
    
    // Update collection metadata
    const metadataFile = path.join(collectionDir, 'metadata.json');
    const metadata = await fs.readJson(metadataFile);
    metadata.documentCount--;
    await fs.writeJson(metadataFile, metadata, { spaces: 2 });
    
    return { deleted: true, _id: id };
  } catch (error) {
    console.error(`Error deleting document from "${collectionName}":`, error);
    throw error;
  }
}

// Helper function to list indexes (for internal use)
async function listIndexes(collectionName) {
  try {
    const { listIndexes } = require('../indexes/indexManager');
    return await listIndexes(collectionName);
  } catch (error) {
    console.error(`Error listing indexes for "${collectionName}":`, error);
    return [];
  }
}

module.exports = {
  initDB,
  getDBInfo,
  createCollection,
  listCollections,
  deleteCollection,
  insertDocument,
  findDocuments,
  updateDocument,
  deleteDocument
}; 