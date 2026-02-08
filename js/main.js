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

// ===== Neural Network Animation - Brain Network =====
function initNeuralNetwork() {
    const svg = document.querySelector('.network-svg');
    if (!svg) return;
    
    const connectionsGroup = svg.querySelector('.connections');
    const particlesGroup = svg.querySelector('.particles');
    const weightLabelsGroup = svg.querySelector('.weight-labels');
    
    // Get all circle positions grouped by layer (7 layers for brain network)
    const layers = [];
    for (let i = 1; i <= 7; i++) {
        const layer = svg.querySelectorAll(`.layer-${i} circle`);
        if (layer.length > 0) layers.push(layer);
    }
    
    if (layers.length === 0) return;
    
    const allConnections = [];
    const allWeightLabels = [];
    
    // Draw connections between consecutive layers with varying opacity
    for (let i = 0; i < layers.length - 1; i++) {
        const currentLayer = layers[i];
        const nextLayer = layers[i + 1];
        
        currentLayer.forEach((circle1, idx1) => {
            const cx1 = parseFloat(circle1.getAttribute('cx'));
            const cy1 = parseFloat(circle1.getAttribute('cy'));
            
            nextLayer.forEach((circle2, idx2) => {
                const cx2 = parseFloat(circle2.getAttribute('cx'));
                const cy2 = parseFloat(circle2.getAttribute('cy'));
                
                // Create connection line
                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('x1', cx1);
                line.setAttribute('y1', cy1);
                line.setAttribute('x2', cx2);
                line.setAttribute('y2', cy2);
                line.classList.add('connection');
                
                // More visible base opacity
                line.style.opacity = 0.35 + Math.random() * 0.2;
                
                connectionsGroup.appendChild(line);
                
                // Create weight label for some connections
                const midX = (cx1 + cx2) / 2;
                const midY = (cy1 + cy2) / 2;
                const weight = (Math.random() * 2 - 1).toFixed(4);
                
                const weightLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                weightLabel.setAttribute('x', midX);
                weightLabel.setAttribute('y', midY);
                weightLabel.classList.add('weight-label');
                weightLabel.textContent = weight;
                weightLabelsGroup.appendChild(weightLabel);
                
                allConnections.push({ 
                    line, 
                    x1: cx1, 
                    y1: cy1, 
                    x2: cx2, 
                    y2: cy2,
                    layerIndex: i,
                    weightLabel
                });
                allWeightLabels.push(weightLabel);
            });
        });
    }
    
    // Animate data flow through network with colored particles
    function createParticle() {
        if (allConnections.length === 0) return;
        
        // Pick a random connection
        const conn = allConnections[Math.floor(Math.random() * allConnections.length)];
        
        const particle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        particle.setAttribute('r', '3');
        particle.classList.add('particle');
        
        // Alternate between cyan and orange colors based on layer
        const isOrangeLayer = conn.layerIndex >= 2 && conn.layerIndex <= 4;
        const useOrange = isOrangeLayer && Math.random() > 0.6;
        particle.setAttribute('fill', useOrange ? '#ff9933' : '#00bfff');
        
        particlesGroup.appendChild(particle);
        
        // Animate along the connection
        const duration = 600 + Math.random() * 400;
        const startTime = performance.now();
        
        // Highlight the connection
        conn.line.classList.add(useOrange ? 'highlight-orange' : 'highlight-blue');
        
        // Show weight label briefly
        conn.weightLabel.classList.add('visible');
        
        function animate(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Ease in-out cubic
            const eased = progress < 0.5 
                ? 4 * progress * progress * progress 
                : 1 - Math.pow(-2 * progress + 2, 3) / 2;
            
            const x = conn.x1 + (conn.x2 - conn.x1) * eased;
            const y = conn.y1 + (conn.y2 - conn.y1) * eased;
            
            particle.setAttribute('cx', x);
            particle.setAttribute('cy', y);
            
            // Pulse effect
            const scale = 1 + Math.sin(progress * Math.PI) * 0.5;
            particle.setAttribute('r', 3 * scale);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                particle.remove();
                conn.line.classList.remove('highlight-blue', 'highlight-orange');
                conn.weightLabel.classList.remove('visible');
            }
        }
        
        requestAnimationFrame(animate);
    }
    
    // Particles disabled - removed electron gun effect
    // setInterval(createParticle, 80);
    
    // Wave-like connection highlighting
    function highlightWave() {
        const numWaves = 2;
        
        for (let wave = 0; wave < numWaves; wave++) {
            setTimeout(() => {
                // Pick a random starting layer
                const startLayer = Math.floor(Math.random() * (layers.length - 1));
                
                // Get connections from that layer
                const layerConnections = allConnections.filter(c => c.layerIndex === startLayer);
                const numToHighlight = 3 + Math.floor(Math.random() * 4);
                
                const highlighted = [];
                for (let i = 0; i < numToHighlight && i < layerConnections.length; i++) {
                    const idx = Math.floor(Math.random() * layerConnections.length);
                    const conn = layerConnections[idx];
                    const isOrange = Math.random() > 0.5;
                    conn.line.classList.add(isOrange ? 'highlight-orange' : 'highlight-blue');
                    highlighted.push({ line: conn.line, isOrange });
                }
                
                setTimeout(() => {
                    highlighted.forEach(h => {
                        h.line.classList.remove('highlight-blue', 'highlight-orange');
                    });
                }, 400 + Math.random() * 200);
            }, wave * 300);
        }
    }
    
    setInterval(highlightWave, 1500);
    
    // Periodic weight label flash
    function flashWeightLabels() {
        const numToShow = 5 + Math.floor(Math.random() * 10);
        const toShow = [];
        
        for (let i = 0; i < numToShow; i++) {
            const idx = Math.floor(Math.random() * allWeightLabels.length);
            allWeightLabels[idx].classList.add('visible');
            toShow.push(allWeightLabels[idx]);
        }
        
        setTimeout(() => {
            toShow.forEach(label => label.classList.remove('visible'));
        }, 800);
    }
    
    setInterval(flashWeightLabels, 2500);
    
    // Node activation ripple effect
    function nodeActivation() {
        layers.forEach((layer, layerIdx) => {
            setTimeout(() => {
                const nodeIdx = Math.floor(Math.random() * layer.length);
                const node = layer[nodeIdx];
                const originalR = parseFloat(node.getAttribute('r'));
                
                // Create ripple
                const ripple = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                ripple.setAttribute('cx', node.getAttribute('cx'));
                ripple.setAttribute('cy', node.getAttribute('cy'));
                ripple.setAttribute('r', originalR);
                ripple.setAttribute('fill', 'none');
                ripple.setAttribute('stroke', '#00bfff');
                ripple.setAttribute('stroke-width', '2');
                ripple.classList.add('data-pulse');
                
                particlesGroup.appendChild(ripple);
                
                setTimeout(() => ripple.remove(), 1000);
            }, layerIdx * 100);
        });
    }
    
    setInterval(nodeActivation, 3000);
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
    
    const text = "Professional portfolio showcasing my work and expertise.";
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

// ===== Initialize Everything =====
document.addEventListener('DOMContentLoaded', () => {
    addAnimationStyles();
    initNavigation();
    initMobileMenu();
    initNeuralNetwork();
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
