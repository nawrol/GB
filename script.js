const API_KEY = "f3c7ed02b7e08d0364bd2eb4f56ab2a5";
const BASE_URL = "https://v3.football.api-sports.io";

document.addEventListener('click', function(e) {
  if (e.target.closest('api-sports-widget')) {
    setTimeout(() => {
      const fixtureId = document.querySelector('[data-fixture]')?.getAttribute('data-fixture') || 
                       document.querySelector('.api-sports-active')?.getAttribute('data-id');
      if (fixtureId) loadMatchModal(fixtureId);
    }, 400);
  }
});

async function loadMatchModal(fixtureId) {
  const modalBody = document.getElementById('modalBody');
  const modal = new bootstrap.Modal(document.getElementById('matchModal'));
  
  modalBody.innerHTML = `<div class="text-center py-5"><div class="spinner-border text-success"></div><p>Ładowanie...</p></div>`;
  modal.show();

  try {
    const [fixtureRes, oddsRes, predRes] = await Promise.all([
      fetch(`${BASE_URL}/fixtures?id=${fixtureId}`, { headers: {"x-rapidapi-key": API_KEY} }),
      fetch(`${BASE_URL}/odds?fixture=${fixtureId}`, { headers: {"x-rapidapi-key": API_KEY} }),
      fetch(`${BASE_URL}/predictions?fixture=${fixtureId}`, { headers: {"x-rapidapi-key": API_KEY} })
    ]);

    const fixture = await fixtureRes.json();
    const odds = await oddsRes.json();
    const pred = await predRes.json();

    renderModal(fixture, odds, pred);
  } catch (err) {
    modalBody.innerHTML = `<div class="alert alert-danger m-3">Błąd ładowania danych.</div>`;
  }
}

function renderModal(fixtureData, oddsData, predData) {
  // ... (kod renderujący mecz + oddsy + predykcje)
  // Mogę rozwinąć w następnej wiadomości jeśli chcesz pełną wersję
  document.getElementById('modalBody').innerHTML = `<pre>${JSON.stringify({fixtureData, oddsData, predData}, null, 2)}</pre>`;
}
