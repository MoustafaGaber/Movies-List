///////////navbar/////////////

  function adjustBodyPadding() {
    const navbar = document.querySelector(".navbar");
    document.body.style.paddingTop = navbar.offsetHeight + "px";
  }

  window.addEventListener("load", adjustBodyPadding);
  window.addEventListener("resize", adjustBodyPadding);



////////////////////////



class MovieExpLoader {
    constructor() {
        this.API_KEY = "802e9fa9e93104eec9cf1a368c676d89";
        this.BASE_URL = "https://api.themoviedb.org/3";
        this.IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";
        this.FALLBACK_IMAGE = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjgwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDI4MCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyODAiIGhlaWdodD0iMzAwIiBmaWxsPSIjMzMzIi8+Cjx0ZXh0IHg9IjE0MCIgeT0iMTUwIiBmaWxsPSIjNjY2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+Tm8gSW1hZ2U8L3RleHQ+Cjwvc3ZnPg==";

        this.genres = {};
        this.watchlist = JSON.parse(localStorage.getItem("myWatchlist")) || [];
        this.currentFilter = { genre: "", year: "", sort: "" };
        this.currentPage = 1;
        this.isLoadingMore = false;
        this.currentTheme = localStorage.getItem("theme") || "dark";

        this.init();
    }

    async init() {
        this.applyTheme();
        this.updateWatchlistCount();
        this.setupEventListeners();
        await this.loadGenres();
        this.setupYearFilter();
        
        await this.loadInitialMovies();
        this.setupInfiniteScroll();
    }

    setupEventListeners() {
        const searchInput = document.getElementById("searchInput");
        let searchTimeout;

        searchInput?.addEventListener("input", (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => this.handleSearch(e.target.value.trim()), 500);
        });

        document.getElementById("genreFilter")?.addEventListener("change", () => this.handelFilterChange());
        document.getElementById("yearFilter")?.addEventListener("change", () => this.handelFilterChange());
        document.getElementById("sortFilter")?.addEventListener("change", () => this.handelFilterChange());
        document.getElementById("clearBtn")?.addEventListener("click", () => this.clearAllFilter());
        document.getElementById("themeToggle")?.addEventListener("click", () => this.toggleTheme());
        //document.getElementById("watchListNavBtn")?.addEventListener("click", () => this.showWatchlist());
        
        document.getElementById("trendingPrev")?.addEventListener("click", () => this.scrollcarousel("prev"));
        document.getElementById("trendingNext")?.addEventListener("click", () => this.scrollcarousel("next"));

        // غلق المودال
        document.querySelector(".close-modal")?.addEventListener("click", () => {
            document.getElementById("trailerModal").style.display = "none";
            document.getElementById("videoContainer").innerHTML = "";
        });
    }

    // --- الدوال الأساسية لجلب البيانات ---
    async loadGenres() {
        try {
            const res = await fetch(`${this.BASE_URL}/genre/movie/list?api_key=${this.API_KEY}`);
            const data = await res.json();
            this.genres = data.genres.reduce((acc, g) => ({ ...acc, [g.id]: g.name }), {});
            const select = document.getElementById("genreFilter");
            data.genres.forEach(g => {
                const opt = document.createElement("option");
                opt.value = g.id; opt.textContent = g.name;
                select.appendChild(opt);
            });
        } catch (e) { console.error(e); }
    }

    setupYearFilter() {
        const select = document.getElementById("yearFilter");
        if (!select) return;
        for (let y = new Date().getFullYear(); y >= 1990; y--) {
            const opt = document.createElement("option");
            opt.value = y; opt.textContent = y;
            select.appendChild(opt);
        }
    }

    // داخل الكلاس المسؤول عن صفحة Movies
async loadInitialMovies() {
    this.loader().on();
    try {
        // الحصول على السنة الحالية ديناميكياً
        const currentYear = new Date().getFullYear(); 
        
        // الرابط يركز على أفلام السنة الحالية + ترتيب حسب تاريخ الإصدار التنازلي
        const url = `${this.BASE_URL}/discover/movie?api_key=${this.API_KEY}` +
                    `&primary_release_year=${currentYear}` +
                    `&sort_by=primary_release_date.desc` + 
                    `&vote_count.gte=50` + // لضمان ظهور أفلام حقيقية ولها تقييمات
                    `&page=${this.currentPage}`;

        const res = await fetch(url);
        const data = await res.json();
        
        // تغيير عنوان القسم ليعبر عن المحتوى
        const titleEl = document.getElementById("sectionTitle");
        if(titleEl) titleEl.textContent = `🆕 New Releases ${currentYear}`;

        this.displayMovies(data.results, "moviesGrid");
    } catch (e) {
        console.error("Error loading new releases:", e);
    } finally {
        this.loader().off();
    }
}
    

    // --- نظام البحث والفلترة المطور ---
    async handleSearch(query) {
        this.currentPage = 1;

        const sectionTitle = document.getElementById("randomSectionTitle");

        if (!query) {
            this.clearAllFilter();
            return;
        }

        document.getElementById("clearBtn")?.classList.add("show");
        sectionTitle.textContent = `🔍 Search Results: "${query}"`;

        try {
            let url = `${this.BASE_URL}/search/movie?api_key=${this.API_KEY}&query=${encodeURIComponent(query)}&page=1`;
            if (this.currentFilter.year) url += `&primary_release_year=${this.currentFilter.year}`;
            
            const res = await fetch(url);
            const data = await res.json();
            this.displayMovies(data.results, "moviesGrid");
        } catch (e) { console.error(e); }
    }

    async handelFilterChange() {
        this.currentPage = 1;
        this.currentFilter = {
            genre: document.getElementById("genreFilter").value,
            year: document.getElementById("yearFilter").value,
            sort: document.getElementById("sortFilter").value
        };

        const query = document.getElementById("searchInput").value.trim();
        if (query) {
            this.handleSearch(query);
        } else {
            // document.getElementById("trendingSection").style.display = (this.currentFilter.genre || this.currentFilter.year) ? "none" : "block";
            this.loadFilterMovies();
        }
        document.getElementById("clearBtn")?.classList.add("show");
    }

    async loadFilterMovies() {
        let url = `${this.BASE_URL}/discover/movie?api_key=${this.API_KEY}&page=1`;
        if (this.currentFilter.genre) url += `&with_genres=${this.currentFilter.genre}`;
        if (this.currentFilter.year) url += `&primary_release_year=${this.currentFilter.year}`;
        if (this.currentFilter.sort) url += `&sort_by=${this.currentFilter.sort}`;
        
        try {
            const res = await fetch(url);
            const data = await res.json();
            this.displayMovies(data.results, "moviesGrid");
        } catch (e) { console.error(e); }
    }

    // --- نظام التمرير اللانهائي ---
    setupInfiniteScroll() {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && !this.isLoadingMore) {
                const isWatchlist = document.getElementById("randomSectionTitle").textContent.includes("Watchlist");
                if (!isWatchlist) this.loadMoreMovies();
            }
        }, { threshold: 0.1 });

        const sentinel = document.createElement('div');
        sentinel.id = 'infinite-scroll-sentinel';
        document.querySelector('.main-content').appendChild(sentinel);
        observer.observe(sentinel);
    }

    async loadMoreMovies() {
        this.isLoadingMore = true;
        this.currentPage++;
        try {
            let url = "";
            const query = document.getElementById("searchInput").value.trim();
            if (query) {
                url = `${this.BASE_URL}/search/movie?api_key=${this.API_KEY}&query=${encodeURIComponent(query)}&page=${this.currentPage}`;
            } else {
                url = `${this.BASE_URL}/discover/movie?api_key=${this.API_KEY}&page=${this.currentPage}`;
                if (this.currentFilter.genre) url += `&with_genres=${this.currentFilter.genre}`;
                if (this.currentFilter.year) url += `&primary_release_year=${this.currentFilter.year}`;
                if (this.currentFilter.sort) url += `&sort_by=${this.currentFilter.sort}`;
            }

            const res = await fetch(url);
            const data = await res.json();
if (data.results.length > 0) {
    const filteredMovies = data.results.filter(movie => {
        if (!movie.release_date) return false;
        return Number(movie.release_date.slice(0, 4)) >= 2025;
    });

    const newHTML = filteredMovies
        .map(m => this.createMovieCard(m))
        .join("");

    document
        .getElementById("moviesGrid")
        .insertAdjacentHTML("beforeend", newHTML);
}
        } catch (e) { console.error(e); }
        this.isLoadingMore = false;
    }

    // --- نظام التريلر والمفضلات والثيم ---
    async watchTrailer(movieId) {
        try {
            const res = await fetch(`${this.BASE_URL}/movie/${movieId}/videos?api_key=${this.API_KEY}`);
            const data = await res.json();
            const trailer = data.results.find(v => v.type === 'Trailer' && v.site === 'YouTube');
            if (trailer) {
                document.getElementById("videoContainer").innerHTML = `<iframe src="https://www.youtube.com/embed/${trailer.key}?autoplay=1" allowfullscreen allow="autoplay"></iframe>`;
                document.getElementById("trailerModal").style.display = "block";
            } else { alert("No trailer found"); }
        } catch (e) { console.error(e); }
    }

    // toggleWatchlist(movieObj, btn) {
    //     const idx = this.watchlist.findIndex(m => m.id === movieObj.id);
    //     if (idx === -1) {
    //         this.watchlist.push(movieObj);
    //         btn.innerHTML = "❤️"; btn.classList.add("active");
    //     } else {
    //         this.watchlist.splice(idx, 1);
    //         btn.innerHTML = "🤍"; btn.classList.remove("active");
    //         if (document.getElementById("randomSectionTitle").textContent.includes("Watchlist")) this.showWatchlist();
    //     }
    //     localStorage.setItem("myWatchlist", JSON.stringify(this.watchlist));
    //     this.updateWatchlistCount();
    // }
    toggleWatchlist(movieObj, btn) {
    const idx = this.watchlist.findIndex(m => m.id === movieObj.id);
    
    if (idx === -1) {
        // حالة الإضافة
        this.watchlist.push(movieObj);
        btn.innerHTML = "❤️"; 
        btn.classList.add("active");
        this.showToast(`Added "${movieObj.title}" to watchlist`, "success");
    } else {
        // حالة الحذف
        this.watchlist.splice(idx, 1);
        btn.innerHTML = "🤍"; 
        btn.classList.remove("active");
        this.showToast(`Removed "${movieObj.title}"`, "info");
        
        // إذا كان المستخدم حالياً يشاهد صفحة المفضلات، نقوم بتحديث الشاشة فوراً
        // const sectionTitle = document.getElementById("randomSectionTitle")?.textContent;
        // if (sectionTitle && sectionTitle.includes("Watchlist")) {
        //     this.showWatchlist();
        // }
    }
    
    // حفظ التعديلات وتحديث العداد في الهيدر
    localStorage.setItem("myWatchlist", JSON.stringify(this.watchlist));
    this.updateWatchlistCount();
}

    updateWatchlistCount() {
        const el = document.getElementById("watchlistCount");
        if (el) el.textContent = ` ${this.watchlist.length}`;
    }

    // showWatchlist() {
    //     const trendingSection = document.getElementById("trendingSection");
    // const sectionTitle = document.getElementById("randomSectionTitle");
    // const clearBtn = document.getElementById("clearBtn");

    // // إخفاء التريندينج
    // if (trendingSection) trendingSection.style.display = "none";
    
    // // تغيير العنوان وإظهار زر العودة (Clear All سيعمل كزر عودة)
    // if (sectionTitle) sectionTitle.textContent = "❤️ My Watchlist";
    // if (clearBtn) clearBtn.classList.add("show");

    // this.displayMovies(this.watchlist, "moviesGrid");
    // }

    toggleTheme() {
        this.currentTheme = this.currentTheme === "dark" ? "light" : "dark";
        localStorage.setItem("theme", this.currentTheme);
        this.applyTheme();
    }

    applyTheme() {
        document.documentElement.setAttribute("data-theme", this.currentTheme);
        const btn = document.getElementById("themeToggle");
        if (btn) btn.textContent = this.currentTheme === "dark" ? "☀️" : "🌙";
    }

    // --- دوال المساعدة للرسم (Rendering) ---
displayMovies(movies, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // 🔹 Filter movies released in 2025 or later
    const filteredMovies = movies.filter(movie => {
        if (!movie.release_date) return false;
        const year = new Date(movie.release_date).getFullYear();
        return year >= 2025;
    });

    if (filteredMovies.length === 0) {
        container.innerHTML = "<h2>No Movies Found</h2>";
        return;
    }

    container.innerHTML = filteredMovies
        .map(m => this.createMovieCard(m))
        .join("");
}

createMovieCard(movie) {
        const releaseYear = movie.release_date
        ? Number(movie.release_date.slice(0, 4))
        : 0;

    if (releaseYear < 2025) return "";

    const isNew = releaseYear === 2025
        ? '<span class="new-badge">NEW</span>'
        : '';

    const isAdded = this.watchlist.some(m => m.id === movie.id);
    const movieData = JSON.stringify(movie).replace(/"/g, "&quot;");
    const poster = movie.poster_path
        ? this.IMAGE_BASE_URL + movie.poster_path
        : this.FALLBACK_IMAGE;

        return `
            <div class="movie-card" onclick="location.href='details.html?id=${movie.id}'">
                ${isNew} <button class="watchlist-btn ...">...</button>
                <button class="watchlist-btn ${isAdded ? 'active' : ''}" onclick=" event.stopPropagation(); window.movieApp.toggleWatchlist(${movieData}, this)">${isAdded ? '❤️' : '🤍'}</button>
                <button class="watchlist-btn ${isAdded ? 'active' : ''}" onclick="event.stopPropagation(); window.movieApp.toggleWatchlist(${movieData}, this)">${isAdded ? '❤️' : '🤍'}</button>
                <img src="${poster}" class="movie-poster" />
                <div class="movie-info">
                    <div class="movie-title">${movie.title}</div>
                    <div class="movie-details"><span>⭐ ${movie.vote_average.toFixed(1)}</span></div>
                    <button class="play-trailer-btn" onclick="window.movieApp.watchTrailer(${movie.id})">▶ Watch Trailer</button>
                </div>
            </div>`;
}

//   createTrendingCard(movie, rank) {
//         const isAdded = this.watchlist.some(m => m.id === movie.id);
//         const movieData = JSON.stringify(movie).replace(/"/g, "&quot;");
//         const poster = movie.poster_path ? this.IMAGE_BASE_URL + movie.poster_path : this.FALLBACK_IMAGE;
    
//         return `
//             <div class="trending-card">
//                 <button class="watchlist-btn ${isAdded ? 'active' : ''}" onclick=" event.stopPropagation(); window.movieApp.toggleWatchlist(${movieData}, this)">${isAdded ? '❤️' : '🤍'}</button>
//                 <img src="${poster}" class="movie-poster" />
//                 <div class="trending-rank">#${rank}</div>
//                 <div class="trending-overlay">
//                     <div class="trending-title">${movie.title}</div>
//                     <button class="play-trailer-btn" onclick="window.movieApp.watchTrailer(${movie.id})">▶ Watch Trailer</button>
//                 </div>
//             </div>`;
//     }
    // createTrendingCard(movie, rank) {
    //     const isAdded = this.watchlist.some(m => m.id === movie.id);
    //     const movieData = JSON.stringify(movie).replace(/"/g, "&quot;");
    //     const poster = movie.poster_path ? this.IMAGE_BASE_URL + movie.poster_path : this.FALLBACK_IMAGE;
    
    //     return `
    //         <div class="trending-card">
    //             <button class="watchlist-btn ${isAdded ? 'active' : ''}" onclick="event.stopPropagation(); window.movieApp.toggleWatchlist(${movieData}, this)">${isAdded ? '❤️' : '🤍'}</button>
    //             <img src="${poster}" class="movie-poster" />
    //             <div class="trending-rank">#${rank}</div>
    //             <div class="trending-overlay">
    //                 <div class="trending-title">${movie.title}</div>
    //                 <button class="play-trailer-btn" onclick="window.movieApp.watchTrailer(${movie.id})">▶ Watch Trailer</button>
    //             </div>
    //         </div>`;
    // }

    clearAllFilter() {
        const trendingSection = document.getElementById("trendingSection");
    const sectionTitle = document.getElementById("randomSectionTitle");
    const clearBtn = document.getElementById("clearBtn");

    // إعادة ضبط الحقول والفلاتر والصفحات
    document.getElementById("searchInput").value = "";
    document.getElementById("genreFilter").value = "";
    document.getElementById("yearFilter").value = "";
    this.currentFilter = { genre: "", year: "", sort: "" };
    this.currentPage = 1;

    // إخفاء زر Clear All وإعادة إظهار الهوم
    clearBtn.classList.remove("show");
    if (trendingSection) trendingSection.style.display = "block";
    if (sectionTitle) sectionTitle.textContent = "Latest Release";

    this.loadInitialMovies(); // جلب أفلام الهوم العشوائية
    }

    scrollcarousel(dir) {
        const c = document.getElementById("trendingCarousel");
        c.scrollBy({ left: dir === "prev" ? -320 : 320, behavior: "smooth" });
    }

    showToast(message, type = "success") {
    // إنشاء حاوية التنبيهات إذا لم تكن موجودة
    let container = document.querySelector(".toast-container");
    if (!container) {
        container = document.createElement("div");
        container.className = "toast-container";
        document.body.appendChild(container);
    }

    // إنشاء رسالة التنبيه
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.innerHTML = `
        <span>${type === "success" ? "✅" : "❌"}</span>
        <span>${message}</span>
    `;

    container.appendChild(toast);

    // حذف الرسالة من الـ DOM بعد انتهاء الأنميشن (3 ثوانٍ)
    setTimeout(() => {
        toast.remove();
    }, 3000);
}
 // داخل كلاس MovieExpLoader
loader() {
    const spinner = document.getElementById("loader");
    const loadingText = document.querySelectorAll(".loading"); // لإخفاء نصوص التحميل القديمة

    return {
        on: () => {
            spinner?.classList.add("active");
            loadingText.forEach(el => el.style.display = "block");
        },
        off: () => {
            spinner?.classList.remove("active");
            loadingText.forEach(el => el.style.display = "none");
        }
    };
}



}

window.movieApp = new MovieExpLoader();