// API Base URL
const API_BASE = window.location.origin;

// Toast System
class Toast {
    static show(message, type = 'info', duration = 3000) {
        const container = document.getElementById('toastContainer') || (() => {
            const div = document.createElement('div');
            div.id = 'toastContainer';
            document.body.appendChild(div);
            return div;
        })();

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icon = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        }[type] || 'fas fa-info-circle';

        toast.innerHTML = `
            <i class="${icon}"></i>
            <span>${message}</span>
        `;

        container.appendChild(toast);

        // Auto remove
        setTimeout(() => {
            toast.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => toast.remove(), 300);
        }, duration);

        // Click to dismiss
        toast.addEventListener('click', () => {
            toast.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => toast.remove(), 300);
        });
    }

    static success(message) {
        this.show(message, 'success');
    }

    static error(message) {
        this.show(message, 'error');
    }

    static warning(message) {
        this.show(message, 'warning');
    }

    static info(message) {
        this.show(message, 'info');
    }
}

// API Functions
const API = {
    // Get all files
    async getFiles() {
        try {
            const response = await fetch(`${API_BASE}/api/files`);
            if (!response.ok) throw new Error('Failed to fetch files');
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            Toast.error('Failed to load files');
            throw error;
        }
    },

    // Upload files
    async uploadFiles(files, onProgress = null) {
        const formData = new FormData();
        for (let i = 0; i < files.length; i++) {
            formData.append('files', files[i]);
        }

        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            
            if (onProgress) {
                xhr.upload.addEventListener('progress', (e) => {
                    if (e.lengthComputable) {
                        const percent = (e.loaded / e.total) * 100;
                        onProgress(percent);
                    }
                });
            }

            xhr.addEventListener('load', () => {
                if (xhr.status === 200) {
                    try {
                        const response = JSON.parse(xhr.responseText);
                        resolve(response);
                    } catch (e) {
                        reject(new Error('Invalid response from server'));
                    }
                } else {
                    reject(new Error(`Upload failed: ${xhr.status}`));
                }
            });

            xhr.addEventListener('error', () => {
                reject(new Error('Network error'));
            });

            xhr.open('POST', `${API_BASE}/api/upload`);
            xhr.send(formData);
        });
    },

    // Delete file
    async deleteFile(filename) {
        try {
            const response = await fetch(`${API_BASE}/api/files/${filename}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) throw new Error('Failed to delete file');
            
            const data = await response.json();
            Toast.success('File deleted successfully');
            return data;
        } catch (error) {
            console.error('Delete Error:', error);
            Toast.error('Failed to delete file');
            throw error;
        }
    },

    // Download file
    async downloadFile(filename, originalName) {
        try {
            const response = await fetch(`${API_BASE}/api/download/${filename}`);
            
            if (!response.ok) throw new Error('Failed to download file');
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = originalName || filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            Toast.success('Download started');
            return true;
        } catch (error) {
            console.error('Download Error:', error);
            Toast.error('Failed to download file');
            return false;
        }
    },

    // Get file preview URL
    getPreviewUrl(filename) {
        return `${API_BASE}/api/download/${filename}`;
    },

    // Get file type
    getFileType(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        const types = {
            // Images
            'jpg': 'image', 'jpeg': 'image', 'png': 'image', 'gif': 'image',
            'webp': 'image', 'svg': 'image', 'bmp': 'image',
            
            // Videos
            'mp4': 'video', 'avi': 'video', 'mov': 'video', 'mkv': 'video',
            'webm': 'video', 'wmv': 'video',
            
            // Audio
            'mp3': 'audio', 'wav': 'audio', 'ogg': 'audio', 'm4a': 'audio',
            'flac': 'audio',
            
            // Documents
            'pdf': 'document', 'doc': 'document', 'docx': 'document',
            'txt': 'document', 'rtf': 'document', 'odt': 'document',
            
            // Spreadsheets
            'xls': 'document', 'xlsx': 'document', 'csv': 'document',
            
            // Presentations
            'ppt': 'document', 'pptx': 'document',
            
            // Code
            'js': 'code', 'html': 'code', 'css': 'code', 'py': 'code',
            'java': 'code', 'cpp': 'code', 'c': 'code', 'php': 'code',
            'json': 'code', 'xml': 'code',
            
            // Archives
            'zip': 'archive', 'rar': 'archive', '7z': 'archive',
            'tar': 'archive', 'gz': 'archive',
            
            // Executables
            'exe': 'other', 'msi': 'other', 'apk': 'other'
        };
        
        return types[ext] || 'other';
    },

    // Get file icon
    getFileIcon(filename) {
        const type = this.getFileType(filename);
        const icons = {
            'image': 'fas fa-file-image',
            'video': 'fas fa-file-video',
            'audio': 'fas fa-file-audio',
            'document': 'fas fa-file-pdf',
            'code': 'fas fa-file-code',
            'archive': 'fas fa-file-archive',
            'other': 'fas fa-file'
        };
        return icons[type] || 'fas fa-file';
    },

    // Format file size
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    // Format date
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    // Truncate text
    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }
};

// Make API available globally
window.API = API;
window.Toast = Toast;
