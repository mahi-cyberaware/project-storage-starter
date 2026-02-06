// Navigation functionality
document.addEventListener('DOMContentLoaded', function() {
    // Mobile menu toggle
    const mobileMenuBtn = document.querySelector('.mobile-menu');
    const navMenu = document.querySelector('.nav-menu');
    
    if (mobileMenuBtn && navMenu) {
        mobileMenuBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            navMenu.classList.toggle('active');
            mobileMenuBtn.innerHTML = navMenu.classList.contains('active') 
                ? '<i class="fas fa-times"></i>' 
                : '<i class="fas fa-bars"></i>';
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.nav-container')) {
                navMenu.classList.remove('active');
                mobileMenuBtn.innerHTML = '<i class="fas fa-bars"></i>';
            }
        });
        
        // Close menu when clicking a link
        navMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                mobileMenuBtn.innerHTML = '<i class="fas fa-bars"></i>';
            });
        });
    }
    
    // Highlight active link based on current page
    function highlightActiveLink() {
        const currentPath = window.location.pathname;
        const navLinks = document.querySelectorAll('.nav-menu a');
        
        navLinks.forEach(link => {
            const linkPath = link.getAttribute('href');
            link.classList.remove('active');
            
            // Handle exact matches
            if (currentPath === linkPath) {
                link.classList.add('active');
            }
            // Handle home page
            else if (currentPath === '/' && linkPath === '/') {
                link.classList.add('active');
            }
            // Handle index.html
            else if (currentPath === '/index.html' && linkPath === '/') {
                link.classList.add('active');
            }
        });
    }
    
    highlightActiveLink();
    
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Add scroll effect to navbar
    let lastScroll = 0;
    const navbar = document.querySelector('.navbar');
    
    if (navbar) {
        window.addEventListener('scroll', () => {
            const currentScroll = window.pageYOffset;
            
            if (currentScroll <= 0) {
                navbar.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                return;
            }
            
            if (currentScroll > lastScroll) {
                // Scrolling down
                navbar.style.transform = 'translateY(-100%)';
            } else {
                // Scrolling up
                navbar.style.transform = 'translateY(0)';
                navbar.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
            }
            
            lastScroll = currentScroll;
        });
    }
    
    // Add loading indicator for navigation links
    document.querySelectorAll('.nav-menu a').forEach(link => {
        link.addEventListener('click', function(e) {
            // Only add loading for internal links that aren't current page
            const href = this.getAttribute('href');
            const isExternal = href.startsWith('http') || href.startsWith('//');
            const isCurrentPage = window.location.pathname === href;
            
            if (!isExternal && !isCurrentPage) {
                this.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${this.textContent}`;
                this.classList.add('loading');
            }
        });
    });
    
    // Check if user is on mobile
    const isMobile = window.innerWidth <= 768;
    
    // Add touch gestures for mobile menu
    if (isMobile && navMenu) {
        let startX = 0;
        let currentX = 0;
        let isSwiping = false;
        
        navMenu.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            isSwiping = true;
        });
        
        navMenu.addEventListener('touchmove', (e) => {
            if (!isSwiping) return;
            currentX = e.touches[0].clientX;
            const diff = startX - currentX;
            
            // If swiping right, close menu
            if (diff < -50 && navMenu.classList.contains('active')) {
                navMenu.classList.remove('active');
                mobileMenuBtn.innerHTML = '<i class="fas fa-bars"></i>';
                isSwiping = false;
            }
        });
        
        navMenu.addEventListener('touchend', () => {
            isSwiping = false;
        });
    }
});
