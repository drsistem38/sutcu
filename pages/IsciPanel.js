// src/pages/IsciPanel.js (Dinamik Fiyat Entegrasyonu Yapıldı)

import React, { useState, useEffect } from 'react'; 
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import useFirestoreCollection from '../hooks/useFirestoreCollection';
import { db } from '../firebaseConfig';
import { 
    collection, 
    addDoc, 
    doc, 
    onSnapshot // Firestore Document işlemleri için eklendi
} from 'firebase/firestore'; 

// ----------------------------------------------------------------------
// DAHİLİ ÖZEL KANCA: useFirestoreDocument
// Fiyat bilgisini tek bir Firebase belgesinden çekmek için buraya eklendi.
// Eğer src/hooks/ klasörünüzde useFirestoreDocument.js dosyasını zaten oluşturduysanız, 
// BU KISMI SİLİP sadece import'u kullanabilirsiniz. (Tek dosya tutarlılığı için burada bırakıldı.)
const useFirestoreDocument = (collectionName, documentId) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!collectionName || !documentId) {
            setData(null);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        const docRef = doc(db, collectionName, documentId);

        const unsubscribe = onSnapshot(docRef, (docSnapshot) => {
            if (docSnapshot.exists()) {
                setData(docSnapshot.data());
            } else {
                setData(null);
            }
            setLoading(false);
        }, (err) => {
            console.error("Firestore Belge çekilirken hata:", err);
            setError(err.message);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [collectionName, documentId]);

    return { data, loading, error };
};
// ----------------------------------------------------------------------


// --- Ana Bileşen: İşçi Paneli ---
const IsciPanelComponent = () => {
    const { currentUser } = useAuth();
    const isciId = currentUser ? currentUser.uid : null;

    // 1. Üretici Verilerini Çekme (Mevcut Kanca)
    const collectionConstraints = isciId ? [['assigned_isci_id', '==', isciId]] : [];
    const { 
        data: assignedProducers, 
        loading: producersLoading, 
        error: producersError 
    } = useFirestoreCollection('uretici', collectionConstraints);
    
    // 2. Fiyat Ayarlarını Çekme (Yeni Kanca)
    // Firebase'de 'settings' koleksiyonunda 'milkPriceConfig' id'li belgeyi arar.
    const { 
        data: priceConfig, 
        loading: priceLoading, 
        error: priceError 
    } = useFirestoreDocument('settings', 'milkPriceConfig');

    // Fiyatı belirle: Eğer belge yüklenmişse fiyatı al, yoksa/hata varsa 0.00 kullan (Güvenlik)
    const MILK_PRICE_PER_LITER = priceConfig?.price || 0.00; 

    const [selectedProducerId, setSelectedProducerId] = useState('');
    const [quantity, setQuantity] = useState('');
    const [submitLoading, setSubmitLoading] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
        
    const [currentDateTime, setCurrentDateTime] = useState('');

    // Anlık Türkiye tarih ve saatini güncel olarak gösteren efekt.
    useEffect(() => {
        const options = {
            year: 'numeric', month: 'long', day: 'numeric', 
            hour: '2-digit', minute: '2-digit', second: '2-digit', 
            timeZone: 'Europe/Istanbul'
        };
                
        const updateTime = () => {
            const date = new Date();
            const trDateTime = date.toLocaleString('tr-TR', options);
            setCurrentDateTime(trDateTime);
        };

        updateTime();
        const intervalId = setInterval(updateTime, 1000);

        return () => clearInterval(intervalId);
    }, []); 

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitError('');
        setSuccessMessage('');

        if (MILK_PRICE_PER_LITER === 0.00) {
            setSubmitError('Hata: Süt fiyatı henüz sistemden çekilemedi. Lütfen sayfayı yenileyin veya Admin ile görüşün.');
            return;
        }

        if (!selectedProducerId) {
            setSubmitError('Lütfen kayıt yapacağınız üreticiyi seçiniz.');
            return;
        }
        if (!quantity || isNaN(parseFloat(quantity)) || parseFloat(quantity) <= 0) {
            setSubmitError('Lütfen geçerli bir süt miktarı girin.');
            return;
        }

        setSubmitLoading(true);
        const producerName = assignedProducers.find(p => p.id === selectedProducerId)?.name || 'Bilinmeyen Üretici';

        try {
            await addDoc(collection(db, 'toplamalar'), {
                uretici_id: selectedProducerId,
                isci_id: isciId,
                date: new Date(), 
                quantity_lt: parseFloat(quantity),
                // DİNAMİK FİYAT KULLANILDI
                price_per_lt: MILK_PRICE_PER_LITER, 
                is_paid: false, 
            });
                        
            setSuccessMessage(`${producerName} için ${quantity} Litre süt kaydı başarıyla yapıldı.`);
            setQuantity('');
        } catch (err) {
            console.error("Toplama kaydı yapılırken hata:", err);
            setSubmitError('Hata: Kayıt yapılamadı. Lütfen tekrar deneyin.');
        } finally {
            setSubmitLoading(false);
        }
    };


    // Yükleme ve Hata Kontrolleri Birleştirildi
    if (!isciId) return <Layout><p>Kullanıcı bilgisi yükleniyor...</p></Layout>;
    if (producersLoading || priceLoading) return <Layout><p>Veriler Yükleniyor... (Üreticiler ve Fiyat)</p></Layout>;
    if (producersError || priceError) return (
        <Layout>
             <p style={{ color: 'red' }}>Hata: Veri çekilemedi.
                {producersError && ` (Üretici Hatası: ${producersError.message || producersError}) `} 
                {priceError && ` (Fiyat Hatası: ${priceError.message || priceError})`}
             </p>
        </Layout>
    );
    // Güvenlik amaçlı ek kontrol: Fiyat 0 ise uyar
    if (MILK_PRICE_PER_LITER === 0.00) return (
         <Layout>
            <p style={{ color: 'orange', textAlign: 'center', fontWeight: 'bold' }}>
                UYARI: Sistemden güncel süt fiyatı çekilemiyor. Kayıt yapmadan önce lütfen Admin ile görüşün.
            </p>
         </Layout>
    );


    return (
        <Layout>
            <h1>İşçi Paneli - Süt Toplama Kaydı</h1>
            <p>Hoş geldiniz, **{currentUser.email}**! Lütfen size atanan üreticileri seçerek süt toplama kaydını yapın.</p>

            <div style={panelStyles.formContainer}>
                {assignedProducers.length === 0 ? (
                    <p style={panelStyles.infoBox}>
                        Size atanmış herhangi bir üretici bulunmamaktadır. Lütfen Admin/İşveren ile görüşün.
                    </p>
                ) : (
                    <form onSubmit={handleSubmit} style={formStyles.form}>
                        <h3>Yeni Toplama Kaydı Girişi</h3>
                        
                        {/* Anlık Tarih/Saat Gösterimi */}
                        <div style={formStyles.dateBox}>
                            <strong>Kayıt Tarihi ve Saati:</strong> {currentDateTime}
                            <span style={{fontSize: '0.8em', color: '#666'}}> (Kayıt anında Türkiye saati ile otomatik kaydedilecektir.)</span>
                        </div>
                        
                        {submitError && <p style={formStyles.error}>{submitError}</p>}
                        {successMessage && <p style={formStyles.success}>{successMessage}</p>}
                        
                        {/* 1. Üretici Seçimi (Açılır Liste) */}
                        <select 
                            value={selectedProducerId} 
                            onChange={(e) => setSelectedProducerId(e.target.value)}
                            style={formStyles.input}
                            required
                        >
                            <option value="">-- Kayıt Yapılacak Üreticiyi Seçin --</option>
                            {assignedProducers.map(producer => ( 
                                <option key={producer.id} value={producer.id}>
                                    {producer.name} ({producer.address ? producer.address.substring(0, 20) : 'Adres Yok'})
                                </option>
                            ))}
                        </select>

                        {/* 2. Süt Miktarı */}
                        <input 
                            type="number" 
                            step="0.01"
                            placeholder="Süt Miktarı (Litre)" 
                            value={quantity} 
                            onChange={(e) => setQuantity(e.target.value)}
                            style={formStyles.input}
                            required
                        />

                        {/* Fiyat Bilgisi (Dinamik ve Görünür) */}
                        <div style={formStyles.infoBox}>
                            <p>
                                <strong>Litre Fiyatı:</strong> ₺{MILK_PRICE_PER_LITER.toFixed(2)} 
                                <span style={{fontSize: '0.9em', color: '#007bff'}}> (Admin tarafından belirlenmiştir.)</span>
                            </p>
                        </div>
                        
                        <button type="submit" disabled={submitLoading} style={formStyles.button}>
                            {submitLoading ? 'Kaydediliyor...' : 'Toplama Kaydını Yap'}
                        </button>
                    </form>
                )}
            </div>
        </Layout>
    );
};

// Stil objeleri (Değiştirilmedi)
const panelStyles = {
    formContainer: {
        maxWidth: '500px',
        margin: '30px auto',
        padding: '30px',
        border: '1px solid #ccc',
        borderRadius: '8px',
        backgroundColor: '#f9f9f9',
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
    },
    infoBox: {
        marginTop: '20px', 
        padding: '15px', 
        border: '1px dashed orange', 
        color: 'orange',
        textAlign: 'center'
    }
};

const formStyles = {
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '15px',
        marginTop: '20px'
    },
    input: {
        padding: '12px',
        borderRadius: '4px',
        border: '1px solid #ccc',
        fontSize: '16px'
    },
    button: {
        padding: '12px',
        borderRadius: '4px',
        border: 'none',
        backgroundColor: '#007bff', 
        color: 'white',
        cursor: 'pointer',
        fontSize: '18px',
        fontWeight: 'bold'
    },
    dateBox: { 
        padding: '10px',
        backgroundColor: '#e9ecef',
        borderRadius: '4px',
        border: '1px solid #dee2e6',
        fontSize: '0.9em'
    },
    infoBox: { 
        padding: '10px',
        border: '1px solid #007bff',
        borderRadius: '4px',
        backgroundColor: '#eaf5ff',
        textAlign: 'center'
    },
    error: {
        color: 'red',
        textAlign: 'center',
        fontWeight: 'bold'
    },
    success: {
        color: 'green',
        textAlign: 'center',
        fontWeight: 'bold'
    }
};

export default IsciPanelComponent;