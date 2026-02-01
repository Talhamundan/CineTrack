import { Link, useLocation } from 'react-router-dom';
import { FaHome, FaPlus, FaStar, FaChartPie } from 'react-icons/fa';

function MobileNavbar() {
    const location = useLocation();

    const navItems = [
        { path: '/', label: 'Listem', icon: <FaHome size={20} /> },
        { path: '/search', label: 'Yeni Ekle', icon: <FaPlus size={20} /> },
        { path: '/actors', label: 'Oyuncular', icon: <FaStar size={20} /> },
        { path: '/stats', label: 'İstatistikler', icon: <FaChartPie size={20} /> },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-lg border-t border-white/10 pb-[env(safe-area-inset-bottom)]">
            <div className="flex justify-around items-center py-3 pb-safe">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex flex-col items-center gap-1 transition-colors duration-200 ${isActive ? 'text-red-500' : 'text-gray-400 hover:text-gray-100'
                                }`}
                        >
                            <div className={`${isActive ? 'scale-110' : ''} transition-transform duration-200`}>
                                {item.icon}
                            </div>
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}

export default MobileNavbar;
