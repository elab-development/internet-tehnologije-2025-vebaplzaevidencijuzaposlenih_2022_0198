export default function CalendarPage() {
  return (
    <main>
      <h1 className="h1">Calendar</h1>
      <p className="h2">Pregled aktivnosti tokom radne nedelje (pon–pet).</p>

      <div className="card" style={{ marginTop: 16 }}>
        <p className="muted">
          Sledeće ovde pravimo week-view grid + dugmad Prev/Next week + aktivnosti.
        </p>
      </div>
    </main>
  );
}
