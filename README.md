# 🎬 CineTrack

**CineTrack**, film ve dizi tutkunları için geliştirilmiş modern, hızlı ve kullanıcı dostu bir takip uygulamasıdır. İzlediklerinizi listeleyin, favori oyuncularınızı takip edin ve izleme alışkanlıklarınızla ilgili detaylı istatistiklere ulaşın.

![CineTrack Banner](https://via.placeholder.com/1200x600?text=CineTrack+Preview)

## ✨ Özellikler

*   **🔍 Detaylı Arama ve Keşif:** TMDB altyapısı ile binlerce film, dizi ve oyuncu arasında anlık arama yapın.
*   **📋 Kişisel Listeler:** İzlediklerinizi, izleyeceklerinizi veya yarıda bıraktıklarınızı kategorize edin.
*   **📊 İstatistikler:** Toplam izleme süresi, en sevdiğiniz türler ve yıllara göre dağılım gibi detaylı grafiklerle profilinizi analiz edin.
*   **🌟 Oyuncu Takibi:** Sevdiğiniz oyuncuları favorilere ekleyin ve filmografilerine tek tıkla ulaşın.
*   **🔗 SEO Dostu Bağlantılar:** Paylaşılabilir, anlaşılır URL yapısı (`/actor/123-brad-pitt`).
*   **📱 Modern Arayüz:** Tailwind CSS ile tasarlanmış, tamamen duyarlı (responsive) ve şık "Glassmorphism" detayları.
*   **🔐 Güvenli:** Firebase Authentication ile güvenli giriş ve Firebase Firestore ile bulut tabanlı veri saklama.

## 🛠️ Teknolojiler

Bu proje aşağıdaki modern web teknolojileri kullanılarak geliştirilmiştir:

*   **Frontend:** [React](https://reactjs.org/), [Vite](https://vitejs.dev/)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
*   **Backend & Auth:** [Firebase](https://firebase.google.com/) (Firestore, Authentication)
*   **Veri Kaynağı:** [TMDB API](https://www.themoviedb.org/documentation/api)
*   **İkonlar:** Heroicons

## 🚀 Kurulum

Projeyi kendi bilgisayarınızda çalıştırmak için aşağıdaki adımları izleyin:

1.  **Projeyi Klonlayın:**
    ```bash
    git clone https://github.com/Talhamundan/CineTrack.git
    cd cinetrack
    ```

2.  **Bağımlılıkları Yükleyin:**
    ```bash
    npm install
    ```

3.  **Çevre Değişkenlerini Ayarlayın:**
    Proje ana dizininde `.env` dosyası oluşturun ve aşağıdaki anahtarları kendi API bilgilerinizle doldurun:

    ```env
    VITE_TMDB_API_KEY=senin_tmdb_api_keyin
    
    # Firebase Ayarları
    VITE_FIREBASE_API_KEY=senin_firebase_api_keyin
    VITE_FIREBASE_AUTH_DOMAIN=senin_project.firebaseapp.com
    VITE_FIREBASE_PROJECT_ID=senin_project_id
    VITE_FIREBASE_STORAGE_BUCKET=senin_project.firebasestorage.app
    VITE_FIREBASE_MESSAGING_SENDER_ID=senin_sender_id
    VITE_FIREBASE_APP_ID=senin_app_id
    ```

4.  **Uygulamayı Başlatın:**
    ```bash
    npm run dev
    ```

## 📝 Lisans

Bu proje MIT lisansı ile lisanslanmıştır. Detaylar için `LICENSE` dosyasına bakabilirsiniz.

---
*Keyifli Seyirler! 🍿*
