/**
 * Advanced Usage Example for PsychoticDB Client
 * 
 * This example demonstrates more complex features of the PsychoticDB client,
 * including advanced querying, aggregation, indexing, transactions, and error handling.
 */

const PsychoticDBClient = require('../client');

/**
 * Advanced usage example for PsychoticDB client
 */
async function advancedUsageExample() {
  console.log('Starting advanced PsychoticDB client example...');
  
  // Initialize the client
  const client = new PsychoticDBClient('http://localhost:3000');
  
  try {
    // Authenticate
    console.log('Authenticating user...');
    await client.login('advanced_user', 'secure_password');
    
    // Create a collection for orders
    console.log('Creating orders collection...');
    await client.createCollection('orders');
    
    // Create indexes for efficient querying
    console.log('Creating indexes...');
    await client.createIndex('orders', { customerId: 1 });
    await client.createIndex('orders', { createdAt: -1 });
    await client.createIndex('orders', { 'items.productId': 1 });
    
    // Insert sample order data
    console.log('Inserting sample orders...');
    const orders = [
      {
        customerId: 'cust001',
        orderNumber: 'ORD-2023-001',
        status: 'completed',
        total: 129.99,
        createdAt: new Date('2023-01-15T10:30:00Z'),
        items: [
          { productId: 'prod100', name: 'Smartphone', price: 99.99, quantity: 1 },
          { productId: 'prod200', name: 'Phone Case', price: 15.00, quantity: 2 }
        ],
        shipping: {
          address: '123 Main St',
          city: 'Springfield',
          state: 'IL',
          country: 'USA',
          zipCode: '62704'
        }
      },
      {
        customerId: 'cust002',
        orderNumber: 'ORD-2023-002',
        status: 'processing',
        total: 549.97,
        createdAt: new Date('2023-01-18T14:45:00Z'),
        items: [
          { productId: 'prod300', name: 'Laptop', price: 499.99, quantity: 1 },
          { productId: 'prod400', name: 'Mouse', price: 24.99, quantity: 1 },
          { productId: 'prod500', name: 'HDMI Cable', price: 24.99, quantity: 1 }
        ],
        shipping: {
          address: '456 Oak Ave',
          city: 'Portland',
          state: 'OR',
          country: 'USA',
          zipCode: '97205'
        }
      },
      {
        customerId: 'cust001',
        orderNumber: 'ORD-2023-003',
        status: 'shipped',
        total: 39.98,
        createdAt: new Date('2023-01-20T09:15:00Z'),
        items: [
          { productId: 'prod600', name: 'Headphones', price: 39.98, quantity: 1 }
        ],
        shipping: {
          address: '123 Main St',
          city: 'Springfield',
          state: 'IL',
          country: 'USA',
          zipCode: '62704'
        }
      },
      {
        customerId: 'cust003',
        orderNumber: 'ORD-2023-004',
        status: 'completed',
        total: 1299.99,
        createdAt: new Date('2023-01-22T16:30:00Z'),
        items: [
          { productId: 'prod700', name: 'Gaming Console', price: 499.99, quantity: 1 },
          { productId: 'prod800', name: 'Television', price: 800.00, quantity: 1 }
        ],
        shipping: {
          address: '789 Pine Blvd',
          city: 'Seattle',
          state: 'WA',
          country: 'USA',
          zipCode: '98101'
        }
      }
    ];
    
    await client.insertDocuments('orders', orders);
    console.log(`Inserted ${orders.length} orders`);
    
    // Advanced query: find all completed orders with total > $100
    console.log('\nQuerying for completed orders with total > $100:');
    const completedExpensiveOrders = await client.getDocuments('orders', {
      status: 'completed',
      total: { $gt: 100 }
    });
    console.log(`Found ${completedExpensiveOrders.length} expensive completed orders`);
    
    // Using projection to get only specific fields
    console.log('\nGetting order summaries with projection:');
    const orderSummaries = await client.getDocuments(
      'orders', 
      {}, 
      { 
        projection: { 
          orderNumber: 1, 
          customerId: 1, 
          status: 1, 
          total: 1 
        } 
      }
    );
    console.log('Order summaries:', orderSummaries);
    
    // Query with array operators
    console.log('\nFinding orders containing specific products:');
    const laptopOrders = await client.getDocuments('orders', {
      'items.productId': 'prod300'
    });
    console.log(`Found ${laptopOrders.length} orders with laptops`);
    
    // Sorting results
    console.log('\nGetting orders sorted by total (highest first):');
    const sortedOrders = await client.getDocuments(
      'orders', 
      {}, 
      { 
        sort: { total: -1 } 
      }
    );
    console.log('First order total:', sortedOrders[0].total);
    
    // Pagination
    console.log('\nPaginating through orders:');
    const page1 = await client.getDocuments('orders', {}, { limit: 2, skip: 0 });
    const page2 = await client.getDocuments('orders', {}, { limit: 2, skip: 2 });
    console.log(`Page 1: ${page1.length} orders, Page 2: ${page2.length} orders`);
    
    // Aggregation pipeline example
    console.log('\nRunning aggregation to get total sales by customer:');
    const customerSalesAggregation = await client.aggregate('orders', [
      { $match: { status: 'completed' } },
      { $group: { 
        _id: '$customerId', 
        totalSpent: { $sum: '$total' },
        orderCount: { $sum: 1 }
      }},
      { $sort: { totalSpent: -1 } }
    ]);
    console.log('Customer sales aggregation results:', customerSalesAggregation);
    
    // Aggregation with multiple stages and complex operations
    console.log('\nRunning complex aggregation to analyze product sales:');
    const productSalesAggregation = await client.aggregate('orders', [
      { $unwind: '$items' },
      { $group: { 
        _id: '$items.productId', 
        productName: { $first: '$items.name' },
        totalQuantity: { $sum: '$items.quantity' },
        totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
        averagePrice: { $avg: '$items.price' }
      }},
      { $match: { totalQuantity: { $gt: 1 } } },
      { $sort: { totalRevenue: -1 } },
      { $project: {
        _id: 1,
        productName: 1,
        totalQuantity: 1,
        totalRevenue: { $round: ['$totalRevenue', 2] },
        averagePrice: { $round: ['$averagePrice', 2] }
      }}
    ]);
    console.log('Product sales analysis:', productSalesAggregation);
    
    // Transaction example
    console.log('\nPerforming operations in a transaction:');
    const newOrderId = 'order_' + Date.now();
    const inventoryCollection = 'inventory';
    
    // Create inventory collection if it doesn't exist
    await client.createCollection(inventoryCollection);
    await client.insertDocuments(inventoryCollection, [
      { productId: 'prod900', name: 'Tablet', quantity: 10, price: 349.99 },
      { productId: 'prod901', name: 'Smartwatch', quantity: 15, price: 199.99 }
    ]);
    
    try {
      // Begin transaction
      await client.beginTransaction();
      
      // Insert a new order
      await client.insertDocument('orders', {
        _id: newOrderId,
        customerId: 'cust001',
        orderNumber: 'ORD-2023-005',
        status: 'processing',
        total: 349.99,
        createdAt: new Date(),
        items: [
          { productId: 'prod900', name: 'Tablet', price: 349.99, quantity: 1 }
        ]
      });
      
      // Update inventory (reduce quantity)
      await client.updateDocument(inventoryCollection, null, {
        $inc: { quantity: -1 }
      }, {
        filter: { productId: 'prod900' }
      });
      
      // Commit transaction
      await client.commitTransaction();
      console.log('Transaction committed successfully');
    } catch (error) {
      // Abort transaction if any operation fails
      await client.abortTransaction();
      console.error('Transaction aborted:', error.message);
    }
    
    // Verify transaction results
    const newOrder = await client.getDocument('orders', newOrderId);
    const tabletInventory = await client.getDocuments(inventoryCollection, { productId: 'prod900' });
    console.log('New order created:', newOrder.orderNumber);
    console.log('Updated tablet inventory quantity:', tabletInventory[0].quantity);
    
    // Demonstration of error handling
    console.log('\nDemonstrating error handling:');
    try {
      await client.getDocument('orders', 'non_existent_id');
    } catch (error) {
      console.log('Expected error caught:', error.name, '-', error.message);
      
      // Different error types and handling
      if (error.name === 'DocumentNotFoundError') {
        console.log('This is a known error type that can be handled specifically');
      }
    }
    
    // Cleanup
    console.log('\nCleaning up...');
    await client.dropCollection('orders');
    await client.dropCollection(inventoryCollection);
    
    // Logout
    console.log('Logging out...');
    await client.logout();
    
    console.log('Advanced example completed successfully');
  } catch (error) {
    console.error('Error in advanced example:', error);
  }
}

module.exports = advancedUsageExample;

// Uncomment to run this example directly
// advancedUsageExample().catch(console.error); 