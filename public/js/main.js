document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const dropArea = document.getElementById('dropArea');
    const fileInput = document.getElementById('fileInput');
    const uploadProgress = document.getElementById('uploadProgress');
    const progressBar = document.getElementById('progressBar');
    const fileList = document.getElementById('fileList');
    const searchInput = document.getElementById('searchInput');
    const modal = document.getElementById('fileModal');

    let allFiles = [];

    // Initialize
    loadFiles();

    // Event Listeners
    fileInput.addEventListener('change', handleFileSelect);
    searchInput.addEventListener('input', filterFiles);

    // Drag and Drop Events
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

    // File Handling Functions
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    }

    function handleFileSelect(e) {
        const files = e.target.files;
        handleFiles(files);
    }

    async function handleFiles(files) {
        if (files.length === 0) return;

        uploadProgress.style.display = 'block';
        progressBar.style.width = '0%';

        const formData = new FormData();
        for (let i = 0; i < files.length; i++) {
            formData.append('files', files[i]);
        }

        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            
            if (response.ok) {
                alert(`${files.length} file(s) uploaded successfully!`);
                fileInput.value = '';
                loadFiles();
            } else {
                alert('Upload failed: ' + data.error);
            }
        } catch (error) {
            alert('Upload failed: ' + error.message);
        } finally {
            uploadProgress.style.display = 'none';
            progressBar.style.width = '0%';
        }
    }

    // Load files from server
    async function loadFiles() {
        try {
            const response = await fetch('/api/files');
            const files = await response.json();
            allFiles = files;
            displayFiles(files);
        } catch (error) {
            fileList.innerHTML = '<div class="no-files">Error loading files</div>';
        }
    }

    // Display files in the list
    function displayFiles(files) {
        if (files.length === 0) {
            fileList.innerHTML = '<div class="no-files">No files uploaded yet</div>';
            return;
        }

        fileList.innerHTML = files.map(file => `
            <div class="file-card">
                <div class="file-header">
                    <i class="fas fa-file-alt file-icon"></i>
                    <div class="file-info">
                        <h4 title="${file.originalName}">${truncateText(file.originalName, 30)}</h4>
                        <p class="file-size">${file.size}</p>
                    </div>
                </div>
                <div class="file-meta">
                    <span>${new Date(file.uploadDate).toLocaleDateString()}</span>
                    <span>${getFileType(file.name)}</span>
                </div>
                <div class="file-actions">
                    <button class="action-btn download-btn" onclick="downloadFile('${file.name}', '${file.originalName}')">
                        <i class="fas fa-download"></i> Download
                    </button>
                    <button class="action-btn preview-btn" onclick="previewFile('${file.name}')">
                        <i class="fas fa-eye"></i> Preview
                    </button>
                    <button class="action-btn delete-btn" onclick="deleteFile('${file.name}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `).join('');
    }

    // Filter files based on search input
    function filterFiles() {
        const searchTerm = searchInput.value.toLowerCase();
        const filteredFiles = allFiles.filter(file => 
            file.originalName.toLowerCase().includes(searchTerm) ||
            file.name.toLowerCase().includes(searchTerm)
        );
        displayFiles(filteredFiles);
    }

    // Helper function to truncate text
    function truncateText(text, maxLength) {
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }

    // Helper function to get file type
    function getFileType(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        const types = {
            'jpg': 'Image',
            'jpeg': 'Image',
            'png': 'Image',
            'gif': 'Image',
            'pdf': 'PDF',
            'doc': 'Document',
            'docx': 'Document',
            'txt': 'Text',
            'zip': 'Archive',
            'rar': 'Archive',
            'mp4': 'Video',
            'mp3': 'Audio',
            'js': 'JavaScript',
            'html': 'HTML',
            'css': 'CSS',
            'py': 'Python',
            'java': 'Java',
            'cpp': 'C++'
        };
        return types[ext] || 'File';
    }

    // Make functions globally available
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
            } else {
                alert('Download failed');
            }
        } catch (error) {
            alert('Download failed: ' + error.message);
        }
    };

    window.previewFile = async function(filename) {
        try {
            const response = await fetch(`/api/download/${filename}`);
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                
                const fileType = getFileType(filename);
                let content = '';
                
                if (fileType === 'Image') {
                    content = `<img src="${url}" style="max-width: 100%; max-height: 80vh;" alt="Preview">`;
                } else if (fileType === 'PDF') {
                    content = `<embed src="${url}" type="application/pdf" width="100%" height="600px">`;
                } else if (fileType === 'Text' || fileType === 'JavaScript' || fileType === 'HTML' || fileType === 'CSS') {
                    const text = await blob.text();
                    content = `<pre style="max-height: 70vh; overflow: auto; background: #f4f4f4; padding: 20px; border-radius: 5px;">${escapeHtml(text)}</pre>`;
                } else {
                    content = `<p>Preview not available for this file type.</p>
                              <p>Click "Download" to save the file.</p>`;
                }
                
                document.getElementById('modalBody').innerHTML = content;
                modal.style.display = 'flex';
            }
        } catch (error) {
            alert('Preview failed: ' + error.message);
        }
    };

    window.closeModal = function() {
        modal.style.display = 'none';
        document.getElementById('modalBody').innerHTML = '';
    };

    window.deleteFile = async function(filename) {
        if (confirm('Are you sure you want to delete this file?')) {
            try {
                const response = await fetch(`/api/files/${filename}`, {
                    method: 'DELETE'
                });
                
                if (response.ok) {
                    alert('File deleted successfully');
                    loadFiles();
                } else {
                    alert('Delete failed');
                }
            } catch (error) {
                alert('Delete failed: ' + error.message);
            }
        }
    };

    // Helper function to escape HTML
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Close modal when clicking outside
    window.onclick = function(event) {
        if (event.target === modal) {
            closeModal();
        }
    };
});
