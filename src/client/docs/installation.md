# PsychoticDB Client Installation Guide

This guide will walk you through the installation process for the PsychoticDB client library.

## Prerequisites

Before installing the PsychoticDB client, ensure you have the following prerequisites:

- Node.js (v12.0.0 or later)
- npm (v6.0.0 or later) or yarn

## Installation

### Using npm

```bash
npm install psychotic-db-client
```

### Using yarn

```bash
yarn add psychotic-db-client
```

## Configuration

After installing the client library, you need to configure it to connect to your PsychoticDB server.

### Basic Configuration

```javascript
const PsychoticDBClient = require('psychotic-db-client');

// Initialize the client with the database server URL
const client = new PsychoticDBClient('http://localhost:3000');

// For custom configurations
const clientWithOptions = new PsychoticDBClient('http://localhost:3000', {
  timeout: 5000,                // Connection timeout in milliseconds
  retryAttempts: 3,             // Number of retry attempts for failed operations
  poolSize: 10,                 // Connection pool size
  enableCompression: true,      // Enable data compression
  enableAutoReconnect: true     // Automatically reconnect on connection loss
});
```

## Verifying the Installation

To verify that the PsychoticDB client is installed correctly, you can run a simple connection test:

```javascript
const PsychoticDBClient = require('psychotic-db-client');

async function testConnection() {
  const client = new PsychoticDBClient('http://localhost:3000');
  
  try {
    // Try to connect to the server
    await client.connect();
    console.log('Successfully connected to the PsychoticDB server!');
    
    // Log out to close the connection
    await client.logout();
    console.log('Connection test completed successfully.');
  } catch (error) {
    console.error('Failed to connect to the PsychoticDB server:', error);
  }
}

testConnection();
```

## Troubleshooting

If you encounter issues during installation or connection:

1. **Network Issues**: Ensure the PsychoticDB server is running and accessible from your application.
   
2. **Version Compatibility**: Make sure your Node.js version is compatible with the client library.
   
3. **Firewall Configuration**: Check if any firewall is blocking the connection to the database server.
   
4. **Authentication Problems**: Verify your credentials are correct when connecting to secured instances.

For detailed error messages, enable debug mode:

```javascript
const client = new PsychoticDBClient('http://localhost:3000', {
  debug: true
});
```

## Next Steps

Now that you have installed the PsychoticDB client, you can:

- Check out the [Basic Usage Guide](./basic-usage.md) to get started with fundamental operations
- Explore [Advanced Features](./advanced-features.md) for more complex use cases
- Review the [API Reference](./api-reference.md) for detailed documentation on all available methods

## Support

If you need assistance with the installation or usage of the PsychoticDB client, please:

- Check the [FAQ](./faq.md) for common questions
- Open an issue on our GitHub repository
- Contact our support team at support@psychoticdb.com 