const workshopSelect = document.getElementById('workshop-select');
const roomSpan = document.getElementById('workshop-room');
const seatsSpan = document.getElementById('workshop-seats');
const bookingForm = document.getElementById('booking-form');
const studentNameInput = document.getElementById('student-name');
const feedbackDiv = document.getElementById('feedback');

let workshops = [];

function showFeedback(message, isSuccess) {
  feedbackDiv.textContent = message;
  feedbackDiv.className = `feedback ${isSuccess ? 'success' : 'error'}`;
}

function clearFeedback() {
  feedbackDiv.textContent = '';
  feedbackDiv.className = 'feedback';
}

function renderSelectedWorkshop() {
  const selectedId = Number(workshopSelect.value);
  const workshop = workshops.find((w) => w.id === selectedId);
  if (!workshop) return;

  roomSpan.textContent = workshop.room;
  seatsSpan.textContent = `${workshop.available_seats} / ${workshop.capacity}`;
}

function renderDropdown(preserveSelectedId) {
  workshopSelect.innerHTML = '';

  workshops.forEach((w) => {
    const option = document.createElement('option');
    option.value = w.id;
    const statusLabel = w.available_seats > 0 ? `${w.available_seats} left` : 'FULL';
    option.textContent = `${w.title} (${statusLabel})`;
    workshopSelect.appendChild(option);
  });

  if (preserveSelectedId) {
    workshopSelect.value = String(preserveSelectedId);
  }

  renderSelectedWorkshop();
}

async function loadWorkshops(preserveSelectedId = null) {
  try {
    const response = await fetch('/api/workshops');
    if (!response.ok) {
      throw new Error('Could not load workshops.');
    }
    workshops = await response.json();
    renderDropdown(preserveSelectedId);
  } catch (err) {
    showFeedback(err.message, false);
  }
}

workshopSelect.addEventListener('change', () => {
  clearFeedback();
  renderSelectedWorkshop();
});

bookingForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearFeedback();

  const selectedId = Number(workshopSelect.value);
  const studentName = studentNameInput.value;

  try {
    const response = await fetch(`/api/workshops/${selectedId}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentName }),
    });

    const data = await response.json();

    if (!response.ok) {
      // Display the server's exact error message
      showFeedback(data.error || 'Booking failed.', false);
      // Refresh seat counts so the UI reflects reality
      await loadWorkshops(selectedId);
      return;
    }

    // Confirm booking with reference and update live count
    showFeedback(
      `${data.message} Reference: ${data.booking.reference} (Seats left: ${data.available_seats})`,
      true
    );
    studentNameInput.value = '';
    await loadWorkshops(selectedId);
  } catch (err) {
    showFeedback('Network error while trying to book.', false);
  }
});

// Initial load
loadWorkshops();
