import { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { collection, query, where, onSnapshot, deleteDoc, doc, addDoc } from 'firebase/firestore';
import Header from '../components/Header.jsx';
import { searchActors, getPersonCredits } from '../services/api'; // <--- YENİ API
import toast from 'react-hot-toast';
import { FaDice, FaSearch } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { createSlug } from '../utils';

function Actors() {
    const [myActors, setMyActors] = useState([]);
    const [searchResults, setSearchResults] = useState([]);
    const [queryText, setQueryText] = useState('');
    const [loading, setLoading] = useState(true);
    const [searching, setSearching] = useState(false);

    // Suggestion State
    const [isSuggesting, setIsSuggesting] = useState(false);

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

    // Otomatik Arama (Debounce)
    useEffect(() => {
        const timeoutId = setTimeout(async () => {
            if (!queryText.trim()) {
                setSearchResults([]);
                return;
            }

            setSearching(true);
            try {
                const results = await searchActors(queryText);
                const filtered = results.filter(p => p.profile_path);
                setSearchResults(filtered);
            } catch (error) {
                console.error(error);
            } finally {
                setSearching(false);
            }
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [queryText]);

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

    // --- RASTGELE ÖNERİ FONKSİYONU ---
    const handleRandomSuggest = async () => {
        if (myActors.length === 0) {
            toast("Önce favori oyuncu eklemelisin! 🎭", { icon: '⚠️' });
            return;
        }

        setIsSuggesting(true);
        try {
            // 1. Rastgele Oyuncu Seç
            const randomActor = myActors[Math.floor(Math.random() * myActors.length)];

            // 2. Oyuncunun Filmlerini Çek
            const credits = await getPersonCredits(randomActor.id);

            // 3. Kalite Kontrol (Posterli ve belirli bir popülarite üzeri)
            const validCredits = credits.filter(m => m.poster_path && (m.vote_count > 50));

            if (validCredits.length === 0) {
                toast.error(`${randomActor.name} için uygun bir öneri bulamadım, tekrar dene!`);
                setIsSuggesting(false);
                return;
            }

            // 4. Rastgele Film Seç
            const randomMovie = validCredits[Math.floor(Math.random() * validCredits.length)];

            // 5. Yönlendir
            const type = randomMovie.media_type === 'tv' ? 'tv' : 'movie';
            // createSlug fonksiyonunu kullanarak URL oluşturuyoruz
            const targetUrl = `/details/${type}/${createSlug(randomMovie.id, randomMovie.title || randomMovie.name)}`;

            toast.success(`🚀 Gidiliyor: ${randomActor.name} - ${randomMovie.title || randomMovie.name}`, { duration: 3000 });
            navigate(targetUrl);

        } catch (error) {
            console.error(error);
            toast.error("Şansına küs, bir hata oluştu 😅");
        } finally {
            setIsSuggesting(false);
        }
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
                {/* HEADER ROW */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-6 mt-4">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
                        Oyuncular
                    </h1>

                    <button
                        onClick={handleRandomSuggest}
                        disabled={isSuggesting}
                        className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-8 py-3 rounded-full font-bold shadow-lg hover:shadow-purple-500/30 transition-all hover:scale-105 flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <FaDice className={`text-xl ${isSuggesting ? 'animate-spin' : ''}`} />
                        <span>{isSuggesting ? 'Seçiliyor...' : 'Bana Bir Şey Öner'}</span>
                    </button>
                </div>

                {/* ORTALI ARAMA ÇUBUĞU */}
                <div className="max-w-3xl mx-auto w-full relative group z-10">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-indigo-600/20 rounded-full blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500"></div>
                    <FaSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 text-xl group-focus-within:text-white transition-colors z-20" />
                    <input
                        type="text"
                        placeholder="Hangi oyuncuyu arıyorsun?"
                        className="w-full bg-zinc-900/80 backdrop-blur-xl border border-zinc-700 rounded-full py-5 pl-16 pr-6 text-white text-lg placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 shadow-2xl transition-all relative z-10"
                        value={queryText}
                        onChange={(e) => setQueryText(e.target.value)}
                    />
                    {searching && (
                        <div className="absolute right-6 top-1/2 -translate-y-1/2 z-20">
                            <div className="animate-spin h-5 w-5 border-2 border-purple-500 border-t-transparent rounded-full"></div>
                        </div>
                    )}
                </div>

                {/* ARAMA SONUÇLARI */}
                {searchResults.length > 0 && (
                    <div className="animate-fade-in-up">
                        <h3 className="text-gray-400 mb-6 text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                            <span>🔍</span> Arama Sonuçları
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
                            {searchResults.map(actor => renderActorCard(actor))}
                        </div>
                    </div>
                )}

                {/* BÖLÜM 2: FAVORİ OYUNCULARIM */}
                <div className="border-t border-gray-800 pt-12">
                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-8 flex items-center gap-3">
                        <span className="text-yellow-500">🌟</span> Favori Oyuncularım <span className="text-gray-500 text-lg font-normal">({myActors.length})</span>
                    </h2>

                    {loading ? (
                        <div className="text-center py-20 text-gray-500 animate-pulse">Listeler yükleniyor...</div>
                    ) : myActors.length === 0 ? (
                        <div className="text-center py-10 text-gray-600 italic">
                            Henüz favori listenize kimseyi eklemediniz. Yukarıdan arayarak ekleyebilirsiniz.
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
                            {myActors.map(actor => renderActorCard(actor, true))}
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
}

export default Actors;
