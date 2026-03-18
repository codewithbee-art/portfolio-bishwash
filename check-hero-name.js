const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('database/portfolio.db');

db.get('SELECT value FROM settings WHERE key = "hero_name"', (err, row) => {
    if (err) {
        console.error('Error:', err);
    } else if (row) {
        console.log('Hero name in database:', JSON.stringify(row.value));
        console.log('Length:', row.value.length);
        console.log('Bytes:', Buffer.from(row.value).toString('hex'));
        
        // Check if it contains Nepali characters
        const hasNepali = /[\u0900-\u097F]/.test(row.value);
        console.log('Contains Nepali characters:', hasNepali);
    } else {
        console.log('No hero_name found in database');
    }
    db.close();
});
