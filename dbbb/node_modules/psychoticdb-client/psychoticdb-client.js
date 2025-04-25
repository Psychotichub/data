/**
 * PsychoticDB Client Library
 * A lightweight client for interacting with PsychoticDB from any JavaScript application
 */
class PsychoticDBClient {
  /**
   * Create a new PsychoticDB client
   * @param {string} baseUrl - The base URL of the PsychoticDB server (e.g., "http://localhost:3000")
   */
  constructor(baseUrl) {
    this.baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    this.token = null;
    this.user = null;
  }

  /**
   * Set the authentication token manually
   * @param {string} token - JWT token
   */
  setToken(token) {
    this.token = token;
    return this;
  }

  /**
   * Get headers for API requests
   * @returns {Object} Headers object
   */
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  /**
   * Make an API request
   * @param {string} method - HTTP method (GET, POST, etc.)
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request data (for POST, PUT, etc.)
   * @returns {Promise} Promise resolving to the API response
   */
  async request(method, endpoint, data = null) {
    const url = `${this.baseUrl}/api/${endpoint}`;
    
    const options = {
      method,
      headers: this.getHeaders(),
      credentials: 'include'
    };

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'API request failed');
      }

      return result;
    } catch (error) {
      console.error(`API Error (${method} ${endpoint}):`, error);
      throw error;
    }
  }

  /**
   * Check the server status
   * @returns {Promise} Promise resolving to the server status
   */
  async getStatus() {
    return this.request('GET', 'status');
  }

  /**
   * User authentication methods
   */

  /**
   * Login with username and password
   * @param {string} username - Username
   * @param {string} password - Password
   * @returns {Promise} Promise resolving to the login result
   */
  async login(username, password) {
    const result = await this.request('POST', 'auth/login', { username, password });
    this.token = result.token;
    this.user = result.user;
    return result;
  }

  /**
   * Get current user information
   * @returns {Promise} Promise resolving to the user information
   */
  async getCurrentUser() {
    if (!this.token) {
      throw new Error('Not authenticated');
    }
    return this.request('GET', 'auth/me');
  }

  /**
   * Change password
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise} Promise resolving to the result
   */
  async changePassword(currentPassword, newPassword) {
    if (!this.token) {
      throw new Error('Not authenticated');
    }
    return this.request('POST', 'auth/change-password', { currentPassword, newPassword });
  }

  /**
   * Logout (client-side only)
   */
  logout() {
    this.token = null;
    this.user = null;
  }

  /**
   * Collection methods
   */

  /**
   * Get all collections
   * @returns {Promise} Promise resolving to the collections
   */
  async getCollections() {
    return this.request('GET', 'collections');
  }

  /**
   * Create a new collection
   * @param {string} name - Collection name
   * @returns {Promise} Promise resolving to the created collection
   */
  async createCollection(name) {
    return this.request('POST', 'collections', { name });
  }

  /**
   * Delete a collection
   * @param {string} name - Collection name
   * @returns {Promise} Promise resolving to the result
   */
  async deleteCollection(name) {
    return this.request('DELETE', `collections/${name}`);
  }

  /**
   * Document methods
   */

  /**
   * Get documents from a collection
   * @param {string} collection - Collection name
   * @param {Object} filter - Filter criteria (optional)
   * @returns {Promise} Promise resolving to the documents
   */
  async getDocuments(collection, filter = null) {
    let endpoint = `documents/${collection}`;
    if (filter) {
      endpoint += `?filter=${encodeURIComponent(JSON.stringify(filter))}`;
    }
    return this.request('GET', endpoint);
  }

  /**
   * Insert a document into a collection
   * @param {string} collection - Collection name
   * @param {Object} document - Document to insert
   * @returns {Promise} Promise resolving to the inserted document
   */
  async insertDocument(collection, document) {
    return this.request('POST', `documents/${collection}`, document);
  }

  /**
   * Update a document in a collection
   * @param {string} collection - Collection name
   * @param {string} id - Document ID
   * @param {Object} update - Update operations ($set, $unset)
   * @returns {Promise} Promise resolving to the updated document
   */
  async updateDocument(collection, id, update) {
    return this.request('PATCH', `documents/${collection}/${id}`, update);
  }

  /**
   * Delete a document from a collection
   * @param {string} collection - Collection name
   * @param {string} id - Document ID
   * @returns {Promise} Promise resolving to the result
   */
  async deleteDocument(collection, id) {
    return this.request('DELETE', `documents/${collection}/${id}`);
  }

  /**
   * Index methods
   */

  /**
   * Get all indexes for a collection
   * @param {string} collection - Collection name
   * @returns {Promise} Promise resolving to the indexes
   */
  async getIndexes(collection) {
    return this.request('GET', `indexes/${collection}`);
  }

  /**
   * Create a new index
   * @param {string} collection - Collection name
   * @param {string} field - Field to index
   * @returns {Promise} Promise resolving to the created index
   */
  async createIndex(collection, field) {
    return this.request('POST', `indexes/${collection}`, { field });
  }

  /**
   * Delete an index
   * @param {string} collection - Collection name
   * @param {string} field - Field name
   * @returns {Promise} Promise resolving to the result
   */
  async deleteIndex(collection, field) {
    return this.request('DELETE', `indexes/${collection}/${field}`);
  }

  /**
   * Aggregation methods
   */

  /**
   * Run an aggregation pipeline on a collection
   * @param {string} collection - Collection name
   * @param {Array} pipeline - Aggregation pipeline stages
   * @returns {Promise} Promise resolving to the result
   */
  async aggregate(collection, pipeline) {
    return this.request('POST', `aggregation/${collection}`, { pipeline });
  }

  /**
   * Backup methods (admin only)
   */

  /**
   * Get all backups
   * @returns {Promise} Promise resolving to the backups
   */
  async getBackups() {
    return this.request('GET', 'backups');
  }

  /**
   * Create a new backup
   * @param {string} name - Backup name (optional)
   * @returns {Promise} Promise resolving to the created backup
   */
  async createBackup(name = '') {
    return this.request('POST', 'backups', { name });
  }

  /**
   * Restore from a backup
   * @param {string} filename - Backup filename
   * @returns {Promise} Promise resolving to the result
   */
  async restoreBackup(filename) {
    return this.request('POST', `backups/restore/${filename}`);
  }

  /**
   * Delete a backup
   * @param {string} filename - Backup filename
   * @returns {Promise} Promise resolving to the result
   */
  async deleteBackup(filename) {
    return this.request('DELETE', `backups/${filename}`);
  }
}

// Export for various module systems
if (typeof module !== 'undefined' && module.exports) {
  // CommonJS/Node.js
  module.exports = PsychoticDBClient;
} else if (typeof define === 'function' && define.amd) {
  // AMD/RequireJS
  define([], function() {
    return PsychoticDBClient;
  });
} else {
  // Browser global
  window.PsychoticDBClient = PsychoticDBClient;
} 