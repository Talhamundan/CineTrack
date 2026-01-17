import { useEffect, useState } from 'react';
import { getPersonCredits } from '../services/api';

function ActorModal({ isOpen, onClose, actor }) {
    const [credits, setCredits] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen && actor) {
            setLoading(true);
            getPersonCredits(actor.id).then(data => {
                setCredits(data);
                setLoading(false);
            });
        }
    }, [isOpen, actor]);

    if (!isOpen || !actor) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-gray-900 w-full max-w-4xl max-h-[90vh] rounded-3xl overflow-hidden shadow-2xl relative flex flex-col" onClick={e => e.stopPropagation()}>

                {/* KAPATMA BUTONU */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center bg-black/50 hover:bg-black rounded-full text-white transition font-bold"
                >
                    ✕
                </button>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-10">
                    {/* ÜST KISIM: PROFİL */}
                    <div className="flex flex-col md:flex-row gap-8 items-center md:items-start mb-8 border-b border-gray-800 pb-8">
                        <div className="w-40 h-40 md:w-56 md:h-56 rounded-full overflow-hidden border-4 border-yellow-500 shadow-xl flex-shrink-0">
                            <img
                                src={actor.profile_path ? `https://image.tmdb.org/t/p/w500${actor.profile_path}` : 'https://via.placeholder.com/500x500?text=No+Image'}
                                alt={actor.name}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="text-center md:text-left">
                            <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-2">{actor.name}</h2>
                            <p className="text-gray-400 text-lg">Bilinen Yapımlar</p>
                        </div>
                    </div>

                    {/* FİLMOGRAFİ */}
                    <h3 className="text-xl font-bold text-yellow-500 mb-6 flex items-center gap-2">
                        <span>🎬</span> Rol Aldığı Popüler Yapımlar
                    </h3>

                    {loading ? (
                        <div className="flex justify-center py-20">
                            <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : credits.length === 0 ? (
                        <div className="text-gray-500 text-center py-10">Kayıtlı yapım bulunamadı.</div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {credits.map(credit => (
                                <div key={credit.id} className="relative group rounded-xl overflow-hidden aspect-[2/3] bg-gray-800">
                                    <img
                                        src={credit.poster_path ? `https://image.tmdb.org/t/p/w200${credit.poster_path}` : 'https://via.placeholder.com/200x300'}
                                        alt={credit.title}
                                        className="w-full h-full object-cover group-hover:opacity-60 transition"
                                    />

                                    {/* TÜR ETİKETİ */}
                                    <div className="absolute top-2 right-2 bg-black/70 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                                        {credit.media_type === 'movie' ? 'FİLM' : 'DİZİ'}
                                    </div>

                                    <div className="absolute inset-0 flex flex-col justify-end p-2 md:p-3 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0">
                                        <p className="text-white font-bold text-xs md:text-sm leading-tight drop-shadow-md text-center">
                                            {credit.title}
                                        </p>
                                        {credit.character && (
                                            <p className="text-gray-300 text-[10px] text-center mt-1 truncate">
                                                {credit.character}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ActorModal;
