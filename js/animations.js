// Advanced Animations and Interactions
class AdvancedAnimations {
    constructor() {
        this.init();
    }

    init() {
        this.setupCustomCursor();
        this.setupScrollAnimations();
        this.setupMagneticButtons();
        this.setupParallaxEffects();
        this.setupGlitchEffects();
        this.setupTextScramble();
    }

    // Custom Cursor
    setupCustomCursor() {
        const cursor = document.createElement('div');
        cursor.className = 'custom-cursor';
        document.body.appendChild(cursor);

        const cursorTrail = document.createElement('div');
        cursorTrail.className = 'cursor-trail';
        document.body.appendChild(cursorTrail);

        let mouseX = 0, mouseY = 0;
        let cursorX = 0, cursorY = 0;
        let trailX = 0, trailY = 0;

        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        });

        const animateCursor = () => {
            cursorX += (mouseX - cursorX) * 0.1;
            cursorY += (mouseY - cursorY) * 0.1;
            
            trailX += (mouseX - trailX) * 0.05;
            trailY += (mouseY - trailY) * 0.05;

            cursor.style.left = cursorX - 10 + 'px';
            cursor.style.top = cursorY - 10 + 'px';
            
            cursorTrail.style.left = trailX - 20 + 'px';
            cursorTrail.style.top = trailY - 20 + 'px';

            requestAnimationFrame(animateCursor);
        };

        animateCursor();

        // Hover effects
        const interactiveElements = document.querySelectorAll('a, button, .btn, .project-card, .blog-card');
        
        interactiveElements.forEach(element => {
            element.addEventListener('mouseenter', () => {
                cursor.style.transform = 'scale(1.5)';
                cursorTrail.style.transform = 'scale(1.2)';
            });
            
            element.addEventListener('mouseleave', () => {
                cursor.style.transform = 'scale(1)';
                cursorTrail.style.transform = 'scale(1)';
            });
        });
    }

    // Scroll Animations
    setupScrollAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                    
                    // Stagger animation for multiple elements
                    if (entry.target.classList.contains('stagger-item')) {
                        const items = entry.target.parentElement.querySelectorAll('.stagger-item');
                        items.forEach((item, index) => {
                            setTimeout(() => {
                                item.classList.add('animate-in');
                            }, index * 100);
                        });
                    }
                }
            });
        }, observerOptions);

        // Elements to animate
        const animatedElements = document.querySelectorAll('.glass-card, .timeline-item, .project-card, .blog-card, .section-title');
        animatedElements.forEach(element => {
            element.classList.add('animate-on-scroll');
            observer.observe(element);
        });
    }

    // Magnetic Buttons
    setupMagneticButtons() {
        const magneticElements = document.querySelectorAll('.btn, .nav-link');
        
        magneticElements.forEach(element => {
            element.addEventListener('mousemove', (e) => {
                const rect = element.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;
                
                element.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
            });
            
            element.addEventListener('mouseleave', () => {
                element.style.transform = 'translate(0, 0)';
            });
        });
    }

    // Parallax Effects
    setupParallaxEffects() {
        const parallaxElements = document.querySelectorAll('[data-parallax]');
        
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            
            parallaxElements.forEach(element => {
                const speed = element.dataset.parallax || 0.5;
                const yPos = -(scrolled * speed);
                element.style.transform = `translateY(${yPos}px)`;
            });
        });
    }

    // Glitch Effects
    setupGlitchEffects() {
        const glitchElements = document.querySelectorAll('.glitch-text');
        
        glitchElements.forEach(element => {
            element.addEventListener('mouseenter', () => {
                element.classList.add('glitch-active');
                setTimeout(() => {
                    element.classList.remove('glitch-active');
                }, 200);
            });
        });
    }

    // Text Scramble Effect
    setupTextScramble() {
        class TextScramble {
            constructor(el) {
                this.el = el;
                this.chars = '!<>-_\\/[]{}—=+*^?#________';
                this.update = this.update.bind(this);
            }
            
            setText(newText) {
                const oldText = this.el.innerText;
                const length = Math.max(oldText.length, newText.length);
                const promise = new Promise((resolve) => this.resolve = resolve);
                this.queue = [];
                
                for (let i = 0; i < length; i++) {
                    const from = oldText[i] || '';
                    const to = newText[i] || '';
                    const start = Math.floor(Math.random() * 40);
                    const end = start + Math.floor(Math.random() * 40);
                    this.queue.push({ from, to, start, end });
                }
                
                cancelAnimationFrame(this.frameRequest);
                this.frame = 0;
                this.update();
                return promise;
            }
            
            update() {
                let output = '';
                let complete = 0;
                
                for (let i = 0, n = this.queue.length; i < n; i++) {
                    let { from, to, start, end, char } = this.queue[i];
                    
                    if (this.frame >= end) {
                        complete++;
                        output += to;
                    } else if (this.frame >= start) {
                        if (!char || Math.random() < 0.28) {
                            char = this.randomChar();
                            this.queue[i].char = char;
                        }
                        output += char;
                    } else {
                        output += from;
                    }
                }
                
                this.el.innerHTML = output;
                
                if (complete === this.queue.length) {
                    this.resolve();
                } else {
                    this.frameRequest = requestAnimationFrame(this.update);
                    this.frame++;
                }
            }
            
            randomChar() {
                return this.chars[Math.floor(Math.random() * this.chars.length)];
            }
        }

        // Apply to hero name
        const heroName = document.querySelector('.hero-name');
        if (heroName) {
            const fx = new TextScramble(heroName);
            
            setTimeout(() => {
                fx.setText('Bishwash Acharya');
            }, 1000);
        }
    }

    // Smooth reveal animations
    setupRevealAnimations() {
        const revealElements = document.querySelectorAll('.reveal-text');
        
        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const text = entry.target.textContent;
                    entry.target.textContent = '';
                    
                    let charIndex = 0;
                    const revealInterval = setInterval(() => {
                        if (charIndex < text.length) {
                            entry.target.textContent += text[charIndex];
                            charIndex++;
                        } else {
                            clearInterval(revealInterval);
                        }
                    }, 50);
                    
                    revealObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });
        
        revealElements.forEach(element => {
            revealObserver.observe(element);
        });
    }
}

// Navigation scroll effects
class NavigationEffects {
    constructor() {
        this.navbar = document.getElementById('navbar');
        this.lastScrollTop = 0;
        this.init();
    }

    init() {
        window.addEventListener('scroll', () => this.handleScroll());
        this.setupActiveNavigation();
    }

    handleScroll() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        // Add background on scroll
        if (scrollTop > 50) {
            this.navbar.classList.add('scrolled');
        } else {
            this.navbar.classList.remove('scrolled');
        }

        // Hide/show on scroll
        if (scrollTop > this.lastScrollTop && scrollTop > 100) {
            this.navbar.style.transform = 'translateY(-100%)';
        } else {
            this.navbar.style.transform = 'translateY(0)';
        }
        
        this.lastScrollTop = scrollTop;
    }

    setupActiveNavigation() {
        const sections = document.querySelectorAll('section[id]');
        const navLinks = document.querySelectorAll('.nav-link[data-page]');
        
        const sectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const sectionId = entry.target.id;
                    
                    navLinks.forEach(link => {
                        link.classList.remove('active');
                        if (link.dataset.page === sectionId) {
                            link.classList.add('active');
                        }
                    });
                }
            });
        }, { threshold: 0.3 });
        
        sections.forEach(section => {
            sectionObserver.observe(section);
        });
    }
}

// Mobile Menu
class MobileMenu {
    constructor() {
        this.hamburger = document.getElementById('hamburger');
        this.navMenu = document.getElementById('nav-menu');
        this.init();
    }

    init() {
        this.hamburger.addEventListener('click', () => this.toggleMenu());
        
        // Close menu when clicking on a link
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                this.closeMenu();
            });
        });
    }

    toggleMenu() {
        this.hamburger.classList.toggle('active');
        this.navMenu.classList.toggle('active');
    }

    closeMenu() {
        this.hamburger.classList.remove('active');
        this.navMenu.classList.remove('active');
    }
}

// Form animations
class FormAnimations {
    constructor() {
        this.init();
    }

    init() {
        this.setupFloatingLabels();
        this.setupFormValidation();
        this.setupSubmitAnimation();
    }

    setupFloatingLabels() {
        const formGroups = document.querySelectorAll('.form-group');
        
        formGroups.forEach(group => {
            const input = group.querySelector('input, textarea');
            const label = group.querySelector('label');
            
            if (input && label) {
                input.addEventListener('focus', () => {
                    label.classList.add('focused');
                });
                
                input.addEventListener('blur', () => {
                    if (!input.value) {
                        label.classList.remove('focused');
                    }
                });
                
                // Check initial state
                if (input.value) {
                    label.classList.add('focused');
                }
            }
        });
    }

    setupFormValidation() {
        const form = document.querySelector('.contact-form');
        if (!form) return;

        const inputs = form.querySelectorAll('input, textarea');
        
        inputs.forEach(input => {
            input.addEventListener('blur', () => {
                this.validateField(input);
            });
            
            input.addEventListener('input', () => {
                if (input.classList.contains('error')) {
                    this.validateField(input);
                }
            });
        });
    }

    validateField(field) {
        const value = field.value.trim();
        let isValid = true;
        let errorMessage = '';

        // Remove existing error
        field.classList.remove('error');
        const existingError = field.parentElement.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }

        // Validation rules
        if (field.hasAttribute('required') && !value) {
            isValid = false;
            errorMessage = 'This field is required';
        } else if (field.type === 'email' && value && !this.isValidEmail(value)) {
            isValid = false;
            errorMessage = 'Please enter a valid email address';
        }

        // Show error
        if (!isValid) {
            field.classList.add('error');
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            errorDiv.textContent = errorMessage;
            field.parentElement.appendChild(errorDiv);
        }

        return isValid;
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    setupSubmitAnimation() {
        const form = document.querySelector('.contact-form');
        const submitBtn = form?.querySelector('button[type="submit"]');
        
        if (form && submitBtn) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                
                // Validate all fields
                const inputs = form.querySelectorAll('input, textarea');
                let isFormValid = true;
                
                inputs.forEach(input => {
                    if (!this.validateField(input)) {
                        isFormValid = false;
                    }
                });
                
                if (isFormValid) {
                    // Animate submit button
                    submitBtn.classList.add('loading');
                    submitBtn.disabled = true;
                    
                    // Simulate form submission
                    setTimeout(() => {
                        submitBtn.classList.remove('loading');
                        submitBtn.disabled = false;
                        
                        // Show success message
                        const successMsg = document.querySelector('.success-message');
                        if (successMsg) {
                            successMsg.classList.add('show');
                            form.reset();
                            
                            setTimeout(() => {
                                successMsg.classList.remove('show');
                            }, 5000);
                        }
                    }, 2000);
                }
            });
        }
    }
}

// Initialize all animations
document.addEventListener('DOMContentLoaded', () => {
    new AdvancedAnimations();
    new NavigationEffects();
    new MobileMenu();
    new FormAnimations();
});

// Add CSS animation classes
const style = document.createElement('style');
style.textContent = `
    .animate-on-scroll {
        opacity: 0;
        transform: translateY(30px);
        transition: opacity 0.6s ease, transform 0.6s ease;
    }
    
    .animate-in {
        opacity: 1;
        transform: translateY(0);
    }
    
    .glitch-active {
        animation: glitch 0.2s ease-in-out;
    }
    
    @keyframes glitch {
        0%, 100% { transform: translate(0); }
        20% { transform: translate(-2px, 2px); }
        40% { transform: translate(-2px, -2px); }
        60% { transform: translate(2px, 2px); }
        80% { transform: translate(2px, -2px); }
    }
    
    .focused {
        transform: translateY(-20px);
        font-size: 0.8rem;
        color: var(--accent-mint);
    }
    
    .error {
        border-color: var(--accent-pink) !important;
    }
    
    .error-message {
        color: var(--accent-pink);
        font-size: 0.8rem;
        margin-top: 0.5rem;
    }
    
    .loading {
        position: relative;
        color: transparent !important;
    }
    
    .loading::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 20px;
        height: 20px;
        margin: -10px 0 0 -10px;
        border: 2px solid var(--text-primary);
        border-top: 2px solid transparent;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);
