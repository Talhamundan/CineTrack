function DeleteModal({ isOpen, onClose, onConfirm }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4 backdrop-blur-sm transition-opacity">
      <div className="bg-gray-900 border border-gray-700 p-6 rounded-2xl w-full max-w-sm relative shadow-2xl transform scale-100 transition-transform">
        
        {/* Başlık ve İkon */}
        <div className="text-center mb-6">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-900/30 mb-4">
            <span className="text-2xl">🗑️</span>
          </div>
          <h3 className="text-xl font-bold text-white">Emin misin?</h3>
          <p className="text-sm text-gray-400 mt-2">
            Bu içeriği listenden silmek üzeresin. Bu işlem geri alınamaz.
          </p>
        </div>

        {/* Butonlar */}
        <div className="flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-semibold py-2.5 rounded-xl transition border border-gray-600"
          >
            İptal
          </button>
          <button 
            onClick={onConfirm}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 rounded-xl transition shadow-lg shadow-red-900/20"
          >
            Evet, Sil
          </button>
        </div>

      </div>
    </div>
  );
}

export default DeleteModal;