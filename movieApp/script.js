class MovieExpLoader {
    constructor() {
        this.API_KEY = "802e9fa9e93104eec9cf1a368c676d89";
        this.BASE_URL = "https://api.themoviedb.org/3";
        this.IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";
        this.FALLBACK_IMAGE = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjgwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDI4MCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyODAiIGhlaWdodD0iMzAwIiBmaWxsPSIjMzMzIi8+Cjx0ZXh0IHg9IjE0MCIgeT0iMTUwIiBmaWxsPSIjNjY2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+Tm8gSW1hZ2U8L3RleHQ+Cjwvc3ZnPg==";

        this.genres = {};
        this.watchlist = JSON.parse(localStorage.getItem("myWatchlist")) || [];
        this.currentFilter = { genre: "", year: "", sort: "" };
        this.searchTimeout = null;

        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.loadGenres();
        this.setupYearFilter();
        await this.loadTrendingMovies();
        await this.loadRandomMovies();
        this.updateWatchlistCount();
    }

    setupEventListeners() {
        const searchInput = document.getElementById("searchInput");
        const genreFilter = document.getElementById("genreFilter");
        const yearFilter = document.getElementById("yearFilter");
        const sortFilter = document.getElementById("sortFilter");
        const clearBtn = document.getElementById("clearBtn");
        const watchListNavBtn = document.getElementById("watchListNavBtn");

        searchInput?.addEventListener("input", (e) => {
            clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(() => {
                this.handleSearch(e.target.value.trim());
            }, 500);
        });

        genreFilter?.addEventListener("change", () => this.handelFilterChange());
        yearFilter?.addEventListener("change", () => this.handelFilterChange());
        sortFilter?.addEventListener("change", () => this.handelFilterChange());
        clearBtn?.addEventListener("click", () => this.clearAllFilter());

        document.getElementById("trendingPrev")?.addEventListener("click", () => this.scrollcarousel("prev"));
        document.getElementById("trendingNext")?.addEventListener("click", () => this.scrollcarousel("next"));

        if (watchListNavBtn) {
            watchListNavBtn.addEventListener("click", () => this.showWatchlist());
        }
    }

    // --- دالة البحث ---
    async handleSearch(query) {
        const clearBtn = document.getElementById("clearBtn");
        const sectionTitle = document.getElementById("randomSectionTitle");
        const trendingSection = document.getElementById("trendingSection");

        if (!query) {
            clearBtn?.classList.remove("show");
            sectionTitle.textContent = "🎲 Random Picks For You";
            trendingSection.style.display = "block";
            await this.loadRandomMovies();
            return;
        }

        clearBtn?.classList.add("show");
        sectionTitle.textContent = `🔍 Search Results for "${query}"`;
        trendingSection.style.display = "none";

        try {
            document.getElementById("moviesGrid").innerHTML = '<div class="loading">Searching...</div>';
            let url = `${this.BASE_URL}/search/movie?api_key=${this.API_KEY}&query=${encodeURIComponent(query)}&page=1`;
            
            if (this.currentFilter.year) url += `&primary_release_year=${this.currentFilter.year}`;

            const response = await fetch(url);
            const data = await response.json();
            let results = data.results;

            if (this.currentFilter.genre) {
                results = results.filter(m => m.genre_ids.includes(parseInt(this.currentFilter.genre)));
            }
            
            this.displayMovies(results, "moviesGrid");
        } catch (error) {
            console.error("Search error:", error);
        }
    }

    // --- دالة الفلترة ---
    async handelFilterChange() {
    const searchInput = document.getElementById("searchInput");
    const trendingSection = document.getElementById("trendingSection");
    const clearBtn = document.getElementById("clearBtn");

    this.currentFilter = {
        genre: document.getElementById("genreFilter").value,
        year: document.getElementById("yearFilter").value,
        sort: document.getElementById("sortFilter").value
    };

    // إظهار زر Clear All إذا كان هناك بحث أو أي فلتر مختار
    if (this.currentFilter.genre || this.currentFilter.year || this.currentFilter.sort || searchInput.value.trim()) {
        clearBtn?.classList.add("show");
    } else {
        clearBtn?.classList.remove("show");
    }

    if (searchInput.value.trim()) {
        await this.handleSearch(searchInput.value.trim());
    } else {
        // إخفاء التريندينج إذا تم اختيار فلتر (حتى بدون بحث)
        trendingSection.style.display = (this.currentFilter.genre || this.currentFilter.year || this.currentFilter.sort) ? "none" : "block";
        document.getElementById("randomSectionTitle").textContent = (this.currentFilter.genre || this.currentFilter.year) ? "🎬 Filtered Results" : "🎲 Random Picks For You";
        await this.loadFilterMovies();
    }
}

    async loadFilterMovies() {
        try {
            document.getElementById("moviesGrid").innerHTML = '<div class="loading">Filtering...</div>';
            let url = `${this.BASE_URL}/discover/movie?api_key=${this.API_KEY}&page=1`;
            if (this.currentFilter.genre) url += `&with_genres=${this.currentFilter.genre}`;
            if (this.currentFilter.year) url += `&primary_release_year=${this.currentFilter.year}`;
            if (this.currentFilter.sort) url += `&sort_by=${this.currentFilter.sort}`;

            const response = await fetch(url);
            const data = await response.json();
            this.displayMovies(data.results, "moviesGrid");
        } catch (error) {
            console.error("Filter error:", error);
        }
    }

    // --- الدوال الأساسية الأخرى ---
    async loadGenres() {
        try {
            const response = await fetch(`${this.BASE_URL}/genre/movie/list?api_key=${this.API_KEY}`);
            const data = await response.json();
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
        for (let y = new Date().getFullYear(); y >= 1990; y--) {
            const opt = document.createElement("option");
            opt.value = y; opt.textContent = y;
            select.appendChild(opt);
        }
    }

    async loadTrendingMovies() {
        try {
            const res = await fetch(`${this.BASE_URL}/trending/movie/week?api_key=${this.API_KEY}`);
            const data = await res.json();
            const carousel = document.getElementById("trendingCarousel");
            carousel.innerHTML = data.results.slice(0, 10).map((m, i) => this.createTrendingCard(m, i + 1)).join("");
        } catch (e) { console.error(e); }
    }

    createTrendingCard(movie, rank) {
        const isAdded = this.watchlist.some(m => m.id === movie.id);
        const movieData = JSON.stringify(movie).replace(/"/g, "&quot;");
        const poster = movie.poster_path ? this.IMAGE_BASE_URL + movie.poster_path : this.FALLBACK_IMAGE;

        return `
            <div class="trending-card">
                <button class="watchlist-btn ${isAdded ? 'active' : ''}" onclick="window.movieApp.toggleWatchlist(${movieData}, this)">
                    ${isAdded ? '❤️' : '🤍'}
                </button>
                <img src="${poster}" class="movie-poster" />
                <div class="trending-rank">#${rank}</div>
                <div class="trending-overlay">
                    <div class="trending-title">${movie.title}</div>
                    <div class="trending-details">⭐ ${movie.vote_average.toFixed(1)}</div>
                </div>
            </div>`;
    }

    async loadRandomMovies() {
        try {
            const page = Math.floor(Math.random() * 10) + 1;
            const res = await fetch(`${this.BASE_URL}/discover/movie?api_key=${this.API_KEY}&page=${page}`);
            const data = await res.json();
            this.displayMovies(data.results, "moviesGrid");
        } catch (e) { console.error(e); }
    }

    displayMovies(movies, containerId) {
        const container = document.getElementById(containerId);
        if (!movies || movies.length === 0) {
            container.innerHTML = '<div class="no-results"><h2>🔍 No movies found</h2></div>';
            return;
        }
        container.innerHTML = movies.map(m => this.createMovieCard(m)).join("");
    }

    createMovieCard(movie) {
        const isAdded = this.watchlist.some(m => m.id === movie.id);
        const movieData = JSON.stringify(movie).replace(/"/g, "&quot;");
        const poster = movie.poster_path ? this.IMAGE_BASE_URL + movie.poster_path : this.FALLBACK_IMAGE;

        return `
            <div class="movie-card">
                <button class="watchlist-btn ${isAdded ? 'active' : ''}" onclick="window.movieApp.toggleWatchlist(${movieData}, this)">
                    ${isAdded ? '❤️' : '🤍'}
                </button>
                <img src="${poster}" class="movie-poster" />
                <div class="movie-info">
                    <div class="movie-title">${movie.title}</div>
                    <div class="movie-details">
                        <span>${new Date(movie.release_date).getFullYear() || 'N/A'}</span>
                        <span class="movie-rating">⭐ ${movie.vote_average.toFixed(1)}</span>
                    </div>
                </div>
            </div>`;
    }

    toggleWatchlist(movieObj, btnElement) {
        const index = this.watchlist.findIndex(m => m.id === movieObj.id);
        if (index === -1) {
            this.watchlist.push(movieObj);
            btnElement.innerHTML = "❤️";
            btnElement.classList.add("active");
        } else {
            this.watchlist.splice(index, 1);
            btnElement.innerHTML = "🤍";
            btnElement.classList.remove("active");
            if (document.getElementById("randomSectionTitle").textContent.includes("Watchlist")) {
                this.showWatchlist();
            }
        }
        localStorage.setItem("myWatchlist", JSON.stringify(this.watchlist));
        this.updateWatchlistCount();
    }

    updateWatchlistCount() {
        const el = document.getElementById("watchlistCount");
        if (el) el.textContent = ` ${this.watchlist.length}`;
    }

    showWatchlist() {
        document.getElementById("trendingSection").style.display = "none";
        document.getElementById("randomSectionTitle").textContent = "❤️ My Watchlist";
        document.getElementById("clearBtn").classList.add("show");
        this.displayMovies(this.watchlist, "moviesGrid");
    }

    clearAllFilter() {
    const trendingSection = document.getElementById("trendingSection");
    const sectionTitle = document.getElementById("randomSectionTitle");
    const clearBtn = document.getElementById("clearBtn");

    // إعادة ضبط الحقول
    document.getElementById("searchInput").value = "";
    document.getElementById("genreFilter").value = "";
    document.getElementById("yearFilter").value = "";
    document.getElementById("sortFilter").value = "";

    // إعادة ضبط الفلاتر في الكود
    this.currentFilter = { genre: "", year: "", sort: "" };

    // إخفاء زر Clear All
    clearBtn.classList.remove("show");

    // إعادة إظهار الأقسام الأصلية
    trendingSection.style.display = "block";
    sectionTitle.textContent = "🎲 Random Picks For You";

    this.loadRandomMovies();
}

    scrollcarousel(dir) {
        const c = document.getElementById("trendingCarousel");
        c.scrollBy({ left: dir === "prev" ? -320 : 320, behavior: "smooth" });
    }
}

// السطر الذي يربط كل شيء بالمتصفح
window.movieApp = new MovieExpLoader();