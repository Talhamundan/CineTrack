import { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { collection, query, where, onSnapshot, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useNavigate, Link } from 'react-router-dom'; // useNavigate eklendi
import { createSlug } from '../utils';
import MovieModal from '../components/MovieModal.jsx';
import Header from '../components/Header.jsx';
import DeleteModal from '../components/DeleteModal.jsx';
import toast from 'react-hot-toast';
import { FaDice } from 'react-icons/fa';

function Home() {
  const navigate = useNavigate(); // Hook çağrısı
  const [myList, setMyList] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState('tv');
  const [statusFilter, setStatusFilter] = useState('all');
  const [originFilter, setOriginFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('default');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);

  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "user_lists"), where("userId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMyList(list);
    });
    return () => unsubscribe();
  }, [user]);

  const handleDeleteRequest = (id) => {
    setItemToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (itemToDelete) {
      await deleteDoc(doc(db, "user_lists", itemToDelete));
      toast.success("İçerik silindi 👋", { style: { background: '#333', color: '#fff' } });
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
    }
  };

  const handleEditClick = (item) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleUpdate = async (updatedData) => {
    try {
      const itemRef = doc(db, "user_lists", selectedItem.id);
      await updateDoc(itemRef, {
        status: updatedData.status,
        score: updatedData.score,
        review: updatedData.review,
        currentSeason: updatedData.currentSeason || null,
        currentEpisode: updatedData.currentEpisode || null,
        lastUpdated: new Date()
      });
      toast.success("Güncellendi! 👍");
    } catch (error) {
      console.error("Güncelleme hatası:", error);
      toast.error("Hata oluştu!");
    }
  };

  const toggleFavorite = async (e, item) => {
    e.stopPropagation();
    try {
      const itemRef = doc(db, "user_lists", item.id);
      const newStatus = !item.isFavorite;
      await updateDoc(itemRef, {
        isFavorite: newStatus
      });

      if (newStatus) {
        toast.success("Favorilere eklendi ❤️", { icon: '😍' });
      } else {
        toast("Favorilerden çıkarıldı", { icon: '💔' });
      }
    } catch (error) {
      toast.error("İşlem başarısız");
    }
  };

  const filteredList = myList.filter(item => {
    const typeMatch = item.type === typeFilter;
    let statusMatch = true;
    if (statusFilter === 'favorites') {
      statusMatch = item.isFavorite === true;
    } else if (statusFilter !== 'all') {
      statusMatch = item.status === statusFilter;
    }
    const originMatch = originFilter === 'all' ? true : originFilter === 'tr' ? item.original_language === 'tr' : item.original_language !== 'tr';

    const query = searchQuery.toLowerCase();
    let searchMatch = true;

    if (searchQuery) {
      const title = item.title ? item.title.toLowerCase() : "";
      const originalTitle = item.original_title ? item.original_title.toLowerCase() : "";
      const date = item.release_date || item.first_air_date || "";
      const year = date.split("-")[0];
      const combinedText = `${title} ${year}`;

      searchMatch = title.includes(query) ||
        originalTitle.includes(query) ||
        combinedText.includes(query) ||
        year.includes(query);
    }

    return typeMatch && statusMatch && originMatch && searchMatch;
  });

  const sortedList = [...filteredList].sort((a, b) => {
    if (sortOrder === 'score') {
      return (b.score || 0) - (a.score || 0);
    }
    else if (sortOrder === 'year') {
      const dateA = a.release_date || a.first_air_date || '0000';
      const dateB = b.release_date || b.first_air_date || '0000';
      return dateB.localeCompare(dateA);
    }
    else if (sortOrder === 'added') {
      const timeA = a.addedAt?.seconds || 0;
      const timeB = b.addedAt?.seconds || 0;
      return timeB - timeA;
    }
    else {
      const statusPriority = { 'watching': 1, 'dropped': 2, 'planned': 3, 'completed': 4 };
      const statusDiff = (statusPriority[a.status] || 99) - (statusPriority[b.status] || 99);
      if (statusDiff !== 0) return statusDiff;
      return a.title.localeCompare(b.title, 'tr');
    }
  });

  const getStatusLabel = (status) => {
    switch (status) {
      case 'watching': return 'İzleniyor';
      case 'planned': return 'İzlenecek';
      case 'completed': return 'Bitirildi';
      case 'dropped': return 'Ara Verilen';
      default: return '';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'watching': return 'bg-blue-600';
      case 'planned': return 'bg-gray-500';
      case 'completed': return 'bg-green-600';
      case 'dropped': return 'bg-orange-600';
      default: return 'bg-gray-600';
    }
  };

  const formatRuntime = (minutes) => {
    if (!minutes) return '';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}s ${mins}dk`;
  };

  const tabs = [
    { key: 'all', label: 'Tümü' },
    { key: 'favorites', label: '❤️ Favoriler' },
    { key: 'watching', label: 'İzleniyor' },
    { key: 'dropped', label: 'Ara Verilen' },
    { key: 'planned', label: 'İzlenecek' },
    { key: 'completed', label: 'Bitirildi' },
  ];

  const handleRandomPick = () => {
    const freshContent = myList.filter(item =>
      item.type === typeFilter &&
      item.status !== 'completed'
    );

    if (freshContent.length === 0) {
      toast.error('Listenizde izlenmemiş içerik kalmadı! 😅');
      return;
    }

    const randomIndex = Math.floor(Math.random() * freshContent.length);
    const randomItem = freshContent[randomIndex];

    navigate(`/details/${randomItem.type}/${createSlug(randomItem.tmdbId || randomItem.id, randomItem.title)}`);
    toast.success(`🎲 Seçildi: ${randomItem.title}`);
  };

  return (
    <div className="bg-black min-h-screen text-white font-sans pb-20">

      <Header />

      <div className="p-8 max-w-[1920px] mx-auto">
        <div className="flex justify-center mb-6 relative">
          <div className="bg-gray-900 p-1.5 rounded-full flex">
            <button onClick={() => { setTypeFilter('movie'); setStatusFilter('all'); setOriginFilter('all'); }} className={`px-10 py-3 rounded-full font-bold text-lg transition ${typeFilter === 'movie' ? 'bg-white text-black shadow' : 'text-gray-400 hover:text-white'}`}>Filmler</button>
            <button onClick={() => { setTypeFilter('tv'); setStatusFilter('all'); setOriginFilter('all'); }} className={`px-10 py-3 rounded-full font-bold text-lg transition ${typeFilter === 'tv' ? 'bg-white text-black shadow' : 'text-gray-400 hover:text-white'}`}>Diziler</button>
          </div>

          <button
            onClick={handleRandomPick}
            className="absolute right-0 top-1/2 -translate-y-1/2 bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-900/20 px-4 py-3 rounded-xl font-bold transition-transform flex items-center gap-2 whitespace-nowrap"
            title="Rastgele İçerik Seç"
          >
            <FaDice className="text-xl" />
            <span className="hidden md:inline">Ne İzlesem?</span>
          </button>
        </div>
        {/* Arama ve Sıralama */}
        <div className="flex flex-row justify-center items-center gap-3 w-full max-w-4xl mx-auto mb-6">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Listenizde arayın..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 pl-10 text-white placeholder-gray-500 focus:border-red-600 focus:outline-none transition-colors"
            />
            <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="bg-gray-900 text-white px-4 py-3 rounded-xl border border-gray-700 outline-none text-sm hover:border-gray-500 cursor-pointer min-w-[200px]"
          >
            <option value="default">Sırala: Varsayılan (Durum)</option>
            <option value="score">Sırala: Puan (Yüksekten Düşüğe)</option>
            <option value="year">Sırala: Yıl (Yeniden Eskiye)</option>
            <option value="added">Sırala: Son Eklenenler</option>
          </select>
        </div>

        {/* Metin Filtreleri */}
        <div className="flex justify-center items-center gap-6 text-sm font-medium text-gray-400 mb-8">
          <button onClick={() => setOriginFilter('all')} className={`${originFilter === 'all' ? 'text-white underline decoration-red-600 decoration-2 underline-offset-8 font-bold' : 'hover:text-gray-300'}`}>Tümü</button>
          <button onClick={() => setOriginFilter('tr')} className={`${originFilter === 'tr' ? 'text-white underline decoration-red-600 decoration-2 underline-offset-8 font-bold' : 'hover:text-gray-300'}`}>Yerli Yapımlar</button>
          <button onClick={() => setOriginFilter('foreign')} className={`${originFilter === 'foreign' ? 'text-white underline decoration-red-600 decoration-2 underline-offset-8 font-bold' : 'hover:text-gray-300'}`}>Yabancı</button>
        </div>

        <div className="flex justify-between items-center mb-6 border-b border-gray-800 pb-4">
          <div className="flex gap-4 overflow-x-auto justify-center sm:justify-start scrollbar-hide">
            {tabs.map((tab) => (
              <button key={tab.key} onClick={() => setStatusFilter(tab.key)} className={`whitespace-nowrap px-6 py-2.5 rounded-xl text-base font-medium transition border ${statusFilter === tab.key ? 'bg-red-600/20 border-red-600 text-red-500 font-bold' : 'border-gray-800 text-gray-400 hover:border-gray-600'}`}>
                {tab.label}
              </button>
            ))}
          </div>
          <span className="text-gray-400 text-sm whitespace-nowrap ml-4">Toplam: {filteredList.length}</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-10">
          {sortedList.map((item) => (
            <div key={item.id} onClick={() => handleEditClick(item)} className="group relative bg-gray-900 rounded-2xl overflow-hidden shadow-xl hover:shadow-red-900/30 transition-all duration-300 cursor-pointer hover:-translate-y-2">
              <div className="aspect-[2/3] relative">
                <img src={`https://image.tmdb.org/t/p/w500${item.poster_path}`} alt={item.title} className="w-full h-full object-cover" />

                {/* SOL ÜST 1: DURUM ETİKETİ (Hover'da Kaybolur) */}
                <div className={`absolute top-3 left-3 text-white text-xs font-bold px-3 py-1.5 rounded shadow uppercase transition-opacity duration-300 group-hover:opacity-0 ${getStatusColor(item.status)}`}>
                  {getStatusLabel(item.status)}
                </div>

                {/* SOL ÜST 2: KALP BUTONU (DAİMA GÖRÜNÜR - Z-INDEX YÜKSEK) */}
                <button
                  onClick={(e) => toggleFavorite(e, item)}
                  className={`absolute top-12 left-3 z-30 text-2xl transition hover:scale-110 drop-shadow-lg ${item.isFavorite ? 'text-red-600' : 'text-white/70 hover:text-red-600'}`}
                  title={item.isFavorite ? "Favorilerden Çıkar" : "Favorilere Ekle"}
                >
                  {item.isFavorite ? '❤️' : '🤍'}
                </button>

                {/* SAĞ ÜST: TR ROZETİ - DAİMA GÖRÜNÜR */}
                {item.original_language === 'tr' && (
                  <div className="absolute top-2 right-2 z-30 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow">TR</div>
                )}

                {/* SAĞ ALT: DETAY BUTONU (INFO) - HOVERDA GÖRÜNÜR */}
                {/* SAĞ TARAF: DİĞER ROZETLER (Not vb.) */}
                <div className="absolute top-14 right-3 flex flex-col gap-2 items-end z-10 transition-opacity duration-300 group-hover:opacity-0">
                  {item.review && (
                    <div className="bg-yellow-500 text-black text-[10px] font-bold px-2 py-1 rounded shadow flex items-center gap-1">
                      <span>✏️</span> Not
                    </div>
                  )}
                </div>

                {/* HOVER OVERLAY (Siyah Perde) */}
                <div className="absolute inset-0 bg-black/95 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-center items-center p-6 text-center z-20 pointer-events-none">
                  <h3 className="font-bold text-white text-xl mb-2 leading-tight line-clamp-2">{item.title}</h3>
                  <p className="text-red-400 text-xs font-bold uppercase tracking-wider mb-2">{item.genres ? (typeof item.genres === 'string' ? item.genres : item.genres.slice(0, 2).join(', ')) : ''}</p>

                  {item.review ? (
                    <p className="text-yellow-100 italic text-xs line-clamp-3 mb-3 px-1 leading-relaxed border-l-2 border-yellow-500 pl-2">"{item.review}"</p>
                  ) : (
                    item.overview && <p className="text-gray-400 text-xs line-clamp-3 mb-3 px-1 leading-relaxed">{item.overview}</p>
                  )}

                  {item.score && <div className="text-yellow-400 font-bold text-xl mb-2">★ {item.score}</div>}
                  {item.type === 'tv' && item.status === 'watching' && item.currentSeason && <div className="bg-gray-800 px-4 py-2 rounded text-sm text-blue-300 font-mono mb-3 border border-blue-900">S{item.currentSeason} - B{item.currentEpisode}</div>}
                  <div className="text-gray-300 text-base font-medium mb-6">
                    <span className="text-red-500 font-bold mr-2">{(item.release_date || '').split('-')[0]}</span>•<span className="ml-2">{item.type === 'tv' ? (item.total_seasons ? `${item.total_seasons} Sezon` : 'Detay Yok') : (item.runtime ? formatRuntime(item.runtime) : 'Süre Yok')}</span>
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 w-full flex justify-between items-center px-4 py-3 bg-gradient-to-t from-black/80 to-transparent pointer-events-auto">
                    {/* INFO BUTTON */}
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/details/${item.type}/${createSlug(item.tmdbId || item.id, item.title)}`); }}
                      className="text-white/80 hover:text-blue-400 hover:scale-110 transition-transform p-1"
                      title="Detaylar"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                      </svg>
                    </button>

                    {/* CENTER TEXT */}
                    <span className="text-[10px] text-gray-400 font-light tracking-wider">
                      Düzenlemek için tıkla
                    </span>

                    {/* DELETE BUTTON */}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteRequest(item.id); }}
                      className="text-white/80 hover:text-red-500 hover:scale-110 transition-transform p-1"
                      title="Listeden Sil"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </button>
                  </div>
                </div>

              </div>
            </div>
          ))}
        </div>

        {sortedList.length === 0 && (
          <div className="text-center py-24 text-gray-500">
            <p className="text-2xl">{searchQuery ? "Aradığınız kriterde içerik yok." : "Bu filtreye uygun içerik yok."}</p>
          </div>
        )}
      </div>

      <MovieModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} movie={selectedItem || {}} initialData={selectedItem} onSave={handleUpdate} />

      <DeleteModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={confirmDelete} />
    </div >
  );
}

export default Home;