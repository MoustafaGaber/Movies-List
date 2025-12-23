

/////////////sign up

document.addEventListener("DOMContentLoaded", () => {
  const user = JSON.parse(localStorage.getItem("signupUser"));

  if (user && user.username) {
    document.getElementById("usernameDisplay").textContent = user.username;
  }
});






class KidsMovieExplorer {
    constructor() {
        this.API_KEY = "802e9fa9e93104eec9cf1a368c676d89";
        this.BASE_URL = "https://api.themoviedb.org/3";
        this.IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";
        
        // معرفات الأنميشن (16) والعائلي (10751)
        this.KIDS_GENRES = "16,10751"; 
        this.currentPage = 1;
        this.isLoading = false;
        this.watchlist = JSON.parse(localStorage.getItem("myWatchlist")) || [];

        this.init();
    }

    async init() {
        this.applyTheme();
        this.setupThemeToggle(); //
        this.updateWatchlistCount();
        await this.loadKidsMovies();
        this.setupInfiniteScroll();
        this.setupSearch();
         this.setupModalClose();
    }

    // 1. جلب أفلام الأطفال من الـ API
    async loadKidsMovies(isMore = false) {
        if (this.isLoading) return;
        this.isLoading = true;
        this.toggleLoader(true);

        try {
            // نستخدم معامل include_adult=false لضمان الأمان
            const url = `${this.BASE_URL}/discover/movie?api_key=${this.API_KEY}&with_genres=${this.KIDS_GENRES}&page=${this.currentPage}&sort_by=popularity.desc&include_adult=false`;
            const res = await fetch(url);
            const data = await res.json();
            
            this.renderMovies(data.results, isMore);
        } catch (e) {
            console.error("خطأ في جلب بيانات الأطفال:", e);
        } finally {
            this.isLoading = false;
            this.toggleLoader(false);
        }
    }

    // 2. عرض الأفلام في الشبكة (Grid)
    renderMovies(movies, isMore) {
        const grid = document.getElementById("moviesGrid"); // نستخدم نفس الـ ID لتوحيد الـ CSS
        if (!grid) return;

        const html = movies.map(m => this.createMovieCard(m)).join("");
        
        if (isMore) {
            grid.insertAdjacentHTML('beforeend', html);
        } else {
            grid.innerHTML = html;
        }
    }

    // 3. بناء الكارد (بنفس هيكل صفحة Movies ليعمل الـ CSS)
    createMovieCard(movie) {
            // 1. استخراج السنة من تاريخ الإصدار (مثلاً من "2025-12-20" نأخذ "2025")
    const releaseYear = movie.release_date ? movie.release_date.split('-')[0] : '';
    
    // 2. الحصول على السنة الحالية ديناميكياً
    const currentYear = new Date().getFullYear().toString();
    
    // 3. التحقق: إذا كانت السنة متطابقة، ننشئ شارة NEW
    const newBadge = (releaseYear === currentYear) ? `<span class="new-badge">NEW</span>` : "";
        const isAdded = this.watchlist.some(m => m.id === movie.id);
        const movieData = JSON.stringify(movie).replace(/"/g, "&quot;");
        const poster = movie.poster_path ? this.IMAGE_BASE_URL + movie.poster_path : 'https://via.placeholder.com/500x750?text=No+Image';
        
         return `
            <div class="movie-card" onclick="location.href='details.html?id=${movie.id}'">
             ${newBadge}
            <button class="watchlist-btn ...">...</button>
                <button class="watchlist-btn ${isAdded ? 'active' : ''}" 
                        onclick=" event.stopPropagation(); kidsApp.toggleWatchlist(${movieData}, this)">
                        ${isAdded ? '❤️' : '🤍'}
                </button>
                <img src="${poster}" class="movie-poster" />
                <div class="movie-info">
                    <div class="movie-title">${movie.title}</div>
                    <div class="movie-details">
                        <span>⭐ ${movie.vote_average.toFixed(1)}</span>
                        <span style="color: #e50914; font-weight:bold;">KIDS</span>
                    </div>
                    <button class="play-trailer-btn" onclick="event.stopPropagation(); kidsApp.watchTrailer(${movie.id})">▶ Watch Trailer</button>
                </div>
            </div>`;
    }

    // 4. البحث المخصص للأطفال فقط
    setupSearch() {
        const searchInput = document.getElementById("searchInput");
        let timeout;
        searchInput?.addEventListener("input", (e) => {
            clearTimeout(timeout);
            timeout = setTimeout(async () => {
                const query = e.target.value.trim();
                if (query === "") {
                    this.currentPage = 1;
                    this.loadKidsMovies();
                    return;
                }
                // البحث مع فلترة النتائج لتكون أنميشن أو عائلي فقط
                const url = `${this.BASE_URL}/search/movie?api_key=${this.API_KEY}&query=${encodeURIComponent(query)}&include_adult=false`;
                const res = await fetch(url);
                const data = await res.json();
                const filtered = data.results.filter(m => 
                    m.genre_ids.includes(16) || m.genre_ids.includes(10751)
                );
                this.renderMovies(filtered, false);
            }, 500);
        });
    }

    // --- وظائف مساعدة (نفس منطق مشروعك العام) ---

    setupInfiniteScroll() {
        window.onscroll = () => {
            if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 800 && !this.isLoading) {
                this.currentPage++;
                this.loadKidsMovies(true);
            }
        };
    }

    toggleWatchlist(movieObj, btn) {
        const idx = this.watchlist.findIndex(m => m.id === movieObj.id);
        if (idx === -1) {
            this.watchlist.push(movieObj);
            btn.innerHTML = "❤️"; btn.classList.add("active");
        } else {
            this.watchlist.splice(idx, 1);
            btn.innerHTML = "🤍"; btn.classList.remove("active");
        }
        localStorage.setItem("myWatchlist", JSON.stringify(this.watchlist));
        this.updateWatchlistCount();
    }

    async watchTrailer(movieId) {
        const res = await fetch(`${this.BASE_URL}/movie/${movieId}/videos?api_key=${this.API_KEY}`);
        const data = await res.json();
        const trailer = data.results.find(v => v.type === 'Trailer');
        if (trailer) {
            document.getElementById("videoContainer").innerHTML = `<iframe src="https://www.youtube.com/embed/${trailer.key}?autoplay=1" allowfullscreen></iframe>`;
            document.getElementById("trailerModal").style.display = "block";
        }
    }

    updateWatchlistCount() {
        const el = document.getElementById("watchlistCount");
        if (el) el.textContent = ` ${this.watchlist.length}`;
    }

   // دالة لتطبيق الثيم المحفوظ عند تحميل الصفحة
applyTheme() {
    const savedTheme = localStorage.getItem("theme") || "dark";
    document.documentElement.setAttribute("data-theme", savedTheme);
    const btn = document.getElementById("themeToggle");
    if (btn) btn.textContent = savedTheme === "dark" ? "☀️" : "🌙";
}

// دالة تفعيل زر التبديل (هذا الجزء هو الذي كان ينقصك)
setupThemeToggle() {
    const btn = document.getElementById("themeToggle");
    btn?.addEventListener("click", () => {
        let currentTheme = document.documentElement.getAttribute("data-theme");
        let newTheme = currentTheme === "dark" ? "light" : "dark";
        
        // حفظ وتطبيق الثيم الجديد
        document.documentElement.setAttribute("data-theme", newTheme);
        localStorage.setItem("theme", newTheme);
        
        // تغيير شكل الزر
        btn.textContent = newTheme === "dark" ? "☀️" : "🌙";
    });
}

    toggleLoader(show) {
        const loader = document.getElementById("loader");
        if (loader) loader.classList.toggle("active", show);
    }
    setupModalClose() {
    const modal = document.getElementById("trailerModal");
    const closeBtn = document.querySelector(".close-modal");
    const videoContainer = document.getElementById("videoContainer");

    // إغلاق عند الضغط على زر X
    closeBtn?.addEventListener("click", () => {
        modal.style.display = "none";
        videoContainer.innerHTML = ""; // مهم جداً لإيقاف صوت الفيديو
    });

    // إغلاق عند الضغط خارج نافذة الفيديو
    window.addEventListener("click", (event) => {
        if (event.target === modal) {
            modal.style.display = "none";
            videoContainer.innerHTML = "";
        }
    });
}
}

// تشغيل الكلاس وربطه بـ window ليعمل الـ onclick
window.kidsApp = new KidsMovieExplorer();