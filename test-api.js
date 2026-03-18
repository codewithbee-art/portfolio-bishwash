const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('database/portfolio.db');

console.log('Testing projects API query...');

// Simulate the API query for non-admin users
const query = 'SELECT * FROM projects WHERE hidden = 0 ORDER BY order_num, created_at';

db.all(query, [], (err, rows) => {
    if (err) {
        console.error('Error:', err);
    } else {
        console.log('Projects returned by API:');
        console.log('Count:', rows.length);
        rows.forEach(row => {
            console.log(`- ${row.title} (hidden: ${row.hidden}, featured: ${row.featured})`);
        });
        
        // Test JSON parsing of tags
        console.log('\nTesting tag parsing:');
        rows.forEach(row => {
            if (row.tags) {
                try {
                    const parsed = JSON.parse(row.tags);
                    console.log(`Tags for ${row.title}:`, parsed);
                } catch (e) {
                    console.log(`Failed to parse tags for ${row.title}:`, row.tags);
                }
            }
        });
    }
    db.close();
});
