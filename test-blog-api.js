const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('database/portfolio.db');

console.log('Testing blog API query...');

// Simulate the API query for non-admin users
const query = 'SELECT * FROM blog WHERE published = 1 AND hidden = 0 ORDER BY order_num, created_at';

db.all(query, [], (err, rows) => {
    if (err) {
        console.error('Error:', err);
    } else {
        console.log('Blogs returned by API:');
        console.log('Count:', rows.length);
        rows.forEach(row => {
            console.log(`- ${row.title} (published: ${row.published}, hidden: ${row.hidden}, featured: ${row.featured})`);
        });
    }
    db.close();
});
