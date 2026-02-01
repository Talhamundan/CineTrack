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
    <header className="flex justify-between items-center px-4 py-3 md:p-6 border-b border-gray-800 bg-black/95 sticky top-0 z-50 backdrop-blur-sm">
      {/* LOGO */}
      <Link to="/" className="text-2xl md:text-4xl font-extrabold text-red-600 tracking-tighter hover:scale-105 transition flex-shrink-0">
        CineTrack
      </Link>

      <div className="flex items-center gap-6">

        {/* SOL TARAFTAKİ LİNKLERİ MOBİLDE GİZLE */}
        <div className="hidden md:flex items-center gap-6">
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
        </div>

        {/* SAĞ TARAF (ÇİZGİNİN SAĞI): ARAÇLAR + HESAP */}
        <div className="flex items-center gap-3 md:gap-6 md:border-l md:border-gray-700 md:pl-6 md:ml-2">

          {/* İSTATİSTİKLER (Küçültüldü ve Sağa Alındı) */}
          {/* İSTATİSTİKLER (Küçültüldü ve Sağa Alındı) - Mobilde Gizli */}
          <div className="hidden md:block">
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
          </div>

          {/* OYUNCULAR (YENİ) */}


          {/* PAYLAŞ (Küçültüldü ve Sağa Alındı) */}
          <button
            onClick={handleShare}
            className="text-gray-400 hover:text-white font-bold text-base transition flex items-center gap-2 p-2"
            title="Listeni Paylaş"
          >
            <span className="text-xl">🔗</span> <span className="hidden md:inline">Paylaş</span>
          </button>

          {/* HESAP ADI */}
          <div className="text-right hidden lg:block">
            <p className="text-xs text-gray-500">Hesap</p>
            <p className="text-sm font-bold text-white">{user?.email?.split('@')[0]}</p>
          </div>

          {/* ÇIKIŞ */}
          <button
            onClick={() => signOut(auth)}
            className="bg-gray-800 hover:bg-gray-700 text-white p-2 md:px-4 md:py-2 rounded-lg text-sm transition border border-gray-700 font-bold"
            title="Çıkış Yap"
          >
            <span className="md:hidden">🚪</span><span className="hidden md:inline">Çıkış</span>
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;