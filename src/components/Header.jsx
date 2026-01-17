import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { Link, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';

function Header() {
  const user = auth.currentUser;
  const location = useLocation();

  // PAYLAŞMA FONKSİYONU
  const handleShare = () => {
    if (!user) return;
    const shareUrl = `${window.location.origin}/share/${user.uid}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success("Profil linkin kopyalandı! Arkadaşına gönder.", {
      icon: '🔗',
      style: { background: '#333', color: '#fff' },
      duration: 4000
    });
  };

  return (
    <header className="flex flex-col md:flex-row justify-between items-center p-6 border-b border-gray-800 bg-black/95 sticky top-0 z-50 backdrop-blur-sm">

      {/* LOGO */}
      <Link to="/" className="text-4xl font-extrabold text-red-600 tracking-tighter hover:scale-105 transition mb-4 md:mb-0">
        CineTrack
      </Link>

      <div className="flex items-center gap-6">

        {/* SOL TARAFTA TEK BAŞINA: YENİ EKLE / LİSTEME DÖN */}
        {location.pathname === '/search' ? (
          <Link to="/" className="text-gray-400 hover:text-white font-bold text-lg transition flex items-center gap-2">
            <span>🏠</span> Listem
          </Link>
        ) : (
          <Link to="/search" className="bg-red-600 hover:bg-red-700 px-5 py-2 rounded-full font-bold text-white transition flex items-center gap-2 shadow-lg hover:scale-105">
            <span>+</span> Yeni Ekle
          </Link>
        )}

        {/* OYUNCULAR (YENİ YERİ) */}
        {location.pathname === '/actors' ? (
          <Link to="/" className="text-gray-400 hover:text-white font-bold text-lg transition flex items-center gap-2">
            <span>🏠</span> Listem
          </Link>
        ) : (
          <Link
            to="/actors"
            className={`font-bold text-base transition flex items-center gap-2 ${location.pathname === '/actors' ? 'text-white' : 'text-gray-400 hover:text-white'}`}
          >
            <span>🌟</span> <span className="hidden sm:inline">Oyuncular</span>
          </Link>
        )}

        {/* SAĞ TARAF (ÇİZGİNİN SAĞI): ARAÇLAR + HESAP */}
        <div className="flex items-center gap-6 border-l border-gray-700 pl-6 ml-2">

          {/* İSTATİSTİKLER (Küçültüldü ve Sağa Alındı) */}
          {location.pathname === '/stats' ? (
            <Link to="/" className="text-gray-400 hover:text-white font-bold text-base transition flex items-center gap-2">
              <span>🏠</span> <span className="hidden sm:inline">Listem</span>
            </Link>
          ) : (
            <Link
              to="/stats"
              className={`font-bold text-base transition flex items-center gap-2 ${location.pathname === '/stats' ? 'text-white' : 'text-gray-400 hover:text-white'}`}
            >
              <span>📊</span> <span className="hidden sm:inline">İstatistikler</span>
            </Link>
          )}

          {/* OYUNCULAR (YENİ) */}


          {/* PAYLAŞ (Küçültüldü ve Sağa Alındı) */}
          <button
            onClick={handleShare}
            className="text-gray-400 hover:text-white font-bold text-base transition flex items-center gap-2"
            title="Listeni Paylaş"
          >
            <span>🔗</span> <span className="hidden sm:inline">Paylaş</span>
          </button>

          {/* HESAP ADI */}
          <div className="text-right hidden lg:block">
            <p className="text-xs text-gray-500">Hesap</p>
            <p className="text-sm font-bold text-white">{user?.email?.split('@')[0]}</p>
          </div>

          {/* ÇIKIŞ */}
          <button
            onClick={() => signOut(auth)}
            className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm transition border border-gray-700"
          >
            Çıkış
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;