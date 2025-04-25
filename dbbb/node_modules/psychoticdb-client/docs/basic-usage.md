# PsychoticDB Client Basic Usage Guide

This guide demonstrates the fundamental operations of the PsychoticDB client library.

## Importing the Client

```javascript
const PsychoticDBClient = require('psychotic-db-client');
```

## Establishing a Connection

Initialize the client with your database server URL:

```javascript
const client = new PsychoticDBClient('http://localhost:3000');
```

## Authentication

### Connecting to the Database

```javascript
await client.connect();
```

### User Authentication

```javascript
const isAuthenticated = await client.authenticate('username', 'password');
if (isAuthenticated) {
  console.log('Authentication successful');
} else {
  console.log('Authentication failed');
}
```

## Working with Collections

### Creating a Collection

```javascript
const collectionCreated = await client.createCollection('users');
if (collectionCreated) {
  console.log('Collection created successfully');
}
```

### Checking if a Collection Exists

```javascript
const exists = await client.collectionExists('users');
console.log('Collection exists:', exists);
```

## Document Operations

### Inserting Documents

Insert a single document:

```javascript
const user = {
  name: 'John Doe',
  email: 'john@example.com',
  age: 30
};

const insertedId = await client.insertOne('users', user);
console.log('Inserted document with ID:', insertedId);
```

Insert multiple documents:

```javascript
const users = [
  { name: 'Jane Smith', email: 'jane@example.com', age: 28 },
  { name: 'Bob Johnson', email: 'bob@example.com', age: 35 }
];

const insertedIds = await client.insertMany('users', users);
console.log('Inserted documents with IDs:', insertedIds);
```

### Querying Documents

Find a single document:

```javascript
const query = { name: 'John Doe' };
const user = await client.findOne('users', query);
console.log('Found user:', user);
```

Find multiple documents:

```javascript
const query = { age: { $gt: 25 } };
const users = await client.find('users', query);
console.log('Found users:', users);
```

### Updating Documents

Update a single document:

```javascript
const filter = { name: 'John Doe' };
const update = { $set: { age: 31 } };
const updated = await client.updateOne('users', filter, update);
console.log('Updated document count:', updated);
```

Update multiple documents:

```javascript
const filter = { age: { $lt: 30 } };
const update = { $set: { status: 'active' } };
const updated = await client.updateMany('users', filter, update);
console.log('Updated documents count:', updated);
```

### Deleting Documents

Delete a single document:

```javascript
const filter = { name: 'John Doe' };
const deleted = await client.deleteOne('users', filter);
console.log('Deleted document count:', deleted);
```

Delete multiple documents:

```javascript
const filter = { age: { $gt: 30 } };
const deleted = await client.deleteMany('users', filter);
console.log('Deleted documents count:', deleted);
```

### Counting Documents

```javascript
const count = await client.countDocuments('users');
console.log('Total users:', count);

const activeCount = await client.countDocuments('users', { status: 'active' });
console.log('Active users:', activeCount);
```

### Checking Document Existence

```javascript
const exists = await client.documentExists('users', { email: 'john@example.com' });
console.log('Document exists:', exists);
```

## Collection Management

### Dropping a Collection

```javascript
const dropped = await client.dropCollection('users');
if (dropped) {
  console.log('Collection dropped successfully');
}
```

## Closing the Connection

Always close the connection when you're done:

```javascript
await client.logout();
console.log('Logged out and closed connection');
```

## Complete Example

Here's a complete example that demonstrates the basic operations:

```javascript
const PsychoticDBClient = require('psychotic-db-client');

async function runBasicExample() {
  const client = new PsychoticDBClient('http://localhost:3000');
  
  try {
    // Connect to the database
    await client.connect();
    console.log('Connected to the database');
    
    // Authenticate user
    const isAuthenticated = await client.authenticate('admin', 'password123');
    console.log('Authentication successful:', isAuthenticated);
    
    // Create a collection
    const collectionCreated = await client.createCollection('users');
    console.log('Collection created:', collectionCreated);
    
    // Insert a document
    const user = { name: 'John Doe', email: 'john@example.com', age: 30 };
    const insertedId = await client.insertOne('users', user);
    console.log('Inserted document with ID:', insertedId);
    
    // Insert multiple documents
    const users = [
      { name: 'Jane Smith', email: 'jane@example.com', age: 28 },
      { name: 'Bob Johnson', email: 'bob@example.com', age: 35 }
    ];
    const insertedIds = await client.insertMany('users', users);
    console.log('Inserted documents with IDs:', insertedIds);
    
    // Find documents
    const query = { age: { $gt: 25 } };
    const foundUsers = await client.find('users', query);
    console.log('Found users:', foundUsers);
    
    // Update a document
    const filter = { name: 'John Doe' };
    const update = { $set: { age: 31 } };
    const updated = await client.updateOne('users', filter, update);
    console.log('Updated document count:', updated);
    
    // Delete a document
    const deleteFilter = { name: 'Bob Johnson' };
    const deleted = await client.deleteOne('users', deleteFilter);
    console.log('Deleted document count:', deleted);
    
    // Count remaining documents
    const count = await client.countDocuments('users');
    console.log('Remaining documents:', count);
    
    // Drop the collection
    const dropped = await client.dropCollection('users');
    console.log('Collection dropped:', dropped);
    
    // Logout
    await client.logout();
    console.log('Logged out successfully');
  } catch (error) {
    console.error('Error:', error);
  }
}

runBasicExample();
```

For more advanced usage, refer to the [Advanced Features Guide](./advanced-features.md) and the [API Reference](./api-reference.md). 