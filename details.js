const API_KEY = "802e9fa9e93104eec9cf1a368c676d89";
const BASE_URL = "https://api.themoviedb.org/3";
const IMG_URL = "https://image.tmdb.org/t/p/original";

document.addEventListener("DOMContentLoaded", () => {
    // الحصول على ID الفيلم من الرابط
    const urlParams = new URLSearchParams(window.location.search);
    const movieId = urlParams.get('id');

    if (movieId) {
        fetchMovieDetails(movieId);
    }
});

async function fetchMovieDetails(id) {
    try {
        // طلب بيانات الفيلم + طاقم العمل في وقت واحد
        const [movieRes, creditsRes] = await Promise.all([
            fetch(`${BASE_URL}/movie/${id}?api_key=${API_KEY}`),
            fetch(`${BASE_URL}/movie/${id}/credits?api_key=${API_KEY}`)
        ]);

        const movie = await movieRes.json();
        const credits = await creditsRes.json();

        renderDetails(movie, credits);
    } catch (error) {
        console.error("Error:", error);
    }
}

function renderDetails(movie, credits) {
    const container = document.getElementById("movieDetails");
    const director = credits.crew.find(person => person.job === "Director");
    const cast = credits.cast.slice(0, 8); // أول 8 ممثلين

    container.innerHTML = `
        <div class="hero-section" style="background-image: url('${IMG_URL + movie.backdrop_path}')">
            <div class="hero-overlay"></div>
            <div class="hero-content">
                <img src="${IMG_URL + movie.poster_path}" class="detail-poster">
                <div class="info">
                    <h1 style="font-size: 3.5rem; margin-bottom: 10px;">${movie.title}</h1>
                    <div style="display: flex; gap: 10px; margin-bottom: 20px;">
                        <span class="info-tag">⭐ ${movie.vote_average.toFixed(1)}</span>
                        <span class="info-tag">${movie.release_date.split('-')[0]}</span>
                        <span class="info-tag">${movie.runtime} min</span>
                    </div>
                    <p style="font-size: 1.1rem; max-width: 700px; line-height: 1.8;">${movie.overview}</p>
                    <div style="margin-top: 20px;">
                        <strong>Director:</strong> <span style="color: #e50914;">${director ? director.name : 'N/A'}</span>
                    </div>
                </div>
            </div>
        </div>

        <div class="main-content">
            <h2 class="section-title">🎭 Top Cast</h2>
            <div class="cast-grid">
                ${cast.map(person => `
                    <div class="cast-card">
                        <img src="${person.profile_path ? IMG_URL + person.profile_path : 'https://via.placeholder.com/100x100?text=No+Image'}" class="cast-img">
                        <p style="margin-top: 10px; font-weight: bold; font-size: 0.9em;">${person.name}</p>
                        <p style="font-size: 0.8em; opacity: 0.6;">${person.character}</p>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}