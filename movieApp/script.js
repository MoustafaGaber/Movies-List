class MovieExpLoader {
  constructor() {
    this.API_KEY = "802e9fa9e93104eec9cf1a368c676d89";
    this.BASE_URL = "https://api.themoviedb.org/3";
    this.IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";
    this.FALLBACK_IMAGE =
      "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjgwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDI4MCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyODAiIGhlaWdodD0iMzAwIiBmaWxsPSIjMzMzIi8+Cjx0ZXh0IHg9IjE0MCIgeT0iMTUwIiBmaWxsPSIjNjY2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+Tm8gSW1hZ2U8L3RleHQ+Cjwvc3ZnPg==";

    this.genres = {};
    this.currentPage = 1;
    this.isSearching = false;
    this.currentFilter = {
      genre: "",
      year: "",
      sort: "",
    };
    this.init();
  }
  async init() {
    this.setupEventListeners();
    await this.loadGenres();
    this.setupYearFilter();

    await this.loadTrendingMovies();
    await this.loadRandomMovies();
  }
  setupEventListeners() {
    const searchInput = document.getElementById("searchInput");
    const genreFilter = document.getElementById("genreFilter");
    const yearFilter = document.getElementById("yearFilter");
    const sortFilter = document.getElementById("sortFilter");
    const clearBtn = document.getElementById("clearBtn");
    const trendingPrev = document.getElementById("trendingPrev");
    const trendingNext = document.getElementById("trendingNext");
    let searchTimeout;

    searchInput.addEventListener("input", (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        this.handleSearch(e.target.value.trim());
      }, 500);
    });

    genreFilter.addEventListener("change", () => this.handelFilterChange());
    yearFilter.addEventListener("change", () => this.handelFilterChange());
    sortFilter.addEventListener("change", () => this.handelFilterChange());
    clearBtn.addEventListener("click", () => this.clearAllFilter());

    trendingPrev.addEventListener("click", () => this.scrollcarousel("prev"));
    trendingNext.addEventListener("click", () => this.scrollcarousel("next"));
  }
  async loadGenres() {
    try {
      const response = await fetch(
        `${this.BASE_URL}/genre/movie/list?api_key=${this.API_KEY}`
      );
      const data = await response.json();
      this.genres = data.genres.reduce((acc, genre) => {
        acc[genre.id] = genre.name;
        return acc;
      }, {});
      const genreSelect = document.getElementById("genreFilter");
      data.genres.forEach((genre) => {
        const option = document.createElement("option");
        option.value = genre.id;
        option.textContent = genre.name;
        genreSelect.appendChild(option);
      });
    } catch (error) {
      console.log("error loading genres:", error);
    }
  }
  setupYearFilter() {
    const yearSelect = document.getElementById("yearFilter");
    const currentYear = new Date().getFullYear();
    for (let year = currentYear; year >= 1990; year--) {
      const option = document.createElement("option");
      option.value = year;
      option.textContent = year;
      yearSelect.appendChild(option);
    }
  }
  async loadTrendingMovies() {
    try {
      const response = await fetch(
        `${this.BASE_URL}/trending/movie/week?api_key=${this.API_KEY}`
      );
      const data = await response.json();

      const trendingMovies = data.results.slice(0, 10); // Get top 10 trending movies
      this.dispalyTrendingMovies(trendingMovies);
    } catch (error) {
      console.error("Error fetching trending movies:", error);
      document.getElementById("trendingCarousel").innerHTML =
        '<div class="error">Failed to load trending movies. Please try again later.</div>';
    }
  }
  dispalyTrendingMovies(movies) {
    const carousel = document.getElementById("trendingCarousel");
    carousel.innerHTML = movies
      .map((movie, index) => this.createTrendingCard(movie, index + 1))
      .join("");
  }
  createTrendingCard(movie, rank) {
    const posterPath = movie.poster_path
      ? `${this.IMAGE_BASE_URL}${movie.poster_path}`
      : this.FALLBACK_IMAGE;
    const rating = movie.vote_average ? movie.vote_average.toFixed(1) : "N/A";
    const year = movie.release_date
      ? new Date(movie.release_date).getFullYear()
      : "N/A";
    const genrres =
      movie.genre_ids && movie.genre_ids.length > 0
        ? movie.genre_ids.map((id) => this.genres[id]).join(", ")
        : "N/A"; // Map genre IDs to names
    return `
        <div class="trending-card">
           <img src="${posterPath}" alt="${movie.title} Poster" class="movie-poster" loading="lazy" onerror="this.src='${this.FALLBACK_IMAGE}'"/>
          <div class="trending-rank">#${rank}</div>
          <div class="trending-overlay">
                <div class="trending-title">${movie.title}</div>
                <div class="trending-details">
                    <span class="trending-year">${year}</span>
                    <span class="trending-genres">${genrres}</span>
                    <span class="trending-rating">⭐ ${rating}</span>
                </div>
          </div>

        </div>
        `;
  }

  async loadRandomMovies() {
    try {
      const randomPage = Math.floor(Math.random() * 10) + 1;
      let url = `${this.BASE_URL}/discover/movie?api_key=${this.API_KEY}&page=${randomPage}`;
      if (this.currentFilter.sort) {
        url += `&sort_by=${this.currentFilter.sort}`;
      }
      if (this.currentFilter.genre) {
        url += `&with_genres=${this.currentFilter.genre}`;
      }
      const response = await fetch(url);
      const data = await response.json();
      this.displayMovies(data.results, "moviesGrid");
    } catch (error) {
      console.log("error load Random Movies ", error);
      document.getElementById(
        "moviesGrid"
      ).innerHTML = `<div class="error" > faild to load random movies. please try again</div>`;
    }
  }
  displayMovies(movies, containerId) {
    const container = document.getElementById(containerId);
    if (movies.length === 0) {
      container.innerHTML = `<div class="no-results">
            <h2>🔍 no movies found </h2>
            <p>try adjusting your search criteria or filters</p>
        </div>`;
      return;
    }
    container.innerHTML = movies
      .map((movie) => this.createMovieCard(movie))
      .join("");
  }

  createMovieCard(movie) {
    const posterPath = movie.poster_path
      ? `${this.IMAGE_BASE_URL}${movie.poster_path}`
      : this.FALLBACK_IMAGE;
    const rating = movie.vote_average ? movie.vote_average.toFixed(1) : "N/A";
    const year = movie.release_date
      ? new Date(movie.release_date).getFullYear()
      : "N/A";
    const description = movie.overview || "no description available";
    const genrres =
      movie.genre_ids && movie.genre_ids.length
        ? movie.genre_ids
            .slice(0, 2)
            .map((id) => this.genres[id])
            .filter(Boolean)
            .join(", ")
        : "N/A"; // Map genre IDs to names
    return `
        <div class="movie-card">
           <img src="${posterPath}" alt="${movie.title} Poster" class="movie-poster" loading="lazy" onerror="this.src='${this.FALLBACK_IMAGE}'"/>
       
          <div class="movie-info">
                <div class="movie-title">${movie.title}</div>
                <div class="movie-details">
                    <span class="movie-year">${year}</span>
                    <span class="movie-genres">${genrres}</span>
                    <span class="movie-rating">⭐ ${rating}</span>
                </div>
                <div class="movie-discription">${description}</div>
          </div>

        </div>
        `;
  }

  async handleSearch(query) {
    const trendingQuery = query.trim();
    const clearBtn = document.getElementById("clearBtn");
    const sectionTitle = document.getElementById("randomSectionTitle");
    const trendingSection = document.getElementById("trendingSection");
    if (trendingQuery === "") {
      this.isSearching = false;
      clearBtn.classList.remove("show");
      sectionTitle.textContent = " 🎲 Random Picks For You";
      trendingSection.style.display = "block";
      await this.loadTrendingMovies();
      return;
    }
    this.isSearching = true;
    clearBtn.classList.add("show");
    sectionTitle.textContent = ` 🔍 Search Results for "${trendingQuery}"`;
    trendingSection.style.display = "none";
    try {
      document.getElementById(
        "moviesGrid"
      ).innerHTML = `<div class="loading">Searching Movies...</div>`;
      let url = `${this.BASE_URL}/search/movie?api_key=${
        this.API_KEY
      }&query=${encodeURIComponent(trendingQuery)}&page=1`;
      if (this.currentFilter.year) {
        url += `&primary_release_year=${this.currentFilter.year}`;
      }
      const response = await fetch(url);
      const data = await response.json();
      let results = data.results;

      if (this.currentFilter.genre) {
        results = results.filter((movie) =>
          movie.genre_ids.includes(parseInt(this.currentFilter.genre, 10))
        );
      }
      if (this.currentFilter.sort) {
        results = this.sortMovies(results, this.currentFilter.sort);
      }
      this.displayMovies(results, "moviesGrid");
    } catch (error) {
      console.log("error Searching Movies ", error);
      document.getElementById(
        "moviesGrid"
      ).innerHTML = `<div class="error" >Search faild. please try again</div>`;
    }
  }
  sortMovies(movies, sortBy) {
    switch (sortBy) {
      case "popularity.desc":
        return movies.sort((a, b) => b.popularity - a.popularity);
      case "vote_average.desc":
        return movies.sort((a, b) => b.vote_average - a.vote_average);
      case "release_date.desc":
        return movies.sort(
          (a, b) => new Date(b.release_date) - new Date(a.release_date)
        );
      case "title.asc":
        return movies.sort((a, b) => a.title.localeCompare(b.title));
      default:
        return movies;
    }
  }
  async handelFilterChange() {
    const searchInput = document.getElementById("searchInput");
    const genreFilter = document.getElementById("genreFilter");
    const yearFilter = document.getElementById("yearFilter");
    const sortFilter = document.getElementById("sortFilter");
    const clearBtn = document.getElementById("clearBtn");
    const trendingSection = document.getElementById("trendingSection");
    this.currentFilter = {
      genre: genreFilter.value,
      year: yearFilter.value,
      sort: sortFilter.value,
    };
    if (
      this.currentFilter.genre ||
      this.currentFilter.year ||
      this.currentFilter.sort ||
      searchInput.value.trim()
    ) {
      clearBtn.classList.add("show");
    } else {
      clearBtn.classList.remove("show");
    }
    if (searchInput.value.trim()) {
      trendingSection.style.display = "none";
      await this.handleSearch(searchInput.value.trim());
    } else {
      if (
        this.currentFilter.genre ||
        this.currentFilter.year ||
        this.currentFilter.sort
      ) {
        trendingSection.style.display = "none";
        document.getElementById("randomSectionTitle").textContent =
          "🎬 Filter movies ";
      } else {
        trendingSection.style.display = "block";
        document.getElementById("randomSectionTitle").textContent =
          "🎬 Discover movies ";
      }
      await this.loadFilterMovies();
    }
  }

  async loadFilterMovies() {
    try {
      document.getElementById(
        "moviesGrid"
      ).innerHTML = `<div class="loading">Loading Filtered Movies...</div>`;
      let url = `${this.BASE_URL}/discover/movie?api_key=${this.API_KEY}&page=1`;

      if (this.currentFilter.genre) {
        url += `&with_genres=${this.currentFilter.genre}`;
      }

      if (this.currentFilter.year) {
        url += `&primary_release_year=${this.currentFilter.year}`;
      }

      if (this.currentFilter.sort) {
        url += `&sort_by=${this.currentFilter.sort}`;
      }
      const response = await fetch(url);
      const data = await response.json();

      this.displayMovies(data.results, "moviesGrid");
    } catch (error) {
      console.log("error loading filtered Movies ", error);
      document.getElementById(
        "moviesGrid"
      ).innerHTML = `<div class="error" >faild to load filtered movies. please try again</div>`;
    }
  }
  clearAllFilter() {
    const trendingSection = document.getElementById("trendingSection");
    document.getElementById("searchInput").value = "";
    document.getElementById("genreFilter").value = "";
    document.getElementById("yearFilter").value = "";
    document.getElementById("sortFilter").value = "";
    document.getElementById("clearBtn").classList.remove("show");
    document.getElementById("randomSectionTitle").textContent =
      "🎬 Discover Movies";
    trendingSection.style.display = "block";
    this.isSearching = false;
    this.loadRandomMovies();
  }
  scrollcarousel(direction) {
    const carousel = document.getElementById("trendingCarousel");
    const scrollAmount = 320;
    if (direction === "prev") {
      carousel.scrollBy({
        left: -scrollAmount,
        behavior: "smooth",
      });
    } else {
      carousel.scrollBy({
        left: scrollAmount,
        behavior: "smooth",
      });
    }
  }
}
document.addEventListener("DOMContentLoaded", () => {
  const app = new MovieExpLoader();
});
