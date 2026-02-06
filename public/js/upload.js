// Upload page functionality
document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const dropArea = document.getElementById('dropArea');
    const fileInput = document.getElementById('fileInput');
    const uploadProgress = document.getElementById('uploadProgress');
    const progressFill = document.getElementById('progressFill');
    const progressPercent = document.getElementById('progressPercent');
    const progressText = document.getElementById('progressText');
    const progressDetails = document.getElementById('progressDetails');
    const cancelBtn = document.getElementById('cancelBtn');
    const selectedFiles = document.getElementById('selectedFiles');
    const uploadsList = document.getElementById('uploadsList');
    
    // State
    let currentFiles = [];
    let currentUpload = null;
    let isUploading = false;
    
    // Initialize
    loadRecentUploads();
    
    // Drag and drop events
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    // Highlight drop area
    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, unhighlight, false);
    });
    
    function highlight() {
        dropArea.classList.add('dragover');
    }
    
    function unhighlight() {
        dropArea.classList.remove('dragover');
    }
    
    // Handle file drop
    dropArea.addEventListener('drop', handleDrop, false);
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = Array.from(dt.files);
        handleFiles(files);
    }
    
    // Handle file input change
    fileInput.addEventListener('change', function(e) {
        const files = Array.from(e.target.files);
        handleFiles(files);
    });
    
    // Handle files selection
    function handleFiles(files) {
        if (files.length === 0) return;
        
        // Validate files
        const validFiles = files.filter(file => {
            // Check file size (100MB limit)
            if (file.size > 100 * 1024 * 1024) {
                Toast.error(`File too large: ${file.name} (Max 100MB)`);
                return false;
            }
            return true;
        });
        
        if (validFiles.length === 0) return;
        
        // Add to current files
        currentFiles = [...currentFiles, ...validFiles];
        
        // Display selected files
        displaySelectedFiles();
        
        // Enable upload progress area
        uploadProgress.style.display = 'block';
        uploadProgress.classList.add('active');
        
        // Reset progress
        resetProgress();
        
        Toast.info(`${validFiles.length} file(s) added. Click "Upload" to proceed.`);
    }
    
    // Display selected files
    function displaySelectedFiles() {
        selectedFiles.innerHTML = '';
        
        if (currentFiles.length === 0) {
            selectedFiles.style.display = 'none';
            return;
        }
        
        selectedFiles.style.display = 'block';
        
        currentFiles.forEach((file, index) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            fileItem.innerHTML = `
                <div class="file-item-icon">
                    <i class="${API.getFileIcon(file.name)}"></i>
                </div>
                <div class="file-item-info">
                    <div class="file-item-name">${API.truncateText(file.name, 40)}</div>
                    <div class="file-item-size">${API.formatFileSize(file.size)}</div>
                </div>
                <button class="file-item-remove" onclick="removeFile(${index})">
                    <i class="fas fa-times"></i>
                </button>
            `;
            selectedFiles.appendChild(fileItem);
        });
    }
    
    // Remove file from selection
    window.removeFile = function(index) {
        currentFiles.splice(index, 1);
        displaySelectedFiles();
        
        if (currentFiles.length === 0) {
            uploadProgress.style.display = 'none';
            uploadProgress.classList.remove('active');
        }
    };
    
    // Upload files
    window.startUpload = async function() {
        if (currentFiles.length === 0) {
            Toast.warning('No files selected');
            return;
        }
        
        if (isUploading) {
            Toast.warning('Upload already in progress');
            return;
        }
        
        isUploading = true;
        cancelBtn.disabled = false;
        progressText.textContent = 'Starting upload...';
        
        try {
            // Update progress UI
            uploadProgress.classList.add('uploading');
            
            // Start upload
            currentUpload = await API.uploadFiles(currentFiles, (percent) => {
                progressFill.style.width = percent + '%';
                progressPercent.textContent = Math.round(percent) + '%';
                progressText.textContent = `Uploading... ${Math.round(percent)}%`;
                
                // Update details
                const uploadedSize = currentFiles.reduce((sum, file) => 
                    sum + (file.size * percent / 100), 0);
                const totalSize = currentFiles.reduce((sum, file) => sum + file.size, 0);
                
                progressDetails.innerHTML = `
                    Uploading ${currentFiles.length} file(s)<br>
                    ${API.formatFileSize(uploadedSize)} of ${API.formatFileSize(totalSize)}
                `;
            });
            
            // Upload complete
            progressFill.style.width = '100%';
            progressPercent.textContent = '100%';
            progressText.textContent = 'Upload complete!';
            
            Toast.success(`Successfully uploaded ${currentFiles.length} file(s)`);
            
            // Reset
            currentFiles = [];
            fileInput.value = '';
            selectedFiles.innerHTML = '';
            selectedFiles.style.display = 'none';
            
            // Load updated recent uploads
            setTimeout(() => {
                loadRecentUploads();
                isUploading = false;
                uploadProgress.classList.remove('uploading');
                
                // Hide progress after delay
                setTimeout(() => {
                    uploadProgress.style.display = 'none';
                    uploadProgress.classList.remove('active');
                }, 2000);
            }, 1000);
            
        } catch (error) {
            console.error('Upload error:', error);
            Toast.error(`Upload failed: ${error.message}`);
            isUploading = false;
            uploadProgress.classList.remove('uploading');
            cancelBtn.disabled = true;
        }
    };
    
    // Cancel upload
    window.cancelUpload = function() {
        if (currentUpload && currentUpload.abort) {
            currentUpload.abort();
            Toast.info('Upload cancelled');
        }
        
        isUploading = false;
        uploadProgress.classList.remove('uploading');
        cancelBtn.disabled = true;
        progressText.textContent = 'Upload cancelled';
        progressFill.style.width = '0%';
        progressPercent.textContent = '0%';
    };
    
    // Reset progress
    function resetProgress() {
        progressFill.style.width = '0%';
        progressPercent.textContent = '0%';
        progressText.textContent = 'Ready to upload';
        progressDetails.innerHTML = '';
        cancelBtn.disabled = false;
    }
    
    // Load recent uploads
    async function loadRecentUploads() {
        try {
            uploadsList.innerHTML = `
                <div class="loading-uploads">
                    <i class="fas fa-spinner fa-spin"></i> Loading recent uploads...
                </div>
            `;
            
            const files = await API.getFiles();
            const recentFiles = files.slice(-5).reverse();
            
            if (recentFiles.length === 0) {
                uploadsList.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-upload"></i>
                        <h3>No uploads yet</h3>
                        <p>Upload your first file to get started</p>
                    </div>
                `;
                return;
            }
            
            uploadsList.innerHTML = recentFiles.map(file => `
                <div class="upload-list-item">
                    <div class="upload-list-icon">
                        <i class="${API.getFileIcon(file.name)}"></i>
                    </div>
                    <div class="upload-list-info">
                        <div class="upload-list-name">${API.truncateText(file.originalName, 30)}</div>
                        <div class="upload-list-meta">
                            <span>${file.size}</span>
                            <span>${API.formatDate(file.uploadDate)}</span>
                        </div>
                    </div>
                    <div class="upload-list-actions">
                        <button onclick="API.downloadFile('${file.name}', '${file.originalName}')">
                            <i class="fas fa-download"></i>
                        </button>
                    </div>
                </div>
            `).join('');
            
        } catch (error) {
            console.error('Failed to load recent uploads:', error);
            uploadsList.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Failed to load uploads</h3>
                    <p>Please try again later</p>
                </div>
            `;
        }
    }
    
    // File input click handler
    dropArea.addEventListener('click', () => {
        fileInput.click();
    });
    
    // Initialize tips
    const tips = document.querySelectorAll('.upload-tips li');
    tips.forEach((tip, index) => {
        tip.style.animationDelay = `${index * 0.2}s`;
    });
    
    // Make functions available globally
    window.API = API;
    window.Toast = Toast;
});
