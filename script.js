const API_KEY = "f3c7ed02b7e08d0364bd2eb4f56ab2a5";
const BASE_URL = "https://v3.football.api-sports.io";

let currentFixtureId = null;

// Nasłuchujemy kliknięć w widget (działa z modalem widgetu)
document.addEventListener('click', function(e) {
  const gameRow = e.target.closest('.api-sports-game-row, [data-fixture]');
  if (gameRow) {
    currentFixtureId = gameRow.getAttribute('data-fixture') || 
                       gameRow.querySelector('[data-fixture]')?.getAttribute('data-fixture');
    
    if (currentFixtureId) {
      setTimeout(() => loadMatchWithOdds(currentFixtureId), 200);
    }
  }
});

async function loadMatchWithOdds(fixtureId) {
  const modal = new bootstrap.Modal(document.getElementById('matchModal'));
  const modalBody = document.getElementById('modalBody');
  
  modalBody.innerHTML = `
    <div class="text-center py-5">
      <div class="spinner-border text-success" role="status"></div>
      <p class="mt-3">Ładowanie szczegółów i kursów...</p>
    </div>`;
  modal.show();

  try {
    const [fixtureRes, oddsRes] = await Promise.all([
      fetch(`${BASE_URL}/fixtures?id=${fixtureId}`, {
        headers: { "x-rapidapi-key": API_KEY, "x-rapidapi-host": "v3.football.api-sports.io" }
      }),
      fetch(`${BASE_URL}/odds?fixture=${fixtureId}&bookmakers=all`, {
        headers: { "x-rapidapi-key": API_KEY, "x-rapidapi-host": "v3.football.api-sports.io" }
      })
    ]);

    const fixtureData = await fixtureRes.json();
    const oddsData = await oddsRes.json();

    renderModalContent(fixtureData, oddsData);
  } catch (error) {
    console.error(error);
    modalBody.innerHTML = `<div class="alert alert-danger m-3">Błąd podczas pobierania danych.</div>`;
  }
}

function renderModalContent(fixtureData, oddsData) {
  const f = fixtureData.response[0];
  const match = f.fixture;
  const teams = f.teams;
  const league = f.league;
  const oddsResponse = oddsData.response || [];

  let html = `
    <div class="p-3">
      <div class="text-center mb-4">
        <h4 class="mb-1">${teams.home.name} <span class="text-success">—</span> ${teams.away.name}</h4>
        <p class="text-muted">${new Date(match.date).toLocaleString('pl-PL')}</p>
        <p class="mb-0">${league.name} • ${match.venue?.name || 'Brak informacji o stadionie'}</p>
      </div>`;

  // Sekcja kursów
  html += `<h5 class="mt-4 mb-3 border-bottom border-success pb-2">Kursy bukmacherskie (1X2)</h5>`;

  if (oddsResponse.length === 0) {
    html += `<p class="text-warning">Brak dostępnych kursów dla tego meczu w tej chwili.</p>`;
  } else {
    oddsResponse.forEach(bookmaker => {
      const bet = bookmaker.bets?.find(b => 
        b.name === "Match Winner" || b.name === "1X2" || b.name.includes("Winner")
      );
      
      if (bet && bet.values && bet.values.length >= 3) {
        html += `
          <div class="card bg-secondary border-0 mb-3">
            <div class="card-header py-2">${bookmaker.name}</div>
            <div class="card-body py-3">
              <div class="row text-center">
                <div class="col">
                  <strong>${teams.home.name}</strong><br>
                  <span class="fs-4 text-success">${bet.values[0].odd}</span>
                </div>
                <div class="col">
                  Remis<br>
                  <span class="fs-4 text-success">${bet.values[1].odd}</span>
                </div>
                <div class="col">
                  <strong>${teams.away.name}</strong><br>
                  <span class="fs-4 text-success">${bet.values[2].odd}</span>
                </div>
              </div>
            </div>
          </div>`;
      }
    });
  }

  html += `</div>`;
  document.getElementById('modalBody').innerHTML = html;
}
