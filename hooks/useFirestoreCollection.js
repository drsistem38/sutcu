// src/hooks/useFirestoreCollection.js

import { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { 
    collection, 
    onSnapshot, 
    query, 
    where // <--- BURASI KRİTİK! ARTIK WHERE DOĞRU İMPORT EDİLDİ
} from 'firebase/firestore'; 

// Hook: Firestore'dan gerçek zamanlı veri çeker
const useFirestoreCollection = (collectionName, queryConstraints = []) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Kısıtlamalar değiştiğinde useEffect'i tekrar tetiklemek için JSON.stringify kullanacağız
    const constraintsString = JSON.stringify(queryConstraints);

    useEffect(() => {
        setLoading(true);
        setError(null);
        
        const collectionRef = collection(db, collectionName);
        let q;
        
        // KRİTİK KONTROL: Eğer queryConstraints dizisi boş değilse, filtrelemeyi uygula
        if (queryConstraints && queryConstraints.length > 0) {
            
            // Dizi dizisi şeklindeki kısıtlamaları (ör: [['field', '==', 'value']])
            // Firestore'un beklediği 'where' objelerine dönüştürüyoruz.
            const firestoreConstraints = queryConstraints.map(constraint => {
                // Her constraint 3 elemanlı bir dizi olmalı: [alan, op, değer]
                if (constraint.length !== 3) {
                    console.error(`Hata: Geçersiz kısıtlama formatı: ${constraint}`);
                    // Hatalı kısıtlamayı atla
                    return null; 
                }
                // where fonksiyonunu doğru import ettiğimiz için artık kullanabiliriz.
                return where(constraint[0], constraint[1], constraint[2]);
            }).filter(c => c !== null); // Hatalı/boş kısıtlamaları filtrele

            // Eğer geçerli kısıtlama varsa, sorguya dahil et
            if (firestoreConstraints.length > 0) {
                 q = query(collectionRef, ...firestoreConstraints);
            } else {
                 // Kısıtlama olmasına rağmen geçerli bir filtre oluşmadıysa, tüm koleksiyonu çek
                 q = query(collectionRef);
            }

        } else {
            // Kısıtlama yoksa tüm koleksiyonu al (örn: Admin'in tüm üreticileri görmesi gibi)
            q = query(collectionRef);
        }

        // Gerçek zamanlı dinleyiciyi başlat
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const results = [];
            snapshot.forEach((doc) => {
                results.push({ 
                    id: doc.id,
                    ...doc.data() 
                });
            });
            
            setData(results);
            setLoading(false);
        }, (err) => {
            console.error("Firestore'dan veri çekilirken hata:", err);
            setError("Veri çekme hatası: " + err.message);
            setLoading(false);
        });

        // Temizleme fonksiyonu
        return () => unsubscribe();
    // Stringified constraints bağımlılık olarak kullanılıyor
    }, [collectionName, constraintsString]); 

    return { data, loading, error };
};

export default useFirestoreCollection;