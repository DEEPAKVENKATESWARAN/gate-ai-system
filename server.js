const express = require('express');
const cors = require('cors');
const multer = require('multer');
const sqlite3 = require('sqlite3').verbose();
const Tesseract = require('tesseract.js');

const app = express();

app.use(cors());
app.use(express.json());

const upload = multer({
  dest: 'uploads/'
});

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
    ('KA01EF9999'),
    ('TN87C5106')
  `);

});

app.post('/scan-car', upload.single('image'), async (req, res) => {

  try {

    console.log('Image received');

    if (!req.file) {

      return res.status(400).json({
        error: 'No image uploaded'
      });

    }

    const imagePath = req.file.path;

    const result = await Tesseract.recognize(
      imagePath,
      'eng'
    );

    let detectedPlate = result.data.text;

    console.log('Raw OCR:', detectedPlate);

    detectedPlate = detectedPlate
      .replace(/[^A-Z0-9]/gi, '')
      .toUpperCase();

      const match = detectedPlate.match(
  /[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}/
);

detectedPlate = match
  ? match[0]
  : 'NOT_FOUND';

    console.log('Cleaned Plate:', detectedPlate);

    db.get(
      `SELECT * FROM allowed_cars WHERE plate_number = ?`,
      [detectedPlate],

      (err, row) => {

        if (err) {

          return res.status(500).json({
            error: err.message
          });

        }

        if (row) {

          return res.json({
            success: true,
            gate: 'OPEN',
            plate: detectedPlate
          });

        } else {

          return res.json({
            success: false,
            gate: 'CLOSED',
            plate: detectedPlate
          });

        }

      }

    );

  } catch (error) {

    console.log(error);

    return res.status(500).json({
      error: 'OCR failed'
    });

  }

});

app.get('/', (req, res) => {

  res.send('Gate AI API Running');

});

app.listen(3000, () => {

  console.log('Server running on http://localhost:3000');

});