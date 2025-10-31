// src/hooks/useFirestoreDocument.js
import { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { doc, onSnapshot } from 'firebase/firestore';

/**
 * Firestore'dan tek bir belgeyi gerçek zamanlı olarak çeken özel kanca.
 * @param {string} collectionName - Belgenin bulunduğu koleksiyon adı (örneğin: 'settings').
 * @param {string} documentId - Belgenin ID'si (örneğin: 'milkPriceConfig').
 * @returns {{data: Object, loading: boolean, error: string|null}}
 */
const useFirestoreDocument = (collectionName, documentId) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!collectionName || !documentId) {
            setError("Koleksiyon adı veya Belge ID'si belirtilmelidir.");
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        // Belge referansını oluştur
        const docRef = doc(db, collectionName, documentId);

        // Gerçek zamanlı dinleyiciyi başlat
        const unsubscribe = onSnapshot(docRef, (docSnapshot) => {
            if (docSnapshot.exists()) {
                setData({
                    id: docSnapshot.id,
                    ...docSnapshot.data()
                });
            } else {
                // Belge yoksa null döndür
                setData(null);
                // Belge bulunamadı hatası döndürülebilir
                // setError(`Belge bulunamadı: ${collectionName}/${documentId}`); 
            }
            setLoading(false);
        }, (err) => {
            console.error("Firestore Belge çekilirken hata:", err);
            setError("Veri çekme hatası: " + err.message);
            setLoading(false);
        });

        // Temizleme fonksiyonu
        return () => unsubscribe();
    }, [collectionName, documentId]);

    return { data, loading, error };
};

export default useFirestoreDocument;