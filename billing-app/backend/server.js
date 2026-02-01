const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Database Setup
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        initializeDatabase();
    }
});

function initializeDatabase() {
    db.run(`CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    barcode TEXT UNIQUE,
    price REAL NOT NULL,
    stock INTEGER DEFAULT 0
  )`);

    db.run(`CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    total REAL NOT NULL,
    items TEXT NOT NULL,
    date DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
}

// Routes
app.get('/api/products', (req, res) => {
    db.all('SELECT * FROM products', [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

app.post('/api/products', (req, res) => {
    const { name, barcode, price, stock } = req.body;
    db.run(`INSERT INTO products (name, barcode, price, stock) VALUES (?, ?, ?, ?)`,
        [name, barcode, price, stock],
        function (err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({ id: this.lastID });
        });
});

app.post('/api/print-receipt', (req, res) => {
    // Placeholder for ESC/POS printing logic
    const { items, total } = req.body;
    console.log('Printing receipt for:', items, 'Total:', total);
    // TODO: Implement actual printing
    res.json({ success: true });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    if (process.send) {
        process.send('ready');
    }
});
