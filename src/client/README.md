# PsychoticDB JavaScript Client

A lightweight JavaScript client library for interacting with PsychoticDB from both Node.js and browser environments.

## Installation

### Node.js

```bash
npm install psychoticdb-client
```

### Browser

```html
<script src="path/to/psychoticdb-client.js"></script>
```

## Basic Usage

```javascript
// Create a client instance
const client = new PsychoticDBClient('https://your-db-server.com');

// Authentication
await client.login('username', 'password');

// Working with collections
const collections = await client.getCollections();
await client.createCollection('users');

// Working with documents
const user = await client.insertDocument('users', {
  name: 'John Doe',
  email: 'john@example.com'
});

// Query documents
const users = await client.getDocuments('users', { name: 'John Doe' });

// Update a document
await client.updateDocument('users', user._id, { 
  $set: { lastLogin: new Date() } 
});

// Delete a document
await client.deleteDocument('users', user._id);

// Working with indexes
await client.createIndex('users', 'email');

// Aggregation
const result = await client.aggregate('users', [
  { $match: { active: true } },
  { $group: { _id: '$role', count: { $sum: 1 } } }
]);

// Backup (Admin only)
await client.createBackup('my-backup');
```

## API Reference

### Authentication

- `login(username, password)` - Authenticate with username and password
- `logout()` - Clear authentication token
- `getCurrentUser()` - Get the currently logged-in user

### Collections

- `getCollections()` - List all collections
- `createCollection(name)` - Create a new collection
- `deleteCollection(name)` - Delete a collection

### Documents

- `getDocuments(collection, query, options)` - Query documents
- `getDocumentById(collection, id)` - Get a document by ID
- `insertDocument(collection, document)` - Insert a new document
- `updateDocument(collection, id, update)` - Update a document
- `deleteDocument(collection, id)` - Delete a document

### Indexes

- `getIndexes(collection)` - List indexes on a collection
- `createIndex(collection, field, options)` - Create an index
- `deleteIndex(collection, indexName)` - Delete an index

### Aggregation

- `aggregate(collection, pipeline)` - Run an aggregation pipeline

### Backup (Admin only)

- `getBackups()` - List all backups
- `createBackup(name)` - Create a new backup
- `restoreBackup(filename)` - Restore from a backup
- `deleteBackup(filename)` - Delete a backup

## Error Handling

The client throws errors with descriptive messages when API requests fail. Always wrap calls in try/catch blocks:

```javascript
try {
  await client.createCollection('users');
} catch (error) {
  console.error('Failed to create collection:', error.message);
}
```

## Browser Support

The client works in all modern browsers. For older browsers, you may need to use a polyfill for fetch.

## Examples

Check the `examples` directory for more usage examples. 