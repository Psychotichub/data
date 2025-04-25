# PsychoticDB Client Library

A powerful client library for interacting with PsychoticDB, a high-performance document database.

## Installation

```bash
npm install psychoticdb-client
```

## Quick Start

```javascript
const PsychoticDBClient = require('psychoticdb-client');

async function quickExample() {
  const client = new PsychoticDBClient('http://localhost:3000');
  
  try {
    // Authentication
    await client.login('user', 'password');
    
    // Create a collection
    await client.createCollection('tasks');
    
    // Insert a document
    const task = await client.insertDocument('tasks', {
      title: 'Learn PsychoticDB',
      completed: false,
      priority: 'high'
    });
    
    console.log('Inserted task:', task);
    
    // Query documents
    const tasks = await client.getDocuments('tasks', { completed: false });
    console.log('Pending tasks:', tasks);
    
    // Logout when done
    await client.logout();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

quickExample();
```

## Features

- **Simple API**: Easy-to-use methods for common database operations
- **Advanced Querying**: Complex query capabilities including filters, projections, and sorting
- **Aggregation Pipeline**: Powerful data transformation and analysis
- **Transactions**: ACID-compliant transaction support
- **Change Streams**: Real-time notifications for data changes
- **Schema Validation**: Enforce document structure with JSON Schema
- **Authentication**: Secure access to your database
- **Performance Optimization**: Indexing and query optimization tools
- **Error Handling**: Robust error handling with detailed information

## Documentation

### Basic Operations

#### Connection and Authentication

```javascript
// Create a client instance
const client = new PsychoticDBClient('http://localhost:3000');

// Login with credentials
await client.login('username', 'password');

// Check connection status
const status = await client.getStatus();

// Logout when done
await client.logout();
```

#### Collections

```javascript
// Create a collection
await client.createCollection('users');

// List all collections
const collections = await client.listCollections();

// Drop a collection
await client.dropCollection('users');
```

#### Document Operations

```javascript
// Insert a document
const doc = await client.insertDocument('users', { name: 'John', age: 30 });

// Insert multiple documents
const docs = await client.insertDocuments('users', [
  { name: 'Jane', age: 25 },
  { name: 'Bob', age: 40 }
]);

// Find documents with a query
const youngUsers = await client.getDocuments('users', { age: { $lt: 30 } });

// Get a single document by ID
const user = await client.getDocument('users', 'document_id');

// Update a document
await client.updateDocument('users', 'document_id', { 
  $set: { status: 'active' } 
});

// Replace an entire document
await client.replaceDocument('users', 'document_id', { 
  name: 'John', 
  age: 31, 
  status: 'active' 
});

// Delete a document
await client.deleteDocument('users', 'document_id');
```

### Advanced Features

#### Indexing

```javascript
// Create an index on a field
await client.createIndex('users', { email: 1 });

// Create a compound index
await client.createIndex('users', { lastName: 1, firstName: 1 });

// Create a text index
await client.createIndex('products', { description: 'text' });

// Get all indexes on a collection
const indexes = await client.getIndexes('users');

// Drop an index
await client.dropIndex('users', 'email_1');
```

#### Aggregation

```javascript
// Run an aggregation pipeline
const results = await client.aggregate('orders', [
  { $match: { status: 'completed' } },
  { $group: { 
    _id: '$customer', 
    totalSpent: { $sum: '$amount' } 
  }},
  { $sort: { totalSpent: -1 } }
]);
```

#### Transactions

```javascript
// Start a transaction
await client.beginTransaction();

try {
  // Perform operations within the transaction
  await client.updateDocument('accounts', account1Id, { $inc: { balance: -100 } });
  await client.updateDocument('accounts', account2Id, { $inc: { balance: 100 } });
  
  // Commit the transaction
  await client.commitTransaction();
} catch (error) {
  // Roll back on error
  await client.abortTransaction();
  throw error;
}
```

#### Change Streams

```javascript
// Watch for changes in a collection
const changeStream = await client.watch('users');

// Set up change handlers
changeStream.on('change', change => {
  console.log('Document changed:', change);
});

// Close the change stream when done
changeStream.close();
```

## Examples

Check out the examples directory for more detailed usage examples:

- [Basic Usage](src/client/examples/basic-usage.js) - Fundamental operations for beginners
- [Advanced Usage](src/client/examples/advanced-usage.js) - Complex querying, aggregation, and more

## Error Handling

The client provides detailed error information:

```javascript
try {
  await client.getDocument('users', 'invalid_id');
} catch (error) {
  if (error.name === 'DocumentNotFoundError') {
    console.log('Document not found');
  } else if (error.name === 'AuthenticationError') {
    console.log('Authentication failed');
  } else {
    console.error('Unexpected error:', error.message);
  }
}
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. 