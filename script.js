const API_KEY = "f3c7ed02b7e08d0364bd2eb4f56ab2a5";
const BASE_URL = "https://v3.football.api-sports.io";

// Pomocnicza funkcja do dzisiejszej daty
function getTodayDate() {
  const today = new Date();
  return today.toISOString().split('T')[0]; // format YYYY-MM-DD
}

async function loadPredictions() {
  const container = document.getElementById('value-bets');
  if (!container) return;

  container.innerHTML = `
    <div class="text-center py-4">
      <div class="spinner-border text-success" role="status"></div>
      <p class="mt-3">Analizujemy predykcje...</p>
    </div>`;

  try {
    // 1. Pobieramy dzisiejsze mecze
    const fixturesRes = await fetch(`${BASE_URL}/fixtures?date=${getTodayDate()}`, {
      headers: {
        "x-rapidapi-key": API_KEY,
        "x-rapidapi-host": "v3.football.api-sports.io"
      }
    });

    const fixturesData = await fixturesRes.json();
    const fixtures = fixturesData.response || [];

    if (fixtures.length === 0) {
      container.innerHTML = `<p class="text-muted text-center">Brak meczów na dzisiaj.</p>`;
      return;
    }

    // 2. Bierzemy max 8-10 meczów z najlepszymi predykcjami
    const predictionsPromises = fixtures.slice(0, 10).map(fixture => 
      fetch(`${BASE_URL}/predictions?fixture=${fixture.fixture.id}`, {
        headers: {
          "x-rapidapi-key": API_KEY,
          "x-rapidapi-host": "v3.football.api-sports.io"
        }
      }).then(res => res.json())
    );

    const predictionsResults = await Promise.all(predictionsPromises);

    let html = `<div class="list-group list-group-flush">`;

    predictionsResults.forEach((predData, index) => {
      const fixture = fixtures[index];
      if (!predData.response || !predData.response[0]) return;

      const pred = predData.response[0];
      const teams = fixture.teams;
      const prediction = pred.predictions;

      const homeWinProb = parseFloat(prediction.home) || 0;
      const awayWinProb = parseFloat(prediction.away) || 0;
      const drawProb = parseFloat(prediction.draw) || 0;

      // Znajdujemy najpewniejszy typ
      let bestTip = '';
      let confidence = 0;

      if (homeWinProb > awayWinProb && homeWinProb > drawProb) {
        bestTip = `${teams.home.name} wygra`;
        confidence = homeWinProb;
      } else if (awayWinProb > homeWinProb && awayWinProb > drawProb) {
        bestTip = `${teams.away.name} wygra`;
        confidence = awayWinProb;
      } else {
        bestTip = "Remis";
        confidence = drawProb;
      }

      const isHighConfidence = confidence > 55;

      html += `
        <div class="list-group-item bg-dark border-success border-0 py-3">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <strong>${teams.home.name}</strong> - <strong>${teams.away.name}</strong>
            </div>
            <span class="badge ${isHighConfidence ? 'bg-success' : 'bg-secondary'}">${confidence.toFixed(0)}%</span>
          </div>
          <div class="mt-2">
            <strong class="text-success">${bestTip}</strong>
          </div>
          ${prediction.advice ? `<small class="text-muted">${prediction.advice}</small>` : ''}
        </div>`;
    });

    html += `</div>`;
    container.innerHTML = html;

  } catch (error) {
    console.error(error);
    container.innerHTML = `<div class="alert alert-danger m-3">Błąd podczas ładowania predykcji.</div>`;
  }
}

// Uruchom po załadowaniu strony
document.addEventListener('DOMContentLoaded', loadPredictions);
