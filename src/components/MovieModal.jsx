import { useState, useEffect } from 'react';
import { getMovieDetail, getTVDetail, getTrailerKey, getCredits } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase'; // <--- DB EKLENDİ
import { deleteDoc, doc } from 'firebase/firestore'; // <--- FIRESTORE EKLENDİ
import toast from 'react-hot-toast'; // <--- TOAST EKLENDİ
import { createSlug } from '../utils';

function MovieModal({ isOpen, onClose, movie, onSave, initialData }) {
    const [status, setStatus] = useState('planned');
    const [score, setScore] = useState(null);
    const [review, setReview] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [currentSeason, setCurrentSeason] = useState(1);
    const [currentEpisode, setCurrentEpisode] = useState(1);
    const [trailerKey, setTrailerKey] = useState(null);
    const [showPlayer, setShowPlayer] = useState(false);
    const [cast, setCast] = useState([]);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setStatus(initialData.status);
                setScore(initialData.score);
                setReview(initialData.review || '');
                setCurrentSeason(initialData.currentSeason || 1);
                setCurrentEpisode(initialData.currentEpisode || 1);
            } else {
                setStatus('planned');
                setScore(null);
                setReview('');
                setCurrentSeason(1);
                setCurrentEpisode(1);
            }
            setIsLoading(false);
            setShowPlayer(false);
            setTrailerKey(null);
            setCast([]);
            setShowDeleteConfirm(false);

            const type = movie.media_type || movie.type || (movie.name ? 'tv' : 'movie');
            const id = movie.tmdbId || movie.id;

            getTrailerKey(id, type).then(setTrailerKey);
            getCredits(id, type).then(setCast);
        }
    }, [isOpen, initialData, movie]);

    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    // --- SİLME FONKSİYONU ---
    const handleDelete = async () => {
        if (!initialData?.docId) return;

        try {
            await deleteDoc(doc(db, "user_lists", initialData.docId));
            toast.success("Listeden çıkarıldı 👋", { icon: '🗑️', style: { background: '#333', color: '#fff' } });
            onClose();
        } catch (error) {
            console.error("Silme hatası:", error);
            toast.error("Silinirken bir hata oluştu.");
        }
    };

    // --- OYUNCUYA TIKLAMA FONKSİYONU ---
    // --- OYUNCUYA TIKLAMA FONKSİYONU ---
    const handleActorClick = (person) => {
        onClose();
        navigate(`/actor/${createSlug(person.id, person.name)}`);
    };

    const handleSubmit = async () => {
        setIsLoading(true);
        let extraData = {};

        if (!initialData) {
            try {
                const type = movie.media_type || movie.type || (movie.name ? 'tv' : 'movie');
                if (type === 'tv') {
                    const details = await getTVDetail(movie.tmdbId || movie.id);
                    extraData = {
                        type: 'tv',
                        total_seasons: details.number_of_seasons,
                        total_episodes: details.number_of_episodes,
                        status_original: details.status,
                        genres: details.genres.map(g => g.name)
                    };
                } else {
                    const details = await getMovieDetail(movie.tmdbId || movie.id);
                    extraData = {
                        type: 'movie',
                        runtime: details.runtime,
                        genres: details.genres.map(g => g.name)
                    };
                }
            } catch (error) { console.error("Detay hatası", error); }
        }

        onSave({
            tmdbId: movie.tmdbId || movie.id,
            title: movie.title || movie.name,
            overview: movie.overview,
            poster_path: movie.poster_path,
            vote_average: movie.vote_average,
            release_date: movie.release_date || movie.first_air_date,
            original_language: movie.original_language,
            status,
            score: (status === 'completed' || status === 'dropped') ? Number(score || 5) : null,
            review: review,
            currentSeason: (movie.type === 'tv' || movie.media_type === 'tv' || extraData.type === 'tv') ? Number(currentSeason) : null,
            currentEpisode: (movie.type === 'tv' || movie.media_type === 'tv' || extraData.type === 'tv') ? Number(currentEpisode) : null,
            ...extraData
        });

        setIsLoading(false);
        onClose();
    };

    const isTV = movie.type === 'tv' || movie.media_type === 'tv' || (initialData && initialData.type === 'tv');

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-gray-900 border border-gray-700 p-6 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto relative shadow-2xl custom-scrollbar">

                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white text-xl z-10">✕</button>

                {showPlayer && trailerKey ? (
                    <div className="flex flex-col h-full">
                        <h2 className="text-lg font-bold mb-4 text-white pr-8 truncate">Fragman: {movie.title || movie.name}</h2>
                        <div className="aspect-video w-full rounded-lg overflow-hidden bg-black">
                            <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&rel=0`} title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
                        </div>
                        <button onClick={() => setShowPlayer(false)} className="mt-4 w-full bg-gray-800 hover:bg-gray-700 text-white py-2 rounded-lg transition">Forma Geri Dön</button>
                    </div>
                ) : (
                    <>
                        <div className="flex justify-between items-start mb-1 pr-8">
                            <h2 className="text-xl font-bold text-white truncate">{movie.title || movie.name}</h2>
                        </div>

                        <div className="flex items-center justify-between mb-6">
                            <p className="text-xs text-gray-400 uppercase tracking-widest">{initialData ? 'Düzenle' : 'Listeye Ekle'}</p>
                            {trailerKey && (
                                <button onClick={() => setShowPlayer(true)} className="text-xs bg-red-600/20 text-red-500 hover:bg-red-600 hover:text-white px-3 py-1 rounded-full font-bold transition flex items-center gap-1"><span>▶</span> Fragman İzle</button>
                            )}
                        </div>

                        <div className="space-y-5">
                            <div>
                                <label className="block text-gray-300 text-sm font-bold mb-2">Durum</label>
                                <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full bg-gray-800 text-white border border-gray-600 rounded-lg p-3 outline-none">
                                    <option value="planned">📅 İzleyeceğim</option>
                                    <option value="watching">👀 İzliyorum</option>
                                    <option value="completed">✅ Bitirdim</option>
                                    <option value="dropped">⏸️ Ara Verilen</option>
                                </select>
                            </div>

                            {isTV && (status === 'watching' || status === 'dropped') && (
                                <div className="flex gap-4">
                                    <div className="flex-1"><label className="block text-gray-300 text-xs font-bold mb-2">Sezon</label><input type="number" min="1" value={currentSeason} onChange={(e) => setCurrentSeason(e.target.value)} className="w-full bg-gray-800 text-white border border-gray-600 rounded-lg p-3 outline-none" /></div>
                                    <div className="flex-1"><label className="block text-gray-300 text-xs font-bold mb-2">Bölüm</label><input type="number" min="1" value={currentEpisode} onChange={(e) => setCurrentEpisode(e.target.value)} className="w-full bg-gray-800 text-white border border-gray-600 rounded-lg p-3 outline-none" /></div>
                                </div>
                            )}

                            {(status === 'completed' || status === 'dropped') && (
                                <div className="animate-fade-in-down">
                                    <label className="block text-gray-300 text-sm font-bold mb-2">Puanın: <span className="text-red-500 ml-2">{score || 5}</span></label>
                                    <input type="range" min="1" max="10" step="1" value={score || 5} onChange={(e) => setScore(e.target.value)} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-red-600" />
                                </div>
                            )}

                            <div>
                                <label className="block text-gray-300 text-sm font-bold mb-2">Kişisel Notlar & İnceleme</label>
                                <textarea value={review} onChange={(e) => setReview(e.target.value)} placeholder="Bu film hakkında ne düşünüyorsun? Unutmamak için not al..." className="w-full bg-gray-800 text-white border border-gray-600 rounded-lg p-3 outline-none h-24 resize-none text-sm"></textarea>
                            </div>

                            <button onClick={handleSubmit} disabled={isLoading} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg mt-2 transition disabled:opacity-50">
                                {isLoading ? "İşleniyor..." : (initialData ? "Güncelle" : "Kaydet")}
                            </button>

                            {initialData && (
                                !showDeleteConfirm ? (
                                    <button
                                        onClick={() => setShowDeleteConfirm(true)}
                                        className="mt-3 w-full border border-red-600 text-red-600 py-3 rounded-xl font-semibold hover:bg-red-600 hover:text-white transition-colors flex items-center justify-center gap-2"
                                    >
                                        <span>🗑️</span> Listemden Kaldır
                                    </button>
                                ) : (
                                    <div className="flex flex-col gap-2 mt-3 animate-fade-in">
                                        <span className="text-sm text-center text-gray-400">Bu içerik listenizden silinecek?</span>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                onClick={() => setShowDeleteConfirm(false)}
                                                className="bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-xl font-semibold transition-colors"
                                            >
                                                Vazgeç
                                            </button>
                                            <button
                                                onClick={handleDelete}
                                                className="bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-semibold transition-colors"
                                            >
                                                Evet, Sil
                                            </button>
                                        </div>
                                    </div>
                                )
                            )}

                            {cast.length > 0 && (
                                <div className="pt-4 border-t border-gray-800 mt-4">
                                    <h3 className="text-gray-400 text-xs font-bold uppercase mb-3">Oyuncular</h3>
                                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                                        {cast.map((person) => (
                                            <div
                                                key={person.id}
                                                onClick={() => handleActorClick(person)} // <--- TIKLAMA OLAYI
                                                className="flex flex-col items-center min-w-[60px] cursor-pointer hover:scale-110 transition group"
                                            >
                                                <img
                                                    src={person.profile_path ? `https://image.tmdb.org/t/p/w200${person.profile_path}` : 'https://via.placeholder.com/200x300?text=No+Img'}
                                                    alt={person.name}
                                                    className="w-12 h-12 rounded-full object-cover border border-gray-700 group-hover:border-red-600"
                                                />
                                                <p className="text-[10px] text-gray-300 text-center mt-1 w-full truncate group-hover:text-white">{person.name}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}

            </div>
        </div>
    );
}

export default MovieModal;