const API_KEY = "f3c7ed02b7e08d0364bd2eb4f56ab2a5";
const BASE_URL = "https://v3.football.api-sports.io";

let currentFixtureId = null;

document.addEventListener('click', function(e) {
  const gameRow = e.target.closest('.api-sports-game-row, [data-fixture-id], [data-id]');
  if (gameRow) {
    currentFixtureId = gameRow.getAttribute('data-fixture') || 
                       gameRow.getAttribute('data-fixture-id') || 
                       gameRow.getAttribute('data-id');
    
    if (currentFixtureId) {
      setTimeout(() => loadMatchWithOdds(currentFixtureId), 300);
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
    const headers = {
      "x-rapidapi-key": API_KEY,
      "x-rapidapi-host": "v3.football.api-sports.io"
    };

    const [fixtureRes, oddsRes] = await Promise.all([
      fetch(`${BASE_URL}/fixtures?id=${fixtureId}`, { headers }),
      fetch(`${BASE_URL}/odds?fixture=${fixtureId}`, { headers })   // uprościliśmy
    ]);

    const fixtureData = await fixtureRes.json();
    const oddsData = await oddsRes.json();

    renderModalContent(fixtureData, oddsData);
  } catch (error) {
    console.error(error);
    modalBody.innerHTML = `<div class="alert alert-danger m-3">Błąd ładowania danych (sprawdź konsolę F12).</div>`;
  }
}

function renderModalContent(fixtureData, oddsData) {
  const f = fixtureData.response[0];
  if (!f) {
    document.getElementById('modalBody').innerHTML = `<div class="alert alert-warning m-3">Nie znaleziono meczu.</div>`;
    return;
  }

  const match = f.fixture;
  const teams = f.teams;
  const league = f.league;
  const oddsResponse = oddsData.response || [];

  let html = `
    <div class="p-4">
      <div class="text-center mb-4">
        <h4>${teams.home.name} <span class="text-success">vs</span> ${teams.away.name}</h4>
        <p class="text-muted">${new Date(match.date).toLocaleString('pl-PL')}</p>
        <p>${league.name} • ${match.venue?.name || ''}</p>
      </div>

      <h5 class="mb-3">Kursy bukmacherskie (1X2)</h5>`;

  if (oddsResponse.length === 0) {
    html += `<p class="text-warning">Brak kursów dla tego meczu w tej chwili.</p>`;
  } else {
    oddsResponse.forEach(bm => {
      const bet = bm.bets?.find(b => b.name === "Match Winner" || b.name === "1X2");
      if (bet && bet.values?.length >= 3) {
        html += `
          <div class="card bg-secondary mb-3 border-0">
            <div class="card-header">${bm.name}</div>
            <div class="card-body">
              <div class="d-flex justify-content-around text-center">
                <div>
                  <strong>${teams.home.name}</strong><br>
                  <span class="fs-3 text-success">${bet.values[0].odd}</span>
                </div>
                <div>
                  Remis<br>
                  <span class="fs-3 text-success">${bet.values[1].odd}</span>
                </div>
                <div>
                  <strong>${teams.away.name}</strong><br>
                  <span class="fs-3 text-success">${bet.values[2].odd}</span>
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
