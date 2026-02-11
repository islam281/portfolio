// ===== DOM Elements =====
const navLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('.section');

// ===== Navigation - Scroll Based =====
function initNavigation() {
    const mainContent = document.querySelector('.main-content');
    
    // Click navigation - smooth scroll to section
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetSection = link.getAttribute('data-section');
            const targetElement = document.getElementById(targetSection);
            
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth' });
                
                // Update active nav link
                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
                
                // Close mobile menu if open
                closeMobileMenu();
                
                // Update URL hash
                history.pushState(null, null, `#${targetSection}`);
            }
        });
    });
    
    // Scroll spy - update active nav on scroll
    const observerOptions = {
        root: null,
        rootMargin: '-20% 0px -70% 0px',
        threshold: 0
    };
    
    const scrollObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const sectionId = entry.target.id;
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('data-section') === sectionId) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }, observerOptions);
    
    sections.forEach(section => {
        scrollObserver.observe(section);
    });
    
    // Handle initial hash
    if (window.location.hash) {
        const hash = window.location.hash.substring(1);
        const targetElement = document.getElementById(hash);
        if (targetElement) {
            setTimeout(() => {
                targetElement.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        }
    }
}

// ===== Mobile Menu =====
function initMobileMenu() {
    const menuToggle = document.querySelector('.menu-toggle');
    const nav = document.querySelector('.nav');
    
    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    document.body.appendChild(overlay);
    
    if (menuToggle && nav) {
        menuToggle.addEventListener('click', () => {
            nav.classList.toggle('active');
            overlay.classList.toggle('active');
            menuToggle.innerHTML = nav.classList.contains('active') 
                ? '<i class="fas fa-times"></i>' 
                : '<i class="fas fa-bars"></i>';
        });
    }
    
    overlay.addEventListener('click', closeMobileMenu);
}

function closeMobileMenu() {
    const nav = document.querySelector('.nav');
    const overlay = document.querySelector('.overlay');
    const menuToggle = document.querySelector('.menu-toggle');
    
    if (nav && nav.classList.contains('active')) {
        nav.classList.remove('active');
        overlay.classList.remove('active');
        if (menuToggle) {
            menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
        }
    }
}



// ===== Form Handling =====
function initContactForm() {
    const form = document.querySelector('.contact-form');
    if (!form) return;
    
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);
        
        // Here you would typically send the data to a server
        console.log('Form submitted:', data);
        
        // Show success message
        alert('Thank you for your message! I will get back to you soon.');
        form.reset();
    });
}

// ===== Smooth Scroll for Internal Links =====
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            // Skip if it's a nav link (handled by navigation)
            if (this.classList.contains('nav-link')) return;
            
            e.preventDefault();
            const targetId = href.substring(1);
            const targetLink = document.querySelector(`[data-section="${targetId}"]`);
            if (targetLink) {
                targetLink.click();
            }
        });
    });
}

// ===== Typing Effect for Hero Subtitle =====
function initTypingEffect() {
    const heroSubtitle = document.querySelector('.hero-subtitle');
    if (!heroSubtitle) return;
    
    const text = "Machine Learning engineer building practical models for fraud, churn, pricing, NLP, and computer vision problems.";
    heroSubtitle.innerHTML = '';
    
    let i = 0;
    const typeWriter = () => {
        if (i < text.length) {
            heroSubtitle.innerHTML += text.charAt(i);
            i++;
            setTimeout(typeWriter, 50);
        } else {
            // Add blinking cursor at end, then remove after a delay
            heroSubtitle.classList.add('typing-done');
        }
    };
    
    // Delay start for better effect
    setTimeout(typeWriter, 800);
}

// ===== Intersection Observer for Animations =====
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);
    
    // Observe cards
    document.querySelectorAll('.skill-card, .project-card, .course-card, .contact-item').forEach(card => {
        observer.observe(card);
    });
}

// ===== Add CSS Animation Classes =====
function addAnimationStyles() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes lineGlow {
            0%, 100% { opacity: 0.15; stroke: var(--accent-cyan); }
            50% { opacity: 0.4; stroke: var(--accent-green); }
        }
        
        @keyframes blink {
            0%, 50% { opacity: 1; }
            51%, 100% { opacity: 0; }
        }
        
        @keyframes particlePulse {
            0%, 100% { opacity: 0.8; }
            50% { opacity: 1; }
        }
        
        .hero-subtitle::after {
            content: '|';
            color: var(--accent-cyan);
            animation: blink 1s infinite;
            margin-left: 2px;
        }
        
        .hero-subtitle.typing-done::after {
            animation: blink 1s 3;
            animation-fill-mode: forwards;
            opacity: 0;
        }
        
        .skill-card, .project-card, .course-card, .contact-item {
            opacity: 0;
            transform: translateY(20px);
            transition: opacity 0.5s ease, transform 0.5s ease;
        }
        
        .skill-card.animate-in, .project-card.animate-in, 
        .course-card.animate-in, .contact-item.animate-in {
            opacity: 1;
            transform: translateY(0);
        }
        
        .skill-card:nth-child(1), .project-card:nth-child(1), .course-card:nth-child(1) { transition-delay: 0.1s; }
        .skill-card:nth-child(2), .project-card:nth-child(2), .course-card:nth-child(2) { transition-delay: 0.2s; }
        .skill-card:nth-child(3), .project-card:nth-child(3), .course-card:nth-child(3) { transition-delay: 0.3s; }
        .skill-card:nth-child(4) { transition-delay: 0.4s; }
        .skill-card:nth-child(5) { transition-delay: 0.5s; }
        .skill-card:nth-child(6) { transition-delay: 0.6s; }
        
        .contact-item:nth-child(1) { transition-delay: 0.1s; }
        .contact-item:nth-child(2) { transition-delay: 0.2s; }
        .contact-item:nth-child(3) { transition-delay: 0.3s; }
        
        /* Brain network specific animations */
        .network-svg .particle {
            animation: particlePulse 0.3s ease-in-out infinite;
        }
        
        .network-svg .connection {
            transition: stroke 0.3s ease, opacity 0.3s ease, stroke-width 0.3s ease;
        }
        
        .network-svg .weight-label {
            pointer-events: none;
            text-anchor: middle;
            dominant-baseline: middle;
        }
        
        @keyframes rippleExpand {
            0% { r: 12; opacity: 1; stroke-width: 2; }
            100% { r: 30; opacity: 0; stroke-width: 0.5; }
        }
        
        .data-pulse {
            animation: rippleExpand 1s ease-out forwards;
        }
    `;
    document.head.appendChild(style);
}

// ===== Theme Toggle =====
function initThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    const toggleIcon = themeToggle.querySelector('i');
    const toggleText = themeToggle.querySelector('.theme-text');
    
    // Check for saved user preference, default to dark
    const savedTheme = localStorage.getItem('theme');
    
    // If saved theme is light, apply it
    if (savedTheme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
        toggleIcon.classList.remove('fa-moon');
        toggleIcon.classList.add('fa-sun');
        toggleText.textContent = 'Light Mode';
    }
    
    themeToggle.addEventListener('click', () => {
        // Toggle theme attribute
        if (document.documentElement.getAttribute('data-theme') === 'light') {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('theme', 'dark');
            toggleIcon.classList.remove('fa-sun');
            toggleIcon.classList.add('fa-moon');
            toggleText.textContent = 'Dark Mode';
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
            localStorage.setItem('theme', 'light');
            toggleIcon.classList.remove('fa-moon');
            toggleIcon.classList.add('fa-sun');
            toggleText.textContent = 'Light Mode';
        }
    });
}

// ===== Initialize Everything =====
document.addEventListener('DOMContentLoaded', () => {
    initThemeToggle(); // Initialize theme first to avoid flash
    addAnimationStyles();
    initNavigation();
    initMobileMenu();
    // initNeuralNetwork removed - using static image
    initContactForm();
    initSmoothScroll();
    initScrollAnimations();
    initTypingEffect();
    initAccordion();
    
    // Trigger animations for initially visible elements
    setTimeout(() => {
        document.querySelectorAll('.section.active .skill-card, .section.active .project-card, .section.active .course-card, .section.active .contact-item').forEach(el => {
            el.classList.add('animate-in');
        });
    }, 100);
});

// ===== Accordion for Work Experience =====
function initAccordion() {
    const accordionItems = document.querySelectorAll('.accordion-item');
    
    accordionItems.forEach(item => {
        const header = item.querySelector('.accordion-header');
        
        header.addEventListener('click', () => {
            const isActive = item.classList.contains('active');
            
            // Close all items
            accordionItems.forEach(i => i.classList.remove('active'));
            
            // Open clicked item if it wasn't active
            if (!isActive) {
                item.classList.add('active');
            }
        });
    });
    
    // Open first item by default
    if (accordionItems.length > 0) {
        accordionItems[0].classList.add('active');
    }
}
