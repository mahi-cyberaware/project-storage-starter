// Files browser functionality
document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const filesDisplay = document.getElementById('filesDisplay');
    const searchInput = document.getElementById('searchInput');
    const filterType = document.getElementById('filterType');
    const refreshBtn = document.getElementById('refreshBtn');
    const fileCount = document.getElementById('fileCount');
    const emptyState = document.getElementById('emptyState');
    const bulkActions = document.getElementById('bulkActions');
    const selectedCount = document.getElementById('selectedCount');
    const totalFilesCount = document.getElementById('totalFilesCount');
    const totalStorage = document.getElementById('totalStorage');
    const imageCount = document.getElementById('imageCount');
    const documentCount = document.getElementById('documentCount');
    
    // State
    let allFiles = [];
    let selectedFiles = new Set();
    let currentView = 'grid';
    let currentSearch = '';
    let currentFilter = 'all';
    
    // Initialize
    loadFiles();
    
    // Event Listeners
    searchInput.addEventListener('input', debounce(handleSearch, 300));
    filterType.addEventListener('change', handleFilter);
    refreshBtn.addEventListener('click', handleRefresh);
    
    // View toggle
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const view = this.dataset.view;
            setView(view);
        });
    });
    
    // Load files from API
    async function loadFiles() {
        try {
            showLoading();
            allFiles = await API.getFiles();
            updateStatistics(allFiles);
            renderFiles();
        } catch (error) {
            showError();
        }
    }
    
    // Show loading state
    function showLoading() {
        filesDisplay.innerHTML = `
            <div class="loading-files">
                <i class="fas fa-spinner fa-spin"></i> Loading files...
            </div>
        `;
        refreshBtn.classList.add('spinning');
    }
    
    // Show error state
    function showError() {
        filesDisplay.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Failed to load files</h3>
                <p>Please try again later</p>
                <button class="btn-primary" onclick="location.reload()">
                    <i class="fas fa-redo"></i> Retry
                </button>
            </div>
        `;
        refreshBtn.classList.remove('spinning');
    }
    
    // Update statistics
    function updateStatistics(files) {
        fileCount.textContent = `${files.length} file(s)`;
        totalFilesCount.textContent = files.length;
        
        // Calculate total storage
        const totalSize = files.reduce((sum, file) => {
            const sizeStr = file.size;
            const match = sizeStr.match(/^(\d+(\.\d+)?)\s*(Bytes|KB|MB|GB)$/i);
            if (!match) return sum;
            
            let size = parseFloat(match[1]);
            const unit = match[3].toUpperCase();
            
            // Convert to bytes
            switch (unit) {
                case 'KB': size *= 1024; break;
                case 'MB': size *= 1024 * 1024; break;
                case 'GB': size *= 1024 * 1024 * 1024; break;
            }
            
            return sum + size;
        }, 0);
        
        totalStorage.textContent = API.formatFileSize(totalSize);
        
        // Count by type
        const counts = { image: 0, document: 0 };
        files.forEach(file => {
            const type = file.type || API.getFileType(file.name);
            if (type === 'image') counts.image++;
            if (type === 'document') counts.document++;
        });
        
        imageCount.textContent = counts.image;
        documentCount.textContent = counts.document;
    }
    
    // Render files based on current view, search, and filter
    function renderFiles() {
        refreshBtn.classList.remove('spinning');
        
        // Filter files
        let filteredFiles = allFiles.filter(file => {
            // Search filter
            const matchesSearch = file.originalName.toLowerCase().includes(currentSearch.toLowerCase()) ||
                                file.name.toLowerCase().includes(currentSearch.toLowerCase());
            
            // Type filter
            const fileType = file.type || API.getFileType(file.name);
            const matchesFilter = currentFilter === 'all' || fileType === currentFilter;
            
            return matchesSearch && matchesFilter;
        });
        
        // Update empty state
        if (filteredFiles.length === 0) {
            emptyState.style.display = 'block';
            filesDisplay.innerHTML = '';
        } else {
            emptyState.style.display = 'none';
            
            // Render based on view
            if (currentView === 'grid') {
                renderGridView(filteredFiles);
            } else {
                renderListView(filteredFiles);
            }
        }
        
        // Update bulk actions
        updateBulkActions();
    }
    
    // Render grid view
    function renderGridView(files) {
        filesDisplay.innerHTML = `
            <div class="files-grid">
                ${files.map(file => createFileCard(file)).join('')}
            </div>
        `;
        
        // Add event listeners to checkboxes
        document.querySelectorAll('.file-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', handleFileSelect);
        });
        
        // Add event listeners to action buttons
        document.querySelectorAll('.file-action-btn').forEach(btn => {
            btn.addEventListener('click', handleFileAction);
        });
    }
    
    // Render list view
    function renderListView(files) {
        filesDisplay.innerHTML = `
            <div class="files-list">
                ${files.map(file => createFileListItem(file)).join('')}
            </div>
        `;
        
        // Add event listeners to checkboxes
        document.querySelectorAll('.file-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', handleFileSelect);
        });
        
        // Add event listeners to action buttons
        document.querySelectorAll('.file-action-btn').forEach(btn => {
            btn.addEventListener('click', handleFileAction);
        });
    }
    
    // Create file card for grid view
    function createFileCard(file) {
        const fileType = file.type || API.getFileType(file.name);
        const isSelected = selectedFiles.has(file.name);
        
        return `
            <div class="file-card ${isSelected ? 'selected' : ''}" data-filename="${file.name}">
                <div class="file-header">
                    <input type="checkbox" class="file-checkbox" 
                           ${isSelected ? 'checked' : ''} 
                           data-filename="${file.name}">
                    <div class="file-icon ${fileType}">
                        <i class="${API.getFileIcon(file.name)}"></i>
                    </div>
                    <div class="file-info">
                        <div class="file-name" title="${file.originalName}">
                            ${API.truncateText(file.originalName, 40)}
                        </div>
                        <div class="file-meta">
                            <span>${file.size}</span>
                            <span>${API.formatDate(file.uploadDate)}</span>
                        </div>
                    </div>
                </div>
                <div class="file-body">
                    <p>Type: ${fileType.charAt(0).toUpperCase() + fileType.slice(1)}</p>
                </div>
                <div class="file-actions">
                    <button class="file-action-btn download-btn" data-action="download" data-filename="${file.name}">
                        <i class="fas fa-download"></i> Download
                    </button>
                    <button class="file-action-btn preview-btn" data-action="preview" data-filename="${file.name}">
                        <i class="fas fa-eye"></i> Preview
                    </button>
                    <button class="file-action-btn delete-btn" data-action="delete" data-filename="${file.name}">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `;
    }
    
    // Create file list item
    function createFileListItem(file) {
        const fileType = file.type || API.getFileType(file.name);
        const isSelected = selectedFiles.has(file.name);
        
        return `
            <div class="list-item ${isSelected ? 'selected' : ''}" data-filename="${file.name}">
                <input type="checkbox" class="file-checkbox" 
                       ${isSelected ? 'checked' : ''} 
                       data-filename="${file.name}">
                <div class="file-icon ${fileType}">
                    <i class="${API.getFileIcon(file.name)}"></i>
                </div>
                <div class="file-info">
                    <div class="file-name" title="${file.originalName}">
                        ${file.originalName}
                    </div>
                    <div class="file-meta">
                        <span>${file.size}</span>
                        <span>Type: ${fileType}</span>
                        <span>Uploaded: ${API.formatDate(file.uploadDate)}</span>
                    </div>
                </div>
                <div class="file-actions">
                    <button class="file-action-btn download-btn" data-action="download" data-filename="${file.name}">
                        <i class="fas fa-download"></i>
                    </button>
                    <button class="file-action-btn preview-btn" data-action="preview" data-filename="${file.name}">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="file-action-btn delete-btn" data-action="delete" data-filename="${file.name}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }
    
    // Handle file selection
    function handleFileSelect(e) {
        const filename = e.target.dataset.filename;
        const isChecked = e.target.checked;
        
        if (isChecked) {
            selectedFiles.add(filename);
        } else {
            selectedFiles.delete(filename);
        }
        
        // Update UI
        const fileElement = document.querySelector(`[data-filename="${filename}"]`);
        if (fileElement) {
            fileElement.classList.toggle('selected', isChecked);
        }
        
        updateBulkActions();
    }
    
    // Handle file action
    async function handleFileAction(e) {
        const action = e.target.dataset.action || e.target.closest('button').dataset.action;
        const filename = e.target.dataset.filename || e.target.closest('button').dataset.filename;
        
        const file = allFiles.find(f => f.name === filename);
        if (!file) return;
        
        switch (action) {
            case 'download':
                await API.downloadFile(filename, file.originalName);
                break;
                
            case 'preview':
                await previewFile(file);
                break;
                
            case 'delete':
                if (confirm(`Delete "${file.originalName}"?`)) {
                    await API.deleteFile(filename);
                    await loadFiles();
                }
                break;
        }
    }
    
    // Preview file
    async function previewFile(file) {
        const modal = document.getElementById('previewModal');
        const modalBody = document.getElementById('previewBody');
        const modalTitle = document.getElementById('modalTitle');
        const modalFooter = document.getElementById('modalFooter');
        
        if (!modal || !modalBody) return;
        
        modalTitle.textContent = file.originalName;
        modalBody.innerHTML = `
            <div class="loading">
                <i class="fas fa-spinner fa-spin"></i> Loading preview...
            </div>
        `;
        
        modal.classList.add('active');
        
        try {
            const fileType = file.type || API.getFileType(file.name);
            const previewUrl = API.getPreviewUrl(file.name);
            
            let content = '';
            
            if (fileType === 'image') {
                content = `
                    <div class="image-preview">
                        <img src="${previewUrl}" alt="${file.originalName}" 
                             style="max-width: 100%; max-height: 60vh; border-radius: var(--radius);">
                    </div>
                `;
            } else if (fileType === 'pdf') {
                content = `
                    <div class="pdf-preview">
                        <embed src="${previewUrl}" type="application/pdf" 
                               width="100%" height="500px" 
                               style="border-radius: var(--radius);">
                    </div>
                `;
            } else if (fileType === 'text' || fileType === 'code' || fileType === 'document') {
                const response = await fetch(previewUrl);
                if (response.ok) {
                    const text = await response.text();
                    const safeText = text
                        .replace(/</g, '&lt;')
                        .replace(/>/g, '&gt;')
                        .replace(/"/g, '&quot;')
                        .replace(/'/g, '&#039;');
                    
                    content = `
                        <div class="text-preview">
                            <pre style="background: var(--light-color); padding: 20px; border-radius: var(--radius); 
                                 max-height: 60vh; overflow: auto; font-family: 'Courier New', monospace;">
                                ${safeText}
                            </pre>
                        </div>
                    `;
                } else {
                    content = `
                        <div class="no-preview">
                            <i class="fas fa-file-alt" style="font-size: 4rem; color: var(--text-light);"></i>
                            <h3>Preview not available</h3>
                            <p>This file type cannot be previewed in the browser.</p>
                        </div>
                    `;
                }
            } else {
                content = `
                    <div class="no-preview">
                        <i class="fas fa-file" style="font-size: 4rem; color: var(--text-light);"></i>
                        <h3>Preview not available</h3>
                        <p>This file type cannot be previewed in the browser.</p>
                    </div>
                `;
            }
            
            modalBody.innerHTML = content;
            
            modalFooter.innerHTML = `
                <button class="btn-primary" onclick="API.downloadFile('${file.name}', '${file.originalName}')">
                    <i class="fas fa-download"></i> Download
                </button>
                <button class="btn-secondary" onclick="closePreview()">
                    <i class="fas fa-times"></i> Close
                </button>
            `;
            
        } catch (error) {
            console.error('Preview error:', error);
            modalBody.innerHTML = `
                <div class="error-preview">
                    <i class="fas fa-exclamation-triangle" style="font-size: 4rem; color: var(--danger-color);"></i>
                    <h3>Failed to load preview</h3>
                    <p>${error.message}</p>
                </div>
            `;
        }
    }
    
    // Close preview modal
    window.closePreview = function() {
        const modal = document.getElementById('previewModal');
        if (modal) {
            modal.classList.remove('active');
        }
    };
    
    // Update bulk actions
    function updateBulkActions() {
        if (selectedFiles.size > 0) {
            bulkActions.style.display = 'flex';
            selectedCount.textContent = selectedFiles.size;
        } else {
            bulkActions.style.display = 'none';
        }
    }
    
    // Delete selected files
    window.deleteSelected = async function() {
        if (selectedFiles.size === 0) return;
        
        if (!confirm(`Delete ${selectedFiles.size} selected file(s)?`)) return;
        
        try {
            for (const filename of selectedFiles) {
                await API.deleteFile(filename);
            }
            
            selectedFiles.clear();
            await loadFiles();
            Toast.success(`Deleted ${selectedFiles.size} file(s)`);
            
        } catch (error) {
            Toast.error('Failed to delete some files');
        }
    };
    
    // Download selected files
    window.downloadSelected = async function() {
        if (selectedFiles.size === 0) return;
        
        // For single file, use normal download
        if (selectedFiles.size === 1) {
            const filename = Array.from(selectedFiles)[0];
            const file = allFiles.find(f => f.name === filename);
            if (file) {
                await API.downloadFile(filename, file.originalName);
            }
            return;
        }
        
        // For multiple files, we need to create a zip
        Toast.info('Preparing download... This may take a moment.');
        
        // In a real implementation, you would create a zip on the server
        // For now, we'll download files one by one
        for (const filename of selectedFiles) {
            const file = allFiles.find(f => f.name === filename);
            if (file) {
                await API.downloadFile(filename, file.originalName);
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }
        
        Toast.success(`Downloaded ${selectedFiles.size} file(s)`);
    };
    
    // Clear selection
    window.clearSelection = function() {
        selectedFiles.clear();
        renderFiles();
    };
    
    // Set view mode
    function setView(view) {
        currentView = view;
        
        // Update active button
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });
        
        // Re-render files
        renderFiles();
    }
    
    // Handle search
    function handleSearch(e) {
        currentSearch = e.target.value;
        renderFiles();
    }
    
    // Handle filter
    function handleFilter(e) {
        currentFilter = e.target.value;
        renderFiles();
    }
    
    // Handle refresh
    function handleRefresh() {
        selectedFiles.clear();
        loadFiles();
    }
    
    // Debounce function
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    // Make functions available globally
    window.API = API;
    window.Toast = Toast;
});
