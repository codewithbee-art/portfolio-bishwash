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

        const navLinks = document.querySelectorAll('a[href^="#"]:not(#hero-cv-btn)');

        

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

        

        // Handle both click and touch events

        const toggleMenu = (e) => {

            e.preventDefault();

            e.stopPropagation();

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

            const settings = await fetch(`/api/content/settings?t=${Date.now()}`).then(r => r.json()).catch(() => []);

            

            this.renderTimelineItems('experience', exp);

            this.renderTimelineItems('education', edu);

            this.renderProjects(proj);

            this.renderBlog(blog);

            this.renderSkills(skills);

            this.applySettings(settings);

            this._scheduleLastNameReveal(this._heroLastName);

            

            setTimeout(() => this.setupDynamicTimeline(), 100);

        } catch (err) {

            console.error('Failed to load content from API:', err);

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

            card.appendChild(badge);

            

            const heading = document.createElement('h3');

            heading.textContent = type === 'experience' ? item.company : item.institution;

            header.appendChild(heading);

            

            const position = document.createElement('span');

            position.className = 'position';

            position.textContent = type === 'experience' ? item.role : item.degree;

            header.appendChild(position);

            

            // Add date to header instead of meta
            const date = document.createElement('span');
            date.className = 'date';
            date.textContent = `📅 ${item.period}`;
            header.appendChild(date);

            

            card.appendChild(header);

            

            const meta = document.createElement('div');

            meta.className = 'card-meta';

            const locationSpan = document.createElement('span');
            locationSpan.className = 'location';
            locationSpan.textContent = `📍 ${item.location || ''}`;

            meta.appendChild(locationSpan);

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

                    img.onerror = function() { this.src = '/assets/projects/placeholder.jpg'; };

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

                badge.style.width = 'fit-content';

                badge.style.display = 'inline-block';

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

                    img.onerror = function() { this.src = '/assets/projects/placeholder.jpg'; };

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

                    img.onerror = function() { this.src = '/assets/projects/placeholder.jpg'; };

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

                tagsDiv.className = 'project-tech';

                const maxTags = 5;

                const tags = post.tags || [];

                const displayTags = tags.slice(0, maxTags);

                const remaining = tags.length - maxTags;

                displayTags.forEach(tag => {

                    const tagSpan = document.createElement('span');

                    tagSpan.className = 'tech-tag';

                    tagSpan.textContent = tag;

                    tagsDiv.appendChild(tagSpan);

                });

                if (remaining > 0) {

                    const moreSpan = document.createElement('span');

                    moreSpan.className = 'tech-tag';

                    moreSpan.style.opacity = '0.7';

                    moreSpan.textContent = `+${remaining} more`;

                    tagsDiv.appendChild(moreSpan);

                }

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

                    img.onerror = function() { this.src = '/assets/projects/placeholder.jpg'; };

                    imageDiv.appendChild(img);

                }

                article.appendChild(imageDiv);

                

                const contentDiv = document.createElement('div');

                contentDiv.className = 'blog-content';

                

                const title = document.createElement('h3');

                title.textContent = post.title;

                contentDiv.appendChild(title);

                

                const excerpt = document.createElement('p');

                excerpt.textContent = post.excerpt || post.content?.substring(0, 150) + '...' || '';

                contentDiv.appendChild(excerpt);

                

                // Add tags section like project cards

                const tagsDiv = document.createElement('div');

                tagsDiv.className = 'project-tech';

                tagsDiv.style.marginBottom = '12px';

                const maxTags = 5;

                const tags = post.tags || [];

                const displayTags = tags.slice(0, maxTags);

                const remaining = tags.length - maxTags;

                displayTags.forEach(tag => {

                    const tagSpan = document.createElement('span');

                    tagSpan.className = 'tech-tag';

                    tagSpan.textContent = tag;

                    tagsDiv.appendChild(tagSpan);

                });

                if (remaining > 0) {

                    const moreSpan = document.createElement('span');

                    moreSpan.className = 'tech-tag';

                    moreSpan.style.opacity = '0.7';

                    moreSpan.textContent = `+${remaining} more`;

                    tagsDiv.appendChild(moreSpan);

                }

                contentDiv.appendChild(tagsDiv);

                

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

        // Use passed value, fall back to instance property or data attribute default

        const name = lastName || this._heroLastName || lastNameEl.dataset.lastname;

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

                const firstName = settings.hero_name.trim();

                

                // Check if the text contains Unicode characters (like Nepali)

                const hasUnicode = /[^\x00-\x7F]/.test(firstName);

                

                if (hasUnicode) {

                    // For Unicode text, don't split into individual characters

                    // Instead, replace the first span with the complete name and hide others

                    const existingSpans = heroTitle.querySelectorAll(':scope > .name-letter');

                    existingSpans.forEach((span, i) => {

                        if (i === 0) {

                            span.textContent = firstName;

                            span.style.opacity = '0';

                            span.style.display = 'inline-block';

                            span.style.transition = 'opacity 0.3s ease';

                            // Animate the complete name at once

                            setTimeout(() => { span.style.opacity = '1'; }, 200);

                        } else {

                            // Hide remaining spans

                            span.style.display = 'none';

                        }

                    });

                } else {

                    // For English text, use the original character-by-character animation

                    const existingSpans = heroTitle.querySelectorAll(':scope > .name-letter');

                    const firstNameChars = Array.from(firstName);

                    

                    existingSpans.forEach((span, i) => {

                        if (firstNameChars[i]) {

                            span.textContent = firstNameChars[i];

                            span.style.opacity = '0';

                            span.style.display = 'inline-block';

                            span.style.transition = 'opacity 0.3s ease';

                            // Animate in with delay

                            setTimeout(() => { span.style.opacity = '1'; }, i * 80);

                        } else {

                            span.style.display = 'none';

                        }

                    });

                }

            }

        }



        this._heroLastName = settings.hero_lastname || null;

        if (settings.hero_tagline) {

            const heroTagline = document.querySelector('.hero-tagline');

            if (heroTagline) heroTagline.textContent = settings.hero_tagline;

        }

        if (settings.hero_roles) {

            // Handle both string and array formats

            if (typeof settings.hero_roles === 'string') {

                this.typingRoles = settings.hero_roles.split(',').map(role => role.trim());

            } else {

                this.typingRoles = settings.hero_roles;

            }

        }

        

        // Update hero stats bar
        const setText = (id, val) => { if (val) { const el = document.getElementById(id); if (el) el.textContent = val; } };
        setText('hero-years-number', settings.hero_years_experience);
        setText('hero-years-label', settings.hero_years_label);
        setText('hero-education-value', settings.hero_education_value);
        setText('hero-education-label', settings.hero_education_label);
        if (settings.hero_location) {
            const locEl = document.getElementById('hero-location-label');
            if (locEl) locEl.textContent = settings.hero_location;
        }

        // Update about section content
        setText('about-section-title', settings.about_title);
        setText('about-paragraph-1', settings.about_paragraph_1);
        setText('about-paragraph-2', settings.about_paragraph_2);
        setText('about-paragraph-3', settings.about_paragraph_3);
        setText('about-edu-title', settings.about_edu_title);
        setText('about-edu-desc', settings.about_edu_desc);
        setText('about-edu-sub', settings.about_edu_sub);
        setText('about-exp-title', settings.about_exp_title);
        setText('about-exp-desc', settings.about_exp_desc);
        setText('about-exp-sub', settings.about_exp_sub);
        setText('about-current-title', settings.about_current_title);
        setText('about-current-desc', settings.about_current_desc);
        setText('about-current-sub', settings.about_current_sub);

        // Update profile image in hero-image-section if about_image is set
        if (settings.about_image) {
            const profileImg = document.querySelector('.hero-image-section .profile-img');
            if (profileImg) profileImg.src = settings.about_image;
        }

        // Wire up CV download button - navigate to /download/cv which sends Content-Disposition: attachment
        const cvBtn = document.getElementById('hero-cv-btn');
        if (cvBtn && settings.hero_cv_url) {
            cvBtn.href = '/download/cv';
            if (!cvBtn.dataset.cvBound) {
                cvBtn.dataset.cvBound = '1';
                cvBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    window.location.href = '/download/cv';
                });
            }
        }

        // Update social links

        this.updateSocialLinks(settings);

    }



    updateSocialLinks(settings) {

        const socialLinks = document.getElementById('social-links');

        if (!socialLinks) return;



        const socialConfig = [

            { key: 'social_linkedin', label: 'LinkedIn', icon: 'M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z' },

            { key: 'social_github', label: 'GitHub', icon: 'M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z' },

            { key: 'social_youtube', label: 'YouTube', icon: 'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z' },

            { key: 'social_twitter', label: 'X (Twitter)', icon: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z' },

            { key: 'social_instagram', label: 'Instagram', icon: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12a6.162 6.162 0 1 1 12.324 0 6.162 6.162 0 0 1-12.324 0zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm4.965-10.405a1.44 1.44 0 1 1 2.881.001 1.44 1.44 0 0 1-2.881-.001z' },

            { key: 'social_facebook', label: 'Facebook', icon: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z' }

        ];



        let linksHtml = '';

        socialConfig.forEach(social => {

            const url = settings[social.key];

            if (url && url !== '#' && /^https?:\/\//i.test(url)) {

                const safeUrl = url.replace(/"/g, '&quot;');

                linksHtml += `

                    <a href="${safeUrl}" target="_blank" class="social-link" aria-label="${social.label}">

                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">

                            <path d="${social.icon}"/>

                        </svg>

                    </a>

                `;

            }

        });



        if (linksHtml) {

            socialLinks.innerHTML = linksHtml;

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

                message: formData.get('message'),

                website: formData.get('website') || ''

            };

            

            // Show loading state

            const submitBtn = form.querySelector('button[type="submit"]');

            const originalText = submitBtn.innerHTML;

            submitBtn.innerHTML = '<span>Sending...</span>';

            submitBtn.disabled = true;

            

            try {

                const response = await fetch('/api/contact', {

                    method: 'POST',

                    headers: {

                        'Content-Type': 'application/json'

                    },

                    body: JSON.stringify(data)

                });

                

                // Handle non-JSON responses (like rate limiting)

                let result;

                const contentType = response.headers.get('content-type');

                if (contentType && contentType.includes('application/json')) {

                    result = await response.json();

                } else {

                    const text = await response.text();

                    result = { error: text || 'Unknown error' };

                }

                

                if (response.ok) {

                    // Success

                    form.reset();

                    

                    // Check if popup functions are available

                    if (typeof showSuccess === 'function') {

                        // Add a small delay to ensure popup is ready

                        setTimeout(() => {

                            showSuccess('Message Sent! 🎉', 'Your message has been sent successfully. I\'ll get back to you as soon as possible.');

                        }, 100);

                    } else if (typeof showInfo === 'function') {

                        showInfo('Message Sent!', "I'll get back to you soon.");

                    }

                    

                    // Show warning if present

                    if (result.warning) {

                        setTimeout(() => {

                            showInfo('⚠️ Quick Submissions', result.warning);

                        }, 2000);

                    }

                } else {

                    // Error from server

                    const errorMessage = result.error || 'Failed to send message';

                    

                    // Handle different protection actions

                    if (result.action === 'captcha') {

                        showError('🔐 Verification Required', 'Please complete the CAPTCHA to continue. This helps prevent spam.');

                    } else if (result.action === 'block') {

                        const retryMinutes = Math.ceil(result.retryAfter / 60);

                        showError('🚫 Temporarily Blocked', `Too many messages detected. Please try again in ${retryMinutes} minutes.`);

                    } else if (errorMessage.includes('email address') || errorMessage.includes('disposable')) {

                        showError('Invalid Email 🚫', errorMessage);

                    } else {

                        showError('Send Failed', errorMessage);

                    }

                }

            } catch (error) {

                console.error('📨 Contact form error:', error);


                showError('Connection Error', 'Failed to send message. Please check your internet connection and try again.');

            } finally {

                // Reset button

                submitBtn.innerHTML = originalText;

                submitBtn.disabled = false;

            }

        });

    }

}



// Initialize Lucide icons

if (typeof lucide !== 'undefined') {

    lucide.createIcons();

}



// Initialize the portfolio app (skip if the script tag has data-no-auto-init — subpages init their own)

if (!document.currentScript || !document.currentScript.hasAttribute('data-no-auto-init')) {
    new PortfolioApp();
}

