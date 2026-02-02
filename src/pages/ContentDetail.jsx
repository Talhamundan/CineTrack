import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { getMovieDetail, getTVDetail, getCredits, GENRES } from '../services/api';
import { createSlug } from '../utils';
import { FaPlay, FaYoutube, FaTimes } from "react-icons/fa";
import Header from '../components/Header.jsx';
import MovieModal from '../components/MovieModal.jsx';
import toast from 'react-hot-toast';

function ContentDetail() {
    const { type, id: slugId } = useParams();
    const id = parseInt(slugId);
    const navigate = useNavigate();
    const [content, setContent] = useState(null);
    const [cast, setCast] = useState([]);
    const [loading, setLoading] = useState(true);
    const [myListMap, setMyListMap] = useState({});
    const [trailerKey, setTrailerKey] = useState(null);
    const [showTrailer, setShowTrailer] = useState(false);
    const [favActorIds, setFavActorIds] = useState(new Set());

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [initialModalData, setInitialModalData] = useState(null);


    const [currentUser, setCurrentUser] = useState(null);

    // 1. AUTH LISTENER (Kullanıcı Oturumunu Garantiye Al)
    useEffect(() => {
        const authInstance = getAuth();
        const unsubscribe = onAuthStateChanged(authInstance, (user) => {
            if (user) {
                console.log("🟢 Kullanıcı Algılandı:", user.uid);
                setCurrentUser(user);
            } else {
                console.log("🔴 Kullanıcı Yok");
                setCurrentUser(null);
            }
        });
        return () => unsubscribe();
    }, []);

    const user = currentUser; // Mevcut kodun geri kalanı 'user' değişkenini kullanıyor

    // 1. KULLANICI LİSTESİNİ DİNLE
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

    // 2. FAVORİ OYUNCULARI DİNLE (GÜNCELLENDİ & HATA AYIKLAMA)
    useEffect(() => {
        if (!currentUser) return;

        // ActorDetail.jsx 'user_actors' koleksiyonunu kullanıyor, bu yüzden burası da öyle olmalı.
        const q = query(collection(db, "user_actors"), where("userId", "==", currentUser.uid));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const ids = new Set();
            const fetchedIdsForLog = [];

            snapshot.docs.forEach(doc => {
                const data = doc.data();
                // ActorDetail.jsx 'id' alanına film/oyuncu ID'sini kaydediyor
                const actorId = String(data.id || data.actorId);
                ids.add(actorId);
                fetchedIdsForLog.push(actorId);
            });

            console.log("📋 Veritabanından Gelen Favori ID'leri:", fetchedIdsForLog);
            setFavActorIds(ids);
        });
        return () => unsubscribe();
    }, [currentUser]);

    // 2. İÇERİK DETAY VE OYUNCULARI ÇEK
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const detailFunc = type === 'movie' ? getMovieDetail : getTVDetail;
                const [detailData, creditsData] = await Promise.all([
                    detailFunc(id),
                    getCredits(id, type)
                ]);
                setContent(detailData);
                setCast(creditsData);

                // FRAGMAN BULMA MANTIĞI
                if (detailData.videos && detailData.videos.results) {
                    const videos = detailData.videos.results;
                    const trailer = videos.find(vid => vid.site === "YouTube" && vid.type === "Trailer" && vid.iso_639_1 === "tr")
                        || videos.find(vid => vid.site === "YouTube" && vid.type === "Trailer" && vid.iso_639_1 === "en")
                        || videos.find(vid => vid.site === "YouTube" && vid.type === "Trailer");

                    if (trailer) {
                        setTrailerKey(trailer.key);
                    }
                }
            } catch (error) {
                console.error(error);
                toast.error("İçerik bilgileri alınamadı.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
        window.scrollTo(0, 0);
    }, [type, id]);

    const openModal = () => {
        const existingItem = myListMap[String(id)];
        if (existingItem) {
            setInitialModalData(existingItem);
        } else {
            setInitialModalData(null);
        }
        setIsModalOpen(true);
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
    if (!content) return <div className="bg-black min-h-screen text-white flex items-center justify-center">İçerik bulunamadı.</div>;

    const isAdded = !!myListMap[String(content.id)];
    const backdropUrl = content.backdrop_path ? `https://image.tmdb.org/t/p/original${content.backdrop_path}` : null;
    const title = content.title || content.name;
    const originalTitle = content.original_title || content.original_name;
    const releaseDate = content.release_date || content.first_air_date;
    const runtime = content.runtime ? `${content.runtime} dk` : (content.number_of_seasons ? `${content.number_of_seasons} Sezon` : '');
    const country = content.production_countries && content.production_countries[0] ? content.production_countries[0].name : null;

    return (
        <div className="bg-black min-h-screen text-white pb-20 font-sans">
            <Header />

            {/* HERO HERO SECTION */}
            <div className="relative w-full min-h-screen md:h-[80vh] md:min-h-0 flex flex-col md:block">
                <div className="absolute inset-0">
                    <img
                        src={backdropUrl || `https://via.placeholder.com/1920x1080?text=No+Image`}
                        alt={title}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent"></div>
                </div>

                <div className="relative md:absolute md:bottom-0 left-0 w-full p-6 pt-24 md:p-16 flex flex-col md:flex-row gap-8 items-center md:items-end z-20">
                    {/* POSTER (MOBİLDE GİZLE YA DA KÜÇÜLT) - Başlığın üstüne gelmemesi için z-index */}
                    <div className="w-48 md:w-80 lg:w-96 rounded-xl overflow-hidden shadow-2xl border border-gray-800 flex-shrink-0 mx-auto md:mx-0">
                        <img
                            src={content.poster_path ? `https://image.tmdb.org/t/p/w500${content.poster_path}` : 'https://via.placeholder.com/500x750'}
                            alt={title}
                            className="w-full h-full object-cover"
                        />
                    </div>

                    {/* DETAYLAR */}
                    <div className="flex-1 mb-6 text-center md:text-left relative z-20">
                        <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-4 drop-shadow-lg leading-tight">{title}</h1>
                        {originalTitle && originalTitle !== title && (
                            <p className="text-gray-400 text-sm md:text-lg mb-4 italic">{originalTitle}</p>
                        )}

                        <div className="grid grid-cols-2 md:flex items-center justify-center md:justify-start gap-4 md:gap-8 text-sm md:text-base text-gray-300 mb-6 font-medium">
                            {content.vote_average && (
                                <span className="bg-yellow-500 text-black px-2 py-1 rounded font-bold w-fit mx-auto md:mx-0">★ {content.vote_average.toFixed(1)}</span>
                            )}
                            <div className="flex justify-center md:justify-start gap-4">
                                <span>{releaseDate?.split('-')[0]}</span>
                                <span className="hidden md:inline">•</span>
                                <span>{runtime}</span>
                                {country && (
                                    <>
                                        <span className="hidden md:inline">•</span>
                                        <span>{country}</span>
                                    </>
                                )}
                            </div>
                            <div className="col-span-2 flex justify-center md:justify-start gap-2">
                                {content.genres?.map(g => (
                                    <span key={g.id} className="border border-gray-600 px-2 py-0.5 rounded-full text-xs hover:bg-white hover:text-black transition cursor-default">
                                        {g.name}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <p className="text-gray-300 text-sm md:text-lg leading-relaxed max-w-3xl mb-8 line-clamp-4 hover:line-clamp-none transition-all mx-auto md:mx-0">
                            {content.overview}
                        </p>

                        <div className="flex flex-wrap justify-center md:justify-start gap-3 md:gap-4">
                            {isAdded ? (
                                <button onClick={openModal} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 md:px-8 md:py-3 rounded-lg md:rounded-full font-bold text-sm md:text-lg transition flex items-center gap-2 shadow-lg hover:scale-105 transform">
                                    <span className="text-lg md:text-2xl">✎</span> Listeyi Düzenle
                                </button>
                            ) : (
                                <button onClick={openModal} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 md:px-8 md:py-3 rounded-lg md:rounded-full font-bold text-sm md:text-lg transition flex items-center gap-2 shadow-lg hover:scale-105 transform">
                                    <span className="text-lg md:text-2xl">+</span> Listeme Ekle
                                </button>
                            )}

                            {trailerKey && (
                                <button
                                    onClick={() => setShowTrailer(true)}
                                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 md:px-8 md:py-3 rounded-lg md:rounded-full font-bold text-sm md:text-lg transition flex items-center gap-2 shadow-lg hover:scale-105 transform"
                                >
                                    <FaYoutube className="text-lg md:text-2xl" />
                                    Fragman İzle
                                </button>
                            )}

                            <a
                                href={`https://www.hdfilmcehennemi.com/ara/?q=${encodeURIComponent(title)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2.5 md:px-8 md:py-3 rounded-lg md:rounded-full font-bold text-sm md:text-lg transition flex items-center gap-2 shadow-lg hover:scale-105 transform"
                            >
                                <FaPlay className="text-sm md:text-base" />
                                Hemen İzle
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* OYUNCU KADROSU */}
            <div className="p-8 max-w-[1920px] mx-auto">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                    <span className="text-yellow-500">🎭</span> Oyuncu Kadrosu
                </h2>

                {cast.length === 0 ? (
                    <p className="text-gray-500">Oyuncu bilgisi bulunamadı.</p>
                ) : (
                    <div className="flex gap-6 overflow-x-auto pb-8 custom-scrollbar scroll-smooth">
                        {cast.map((person, index) => {
                            const actorIdString = String(person.id);
                            const isFav = favActorIds.has(actorIdString);

                            // Sadece ilk oyuncu için log bas (Konsolu kilitlememek için)
                            if (index === 0) {
                                console.log(`🔍 Kontrol Ediliyor: ${person.name} (ID: ${actorIdString}) -> Favori mi? ${isFav}`);
                            }

                            return (
                                <div
                                    key={person.id}
                                    onClick={() => navigate(`/actor/${createSlug(person.id, person.name)}`)}
                                    className="min-w-[120px] w-[120px] md:min-w-[150px] md:w-[150px] cursor-pointer group"
                                >
                                    <div className={`w-full aspect-[2/3] rounded-xl overflow-hidden mb-3 ${isFav ? 'border-2 border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]' : 'border border-gray-800 group-hover:border-red-600'} transition shadow-lg relative`}>
                                        <img
                                            src={person.profile_path ? `https://image.tmdb.org/t/p/w200${person.profile_path}` : 'https://via.placeholder.com/200x300?text=No+Img'}
                                            alt={person.name}
                                            className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                                        />
                                    </div>
                                    <h3 className="text-white font-bold text-sm truncate group-hover:text-red-500 transition">{person.name}</h3>
                                    <p className="text-gray-400 text-xs truncate">{person.character}</p>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            <MovieModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                movie={content}
                onSave={saveMovie}
                initialData={initialModalData}
            />

            {/* TRAILER MODAL */}
            {showTrailer && trailerKey && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
                    <div className="relative w-full max-w-5xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-gray-800">
                        <button
                            onClick={() => setShowTrailer(false)}
                            className="absolute top-4 right-4 text-white bg-black/50 hover:bg-red-600 p-2 rounded-full transition-all z-10"
                        >
                            <FaTimes size={24} />
                        </button>
                        <iframe
                            src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&rel=0`}
                            title="Fragman"
                            className="w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        ></iframe>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ContentDetail;
