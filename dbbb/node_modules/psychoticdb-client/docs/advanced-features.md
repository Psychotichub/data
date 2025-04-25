# PsychoticDB Client Advanced Features Guide

This guide covers advanced usage patterns and features of the PsychoticDB client library.

## Transactions

The PsychoticDB client supports atomic transactions for operations that need to be executed as a single unit.

```javascript
const client = new PsychoticDBClient('http://localhost:3000');
await client.connect();

// Start a transaction
const transaction = client.beginTransaction();

try {
  // Perform operations within the transaction
  await transaction.insertOne('accounts', { owner: 'Alice', balance: 1000 });
  await transaction.updateOne('accounts', { owner: 'Bob' }, { $inc: { balance: -500 } });
  await transaction.updateOne('accounts', { owner: 'Alice' }, { $inc: { balance: 500 } });
  
  // Commit the transaction if all operations succeed
  await transaction.commit();
  console.log('Transaction committed successfully');
} catch (error) {
  // Rollback the transaction on error
  await transaction.rollback();
  console.error('Transaction rolled back:', error);
}
```

## Indexing

### Creating Indexes

Create indexes to improve query performance:

```javascript
// Create a simple index
await client.createIndex('users', { email: 1 });

// Create a compound index
await client.createIndex('products', { category: 1, price: -1 });

// Create a unique index
await client.createIndex('users', { username: 1 }, { unique: true });

// Create a TTL (Time-To-Live) index
await client.createIndex('sessions', { createdAt: 1 }, { expireAfterSeconds: 3600 });
```

### Listing Indexes

```javascript
const indexes = await client.listIndexes('users');
console.log('Indexes:', indexes);
```

### Dropping Indexes

```javascript
// Drop a specific index
await client.dropIndex('users', 'email_1');

// Drop all indexes
await client.dropAllIndexes('users');
```

## Aggregation Pipeline

Perform complex data transformations using the aggregation pipeline:

```javascript
const pipeline = [
  { $match: { status: 'active' } },
  { $group: { _id: '$category', count: { $sum: 1 }, avgPrice: { $avg: '$price' } } },
  { $sort: { count: -1 } }
];

const results = await client.aggregate('products', pipeline);
console.log('Aggregation results:', results);
```

## Document Validation

Define validation rules for documents in a collection:

```javascript
const validationRules = {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'email', 'age'],
      properties: {
        name: {
          bsonType: 'string',
          description: 'must be a string and is required'
        },
        email: {
          bsonType: 'string',
          pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
          description: 'must be a valid email address and is required'
        },
        age: {
          bsonType: 'int',
          minimum: 18,
          maximum: 99,
          description: 'must be an integer between 18 and 99 and is required'
        }
      }
    }
  },
  validationLevel: 'strict',
  validationAction: 'error'
};

await client.createCollection('validated_users', validationRules);
```

## Projections

Retrieve only specific fields from documents:

```javascript
const query = { status: 'active' };
const projection = { name: 1, email: 1, _id: 0 }; // Include name and email, exclude _id
const users = await client.find('users', query, { projection });
```

## Cursor Methods

Work with cursors for fine-grained control over result sets:

```javascript
// Create a cursor
const cursor = await client.createCursor('products');

// Skip and limit results
cursor.skip(10).limit(5);

// Sort results
cursor.sort({ price: -1 });

// Iterate through results
while (await cursor.hasNext()) {
  const product = await cursor.next();
  console.log(product);
}

// Close the cursor when done
await cursor.close();
```

## Bulk Operations

Perform multiple operations efficiently in a batch:

```javascript
const bulk = client.initBulkOp('users');

// Add operations to the bulk
bulk.insert({ name: 'User 1', email: 'user1@example.com' });
bulk.insert({ name: 'User 2', email: 'user2@example.com' });
bulk.update({ name: 'Existing User' }, { $set: { status: 'active' } });
bulk.delete({ status: 'inactive' });

// Execute all operations
const results = await bulk.execute();
console.log('Bulk operation results:', results);
```

## Query Operators

Use advanced query operators for complex queries:

```javascript
// Find users between ages 25 and 35
const users = await client.find('users', {
  age: { $gte: 25, $lte: 35 }
});

// Find products with specific tags
const products = await client.find('products', {
  tags: { $in: ['electronics', 'sale'] }
});

// Find users with regex pattern matching
const users = await client.find('users', {
  email: { $regex: /gmail\.com$/ }
});

// Find documents with array conditions
const posts = await client.find('posts', {
  comments: { $size: 5 },
  likes: { $gt: 10 }
});
```

## Geospatial Queries

Query based on geospatial data:

```javascript
// Create a 2dsphere index
await client.createIndex('locations', { coordinates: '2dsphere' });

// Find locations near a point
const nearbyLocations = await client.find('locations', {
  coordinates: {
    $near: {
      $geometry: {
        type: 'Point',
        coordinates: [-73.9857, 40.7484] // longitude, latitude
      },
      $maxDistance: 1000 // meters
    }
  }
});

// Find locations within a polygon
const locationsInArea = await client.find('locations', {
  coordinates: {
    $geoWithin: {
      $geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-74.0, 40.7],
            [-74.0, 40.8],
            [-73.9, 40.8],
            [-73.9, 40.7],
            [-74.0, 40.7]
          ]
        ]
      }
    }
  }
});
```

## Change Streams

Monitor collection changes in real-time:

```javascript
// Watch for changes in a collection
const changeStream = await client.watch('users');

// Set up event handlers
changeStream.on('insert', (document) => {
  console.log('Document inserted:', document);
});

changeStream.on('update', (update) => {
  console.log('Document updated:', update);
});

changeStream.on('delete', (id) => {
  console.log('Document deleted:', id);
});

changeStream.on('error', (error) => {
  console.error('Change stream error:', error);
});

// Close the stream when done
// changeStream.close();
```

## Data Encryption

Encrypt sensitive data fields:

```javascript
// Configure encryption settings
client.configureEncryption({
  keyVaultCollection: 'encryption_keys',
  kmsProvider: 'local',
  encryptedFields: {
    users: ['ssn', 'creditCard', 'medicalHistory']
  }
});

// Insert document with automatic field encryption
await client.insertOne('users', {
  name: 'Jane Doe',
  ssn: '123-45-6789', // This will be automatically encrypted
  email: 'jane@example.com'
});
```

## Caching

Configure client-side caching for frequently accessed data:

```javascript
// Enable caching
client.enableCache({
  ttl: 60, // Cache TTL in seconds
  maxSize: 100, // Maximum number of items in cache
  collections: ['products', 'categories'] // Collections to cache
});

// Query with caching (first call hits database, subsequent calls use cache)
const products = await client.find('products', { category: 'electronics' }, { useCache: true });

// Force refresh cached data
const freshProducts = await client.find('products', { category: 'electronics' }, { 
  useCache: true, 
  refreshCache: true 
});

// Clear specific cache
await client.clearCache('products');

// Clear all caches
await client.clearAllCaches();
```

## Advanced Example

```javascript
const PsychoticDBClient = require('psychotic-db-client');

async function advancedExample() {
  const client = new PsychoticDBClient('http://localhost:3000', {
    maxPoolSize: 20,
    connectTimeout: 5000,
    compression: true
  });
  
  try {
    await client.connect();
    await client.authenticate('admin', 'securepassword');
    
    // Create a collection with validation
    const validationRules = {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['name', 'email'],
          properties: {
            name: { bsonType: 'string' },
            email: { bsonType: 'string', pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$' },
            age: { bsonType: 'int', minimum: 18 }
          }
        }
      }
    };
    
    await client.createCollection('customers', validationRules);
    
    // Create indexes for better performance
    await client.createIndex('customers', { email: 1 }, { unique: true });
    await client.createIndex('customers', { name: 1, age: -1 });
    
    // Run a transaction
    const transaction = client.beginTransaction();
    
    try {
      await transaction.insertMany('customers', [
        { name: 'Alice Smith', email: 'alice@example.com', age: 35 },
        { name: 'Bob Jones', email: 'bob@example.com', age: 42 }
      ]);
      
      await transaction.createCollection('orders');
      await transaction.insertOne('orders', {
        customer: 'alice@example.com',
        products: ['product1', 'product2'],
        total: 129.99
      });
      
      await transaction.commit();
      console.log('Transaction completed successfully');
    } catch (error) {
      await transaction.rollback();
      console.error('Transaction rolled back:', error);
    }
    
    // Perform an aggregation
    const pipeline = [
      { $match: { age: { $gte: 30 } } },
      { $group: { _id: null, avgAge: { $avg: '$age' }, count: { $sum: 1 } } }
    ];
    
    const aggregationResult = await client.aggregate('customers', pipeline);
    console.log('Aggregation result:', aggregationResult);
    
    // Watch for changes
    const changeStream = await client.watch('customers');
    changeStream.on('insert', (doc) => console.log('New customer:', doc));
    
    // Insert another document (will trigger the change stream)
    await client.insertOne('customers', {
      name: 'Charlie Brown',
      email: 'charlie@example.com',
      age: 29
    });
    
    // Wait for change stream event to be processed
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Clean up
    await changeStream.close();
    await client.dropCollection('customers');
    await client.dropCollection('orders');
    
    await client.logout();
    console.log('Advanced example completed');
  } catch (error) {
    console.error('Advanced example error:', error);
  }
}

advancedExample();
```

For complete API details, refer to the [API Reference](./api-reference.md). 