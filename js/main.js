// ===== DOM Elements =====
const navLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('.section');
let dynamicHeroSubtitle = "Junior AI Engineer building LLM applications, Arabic RAG pipelines, and machine learning models.";

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
    const submitButton = form.querySelector('button[type="submit"]');
    const status = form.querySelector('.form-status');

    const setFormStatus = (message, type = '') => {
        if (status) {
            status.textContent = message;
            status.className = `form-status ${type}`.trim();
        }
    };

    const openEmailFallback = (data) => {
        const fallbackEmail = form.dataset.fallbackEmail || 'mr.islamamir@gmail.com';
        const subject = data.subject || `Portfolio contact from ${data.name}`;
        const body = [
            data.message,
            '',
            `Name: ${data.name}`,
            `Email: ${data.email}`
        ].join('\n');

        const gmailUrl = new URL('https://mail.google.com/mail/');
        gmailUrl.searchParams.set('view', 'cm');
        gmailUrl.searchParams.set('fs', '1');
        gmailUrl.searchParams.set('to', fallbackEmail);
        gmailUrl.searchParams.set('su', subject);
        gmailUrl.searchParams.set('body', body);

        window.location.href = gmailUrl.toString();
    };

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(form);
        const data = Object.fromEntries(formData);
        data.name = (data.name || '').trim();
        data.email = (data.email || '').trim();
        data.subject = (data.subject || '').trim();
        data.message = (data.message || '').trim();

        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);

        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = 'Sending...';
        }
        setFormStatus('Sending your message...', 'loading');

        try {
            const response = await fetch(form.dataset.ajaxAction || form.action, {
                method: 'POST',
                headers: { Accept: 'application/json' },
                body: formData,
                signal: controller.signal
            });

            if (!response.ok) {
                throw new Error('Form service is unavailable.');
            }

            setFormStatus('Message sent successfully. Thank you for reaching out!', 'success');
            form.reset();
        } catch (error) {
            setFormStatus('Email service is unavailable. Opening Gmail instead...', 'error');
            openEmailFallback(data);
        } finally {
            clearTimeout(timeout);
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = 'Send Message';
            }
        }
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
    
    const text = dynamicHeroSubtitle;
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

// ===== Neural Network Background (Home) =====
function initNeuralBackground() {
    const canvas = document.getElementById('neuralBg');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const section = document.getElementById('home');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let width = 0, height = 0, dpr = 1;
    let nodes = [], edges = [], pulses = [];
    let running = true, rafId = null, lastSpawn = 0;
    const mouse = { x: -9999, y: -9999 };

    const getColors = () => {
        const cs = getComputedStyle(document.documentElement);
        const light = document.documentElement.getAttribute('data-theme') === 'light';
        if (light) {
            // Gold network in Light Mode
            return { cyan: '#b8860b', green: '#e6a817', lineAlpha: 0.35, nodeAlpha: 0.75 };
        }
        return {
            cyan: cs.getPropertyValue('--accent-cyan').trim() || '#00bfff',
            green: cs.getPropertyValue('--accent-green').trim() || '#00e676',
            lineAlpha: 0.16,
            nodeAlpha: 0.6
        };
    };
    let colors = getColors();

    const hexToRgb = (hex) => {
        const h = hex.replace('#', '');
        const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
        const n = parseInt(full, 16);
        return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
    };

    function build() {
        const rect = canvas.getBoundingClientRect();
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        width = rect.width;
        height = rect.height;
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const count = Math.max(28, Math.min(90, Math.round((width * height) / 18000)));
        nodes = Array.from({ length: count }, () => ({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.25,
            vy: (Math.random() - 0.5) * 0.25,
            r: 1.5 + Math.random() * 2,
            glow: 0
        }));
        pulses = [];
    }

    function computeEdges() {
        const maxDist = Math.min(180, Math.max(120, width / 9));
        edges = [];
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const d = Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y);
                if (d < maxDist) edges.push({ a: i, b: j, s: 1 - d / maxDist });
            }
        }
    }

    function spawnPulse() {
        if (!edges.length) return;
        const e = edges[Math.floor(Math.random() * edges.length)];
        const forward = Math.random() < 0.5;
        pulses.push({
            from: forward ? e.a : e.b,
            to: forward ? e.b : e.a,
            t: 0,
            speed: 0.012 + Math.random() * 0.018,
            hops: 2 + Math.floor(Math.random() * 3)
        });
    }

    function step(now) {
        for (const n of nodes) {
            n.x += n.vx; n.y += n.vy;
            if (n.x < 0 || n.x > width) n.vx *= -1;
            if (n.y < 0 || n.y > height) n.vy *= -1;
            const md = Math.hypot(n.x - mouse.x, n.y - mouse.y);
            if (md < 140) n.glow = Math.max(n.glow, 1 - md / 140);
            n.glow *= 0.96;
        }
        computeEdges();

        if (now - lastSpawn > 220 && pulses.length < 28) { spawnPulse(); lastSpawn = now; }

        // Electric signals travel along connections and hop to neighbouring neurons
        for (let i = pulses.length - 1; i >= 0; i--) {
            const p = pulses[i];
            p.t += p.speed;
            if (p.t >= 1) {
                nodes[p.to].glow = 1;
                p.hops--;
                const next = edges.filter(e => (e.a === p.to || e.b === p.to) && e.a !== p.from && e.b !== p.from);
                if (p.hops > 0 && next.length) {
                    const e = next[Math.floor(Math.random() * next.length)];
                    p.from = p.to;
                    p.to = e.a === p.to ? e.b : e.a;
                    p.t = 0;
                } else {
                    pulses.splice(i, 1);
                }
            }
        }
    }

    function draw() {
        ctx.clearRect(0, 0, width, height);
        const cyan = hexToRgb(colors.cyan), green = hexToRgb(colors.green);

        ctx.lineWidth = 1;
        for (const e of edges) {
            const a = nodes[e.a], b = nodes[e.b];
            ctx.strokeStyle = `rgba(${cyan}, ${colors.lineAlpha * e.s})`;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }

        for (const p of pulses) {
            const a = nodes[p.from], b = nodes[p.to];
            const x = a.x + (b.x - a.x) * p.t, y = a.y + (b.y - a.y) * p.t;
            const tail = Math.max(0, p.t - 0.25);
            const tx = a.x + (b.x - a.x) * tail, ty = a.y + (b.y - a.y) * tail;
            const grad = ctx.createLinearGradient(tx, ty, x, y);
            grad.addColorStop(0, `rgba(${green}, 0)`);
            grad.addColorStop(1, `rgba(${green}, 0.9)`);
            ctx.strokeStyle = grad; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(x, y); ctx.stroke();
            ctx.fillStyle = `rgba(${green}, 1)`;
            ctx.shadowColor = colors.green; ctx.shadowBlur = 12;
            ctx.beginPath(); ctx.arc(x, y, 2.2, 0, Math.PI * 2); ctx.fill();
            ctx.shadowBlur = 0;
        }

        for (const n of nodes) {
            const g = n.glow;
            if (g > 0.05) {
                ctx.shadowColor = colors.green; ctx.shadowBlur = 18 * g;
                ctx.fillStyle = `rgba(${green}, ${0.4 + 0.6 * g})`;
            } else {
                ctx.fillStyle = `rgba(${cyan}, ${colors.nodeAlpha})`;
            }
            ctx.beginPath(); ctx.arc(n.x, n.y, n.r + g * 2, 0, Math.PI * 2); ctx.fill();
            ctx.shadowBlur = 0;
        }
    }

    function loop(now) {
        if (!running) { rafId = null; return; }
        step(now);
        draw();
        rafId = requestAnimationFrame(loop);
    }

    const start = () => { running = true; if (!rafId && !reduceMotion) rafId = requestAnimationFrame(loop); };
    const stop = () => { running = false; };

    build();
    computeEdges();
    if (reduceMotion) draw(); else start();

    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => { build(); computeEdges(); if (reduceMotion) draw(); }, 150);
    });

    // Pause when Home is off-screen or the tab is hidden
    new IntersectionObserver(([entry]) => { entry.isIntersecting ? start() : stop(); }).observe(section);
    document.addEventListener('visibilitychange', () => { document.hidden ? stop() : start(); });

    section.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left; mouse.y = e.clientY - rect.top;
    });
    section.addEventListener('mouseleave', () => { mouse.x = mouse.y = -9999; });

    // Follow theme changes
    new MutationObserver(() => { colors = getColors(); if (reduceMotion) draw(); })
        .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
}

// ===== Initialize Everything =====
document.addEventListener('DOMContentLoaded', () => {
    initThemeToggle(); // Initialize theme first to avoid flash
    initNeuralBackground();
    addAnimationStyles();
    initNavigation();
    initMobileMenu();
    // initNeuralNetwork removed - using static image
    initContactForm();
    initSmoothScroll();
    initScrollAnimations();
    // initAccordion(); // moved to renderExperience
    
    // Load Dynamic Data
    loadPortfolioData();
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

// ===== Data Loading =====
async function loadPortfolioData() {
    try {
        const [profile, skills, projects, education, courses, experience] = await Promise.all([
            fetchPortfolioData('profile'),
            fetchPortfolioData('skills'),
            fetchPortfolioData('projects'),
            fetchPortfolioData('education'),
            fetchPortfolioData('courses'),
            fetchPortfolioData('experience')
        ]);

        renderProfile(profile);
        initTypingEffect();
        renderSkills(skills);
        renderProjects(projects);
        renderEducation(education);
        renderCourses(courses);
        renderExperience(experience);
        
        // Re-trigger animations after content load
        setTimeout(() => {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('animate-in');
                    }
                });
            }, { threshold: 0.1 });
            
            document.querySelectorAll('.skill-card, .project-card, .course-card, .contact-item').forEach(card => {
                observer.observe(card);
            });
        }, 100);

    } catch (error) {
        console.error('Error loading portfolio data:', error);
    }
}

async function fetchPortfolioData(name) {
    const fallback = window.PORTFOLIO_DATA && window.PORTFOLIO_DATA[name];
    try {
        const response = await fetch(`data/${name}.json`);
        if (!response.ok) {
            throw new Error(`Could not load data/${name}.json`);
        }
        return await response.json();
    } catch (error) {
        // Opening index.html directly (file://) blocks fetch, so use the embedded copy from js/data.js
        if (fallback) return fallback;
        throw error;
    }
}

function renderProfile(data) {
    // Hero
    document.getElementById('hero-title').innerHTML = data.hero.title.replace('\n', '<br>');
    document.getElementById('hero-subtitle').textContent = data.hero.subtitle;
    dynamicHeroSubtitle = data.hero.subtitle;
    
    // About
    const aboutContainer = document.getElementById('about-container');
    if (aboutContainer) {
        aboutContainer.innerHTML = `
            <div class="about-card">
                <p>${data.about.text_primary}</p>
                <p>${data.about.text_secondary}</p>
            </div>
        `;
    }
    
    // Header Logo
    const logoName = document.querySelector('.logo-name');
    const logoTitle = document.querySelector('.logo-title');
    if (logoName) logoName.textContent = data.name;
    if (logoTitle) logoTitle.textContent = data.title;
}

function renderSkills(data) {
    const container = document.getElementById('skills-container');
    if (!container) return;
    
    container.innerHTML = data.map(category => `
        <div class="skill-card">
            <div class="skill-header">
                <i class="${category.icon} skill-icon"></i>
                <h3>${category.title}</h3>
            </div>
            <ul class="skill-list">
                ${category.skills.map(skill => `
                    <li><i class="${skill.icon}"></i> ${skill.name}</li>
                `).join('')}
            </ul>
        </div>
    `).join('');
}

function renderProjects(data) {
    const container = document.getElementById('projects-container');
    if (!container) return;
    
    container.innerHTML = data.map(project => `
        <div class="project-card">
            <div class="project-thumbnail">
                <div class="thumbnail-placeholder ${project.class || ''}">
                    <i class="${project.icon} project-icon"></i>
                </div>
            </div>
            <h3 class="project-title">${project.title}</h3>
            <div class="project-description">
                <p class="project-summary">${project.summary}</p>
                <ul class="project-details">
                    ${Object.entries(project.details).map(([key, value]) => `
                        <li><span class="detail-label">${key}:</span> ${value}</li>
                    `).join('')}
                </ul>
            </div>
            <div class="project-tags">
                ${project.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>
            <div class="project-links">
                <a href="${project.repo_link}" class="btn-code ${project.repo_link === '#' ? 'btn-disabled' : ''}" ${project.repo_link === '#' ? 'aria-disabled="true"' : ''}>
                    <i class="fab fa-github"></i> GitHub Repo
                </a>
            </div>
        </div>
    `).join('');
}

function renderEducation(data) {
    const container = document.getElementById('education-container');
    if (!container) return;
    
    container.innerHTML = data.map(item => `
        <div class="course-card">
            <div class="course-header">
                <i class="${item.icon} course-icon"></i>
                <span class="course-year">${item.year}</span>
            </div>
            <h3 class="course-title">${item.title}</h3>
            <p class="course-org">${item.org}</p>
            <p class="course-description">${item.description}</p>
            <div class="course-tags">
                ${item.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>
        </div>
    `).join('');
}

function renderCourses(data) {
    const container = document.getElementById('courses-container');
    if (!container) return;
    
    // Re-use same card style as education
    container.innerHTML = data.map(item => `
        <div class="course-card">
            <div class="course-header">
                <i class="${item.icon} course-icon"></i>
                <span class="course-year">${item.year}</span>
            </div>
            <h3 class="course-title">${item.title}</h3>
            <p class="course-org">${item.org}</p>
            <p class="course-description">${item.description}</p>
            <div class="course-tags">
                ${item.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>
        </div>
    `).join('');
}

function renderExperience(data) {
    const container = document.getElementById('experience-container');
    if (!container) return;
    
    container.innerHTML = data.map(item => `
        <div class="accordion-item">
            <button class="accordion-header">
                <div class="accordion-icon">
                    <i class="${item.icon}"></i>
                </div>
                <div class="accordion-info">
                    <h3 class="accordion-title">${item.role}</h3>
                    <p class="accordion-company">${item.company}</p>
                </div>
                <span class="accordion-duration">${item.duration}</span>
                <i class="fas fa-chevron-down accordion-arrow"></i>
            </button>
            <div class="accordion-content">
                <ul class="experience-list">
                    ${item.description.map(desc => `<li>${desc}</li>`).join('')}
                </ul>
                <div class="experience-skills">
                    ${item.skills.map(skill => `<span class="tag">${skill}</span>`).join('')}
                </div>
            </div>
        </div>
    `).join('');
    
    // Re-initialize accordion logic after rendering
    initAccordion();
}
