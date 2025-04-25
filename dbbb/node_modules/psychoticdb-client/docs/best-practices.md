# PsychoticDB Client Best Practices

This document outlines recommended practices for using the PsychoticDB client library efficiently and effectively.

## Connection Management

### Connection Pooling

- **Use appropriate pool size**: Set `maxPoolSize` based on your application's concurrency needs and server capacity.
  ```javascript
  const client = new PsychoticDBClient('mongodb://localhost:27017', {
    maxPoolSize: 20 // Adjust based on your application's needs
  });
  ```

- **Reuse connections**: Create a single client instance for your application and reuse it for all operations.

- **Handle connections properly**: Always call `disconnect()` when your application is shutting down.

### Connection Options

- **Set timeouts appropriately**: Configure `connectTimeout` and `socketTimeout` based on your network reliability.
  ```javascript
  const client = new PsychoticDBClient('mongodb://localhost:27017', {
    connectTimeout: 3000,  // 3 seconds
    socketTimeout: 5000    // 5 seconds
  });
  ```

- **Enable automatic retries**: For improved resilience, set `retryWrites` and `retryReads` to true.
  ```javascript
  const client = new PsychoticDBClient('mongodb://localhost:27017', {
    retryWrites: true,
    retryReads: true,
    maxRetries: 3
  });
  ```

## Data Modeling

- **Use appropriate data types**: Match your schema to your data access patterns.

- **Use document validation**: Define validation rules when creating collections.
  ```javascript
  await client.createCollection('products', {
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['name', 'price'],
        properties: {
          name: { bsonType: 'string' },
          price: { bsonType: 'number', minimum: 0 }
        }
      }
    }
  });
  ```

- **Consider embedding vs. referencing**: Embed related data when it's always accessed together, and reference it when it's accessed separately.

## Querying

- **Use projections**: Limit the fields returned in queries to reduce network traffic and processing time.
  ```javascript
  const users = await client.find('users', 
    { status: 'active' }, 
    { projection: { name: 1, email: 1, _id: 0 } }
  );
  ```

- **Use indexes for frequently queried fields**: Create indexes on fields used in query filters, sorts, and joins.
  ```javascript
  await client.createIndex('users', { email: 1 }, { unique: true });
  await client.createIndex('users', { lastName: 1, firstName: 1 });
  ```

- **Limit result sets**: Always use `limit()` for queries that could return large result sets.
  ```javascript
  const users = await client.find('users', {}, { limit: 100 });
  ```

## Writing Data

- **Use bulk operations**: For multiple write operations, use bulk operations instead of individual calls.
  ```javascript
  const bulkOp = client.createBulkOperation('users');
  bulkOp.insertOne({ name: 'User 1', email: 'user1@example.com' });
  bulkOp.insertOne({ name: 'User 2', email: 'user2@example.com' });
  bulkOp.updateOne({ email: 'user3@example.com' }, { $set: { status: 'active' } });
  await bulkOp.execute();
  ```

- **Use transactions for multi-document operations**: When consistency across multiple documents is required.
  ```javascript
  const session = await client.startSession();
  try {
    await session.startTransaction();
    await client.insertOne('accounts', { userId: 123, balance: 100 }, { session });
    await client.updateOne('users', { id: 123 }, { $set: { hasAccount: true } }, { session });
    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
  ```

## Error Handling

- **Use specific error types**: Catch and handle specific error types appropriately.
  ```javascript
  try {
    await client.insertOne('users', userData);
  } catch (error) {
    if (error instanceof PsychoticDBClient.DuplicateKeyError) {
      // Handle duplicate key error
    } else if (error instanceof PsychoticDBClient.ValidationError) {
      // Handle validation error
    } else {
      // Handle other errors
    }
  }
  ```

- **Implement circuit breakers**: For resilient applications, implement circuit breakers to prevent cascading failures.

## Performance Optimization

- **Monitor query performance**: Use `explainQuery()` to understand and optimize query execution plans.
  ```javascript
  const explanation = await client.explainQuery('users', 
    { status: 'active', age: { $gt: 30 } }, 
    { sort: { lastName: 1 } }
  );
  console.log(explanation);
  ```

- **Use compound indexes**: For queries that filter on multiple fields, create compound indexes that match your query patterns.

- **Avoid large documents**: Keep documents under 16MB and consider splitting large documents into related collections.

## Security

- **Use TLS/SSL**: Always use encrypted connections in production.
  ```javascript
  const client = new PsychoticDBClient('mongodb://localhost:27017', {
    tls: true,
    tlsCAFile: '/path/to/ca.pem',
    tlsCertificateKeyFile: '/path/to/client.pem'
  });
  ```

- **Apply principle of least privilege**: Use role-based access control and grant minimal necessary permissions.

- **Validate all inputs**: Always validate and sanitize user inputs before using them in queries.
  ```javascript
  // Bad - potential injection vulnerability
  const userId = req.params.id;
  const user = await client.findOne('users', { id: userId });
  
  // Good - validate input first
  const userId = parseInt(req.params.id, 10);
  if (isNaN(userId)) {
    throw new Error('Invalid user ID');
  }
  const user = await client.findOne('users', { id: userId });
  ```

## Logging and Monitoring

- **Configure logging**: Set appropriate logging levels for development and production.
  ```javascript
  const client = new PsychoticDBClient('mongodb://localhost:27017', {
    logLevel: 'info' // Options: 'error', 'warn', 'info', 'debug'
  });
  ```

- **Monitor performance**: Track query execution times and resource usage to identify bottlenecks.

- **Set up alerts**: Configure alerts for unusual patterns or errors to detect issues early.

## Testing

- **Use a test database**: Never test against production data.

- **Mock the database for unit tests**: Use mocking libraries to isolate units of code for testing.

- **Create integration tests**: Test your application's interaction with the database using a test instance.

## Deployment

- **Use connection strings with options**: Include all connection options in your connection string.
  ```javascript
  const uri = 'mongodb://username:password@localhost:27017/mydb?maxPoolSize=20&w=majority';
  const client = new PsychoticDBClient(uri);
  ```

- **Implement graceful shutdown**: Handle process termination signals to close database connections properly.
  ```javascript
  process.on('SIGINT', async () => {
    await client.disconnect();
    process.exit(0);
  });
  ```

- **Use environment variables**: Store connection strings and credentials in environment variables, not in code.
  ```javascript
  const uri = process.env.PSYCHOTICDB_URI;
  const client = new PsychoticDBClient(uri);
  ```

## Version Management

- **Pin your dependency version**: Use exact versions in your package.json to ensure consistency.
  ```json
  {
    "dependencies": {
      "psychoticdb-client": "1.2.3"
    }
  }
  ```

- **Test upgrades thoroughly**: Before upgrading the client library, test in a non-production environment. 