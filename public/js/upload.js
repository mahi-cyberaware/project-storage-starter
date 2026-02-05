// Upload page functionality
document.addEventListener('DOMContentLoaded', function() {
    const dropArea = document.getElementById('dropArea');
    const fileInput = document.getElementById('fileInput');
    const uploadProgress = document.getElementById('uploadProgress');
    const progressFill = document.getElementById('progressFill');
    const progressPercent = document.getElementById('progressPercent');
    const progressText = document.getElementById('progressText');
    const uploadsList = document.getElementById('uploadsList');
    
    // Load recent uploads
    loadRecentUploads();
    
    // Drag and drop functionality
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
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
    
    dropArea.addEventListener('drop', handleDrop, false);
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    }
    
    fileInput.addEventListener('change', function(e) {
        handleFiles(e.target.files);
    });
    
    async function handleFiles(files) {
        if (files.length === 0) return;
        
        uploadProgress.style.display = 'block';
        progressFill.style.width = '0%';
        progressPercent.textContent = '0%';
        progressText.textContent = `Uploading ${files.length} file(s)...`;
        
        const formData = new FormData();
        for (let i = 0; i < files.length; i++) {
            formData.append('files', files[i]);
        }
        
        try {
            const xhr = new XMLHttpRequest();
            
            xhr.upload.addEventListener('progress', function(e) {
                if (e.lengthComputable) {
                    const percentComplete = (e.loaded / e.total) * 100;
                    progressFill.style.width = percentComplete + '%';
                    progressPercent.textContent = Math.round(percentComplete) + '%';
                }
            });
            
            xhr.addEventListener('load', function() {
                if (xhr.status === 200) {
                    const response = JSON.parse(xhr.responseText);
                    showSuccessMessage(`${files.length} file(s) uploaded successfully!`);
                    loadRecentUploads();
                } else {
                    showErrorMessage('Upload failed. Please try again.');
                }
                
                setTimeout(() => {
                    uploadProgress.style.display = 'none';
                }, 2000);
            });
            
            xhr.addEventListener('error', function() {
                showErrorMessage('Upload failed. Check your connection.');
                uploadProgress.style.display = 'none';
            });
            
            xhr.open('POST', '/api/upload');
            xhr.send(formData);
            
        } catch (error) {
            console.error('Upload error:', error);
            showErrorMessage('Upload failed: ' + error.message);
            uploadProgress.style.display = 'none';
        }
    }
    
    async function loadRecentUploads() {
        try {
            const response = await fetch('/api/files');
            const files = await response.json();
            
            // Show last 5 files
            const recentFiles = files.slice(-5).reverse();
            
            uploadsList.innerHTML = recentFiles.map(file => `
                <div class="upload-item">
                    <div class="upload-item-icon">
                        <i class="${getFileIcon(file.name)}"></i>
                    </div>
                    <div class="upload-item-info">
                        <h4>${truncateText(file.originalName, 25)}</h4>
                        <p>${file.size} • ${formatDate(new Date(file.uploadDate))}</p>
                    </div>
                    <div class="upload-item-actions">
                        <button onclick="downloadFile('${file.name}', '${file.originalName}')">
                            <i class="fas fa-download"></i>
                        </button>
                    </div>
                </div>
            `).join('');
            
        } catch (error) {
            console.error('Error loading recent uploads:', error);
        }
    }
    
    function showSuccessMessage(message) {
        // Create toast notification
        const toast = document.createElement('div');
        toast.className = 'toast success';
        toast.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
        `;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
    
    function showErrorMessage(message) {
        const toast = document.createElement('div');
        toast.className = 'toast error';
        toast.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            <span>${message}</span>
        `;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
    
    function getFileIcon(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        if (['jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(ext)) {
            return 'fas fa-file-image';
        } else if (['pdf'].includes(ext)) {
            return 'fas fa-file-pdf';
        } else if (['mp4', 'avi', 'mov', 'mkv'].includes(ext)) {
            return 'fas fa-file-video';
        } else if (['zip', 'rar', '7z', 'tar'].includes(ext)) {
            return 'fas fa-file-archive';
        } else {
            return 'fas fa-file';
        }
    }
    
    function truncateText(text, maxLength) {
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }
    
    function formatDate(date) {
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    }
    
    // Make functions available globally
    window.downloadFile = async function(filename, originalName) {
        try {
            const response = await fetch(`/api/download/${filename}`);
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = originalName;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                
                showSuccessMessage('Download started!');
            } else {
                showErrorMessage('Download failed');
            }
        } catch (error) {
            showErrorMessage('Download failed: ' + error.message);
        }
    };
});
