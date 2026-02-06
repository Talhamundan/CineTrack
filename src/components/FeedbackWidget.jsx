import { useState } from 'react';
import { FaCommentDots, FaTimes, FaPaperPlane } from 'react-icons/fa';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';

const FeedbackWidget = ({ user }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    // Toggle modal
    const toggleModal = () => {
        setIsOpen(!isOpen);
        if (!isOpen) setMessage(''); // Reset text when opening?? Maybe better to keep draft. Let's reset on close if preferred, but user spec says "Success -> Clear input". I'll leave it as is for now or just clear on success.
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!message.trim()) {
            toast.error('Lütfen bir mesaj yazın.');
            return;
        }

        setLoading(true);

        try {
            await addDoc(collection(db, 'feedbacks'), {
                text: message,
                user_email: user?.email || 'Anonymous',
                user_uid: user?.uid || 'anonymous',
                page: window.location.pathname,
                created_at: serverTimestamp(),
            });

            toast.success('Mesajınız geliştiriciye iletildi! 🚀');
            setMessage('');
            setIsOpen(false);
        } catch (error) {
            console.error('Feedback error:', error);
            toast.error('Bir hata oluştu. Lütfen tekrar deneyin.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Floating Button */}
            <button
                onClick={toggleModal}
                className="fixed bottom-20 md:bottom-6 right-6 z-50 bg-red-600 hover:bg-red-700 text-white w-14 h-14 rounded-full shadow-lg shadow-red-600/40 flex items-center justify-center transition-transform duration-300 hover:scale-110 active:scale-95 group"
                aria-label="Geri Bildirim"
            >
                <FaCommentDots className="text-2xl group-hover:animate-pulse" />
            </button>

            {/* Modal */}
            {isOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
                    {/* Overlay Click to Close */}
                    <div className="absolute inset-0" onClick={toggleModal}></div>

                    {/* Modal Card */}
                    <div className="relative w-full max-w-md bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl shadow-black overflow-hidden animate-scaleIn">

                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-white/5 bg-zinc-900/50">
                            <h3 className="text-white font-bold flex items-center gap-2">
                                <span className="text-xl">👨💻</span> Geliştiriciye Not
                            </h3>
                            <button
                                onClick={toggleModal}
                                className="text-gray-400 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
                            >
                                <FaTimes size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-5">
                            <p className="text-xs text-gray-400 mb-4">
                                Bir hata mı buldunuz veya bir öneriniz mi var? Yazın, geliştirelim.
                            </p>

                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Mesajınız..."
                                className="w-full bg-black/50 border border-zinc-700 focus:border-red-600 focus:ring-1 focus:ring-red-600 text-white rounded-xl p-3 min-h-[120px] outline-none transition-all placeholder-gray-600 resize-none"
                                disabled={loading}
                            />

                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="w-full bg-white text-black font-bold py-3 rounded-xl mt-4 hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <span>Gönder</span>
                                        <FaPaperPlane className="text-sm group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </div>

                    </div>
                </div>
            )}
        </>
    );
};

export default FeedbackWidget;
