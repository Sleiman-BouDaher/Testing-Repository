PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS workshops (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  room TEXT NOT NULL,
  capacity INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reference TEXT NOT NULL UNIQUE,
  workshop_id INTEGER NOT NULL,
  student_name TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (workshop_id) REFERENCES workshops(id)
);

INSERT OR IGNORE INTO workshops (id, title, room, capacity) VALUES
  (1, 'Podcast Recording', 'Studio A', 2),
  (2, 'Portrait Photography', 'Lab 2', 1),
  (3, 'Digital Illustration', 'Lab 4', 0);
