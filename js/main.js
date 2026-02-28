// Main Application JavaScript
class PortfolioApp {
    constructor() {
        this.init();
    }

    init() {
        this.setupLoadingScreen();
        this.setupCustomCursor();
        this.setupScrollProgress();
        this.setupSmoothScroll();
        this.setupProjectFilter();
        this.setupTypingEffect();
        this.setupThemeToggle();
        this.setupMobileMenu();
        this.setupScrollAnimations();
        this.setupSpotifyPlaylist();
        this.setupBackToTop();
        this.loadContentFromAPI();
        this.setupContactForm();
    }

    // Loading screen
    setupLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (!loadingScreen) return;
        
        window.addEventListener('load', () => {
            setTimeout(() => {
                loadingScreen.classList.add('hidden');
            }, 500);
        });
    }

    // Custom cursor
    setupCustomCursor() {
        const cursor = document.querySelector('.custom-cursor');
        const cursorDot = document.querySelector('.cursor-dot');
        const cursorRing = document.querySelector('.cursor-ring');
        
        if (!cursor || !cursorDot || !cursorRing) return;
        if (window.matchMedia('(pointer: coarse)').matches) return;
        
        let mouseX = 0, mouseY = 0;
        let ringX = 0, ringY = 0;
        
        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            cursorDot.style.left = mouseX + 'px';
            cursorDot.style.top = mouseY + 'px';
        });
        
        const animateRing = () => {
            ringX += (mouseX - ringX) * 0.15;
            ringY += (mouseY - ringY) * 0.15;
            cursorRing.style.left = ringX + 'px';
            cursorRing.style.top = ringY + 'px';
            requestAnimationFrame(animateRing);
        };
        animateRing();
        
        // Hover effects
        const hoverElements = document.querySelectorAll('a, button, .btn, .project-card, .blog-card');
        hoverElements.forEach(el => {
            el.addEventListener('mouseenter', () => document.body.classList.add('hovering'));
            el.addEventListener('mouseleave', () => document.body.classList.remove('hovering'));
        });
    }

    // Scroll progress bar
    setupScrollProgress() {
        const progressBar = document.querySelector('.scroll-progress');
        if (!progressBar) return;
        
        window.addEventListener('scroll', () => {
            const scrollTop = window.scrollY;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const progress = (scrollTop / docHeight) * 100;
            progressBar.style.width = progress + '%';
        });
    }

    // Smooth scrolling for navigation links
    setupSmoothScroll() {
        const navLinks = document.querySelectorAll('a[href^="#"]');
        
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                
                const targetId = link.getAttribute('href').substring(1);
                
                // For "about", scroll to hero-image-section so image + about appear together
                let targetElement;
                if (targetId === 'about') {
                    targetElement = document.getElementById('hero-image-section') || document.getElementById('about');
                } else {
                    targetElement = document.getElementById(targetId);
                }
                
                if (targetElement) {
                    const offsetTop = targetElement.offsetTop - 80;
                    
                    window.scrollTo({
                        top: offsetTop,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }

    // Project filtering
    setupProjectFilter() {
        const filterButtons = document.querySelectorAll('.filter-btn');
        const projectCards = document.querySelectorAll('.project-card');
        
        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Remove active class from all buttons
                filterButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                const filter = button.dataset.filter;
                
                projectCards.forEach(card => {
                    if (filter === 'all' || card.dataset.category === filter) {
                        card.style.display = 'block';
                        setTimeout(() => {
                            card.style.opacity = '1';
                            card.style.transform = 'translateY(0)';
                        }, 10);
                    } else {
                        card.style.opacity = '0';
                        card.style.transform = 'translateY(20px)';
                        setTimeout(() => {
                            card.style.display = 'none';
                        }, 300);
                    }
                });
            });
        });
    }

    // Typing effect for hero section roles
    setupTypingEffect() {
        const roleText = document.getElementById('role-text');
        if (!roleText) return;

        this.typingRoles = [
            'Designer',
            'Developer', 
            'Data/Business Analyst',
            'Content Creator'
        ];

        let roleIndex = 0;
        let charIndex = 0;
        let isDeleting = false;
        let isWaiting = false;
        
        const typeEffect = () => {
            const roles = this.typingRoles && this.typingRoles.length > 0 ? this.typingRoles : ['Designer'];
            const currentRole = roles[roleIndex] || roles[0];
            
            if (isWaiting) {
                return;
            }
            
            if (isDeleting) {
                roleText.textContent = currentRole.substring(0, charIndex - 1);
                charIndex--;
            } else {
                roleText.textContent = currentRole.substring(0, charIndex + 1);
                charIndex++;
            }
            
            let typeSpeed = isDeleting ? 50 : 100;
            
            // Faster typing for "and more coming up..."
            if (currentRole === 'and more coming up...') {
                typeSpeed = isDeleting ? 30 : 80;
            }
            
            if (!isDeleting && charIndex === currentRole.length) {
                // Finished typing, wait before deleting
                isWaiting = true;
                setTimeout(() => {
                    isWaiting = false;
                    isDeleting = true;
                }, 2000);
                typeSpeed = 2000;
            } else if (isDeleting && charIndex === 0) {
                isDeleting = false;
                roleIndex = (roleIndex + 1) % roles.length;
                typeSpeed = 500;
            }
            
            setTimeout(typeEffect, typeSpeed);
        };
        
        // Start typing effect after initial delay
        setTimeout(typeEffect, 1000);
    }

    // Theme toggle (dark/light mode)
    setupThemeToggle() {
        const themeToggle = document.getElementById('theme-toggle');
        if (!themeToggle) return;
        
        // Check for saved theme preference or default to dark
        const savedTheme = localStorage.getItem('theme') || 'dark';
        document.documentElement.setAttribute('data-theme', savedTheme);
        
        themeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
        });
    }

    // Mobile menu toggle
    setupMobileMenu() {
        const hamburger = document.getElementById('hamburger');
        const navMenu = document.getElementById('nav-menu');
        
        if (!hamburger || !navMenu) {
            console.error('Hamburger or nav menu not found');
            return;
        }
        
        console.log('Setting up mobile menu...');
        
        // Handle both click and touch events
        const toggleMenu = (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Hamburger clicked/touched');
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        };
        
        hamburger.addEventListener('click', toggleMenu);
        hamburger.addEventListener('touchstart', toggleMenu, { passive: false });
        
        // Close menu when clicking a link
        const navLinks = navMenu.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!hamburger.contains(e.target) && !navMenu.contains(e.target)) {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
            }
        });
    }

    // Scroll animations
    setupScrollAnimations() {
        // Add fade-in animation to sections
        const sections = document.querySelectorAll('section');
        
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, observerOptions);
        
        sections.forEach(section => {
            section.style.opacity = '0';
            section.style.transform = 'translateY(30px)';
            section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(section);
        });
        
        // Animate elements on scroll
        const animateElements = document.querySelectorAll('.timeline-item, .project-card, .blog-card, .skill-category');
        
        const elementObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry, index) => {
                if (entry.isIntersecting) {
                    setTimeout(() => {
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateY(0)';
                    }, index * 100);
                }
            });
        }, { threshold: 0.1 });
        
        animateElements.forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
            el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            elementObserver.observe(el);
        });
    }

    // Spotify Playlist Rotation
    setupSpotifyPlaylist() {
        const trackElement = document.querySelector('.listening-track');
        if (!trackElement) return;

        // Your playlist of songs - edit this list!
        const playlist = [
            'Midnight City - M83',
            'Blinding Lights - The Weeknd',
            'Heat Waves - Glass Animals',
            'Levitating - Dua Lipa',
            'Stay - The Kid LAROI & Justin Bieber',
            'Peaches - Justin Bieber',
            'Save Your Tears - The Weeknd',
            'Good 4 U - Olivia Rodrigo',
            'Montero - Lil Nas X',
            'Butter - BTS',
            'Permission to Dance - BTS',
            'drivers license - Olivia Rodrigo',
            'Kiss Me More - Doja Cat',
            'Deja Vu - Olivia Rodrigo',
            'Bad Habits - Ed Sheeran',
            'Shivers - Ed Sheeran',
            'My Universe - Coldplay & BTS',
            'Industry Baby - Lil Nas X',
            'Pepas - Farruko',
            'Meet Me At Our Spot - WILLOW',
            'Lo-fi Study Beats',
            'Chill Vibes Mix',
            'Coding Focus - Ambient',
            'Deep Work Playlist',
            'Electronic Focus'
        ];

        let currentIndex = Math.floor(Math.random() * playlist.length);
        
        // Set initial random song immediately
        trackElement.textContent = playlist[currentIndex];
        
        // Update track randomly every 20-40 seconds
        const updateTrack = () => {
            // Fade out
            trackElement.style.opacity = '0';
            
            setTimeout(() => {
                // Pick random track (not the same as current)
                let newIndex;
                do {
                    newIndex = Math.floor(Math.random() * playlist.length);
                } while (newIndex === currentIndex && playlist.length > 1);
                
                currentIndex = newIndex;
                trackElement.textContent = playlist[currentIndex];
                
                // Fade in
                trackElement.style.opacity = '1';
                
                // Random next update time between 20-40 seconds
                const nextUpdate = Math.random() * 20000 + 20000;
                setTimeout(updateTrack, nextUpdate);
            }, 300);
        };

        // Initialize with smooth transition
        trackElement.style.transition = 'opacity 0.3s ease';
        
        // Start first random update after 20-40 seconds
        const firstUpdate = Math.random() * 20000 + 20000;
        setTimeout(updateTrack, firstUpdate);
        
        console.log('Spotify random playlist started with:', playlist[currentIndex]);
    }

    // Dynamic timeline line adjustment
    setupDynamicTimeline() {
        const updateTimelineLine = (containerClass) => {
            const timeline = document.querySelector(containerClass);
            const timelineLine = timeline?.querySelector('.timeline-line');
            if (!timeline || !timelineLine) return;
            
            const items = timeline.querySelectorAll('.timeline-item');
            if (items.length === 0) return;
            
            const firstItem = items[0];
            const lastItem = items[items.length - 1];
            
            const timelineRect = timeline.getBoundingClientRect();
            const firstRect = firstItem.getBoundingClientRect();
            const lastRect = lastItem.getBoundingClientRect();
            
            const startPos = firstRect.top - timelineRect.top + 40;
            const endPos = lastRect.bottom - timelineRect.top - 40;
            
            timelineLine.style.top = startPos + 'px';
            timelineLine.style.height = (endPos - startPos) + 'px';
        };
        
        const updateAllTimelines = () => {
            updateTimelineLine('.experience-timeline');
            updateTimelineLine('.education-timeline');
        };
        
        window.addEventListener('load', updateAllTimelines);
        window.addEventListener('resize', updateAllTimelines);
        
        const experienceTimeline = document.querySelector('.experience-timeline');
        const educationTimeline = document.querySelector('.education-timeline');
        
        if (experienceTimeline) {
            const observer = new MutationObserver(updateAllTimelines);
            observer.observe(experienceTimeline, { childList: true, subtree: true });
        }
        
        if (educationTimeline) {
            const observer = new MutationObserver(updateAllTimelines);
            observer.observe(educationTimeline, { childList: true, subtree: true });
        }
    }

    // Back to top button
    setupBackToTop() {
        // Create button dynamically if not already in DOM
        let btn = document.querySelector('.back-to-top');
        if (!btn) {
            btn = document.createElement('button');
            btn.className = 'back-to-top';
            btn.setAttribute('aria-label', 'Back to top');
            btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>';
            document.body.appendChild(btn);
        }

        window.addEventListener('scroll', () => {
            if (window.scrollY > 500) {
                btn.classList.add('visible');
            } else {
                btn.classList.remove('visible');
            }
        });

        btn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // Show skeleton loaders while API data is being fetched
    showSkeletonLoaders() {
        // Projects grid skeleton
        const projGrid = document.querySelector('.projects-grid');
        if (projGrid) {
            const skeletonCard = (isFeatured) => {
                if (isFeatured) {
                    return `<div class="skeleton-featured">
                        <div class="skeleton-image"></div>
                        <div class="skeleton-content">
                            <div class="skeleton-text title"></div>
                            <div class="skeleton-text wide"></div>
                            <div class="skeleton-text medium"></div>
                            <div class="skeleton-tags"><div class="skeleton-tag"></div><div class="skeleton-tag"></div><div class="skeleton-tag"></div></div>
                        </div>
                    </div>`;
                }
                return `<div class="skeleton-card">
                    <div class="skeleton-image"></div>
                    <div class="skeleton-content">
                        <div class="skeleton-text title"></div>
                        <div class="skeleton-text wide"></div>
                        <div class="skeleton-text medium"></div>
                        <div class="skeleton-tags"><div class="skeleton-tag"></div><div class="skeleton-tag"></div></div>
                    </div>
                </div>`;
            };
            projGrid.innerHTML = skeletonCard(true) + skeletonCard(false) + skeletonCard(false) + skeletonCard(false);
        }

        // Blog grid skeleton
        const blogGrid = document.querySelector('.blog-grid');
        if (blogGrid) {
            const blogSkeleton = (isFeatured) => {
                if (isFeatured) {
                    return `<div class="skeleton-featured">
                        <div class="skeleton-image"></div>
                        <div class="skeleton-content">
                            <div class="skeleton-text title"></div>
                            <div class="skeleton-text wide"></div>
                            <div class="skeleton-text medium"></div>
                        </div>
                    </div>`;
                }
                return `<div class="skeleton-card">
                    <div class="skeleton-image"></div>
                    <div class="skeleton-content">
                        <div class="skeleton-text title"></div>
                        <div class="skeleton-text wide"></div>
                        <div class="skeleton-text narrow"></div>
                    </div>
                </div>`;
            };
            blogGrid.innerHTML = blogSkeleton(true) + blogSkeleton(false) + blogSkeleton(false) + blogSkeleton(false);
        }
    }

    // Load content from API
    async loadContentFromAPI() {
        this.showSkeletonLoaders();
        try {
            // Fetch data sequentially with small delays to avoid rate limiting
            const exp = await fetch('/api/content/experience').then(r => r.json()).catch(() => []);
            await this.delay(50);
            const edu = await fetch('/api/content/education').then(r => r.json()).catch(() => []);
            await this.delay(50);
            const proj = await fetch('/api/content/projects').then(r => r.json()).catch(() => []);
            await this.delay(50);
            const blog = await fetch('/api/content/blog').then(r => r.json()).catch(() => []);
            await this.delay(50);
            const skills = await fetch('/api/content/skills').then(r => r.json()).catch(() => []);
            await this.delay(50);
            const settings = await fetch('/api/content/settings').then(r => r.json()).catch(() => []);
            
            this.renderTimelineItems('experience', exp);
            this.renderTimelineItems('education', edu);
            this.renderProjects(proj);
            this.renderBlog(blog);
            this.renderSkills(skills);
            this.applySettings(settings);
            this._scheduleLastNameReveal(this._heroLastName);
            
            setTimeout(() => this.setupDynamicTimeline(), 100);
        } catch (err) {
            console.log('API not available, using static content');
        }
    }

    // Helper function for delays
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Render timeline items
    renderTimelineItems(type, items) {
        if (!items || items.length === 0) return;
        
        // Use different containers for experience and education
        const containerClass = type === 'experience' ? '.experience-timeline' : '.education-timeline';
        const container = document.querySelector(containerClass);
        if (!container) return;
        
        // Keep the timeline line if it exists
        const line = container.querySelector('.timeline-line');
        container.innerHTML = '';
        if (line) container.appendChild(line);
        
        items.filter(item => !item.hidden).forEach((item, index) => {
            const isRight = index % 2 === 1;
            const div = document.createElement('div');
            div.className = `timeline-item ${isRight ? 'right' : ''}`;
            
            const marker = document.createElement('div');
            marker.className = 'timeline-marker';
            div.appendChild(marker);
            
            const card = document.createElement('div');
            card.className = 'timeline-card';
            
            const header = document.createElement('div');
            header.className = 'card-header';
            
            const badge = document.createElement('span');
            const badgeValue = (item.badge || (type === 'experience' ? 'Work' : 'Education')).trim();
            const badgeTypeClass = type === 'experience' ? 'work' : 'education';
            badge.className = `card-badge ${badgeTypeClass}`;
            badge.textContent = badgeValue;
            header.appendChild(badge);
            
            const heading = document.createElement('h3');
            heading.textContent = type === 'experience' ? item.company : item.institution;
            header.appendChild(heading);
            
            const position = document.createElement('span');
            position.className = 'position';
            position.textContent = type === 'experience' ? item.role : item.degree;
            header.appendChild(position);
            
            card.appendChild(header);
            
            const meta = document.createElement('div');
            meta.className = 'card-meta';
            const metaSpan = document.createElement('span');
            metaSpan.textContent = item.period;
            meta.appendChild(metaSpan);
            card.appendChild(meta);
            
            const description = document.createElement('p');
            description.className = 'card-description';
            description.textContent = item.description || '';
            card.appendChild(description);
            
            div.appendChild(card);
            container.appendChild(div);
        });
    }

    // Render projects
    renderProjects(projects) {
        if (!projects || projects.length === 0) return;
        
        const container = document.querySelector('.projects-grid');
        if (!container) return;
        
        const visibleProjects = projects.filter(p => !p.hidden);
        
        // Separate featured and non-featured projects
        const featuredProject = visibleProjects.find(p => p.featured);
        const otherProjects = visibleProjects.filter(p => !p.featured);
        
        // Show max 1 featured + 3 other projects on homepage
        const displayProjects = [];
        if (featuredProject) displayProjects.push(featuredProject);
        displayProjects.push(...otherProjects.slice(0, 3));
        
        // Clear container safely
        container.innerHTML = '';
        
        displayProjects.forEach(project => {
            const article = document.createElement('article');
            article.className = `project-card` + (project.featured ? ' featured-card' : '');
            article.setAttribute('data-category', (project.tags || []).join(' '));
            
            if (project.featured) {
                // Featured project: grid layout with image on left, content on right
                const imageDiv = document.createElement('div');
                imageDiv.className = 'featured-image';
                imageDiv.style.position = 'relative';
                
                if (project.image_url) {
                    const img = document.createElement('img');
                    img.src = project.image_url;
                    img.alt = project.title;
                    img.loading = 'lazy';
                    img.onerror = function() { this.src = 'assets/projects/placeholder.jpg'; };
                    imageDiv.appendChild(img);
                }
                
                // Add badge on top of image
                const badge = document.createElement('div');
                badge.className = 'featured-badge';
                badge.textContent = 'Featured';
                badge.style.position = 'absolute';
                badge.style.top = '16px';
                badge.style.left = '16px';
                badge.style.zIndex = '10';
                imageDiv.appendChild(badge);
                article.appendChild(imageDiv);
                
                const contentDiv = document.createElement('div');
                contentDiv.className = 'featured-content';
                
                const title = document.createElement('h3');
                title.textContent = project.title;
                contentDiv.appendChild(title);
                
                const description = document.createElement('p');
                description.textContent = project.description || '';
                contentDiv.appendChild(description);
                
                const techDiv = document.createElement('div');
                techDiv.className = 'project-tech';
                (project.tags || []).forEach(tag => {
                    const span = document.createElement('span');
                    span.className = 'tech-tag';
                    span.textContent = tag;
                    techDiv.appendChild(span);
                });
                contentDiv.appendChild(techDiv);
                
                const linksDiv = document.createElement('div');
                linksDiv.className = 'project-links';
                if (project.project_url) {
                    const link = document.createElement('a');
                    link.href = project.project_url;
                    link.className = 'project-link';
                    link.setAttribute('target', '_blank');
                    link.setAttribute('rel', 'noopener noreferrer');
                    link.textContent = 'Live Demo';
                    linksDiv.appendChild(link);
                }
                if (project.github_url) {
                    const link = document.createElement('a');
                    link.href = project.github_url;
                    link.className = 'project-link';
                    link.setAttribute('target', '_blank');
                    link.setAttribute('rel', 'noopener noreferrer');
                    link.textContent = 'GitHub';
                    linksDiv.appendChild(link);
                }
                contentDiv.appendChild(linksDiv);
                article.appendChild(contentDiv);
            } else {
                // Regular project: card layout
                const imageDiv = document.createElement('div');
                imageDiv.className = 'project-image';
                if (project.image_url) {
                    const img = document.createElement('img');
                    img.src = project.image_url;
                    img.alt = project.title;
                    img.loading = 'lazy';
                    img.onerror = function() { this.src = 'assets/projects/placeholder.jpg'; };
                    imageDiv.appendChild(img);
                }
                article.appendChild(imageDiv);
                
                const contentDiv = document.createElement('div');
                contentDiv.className = 'project-content';
                
                const title = document.createElement('h3');
                title.textContent = project.title;
                contentDiv.appendChild(title);
                
                const description = document.createElement('p');
                description.textContent = project.description || '';
                contentDiv.appendChild(description);
                
                const techDiv = document.createElement('div');
                techDiv.className = 'project-tech';
                (project.tags || []).forEach(tag => {
                    const span = document.createElement('span');
                    span.className = 'tech-tag';
                    span.textContent = tag;
                    techDiv.appendChild(span);
                });
                contentDiv.appendChild(techDiv);
                
                const linksDiv = document.createElement('div');
                linksDiv.className = 'project-links';
                if (project.project_url) {
                    const link = document.createElement('a');
                    link.href = project.project_url;
                    link.className = 'project-link';
                    link.setAttribute('target', '_blank');
                    link.setAttribute('rel', 'noopener noreferrer');
                    link.textContent = 'Live Demo';
                    linksDiv.appendChild(link);
                }
                if (project.github_url) {
                    const link = document.createElement('a');
                    link.href = project.github_url;
                    link.className = 'project-link';
                    link.setAttribute('target', '_blank');
                    link.setAttribute('rel', 'noopener noreferrer');
                    link.textContent = 'GitHub';
                    linksDiv.appendChild(link);
                }
                contentDiv.appendChild(linksDiv);
                article.appendChild(contentDiv);
            }
            
            container.appendChild(article);
        });
        
        // Always show "View All Projects" button after the grid
        const viewAllWrapper = document.createElement('div');
        viewAllWrapper.style.textAlign = 'center';
        viewAllWrapper.style.marginTop = '40px';
        
        const btn = document.createElement('a');
        btn.href = '/projects-list';
        btn.className = 'btn btn-primary';
        btn.textContent = 'View All Projects';
        btn.style.display = 'inline-block';
        
        viewAllWrapper.appendChild(btn);
        container.parentElement.appendChild(viewAllWrapper);
    }

    // Render blog posts
    renderBlog(posts) {
        if (!posts || posts.length === 0) return;
        
        const container = document.querySelector('.blog-grid');
        if (!container) return;
        
        const publishedPosts = posts.filter(p => p.published && !p.hidden);
        if (publishedPosts.length === 0) return;
        
        // Separate featured and non-featured posts
        const featuredPost = publishedPosts.find(p => p.featured);
        const otherPosts = publishedPosts.filter(p => !p.featured);
        
        // Show max 1 featured + 3 other posts on homepage
        const displayPosts = [];
        if (featuredPost) displayPosts.push(featuredPost);
        displayPosts.push(...otherPosts.slice(0, 3));
        
        // Clear container safely
        container.innerHTML = '';
        
        displayPosts.forEach((post, index) => {
            const article = document.createElement('article');
            article.className = 'blog-card' + (index === 0 && post.featured ? ' featured-post' : '');
            article.style.cursor = 'pointer';
            article.onclick = () => window.location.href = `/blog/${post.id}`;
            
            if (index === 0 && post.featured) {
                // Featured blog: grid layout with image on left, content on right
                const imageDiv = document.createElement('div');
                imageDiv.className = 'featured-image';
                imageDiv.style.position = 'relative';
                
                if (post.image_url) {
                    const img = document.createElement('img');
                    img.src = post.image_url;
                    img.alt = post.title;
                    img.loading = 'lazy';
                    img.onerror = function() { this.src = 'assets/blog/placeholder.jpg'; };
                    imageDiv.appendChild(img);
                }
                
                // Add badge on top of image
                const badge = document.createElement('div');
                badge.className = 'featured-badge';
                badge.textContent = 'Featured';
                badge.style.position = 'absolute';
                badge.style.top = '16px';
                badge.style.left = '16px';
                badge.style.zIndex = '10';
                imageDiv.appendChild(badge);
                article.appendChild(imageDiv);
                
                const contentDiv = document.createElement('div');
                contentDiv.className = 'featured-content';
                
                const title = document.createElement('h3');
                title.textContent = post.title;
                contentDiv.appendChild(title);
                
                const excerpt = document.createElement('p');
                excerpt.textContent = post.excerpt || post.content?.substring(0, 200) + '...' || '';
                contentDiv.appendChild(excerpt);
                
                const tagsDiv = document.createElement('div');
                tagsDiv.style.display = 'flex';
                tagsDiv.style.flexWrap = 'wrap';
                tagsDiv.style.gap = '8px';
                tagsDiv.style.marginBottom = '20px';
                (post.tags || []).forEach(tag => {
                    const tagSpan = document.createElement('span');
                    tagSpan.className = 'tech-tag';
                    tagSpan.textContent = tag;
                    tagsDiv.appendChild(tagSpan);
                });
                contentDiv.appendChild(tagsDiv);
                
                const metaDiv = document.createElement('div');
                metaDiv.style.display = 'flex';
                metaDiv.style.gap = '20px';
                metaDiv.style.fontSize = '14px';
                metaDiv.style.color = 'var(--text-secondary)';
                
                const dateSpan = document.createElement('span');
                dateSpan.textContent = new Date(post.created_at).toLocaleDateString();
                metaDiv.appendChild(dateSpan);
                
                const readSpan = document.createElement('span');
                readSpan.textContent = (post.read_time || 5) + ' min read';
                metaDiv.appendChild(readSpan);
                
                contentDiv.appendChild(metaDiv);
                article.appendChild(contentDiv);
            } else {
                // Regular blog: card layout
                const imageDiv = document.createElement('div');
                imageDiv.className = 'blog-image';
                if (post.image_url) {
                    const img = document.createElement('img');
                    img.src = post.image_url;
                    img.alt = post.title;
                    img.loading = 'lazy';
                    img.onerror = function() { this.src = 'assets/blog/placeholder.jpg'; };
                    imageDiv.appendChild(img);
                }
                article.appendChild(imageDiv);
                
                const contentDiv = document.createElement('div');
                contentDiv.className = 'blog-content';
                
                const category = document.createElement('div');
                category.className = 'post-category';
                category.textContent = (post.tags || [])[0] || 'General';
                contentDiv.appendChild(category);
                
                const title = document.createElement('h3');
                title.textContent = post.title;
                contentDiv.appendChild(title);
                
                const excerpt = document.createElement('p');
                excerpt.textContent = post.excerpt || post.content?.substring(0, 150) + '...' || '';
                contentDiv.appendChild(excerpt);
                
                const metaDiv = document.createElement('div');
                metaDiv.className = 'post-meta';
                
                const dateSpan = document.createElement('span');
                dateSpan.className = 'post-date';
                dateSpan.textContent = new Date(post.created_at).toLocaleDateString();
                metaDiv.appendChild(dateSpan);
                
                const readSpan = document.createElement('span');
                readSpan.className = 'read-time';
                readSpan.textContent = (post.read_time || 5) + ' min read';
                metaDiv.appendChild(readSpan);
                
                contentDiv.appendChild(metaDiv);
                article.appendChild(contentDiv);
            }
            
            container.appendChild(article);
        });
        
        // Always show "View All Blog Posts" button after the grid
        const viewAllBtn = document.createElement('div');
        viewAllBtn.style.textAlign = 'center';
        viewAllBtn.style.marginTop = '40px';
        
        const btn = document.createElement('a');
        btn.href = '/blogs';
        btn.className = 'btn btn-primary';
        btn.textContent = 'View All Blog Posts';
        btn.style.display = 'inline-block';
        
        viewAllBtn.appendChild(btn);
        container.parentElement.appendChild(viewAllBtn);
    }

    // Render skills
    renderSkills(skills) {
        if (!skills || skills.length === 0) return;
        
        const container = document.querySelector('.skills-grid');
        if (!container) return;
        
        const visibleSkills = skills.filter(s => !s.hidden);
        
        // Clear container safely
        container.innerHTML = '';
        
        visibleSkills.forEach(skill => {
            const skillDiv = document.createElement('div');
            skillDiv.className = 'skill-category';
            
            const title = document.createElement('h4');
            title.textContent = skill.category;
            skillDiv.appendChild(title);
            
            const tagsDiv = document.createElement('div');
            tagsDiv.className = 'skill-tags';
            (skill.skills || []).forEach(s => {
                const span = document.createElement('span');
                span.className = 'skill-tag';
                span.textContent = s;
                tagsDiv.appendChild(span);
            });
            skillDiv.appendChild(tagsDiv);
            
            container.appendChild(skillDiv);
        });
    }

    // Reveal last name after animation delay
    _scheduleLastNameReveal(lastName) {
        const lastNameEl = document.getElementById('hero-name-lastname');
        if (!lastNameEl) return;
        // Use passed value, fall back to data attribute default (e.g. 'Acharya' from HTML)
        const name = lastName || lastNameEl.dataset.lastname;
        if (!name) return;
        const letters = ['\u00A0', ...name.split('')];
        let html = '';
        letters.forEach(char => {
            html += `<span class="name-letter" style="opacity:0;display:inline-block;transition:opacity 0.3s ease;">${char}</span>`;
        });
        setTimeout(() => {
            lastNameEl.innerHTML = html;
            lastNameEl.querySelectorAll('.name-letter').forEach((span, i) => {
                setTimeout(() => { span.style.opacity = '1'; }, i * 80);
            });
        }, 1600);
    }

    // Apply settings from API
    applySettings(settings) {
        // Update first name only - last name is revealed after animation via _scheduleLastNameReveal
        if (settings.hero_name) {
            const heroTitle = document.querySelector('.hero-name');
            if (heroTitle) {
                const lastNameEl = document.getElementById('hero-name-lastname');
                // Remove existing first-name letter spans only
                [...heroTitle.querySelectorAll(':scope > .name-letter')].forEach(el => el.remove());
                // Rebuild first name letters before the lastname span
                settings.hero_name.trim().split('').forEach(char => {
                    const span = document.createElement('span');
                    span.className = 'name-letter';
                    span.textContent = char === ' ' ? '\u00A0' : char;
                    heroTitle.insertBefore(span, lastNameEl);
                });
            }
        }

        // Store last name on instance so _scheduleLastNameReveal can use it directly
        this._heroLastName = settings.hero_lastname || null;

        if (settings.hero_tagline) {
            const heroTagline = document.querySelector('.hero-tagline');
            if (heroTagline) heroTagline.textContent = settings.hero_tagline;
        }

        if (settings.hero_roles) {
            this.typingRoles = settings.hero_roles
                .split(',')
                .map(role => role.trim())
                .filter(Boolean);
        }

        if (settings.hero_cv_url) {
            const cvBtn = document.getElementById('hero-cv-btn');
            if (cvBtn) {
                const cvUrl = settings.hero_cv_url;
                const fileName = cvUrl.split('/').pop() || 'CV.pdf';
                cvBtn.href = cvUrl;
                cvBtn.setAttribute('download', fileName);
                // Force download via fetch+blob to bypass Content-Disposition
                cvBtn.onclick = function(e) {
                    e.preventDefault();
                    fetch(cvUrl)
                        .then(r => r.blob())
                        .then(blob => {
                            const blobUrl = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = blobUrl;
                            a.download = fileName;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(blobUrl);
                        })
                        .catch(() => { window.open(cvUrl, '_blank'); });
                };
            }
        }

        if (settings.hero_years_experience) {
            const yearsNumber = document.getElementById('hero-years-number');
            if (yearsNumber) yearsNumber.textContent = settings.hero_years_experience;
        }

        if (settings.hero_years_label) {
            const yearsLabel = document.getElementById('hero-years-label');
            if (yearsLabel) yearsLabel.textContent = settings.hero_years_label;
        }

        if (settings.hero_education_value) {
            const eduValue = document.getElementById('hero-education-value');
            if (eduValue) eduValue.textContent = settings.hero_education_value;
        }

        if (settings.hero_education_label) {
            const eduLabel = document.getElementById('hero-education-label');
            if (eduLabel) eduLabel.textContent = settings.hero_education_label;
        }

        if (settings.hero_location) {
            const locationLabel = document.getElementById('hero-location-label');
            if (locationLabel) locationLabel.textContent = settings.hero_location;
        }

        if (settings.about_paragraph_1) {
            const p1 = document.getElementById('about-paragraph-1');
            if (p1) p1.textContent = settings.about_paragraph_1;
        }

        if (settings.about_paragraph_2) {
            const p2 = document.getElementById('about-paragraph-2');
            if (p2) p2.textContent = settings.about_paragraph_2;
        }

        if (settings.about_paragraph_3) {
            const p3 = document.getElementById('about-paragraph-3');
            if (p3) p3.textContent = settings.about_paragraph_3;
        }

        if (settings.about_bio) {
            const p1 = document.getElementById('about-paragraph-1');
            if (p1) p1.textContent = settings.about_bio;
        }

        if (settings.about_image) {
            const profileImage = document.querySelector('.profile-img');
            if (profileImage) profileImage.src = settings.about_image;
        }

        // Update About section title
        if (settings.about_title) {
            const aboutTitle = document.querySelector('#about .section-title');
            if (aboutTitle) aboutTitle.textContent = settings.about_title;
        }

        // Update About timeline nodes
        const timelineNodes = document.querySelectorAll('.timeline-node');
        if (timelineNodes.length >= 3) {
            // Education node (first)
            if (settings.about_edu_title) {
                const eduH4 = timelineNodes[0].querySelector('h4');
                if (eduH4) eduH4.textContent = settings.about_edu_title;
            }
            if (settings.about_edu_desc) {
                const eduP = timelineNodes[0].querySelector('p');
                if (eduP) eduP.textContent = settings.about_edu_desc;
            }
            if (settings.about_edu_sub) {
                const eduSpan = timelineNodes[0].querySelector('span');
                if (eduSpan) eduSpan.textContent = settings.about_edu_sub;
            }

            // Experience node (second)
            if (settings.about_exp_title) {
                const expH4 = timelineNodes[1].querySelector('h4');
                if (expH4) expH4.textContent = settings.about_exp_title;
            }
            if (settings.about_exp_desc) {
                const expP = timelineNodes[1].querySelector('p');
                if (expP) expP.textContent = settings.about_exp_desc;
            }
            if (settings.about_exp_sub) {
                const expSpan = timelineNodes[1].querySelector('span');
                if (expSpan) expSpan.textContent = settings.about_exp_sub;
            }

            // Current node (third)
            if (settings.about_current_title) {
                const currentH4 = timelineNodes[2].querySelector('h4');
                if (currentH4) currentH4.textContent = settings.about_current_title;
            }
            if (settings.about_current_desc) {
                const currentP = timelineNodes[2].querySelector('p');
                if (currentP) currentP.textContent = settings.about_current_desc;
            }
            if (settings.about_current_sub) {
                const currentSpan = timelineNodes[2].querySelector('span');
                if (currentSpan) currentSpan.textContent = settings.about_current_sub;
            }
        }
    }

    // Setup contact form
    setupContactForm() {
        const form = document.getElementById('contact-form');
        if (!form) return;
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(form);
            const data = {
                name: formData.get('name'),
                email: formData.get('email'),
                subject: formData.get('subject'),
                message: formData.get('message')
            };
            
            try {
                const res = await fetch('/api/contact', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                
                if (res.ok) {
                    alert('Message sent successfully!');
                    form.reset();
                } else {
                    throw new Error('Failed to send');
                }
            } catch (err) {
                alert('Error sending message. Please try again.');
            }
        });
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PortfolioApp();
    
    // Initialize Lucide icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
});

// Service Worker for PWA functionality (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Uncomment when you have a service worker file
        // navigator.serviceWorker.register('/sw.js');
    });
}
