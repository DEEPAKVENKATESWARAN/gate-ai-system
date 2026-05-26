const db = require('./database');
const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./cars.db');

db.serialize(() => {

  db.run(`
    CREATE TABLE IF NOT EXISTS allowed_cars (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plate_number TEXT UNIQUE
    )
  `);

  db.run(`
    INSERT OR IGNORE INTO allowed_cars (plate_number)
    VALUES
    ('TN37AB1234'),
    ('KL07CD5678'),
    ('KA01EF9999')
  `);

});

module.exports = db;