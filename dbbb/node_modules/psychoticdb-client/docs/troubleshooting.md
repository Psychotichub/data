# PsychoticDB Client Troubleshooting Guide

This guide helps you diagnose and resolve common issues with the PsychoticDB client library.

## Connection Issues

### Cannot Connect to Server

**Symptoms:**
- `ConnectionError: Failed to connect to server`
- Connection timeouts
- `ECONNREFUSED` errors

**Possible Causes and Solutions:**

1. **Server not running**
   - Verify the PsychoticDB server is running:
     ```bash
     ps aux | grep psychotic
     ```
   - Start the server if it's not running:
     ```bash
     psychoticdb-server --config /path/to/config.yml
     ```

2. **Incorrect connection string**
   - Check your connection string format:
     ```javascript
     // Correct format
     const client = new PsychoticDBClient('mongodb://hostname:port/database');
     ```
   - Verify hostname, port, and credentials are correct

3. **Network or firewall issues**
   - Ensure the server port is accessible:
     ```bash
     telnet hostname port
     ```
   - Check firewall rules to allow connections to the database port
   - Verify network connectivity between client and server

4. **Authentication failure**
   - Confirm username and password in connection string
   - Check user permissions on the database
   - Review server logs for authentication errors

5. **TLS/SSL configuration**
   - Ensure certificates are valid and correctly configured
   - Check TLS options in your connection:
     ```javascript
     const client = new PsychoticDBClient('mongodb://hostname:port/database', {
       tls: true,
       tlsCAFile: '/path/to/ca.pem'
     });
     ```

### Connection Drops Frequently

**Symptoms:**
- Intermittent `ConnectionLostError` errors
- Operations fail midway through execution

**Possible Causes and Solutions:**

1. **Network instability**
   - Use automatic reconnection:
     ```javascript
     const client = new PsychoticDBClient('mongodb://hostname:port/database', {
       autoReconnect: true,
       reconnectTries: 30,
       reconnectInterval: 1000
     });
     ```

2. **Server overload**
   - Check server monitoring metrics and logs
   - Increase server resources or scale horizontally
   - Optimize client-side connection pooling:
     ```javascript
     const client = new PsychoticDBClient('mongodb://hostname:port/database', {
       maxPoolSize: 10,  // Reduce if server is overwhelmed
       minPoolSize: 1
     });
     ```

3. **Connection idle timeout**
   - Use a keepalive option:
     ```javascript
     const client = new PsychoticDBClient('mongodb://hostname:port/database', {
       keepAlive: true,
       keepAliveInitialDelay: 30000  // 30 seconds
     });
     ```

## Query and Operation Errors

### Document Not Found

**Symptoms:**
- `null` returned from `findOne()` operations
- Empty arrays returned from `find()` operations

**Possible Causes and Solutions:**

1. **Query criteria doesn't match any documents**
   - Double-check your query filters:
     ```javascript
     // Debug by logging the count of matching documents
     const count = await client.count('collection', filter);
     console.log(`Found ${count} matching documents`);
     ```
   - Verify the collection name is correct
   - Check for typos in field names or values

2. **Case sensitivity issues**
   - Remember that string comparisons are case-sensitive by default:
     ```javascript
     // Use regex for case-insensitive search
     const users = await client.find('users', { 
       name: { $regex: 'john', $options: 'i' } 
     });
     ```

### Duplicate Key Errors

**Symptoms:**
- `DuplicateKeyError: E11000 duplicate key error collection`

**Possible Causes and Solutions:**

1. **Attempting to insert a document with a duplicate unique value**
   - Use `upsert` for updates that might create new documents:
     ```javascript
     await client.updateOne(
       'users',
       { email: 'user@example.com' },
       { $set: { name: 'Updated Name' } },
       { upsert: true }
     );
     ```
   - Before insert, check if document exists:
     ```javascript
     const exists = await client.findOne('users', { email: 'user@example.com' });
     if (!exists) {
       await client.insertOne('users', newUser);
     }
     ```

### Validation Errors

**Symptoms:**
- `ValidationError: Document failed validation`

**Possible Causes and Solutions:**

1. **Document doesn't match collection schema**
   - Check the collection's validation rules:
     ```javascript
     const collInfo = await client.getCollectionInfo('users');
     console.log(collInfo.validator);
     ```
   - Ensure your document includes all required fields
   - Verify data types match schema requirements

## Performance Issues

### Slow Queries

**Symptoms:**
- Operations take longer than expected
- Application timeouts

**Possible Causes and Solutions:**

1. **Missing indexes**
   - Create indexes for frequently queried fields:
     ```javascript
     await client.createIndex('users', { email: 1 });
     ```
   - Use the explain plan to analyze query performance:
     ```javascript
     const explanation = await client.explainQuery('users', { status: 'active' });
     console.log(explanation);
     ```

2. **Inefficient query patterns**
   - Limit returned fields with projections:
     ```javascript
     const users = await client.find('users', 
       { status: 'active' }, 
       { projection: { name: 1, email: 1 } }
     );
     ```
   - Limit result set size:
     ```javascript
     const users = await client.find('users', 
       { status: 'active' }, 
       { limit: 100 }
     );
     ```

3. **Large documents**
   - Consider denormalizing your data model
   - Break large documents into related collections
   - Use reference IDs instead of embedding large arrays

### Memory Issues

**Symptoms:**
- Client application has high memory usage
- `JavaScript heap out of memory` errors

**Possible Causes and Solutions:**

1. **Processing large result sets in memory**
   - Use cursor-based pagination:
     ```javascript
     const cursor = await client.createCursor('logs', {});
     while (await cursor.hasNext()) {
       const doc = await cursor.next();
       processDocument(doc);
     }
     await cursor.close();
     ```
   - Process results in batches:
     ```javascript
     let skip = 0;
     const limit = 100;
     let batch;
     do {
       batch = await client.find('logs', {}, { skip, limit });
       processBatch(batch);
       skip += limit;
     } while (batch.length === limit);
     ```

## Common Error Messages

### "Invalid BSON type"

**Symptoms:**
- `Error: Invalid BSON type`

**Possible Causes and Solutions:**

1. **Using unsupported JavaScript types in documents**
   - Ensure all values are compatible with BSON:
     - Use Dates instead of datetime strings
     - Use Numbers instead of numeric strings where appropriate
     - Don't use custom JavaScript objects without serialization

### "Topology was destroyed"

**Symptoms:**
- `Error: Topology was destroyed`

**Possible Causes and Solutions:**

1. **Client has been disconnected**
   - Check if client was explicitly disconnected elsewhere in the code
   - Reconnect the client:
     ```javascript
     await client.connect();
     ```
   - Consider using a connection management pattern to share a single client

### "Cursor not found"

**Symptoms:**
- `Error: Cursor not found`

**Possible Causes and Solutions:**

1. **Cursor timed out on server**
   - Process cursor results more quickly
   - Use `noCursorTimeout` option for long-running operations:
     ```javascript
     const cursor = await client.createCursor('logs', {}, { 
       noCursorTimeout: true 
     });
     ```
   - Always close cursors when done:
     ```javascript
     try {
       // Use cursor
     } finally {
       await cursor.close();
     }
     ```

## Debugging Techniques

### Enable Debug Logging

```javascript
const client = new PsychoticDBClient('mongodb://hostname:port/database', {
  logLevel: 'debug'
});
```

Set environment variable for more verbose logging:
```bash
export PSYCHOTICDB_DEBUG=true
```

### Capture Network Traffic

Use network monitoring tools like Wireshark to capture traffic between client and server (if unencrypted).

### Monitor Server Metrics

Access the PsychoticDB admin interface to view:
- Connection counts
- Query performance statistics
- Memory usage
- Disk I/O

### Check Server Logs

Server logs often contain detailed error information:
```bash
tail -f /var/log/psychoticdb/server.log
```

## Getting Help

If you've tried the solutions in this guide and still face issues:

1. **Check Documentation**
   - Review the API reference for correct method usage
   - Check for known limitations

2. **Check GitHub Issues**
   - Search existing issues for similar problems
   - Check if there are workarounds or pending fixes

3. **Community Support**
   - Post questions on Stack Overflow with the `psychoticdb` tag
   - Join the PsychoticDB community forum or Discord channel

4. **Commercial Support**
   - For enterprise users, contact our support team at support@psychoticdb.com 