import { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import Header from '../components/Header.jsx';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import * as XLSX from 'xlsx'; // <--- 1. KÜTÜPHANE EKLENDİ

function Stats() {
    const [loading, setLoading] = useState(true);
    const [rawData, setRawData] = useState([]); // Excel için ham veri
    const [stats, setStats] = useState({
        totalMovies: 0,
        totalSeries: 0,
        totalEpisodes: 0,
        totalMinutes: 0,
        averageScore: 0,
        genreData: [],
        statusData: []
    });

    const user = auth.currentUser;

    const COLORS = ['#DC2626', '#EA580C', '#D97706', '#65A30D', '#059669', '#2563EB', '#7C3AED', '#DB2777'];

    useEffect(() => {
        const fetchStats = async () => {
            if (!user) return;

            const q = query(collection(db, "user_lists"), where("userId", "==", user.uid));
            const snapshot = await getDocs(q);
            const data = snapshot.docs.map(doc => doc.data());

            setRawData(data); // Excel için veriyi sakla

            let movieCount = 0;
            let seriesCount = 0;
            let episodeCount = 0;
            let totalMins = 0;
            let totalScore = 0;
            let scoredItemCount = 0;
            const genreMap = {};
            const statusMap = { 'watching': 0, 'planned': 0, 'completed': 0, 'dropped': 0 };

            data.forEach(item => {
                if (statusMap[item.status] !== undefined) statusMap[item.status]++;

                if (item.score) {
                    totalScore += item.score;
                    scoredItemCount++;
                }

                if (item.type === 'movie' || item.media_type === 'movie') {
                    if (item.status === 'completed') {
                        movieCount++;
                        totalMins += (item.runtime || 0);
                    }
                }
                else if (item.type === 'tv' || item.media_type === 'tv') {
                    // Sadece izlenmekte veya bitmiş dizileri say
                    if (item.status === 'watching' || item.status === 'completed') {
                        seriesCount++;
                    }
                    const watchedEps = item.currentEpisode || 0;
                    episodeCount += watchedEps;
                    totalMins += (watchedEps * 42);
                }

                if (item.genres) {
                    const genreList = typeof item.genres === 'string' ? item.genres.split(',') : item.genres;
                    genreList.forEach(g => {
                        const genreName = g.trim();
                        genreMap[genreName] = (genreMap[genreName] || 0) + 1;
                    });
                }
            });

            const genreChartData = Object.keys(genreMap)
                .map(key => ({ name: key, value: genreMap[key] }))
                .sort((a, b) => b.value - a.value)
                .slice(0, 6);

            const statusChartData = [
                { name: 'İzlenen', value: statusMap.watching },
                { name: 'İzlenecek', value: statusMap.planned },
                { name: 'Biten', value: statusMap.completed },
                { name: 'Ara Verilen', value: statusMap.dropped },
            ];

            setStats({
                totalMovies: movieCount,
                totalSeries: seriesCount,
                totalEpisodes: episodeCount,
                totalMinutes: totalMins,
                averageScore: scoredItemCount > 0 ? (totalScore / scoredItemCount).toFixed(1) : 0,
                genreData: genreChartData,
                statusData: statusChartData
            });

            setLoading(false);
        };

        fetchStats();
    }, [user]);

    // --- 2. EXCEL İNDİRME FONKSİYONU ---
    const exportToExcel = () => {
        // Veriyi Excel formatına uygun hale getir
        const excelData = rawData.map(item => ({
            "Başlık": item.title || item.name,
            "Tür": item.type === 'movie' ? 'Film' : 'Dizi',
            "Durum": item.status === 'watching' ? 'İzleniyor' : item.status === 'completed' ? 'Bitti' : item.status === 'planned' ? 'İzlenecek' : 'Ara Verildi',
            "Puanım": item.score || '-',
            "Sezon": item.currentSeason || '-',
            "Bölüm": item.currentEpisode || '-',
            "Yapım Yılı": (item.release_date || '').split('-')[0],
            "Eklenme Tarihi": item.addedAt ? new Date(item.addedAt.seconds * 1000).toLocaleDateString('tr-TR') : '-'
        }));

        // Çalışma Kitabı Oluştur
        const worksheet = XLSX.utils.json_to_sheet(excelData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "CineTrack Listem");

        // Sütun Genişliklerini Ayarla
        worksheet['!cols'] = [
            { wch: 30 }, // Başlık
            { wch: 10 }, // Tür
            { wch: 15 }, // Durum
            { wch: 10 }, // Puan
            { wch: 10 }, // Sezon
            { wch: 10 }, // Bölüm
            { wch: 15 }, // Yıl
            { wch: 15 }  // Tarih
        ];

        // Dosyayı İndir
        XLSX.writeFile(workbook, "CineTrack_Listem.xlsx");
    };

    const formatTime = (minutes) => {
        const days = Math.floor(minutes / (24 * 60));
        const hours = Math.floor((minutes % (24 * 60)) / 60);
        return `${days} Gün ${hours} Saat`;
    };

    return (
        <div className="bg-black min-h-screen text-white font-sans pb-20">

            <Header />

            {loading ? (
                <div className="text-center py-20 text-xl animate-pulse">Veriler Analiz Ediliyor...</div>
            ) : (
                <div className="p-8 max-w-[1600px] mx-auto">

                    {/* ÜST BAŞLIK VE İNDİR BUTONU */}
                    <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                        <div className="flex items-center gap-4">
                            <h2 className="text-2xl font-bold text-gray-300">İstatistik Paneli</h2>
                            <div className="flex items-end gap-1">
                                <span className="text-gray-400 text-sm mb-1">Ortalama Puan:</span>
                                <span className="text-xl font-bold text-yellow-500">{stats.averageScore}</span>
                            </div>
                        </div>
                        <button
                            onClick={exportToExcel}
                            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-xl font-bold transition flex items-center gap-2 shadow-lg shadow-green-900/20"
                        >
                            <span>📥</span> Excel Olarak İndir
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                        <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-2xl border border-gray-700 shadow-xl">
                            <h3 className="text-gray-400 text-sm uppercase tracking-widest mb-2">Toplam Ekran Süresi</h3>
                            <p className="text-3xl font-extrabold text-red-500">{formatTime(stats.totalMinutes)}</p>
                            <p className="text-xs text-gray-500 mt-2">({stats.totalMinutes.toLocaleString()} dakika)</p>
                        </div>

                        <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 shadow-lg">
                            <h3 className="text-gray-400 text-sm uppercase tracking-widest mb-2">Bitirilen Film</h3>
                            <p className="text-4xl font-bold text-white">{stats.totalMovies}</p>
                        </div>

                        <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 shadow-lg">
                            <h3 className="text-gray-400 text-sm uppercase tracking-widest mb-2">İzlenen Dizi Adedi</h3>
                            <p className="text-4xl font-bold text-white">{stats.totalSeries}</p>
                        </div>

                        <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 shadow-lg">
                            <h3 className="text-gray-400 text-sm uppercase tracking-widest mb-2">Toplam İzlenen Bölüm</h3>
                            <p className="text-4xl font-bold text-white">{stats.totalEpisodes}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                        <div className="bg-gray-900 p-8 rounded-3xl border border-gray-800 shadow-xl">
                            <h3 className="text-xl font-bold mb-6 border-b border-gray-800 pb-4">Favori Türlerin</h3>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={stats.genreData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={100}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {stats.genreData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#111', borderColor: '#333', borderRadius: '10px' }}
                                            itemStyle={{ color: '#fff' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="flex flex-wrap gap-3 justify-center mt-4">
                                {stats.genreData.map((entry, index) => (
                                    <div key={index} className="flex items-center gap-2 text-xs text-gray-300 bg-black/30 px-3 py-1 rounded-full">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                        {entry.name} ({entry.value})
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-gray-900 p-8 rounded-3xl border border-gray-800 shadow-xl">
                            <h3 className="text-xl font-bold mb-6 border-b border-gray-800 pb-4">Liste Durumu</h3>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={stats.statusData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                        <XAxis dataKey="name" stroke="#888" tick={{ fontSize: 12 }} />
                                        <YAxis stroke="#888" />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#111', borderColor: '#333', borderRadius: '10px' }}
                                            cursor={{ fill: '#ffffff10' }}
                                        />
                                        <Bar dataKey="value" fill="#EA580C" radius={[10, 10, 0, 0]} barSize={50} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <p className="text-center text-gray-500 text-sm mt-4">Listenizdeki içeriklerin durum dağılımı.</p>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
}

export default Stats;