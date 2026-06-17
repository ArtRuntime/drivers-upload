// Frontend application logic for the driver catalog
document.addEventListener('DOMContentLoaded', () => {
  // State
  let files = window.REPO_FILES || [];
  let searchQuery = '';
  let activeCategory = 'all';

  // DOM Elements
  const searchInput = document.getElementById('search-input');
  const filterTabsContainer = document.getElementById('filter-tabs');
  const filesGrid = document.getElementById('files-grid');
  const totalFilesEl = document.getElementById('total-files');
  const qxCountEl = document.getElementById('qx-count');
  const rtCountEl = document.getElementById('rt-count');
  const autoCountEl = document.getElementById('auto-count');
  const toast = document.getElementById('toast');
  const toastText = document.getElementById('toast-text');

  // Categories Mapping
  const categories = [
    { id: 'all', label: 'All Files' },
    { id: 'QX-Drivers', label: 'QX-Drivers' },
    { id: 'RT-Drivers', label: 'RT-Drivers' },
    { id: 'auto-rt-ko-drivers', label: 'Auto RT Drivers' },
    { id: 'Root', label: 'Core Files' }
  ];

  // Icons Helper
  function getFileIcon(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    
    if (ext === 'apk') {
      // Android APK Icon (Green)
      return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-smartphone"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>`;
    }
    if (ext === 'sh') {
      // Shell Script Icon (Orange/Console)
      return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-terminal"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>`;
    }
    if (ext === 'zip') {
      // Archive Zip Icon (Blue/Cyan)
      return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-archive"><polyline points="21 8 21 21 3 21 3 8"></polyline><rect x="1" y="3" width="22" height="5"></rect><line x1="10" y1="12" x2="14" y2="12"></line></svg>`;
    }
    if (ext === 'ko' || ext === 'kpm') {
      // Kernel Module / Driver Chip Icon (Indigo)
      return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-cpu"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><rect x="9" y="9" width="6" height="6"></rect><line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="23"></line><line x1="15" y1="20" x2="15" y2="23"></line><line x1="20" y1="9" x2="23" y2="9"></line><line x1="20" y1="15" x2="23" y2="15"></line><line x1="1" y1="9" x2="4" y2="9"></line><line x1="1" y1="15" x2="4" y2="15"></line></svg>`;
    }
    // Default File Icon
    return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-file"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>`;
  }

  // Format File Size
  function formatBytes(bytes, decimals = 2) {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  // Get Folder CSS badge
  function getFolderBadgeClass(folder) {
    switch (folder) {
      case 'QX-Drivers': return 'badge-qx';
      case 'RT-Drivers': return 'badge-rt';
      case 'auto-rt-ko-drivers': return 'badge-auto';
      default: return 'badge-root';
    }
  }

  // Display Folder Friendly Name
  function getFolderFriendlyName(folder) {
    switch (folder) {
      case 'QX-Drivers': return 'QX-Drivers';
      case 'RT-Drivers': return 'RT-Drivers';
      case 'auto-rt-ko-drivers': return 'Auto RT';
      default: return 'Core';
    }
  }

  // Show Toast Notification
  function showToast(message) {
    toastText.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 2500);
  }

  // Get Absolute URL for Curl Command
  function getAbsoluteUrl(relativePath) {
    if (window.location.protocol.startsWith('http')) {
      const base = window.location.origin + window.location.pathname.replace(/\/index\.html$/, '').replace(/\/$/, '');
      return `${base}/${relativePath}`;
    }
    // Fallback for local files
    return `https://github-pages-url.placeholder.io/${relativePath}`;
  }

  // Calculate Statistics
  function updateStats() {
    totalFilesEl.textContent = files.length;
    qxCountEl.textContent = files.filter(f => f.folder === 'QX-Drivers').length;
    rtCountEl.textContent = files.filter(f => f.folder === 'RT-Drivers').length;
    autoCountEl.textContent = files.filter(f => f.folder === 'auto-rt-ko-drivers').length;
  }

  // Copy text helper
  function copyToClipboard(text, successMessage) {
    navigator.clipboard.writeText(text)
      .then(() => showToast(successMessage))
      .catch(() => showToast('Failed to copy. Please select and copy manually.'));
  }

  // Highlight Text matches
  function highlightText(text, query) {
    if (!query) return text;
    const regex = new RegExp(`(${query.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  // Render Category Filters dynamically
  function renderFilters() {
    filterTabsContainer.innerHTML = '';
    categories.forEach(cat => {
      const count = cat.id === 'all' 
        ? files.length 
        : files.filter(f => f.folder === cat.id).length;
        
      const tab = document.createElement('button');
      tab.className = `filter-tab ${activeCategory === cat.id ? 'active' : ''}`;
      tab.innerHTML = `
        ${cat.label}
        <span class="filter-count">${count}</span>
      `;
      tab.addEventListener('click', () => {
        activeCategory = cat.id;
        renderFilters();
        renderFilesList();
      });
      filterTabsContainer.appendChild(tab);
    });
  }

  // Render File list
  function renderFilesList() {
    filesGrid.innerHTML = '';
    
    // Filter
    const filteredFiles = files.filter(file => {
      const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            file.folder.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === 'all' || file.folder === activeCategory;
      return matchesSearch && matchesCategory;
    });

    // Handle Empty state
    if (filteredFiles.length === 0) {
      filesGrid.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
          </div>
          <div class="empty-title">No Files Found</div>
          <p>We couldn't find any files matching "${searchQuery}" in this category.</p>
        </div>
      `;
      return;
    }

    // Populate
    filteredFiles.forEach(file => {
      const row = document.createElement('div');
      row.className = 'file-row';

      const absoluteUrl = getAbsoluteUrl(file.path);
      const curlCommand = `curl -L -O "${absoluteUrl}"`;
      
      const highlightedName = highlightText(file.name, searchQuery);
      const badgeClass = getFolderBadgeClass(file.folder);
      const folderFriendly = getFolderFriendlyName(file.folder);

      row.innerHTML = `
        <div class="file-type-icon ${file.name.split('.').pop().toLowerCase()}">
          ${getFileIcon(file.name)}
        </div>
        <div class="file-meta">
          <div class="file-name-container">
            <a href="${file.path}" download="${file.name}" class="file-name">${highlightedName}</a>
            <span class="folder-badge ${badgeClass}">${folderFriendly}</span>
          </div>
          <div class="file-details">
            <span class="file-size-badge">${formatBytes(file.size)}</span>
            ${file.lastModified ? `<span>•</span> <span>Modified: ${new Date(file.lastModified).toLocaleDateString()}</span>` : ''}
          </div>
        </div>
        <div class="action-buttons">
          <a href="${file.path}" download="${file.name}" class="btn btn-primary" title="Download File">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            Download
          </a>
          <button class="btn btn-secondary copy-curl" title="Copy Curl Download Command">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>
            cURL
          </button>
        </div>
      `;

      // Copy cURL command listener
      row.querySelector('.copy-curl').addEventListener('click', (e) => {
        e.preventDefault();
        copyToClipboard(curlCommand, 'cURL command copied to clipboard!');
      });

      filesGrid.appendChild(row);
    });
  }

  // Setup Event Listeners
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderFilesList();
  });

  // Init UI
  updateStats();
  renderFilters();
  renderFilesList();
});
