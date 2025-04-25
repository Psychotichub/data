# PsychoticDB Client API Reference

This document provides a comprehensive reference for all classes, methods, and options available in the PsychoticDB client library.

## Table of Contents
- [PsychoticDBClient](#psychoticdbclient)
- [Transaction](#transaction)
- [Cursor](#cursor)
- [BulkOperation](#bulkoperation)
- [ChangeStream](#changestream)
- [Error Types](#error-types)

## PsychoticDBClient

The main client class for interacting with PsychoticDB.

### Constructor

```javascript
const client = new PsychoticDBClient(url, options);
```

#### Parameters:
- `url` (string, required): The URL of the PsychoticDB server.
- `options` (object, optional): Configuration options.
  - `maxPoolSize` (number): Maximum number of connections in the pool. Default: `10`.
  - `connectTimeout` (number): Connection timeout in milliseconds. Default: `3000`.
  - `socketTimeout` (number): Socket timeout in milliseconds. Default: `5000`.
  - `compression` (boolean): Enable compression for data transmission. Default: `false`.
  - `retryWrites` (boolean): Automatically retry write operations. Default: `true`.
  - `retryReads` (boolean): Automatically retry read operations. Default: `true`.
  - `maxRetries` (number): Maximum number of retries. Default: `3`.
  - `logLevel` (string): Logging level ('debug', 'info', 'warn', 'error'). Default: `'info'`.

### Connection Methods

#### `connect()`

Establishes a connection to the database server.

```javascript
await client.connect();
```

#### `disconnect()`

Closes the connection to the database server.

```javascript
await client.disconnect();
```

#### `isConnected()`

Checks if the client is connected to the database server.

```javascript
const connected = client.isConnected();
```

**Returns:** (boolean) - `true` if connected, `false` otherwise.

### Authentication Methods

#### `authenticate(username, password)`

Authenticates with the database using username and password.

```javascript
await client.authenticate('admin', 'password');
```

**Parameters:**
- `username` (string, required): User's username.
- `password` (string, required): User's password.

#### `logout()`

Ends the current authenticated session.

```javascript
await client.logout();
```

### Collection Methods

#### `listCollections(filter)`

Lists collections in the database.

```javascript
const collections = await client.listCollections({ name: /^user/ });
```

**Parameters:**
- `filter` (object, optional): Filter criteria for collections.

**Returns:** (Array) - List of collection information objects.

#### `createCollection(name, options)`

Creates a new collection.

```javascript
await client.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'email'],
      properties: {
        name: { bsonType: 'string' },
        email: { bsonType: 'string' }
      }
    }
  }
});
```

**Parameters:**
- `name` (string, required): Name of the collection.
- `options` (object, optional): Configuration options.
  - `validator` (object): Document validation schema.
  - `validationLevel` (string): Validation level ('off', 'strict', 'moderate').
  - `validationAction` (string): Action on validation failure ('error', 'warn').
  - `capped` (boolean): Whether the collection is capped.
  - `size` (number): Maximum size in bytes for capped collections.
  - `max` (number): Maximum number of documents for capped collections.

#### `dropCollection(name)`

Drops a collection.

```javascript
await client.dropCollection('users');
```

**Parameters:**
- `name` (string, required): Name of the collection to drop.

#### `renameCollection(oldName, newName, options)`

Renames a collection.

```javascript
await client.renameCollection('users', 'people', { dropTarget: true });
```

**Parameters:**
- `oldName` (string, required): Current name of the collection.
- `newName` (string, required): New name for the collection.
- `options` (object, optional): Configuration options.
  - `dropTarget` (boolean): Drop target collection if it exists. Default: `false`.

### Document Methods

#### `insertOne(collection, document, options)`

Inserts a single document into a collection.

```javascript
const result = await client.insertOne('users', {
  name: 'Alice',
  email: 'alice@example.com'
}, { writeConcern: { w: 'majority' } });
```

**Parameters:**
- `collection` (string, required): Name of the collection.
- `document` (object, required): Document to insert.
- `options` (object, optional): Configuration options.
  - `writeConcern` (object): Write concern options.
  - `bypassDocumentValidation` (boolean): Bypass document validation.

**Returns:** (object) - Result object with inserted document ID.

#### `insertMany(collection, documents, options)`

Inserts multiple documents into a collection.

```javascript
const result = await client.insertMany('users', [
  { name: 'Alice', email: 'alice@example.com' },
  { name: 'Bob', email: 'bob@example.com' }
], { ordered: true });
```

**Parameters:**
- `collection` (string, required): Name of the collection.
- `documents` (array, required): Array of documents to insert.
- `options` (object, optional): Configuration options.
  - `ordered` (boolean): Whether to insert documents in order. Default: `true`.
  - `writeConcern` (object): Write concern options.
  - `bypassDocumentValidation` (boolean): Bypass document validation.

**Returns:** (object) - Result object with inserted document IDs.

#### `findOne(collection, query, options)`

Finds a single document that matches the query.

```javascript
const user = await client.findOne('users', { email: 'alice@example.com' }, {
  projection: { password: 0 }
});
```

**Parameters:**
- `collection` (string, required): Name of the collection.
- `query` (object, required): Query filter.
- `options` (object, optional): Configuration options.
  - `projection` (object): Fields to include/exclude.
  - `sort` (object): Sort specification.
  - `hint` (object/string): Index hint.
  - `maxTimeMS` (number): Maximum execution time in milliseconds.
  - `readPreference` (string): Read preference.

**Returns:** (object) - Matching document or null if not found.

#### `find(collection, query, options)`

Finds documents that match the query.

```javascript
const users = await client.find('users', { age: { $gt: 21 } }, {
  projection: { name: 1, email: 1, _id: 0 },
  sort: { name: 1 },
  limit: 10,
  skip: 20
});
```

**Parameters:**
- `collection` (string, required): Name of the collection.
- `query` (object, required): Query filter.
- `options` (object, optional): Configuration options.
  - `projection` (object): Fields to include/exclude.
  - `sort` (object): Sort specification.
  - `limit` (number): Maximum number of documents to return.
  - `skip` (number): Number of documents to skip.
  - `hint` (object/string): Index hint.
  - `maxTimeMS` (number): Maximum execution time in milliseconds.
  - `readPreference` (string): Read preference.
  - `useCache` (boolean): Use client-side cache if available.
  - `refreshCache` (boolean): Force refresh cached data.

**Returns:** (Array) - Array of matching documents.

#### `updateOne(collection, filter, update, options)`

Updates a single document matching the filter.

```javascript
const result = await client.updateOne('users', 
  { email: 'alice@example.com' },
  { $set: { status: 'active' }, $inc: { loginCount: 1 } },
  { upsert: false }
);
```

**Parameters:**
- `collection` (string, required): Name of the collection.
- `filter` (object, required): Filter for document selection.
- `update` (object, required): Update operations to apply.
- `options` (object, optional): Configuration options.
  - `upsert` (boolean): Create document if not found. Default: `false`.
  - `writeConcern` (object): Write concern options.
  - `bypassDocumentValidation` (boolean): Bypass document validation.
  - `arrayFilters` (array): Array filters for array updates.

**Returns:** (object) - Result object with match and modification counts.

#### `updateMany(collection, filter, update, options)`

Updates multiple documents matching the filter.

```javascript
const result = await client.updateMany('users', 
  { status: 'inactive' },
  { $set: { status: 'archived' } }
);
```

**Parameters:**
- `collection` (string, required): Name of the collection.
- `filter` (object, required): Filter for document selection.
- `update` (object, required): Update operations to apply.
- `options` (object, optional): Configuration options.
  - `upsert` (boolean): Create documents if not found. Default: `false`.
  - `writeConcern` (object): Write concern options.
  - `bypassDocumentValidation` (boolean): Bypass document validation.
  - `arrayFilters` (array): Array filters for array updates.

**Returns:** (object) - Result object with match and modification counts.

#### `deleteOne(collection, filter, options)`

Deletes a single document matching the filter.

```javascript
const result = await client.deleteOne('users', { email: 'alice@example.com' });
```

**Parameters:**
- `collection` (string, required): Name of the collection.
- `filter` (object, required): Filter for document selection.
- `options` (object, optional): Configuration options.
  - `writeConcern` (object): Write concern options.

**Returns:** (object) - Result object with deletion count.

#### `deleteMany(collection, filter, options)`

Deletes multiple documents matching the filter.

```javascript
const result = await client.deleteMany('users', { status: 'inactive' });
```

**Parameters:**
- `collection` (string, required): Name of the collection.
- `filter` (object, required): Filter for document selection.
- `options` (object, optional): Configuration options.
  - `writeConcern` (object): Write concern options.

**Returns:** (object) - Result object with deletion count.

#### `countDocuments(collection, filter, options)`

Counts documents matching the filter.

```javascript
const count = await client.countDocuments('users', { status: 'active' });
```

**Parameters:**
- `collection` (string, required): Name of the collection.
- `filter` (object, required): Filter for document selection.
- `options` (object, optional): Configuration options.
  - `limit` (number): Maximum number of documents to count.
  - `skip` (number): Number of documents to skip.
  - `hint` (object/string): Index hint.
  - `maxTimeMS` (number): Maximum execution time in milliseconds.

**Returns:** (number) - Count of matching documents.

#### `exists(collection, filter)`

Checks if a document exists.

```javascript
const exists = await client.exists('users', { email: 'alice@example.com' });
```

**Parameters:**
- `collection` (string, required): Name of the collection.
- `filter` (object, required): Filter for document selection.

**Returns:** (boolean) - `true` if document exists, `false` otherwise.

#### `aggregate(collection, pipeline, options)`

Performs an aggregation pipeline.

```javascript
const results = await client.aggregate('users', [
  { $match: { age: { $gte: 18 } } },
  { $group: { _id: '$city', count: { $sum: 1 } } },
  { $sort: { count: -1 } }
], { allowDiskUse: true });
```

**Parameters:**
- `collection` (string, required): Name of the collection.
- `pipeline` (array, required): Aggregation pipeline stages.
- `options` (object, optional): Configuration options.
  - `allowDiskUse` (boolean): Allow disk use for large result sets.
  - `maxTimeMS` (number): Maximum execution time in milliseconds.
  - `bypassDocumentValidation` (boolean): Bypass document validation.
  - `readPreference` (string): Read preference.

**Returns:** (Array) - Results of the aggregation.

### Index Methods

#### `createIndex(collection, keys, options)`

Creates an index on a collection.

```javascript
await client.createIndex('users', { email: 1 }, { unique: true });
```

**Parameters:**
- `collection` (string, required): Name of the collection.
- `keys` (object, required): Fields to index with directions (1 for ascending, -1 for descending).
- `options` (object, optional): Configuration options.
  - `unique` (boolean): Create a unique index.
  - `name` (string): Custom name for the index.
  - `background` (boolean): Create index in the background.
  - `sparse` (boolean): Only index documents with indexed fields.
  - `expireAfterSeconds` (number): TTL for documents.
  - `partialFilterExpression` (object): Filter for partial indexes.

**Returns:** (string) - Name of the created index.

#### `listIndexes(collection)`

Lists indexes on a collection.

```javascript
const indexes = await client.listIndexes('users');
```

**Parameters:**
- `collection` (string, required): Name of the collection.

**Returns:** (Array) - List of index information objects.

#### `dropIndex(collection, indexName)`

Drops an index from a collection.

```javascript
await client.dropIndex('users', 'email_1');
```

**Parameters:**
- `collection` (string, required): Name of the collection.
- `indexName` (string, required): Name of the index to drop.

#### `dropAllIndexes(collection)`

Drops all indexes from a collection.

```javascript
await client.dropAllIndexes('users');
```

**Parameters:**
- `collection` (string, required): Name of the collection.

### Advanced Methods

#### `beginTransaction()`

Starts a new transaction.

```javascript
const transaction = client.beginTransaction();
```

**Returns:** (Transaction) - Transaction object.

#### `createCursor(collection, query, options)`

Creates a cursor for iterating through query results.

```javascript
const cursor = await client.createCursor('users', { status: 'active' });
```

**Parameters:**
- `collection` (string, required): Name of the collection.
- `query` (object, optional): Query filter. Default: `{}`.
- `options` (object, optional): Configuration options.

**Returns:** (Cursor) - Cursor object.

#### `initBulkOp(collection, ordered)`

Initializes a bulk operation.

```javascript
const bulk = client.initBulkOp('users', true);
```

**Parameters:**
- `collection` (string, required): Name of the collection.
- `ordered` (boolean, optional): Whether operations should be ordered. Default: `true`.

**Returns:** (BulkOperation) - Bulk operation object.

#### `watch(collection, pipeline, options)`

Creates a change stream to watch for changes.

```javascript
const changeStream = await client.watch('users');
```

**Parameters:**
- `collection` (string, required): Name of the collection.
- `pipeline` (array, optional): Aggregation pipeline for filtering changes.
- `options` (object, optional): Configuration options.

**Returns:** (ChangeStream) - Change stream object.

#### `configureEncryption(options)`

Configures client-side field-level encryption.

```javascript
client.configureEncryption({
  keyVaultCollection: 'encryption_keys',
  kmsProvider: 'local',
  encryptedFields: {
    users: ['ssn', 'creditCard']
  }
});
```

**Parameters:**
- `options` (object, required): Encryption configuration options.
  - `keyVaultCollection` (string): Collection to store encryption keys.
  - `kmsProvider` (string): Key management service provider.
  - `encryptedFields` (object): Map of collections to fields for encryption.

#### `enableCache(options)`

Enables client-side caching.

```javascript
client.enableCache({
  ttl: 60,
  maxSize: 100,
  collections: ['products', 'categories']
});
```

**Parameters:**
- `options` (object, required): Cache configuration options.
  - `ttl` (number): Cache time-to-live in seconds.
  - `maxSize` (number): Maximum number of cache entries.
  - `collections` (array): Collections to cache.

#### `clearCache(collection)`

Clears cache for a specific collection.

```javascript
await client.clearCache('products');
```

**Parameters:**
- `collection` (string, required): Name of the collection.

#### `clearAllCaches()`

Clears all caches.

```javascript
await client.clearAllCaches();
```

## Transaction

Represents a database transaction.

### Methods

#### `insertOne(collection, document, options)`

Inserts a single document within the transaction.

Same parameters as [client.insertOne](#insertonecollection-document-options).

#### `insertMany(collection, documents, options)`

Inserts multiple documents within the transaction.

Same parameters as [client.insertMany](#insertmanycollection-documents-options).

#### `findOne(collection, query, options)`

Finds a single document within the transaction.

Same parameters as [client.findOne](#findonecollection-query-options).

#### `find(collection, query, options)`

Finds documents within the transaction.

Same parameters as [client.find](#findcollection-query-options).

#### `updateOne(collection, filter, update, options)`

Updates a single document within the transaction.

Same parameters as [client.updateOne](#updateonecollection-filter-update-options).

#### `updateMany(collection, filter, update, options)`

Updates multiple documents within the transaction.

Same parameters as [client.updateMany](#updatemanycollection-filter-update-options).

#### `deleteOne(collection, filter, options)`

Deletes a single document within the transaction.

Same parameters as [client.deleteOne](#deleteonecollection-filter-options).

#### `deleteMany(collection, filter, options)`

Deletes multiple documents within the transaction.

Same parameters as [client.deleteMany](#deletemanycollection-filter-options).

#### `createCollection(name, options)`

Creates a new collection within the transaction.

Same parameters as [client.createCollection](#createcollectionname-options).

#### `commit()`

Commits the transaction.

```javascript
await transaction.commit();
```

#### `rollback()`

Rolls back the transaction.

```javascript
await transaction.rollback();
```

## Cursor

Represents a database cursor for iterating through query results.

### Methods

#### `limit(value)`

Sets the limit for the cursor.

```javascript
cursor.limit(10);
```

**Parameters:**
- `value` (number, required): Maximum number of documents to return.

**Returns:** (Cursor) - The cursor instance for chaining.

#### `skip(value)`

Sets the skip value for the cursor.

```javascript
cursor.skip(20);
```

**Parameters:**
- `value` (number, required): Number of documents to skip.

**Returns:** (Cursor) - The cursor instance for chaining.

#### `sort(specification)`

Sets the sort order for the cursor.

```javascript
cursor.sort({ name: 1, age: -1 });
```

**Parameters:**
- `specification` (object, required): Sort specification.

**Returns:** (Cursor) - The cursor instance for chaining.

#### `project(specification)`

Sets the projection for the cursor.

```javascript
cursor.project({ name: 1, email: 1, _id: 0 });
```

**Parameters:**
- `specification` (object, required): Projection specification.

**Returns:** (Cursor) - The cursor instance for chaining.

#### `hasNext()`

Checks if there are more documents to retrieve.

```javascript
const hasMoreDocuments = await cursor.hasNext();
```

**Returns:** (Promise<boolean>) - `true` if more documents exist, `false` otherwise.

#### `next()`

Retrieves the next document.

```javascript
const document = await cursor.next();
```

**Returns:** (Promise<object>) - The next document or null if no more documents.

#### `toArray()`

Converts all remaining cursor results to an array.

```javascript
const documents = await cursor.toArray();
```

**Returns:** (Promise<Array>) - Array of all remaining documents.

#### `forEach(callback)`

Iterates over all documents in the cursor.

```javascript
await cursor.forEach(doc => {
  console.log(doc);
});
```

**Parameters:**
- `callback` (Function, required): Function to call for each document.

#### `close()`

Closes the cursor.

```javascript
await cursor.close();
```

## BulkOperation

Represents a bulk operation for performing multiple operations in a batch.

### Methods

#### `insert(document)`

Adds an insert operation to the bulk.

```javascript
bulk.insert({ name: 'Alice', email: 'alice@example.com' });
```

**Parameters:**
- `document` (object, required): Document to insert.

**Returns:** (BulkOperation) - The bulk operation instance for chaining.

#### `update(filter, update, options)`

Adds an update operation to the bulk.

```javascript
bulk.update(
  { email: 'alice@example.com' },
  { $set: { status: 'active' } },
  { upsert: false }
);
```

**Parameters:**
- `filter` (object, required): Filter for document selection.
- `update` (object, required): Update operations to apply.
- `options` (object, optional): Configuration options.
  - `upsert` (boolean): Create document if not found. Default: `false`.
  - `multi` (boolean): Update multiple documents. Default: `false`.

**Returns:** (BulkOperation) - The bulk operation instance for chaining.

#### `updateMany(filter, update, options)`

Adds a multi-update operation to the bulk.

```javascript
bulk.updateMany(
  { status: 'inactive' },
  { $set: { status: 'archived' } }
);
```

**Parameters:**
- `filter` (object, required): Filter for document selection.
- `update` (object, required): Update operations to apply.
- `options` (object, optional): Configuration options.
  - `upsert` (boolean): Create documents if not found. Default: `false`.

**Returns:** (BulkOperation) - The bulk operation instance for chaining.

#### `delete(filter)`

Adds a delete operation to the bulk.

```javascript
bulk.delete({ email: 'alice@example.com' });
```

**Parameters:**
- `filter` (object, required): Filter for document selection.

**Returns:** (BulkOperation) - The bulk operation instance for chaining.

#### `deleteMany(filter)`

Adds a multi-delete operation to the bulk.

```javascript
bulk.deleteMany({ status: 'inactive' });
```

**Parameters:**
- `filter` (object, required): Filter for document selection.

**Returns:** (BulkOperation) - The bulk operation instance for chaining.

#### `execute()`

Executes all operations in the bulk.

```javascript
const results = await bulk.execute();
```

**Returns:** (Promise<object>) - Results of the bulk operation.

## ChangeStream

Represents a change stream for monitoring collection changes.

### Methods

#### `on(event, callback)`

Registers an event handler.

```javascript
changeStream.on('insert', (document) => {
  console.log('Document inserted:', document);
});
```

**Parameters:**
- `event` (string, required): Event type ('insert', 'update', 'delete', 'error').
- `callback` (Function, required): Function to call when the event occurs.

**Returns:** (ChangeStream) - The change stream instance for chaining.

#### `close()`

Closes the change stream.

```javascript
await changeStream.close();
```

## Error Types

The PsychoticDB client library defines several error types for specific error conditions:

- `PsychoticDBError`: Base error class for all PsychoticDB errors.
- `ConnectionError`: Error establishing a connection to the database.
- `AuthenticationError`: Error during authentication.
- `OperationError`: Error during database operations.
- `ValidationError`: Document validation failure.
- `TimeoutError`: Operation timeout.
- `TransactionError`: Error during transaction processing.

Example error handling:

```javascript
try {
  await client.connect();
  await client.authenticate('admin', 'wrongpassword');
} catch (error) {
  if (error instanceof PsychoticDBClient.AuthenticationError) {
    console.error('Authentication failed:', error.message);
  } else if (error instanceof PsychoticDBClient.ConnectionError) {
    console.error('Connection failed:', error.message);
  } else {
    console.error('Unexpected error:', error);
  }
}
``` 