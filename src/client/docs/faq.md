# PsychoticDB Client FAQ

## General Questions

### What is PsychoticDB?

PsychoticDB is a high-performance, document-oriented database designed for modern applications. It combines the flexibility of NoSQL databases with powerful querying capabilities similar to traditional SQL databases.

### What programming languages does PsychoticDB client support?

The official client libraries are available for:
- JavaScript/Node.js
- Python
- Java
- Go
- Ruby
- C#/.NET

### Is PsychoticDB open source?

Yes, PsychoticDB is available under the Apache 2.0 license. The source code is hosted on GitHub.

### How does PsychoticDB compare to MongoDB?

PsychoticDB shares many similarities with MongoDB in terms of document model and query interface, but offers:
- Improved performance for complex aggregation operations
- Enhanced security features
- Better memory management
- More flexible indexing options
- Lower resource consumption

## Installation & Setup

### How do I install the PsychoticDB client?

```bash
# Node.js
npm install psychoticdb-client

# Python
pip install psychoticdb

# Java (Maven)
<dependency>
  <groupId>com.psychoticdb</groupId>
  <artifactId>psychoticdb-driver</artifactId>
  <version>1.5.0</version>
</dependency>
```

### What are the minimum system requirements?

The client library has minimal requirements and runs on:
- Node.js 12+
- Python 3.6+
- Java 8+
- Go 1.13+
- .NET Core 3.1+ or .NET 5.0+

### How do I connect to a PsychoticDB server?

```javascript
const { PsychoticDBClient } = require('psychoticdb-client');

// Basic connection
const client = new PsychoticDBClient('mongodb://localhost:27017/mydb');

// With authentication
const client = new PsychoticDBClient(
  'mongodb://username:password@localhost:27017/mydb'
);

// With connection options
const client = new PsychoticDBClient(
  'mongodb://localhost:27017/mydb',
  {
    maxPoolSize: 10,
    connectTimeoutMS: 5000
  }
);

// Connect to the server
await client.connect();
```

### Do I need to call connect() explicitly?

Yes, you need to explicitly call `connect()` before performing operations. This ensures that you have control over when the connection is established.

### Should I create a new client for each operation?

No, you should reuse a single client instance throughout your application. The client manages a connection pool internally, so creating a new client for each operation would be inefficient.

## Data Operations

### How do I insert documents?

```javascript
// Insert a single document
const result = await client.insertOne('users', {
  name: 'John Doe',
  email: 'john@example.com',
  age: 30
});
console.log(`Inserted document with ID: ${result.insertedId}`);

// Insert multiple documents
const results = await client.insertMany('users', [
  { name: 'Jane Doe', email: 'jane@example.com', age: 28 },
  { name: 'Bob Smith', email: 'bob@example.com', age: 35 }
]);
console.log(`Inserted ${results.insertedCount} documents`);
```

### How do I query documents?

```javascript
// Find all documents matching a filter
const users = await client.find('users', { age: { $gt: 25 } });

// Find a single document
const user = await client.findOne('users', { email: 'john@example.com' });

// Projection (select specific fields)
const users = await client.find(
  'users',
  { age: { $gt: 25 } },
  { projection: { name: 1, email: 1 } }
);

// Sort, limit, and skip
const users = await client.find(
  'users',
  { age: { $gt: 25 } },
  { 
    sort: { age: -1 },
    limit: 10,
    skip: 20
  }
);
```

### How do I update documents?

```javascript
// Update a single document
const result = await client.updateOne(
  'users',
  { email: 'john@example.com' },
  { $set: { age: 31 } }
);
console.log(`Modified ${result.modifiedCount} document`);

// Update multiple documents
const result = await client.updateMany(
  'users',
  { age: { $lt: 30 } },
  { $inc: { age: 1 } }
);
console.log(`Modified ${result.modifiedCount} documents`);

// Upsert (update or insert)
const result = await client.updateOne(
  'users',
  { email: 'sarah@example.com' },
  { $set: { name: 'Sarah Jones', age: 27 } },
  { upsert: true }
);
```

### How do I delete documents?

```javascript
// Delete a single document
const result = await client.deleteOne('users', { email: 'john@example.com' });
console.log(`Deleted ${result.deletedCount} document`);

// Delete multiple documents
const result = await client.deleteMany('users', { age: { $lt: 18 } });
console.log(`Deleted ${result.deletedCount} documents`);
```

### Is there a size limit for documents?

Yes, the maximum document size is 16MB. If you need to store larger data, consider using GridFS or storing the data externally and referencing it in your document.

## Performance & Optimization

### How can I improve query performance?

1. Create appropriate indexes:
   ```javascript
   await client.createIndex('users', { email: 1 });
   await client.createIndex('users', { age: -1 });
   await client.createIndex('posts', { 'author.id': 1, createdAt: -1 });
   ```

2. Use projections to limit returned fields:
   ```javascript
   const users = await client.find(
     'users',
     { active: true },
     { projection: { name: 1, email: 1 } }
   );
   ```

3. Use pagination to limit result sets:
   ```javascript
   const pageSize = 20;
   const page = 1;
   const users = await client.find(
     'users',
     { active: true },
     { limit: pageSize, skip: (page - 1) * pageSize }
   );
   ```

### How many connections should I use in my connection pool?

A good starting point is:
- 5-10 connections for small applications
- 20-50 connections for medium applications
- 100+ connections for large applications

However, the optimal number depends on your specific workload and server capacity.

### Is PsychoticDB suitable for real-time applications?

Yes, PsychoticDB supports real-time data subscriptions through change streams:

```javascript
const changeStream = await client.watch('users');
changeStream.on('change', (change) => {
  console.log('Document changed:', change);
});
```

## Error Handling

### How should I handle database errors?

```javascript
try {
  const result = await client.insertOne('users', { name: 'John' });
  // Handle successful result
} catch (error) {
  if (error.code === 11000) {
    // Handle duplicate key error
    console.error('A user with this key already exists');
  } else if (error.name === 'ValidationError') {
    // Handle validation error
    console.error('Document validation failed:', error.message);
  } else {
    // Handle other errors
    console.error('Database operation failed:', error);
  }
}
```

### What are common error codes?

- `11000`: Duplicate key error
- `20`: Invalid operation
- `40`: Auth failure
- `51`: Server timeout
- `121`: Document validation failed
- `211`: Connection error

## Security

### How do I secure my connection to PsychoticDB?

1. Always use TLS/SSL for production:
   ```javascript
   const client = new PsychoticDBClient(
     'mongodb://localhost:27017/mydb',
     {
       tls: true,
       tlsCAFile: '/path/to/ca.pem'
     }
   );
   ```

2. Use strong authentication:
   ```javascript
   const client = new PsychoticDBClient(
     'mongodb://username:password@localhost:27017/mydb?authSource=admin',
     {
       authMechanism: 'SCRAM-SHA-256'
     }
   );
   ```

3. Implement proper access controls on your server

### How can I prevent injection attacks?

Always use parameterized queries instead of string concatenation:

```javascript
// GOOD: Using parameter objects
const userName = userInput;
const user = await client.findOne('users', { name: userName });

// BAD: Constructing query strings
const userName = userInput;
const query = `{ "name": "${userName}" }`; // Vulnerable to injection
const user = await client.findOne('users', JSON.parse(query));
```

## Transactions

### Does PsychoticDB support ACID transactions?

Yes, PsychoticDB supports multi-document ACID transactions:

```javascript
const session = client.startSession();
try {
  session.startTransaction();
  
  await client.insertOne('accounts', { userId: 123, balance: 500 }, { session });
  await client.updateOne('users', { id: 123 }, { $set: { hasAccount: true } }, { session });
  
  await session.commitTransaction();
} catch (error) {
  await session.abortTransaction();
  throw error;
} finally {
  await session.endSession();
}
```

### What are the limitations of transactions?

- Transactions timeout after 60 seconds by default
- Maximum 1000 operations per transaction
- Maximum size of 16MB for all documents in a transaction

## Deployment

### Can I use PsychoticDB in serverless environments?

Yes, but with some considerations:
- Use connection pooling with appropriate maximums
- Handle reconnection logic
- Be aware of cold start times
- Consider using PsychoticDB Atlas for fully managed deployments

### How do I monitor my PsychoticDB client?

```javascript
const client = new PsychoticDBClient('mongodb://localhost:27017/mydb', {
  monitorCommands: true
});

client.on('commandStarted', (event) => {
  console.log(`Command started: ${event.commandName}`);
});

client.on('commandSucceeded', (event) => {
  console.log(`Command succeeded: ${event.commandName} (${event.duration}ms)`);
});

client.on('commandFailed', (event) => {
  console.log(`Command failed: ${event.commandName} (${event.duration}ms)`);
});
```

## Advanced Features

### Does PsychoticDB support aggregation pipelines?

Yes, it supports a powerful aggregation framework:

```javascript
const results = await client.aggregate('orders', [
  { $match: { status: 'completed' } },
  { $group: { 
      _id: '$customerId', 
      totalSpent: { $sum: '$amount' },
      count: { $sum: 1 }
    }
  },
  { $sort: { totalSpent: -1 } },
  { $limit: 10 }
]);
```

### How do I handle schema validation?

PsychoticDB supports JSON Schema validation:

```javascript
await client.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'email'],
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
          minimum: 0,
          description: 'must be a positive integer if present'
        }
      }
    }
  }
});
```

### How do I migrate from MongoDB to PsychoticDB?

PsychoticDB is designed to be compatible with MongoDB, so migration is typically straightforward:

1. Export your data from MongoDB:
   ```bash
   mongodump --uri="mongodb://sourceServer:27017/sourceDb" --out=dump
   ```

2. Import into PsychoticDB:
   ```bash
   psychoticrestore --uri="mongodb://targetServer:27017/targetDb" --dir=dump
   ```

3. Update your connection string in your application:
   ```javascript
   // Before
   const client = new MongoClient('mongodb://server:27017/db');
   
   // After
   const client = new PsychoticDBClient('mongodb://server:27017/db');
   ```

Most MongoDB query operators, aggregation stages, and options work identically in PsychoticDB. 
 