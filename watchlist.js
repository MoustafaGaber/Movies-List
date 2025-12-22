



///////////navbar/////////////

  function adjustBodyPadding() {
    const navbar = document.querySelector(".navbar");
    document.body.style.paddingTop = navbar.offsetHeight + "px";
  }

  window.addEventListener("load", adjustBodyPadding);
  window.addEventListener("resize", adjustBodyPadding);















// دالة لتفعيل الثيم فور تحميل الصفحة
function initTheme() {
    const themeBtn = document.getElementById("themeToggle");
    const htmlElement = document.documentElement;

    // 1. جلب الثيم المحفوظ من الصفحة الرئيسية
    const savedTheme = localStorage.getItem("theme") || "dark";
    htmlElement.setAttribute("data-theme", savedTheme);
    themeBtn.innerHTML = savedTheme === "dark" ? "☀️" : "🌙";

    // 2. منطق الضغط على الزر
    themeBtn.addEventListener("click", () => {
        const currentTheme = htmlElement.getAttribute("data-theme");
        const newTheme = currentTheme === "dark" ? "light" : "dark";

        // تطبيق وحفظ الثيم الجديد
        htmlElement.setAttribute("data-theme", newTheme);
        localStorage.setItem("theme", newTheme);
        themeBtn.innerHTML = newTheme === "dark" ? "☀️" : "🌙";
    });

}

// تأكد من استدعاء الدالة عند تشغيل الصفحة
document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    loadWatchlist();
    updateWatchlistCount(); // استدعاء دالة عرض الأفلام الموجودة عندك مسبقاً
});



// نفس الإعدادات الأساسية للصور والتريلر
const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";
const API_KEY = "802e9fa9e93104eec9cf1a368c676d89";

function loadWatchlist() {
    const watchlist = JSON.parse(localStorage.getItem("myWatchlist")) || [];
    const grid = document.getElementById("watchlistGrid");

    if (watchlist.length === 0) {
        grid.innerHTML = "<h2>Your watchlist is empty!</h2>";
        return;
    }

    grid.innerHTML = watchlist.map(movie => `
        <div class="movie-card">
            <button class="watchlist-btn active" onclick="removeFromWatchlist(${movie.id})">❤️</button>
            <img src="${IMAGE_BASE_URL + movie.poster_path}" class="movie-poster" />
            <div class="movie-info">
                <div class="movie-title">${movie.title}</div>
                <button class="play-trailer-btn" onclick="watchTrailer(${movie.id})">▶ Watch Trailer</button>
            </div>
        </div>
    `).join("");
}

// دالة الحذف من المفضلات
function removeFromWatchlist(movieId) {
    let watchlist = JSON.parse(localStorage.getItem("myWatchlist")) || [];
    // العثور على اسم الفيلم قبل حذفه لعرضه في التنبيه
    const movie = watchlist.find(m => m.id === movieId);
    const movieTitle = movie ? movie.title : "Movie";

    watchlist = watchlist.filter(m => m.id !== movieId);
    localStorage.setItem("myWatchlist", JSON.stringify(watchlist));
    
    // استدعاء التنبيه
    showToast(`Removed "${movieTitle}" from watchlist`, "info");
    
    // إعادة تحميل القائمة
    loadWatchlist();
}

// دالة تشغيل التريلر (نفس المنطق القديم)
async function watchTrailer(movieId) {
    const res = await fetch(`https://api.themoviedb.org/3/movie/${movieId}/videos?api_key=${API_KEY}`);
    const data = await res.json();
    const trailer = data.results.find(v => v.type === 'Trailer');
    if (trailer) {
        document.getElementById("videoContainer").innerHTML = `<iframe src="https://www.youtube.com/embed/${trailer.key}?autoplay=1" allowfullscreen></iframe>`;
        document.getElementById("trailerModal").style.display = "block";
    }
}

// غلق المودال
document.querySelector(".close-modal")?.addEventListener("click", () => {
    document.getElementById("trailerModal").style.display = "none";
    document.getElementById("videoContainer").innerHTML = "";
});



document.addEventListener("DOMContentLoaded", loadWatchlist);

function showToast(message, type = "success") {
    // إنشاء حاوية التنبيهات إذا لم تكن موجودة
    let container = document.getElementById("toastContainer");
    if (!container) {
        container = document.createElement("div");
        container.id = "toastContainer";
        container.className = "toast-container";
        document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = "toast";
    // نستخدم الرمز المناسب حسب النوع
    toast.innerHTML = `<span>${type === "success" ? "✅" : "ℹ️"}</span> <span>${message}</span>`;
    
    container.appendChild(toast);

    // حذف التنبيه بعد 3 ثوانٍ
    setTimeout(() => {
        toast.remove();
    }, 3000);
}