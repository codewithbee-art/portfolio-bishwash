const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('database/portfolio.db');

console.log('Testing Unicode storage...');

// Test inserting Nepali text
const testText = 'बिश्वाश आचार्य';

console.log('Original text:', testText);
console.log('Text length:', testText.length);
console.log('Text bytes:', Buffer.from(testText).toString('hex'));

// Check current database encoding
db.get('PRAGMA encoding', (err, row) => {
    if (err) {
        console.error('Error getting encoding:', err);
    } else {
        console.log('Database encoding:', row);
        
        // Test storing and retrieving Nepali text
        db.run('DELETE FROM settings WHERE key = "test_unicode"', (err) => {
            if (err) console.error('Delete error:', err);
            
            db.run('INSERT INTO settings (key, value) VALUES (?, ?)', ['test_unicode', testText], function(err) {
                if (err) {
                    console.error('Insert error:', err);
                } else {
                    console.log('Inserted successfully, ID:', this.lastID);
                    
                    // Retrieve the text
                    db.get('SELECT value FROM settings WHERE key = "test_unicode"', (err, row) => {
                        if (err) {
                            console.error('Select error:', err);
                        } else {
                            console.log('Retrieved text:', row.value);
                            console.log('Retrieved length:', row.value.length);
                            console.log('Retrieved bytes:', Buffer.from(row.value).toString('hex'));
                            console.log('Match original:', row.value === testText);
                            
                            // Clean up
                            db.run('DELETE FROM settings WHERE key = "test_unicode"');
                            db.close();
                        }
                    });
                }
            });
        });
    }
});
