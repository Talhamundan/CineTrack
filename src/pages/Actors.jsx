import { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { collection, query, where, onSnapshot, deleteDoc, doc, addDoc } from 'firebase/firestore';
import Header from '../components/Header.jsx';
import { searchActors } from '../services/api'; // <--- YENİ API
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { createSlug } from '../utils';

function Actors() {
    const [myActors, setMyActors] = useState([]);
    const [searchResults, setSearchResults] = useState([]);
    const [queryText, setQueryText] = useState('');
    const [loading, setLoading] = useState(true);
    const [searching, setSearching] = useState(false);
    const navigate = useNavigate(); // <--- BU EKSİKTİ!



    const user = auth.currentUser;

    // Favori Oyuncuları Dinle
    useEffect(() => {
        if (!user) return;

        const q = query(collection(db, "user_actors"), where("userId", "==", user.uid));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const actorList = snapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
            setMyActors(actorList);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    // Oyuncu Arama
    const handleSearch = async (e) => {
        e.preventDefault();
        if (!queryText.trim()) return;

        setSearching(true);
        try {
            const results = await searchActors(queryText);
            // Sadece görseli olanları getirsek daha şık olur
            const filtered = results.filter(p => p.profile_path);
            setSearchResults(filtered);
            if (filtered.length === 0) toast.error("Oyuncu bulunamadı.");
        } catch (error) {
            console.error(error);
            toast.error("Arama sırasında hata oluştu.");
        } finally {
            setSearching(false);
        }
    };

    // Favori Ekleme / Çıkarma
    const toggleFavorite = async (e, actor) => {
        e.stopPropagation();
        const existing = myActors.find(a => String(a.id) === String(actor.id));

        try {
            if (existing) {
                // Çıkar
                await deleteDoc(doc(db, "user_actors", existing.docId));
                toast("Favorilerden çıkarıldı", { icon: '🗑️' });
            } else {
                // Ekle
                await addDoc(collection(db, "user_actors"), {
                    userId: user.uid,
                    id: actor.id,
                    name: actor.name,
                    profile_path: actor.profile_path,
                    addedAt: new Date()
                });
                toast.success("Favorilere eklendi ❤️");
            }
        } catch (error) {
            toast.error("İşlem başarısız.");
        }
    };

    // Modalı Aç
    // Detay Sayfasına Git
    const openActorDetail = (actor) => {
        navigate(`/actor/${createSlug(actor.id, actor.name)}`);
    };

    // Yardımcı: Oyuncu Kartı Render
    const renderActorCard = (actor, isFavoriteResult = false) => {
        const isFavorite = isFavoriteResult || myActors.some(a => String(a.id) === String(actor.id));

        return (
            <div
                key={actor.id}
                onClick={() => openActorDetail(actor)}
                className="group relative bg-gray-900 rounded-2xl overflow-hidden cursor-pointer shadow-lg hover:shadow-yellow-900/20 hover:-translate-y-2 transition-all duration-300 border border-gray-800 hover:border-yellow-500/50"
            >
                <div className="aspect-[2/3] relative">
                    <img
                        src={actor.profile_path ? `https://image.tmdb.org/t/p/w500${actor.profile_path}` : 'https://via.placeholder.com/500x750?text=No+Image'}
                        alt={actor.name}
                        className="w-full h-full object-cover transition duration-500 group-hover:scale-110"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90"></div>

                    {/* Favori Butonu */}
                    <button
                        onClick={(e) => toggleFavorite(e, actor)}
                        className={`absolute top-3 right-3 p-2 rounded-full transition-all duration-300 transform shadow-md 
                        ${isFavorite ? 'bg-white text-red-600 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0' : 'bg-black/60 text-white hover:bg-red-600'}`}
                        title={isFavorite ? "Favorilerden Çıkar" : "Favorilere Ekle"}
                    >
                        <span className="text-lg">{isFavorite ? '🗑️' : '🤍'}</span>
                    </button>

                    <div className="absolute bottom-0 left-0 right-0 p-4 text-center">
                        <h3 className="text-lg font-bold text-white group-hover:text-yellow-400 transition leading-tight mb-1">{actor.name}</h3>
                        <p className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">Filmografiyi Gör ➜</p>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="bg-black min-h-screen text-white font-sans pb-20">
            <Header />

            <div className="p-8 max-w-[1600px] mx-auto flex flex-col gap-12">

                {/* BÖLÜM 1: OYUNCU ARAMA */}
                <div className="bg-gray-900/50 p-8 rounded-3xl border border-gray-800">
                    <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                        <span>🔍</span> Oyuncu Ara
                    </h2>

                    <form onSubmit={handleSearch} className="flex gap-4 mb-8">
                        <input
                            type="text"
                            placeholder="Oyuncu adı girin (Örn: Cem Yılmaz)..."
                            className="flex-1 bg-black text-white p-4 rounded-xl outline-none focus:ring-2 ring-yellow-500 border border-gray-700 text-lg placeholder-gray-600 transition"
                            value={queryText}
                            onChange={(e) => setQueryText(e.target.value)}
                        />
                        <button
                            type="submit"
                            disabled={searching}
                            className="bg-yellow-500 hover:bg-yellow-400 text-black px-8 py-4 rounded-xl font-bold text-lg transition disabled:opacity-50"
                        >
                            {searching ? 'Aranıyor...' : 'Ara'}
                        </button>
                    </form>

                    {/* Arama Sonuçları */}
                    {searchResults.length > 0 && (
                        <div>
                            <h3 className="text-gray-400 mb-4 text-sm font-bold uppercase tracking-widest">Sonuçlar</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                                {searchResults.map(actor => renderActorCard(actor))}
                            </div>
                        </div>
                    )}
                </div>

                {/* BÖLÜM 2: FAVORİ OYUNCULARIM */}
                <div>
                    <h2 className="text-3xl font-bold text-yellow-500 mb-8 flex items-center gap-3 border-b border-gray-800 pb-4">
                        <span>🌟</span> Favori Oyuncularım <span className="text-gray-500 text-lg font-normal">({myActors.length})</span>
                    </h2>

                    {loading ? (
                        <div className="text-center py-20 text-gray-500 animate-pulse">Listeler yükleniyor...</div>
                    ) : myActors.length === 0 ? (
                        <div className="text-center py-10 text-gray-600 italic">
                            Henüz favori listenize kimseyi eklemediniz. Yukarıdan arayarak ekleyebilirsiniz.
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                            {myActors.map(actor => renderActorCard(actor, true))}
                        </div>
                    )}
                </div>
            </div>

            {/* MODAL ARTIK YOK */}
        </div>
    );
}

export default Actors;
