import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

function SharedList() {
  const { userId } = useParams(); // URL'den ID'yi al
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // Tümü, Film, Dizi

  useEffect(() => {
    const fetchSharedList = async () => {
      try {
        const q = query(collection(db, "user_lists"), where("userId", "==", userId));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => doc.data());
        setList(data);
      } catch (error) {
        console.error("Liste çekilemedi", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSharedList();
  }, [userId]);

  const filteredList = list.filter(item => {
    if (filter === 'all') return true;
    if (filter === 'movie') return item.type === 'movie' || item.media_type === 'movie';
    if (filter === 'tv') return item.type === 'tv' || item.media_type === 'tv';
    return true;
  });

  // Puan rengi
  const getScoreColor = (score) => {
    if (!score) return 'text-gray-500';
    if (score >= 8) return 'text-green-500';
    if (score >= 5) return 'text-yellow-500';
    return 'text-red-500';
  };

  if (loading) return <div className="bg-black min-h-screen text-white flex items-center justify-center">Yükleniyor...</div>;

  return (
    <div className="bg-black min-h-screen text-white font-sans pb-20">
      
      {/* BASİT HEADER */}
      <header className="p-8 border-b border-gray-800 bg-black/95 sticky top-0 z-20 flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-extrabold text-red-600 tracking-tighter mb-1">CineTrack</h1>
            <p className="text-sm text-gray-400">Bu liste bir arkadaşın tarafından paylaşıldı.</p>
        </div>
        <Link to="/" className="bg-gray-800 hover:bg-gray-700 px-5 py-2 rounded-full text-sm font-bold transition">
            Kendi Listeni Oluştur
        </Link>
      </header>

      <div className="p-8 max-w-[1920px] mx-auto">
        
        {/* FİLTRELER */}
        <div className="flex justify-center mb-8 gap-4">
            {['all', 'movie', 'tv'].map(type => (
                <button 
                    key={type}
                    onClick={() => setFilter(type)}
                    className={`px-6 py-2 rounded-full font-bold uppercase text-sm transition ${filter === type ? 'bg-red-600 text-white' : 'bg-gray-900 text-gray-400 hover:text-white'}`}
                >
                    {type === 'all' ? 'Tümü' : type === 'movie' ? 'Filmler' : 'Diziler'}
                </button>
            ))}
        </div>

        {/* LİSTE */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8">
            {filteredList.map((item, index) => (
                <div key={index} className="group relative bg-gray-900 rounded-xl overflow-hidden shadow-lg hover:-translate-y-2 transition duration-300">
                    <div className="aspect-[2/3] relative">
                        <img 
                            src={item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : 'https://via.placeholder.com/500x750'} 
                            alt={item.title} 
                            className="w-full h-full object-cover"
                        />
                        
                        {/* Puan Rozeti */}
                        {item.score && (
                            <div className="absolute top-2 left-2 bg-black/80 backdrop-blur-md px-2 py-1 rounded text-xs font-bold shadow border border-gray-700">
                                <span className={getScoreColor(item.score)}>★ {item.score}</span>
                            </div>
                        )}

                        {/* HOVER BİLGİSİ */}
                        <div className="absolute inset-0 bg-black/90 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-center items-center p-4 text-center">
                            <h3 className="font-bold text-lg mb-2">{item.title || item.name}</h3>
                            <div className="text-xs text-gray-400 mb-4 line-clamp-3 italic">
                                {item.review ? `"${item.review}"` : (item.overview || "Özet yok.")}
                            </div>
                            <div className="text-sm font-bold text-red-500">
                                {item.status === 'completed' ? 'Bitirdi' : item.status === 'watching' ? 'İzliyor' : item.status === 'dropped' ? 'Bıraktı' : 'Planlıyor'}
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>

        {filteredList.length === 0 && (
            <div className="text-center text-gray-500 py-20">Bu kategoride içerik yok.</div>
        )}

      </div>
    </div>
  );
}

export default SharedList;