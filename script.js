const API_KEY = "f3c7ed02b7e08d0364bd2eb4f56ab2a5";
const BASE_URL = "https://v3.football.api-sports.io";

async function loadValueBets() {
  const container = document.getElementById('value-bets');
  container.innerHTML = `<div class="text-center py-5"><div class="spinner-border text-success"></div><p>Analizujemy najlepsze typy...</p></div>`;

  try {
    const date = new Date().toISOString().split('T')[0];
    const res = await fetch(`${BASE_URL}/fixtures?date=${date}`, {
      headers: { "x-rapidapi-key": API_KEY, "x-rapidapi-host": "v3.football.api-sports.io" }
    });
    const data = await res.json();
    const fixtures = data.response || [];

    const predictions = await Promise.all(
      fixtures.slice(0, 12).map(f => 
        fetch(`${BASE_URL}/predictions?fixture=${f.fixture.id}`, {
          headers: { "x-rapidapi-key": API_KEY, "x-rapidapi-host": "v3.football.api-sports.io" }
        }).then(r => r.json())
      )
    );

    let html = '<div class="list-group list-group-flush">';
    
    predictions.forEach((predData, i) => {
      const fixture = fixtures[i];
      if (!predData.response?.[0]) return;
      
      const p = predData.response[0].predictions;
      const teams = fixture.teams;

      let tip = "Remis";
      let prob = parseFloat(p.draw) || 0;
      if (parseFloat(p.home) > prob) { tip = teams.home.name + " wygra"; prob = parseFloat(p.home); }
      if (parseFloat(p.away) > prob) { tip = teams.away.name + " wygra"; prob = parseFloat(p.away); }

      html += `
        <div class="list-group-item py-3">
          <div class="d-flex justify-content-between">
            <div><strong>${teams.home.name}</strong> – <strong>${teams.away.name}</strong></div>
            <span class="badge bg-success">${prob.toFixed(0)}%</span>
          </div>
          <div class="text-success fw-bold">${tip}</div>
          ${p.advice ? `<small class="text-muted">${p.advice}</small>` : ''}
        </div>`;
    });

    html += '</div>';
    container.innerHTML = html || '<p class="text-center text-muted py-4">Brak predykcji na dzisiaj</p>';
  } catch (e) {
    container.innerHTML = `<div class="alert alert-danger m-3">Nie udało się pobrać predykcji</div>`;
  }
}

// Modal z oddsami + predykcjami
async function loadMatchModal(fixtureId) {
  const modal = new bootstrap.Modal(document.getElementById('matchModal'));
  const body = document.getElementById('modalBody');
  body.innerHTML = `<div class="text-center py-5"><div class="spinner-border text-success"></div><p>Ładowanie szczegółów...</p></div>`;
  modal.show();

  try {
    const [fRes, oRes, pRes] = await Promise.all([
      fetch(`${BASE_URL}/fixtures?id=${fixtureId}`, { headers: { "x-rapidapi-key": API_KEY } }),
      fetch(`${BASE_URL}/odds?fixture=${fixtureId}`, { headers: { "x-rapidapi-key": API_KEY } }),
      fetch(`${BASE_URL}/predictions?fixture=${fixtureId}`, { headers: { "x-rapidapi-key": API_KEY } })
    ]);

    const fixture = await fRes.json();
    const odds = await oRes.json();
    const pred = await pRes.json();

    // Tu możesz rozbudować render – na razie ładna podstawowa wersja
    const f = fixture.response[0];
    const teams = f.teams;
    const match = f.fixture;

    let html = `
      <div class="p-4">
        <h4 class="text-center">${teams.home.name} vs ${teams.away.name}</h4>
        <p class="text-center text-muted">${new Date(match.date).toLocaleString('pl-PL')}</p>
        <hr>
        <h5>Kursy bukmacherskie (1X2)</h5>
        <div id="odds-container" class="mb-4"></div>
        <h5>Predykcja API</h5>
        <div id="pred-container"></div>
      </div>`;

    body.innerHTML = html;

    // Odds
    const oddsHTML = odds.response?.[0]?.bookmakers?.map(bm => {
      const bet = bm.bets?.find(b => b.name === "Match Winner" || b.name === "1X2");
      if (!bet) return '';
      return `
        <div class="card bg-secondary mb-2">
          <div class="card-header">${bm.name}</div>
          <div class="card-body d-flex justify-content-around">
            <div class="text-center"><strong>${teams.home.name}</strong><br><span class="fs-4">${bet.values[0].odd}</span></div>
            <div class="text-center"><strong>Remis</strong><br><span class="fs-4">${bet.values[1].odd}</span></div>
            <div class="text-center"><strong>${teams.away.name}</strong><br><span class="fs-4">${bet.values[2].odd}</span></div>
          </div>
        </div>`;
    }).join('') || '<p class="text-muted">Brak kursów w tej chwili</p>';

    document.getElementById('odds-container').innerHTML = oddsHTML;

    // Predykcja
    const pData = pred.response?.[0]?.predictions;
    if (pData) {
      document.getElementById('pred-container').innerHTML = `
        <div class="alert alert-success">
          Najpewniejszy typ: <strong>${pData.advice || 'Brak'}</strong><br>
          Prawdopodobieństwo: Dom ${pData.home}% | Remis ${pData.draw}% | Wyjazd ${pData.away}%
        </div>`;
    }
  } catch (e) {
    body.innerHTML = `<div class="alert alert-danger m-3">Błąd ładowania meczu</div>`;
  }
}

// Kliknięcie w mecz
document.addEventListener('click', (e) => {
  const row = e.target.closest('.api-sports-game-row, [data-fixture]');
  if (row) {
    const fixtureId = row.getAttribute('data-fixture') || row.getAttribute('data-id');
    if (fixtureId) setTimeout(() => loadMatchModal(fixtureId), 300);
  }
});

// Uruchomienie
document.addEventListener('DOMContentLoaded', () => {
  loadValueBets();

  // Proste przełączanie zakładek (można rozbudować)
  document.getElementById('tab-today').addEventListener('click', () => {
    document.querySelectorAll('#tab-today, #tab-predictions, #tab-standings').forEach(b => b.classList.remove('active'));
    document.getElementById('tab-today').classList.add('active');
    document.getElementById('main-header').textContent = 'Dzisiejsze Mecze';
  });
});
