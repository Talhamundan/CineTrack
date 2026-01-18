import axios from 'axios';

const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const BASE_URL = "https://api.themoviedb.org/3";

const api = axios.create({
    baseURL: BASE_URL,
    params: {
        api_key: API_KEY,
        language: 'tr-TR'
    }
});

// TÜR ID'lerini İSME ÇEVİRMEK İÇİN SABİT LİSTE
export const GENRES = {
    28: "Aksiyon", 12: "Macera", 16: "Animasyon", 35: "Komedi", 80: "Suç", 99: "Belgesel", 18: "Dram", 10751: "Aile", 14: "Fantastik", 36: "Tarih", 27: "Korku", 10402: "Müzik", 9648: "Gizem", 10749: "Romantik", 878: "Bilim Kurgu", 10770: "TV Filmi", 53: "Gerilim", 10752: "Savaş", 37: "Vahşi Batı", 10759: "Aksiyon & Macera", 10762: "Çocuk", 10763: "Haber", 10764: "Reality", 10765: "Bilim Kurgu & Fantastik", 10766: "Pembe Dizi", 10767: "Talk", 10768: "Savaş & Politik"
};

export const getPopularMovies = async (page = 1) => {
    const response = await api.get('/movie/popular', { params: { page } });
    return response.data.results;
};

export const getPopularTVShows = async (page = 1) => {
    const response = await api.get('/tv/popular', { params: { page } });
    return response.data.results.map(show => ({ ...show, title: show.name, release_date: show.first_air_date }));
};

// --- GÜNCELLENEN FONKSİYON BURASI ---
export const searchContent = async (query, page = 1) => {
    const response = await api.get('/search/multi', { params: { query, page } });

    // SADECE FİLM VE DİZİLERİ DÖNDÜR (OYUNCULAR İPTAL)
    const results = response.data.results.filter(item => item.media_type === 'movie' || item.media_type === 'tv')
        .map(item => ({
            ...item,
            title: item.title || item.name,
            release_date: item.release_date || item.first_air_date,
        }));

    return results;
};

// --- YENİ: SADECE OYUNCU ARAMA ---
export const searchActors = async (query) => {
    const response = await api.get('/search/person', { params: { query } });
    return response.data.results;
};

// --- YENİ: OYUNCU FİLMOGRAFİSİ ---
export const getPersonCredits = async (personId) => {
    const response = await api.get(`/person/${personId}/combined_credits`, { params: { language: 'tr-TR' } });

    // Cast listesini PUANA (vote_average) göre YÜKSEKTEN DÜŞÜĞE sırala
    const cast = response.data.cast
        .filter(credit => credit.poster_path && (credit.media_type === 'movie' || credit.media_type === 'tv'))
        .sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0)) // Puanı yüksek olan en üstte
        .map(item => ({
            ...item,
            title: item.title || item.name,
            release_date: item.release_date || item.first_air_date,
        }));

    return cast;
};

// --- YENİ: OYUNCU DETAYI ---
export const getPersonDetail = async (personId) => {
    const response = await api.get(`/person/${personId}`, { params: { language: 'tr-TR' } });
    return response.data;
};

export const getMovieDetail = async (id) => {
    const response = await api.get(`/movie/${id}`, {
        params: { append_to_response: 'videos,credits', include_video_language: 'tr,en' }
    });
    return response.data;
};

export const getTVDetail = async (id) => {
    const response = await api.get(`/tv/${id}`, {
        params: { append_to_response: 'videos,credits', include_video_language: 'tr,en' }
    });
    return response.data;
};

export const getRecommendations = async (id, type) => {
    const endpoint = type === 'tv' ? `/tv/${id}/recommendations` : `/movie/${id}/recommendations`;
    const response = await api.get(endpoint);
    return response.data.results.map(item => ({
        ...item,
        title: item.title || item.name,
        release_date: item.release_date || item.first_air_date,
        media_type: type
    }));
};

export const getWatchProviders = async (id, type) => {
    const endpoint = type === 'tv' ? `/tv/${id}/watch/providers` : `/movie/${id}/watch/providers`;
    try {
        const response = await api.get(endpoint);
        const trProviders = response.data.results.TR;
        return trProviders?.flatrate || [];
    } catch (error) {
        return [];
    }
};

export const getTrailerKey = async (id, type) => {
    const endpoint = type === 'tv' ? `/tv/${id}/videos` : `/movie/${id}/videos`;
    try {
        let response = await api.get(endpoint, { params: { language: 'tr-TR' } });
        let trailer = response.data.results.find(vid => vid.site === 'YouTube' && vid.type === 'Trailer');

        if (!trailer) {
            response = await api.get(endpoint, { params: { language: 'en-US' } });
            trailer = response.data.results.find(vid => vid.site === 'YouTube' && vid.type === 'Trailer');
        }

        return trailer ? trailer.key : null;
    } catch (error) {
        return null;
    }
};

export const getCredits = async (id, type) => {
    const endpoint = type === 'tv' ? `/tv/${id}/credits` : `/movie/${id}/credits`;
    try {
        const response = await api.get(endpoint);
        return response.data.cast.filter(person => person.profile_path).slice(0, 10);
    } catch (error) {
        return [];
    }
};

export default api;