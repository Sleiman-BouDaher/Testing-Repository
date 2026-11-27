const crypto = require('crypto');
const path = require('path');
const express = require('express');
const db = require('./db');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Helper: query a single workshop with live seat count
const getWorkshopByIdStmt = db.prepare(`
  SELECT
    w.id,
    w.title,
    w.room,
    w.capacity,
    (w.capacity - COUNT(b.id)) AS available_seats
  FROM workshops w
  LEFT JOIN bookings b ON b.workshop_id = w.id
  WHERE w.id = ?
  GROUP BY w.id
`);

// Helper: query all workshops with live seat counts
const getAllWorkshopsStmt = db.prepare(`
  SELECT
    w.id,
    w.title,
    w.room,
    w.capacity,
    (w.capacity - COUNT(b.id)) AS available_seats
  FROM workshops w
  LEFT JOIN bookings b ON b.workshop_id = w.id
  GROUP BY w.id
  ORDER BY w.id ASC
`);

const insertBookingStmt = db.prepare(`
  INSERT INTO bookings (reference, workshop_id, student_name)
  VALUES (?, ?, ?)
`);

// Atomic transaction for the last-seat rule (BEGIN IMMEDIATE locks writes)
const createBookingTransaction = db.transaction((workshopId, cleanName) => {
  const workshop = getWorkshopByIdStmt.get(workshopId);

  if (!workshop) {
    return { status: 404, body: { error: 'Workshop not found.' } };
  }

  if (workshop.available_seats <= 0) {
    return { status: 409, body: { error: 'This workshop is full.' } };
  }

  const reference = 'BK-' + crypto.randomBytes(3).toString('hex').toUpperCase();
  insertBookingStmt.run(reference, workshopId, cleanName);

  return {
    status: 201,
    body: {
      message: 'Seat booked successfully.',
      booking: {
        reference,
        workshopId,
        studentName: cleanName,
      },
      available_seats: workshop.available_seats - 1,
    },
  };
});

// 1. GET /api/workshops
app.get('/api/workshops', (req, res) => {
  try {
    const workshops = getAllWorkshopsStmt.all();
    res.status(200).json(workshops);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load workshops.' });
  }
});

// 2. POST /api/workshops/:id/bookings
app.post('/api/workshops/:id/bookings', (req, res) => {
  const workshopId = Number(req.params.id);
  if (!Number.isInteger(workshopId) || workshopId <= 0) {
    return res.status(400).json({ error: 'Invalid workshop ID.' });
  }

  const { studentName } = req.body || {};
  if (typeof studentName !== 'string' || studentName.trim().length === 0) {
    return res.status(400).json({ error: 'Student name is required.' });
  }

  const cleanName = studentName.trim();

  try {
    const result = createBookingTransaction.immediate(workshopId, cleanName);
    return res.status(result.status).json(result.body);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to process booking.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
