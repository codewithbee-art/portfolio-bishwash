const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('database/portfolio.db');

db.all('SELECT title, hidden FROM projects', (err, rows) => {
    if (err) {
        console.error('Error:', err);
    } else {
        console.log('All projects:');
        rows.forEach(row => {
            console.log(`- ${row.title} (hidden: ${row.hidden})`);
        });
    }
    db.close();
});
