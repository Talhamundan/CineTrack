import { useState } from 'react';
import { auth } from '../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      toast.success("Aramıza hoş geldin! 🎉");
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        toast.error("Bu e-posta zaten kullanımda.");
      } else if (err.code === 'auth/weak-password') {
        toast.error("Şifre en az 6 karakter olmalı.");
      } else {
        toast.error("Bir hata oluştu.");
      }
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black relative flex items-center justify-center overflow-hidden font-sans">
      
      {/* ARKA PLAN RESMİ */}
      <div 
        className="absolute inset-0 z-0 opacity-40 bg-cover bg-center"
        style={{ backgroundImage: "url('https://assets.nflxext.com/ffe/siteui/vlv3/f841d4c7-10e1-40af-bcae-07a3f8dc141a/f6d7434e-d6de-4185-a6d4-c77a2d08737b/TR-tr-20220502-popsignuptwoweeks-perspective_alpha_website_large.jpg')" }}
      ></div>
      
      {/* KARARTMA */}
      <div className="absolute inset-0 bg-black/60 z-0"></div>

      {/* LOGO */}
      <div className="absolute top-6 left-6 z-20">
        <h1 className="text-4xl font-extrabold text-red-600 tracking-tighter shadow-lg">CineTrack</h1>
      </div>

      {/* KAYIT FORMU */}
      <div className="relative z-10 w-full max-w-md bg-black/75 backdrop-blur-sm p-10 rounded-xl border border-gray-800 shadow-2xl">
        <h2 className="text-3xl font-bold text-white mb-8">Kayıt Ol</h2>

        <form onSubmit={handleRegister} className="flex flex-col gap-6">
          
          <div className="space-y-1">
            <input 
                type="email" 
                placeholder="E-posta adresi" 
                className="w-full bg-[#333] text-white p-4 rounded-lg outline-none focus:bg-[#444] border-b-2 border-transparent focus:border-red-600 transition"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
            />
          </div>

          <div className="space-y-1">
            <input 
                type="password" 
                placeholder="Parola oluştur" 
                className="w-full bg-[#333] text-white p-4 rounded-lg outline-none focus:bg-[#444] border-b-2 border-transparent focus:border-red-600 transition"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-lg transition mt-4 disabled:opacity-50"
          >
            {loading ? 'Hesap Oluşturuluyor...' : 'Üye Ol'}
          </button>
        </form>

        <div className="mt-10 text-gray-400 text-sm">
          <p>
            Zaten hesabın var mı?{' '}
            <Link to="/login" className="text-white hover:underline font-medium ml-1">
              Oturum aç.
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;