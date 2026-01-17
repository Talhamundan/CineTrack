import { useEffect, useState } from 'react';
import { getMovieDetail, getTVDetail, getWatchProviders } from '../services/api';

function ContentDetails({ id, type }) {
  const [details, setDetails] = useState(null);
  const [providers, setProviders] = useState([]); // Platform logoları için state

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        // 1. Detayları Çek (Süre, Yıl vs.)
        if (type === 'tv') {
          const data = await getTVDetail(id);
          const startYear = (data.first_air_date || '').split('-')[0];
          const endYear = (data.last_air_date || '').split('-')[0];
          const yearDisplay = data.status === 'Ended' || data.status === 'Canceled' 
            ? `${startYear}-${endYear}` 
            : `${startYear}-`;
          setDetails(`${yearDisplay} • ${data.number_of_seasons} Sezon`);
        } else {
          const data = await getMovieDetail(id);
          const hours = Math.floor(data.runtime / 60);
          const minutes = data.runtime % 60;
          const year = (data.release_date || '').split('-')[0];
          setDetails(`${year} • ${hours}s ${minutes}dk`);
        }

        // 2. Platformları Çek (Netflix, Disney+ vs.)
        const watchData = await getWatchProviders(id, type);
        setProviders(watchData ? watchData.slice(0, 3) : []); // En fazla 3 logo göster (Tasarım bozulmasın)

      } catch (error) {
        setDetails('');
      }
    };

    fetchDetails();
  }, [id, type]);

  if (!details) return <span className="text-xs text-gray-500 animate-pulse">Yükleniyor...</span>;

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Detay Bilgisi */}
      <span className="text-sm text-gray-200 font-semibold bg-gray-800/80 px-3 py-1 rounded border border-gray-600">
        {details}
      </span>

      {/* Platform Logoları (Varsa Göster) */}
      {providers.length > 0 && (
        <div className="flex gap-2 mt-1 bg-white/10 p-1.5 rounded-full">
            {providers.map((provider) => (
                <img 
                    key={provider.provider_id} 
                    src={`https://image.tmdb.org/t/p/original${provider.logo_path}`} 
                    alt={provider.provider_name} 
                    title={provider.provider_name}
                    className="w-6 h-6 rounded-full object-cover border border-white/20 shadow-sm"
                />
            ))}
        </div>
      )}
    </div>
  );
}

export default ContentDetails;