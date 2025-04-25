// Global variables
let currentCollection = null;
let currentFilter = {};

// DOM Elements
const collectionsListEl = document.getElementById('collections-list');
const documentsListEl = document.getElementById('documents-list');
const currentCollectionEl = document.getElementById('current-collection');
const newCollectionBtn = document.getElementById('new-collection-btn');
const newDocumentBtn = document.getElementById('new-document-btn');
const deleteCollectionBtn = document.getElementById('delete-collection-btn');
const filterInput = document.getElementById('filter-input');
const filterBtn = document.getElementById('filter-btn');
const resetFilterBtn = document.getElementById('reset-filter-btn');

// Modals
const newCollectionModal = document.getElementById('new-collection-modal');
const documentModal = document.getElementById('document-modal');
const confirmModal = document.getElementById('confirm-modal');
const newCollectionForm = document.getElementById('new-collection-form');
const documentForm = document.getElementById('document-form');
const documentModalTitle = document.getElementById('document-modal-title');
const documentContent = document.getElementById('document-content');
const jsonError = document.getElementById('json-error');
const confirmMessage = document.getElementById('confirm-message');
const confirmYesBtn = document.getElementById('confirm-yes');
const confirmNoBtn = document.getElementById('confirm-no');

// Initialize app
async function init() {
  // Set up event listeners
  setupEventListeners();
  
  // Load collections
  await loadCollections();
}

// Setup event listeners
function setupEventListeners() {
  // Collection actions
  newCollectionBtn.addEventListener('click', () => openModal(newCollectionModal));
  newCollectionForm.addEventListener('submit', handleNewCollection);
  deleteCollectionBtn.addEventListener('click', handleDeleteCollection);
  
  // Document actions
  newDocumentBtn.addEventListener('click', () => openNewDocumentModal());
  documentForm.addEventListener('submit', handleSaveDocument);
  
  // Filter actions
  filterBtn.addEventListener('click', applyFilter);
  resetFilterBtn.addEventListener('click', resetFilter);
  
  // Modal actions
  document.querySelectorAll('.close-btn').forEach(btn => {
    btn.addEventListener('click', () => closeAllModals());
  });
  
  document.querySelectorAll('.modal .cancel').forEach(btn => {
    btn.addEventListener('click', () => closeAllModals());
  });
  
  confirmNoBtn.addEventListener('click', closeAllModals);
}

// API Calls
async function fetchCollections() {
  try {
    const response = await fetch('/api/collections');
    if (!response.ok) throw new Error('Failed to fetch collections');
    return await response.json();
  } catch (error) {
    console.error('Error fetching collections:', error);
    return [];
  }
}

async function createCollection(name) {
  try {
    const response = await fetch('/api/collections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create collection');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error creating collection:', error);
    throw error;
  }
}

async function deleteCollection(name) {
  try {
    const response = await fetch(`/api/collections/${name}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete collection');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error deleting collection:', error);
    throw error;
  }
}

async function fetchDocuments(collection, filter = {}) {
  try {
    let url = `/api/documents/${collection}`;
    if (Object.keys(filter).length > 0) {
      url += `?filter=${encodeURIComponent(JSON.stringify(filter))}`;
    }
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch documents');
    return await response.json();
  } catch (error) {
    console.error('Error fetching documents:', error);
    return [];
  }
}

async function saveDocument(collection, document, isNew = true) {
  try {
    const url = `/api/documents/${collection}${isNew ? '' : `/${document._id}`}`;
    const method = isNew ? 'POST' : 'PATCH';
    
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(isNew ? document : { $set: document })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to save document');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error saving document:', error);
    throw error;
  }
}

async function deleteDocument(collection, id) {
  try {
    const response = await fetch(`/api/documents/${collection}/${id}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete document');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error deleting document:', error);
    throw error;
  }
}

// UI Operations
async function loadCollections() {
  collectionsListEl.innerHTML = '<div class="loading">Loading collections...</div>';
  
  const collections = await fetchCollections();
  
  if (collections.length === 0) {
    collectionsListEl.innerHTML = '<div class="empty-state">No collections found</div>';
    return;
  }
  
  collectionsListEl.innerHTML = '';
  collections.forEach(collection => {
    const collectionEl = document.createElement('div');
    collectionEl.className = 'collection-item';
    collectionEl.setAttribute('data-name', collection.name);
    collectionEl.innerHTML = `
      <div class="name">${collection.name}</div>
      <div class="count">${collection.documentCount} document${collection.documentCount !== 1 ? 's' : ''}</div>
    `;
    
    collectionEl.addEventListener('click', () => selectCollection(collection.name));
    collectionsListEl.appendChild(collectionEl);
  });
}

async function selectCollection(name) {
  // Update UI state
  currentCollection = name;
  currentCollectionEl.textContent = name;
  
  // Update active collection in sidebar
  document.querySelectorAll('.collection-item').forEach(item => {
    item.classList.remove('active');
  });
  
  const selectedItem = document.querySelector(`.collection-item[data-name="${name}"]`);
  if (selectedItem) selectedItem.classList.add('active');
  
  // Enable buttons
  newDocumentBtn.disabled = false;
  deleteCollectionBtn.disabled = false;
  filterInput.disabled = false;
  filterBtn.disabled = false;
  resetFilterBtn.disabled = false;
  
  // Reset filter
  resetFilter();
}

async function loadDocuments(filter = {}) {
  if (!currentCollection) return;
  
  documentsListEl.innerHTML = '<div class="loading">Loading documents...</div>';
  
  const documents = await fetchDocuments(currentCollection, filter);
  
  if (documents.length === 0) {
    documentsListEl.innerHTML = '<div class="empty-state">No documents found</div>';
    return;
  }
  
  documentsListEl.innerHTML = '';
  documents.forEach(document => {
    const documentId = document._id;
    const documentCopy = { ...document };
    delete documentCopy._id; // Remove ID from display
    
    const documentEl = document.createElement('div');
    documentEl.className = 'document-card';
    documentEl.innerHTML = `
      <div class="document-header">
        <div class="document-id">ID: ${documentId}</div>
        <div class="document-actions">
          <button class="btn small edit-btn">Edit</button>
          <button class="btn small danger delete-btn">Delete</button>
        </div>
      </div>
      <div class="document-content">
        <pre>${JSON.stringify(documentCopy, null, 2)}</pre>
      </div>
    `;
    
    // Add event listeners
    documentEl.querySelector('.edit-btn').addEventListener('click', () => {
      openEditDocumentModal(document);
    });
    
    documentEl.querySelector('.delete-btn').addEventListener('click', () => {
      openConfirmDeleteDocumentModal(documentId);
    });
    
    documentsListEl.appendChild(documentEl);
  });
}

// Modal handlers
function openModal(modal) {
  closeAllModals();
  modal.classList.add('open');
}

function closeAllModals() {
  document.querySelectorAll('.modal').forEach(modal => {
    modal.classList.remove('open');
  });
  
  // Reset forms
  newCollectionForm.reset();
  documentForm.reset();
  jsonError.textContent = '';
}

function openNewDocumentModal() {
  documentModalTitle.textContent = 'Add New Document';
  documentContent.value = '{\n  \n}';
  documentForm.dataset.mode = 'new';
  documentForm.dataset.id = '';
  openModal(documentModal);
}

function openEditDocumentModal(document) {
  documentModalTitle.textContent = 'Edit Document';
  const documentCopy = { ...document };
  const id = documentCopy._id;
  delete documentCopy._id; // Remove ID for editing
  
  documentContent.value = JSON.stringify(documentCopy, null, 2);
  documentForm.dataset.mode = 'edit';
  documentForm.dataset.id = id;
  openModal(documentModal);
}

function openConfirmDeleteCollectionModal() {
  confirmMessage.textContent = `Are you sure you want to delete the collection "${currentCollection}"? This cannot be undone.`;
  confirmYesBtn.dataset.action = 'delete-collection';
  openModal(confirmModal);
}

function openConfirmDeleteDocumentModal(id) {
  confirmMessage.textContent = `Are you sure you want to delete this document? This cannot be undone.`;
  confirmYesBtn.dataset.action = 'delete-document';
  confirmYesBtn.dataset.id = id;
  openModal(confirmModal);
}

// Form handlers
async function handleNewCollection(event) {
  event.preventDefault();
  
  const nameInput = document.getElementById('collection-name');
  const name = nameInput.value.trim();
  
  if (!name) return;
  
  try {
    await createCollection(name);
    closeAllModals();
    await loadCollections();
    selectCollection(name);
  } catch (error) {
    alert(`Failed to create collection: ${error.message}`);
  }
}

async function handleSaveDocument(event) {
  event.preventDefault();
  
  if (!currentCollection) return;
  
  try {
    // Parse JSON
    const json = documentContent.value.trim();
    let document;
    
    try {
      document = JSON.parse(json);
      jsonError.textContent = '';
    } catch (e) {
      jsonError.textContent = 'Invalid JSON: ' + e.message;
      return;
    }
    
    const isNew = documentForm.dataset.mode === 'new';
    const id = documentForm.dataset.id;
    
    if (!isNew) {
      document._id = id;
    }
    
    await saveDocument(currentCollection, document, isNew);
    closeAllModals();
    await loadDocuments(currentFilter);
  } catch (error) {
    alert(`Failed to save document: ${error.message}`);
  }
}

async function handleDeleteCollection() {
  if (!currentCollection) return;
  openConfirmDeleteCollectionModal();
}

async function handleDeleteConfirmation() {
  const action = confirmYesBtn.dataset.action;
  
  if (action === 'delete-collection') {
    try {
      await deleteCollection(currentCollection);
      currentCollection = null;
      currentCollectionEl.textContent = 'No Collection Selected';
      
      // Reset UI
      documentsListEl.innerHTML = '<div class="empty-state"><p>Select a collection to view documents</p></div>';
      newDocumentBtn.disabled = true;
      deleteCollectionBtn.disabled = true;
      filterInput.disabled = true;
      filterBtn.disabled = true;
      resetFilterBtn.disabled = true;
      
      // Reload collections
      await loadCollections();
    } catch (error) {
      alert(`Failed to delete collection: ${error.message}`);
    }
  } else if (action === 'delete-document') {
    const id = confirmYesBtn.dataset.id;
    try {
      await deleteDocument(currentCollection, id);
      await loadDocuments(currentFilter);
    } catch (error) {
      alert(`Failed to delete document: ${error.message}`);
    }
  }
  
  closeAllModals();
}

// Filter handling
function applyFilter() {
  if (!currentCollection) return;
  
  const filterText = filterInput.value.trim();
  
  if (!filterText) {
    resetFilter();
    return;
  }
  
  try {
    currentFilter = JSON.parse(filterText);
    loadDocuments(currentFilter);
  } catch (e) {
    alert('Invalid JSON filter: ' + e.message);
  }
}

function resetFilter() {
  filterInput.value = '';
  currentFilter = {};
  loadDocuments();
}

// Initialize confirm button
confirmYesBtn.addEventListener('click', handleDeleteConfirmation);

// Initialize the app
document.addEventListener('DOMContentLoaded', init); 