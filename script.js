const API_KEY = "f3c7ed02b7e08d0364bd2eb4f56ab2a5";
const BASE_URL = "https://v3.football.api-sports.io";

document.addEventListener('click', function(e) {
  const gameRow = e.target.closest('.api-sports-game-row, [data-fixture]');
  if (gameRow) {
    const fixtureId = gameRow.getAttribute('data-fixture') || 
                      gameRow.querySelector('[data-fixture]')?.getAttribute('data-fixture');
    if (fixtureId) {
      setTimeout(() => loadMatchWithOdds(fixtureId), 250);
    }
  }
});

async function loadMatchWithOdds(fixtureId) {
  const modal = new bootstrap.Modal(document.getElementById('matchModal'));
  const modalBody = document.getElementById('modalBody');
  
  modalBody.innerHTML = `
    <div class="text-center py-5">
      <div class="spinner-border text-success" role="status"></div>
      <p class="mt-3">Ładowanie szczegółów i wszystkich kursów...</p>
    </div>`;
  modal.show();

  try {
    const [fixtureRes, oddsRes] = await Promise.all([
      fetch(`${BASE_URL}/fixtures?id=${fixtureId}`, {
        headers: { "x-rapidapi-key": API_KEY }
      }),
      fetch(`${BASE_URL}/odds?fixture=${fixtureId}`, {
        headers: { "x-rapidapi-key": API_KEY }
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
  const teams = f.teams;
  const match = f.fixture;
  const league = f.league;
  const bookmakers = oddsData.response?.[0]?.bookmakers || [];

  let html = `
    <div class="p-4">
      <div class="text-center mb-4">
        <h4>${teams.home.name} <span class="text-success">vs</span> ${teams.away.name}</h4>
        <p class="text-muted">${new Date(match.date).toLocaleString('pl-PL')}</p>
        <p>${league.name} • ${match.venue?.name || ''}</p>
      </div>`;

  if (bookmakers.length === 0) {
    html += `<p class="text-warning">Brak kursów dla tego meczu w tej chwili.</p>`;
  } else {
    bookmakers.forEach(bm => {
      html += `<div class="card mb-4"><div class="card-header">${bm.name}</div><div class="card-body">`;
      
      bm.bets.forEach(bet => {
        html += `
          <div class="mb-3">
            <h6 class="mb-2">${bet.name}</h6>
            <div class="d-flex flex-wrap gap-3 justify-content-center">`;
        
        bet.values.forEach(value => {
          html += `
            <div class="text-center">
              <strong>${value.value}</strong><br>
              <span class="odds-value">${value.odd}</span>
            </div>`;
        });

        html += `</div></div>`;
      });
      
      html += `</div></div>`;
    });
  }

  html += `</div>`;
  document.getElementById('modalBody').innerHTML = html;
}
