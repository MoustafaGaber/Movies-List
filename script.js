const API_BASE_URL = "https://api.themoviedb.org/3";
const API_KEY =
  "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI4MDJlOWZhOWU5MzEwNGVlYzljZjFhMzY4YzY3NmQ4OSIsIm5iZiI6MTc0MDMzMTc4My4xOTIsInN1YiI6IjY3YmI1YjA3YTRiZjFjMTkyOGJlZTNlYSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.QbFt85KEDPix8Bba3ccPNnON_V7jf2eeg-ldTmaSJ3Q";

const errorMessage = document.getElementById("errorMessage");
const API_OPTIONS = {
  method: "GET",
  headers: {
    accept: "application/json",
    Authorization: `Bearer ${API_KEY}`,
  },
};

let movieList = [];

const fetchMovies = async (query = "") => {
  try {
    loader().on();
    // بناء رابط الـ API مع إضافة الـ API key
    const endpoint = query
      ? `${API_BASE_URL}/search/movie?query=${encodeURIComponent(query)}`
      : `${API_BASE_URL}/discover/movie?sort_by=popularity.desc`;

    const response = await fetch(endpoint, API_OPTIONS);

    if (!response.ok) {
      throw new Error("Failed to fetch movies");
    }

    const data = await response.json();
    movieList = data.results || [];
    console.log(movieList);
    if (movieList.length === 0) {
      errorMessage.textContent = "No movies found for the given search.";
    } else {
      errorMessage.textContent = ""; // مسح رسالة الخطأ إذا كانت موجودة
    }

    displayMovies();
  } catch (error) {
    console.error(`Error fetching movies: ${error}`);

    errorMessage.textContent =
      "An error occurred while fetching movies. Please try again later.";
  } finally {
    setTimeout(() => {
      loader().off();
    }, 1000);
  }
};
// fetchMovies().then(() => {
//   console.log("Movies in then:", movieList);
//   displayMovies();
// });

const displayMovies = () => {
  const moviesContainer = document.getElementById("movies-container");
  moviesContainer.innerHTML = ""; // مسح المحتوى الحالي

  movieList.forEach((movie) => {
    const {
      title,
      poster_path,
      vote_average,
      original_language,
      release_date,
    } = movie;

    const liItem = document.createElement("li");
    const movieCard = document.createElement("div");
    movieCard.classList.add("movie-card");

    movieCard.innerHTML = `
 
              <img  src="${poster_path 
            ? `https://image.tmdb.org/t/p/w500${poster_path}`
            : 'images/no-movie.png' 
                 }" alt="${title} Poster" />
              <div class="info">
                <h3>${title}</h3>  

                <div class="content">
                  <div class="rating">
                    <img src="images/star.svg" alt="Star Icon" />
                    <p>${vote_average ? vote_average.toFixed(1) : "N/A"}</p>
                  </div>
                  <span>•</span>
                    <p class="lang">${original_language}</p>

                  <span>•</span>
                <p class="year">${
                  release_date ? release_date.split("-")[0] : "N/A"
                }</p>
                </div>
              </div>
           
    `;
    liItem.appendChild(movieCard); // إضافة كارت الفيلم إلى عنصر القائمة
    moviesContainer.appendChild(liItem);
  });
};

// fetchMovies().then(() =>{
//     displayMovies();
// });
const loader = () => {
  const spinner = document.getElementById("loader");
  return {
    //methods object
    on: function () {
      spinner?.classList.add("active");
    },
    //shorthand of off: function()
    off() {
      spinner?.classList.remove("active");
    },
  };
};
// const changeHandler = async (event) => {
//   const query = event.target.value.trim();
//   await fetchMovies(query);
//   displayMovies();
// }
// const searchInput = document.getElementById("searchInput");
// searchInput.addEventListener("change", changeHandler);

// دالة لتأخير التنفيذ (Debounce)
function debounce(func, delay) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

const changeHandler = async (event) => {
  const query = event.target.value.trim();
  const searchTitle = document.getElementById("all-movies");
  searchTitle.textContent = query
    ? `Search Results for "${query}"`
    : "All Movies";
  

  // لا تبحث إذا كان النص فارغاً أو أقل من 3 أحرف (اختياري)
  if (query.length < 3) {
    if (query === "") {
        await fetchMovies(); // استدعاء بدون فلتر لجلب الكل
       
      }
     return;
  }
 
       
  try {
    await fetchMovies(query);
  } catch (error) {
    console.error("خطأ في جلب البيانات:", error);
  } finally {
  }
};

const searchInput = document.getElementById("searchInput");

// استخدام 'input' مع debounce لجعل البحث سلساً
searchInput.addEventListener("input", debounce(changeHandler, 300));

await fetchMovies();
