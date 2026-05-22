const API_KEY = "f3c7ed02b7e08d0364bd2eb4f56ab2a5";
const BASE_URL = "https://v3.football.api-sports.io";

async function loadValueBets() {
  const container = document.getElementById('value-bets');
  container.innerHTML = `<div class="text-center py-5"><div class="spinner-border text-success" role="status"></div><p>Analizujemy najlepsze typy...</p></div>`;

  try {
    const date = new Date().toISOString().split('T')[0];
    const fixturesRes = await fetch(`${BASE_URL}/fixtures?date=${date}`, {
      headers: { "x-rapidapi-key": API_KEY, "x-rapidapi-host": "v3.football.api-sports.io" }
    });
    const fixturesData = await fixturesRes.json();
    const fixtures = fixturesData.response || [];

    const predPromises = fixtures.slice(0, 10).map(f => 
      fetch(`${BASE_URL}/predictions?fixture=${f.fixture.id}`, {
        headers: { "x-rapidapi-key": API_KEY, "x-rapidapi-host": "v3.football.api-sports.io" }
      }).then(r => r.json())
    );

    const predictions = await Promise.all(predPromises);

    let html = '<div class="list-group list-group-flush">';
    predictions.forEach((predData, i) => {
      const fixture = fixtures[i];
      if (!predData.response?.[0]) return;
      const p = predData.response[0].predictions;
      const teams = fixture.teams;

      let tip = "Remis";
      let prob = parseFloat(p.draw) || 0;
      if (parseFloat(p.home) > prob) { tip = `${teams.home.name} wygra`; prob = parseFloat(p.home); }
      if (parseFloat(p.away) > prob) { tip = `${teams.away.name} wygra`; prob = parseFloat(p.away); }

      html += `
        <div class="list-group-item py-3">
          <div class="d-flex justify-content-between align-items-center">
            <div><strong>${teams.home.name}</strong> – <strong>${teams.away.name}</strong></div>
            <span class="badge bg-success">${prob.toFixed(0)}%</span>
          </div>
          <div class="text-success fw-bold mt-1">${tip}</div>
          ${p.advice ? `<small class="text-muted">${p.advice}</small>` : ''}
        </div>`;
    });
    html += '</div>';
    container.innerHTML = html || '<p class="text-center text-muted py-4">Brak predykcji na dzisiaj</p>';
  } catch (e) {
    console.error(e);
    container.innerHTML = `<div class="alert alert-danger m-3">Błąd ładowania predykcji</div>`;
  }
}

// Kliknięcie w mecz → modal z oddsami + predykcją
document.addEventListener('click', (e) => {
  const row = e.target.closest('.api-sports-game-row, [data-fixture], [data-id]');
  if (row) {
    const fixtureId = row.getAttribute('data-fixture') || row.getAttribute('data-id');
    if (fixtureId) setTimeout(() => loadMatchModal(fixtureId), 300);
  }
});

async function loadMatchModal(fixtureId) {
  const modal = new bootstrap.Modal(document.getElementById('matchModal'));
  const body = document.getElementById('modalBody');
  body.innerHTML = `<div class="text-center py-5"><div class="spinner-border text-success"></div><p>Ładowanie szczegółów i kursów...</p></div>`;
  modal.show();

  try {
    const [fixtureRes, oddsRes, predRes] = await Promise.all([
      fetch(`${BASE_URL}/fixtures?id=${fixtureId}`, { headers: { "x-rapidapi-key": API_KEY } }),
      fetch(`${BASE_URL}/odds?fixture=${fixtureId}`, { headers: { "x-rapidapi-key": API_KEY } }),
      fetch(`${BASE_URL}/predictions?fixture=${fixtureId}`, { headers: { "x-rapidapi-key": API_KEY } })
    ]);

    const f = (await fixtureRes.json()).response[0];
    const oddsData = await oddsRes.json();
    const predData = await predRes.json();

    const teams = f.teams;
    const match = f.fixture;

    let html = `
      <div class="p-4">
        <h4 class="text-center">${teams.home.name} vs ${teams.away.name}</h4>
        <p class="text-center text-muted">${new Date(match.date).toLocaleString('pl-PL')}</p>
        <hr>
        <h5>Kursy bukmacherskie (1X2)</h5>
        <div id="odds-container"></div>
        <h5 class="mt-4">Predykcja API-Sports</h5>
        <div id="pred-container"></div>
      </div>`;

    body.innerHTML = html;

    // Odds
    const oddsHTML = oddsData.response?.[0]?.bookmakers?.map(bm => {
      const bet = bm.bets?.find(b => b.name === "Match Winner" || b.name === "1X2");
      if (!bet?.values?.length) return '';
      return `
        <div class="card bg-secondary mb-3">
          <div class="card-header">${bm.name}</div>
          <div class="card-body d-flex justify-content-around text-center">
            <div><strong>${teams.home.name}</strong><br><span class="fs-4 text-success">${bet.values[0].odd}</span></div>
            <div><strong>Remis</strong><br><span class="fs-4 text-success">${bet.values[1].odd}</span></div>
            <div><strong>${teams.away.name}</strong><br><span class="fs-4 text-success">${bet.values[2].odd}</span></div>
          </div>
        </div>`;
    }).join('') || '<p class="text-muted">Brak kursów w tej chwili</p>';

    document.getElementById('odds-container').innerHTML = oddsHTML;

    // Predykcja
    const p = predData.response?.[0]?.predictions;
    if (p) {
      document.getElementById('pred-container').innerHTML = `
        <div class="alert alert-success">
          Najpewniejszy typ: <strong>${p.advice || '—'}</strong><br>
          Prawdopodobieństwo: Dom ${p.home}% | Remis ${p.draw}% | Wyjazd ${p.away}%
        </div>`;
    }
  } catch (e) {
    body.innerHTML = `<div class="alert alert-danger m-3">Błąd ładowania danych meczu</div>`;
  }
}

// Uruchomienie
document.addEventListener('DOMContentLoaded', () => {
  loadValueBets();

  // Proste przełączanie zakładek (można później rozbudować)
  document.querySelectorAll('#tab-today, #tab-predictions, #tab-standings').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#tab-today, #tab-predictions, #tab-standings').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
});
