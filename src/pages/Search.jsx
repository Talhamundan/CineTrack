import { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { collection, addDoc, query, where, getDocs, onSnapshot, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { getPopularMovies, getPopularTVShows, searchContent, getRecommendations, GENRES } from '../services/api';
import MovieModal from '../components/MovieModal.jsx';
import ContentDetails from '../components/ContentDetails.jsx';
import Header from '../components/Header.jsx';
import toast from 'react-hot-toast';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { createSlug } from '../utils';

function Search() {
  const [content, setContent] = useState([]);
  const [queryText, setQueryText] = useState('');
  const [type, setType] = useState('movie');
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState('');
  const [recommendationMode, setRecommendationMode] = useState(false);
  const [recommendationSource, setRecommendationSource] = useState(null);
  const [myListMap, setMyListMap] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [initialModalData, setInitialModalData] = useState(null);
  const [sortOption, setSortOption] = useState('popularity');

  const user = auth.currentUser;
  const location = useLocation();
  const navigate = useNavigate();

  // --- OYUNCU ARAMASINI YAKALA ---
  useEffect(() => {
    if (location.state?.actorSearch) {
      setQueryText(location.state.actorSearch);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "user_lists"), where("userId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const map = {};
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const key = String(data.tmdbId || data.id);
        map[key] = { docId: doc.id, ...data };
      });
      setMyListMap(map);
    });
    return () => unsubscribe();
  }, [user]);

  const fetchContent = async (pageNum, reset = false) => {
    let newContent = [];
    if (recommendationMode) return;

    if (queryText) {
      newContent = await searchContent(queryText, pageNum);
    } else {
      newContent = type === 'movie' ? await getPopularMovies(pageNum) : await getPopularTVShows(pageNum);
    }
    setContent(prev => reset ? newContent : [...prev, ...newContent]);
    setLoadingMore(false);
  };

  useEffect(() => {
    if (!recommendationMode) {
      setPage(1);
      fetchContent(1, true);
    }
  }, [type, queryText, recommendationMode]);

  const loadMore = () => {
    setLoadingMore(true);
    const nextPage = page + 1;
    setPage(nextPage);
    fetchContent(nextPage, false);
  };

  const getSmartRecommendations = async () => {
    setRecommendationMode(true);
    setQueryText('');
    setContent([]);

    try {
      const q = query(collection(db, "user_lists"), where("userId", "==", user.uid));
      const snapshot = await getDocs(q);
      const myList = snapshot.docs.map(doc => doc.data());

      const candidates = myList.filter(item =>
        (item.type === type || item.media_type === type) &&
        (item.score >= 7 || item.status === 'watching' || item.status === 'completed')
      );

      if (candidates.length === 0) {
        toast.error("Öneri yapabilmem için listene biraz daha sevdiğin içerik eklemelisin.");
        setRecommendationMode(false);
        return;
      }

      const randomItem = candidates[Math.floor(Math.random() * candidates.length)];
      setRecommendationSource(randomItem.title);
      const recs = await getRecommendations(randomItem.tmdbId, type);
      setContent(recs);
      toast.success(`"${randomItem.title}" benzeri öneriler getirildi!`);

    } catch (error) {
      console.error("Öneri hatası:", error);
      toast.error("Öneri getirilirken hata oluştu.");
      setRecommendationMode(false);
    }
  };

  // 1. TÜR FİLTRESİ
  let filteredContent = selectedGenre
    ? content.filter(item => item.genre_ids && item.genre_ids.includes(parseInt(selectedGenre)))
    : [...content];

  // 2. SIRALAMA MANTIĞI
  filteredContent.sort((a, b) => {
    switch (sortOption) {
      case 'vote_desc':
        return (b.vote_average || 0) - (a.vote_average || 0);
      case 'vote_asc':
        return (a.vote_average || 0) - (b.vote_average || 0);
      case 'date_desc':
        return new Date(b.release_date || b.first_air_date || 0) - new Date(a.release_date || a.first_air_date || 0);
      case 'date_asc':
        return new Date(a.release_date || a.first_air_date || 0) - new Date(b.release_date || b.first_air_date || 0);
      case 'name_asc':
        return (a.title || a.name || '').localeCompare(b.title || b.name || '');
      default:
        return 0;
    }
  });

  const openModal = (item) => {
    const existingItem = myListMap[String(item.id)];
    if (existingItem) {
      setSelectedMovie(item);
      setInitialModalData(existingItem);
      setIsModalOpen(true);
    } else {
      setSelectedMovie(item);
      setInitialModalData(null);
      setIsModalOpen(true);
    }
  };

  const saveMovie = async (movieData) => {
    try {
      const tmdbId = movieData.id || movieData.tmdbId;
      const existingItem = myListMap[String(tmdbId)];

      if (existingItem) {
        await updateDoc(doc(db, "user_lists", existingItem.docId), {
          ...movieData,
          updatedAt: new Date()
        });
        toast.success("Liste güncellendi! ✅");
      } else {
        await addDoc(collection(db, "user_lists"), {
          userId: user.uid,
          ...movieData,
          tmdbId: tmdbId,
          addedAt: new Date()
        });
        toast.success("Listeye başarıyla eklendi! 🎉");
      }
    } catch (error) { console.error(error); toast.error("Bir hata oluştu."); }
  };

  return (
    <div className="bg-black min-h-screen text-white pb-20 font-sans">
      <Header />
      <div className="p-8 max-w-[1920px] mx-auto">
        <div className="flex flex-col gap-6 mb-10">
          <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
            <div className="w-full md:w-1/2 relative mx-auto">
              <input type="text" placeholder="Film veya Dizi Ara..." className="w-full bg-gray-900 text-white p-3 pl-10 md:p-5 md:pl-14 rounded-2xl outline-none focus:ring-2 ring-red-600 border border-gray-700 transition text-base md:text-xl shadow-xl placeholder-gray-500" value={queryText} onChange={(e) => { setQueryText(e.target.value); setRecommendationMode(false); }} autoFocus />
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg md:text-2xl md:left-5">🔍</span>
            </div>
            <button onClick={getSmartRecommendations} className={`px-4 py-2 md:px-6 md:py-3 rounded-xl font-bold transition flex items-center gap-2 whitespace-nowrap text-sm md:text-base ${recommendationMode ? 'bg-yellow-500 text-black' : 'bg-gray-800 text-yellow-500 hover:bg-gray-700'}`}><span>✨</span> {recommendationMode ? 'Yeni Öneri' : 'Bana Öneri Ver'}</button>
          </div>
          {!queryText && !recommendationMode && (
            <div className="flex flex-col sm:flex-row justify-center items-center gap-6">
              <div className="bg-gray-900 p-1.5 rounded-full flex border border-gray-800">
                <button onClick={() => setType('movie')} className={`px-8 py-3 rounded-full font-bold text-lg transition ${type === 'movie' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}>Popüler Filmler</button>
                <button onClick={() => setType('tv')} className={`px-8 py-3 rounded-full font-bold text-lg transition ${type === 'tv' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}>Popüler Diziler</button>
              </div>
              <select value={selectedGenre} onChange={(e) => setSelectedGenre(e.target.value)} className="bg-gray-900 text-white px-6 py-4 rounded-xl outline-none border border-gray-700 cursor-pointer hover:border-gray-500 transition text-base">
                <option value="">Tüm Türler</option>
                {Object.entries(GENRES).map(([id, name]) => (<option key={id} value={id}>{name}</option>))}
              </select>
            </div>
          )}
          {recommendationMode && (<div className="bg-yellow-500/10 border border-yellow-500/50 text-yellow-500 p-4 rounded-xl text-center font-bold text-lg">"{recommendationSource}" yapımını sevdiğin için bunları öneriyorum:</div>)}
        </div>

        <div className="flex justify-end mb-4 border-b border-gray-800 pb-2">
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            className="bg-black/50 border border-gray-700 text-sm text-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:border-red-600 transition cursor-pointer"
          >
            <option value="popularity">Önerilen Sıralama</option>
            <option value="vote_desc">IMDb Puanı (Yüksekten Düşüğe)</option>
            <option value="vote_asc">IMDb Puanı (Düşükten Yükseğe)</option>
            <option value="date_desc">Yayın Tarihi (Yeniden Eskiye)</option>
            <option value="date_asc">Yayın Tarihi (Eskiden Yeniye)</option>
            <option value="name_asc">İsim (A-Z)</option>
          </select>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-10">
          {filteredContent.map((item) => {
            const isAdded = !!myListMap[String(item.id)];
            return (
              <div
                key={item.id}
                onClick={() => navigate(`/details/${item.media_type || type}/${createSlug(item.id, item.title || item.name)}`)}
                className={`group relative bg-gray-900 rounded-2xl overflow-hidden shadow-xl hover:shadow-red-900/30 transition-all duration-300 hover:-translate-y-2 cursor-pointer ${isAdded ? 'border-2 border-green-600' : 'border border-transparent'}`}
              >
                <div className="aspect-[2/3] relative">
                  <img src={item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Image'} alt={item.title} className="w-full h-full object-cover" />
                  <div className="absolute top-3 left-3 bg-yellow-500 text-black text-xs font-bold px-3 py-1.5 rounded shadow">★ {item.vote_average ? item.vote_average.toFixed(1) : '?'}</div>
                  {item.original_language === 'tr' && <div className="absolute top-3 right-3 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded shadow">TR</div>}

                  <div className="absolute inset-0 bg-black/95 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-center items-center p-6 text-center">
                    <h3 className="font-bold text-white text-xl mb-2 leading-tight">{item.title || item.name}</h3>
                    <p className="text-red-400 text-xs font-bold uppercase tracking-wider mb-2">{item.genre_ids?.slice(0, 2).map(id => GENRES[id]).join(', ')}</p>
                    {item.overview && <p className="text-gray-400 text-xs line-clamp-3 mb-4 px-1 leading-relaxed">{item.overview}</p>}
                    <div className="mb-4 transform scale-105"><ContentDetails id={item.id} type={item.media_type || type} /></div>
                    {isAdded ? (
                      <button onClick={(e) => { e.stopPropagation(); openModal(item); }} className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 md:px-8 md:py-3 rounded-full font-bold text-xs md:text-lg transition flex items-center justify-center gap-2 shadow-lg group-hover:scale-105"><span className="text-sm md:text-2xl leading-none">✓</span><span>Listende</span></button>
                    ) : (
                      <button onClick={(e) => { e.stopPropagation(); openModal(item); }} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 md:px-8 md:py-3 rounded-full font-bold text-xs md:text-lg transform hover:scale-105 transition flex items-center justify-center gap-2 shadow-lg"><span className="text-sm md:text-2xl leading-none">+</span><span>Listeme Ekle</span></button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {!queryText && !recommendationMode && filteredContent.length > 0 && (<div className="flex justify-center mt-12"><button onClick={loadMore} disabled={loadingMore} className="bg-gray-800 hover:bg-gray-700 text-white px-10 py-4 rounded-full font-bold text-lg transition shadow-lg border border-gray-600">{loadingMore ? 'Yükleniyor...' : 'Daha Fazla Göster ↓'}</button></div>)}
      </div>
      <MovieModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} movie={selectedMovie || {}} onSave={saveMovie} initialData={initialModalData} />
    </div>
  );
}

export default Search;