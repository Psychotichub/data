/**
 * Basic Usage Example for PsychoticDB Client
 * 
 * This example demonstrates the fundamental operations of the PsychoticDB client,
 * including connection, authentication, and basic CRUD operations.
 */

const PsychoticDBClient = require('../client');

/**
 * Basic usage example for PsychoticDB client
 */
async function basicUsageExample() {
  console.log('Starting basic PsychoticDB client example...');
  
  // Initialize the client with server URL
  const client = new PsychoticDBClient('http://localhost:3000');
  
  try {
    // Step 1: Authenticate with the server
    console.log('Authenticating user...');
    await client.login('demo_user', 'demo_password');
    console.log('Authentication successful!');
    
    // Step 2: Create a collection
    console.log('\nCreating collection...');
    const collectionName = 'users';
    await client.createCollection(collectionName);
    console.log(`Collection '${collectionName}' created`);
    
    // Step 3: Insert documents
    console.log('\nInserting documents...');
    
    // Insert a single document
    const user1 = await client.insertDocument(collectionName, {
      name: 'John Doe',
      email: 'john@example.com',
      age: 32,
      active: true,
      createdAt: new Date()
    });
    console.log('Inserted user:', user1);
    
    // Insert multiple documents at once
    const usersToInsert = [
      {
        name: 'Jane Smith',
        email: 'jane@example.com',
        age: 28,
        active: true,
        createdAt: new Date()
      },
      {
        name: 'Bob Johnson',
        email: 'bob@example.com',
        age: 45,
        active: false,
        createdAt: new Date()
      }
    ];
    
    const insertedUsers = await client.insertDocuments(collectionName, usersToInsert);
    console.log(`Inserted ${insertedUsers.length} more users`);
    
    // Step 4: Query documents
    console.log('\nQuerying documents:');
    
    // Find all documents in the collection
    const allUsers = await client.getDocuments(collectionName);
    console.log(`Found ${allUsers.length} total users`);
    
    // Find documents with a specific filter
    const activeUsers = await client.getDocuments(collectionName, { active: true });
    console.log(`Found ${activeUsers.length} active users:`);
    activeUsers.forEach(user => {
      console.log(`- ${user.name} (${user.email})`);
    });
    
    // Find a single document by ID
    console.log('\nFinding user by ID:');
    const specificUser = await client.getDocument(collectionName, user1._id);
    console.log('Found user:', specificUser.name);
    
    // Step 5: Update documents
    console.log('\nUpdating documents:');
    
    // Update a single document by ID
    await client.updateDocument(collectionName, user1._id, {
      $set: { 
        age: 33,
        lastUpdated: new Date()
      }
    });
    console.log('Updated user age');
    
    // Verify the update
    const updatedUser = await client.getDocument(collectionName, user1._id);
    console.log(`User's new age: ${updatedUser.age}`);
    
    // Update multiple documents at once
    const updateResult = await client.updateDocuments(collectionName, 
      { active: true }, 
      { $set: { status: 'verified' } }
    );
    console.log(`Updated ${updateResult.matchedCount} documents with 'verified' status`);
    
    // Step 6: Delete documents
    console.log('\nDeleting documents:');
    
    // Delete a single document by ID
    await client.deleteDocument(collectionName, updatedUser._id);
    console.log(`Deleted user: ${updatedUser.name}`);
    
    // Delete documents matching a filter
    const deleteResult = await client.deleteDocuments(collectionName, { active: false });
    console.log(`Deleted ${deleteResult.deletedCount} inactive users`);
    
    // Step 7: Count remaining documents
    const remainingCount = await client.countDocuments(collectionName);
    console.log(`\nRemaining users in collection: ${remainingCount}`);
    
    // Step 8: Check if document exists
    const doesExist = await client.documentExists(collectionName, { name: 'Jane Smith' });
    console.log(`Does Jane Smith exist? ${doesExist}`);
    
    // Step 9: Drop collection
    console.log('\nCleaning up...');
    await client.dropCollection(collectionName);
    console.log(`Collection '${collectionName}' dropped`);
    
    // Step 10: Logout
    console.log('\nLogging out...');
    await client.logout();
    console.log('Logged out successfully');
    
    console.log('\nBasic example completed successfully');
  } catch (error) {
    console.error('Error in basic example:', error);
  }
}

module.exports = basicUsageExample;

// Uncomment to run this example directly
// basicUsageExample().catch(console.error); 