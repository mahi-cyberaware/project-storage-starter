// Homepage functionality
document.addEventListener('DOMContentLoaded', function() {
    // Animate stats counter
    function animateCounter(elementId, target, suffix = '') {
        const element = document.getElementById(elementId);
        let current = 0;
        const increment = target / 100;
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            element.textContent = Math.floor(current) + suffix;
        }, 20);
    }
    
    // Fetch and update stats
    async function updateStats() {
        try {
            const response = await fetch('/api/files');
            const files = await response.json();
            
            // Total files
            animateCounter('totalFiles', files.length);
            
            // Total size
            const totalSize = files.reduce((sum, file) => {
                const size = parseFloat(file.size);
                return sum + (isNaN(size) ? 0 : size);
            }, 0);
            
            // Convert to GB
            const sizeInGB = totalSize / 1024 / 1024 / 1024;
            animateCounter('totalSize', Math.round(sizeInGB * 10) / 10, ' GB');
            
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    }
    
    // Update stats when page loads
    updateStats();
    
    // Auto-refresh stats every 30 seconds
    setInterval(updateStats, 30000);
});
