import { useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { getTVDetail } from '../services/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';

const NewSeasonChecker = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (!user) return;

            // Rate Limit Check (Günde 1 kez)
            const today = new Date().toDateString();
            const lastCheck = localStorage.getItem('lastSeasonCheckDate');
            if (lastCheck === today) return;

            console.log("🔍 Yeni sezon kontrolü başlatılıyor...");

            try {
                // 1. Kullanıcının "Bitirdiği" (completed) Dizileri Çek
                const q = query(
                    collection(db, "user_lists"),
                    where("userId", "==", user.uid),
                    where("type", "==", "tv"),
                    where("status", "==", "completed")
                );

                const snapshot = await getDocs(q);
                let updatesFound = false;

                for (const document of snapshot.docs) {
                    const data = document.data();
                    const docId = document.id;
                    const tmdbId = data.tmdbId || data.id;

                    // Veritabanındaki kayıtlı sezon sayısı (Yoksa 0 varsay)
                    const localSeasons = data.total_seasons || 0;

                    try {
                        // 2. API'den Güncel Bilgiyi Al
                        const apiData = await getTVDetail(tmdbId);
                        const apiSeasons = apiData.number_of_seasons;

                        // 3. Karşılaştırma Yap
                        if (apiSeasons > localSeasons) {
                            console.log(`✨ Yeni Sezon Tespit Edildi: ${data.title} (${localSeasons} -> ${apiSeasons})`);

                            if (localSeasons === 0) {
                                // İlk kez senkronize ediliyorsa kullanıcıyı rahatsız etme, sessizce güncelle
                                await updateDoc(doc(db, "user_lists", docId), {
                                    total_seasons: apiSeasons
                                });
                            } else {
                                // BİLDİRİM GÖNDER
                                toast((t) => (
                                    <div className="flex flex-col gap-2 min-w-[250px]">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xl">📢</span>
                                            <div>
                                                <h4 className="font-bold text-white text-sm">Yeni Sezon Müjdesi!</h4>
                                                <p className="text-gray-300 text-xs">
                                                    <span className="text-yellow-500 font-bold">{data.title}</span> için {apiSeasons}. sezon yayınlandı.
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={async () => {
                                                toast.dismiss(t.id);
                                                // Durumu "İzlenecek" (planned) yap ve detay sayfasına git
                                                await updateDoc(doc(db, "user_lists", docId), {
                                                    status: 'planned',
                                                    total_seasons: apiSeasons,
                                                    updatedAt: new Date()
                                                });
                                                navigate(`/details/tv/${tmdbId}`);
                                            }}
                                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded text-xs font-bold transition flex items-center justify-center gap-2 mt-1"
                                        >
                                            <span>Listeme Ekle & İncele</span>
                                        </button>
                                    </div>
                                ), {
                                    duration: 8000,
                                    position: 'top-right',
                                    style: {
                                        background: '#111827',
                                        border: '1px solid #374151',
                                        color: '#fff',
                                    }
                                });

                                // Tekrar tekrar uyarmamak için veritabanını güncelle
                                // Not: Kullanıcı bildirime tıklamasa bile sezon sayısını güncelliyoruz ki
                                // sayfa her yenilendiğinde aynı bildirim çıkmasın.
                                await updateDoc(doc(db, "user_lists", docId), {
                                    total_seasons: apiSeasons
                                });
                                updatesFound = true;
                            }
                        }
                    } catch (err) {
                        console.error(`Dizi kontrol hatası (${data.title}):`, err);
                    }
                }

                // Kontrol tarihini güncelle
                localStorage.setItem('lastSeasonCheckDate', today);
                if (updatesFound) console.log("✅ Yeni sezon kontrolleri tamamlandı ve güncellemeler yapıldı.");

            } catch (error) {
                console.error("Genel sezon kontrol hatası:", error);
            }
        });

        return () => unsubscribe();
    }, [navigate]);

    return null; // Görsel bir şey render etmez
};

export default NewSeasonChecker;
