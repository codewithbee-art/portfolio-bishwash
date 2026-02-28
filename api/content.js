const express = require('express');
const validator = require('validator');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../database/db');
const router = express.Router();

// Input validation helper
const validateInput = (data, fields) => {
    for (const [field, config] of Object.entries(fields)) {
        const value = data[field];
        
        // Check if required
        if (config.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
            return `${config.label || field} is required`;
        }
        
        // Check type
        if (value) {
            const actualType = Array.isArray(value) ? 'array' : typeof value;
            if (actualType !== config.type) {
                return `${config.label || field} must be of type ${config.type}`;
            }
        }
        
        // Check length if string
        if (value && typeof value === 'string' && config.maxLength && value.length > config.maxLength) {
            return `${config.label || field} must be less than ${config.maxLength} characters`;
        }
        
        if (value && typeof value === 'string' && config.minLength && value.length < config.minLength) {
            return `${config.label || field} must be at least ${config.minLength} characters`;
        }
    }
    return null;
};

// Middleware to check admin auth
const requireAuth = (req, res, next) => {
    if (!req.session.isAdmin) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
};

// Generic CRUD operations
const createCRUDRoutes = (tableName) => {
    // Allowed columns per table (whitelist to prevent SQL injection via column names)
    const allowedColumns = {
        experience: ['company', 'role', 'period', 'description', 'badge', 'order_num', 'hidden'],
        education: ['institution', 'degree', 'period', 'description', 'badge', 'order_num', 'hidden'],
        projects: ['title', 'description', 'tags', 'image_url', 'project_url', 'github_url', 'featured', 'order_num', 'hidden'],
        blog: ['title', 'content', 'excerpt', 'tags', 'image_url', 'read_time', 'featured', 'published', 'order_num', 'hidden'],
        skills: ['category', 'skills', 'hidden']
    };

    // Validation rules for each table
    const validationRules = {
        experience: {
            company: { type: 'string', required: true, maxLength: 100, label: 'Company' },
            role: { type: 'string', required: true, maxLength: 100, label: 'Role' },
            period: { type: 'string', required: true, maxLength: 50, label: 'Period' },
            description: { type: 'string', maxLength: 2000 },
            badge: { type: 'string', maxLength: 20 }
        },
        education: {
            institution: { type: 'string', required: true, maxLength: 100 },
            degree: { type: 'string', required: true, maxLength: 100 },
            period: { type: 'string', required: true, maxLength: 50 },
            description: { type: 'string', maxLength: 2000 },
            badge: { type: 'string', maxLength: 20 }
        },
        projects: {
            title: { type: 'string', required: true, maxLength: 200 },
            description: { type: 'string', maxLength: 2000 },
            tags: { type: 'array' },
            image_url: { type: 'string', maxLength: 500 },
            project_url: { type: 'string', maxLength: 500 },
            github_url: { type: 'string', maxLength: 500 },
            featured: { type: 'number' }
        },
        blog: {
            title: { type: 'string', required: true, maxLength: 200 },
            content: { type: 'string', required: true, maxLength: 50000 },
            excerpt: { type: 'string', maxLength: 500 },
            tags: { type: 'array' },
            image_url: { type: 'string', maxLength: 500 },
            read_time: { type: 'number' },
            featured: { type: 'number' },
            published: { type: 'number' }
        },
        skills: {
            category: { type: 'string', required: true, maxLength: 100 }
        }
    };
    
    // Get all items (public - respects hidden)
    router.get(`/${tableName}`, (req, res) => {
        const showHidden = req.session.isAdmin;
        // Some tables have order_num, others don't
        const hasOrderNum = ['experience', 'education', 'projects', 'blog'].includes(tableName);
        const orderBy = hasOrderNum ? 'ORDER BY order_num, created_at' : 'ORDER BY created_at';
        const query = showHidden 
            ? `SELECT * FROM ${tableName} ${orderBy}`
            : `SELECT * FROM ${tableName} WHERE hidden = 0 ${orderBy}`;
        
        db.all(query, [], (err, rows) => {
            if (err) {
                console.error(`Error fetching ${tableName}:`, err);
                return res.status(500).json({ error: err.message });
            }
            // Parse JSON fields based on table
            try {
                rows.forEach(row => {
                    if (row.tags && typeof row.tags === 'string') row.tags = JSON.parse(row.tags);
                    if (row.skills && typeof row.skills === 'string') row.skills = JSON.parse(row.skills);
                });
            } catch (parseErr) {
                console.error('JSON parse error:', parseErr);
                // Continue anyway
            }
            res.json(rows);
        });
    });

    // Get featured/recent items for specific tables
    if (tableName === 'projects') {
        router.get(`/${tableName}/featured`, (req, res) => {
            const showHidden = req.session.isAdmin;
            const query = showHidden 
                ? `SELECT * FROM ${tableName} WHERE featured = 1 OR hidden = 0 ORDER BY featured DESC, created_at DESC`
                : `SELECT * FROM ${tableName} WHERE (featured = 1 OR hidden = 0) AND hidden = 0 ORDER BY featured DESC, created_at DESC`;
            
            db.all(query, [], (err, rows) => {
                if (err) {
                    console.error(`Error fetching featured ${tableName}:`, err);
                    return res.status(500).json({ error: err.message });
                }
                
                // Parse JSON fields
                try {
                    rows.forEach(row => {
                        if (row.tags && typeof row.tags === 'string') row.tags = JSON.parse(row.tags);
                        if (row.skills && typeof row.skills === 'string') row.skills = JSON.parse(row.skills);
                    });
                } catch (parseErr) {
                    console.error('JSON parse error:', parseErr);
                }
                
                // Separate featured and recent projects
                const featured = rows.filter(r => r.featured === 1);
                const recent = rows.filter(r => r.featured !== 1).slice(0, 3);
                
                res.json({
                    featured,
                    recent,
                    all: [...featured, ...recent]
                });
            });
        });

        // Get projects by category
        router.get(`/${tableName}/category/:category`, (req, res) => {
            const category = req.params.category;
            const showHidden = req.session.isAdmin;
            
            const query = showHidden 
                ? `SELECT * FROM ${tableName} WHERE tags LIKE ? ORDER BY created_at DESC`
                : `SELECT * FROM ${tableName} WHERE tags LIKE ? AND hidden = 0 ORDER BY created_at DESC`;
            
            db.all(query, [`%${category}%`], (err, rows) => {
                if (err) {
                    console.error(`Error fetching ${tableName} by category:`, err);
                    return res.status(500).json({ error: err.message });
                }
                
                // Parse JSON fields and filter by exact category match
                try {
                    rows.forEach(row => {
                        if (row.tags && typeof row.tags === 'string') row.tags = JSON.parse(row.tags);
                        if (row.skills && typeof row.skills === 'string') row.skills = JSON.parse(row.skills);
                    });
                } catch (parseErr) {
                    console.error('JSON parse error:', parseErr);
                }
                
                // Filter for exact category match
                const filtered = rows.filter(row => 
                    row.tags && Array.isArray(row.tags) && row.tags.includes(category)
                );
                
                res.json(filtered);
            });
        });

        // Get all categories for projects
        router.get(`/${tableName}/categories`, (req, res) => {
            const query = `SELECT tags FROM ${tableName} WHERE hidden = 0 AND tags IS NOT NULL AND tags != '[]'`;
            
            db.all(query, [], (err, rows) => {
                if (err) {
                    console.error(`Error fetching ${tableName} categories:`, err);
                    return res.status(500).json({ error: err.message });
                }
                
                const allTags = [];
                rows.forEach(row => {
                    try {
                        if (row.tags && typeof row.tags === 'string') {
                            const tags = JSON.parse(row.tags);
                            if (Array.isArray(tags)) {
                                allTags.push(...tags);
                            }
                        }
                    } catch (parseErr) {
                        console.error('JSON parse error:', parseErr);
                    }
                });
                
                // Get unique categories and count
                const categoryCounts = {};
                allTags.forEach(tag => {
                    categoryCounts[tag] = (categoryCounts[tag] || 0) + 1;
                });
                
                const categories = Object.entries(categoryCounts)
                    .map(([name, count]) => ({ name, count }))
                    .sort((a, b) => b.count - a.count);
                
                res.json(categories);
            });
        });
    }

    // Blog-specific endpoints (mirroring projects pattern)
    if (tableName === 'blog') {
        // Get blog posts by category/tag
        router.get(`/${tableName}/category/:category`, (req, res) => {
            const category = req.params.category;
            const showHidden = req.session.isAdmin;
            
            const query = showHidden 
                ? `SELECT * FROM ${tableName} WHERE tags LIKE ? ORDER BY created_at DESC`
                : `SELECT * FROM ${tableName} WHERE tags LIKE ? AND hidden = 0 AND published = 1 ORDER BY created_at DESC`;
            
            db.all(query, [`%${category}%`], (err, rows) => {
                if (err) {
                    console.error(`Error fetching ${tableName} by category:`, err);
                    return res.status(500).json({ error: err.message });
                }
                
                try {
                    rows.forEach(row => {
                        if (row.tags && typeof row.tags === 'string') row.tags = JSON.parse(row.tags);
                    });
                } catch (parseErr) {
                    console.error('JSON parse error:', parseErr);
                }
                
                const filtered = rows.filter(row => 
                    row.tags && Array.isArray(row.tags) && row.tags.includes(category)
                );
                
                res.json(filtered);
            });
        });

        // Get all categories/tags for blog posts
        router.get(`/${tableName}/categories`, (req, res) => {
            const query = `SELECT tags FROM ${tableName} WHERE hidden = 0 AND published = 1 AND tags IS NOT NULL AND tags != '[]'`;
            
            db.all(query, [], (err, rows) => {
                if (err) {
                    console.error(`Error fetching ${tableName} categories:`, err);
                    return res.status(500).json({ error: err.message });
                }
                
                const allTags = [];
                rows.forEach(row => {
                    try {
                        if (row.tags && typeof row.tags === 'string') {
                            const tags = JSON.parse(row.tags);
                            if (Array.isArray(tags)) {
                                allTags.push(...tags);
                            }
                        }
                    } catch (parseErr) {
                        console.error('JSON parse error:', parseErr);
                    }
                });
                
                const categoryCounts = {};
                allTags.forEach(tag => {
                    categoryCounts[tag] = (categoryCounts[tag] || 0) + 1;
                });
                
                const categories = Object.entries(categoryCounts)
                    .map(([name, count]) => ({ name, count }))
                    .sort((a, b) => b.count - a.count);
                
                res.json(categories);
            });
        });
    }

    // Get single item
    router.get(`/${tableName}/:id`, (req, res) => {
        db.get(`SELECT * FROM ${tableName} WHERE id = ?`, [req.params.id], (err, row) => {
            if (err) return res.status(500).json({ error: err.message });
            if (!row) return res.status(404).json({ error: 'Not found' });
            try {
                if (row.tags && typeof row.tags === 'string') row.tags = JSON.parse(row.tags);
                if (row.skills && typeof row.skills === 'string') row.skills = JSON.parse(row.skills);
            } catch (parseErr) {
                console.error('JSON parse error:', parseErr);
                // Continue anyway - just leave as string if parse fails
            }
            res.json(row);
        });
    });

    // Create item (admin only)
    router.post(`/${tableName}`, requireAuth, (req, res) => {
        const rules = validationRules[tableName];
        if (rules) {
            const validationError = validateInput(req.body, rules);
            if (validationError) {
                return res.status(400).json({ error: validationError });
            }
        }
        
        const id = uuidv4();
        const data = req.body;
        
        // Auto-remove featured from others if this item is being featured
        const hasFeatured = (tableName === 'projects' || tableName === 'blog') && data.featured === 1;
        if (hasFeatured) {
            db.run(`UPDATE ${tableName} SET featured = 0 WHERE featured = 1`, [], (err) => {
                if (err) console.error('Error unfeaturing old items:', err);
            });
        }
        
        // Build dynamic query based on provided fields
        const fields = ['id'];
        const values = [id];
        const placeholders = ['?'];
        
        const whitelist = allowedColumns[tableName] || [];
        Object.keys(data).forEach(key => {
            if (key === 'id' || !whitelist.includes(key)) return;
            if ((key === 'tags' || key === 'skills') && Array.isArray(data[key])) {
                fields.push(key);
                values.push(JSON.stringify(data[key]));
                placeholders.push('?');
            } else {
                fields.push(key);
                values.push(data[key]);
                placeholders.push('?');
            }
        });
        
        const query = `INSERT INTO ${tableName} (${fields.join(', ')}) VALUES (${placeholders.join(', ')})`;
        
        db.run(query, values, function(err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({ id, success: true });
        });
    });

    // Update item (admin only)
    router.put(`/${tableName}/:id`, requireAuth, (req, res) => {
        const rules = validationRules[tableName];
        if (rules) {
            const validationError = validateInput(req.body, rules);
            if (validationError) {
                return res.status(400).json({ error: validationError });
            }
        }
        
        const data = req.body;
        
        // Auto-remove featured from others if this item is being featured
        const hasFeatured = (tableName === 'projects' || tableName === 'blog') && data.featured === 1;
        if (hasFeatured) {
            db.run(`UPDATE ${tableName} SET featured = 0 WHERE featured = 1 AND id != ?`, [req.params.id], (err) => {
                if (err) console.error('Error unfeaturing old items:', err);
            });
        }
        
        const updates = [];
        const values = [];
        const whitelist = allowedColumns[tableName] || [];
        
        Object.keys(data).forEach(key => {
            if (key === 'id' || !whitelist.includes(key)) return;
            if ((key === 'tags' || key === 'skills') && Array.isArray(data[key])) {
                updates.push(`${key} = ?`);
                values.push(JSON.stringify(data[key]));
            } else {
                updates.push(`${key} = ?`);
                values.push(data[key]);
            }
        });
        
        values.push(req.params.id);
        const query = `UPDATE ${tableName} SET ${updates.join(', ')} WHERE id = ?`;
        
        db.run(query, values, function(err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({ success: true, changes: this.changes });
        });
    });

    // Delete item (admin only)
    router.delete(`/${tableName}/:id`, requireAuth, (req, res) => {
        db.run(`DELETE FROM ${tableName} WHERE id = ?`, [req.params.id], function(err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({ success: true, changes: this.changes });
        });
    });

    // Toggle hidden status (admin only)
    router.patch(`/${tableName}/:id/toggle`, requireAuth, (req, res) => {
        db.run(
            `UPDATE ${tableName} SET hidden = CASE WHEN hidden = 0 THEN 1 ELSE 0 END WHERE id = ?`,
            [req.params.id],
            function(err) {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }
                res.json({ success: true, changes: this.changes });
            }
        );
    });
};

// Create routes for each table
['experience', 'education', 'projects', 'blog', 'skills'].forEach(createCRUDRoutes);

// Keys that must never be exposed to the public frontend
const SENSITIVE_KEYS = ['admin_password_hash', 'admin_username', 'smtp_user', 'smtp_app_password', 'recovery_email'];

// Settings routes — public (filters out sensitive keys)
router.get('/settings', (req, res) => {
    db.all('SELECT * FROM settings', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        const settings = {};
        rows.forEach(row => {
            if (!SENSITIVE_KEYS.includes(row.key)) {
                settings[row.key] = row.value;
            }
        });
        res.json(settings);
    });
});

// Settings routes — admin only (includes sensitive keys, masks password)
router.get('/settings/secure', requireAuth, (req, res) => {
    db.all('SELECT * FROM settings', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        const settings = {};
        rows.forEach(row => {
            if (row.key === 'admin_password_hash') return;
            if (row.key === 'smtp_app_password' && row.value) {
                settings[row.key] = '••••••••••••••••';
            } else {
                settings[row.key] = row.value;
            }
        });
        res.json(settings);
    });
});

router.put('/settings/:key', requireAuth, (req, res) => {
    const { value } = req.body;
    if (req.params.key === 'admin_password_hash') {
        return res.status(403).json({ error: 'Cannot modify password hash directly' });
    }
    db.run(
        'INSERT INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = CURRENT_TIMESTAMP',
        [req.params.key, value, value],
        function(err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({ success: true });
        }
    );
});

module.exports = router;
