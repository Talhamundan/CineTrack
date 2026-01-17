import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { getPersonDetail, getPersonCredits, GENRES } from '../services/api';
import { createSlug } from '../utils';
import Header from '../components/Header.jsx';
import ContentDetails from '../components/ContentDetails.jsx';
import MovieModal from '../components/MovieModal.jsx';
import toast from 'react-hot-toast';

function ActorDetail() {
    const { id: slugId } = useParams();
    const id = parseInt(slugId);
    const navigate = useNavigate();
    const [actor, setActor] = useState(null);
    const [credits, setCredits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [myListMap, setMyListMap] = useState({});
    const [sortOption, setSortOption] = useState('vote_desc');
    const [initialModalData, setInitialModalData] = useState(null);

    const [selectedMovie, setSelectedMovie] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const user = auth.currentUser;

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

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [details, creditList] = await Promise.all([
                    getPersonDetail(id),
                    getPersonCredits(id)
                ]);
                setActor(details);
                setCredits(creditList);
            } catch (error) {
                console.error(error);
                toast.error("Oyuncu bilgileri alınamadı.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
        window.scrollTo(0, 0);
    }, [id]);

    const sortedCredits = [...credits].sort((a, b) => {
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

    const handleRemoveFromList = async (tmdbId) => {
        const item = myListMap[String(tmdbId)];
        if (!item?.docId) return;
        try {
            await deleteDoc(doc(db, "user_lists", item.docId));
            toast.success("Listeden çıkarıldı 👋", { icon: '🗑️', style: { background: '#333', color: '#fff' } });
        } catch (error) { console.error(error); toast.error("Hata oluştu"); }
    };

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

    if (loading) return <div className="bg-black min-h-screen text-white flex items-center justify-center">Yükleniyor...</div>;
    if (!actor) return <div className="bg-black min-h-screen text-white flex items-center justify-center">Oyuncu bulunamadı.</div>;

    return (
        <div className="bg-black min-h-screen text-white pb-20 font-sans">
            <Header />

            <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-b from-gray-900 to-black opacity-80 z-0"></div>
                <div className="max-w-[1600px] mx-auto p-8 relative z-10 flex flex-col md:flex-row gap-10 items-center md:items-start pt-12 md:pt-20">

                    <div className="w-48 h-48 md:w-72 md:h-72 rounded-full overflow-hidden border-4 border-yellow-500 shadow-2xl flex-shrink-0">
                        <img
                            src={actor.profile_path ? `https://image.tmdb.org/t/p/w500${actor.profile_path}` : 'https://via.placeholder.com/500x500?text=No+Image'}
                            alt={actor.name}
                            className="w-full h-full object-cover"
                        />
                    </div>

                    <div className="text-center md:text-left flex-1">
                        <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-4">{actor.name}</h1>
                        <div className="flex flex-wrap justify-center md:justify-start gap-4 text-gray-400 mb-6 font-medium">
                            {actor.birthday && <span>🎂 {actor.birthday}</span>}
                            {actor.place_of_birth && <span>📍 {actor.place_of_birth}</span>}
                            {actor.known_for_department && <span>🎭 {actor.known_for_department}</span>}
                        </div>
                        {actor.biography && (
                            <p className="text-gray-300 text-lg leading-relaxed max-w-4xl line-clamp-4 hover:line-clamp-none transition-all cursor-pointer" title="Tamamını okumak için tıklayın">
                                {actor.biography}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            <div className="p-8 max-w-[1920px] mx-auto mt-8">
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 border-b border-gray-800 pb-4">
                    <h2 className="text-3xl font-bold text-yellow-500 flex items-center gap-3">
                        <span>🎬</span> Rol Aldığı Yapımlar <span className="text-gray-500 text-lg font-normal">({credits.length})</span>
                    </h2>

                    <select
                        value={sortOption}
                        onChange={(e) => setSortOption(e.target.value)}
                        className="mt-4 md:mt-0 bg-black/50 border border-gray-700 text-sm text-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:border-red-600 transition cursor-pointer"
                    >
                        <option value="vote_desc">IMDb Puanı (Yüksekten Düşüğe)</option>
                        <option value="vote_asc">IMDb Puanı (Düşükten Yükseğe)</option>
                        <option value="date_desc">Yayın Tarihi (Yeniden Eskiye)</option>
                        <option value="date_asc">Yayın Tarihi (Eskiden Yeniye)</option>
                        <option value="name_asc">İsim (A-Z)</option>
                    </select>
                </div>

                {sortedCredits.length === 0 ? (
                    <div className="text-gray-500 text-center py-20">Kayıtlı yapım bulunamadı.</div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-10">
                        {sortedCredits.map((item) => {
                            const isAdded = !!myListMap[String(item.id)];
                            return (
                                <div
                                    key={item.id}
                                    onClick={() => navigate(`/details/${item.media_type || 'movie'}/${createSlug(item.id, item.title || item.name)}`)}
                                    className={`group relative bg-gray-900 rounded-2xl overflow-hidden shadow-xl hover:shadow-red-900/30 transition-all duration-300 hover:-translate-y-2 cursor-pointer ${isAdded ? 'border-2 border-green-600' : 'border border-transparent'}`}
                                >
                                    <div className="aspect-[2/3] relative">
                                        <img src={item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Image'} alt={item.title} className="w-full h-full object-cover" />
                                        <div className="absolute top-3 left-3 bg-yellow-500 text-black text-xs font-bold px-3 py-1.5 rounded shadow">★ {item.vote_average ? item.vote_average.toFixed(1) : '?'}</div>

                                        <div className="absolute inset-0 bg-black/95 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-center items-center p-6 text-center">
                                            <h3 className="font-bold text-white text-xl mb-2 leading-tight">{item.title || item.name}</h3>
                                            <p className="text-red-400 text-xs font-bold uppercase tracking-wider mb-2">{item.genre_ids?.slice(0, 2).map(id => GENRES[id]).join(', ')}</p>
                                            {item.overview && <p className="text-gray-400 text-xs line-clamp-3 mb-4 px-1 leading-relaxed">{item.overview}</p>}
                                            {item.character && <p className="text-yellow-500 text-xs font-bold mb-4">Rol: {item.character}</p>}

                                            <div className="mb-4 transform scale-105"><ContentDetails id={item.id} type={item.media_type || 'movie'} /></div>

                                            {isAdded ? (
                                                <button onClick={(e) => { e.stopPropagation(); openModal(item); }} className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-full font-bold text-lg transition flex items-center justify-center gap-2 shadow-lg group-hover:scale-105"><span className="text-2xl leading-none">✓</span><span>Listende</span></button>
                                            ) : (
                                                <button onClick={(e) => { e.stopPropagation(); openModal(item); }} className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-full font-bold text-lg transform hover:scale-105 transition flex items-center justify-center gap-2 shadow-lg"><span className="text-2xl leading-none">+</span><span>Listeme Ekle</span></button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <MovieModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} movie={selectedMovie || {}} onSave={saveMovie} initialData={initialModalData} />
        </div>
    );
}

export default ActorDetail;
