const fs = require('fs-extra');
const path = require('path');
const _ = require('lodash');

// Configuration
const INDEXES_DIR = path.join(__dirname, '../../data/indexes');

// Initialize index system
async function initIndexes() {
  try {
    await fs.ensureDir(INDEXES_DIR);
    console.log('Index system initialized');
  } catch (error) {
    console.error('Error initializing index system:', error);
    throw error;
  }
}

// Create index file path
function getIndexFilePath(collectionName, field) {
  return path.join(INDEXES_DIR, `${collectionName}_${field}.json`);
}

// Create or update index
async function createIndex(collectionName, field, documents) {
  try {
    const indexFilePath = getIndexFilePath(collectionName, field);
    
    // Create index structure
    const index = {};
    
    // Process all documents
    documents.forEach(doc => {
      const fieldValue = _.get(doc, field);
      
      if (fieldValue !== undefined) {
        // Convert value to string for consistent key usage
        const valueKey = JSON.stringify(fieldValue);
        
        // Create array for this value if it doesn't exist
        if (!index[valueKey]) {
          index[valueKey] = [];
        }
        
        // Add document ID to the index
        index[valueKey].push(doc._id);
      }
    });
    
    // Save index to file
    await fs.writeJson(indexFilePath, {
      collectionName,
      field,
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      index
    }, { spaces: 2 });
    
    return { created: true, collectionName, field };
  } catch (error) {
    console.error(`Error creating index for ${collectionName}.${field}:`, error);
    throw error;
  }
}

// Get index details
async function getIndex(collectionName, field) {
  try {
    const indexFilePath = getIndexFilePath(collectionName, field);
    
    if (!await fs.pathExists(indexFilePath)) {
      return null;
    }
    
    return await fs.readJson(indexFilePath);
  } catch (error) {
    console.error(`Error reading index for ${collectionName}.${field}:`, error);
    throw error;
  }
}

// List all indexes for a collection
async function listIndexes(collectionName) {
  try {
    const files = await fs.readdir(INDEXES_DIR);
    
    // Filter files for this collection
    const collectionIndexFiles = files.filter(file => 
      file.startsWith(`${collectionName}_`) && file.endsWith('.json')
    );
    
    // Read all index files
    const indexes = await Promise.all(
      collectionIndexFiles.map(async file => {
        const filePath = path.join(INDEXES_DIR, file);
        return await fs.readJson(filePath);
      })
    );
    
    return indexes;
  } catch (error) {
    console.error(`Error listing indexes for ${collectionName}:`, error);
    throw error;
  }
}

// Delete an index
async function deleteIndex(collectionName, field) {
  try {
    const indexFilePath = getIndexFilePath(collectionName, field);
    
    if (!await fs.pathExists(indexFilePath)) {
      throw new Error(`Index for ${collectionName}.${field} does not exist`);
    }
    
    await fs.unlink(indexFilePath);
    
    return { deleted: true, collectionName, field };
  } catch (error) {
    console.error(`Error deleting index for ${collectionName}.${field}:`, error);
    throw error;
  }
}

// Update index for a single document (add or update)
async function updateIndexForDocument(collectionName, field, document) {
  try {
    const indexFilePath = getIndexFilePath(collectionName, field);
    
    if (!await fs.pathExists(indexFilePath)) {
      // Index doesn't exist, nothing to update
      return { updated: false };
    }
    
    const indexData = await fs.readJson(indexFilePath);
    const index = indexData.index;
    
    // Get the field value
    const fieldValue = _.get(document, field);
    
    if (fieldValue === undefined) {
      return { updated: false };
    }
    
    // Convert value to string for consistent key usage
    const valueKey = JSON.stringify(fieldValue);
    
    // Remove document ID from any existing lists
    Object.keys(index).forEach(key => {
      index[key] = index[key].filter(id => id !== document._id);
      
      // Remove empty arrays
      if (index[key].length === 0) {
        delete index[key];
      }
    });
    
    // Add document ID to the index
    if (!index[valueKey]) {
      index[valueKey] = [];
    }
    index[valueKey].push(document._id);
    
    // Update the index
    indexData.updated = new Date().toISOString();
    await fs.writeJson(indexFilePath, indexData, { spaces: 2 });
    
    return { updated: true, collectionName, field };
  } catch (error) {
    console.error(`Error updating index for ${collectionName}.${field} for document:`, error);
    throw error;
  }
}

// Remove document from all indexes
async function removeDocumentFromIndexes(collectionName, documentId) {
  try {
    const files = await fs.readdir(INDEXES_DIR);
    
    // Filter files for this collection
    const collectionIndexFiles = files.filter(file => 
      file.startsWith(`${collectionName}_`) && file.endsWith('.json')
    );
    
    // Update each index
    await Promise.all(
      collectionIndexFiles.map(async file => {
        const filePath = path.join(INDEXES_DIR, file);
        const indexData = await fs.readJson(filePath);
        let updated = false;
        
        // Remove document ID from any existing lists
        Object.keys(indexData.index).forEach(key => {
          const originalLength = indexData.index[key].length;
          indexData.index[key] = indexData.index[key].filter(id => id !== documentId);
          
          // Check if array changed
          if (originalLength !== indexData.index[key].length) {
            updated = true;
          }
          
          // Remove empty arrays
          if (indexData.index[key].length === 0) {
            delete indexData.index[key];
          }
        });
        
        // Save if changes were made
        if (updated) {
          indexData.updated = new Date().toISOString();
          await fs.writeJson(filePath, indexData, { spaces: 2 });
        }
      })
    );
    
    return { removed: true, collectionName, documentId };
  } catch (error) {
    console.error(`Error removing document ${documentId} from indexes for ${collectionName}:`, error);
    throw error;
  }
}

// Query using index
async function queryWithIndex(collectionName, query, documents) {
  try {
    // Simple case: no query
    if (Object.keys(query).length === 0) {
      return documents;
    }
    
    // Get the first query field that has an index
    const queryFields = Object.keys(query);
    let indexedField = null;
    let indexData = null;
    
    // Find a usable index
    for (const field of queryFields) {
      const index = await getIndex(collectionName, field);
      if (index) {
        indexedField = field;
        indexData = index;
        break;
      }
    }
    
    // If no usable index, return all documents (to be filtered later)
    if (!indexedField) {
      return documents;
    }
    
    // Get the query value
    const queryValue = query[indexedField];
    
    // Get matching document IDs from index
    let matchingIds = [];
    
    if (typeof queryValue === 'object' && queryValue !== null) {
      // Handle operators
      const operators = queryValue;
      
      Object.keys(operators).forEach(op => {
        const operatorValue = operators[op];
        const operatorValueKey = JSON.stringify(operatorValue);
        
        // Filter index keys based on operator
        const matchingKeys = Object.keys(indexData.index).filter(key => {
          const value = JSON.parse(key);
          switch (op) {
            case '$eq': return key === operatorValueKey;
            case '$ne': return key !== operatorValueKey;
            case '$gt': return value > operatorValue;
            case '$gte': return value >= operatorValue;
            case '$lt': return value < operatorValue;
            case '$lte': return value <= operatorValue;
            default: return false;
          }
        });
        
        // Get all document IDs for matching keys
        const idsForOperator = matchingKeys.flatMap(key => indexData.index[key]);
        
        // For first operator, set the matching IDs
        // For subsequent operators, filter the existing matches
        if (matchingIds.length === 0) {
          matchingIds = idsForOperator;
        } else {
          matchingIds = matchingIds.filter(id => idsForOperator.includes(id));
        }
      });
    } else {
      // Simple equality check
      const valueKey = JSON.stringify(queryValue);
      matchingIds = indexData.index[valueKey] || [];
    }
    
    // Get documents by ID
    const matchingDocuments = documents.filter(doc => matchingIds.includes(doc._id));
    
    return matchingDocuments;
  } catch (error) {
    console.error(`Error querying with index for ${collectionName}:`, error);
    // Fall back to full scan
    return documents;
  }
}

// Delete all indexes for a collection
async function deleteCollectionIndexes(collectionName) {
  try {
    const files = await fs.readdir(INDEXES_DIR);
    
    // Filter files for this collection
    const collectionIndexFiles = files.filter(file => 
      file.startsWith(`${collectionName}_`) && file.endsWith('.json')
    );
    
    // Delete each index file
    await Promise.all(
      collectionIndexFiles.map(async file => {
        const filePath = path.join(INDEXES_DIR, file);
        await fs.unlink(filePath);
      })
    );
    
    return { deleted: true, collectionName, count: collectionIndexFiles.length };
  } catch (error) {
    console.error(`Error deleting indexes for ${collectionName}:`, error);
    throw error;
  }
}

module.exports = {
  initIndexes,
  createIndex,
  getIndex,
  listIndexes,
  deleteIndex,
  updateIndexForDocument,
  removeDocumentFromIndexes,
  queryWithIndex,
  deleteCollectionIndexes
}; 