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
        // to load more than 20 movies
        this.currentPage = 1;
        this.isLoadingMore = false;
        this.currentTheme = localStorage.getItem("theme") || "dark";
        this.applyTheme();

        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.loadGenres();
        this.setupYearFilter();
        await this.loadTrendingMovies();
        await this.loadRandomMovies();
        this.updateWatchlistCount();
        this.setupInfiniteScroll();
    }

    setupInfiniteScroll() {
    const options = {
        root: null,
        rootMargin: '100px', // ابدأ التحميل قبل الوصول للنهاية بـ 100 بكسل
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            // إذا كان المستخدم يبحث أو في صفحة المفضلات، لا تفعل التمرير اللانهائي
            const isWatchlist = document.getElementById("randomSectionTitle").textContent.includes("Watchlist");
            
            if (entry.isIntersecting && !this.isSearching && !isWatchlist && !this.isLoadingMore) {
                this.loadMoreMovies();
            }
        });
    }, options);

    // إنشاء عنصر "مراقب" في نهاية الصفحة
    const sentinel = document.createElement('div');
    sentinel.id = 'infinite-scroll-sentinel';
    document.querySelector('.main-content').appendChild(sentinel);
    observer.observe(sentinel);
}

async loadMoreMovies() {
    this.isLoadingMore = true;
    this.currentPage++;
    
    try {
        const response = await fetch(`${this.BASE_URL}/discover/movie?api_key=${this.API_KEY}&page=${this.currentPage}`);
        const data = await response.json();
        
        const container = document.getElementById("moviesGrid");
        // إضافة الأفلام الجديدة بجانب القديمة (استخدام += وليس =)
        const newMoviesHTML = data.results.map(movie => this.createMovieCard(movie)).join("");
        container.insertAdjacentHTML('beforeend', newMoviesHTML);
        
        this.isLoadingMore = false;
    } catch (error) {
        console.error("Error loading more movies:", error);
        this.isLoadingMore = false;
    }
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
            document.querySelector(".close-modal").onclick = () => {
            document.getElementById("trailerModal").style.display = "none";
            document.getElementById("videoContainer").innerHTML = ""; // إيقاف الفيديو عند الغلق
        };
        document.getElementById("themeToggle")?.addEventListener("click", () => this.toggleTheme());
        
    }
async watchTrailer(movieId) {
    try {
        const response = await fetch(`${this.BASE_URL}/movie/${movieId}/videos?api_key=${this.API_KEY}`);
        const data = await response.json();
        
        // البحث عن فيديو من نوع Trailer على Youtube
        const trailer = data.results.find(v => v.type === 'Trailer' && v.site === 'YouTube');
        
        if (trailer) {
            const modal = document.getElementById("trailerModal");
            const container = document.getElementById("videoContainer");
            
            container.innerHTML = `
                <iframe src="https://www.youtube.com/embed/${trailer.key}?autoplay=1" 
                        allowfullscreen allow="autoplay"></iframe>`;
            modal.style.display = "block";
        } else {
            alert("Sorry, no trailer available for this movie.");
        }
    } catch (error) {
        console.error("Error fetching trailer:", error);
    }
}
    

    // --- دالة البحث ---
    async handleSearch(query) {
        const clearBtn = document.getElementById("clearBtn");
        const sectionTitle = document.getElementById("randomSectionTitle");
        const trendingSection = document.getElementById("trendingSection");
        this.currentPage=1;

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
      this.currentPage=1;

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
                    <div class="trending-actions">
                    <button class="play-trailer-btn" onclick="window.movieApp.watchTrailer(${movie.id})">
                        <span>▶</span> Watch Trailer
                    </button>
                </div>
                </div>
                

                

            </div>`;
    }

    // async loadRandomMovies() {
    //     try {
    //         const page = Math.floor(Math.random() * 10) + 1;
    //         const res = await fetch(`${this.BASE_URL}/discover/movie?api_key=${this.API_KEY}&page=${page}`);
    //         const data = await res.json();
    //         this.displayMovies(data.results, "moviesGrid");
    //     } catch (e) { console.error(e); }
    // }

    async loadMoreMovies() {
    // منع إرسال طلبات متعددة في نفس الوقت
    if (this.isLoadingMore) return;

    this.isLoadingMore = true;
    this.currentPage++; // ننتقل للصفحة التالية في الـ API

    try {
      let url = "";
      const query = document.getElementById("searchInput")?.value.trim();

      // 1. حالة البحث اللانهائي (إذا كان هناك نص في مربع البحث)
      if (query) {
        url = `${this.BASE_URL}/search/movie?api_key=${this.API_KEY}&query=${encodeURIComponent(query)}&page=${this.currentPage}`;
        if (this.currentFilter.year) {
          url += `&primary_release_year=${this.currentFilter.year}`;
        }
      } 
      // 2. حالة الفلترة اللانهائية (إذا تم اختيار سنة أو نوع أو ترتيب بدون نص بحث)
      else if (this.currentFilter.genre || this.currentFilter.year || this.currentFilter.sort) {
        url = `${this.BASE_URL}/discover/movie?api_key=${this.API_KEY}&page=${this.currentPage}`;
        if (this.currentFilter.genre) url += `&with_genres=${this.currentFilter.genre}`;
        if (this.currentFilter.year) url += `&primary_release_year=${this.currentFilter.year}`;
        if (this.currentFilter.sort) url += `&sort_by=${this.currentFilter.sort}`;
      } 
      // 3. حالة التصفح العشوائي (عند فتح الموقع لأول مرة)
      else {
        url = `${this.BASE_URL}/discover/movie?api_key=${this.API_KEY}&page=${this.currentPage}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (data.results && data.results.length > 0) {
        const container = document.getElementById("moviesGrid");
        
        let results = data.results;

        // فلترة النوع يدوياً في حالة البحث لأن API البحث لا يدعم genre_id مباشرة
        if (query && this.currentFilter.genre) {
          results = results.filter((movie) =>
            movie.genre_ids.includes(parseInt(this.currentFilter.genre, 10))
          );
        }

        // تحويل الأفلام الجديدة لـ HTML وإضافتها لنهاية الشبكة
        const newMoviesHTML = results.map((movie) => this.createMovieCard(movie)).join("");
        container.insertAdjacentHTML("beforeend", newMoviesHTML);
      } else {
        console.log("وصلت لنهاية الأفلام المتاحة.");
      }

      this.isLoadingMore = false;
    } catch (error) {
      console.error("خطأ أثناء تحميل المزيد من الأفلام:", error);
      this.isLoadingMore = false;
    }
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
                    <div>// أضف هذا الزر داخل الـ HTML المولد في دوال الكروت
                <button class="play-trailer-btn" onclick="window.movieApp.watchTrailer(${movie.id})">
                    ▶ Watch Trailer
                </button></div>
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
     
    this.currentPage = 1;
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
    //themes
    toggleTheme() {
    this.currentTheme = this.currentTheme === "dark" ? "light" : "dark";
    localStorage.setItem("theme", this.currentTheme);
    this.applyTheme();
}

applyTheme() {
    document.documentElement.setAttribute("data-theme", this.currentTheme);
    const themeBtn = document.getElementById("themeToggle");
    if (themeBtn) {
        themeBtn.textContent = this.currentTheme === "dark" ? "☀️" : "🌙";
    }
}
}

// السطر الذي يربط كل شيء بالمتصفح
window.movieApp = new MovieExpLoader();