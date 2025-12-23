/**
 * Watchlist Page Logic
 * ميزة البحث الفوري والتحكم في القائمة الخاصة
 */

// الإعدادات الثابتة
const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";
const API_KEY = "802e9fa9e93104eec9cf1a368c676d89";

// 1. إدارة المظهر (Theme) والتنقل عند تحميل الصفحة
document.addEventListener("DOMContentLoaded", () => {
    initTheme();          // تفعيل الثيم المحفوظ
    loadWatchlist();      // تحميل الأفلام
    setupSearch();        // تفعيل ميزة البحث
    adjustBodyPadding();  // ضبط مسافة الهيدر
});

// ضبط مسافة محتوى الصفحة لكي لا يختفي خلف الـ Navbar الثابت
function adjustBodyPadding() {
    const navbar = document.querySelector(".navbar");
    if (navbar) {
        document.body.style.paddingTop = navbar.offsetHeight + "px";
    }
}
window.addEventListener("resize", adjustBodyPadding);

// 2. تفعيل الثيم (الوضع الليلي والنهاري)
function initTheme() {
    const themeBtn = document.getElementById("themeToggle");
    const htmlElement = document.documentElement;
    const savedTheme = localStorage.getItem("theme") || "dark";
    
    htmlElement.setAttribute("data-theme", savedTheme);
    if (themeBtn) themeBtn.innerHTML = savedTheme === "dark" ? "☀️" : "🌙";

    themeBtn?.addEventListener("click", () => {
        const currentTheme = htmlElement.getAttribute("data-theme");
        const newTheme = currentTheme === "dark" ? "light" : "dark";
        htmlElement.setAttribute("data-theme", newTheme);
        localStorage.setItem("theme", newTheme);
        themeBtn.innerHTML = newTheme === "dark" ? "☀️" : "🌙";
    });
}

// 3. منطق البحث داخل المفضلات
function setupSearch() {
    const searchInput = document.getElementById("searchInput");
    searchInput?.addEventListener("input", (e) => {
        const query = e.target.value.toLowerCase().trim();
        const watchlist = JSON.parse(localStorage.getItem("myWatchlist")) || [];
        
        // فلترة القائمة بناءً على الاسم
        const filtered = watchlist.filter(movie => 
            movie.title.toLowerCase().includes(query)
        );
        
        renderMovies(filtered, query);
    });
}

// 4. تحميل وعرض الأفلام
function loadWatchlist() {
    const watchlist = JSON.parse(localStorage.getItem("myWatchlist")) || [];
    renderMovies(watchlist);
    updateWatchlistCount();
}

function renderMovies(movies, query = "") {
    const grid = document.getElementById("watchlistGrid");
    if (!grid) return;

    if (movies.length === 0) {
        grid.innerHTML = query 
            ? `<h2 class="no-results">No matches found for "${query}"</h2>`
            : `<h2 class="no-results">Your private collection is empty!</h2>`;
        return;
    }

    // الحصول على السنة الحالية
    const currentYear = new Date().getFullYear().toString();

    grid.innerHTML = movies.map(movie => {
        // 1. منطق البادج الجديد
        const releaseYear = movie.release_date ? movie.release_date.split('-')[0] : '';
        const newBadge = (releaseYear === currentYear) ? `<span class="new-badge">NEW</span>` : "";

        // 2. بناء الكارد
        return `
            <div class="movie-card" onclick="location.href='details.html?id=${movie.id}'">
                ${newBadge}
                <button class="watchlist-btn active" onclick=" event.stopPropagation(); removeFromWatchlist(${movie.id})">❤️</button>
                <button class="watchlist-btn active" onclick="event.stopPropagation(); removeFromWatchlist(${movie.id})">❤️</button>
                <img src="${movie.poster_path ? IMAGE_BASE_URL + movie.poster_path : 'image.png'}" class="movie-poster" />
                <div class="movie-info">
                    <div class="movie-title">${movie.title}</div>
                    <div class="movie-details">
                        <span>⭐ ${movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'}</span>
                        <span style="margin-left:10px; opacity:0.7;">${releaseYear}</span>
                    </div>
                    <button class="play-trailer-btn" onclick="watchTrailer(${movie.id})">▶ Watch Trailer</button>
                </div>
            </div>
        `;
    }).join("");
}

// 5. حذف فيلم من القائمة
function removeFromWatchlist(movieId) {
    let watchlist = JSON.parse(localStorage.getItem("myWatchlist")) || [];
    const movie = watchlist.find(m => m.id === movieId);
    
    watchlist = watchlist.filter(m => m.id !== movieId);
    localStorage.setItem("myWatchlist", JSON.stringify(watchlist));
    
    showToast(`Removed "${movie ? movie.title : 'Movie'}" from collection`, "info");
    
    // إعادة تحميل القائمة مع مراعاة إذا كان هناك نص في خانة البحث
    const query = document.getElementById("searchInput")?.value.toLowerCase().trim() || "";
    if (query) {
        const filtered = watchlist.filter(m => m.title.toLowerCase().includes(query));
        renderMovies(filtered, query);
    } else {
        loadWatchlist();
    }
}

// 6. تشغيل التريلر
async function watchTrailer(movieId) {
    try {
        const res = await fetch(`https://api.themoviedb.org/3/movie/${movieId}/videos?api_key=${API_KEY}`);
        const data = await res.json();
        const trailer = data.results.find(v => v.type === 'Trailer' && v.site === 'YouTube');
        
        if (trailer) {
            document.getElementById("videoContainer").innerHTML = 
                `<iframe src="https://www.youtube.com/embed/${trailer.key}?autoplay=1" allowfullscreen allow="autoplay"></iframe>`;
            document.getElementById("trailerModal").style.display = "block";
        } else {
            showToast("Trailer not available", "info");
        }
    } catch (error) {
        console.error("Error fetching trailer:", error);
    }
}

// إغلاق المودال
document.querySelector(".close-modal")?.addEventListener("click", () => {
    document.getElementById("trailerModal").style.display = "none";
    document.getElementById("videoContainer").innerHTML = "";
});

// 7. تحديث عداد الأفلام
function updateWatchlistCount() {
    const watchlist = JSON.parse(localStorage.getItem("myWatchlist")) || [];
    const el = document.getElementById("watchlistCount");
    if (el) el.textContent = ` ${watchlist.length}`;
}

// 8. نظام التنبيهات (Toast)
function showToast(message, type = "success") {
    let container = document.querySelector(".toast-container");
    if (!container) {
        container = document.createElement("div");
        container.className = "toast-container";
        document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = "toast";
    toast.style.borderLeft = type === "success" ? "4px solid #2ecc71" : "4px solid #e50914";
    toast.innerHTML = `<span>${type === "success" ? "✅" : "ℹ️"}</span> <span>${message}</span>`;
    
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}