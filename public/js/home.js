// Homepage functionality
document.addEventListener('DOMContentLoaded', async function() {
    // Initialize API if not already loaded
    if (typeof API === 'undefined') {
        console.error('API is not loaded');
        return;
    }
    
    // Update statistics
    async function updateStatistics() {
        try {
            const files = await API.getFiles();
            
            // Update total files count
            const totalFilesElement = document.getElementById('totalFiles');
            if (totalFilesElement) {
                animateCounter(totalFilesElement, files.length);
            }
            
            // Calculate total storage used
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
            
            // Format and display total storage
            const totalStorageElement = document.getElementById('totalSize');
            if (totalStorageElement) {
                const sizeInGB = totalSize / (1024 * 1024 * 1024);
                animateCounter(totalStorageElement, Math.round(sizeInGB * 10) / 10, ' GB');
            }
            
            // Count files by type
            const fileTypes = files.reduce((acc, file) => {
                const type = file.type || API.getFileType(file.name);
                acc[type] = (acc[type] || 0) + 1;
                return acc;
            }, {});
            
            // Update type-specific counts if elements exist
            const imageCountElement = document.getElementById('imageCount');
            if (imageCountElement) {
                animateCounter(imageCountElement, fileTypes.image || 0);
            }
            
            const documentCountElement = document.getElementById('documentCount');
            if (documentCountElement) {
                animateCounter(documentCountElement, fileTypes.document || 0);
            }
            
        } catch (error) {
            console.error('Failed to update statistics:', error);
        }
    }
    
    // Animated counter
    function animateCounter(element, target, suffix = '') {
        let current = 0;
        const increment = target / 100;
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            
            if (suffix.includes('GB')) {
                element.textContent = current.toFixed(1) + suffix;
            } else {
                element.textContent = Math.floor(current) + suffix;
            }
        }, 20);
    }
    
    // Initialize features animation
    function initFeatureAnimations() {
        const featureCards = document.querySelectorAll('.feature-card');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, { threshold: 0.1 });
        
        featureCards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            card.style.transitionDelay = `${index * 0.1}s`;
            observer.observe(card);
        });
    }
    
    // Initialize stats animation
    function initStatsAnimation() {
        const statItems = document.querySelectorAll('.stat-item');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate');
                    
                    // Animate numbers if they exist
                    const numberElement = entry.target.querySelector('h3');
                    if (numberElement && !numberElement.dataset.animated) {
                        const target = parseInt(numberElement.textContent) || 0;
                        numberElement.dataset.animated = true;
                        animateCounter(numberElement, target);
                    }
                }
            });
        }, { threshold: 0.5 });
        
        statItems.forEach(item => {
            observer.observe(item);
        });
    }
    
    // Initialize hero image parallax
    function initParallax() {
        const heroImage = document.querySelector('.hero-image img');
        if (!heroImage) return;
        
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            const rate = scrolled * -0.5;
            heroImage.style.transform = `perspective(1000px) rotateY(-10deg) translateY(${rate}px)`;
        });
    }
    
    // Quick action cards hover effect
    function initQuickActions() {
        const actionCards = document.querySelectorAll('.action-card');
        
        actionCards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-10px) scale(1.05)';
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0) scale(1)';
            });
        });
    }
    
    // Initialize everything
    async function init() {
        await updateStatistics();
        initFeatureAnimations();
        initStatsAnimation();
        initParallax();
        initQuickActions();
        
        // Auto-refresh statistics every 30 seconds
        setInterval(updateStatistics, 30000);
        
        // Check for new files every minute
        setInterval(updateStatistics, 60000);
    }
    
    // Start initialization
    init();
    
    // Add loading state to CTA buttons
    document.querySelectorAll('.hero-buttons a, .cta-buttons a').forEach(button => {
        button.addEventListener('click', function(e) {
            // Don't interrupt actual navigation
            if (this.getAttribute('href') && this.getAttribute('href') !== '#') {
                this.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${this.textContent}`;
                setTimeout(() => {
                    this.innerHTML = this.innerHTML.replace('<i class="fas fa-spinner fa-spin"></i> ', '');
                }, 2000);
            }
        });
    });
});
