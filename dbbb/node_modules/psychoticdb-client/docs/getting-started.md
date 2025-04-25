# Getting Started with PsychoticDB

This guide will help you get up and running with the PsychoticDB client library.

## Installation

Install the PsychoticDB client library using npm:

```bash
npm install psychoticdb-client
```

Or using yarn:

```bash
yarn add psychoticdb-client
```

## Basic Setup

Here's a simple example to connect to a PsychoticDB server:

```javascript
const { PsychoticDBClient } = require('psychoticdb-client');

// Create a client instance
const client = new PsychoticDBClient('mongodb://localhost:27017', {
  maxPoolSize: 10,
  connectTimeout: 5000
});

// Connect to the database
async function connectToDatabase() {
  try {
    await client.connect();
    console.log('Connected to PsychoticDB server');
    
    // Perform operations...
    
    // Don't forget to close the connection when done
    await client.disconnect();
    console.log('Disconnected from PsychoticDB server');
  } catch (error) {
    console.error('Error:', error);
  }
}

connectToDatabase();
```

## Basic CRUD Operations

### Creating Documents

```javascript
async function createDocuments() {
  try {
    await client.connect();
    
    // Insert a single document
    const result1 = await client.insertOne('users', {
      name: 'John Doe',
      email: 'john@example.com',
      age: 30
    });
    console.log('Inserted document with ID:', result1.insertedId);
    
    // Insert multiple documents
    const result2 = await client.insertMany('users', [
      { name: 'Jane Smith', email: 'jane@example.com', age: 25 },
      { name: 'Bob Johnson', email: 'bob@example.com', age: 35 }
    ]);
    console.log('Inserted documents with IDs:', result2.insertedIds);
    
    await client.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}
```

### Reading Documents

```javascript
async function readDocuments() {
  try {
    await client.connect();
    
    // Find a single document
    const user = await client.findOne('users', { email: 'john@example.com' });
    console.log('Found user:', user);
    
    // Find multiple documents
    const users = await client.find('users', { age: { $gt: 20 } }, {
      projection: { name: 1, email: 1, _id: 0 },
      sort: { name: 1 },
      limit: 10
    });
    console.log('Found users:', users);
    
    // Count documents
    const count = await client.countDocuments('users', { age: { $gt: 20 } });
    console.log('Number of users over 20:', count);
    
    await client.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}
```

### Updating Documents

```javascript
async function updateDocuments() {
  try {
    await client.connect();
    
    // Update a single document
    const result1 = await client.updateOne('users', 
      { email: 'john@example.com' },
      { $set: { status: 'active' }, $inc: { loginCount: 1 } }
    );
    console.log('Updated documents:', result1.modifiedCount);
    
    // Update multiple documents
    const result2 = await client.updateMany('users', 
      { age: { $lt: 30 } },
      { $set: { group: 'young' } }
    );
    console.log('Updated documents:', result2.modifiedCount);
    
    await client.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}
```

### Deleting Documents

```javascript
async function deleteDocuments() {
  try {
    await client.connect();
    
    // Delete a single document
    const result1 = await client.deleteOne('users', { email: 'john@example.com' });
    console.log('Deleted documents:', result1.deletedCount);
    
    // Delete multiple documents
    const result2 = await client.deleteMany('users', { status: 'inactive' });
    console.log('Deleted documents:', result2.deletedCount);
    
    await client.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}
```

## Working with Collections

```javascript
async function manageCollections() {
  try {
    await client.connect();
    
    // List all collections
    const collections = await client.listCollections();
    console.log('Collections:', collections);
    
    // Create a new collection with validation
    await client.createCollection('products', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['name', 'price'],
          properties: {
            name: { bsonType: 'string' },
            price: { bsonType: 'number', minimum: 0 },
            category: { bsonType: 'string' }
          }
        }
      }
    });
    console.log('Created products collection');
    
    // Rename a collection
    await client.renameCollection('users', 'customers');
    console.log('Renamed users collection to customers');
    
    // Drop a collection
    await client.dropCollection('old_collection');
    console.log('Dropped old_collection');
    
    await client.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}
```

## Working with Indexes

```javascript
async function manageIndexes() {
  try {
    await client.connect();
    
    // Create a simple index
    await client.createIndex('users', { email: 1 }, { unique: true });
    console.log('Created index on email field');
    
    // Create a compound index
    await client.createIndex('users', { firstName: 1, lastName: 1 });
    console.log('Created compound index on name fields');
    
    // List all indexes
    const indexes = await client.listIndexes('users');
    console.log('Indexes:', indexes);
    
    // Drop an index
    await client.dropIndex('users', 'email_1');
    console.log('Dropped email index');
    
    await client.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}
```

## Error Handling

```javascript
async function demonstrateErrorHandling() {
  try {
    await client.connect();
    
    // This will fail if a user with this email already exists
    // and we have a unique index on the email field
    await client.insertOne('users', {
      name: 'Duplicate User',
      email: 'john@example.com'  // Assuming this exists already
    });
    
  } catch (error) {
    if (error instanceof PsychoticDBClient.OperationError) {
      console.error('Operation failed:', error.message);
      // Handle specific operation error
    } else if (error instanceof PsychoticDBClient.ValidationError) {
      console.error('Validation failed:', error.message);
      // Handle validation error
    } else {
      console.error('Unexpected error:', error);
    }
  } finally {
    await client.disconnect();
  }
}
```

## Connection Management

```javascript
// Connection pool configuration
const client = new PsychoticDBClient('mongodb://localhost:27017', {
  maxPoolSize: 20,          // Maximum number of connections
  connectTimeout: 3000,     // Connection timeout in milliseconds
  socketTimeout: 5000,      // Socket timeout in milliseconds
  retryWrites: true,        // Automatically retry write operations
  retryReads: true,         // Automatically retry read operations
  maxRetries: 3             // Maximum number of retries
});

// Check connection status
async function checkConnection() {
  try {
    await client.connect();
    
    const isConnected = client.isConnected();
    console.log('Connection status:', isConnected ? 'Connected' : 'Disconnected');
    
    await client.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}
```

## Authentication

```javascript
async function authenticateUser() {
  try {
    await client.connect();
    
    // Authenticate with username and password
    await client.authenticate('admin', 'password');
    console.log('Authentication successful');
    
    // Perform operations as authenticated user...
    
    // Logout when done
    await client.logout();
    console.log('Logged out');
    
    await client.disconnect();
  } catch (error) {
    if (error instanceof PsychoticDBClient.AuthenticationError) {
      console.error('Authentication failed:', error.message);
    } else {
      console.error('Error:', error);
    }
  }
}
```

## Next Steps

After learning these basics, you might want to explore:

1. [Advanced Features](./advanced-features.md) - Learn about transactions, aggregation, and more
2. [API Reference](./api-reference.md) - Comprehensive API documentation
3. [Best Practices](./best-practices.md) - Guidelines for optimal usage

For further assistance, join our community or contact support. 