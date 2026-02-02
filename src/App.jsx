import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { Toaster } from 'react-hot-toast';
import Footer from './components/Footer.jsx';
import MobileNavbar from './components/MobileNavbar.jsx';
import NewSeasonChecker from './components/NewSeasonChecker.jsx'; // <--- YENİ BİLEŞEN

import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Search from './pages/Search.jsx';
import Stats from './pages/Stats.jsx';
import SharedList from './pages/SharedList.jsx';
import Actors from './pages/Actors.jsx';
import ActorDetail from './pages/ActorDetail.jsx';
import ContentDetail from './pages/ContentDetail.jsx'; // <--- YENİ İMPORT // <--- YENİ SAYFA // <--- YENİ

import ScrollToTop from './components/ScrollToTop.jsx';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <div className="text-white text-center mt-20">Yükleniyor...</div>;

  return (
    <BrowserRouter>
      <ScrollToTop />
      <NewSeasonChecker /> {/* <--- AKTİF EDİLDİ */}
      <div className="bg-black min-h-screen text-white flex flex-col">
        <Toaster
          position="top-center"
          reverseOrder={false}
          toastOptions={{
            style: { background: '#1F2937', color: '#fff', border: '1px solid #374151' },
            success: { iconTheme: { primary: '#EF4444', secondary: 'white' } },
          }}
        />

        <div className="md:hidden">
          <MobileNavbar />
        </div>

        <div className="flex-grow">
          <Routes>
            <Route path="/" element={user ? <Home /> : <Navigate to="/login" />} />
            <Route path="/search" element={user ? <Search /> : <Navigate to="/login" />} />
            <Route path="/stats" element={user ? <Stats /> : <Navigate to="/login" />} />
            <Route path="/actors" element={user ? <Actors /> : <Navigate to="/login" />} />
            <Route path="/actor/:id" element={user ? <ActorDetail /> : <Navigate to="/login" />} />
            <Route path="/details/:type/:id" element={user ? <ContentDetail /> : <Navigate to="/login" />} /> {/* <--- YENİ ROTA */}

            {/* HERKESE AÇIK PAYLAŞIM ROTASI */}
            <Route path="/share/:userId" element={<SharedList />} />

            <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
            <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />
          </Routes>
        </div>

        {/* Footer sadece giriş yapmışsa veya paylaşım sayfasında değilse görünsün istenebilir ama şimdilik kalsın */}
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;