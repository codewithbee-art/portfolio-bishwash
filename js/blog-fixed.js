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
