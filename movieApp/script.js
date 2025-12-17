class MovieExpLoader {
    constructor() {
        this.API_KEY = '802e9fa9e93104eec9cf1a368c676d89';
        this.BASE_URL = 'https://api.themoviedb.org/3';
        this.IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
        this.FALLBACK_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9Ijc1MCIgdmlld0JveD0iMCAwIDUwMCA3NTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdG09IjUwMCIgaGVpZ2h0PSI3NTAiIGZpbGw9IiMzMzMiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZmlsbD0iI2FhYSIgZm9udC1zaXplPSIzMCIgZm9udC1mYW1pbHk9IkFyaWFsIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+Tk8gSU1BR0U8L3RleHQ+PC9zdmc+';
        this.genres = {};
        this.currentPage = 1;
        this.isSearching = false;
        this.currentFilter={
            genre:"",
            year:"",
            sort:""
        }

    }
    async loadTrendingMovies() {
        try {
            const response = await fetch(`${this.BASE_URL}/trending/movie/week?api_key=${this.API_KEY}`);
            const data = await response.json();

            const trendingMovies = data.results.slice(0,10)// Get top 10 trending movies
            this.dispalyTrendingMovies(trendingMovies);
        } catch (error) {
            console.error('Error fetching trending movies:', error);
            document.getElementById('trendingCarousel').innerHTML = '<div class="error">Failed to load trending movies. Please try again later.</div>';
        }
    }
    dispalyTrendingMovies(movies) {
        const carousel = document.getElementById('trendingCarousel');
        carousel.innerHTML = '';

}
document.addEventListener('DOMContentLoaded', () => {
    const app = new MovieExpLoader();
    
    
});

