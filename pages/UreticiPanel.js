// src/pages/UreticiPanel.js (TAM KOD - Üretici Paneli)

import React from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import useFirestoreCollection from '../hooks/useFirestoreCollection';
import { db } from '../firebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore'; 

const HakedisTakibi = () => {
    const { currentUser } = useAuth();
    const [producerData, setProducerData] = React.useState(null);
    const [toplamalar, setToplamalar] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);

    // 1. Üretici doküman ID'sini (uretici_id) bulma
    React.useEffect(() => {
        const fetchProducerInfo = async () => {
            if (!currentUser) return;

            try {
                // Giriş yapan kullanıcının UID'sine göre 'uretici' koleksiyonundan dokümanı çek
                const producersRef = collection(db, "uretici");
                const q = query(producersRef, where("user_uid", "==", currentUser.uid));
                
                const querySnapshot = await getDocs(q);
                
                if (!querySnapshot.empty) {
                    const doc = querySnapshot.docs[0];
                    setProducerData({ id: doc.id, ...doc.data() });
                } else {
                    setError("Hata: Üretici kaydı bulunamadı. Admin ile iletişime geçin.");
                }
            } catch (err) {
                console.error("Üretici bilgisi çekilirken hata:", err);
                setError(`Hata: Bilgiler çekilemedi. Lütfen izinleri (Rules) kontrol edin.`);
            } finally {
                setLoading(false);
            }
        };

        fetchProducerInfo();
    }, [currentUser]);

    // 2. Toplama kayıtlarını çekme (Üretici ID'ye göre)
    React.useEffect(() => {
        if (!producerData || !producerData.id) return;

        // useFirestoreCollection hook'unu bu kez manuel olarak uygulayalım
        const fetchToplamalar = async () => {
            setLoading(true);
            try {
                // İzinler (Rules) /toplamalar/{toplamaId} kuralına göre çalışmalıdır.
                // Bu kuralın doğru çalıştığından emin olmak için, sadece okuma yapıyoruz.
                // Firebase Rules: allow read: if getRole() == 'uretici' && isProducerOwner();
                
                const toplamalarRef = collection(db, "toplamalar");
                // Toplama kayıtlarını uretici_id'ye göre filtrele
                const q = query(toplamalarRef, where("uretici_id", "==", producerData.id));

                const querySnapshot = await getDocs(q);
                
                const fetchedToplamalar = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setToplamalar(fetchedToplamalar);

            } catch (err) {
                console.error("Toplama kayıtları çekilirken hata:", err);
                setError(`Hata: Veriler çekilemedi. Veri çekme hatası: ${err.message}.`);
            } finally {
                setLoading(false);
            }
        };

        fetchToplamalar();
    }, [producerData]);

    if (loading) return <p>Hakedişleriniz Yükleniyor...</p>;
    if (error) return <p style={{ color: 'red' }}>{error}</p>;

    // Hesaplamalar
    const totalQuantity = toplamalar.reduce((sum, item) => sum + (item.quantity_lt || 0), 0);
    const totalHakedis = toplamalar.reduce((sum, item) => sum + ((item.quantity_lt || 0) * (item.price_per_lt || 10)), 0);
    const totalPaid = toplamalar.filter(item => item.is_paid).reduce((sum, item) => sum + ((item.quantity_lt || 0) * (item.price_per_lt || 10)), 0);
    const totalPending = totalHakedis - totalPaid;

    return (
        <div style={panelStyles.container}>
            <h2>Genel Durum</h2>
            <div style={panelStyles.cardContainer}>
                <div style={panelStyles.card}>
                    <h3>Toplam Toplanan Süt</h3>
                    <p style={panelStyles.value}>{totalQuantity.toFixed(2)} Litre</p>
                </div>
                <div style={panelStyles.card}>
                    <h3>Toplam Hakediş Değeri</h3>
                    <p style={panelStyles.value}>{totalHakedis.toFixed(2)} ₺</p>
                </div>
                <div style={{...panelStyles.card, ...panelStyles.cardPaid}}>
                    <h3>Ödenen Miktar</h3>
                    <p style={panelStyles.value}>{totalPaid.toFixed(2)} ₺</p>
                </div>
                <div style={{...panelStyles.card, ...panelStyles.cardPending}}>
                    <h3>Ödenmeyi Bekleyen</h3>
                    <p style={panelStyles.value}>{totalPending.toFixed(2)} ₺</p>
                </div>
            </div>

            <h2 style={{marginTop: '40px'}}>Detaylı Toplama Kayıtları</h2>
            {toplamalar.length === 0 ? (
                <p>Size ait henüz bir süt toplama kaydı bulunmamaktadır.</p>
            ) : (
                <table style={panelStyles.table}>
                    <thead>
                        <tr>
                            <th style={panelStyles.th}>Tarih</th>
                            <th style={panelStyles.th}>Miktar (Lt)</th>
                            <th style={panelStyles.th}>Fiyat (Lt/₺)</th>
                            <th style={panelStyles.th}>Tutar (₺)</th>
                            <th style={panelStyles.th}>Durum</th>
                        </tr>
                    </thead>
                    <tbody>
                        {toplamalar.map((toplama) => {
                            const price = toplama.price_per_lt || 10;
                            const quantity = toplama.quantity_lt || 0;
                            const tutar = quantity * price;

                            return (
                                <tr key={toplama.id}>
                                    <td style={panelStyles.td}>{formatDate(toplama.date)}</td>
                                    <td style={panelStyles.td}>{quantity.toFixed(2)}</td>
                                    <td style={panelStyles.td}>{price.toFixed(2)}</td>
                                    <td style={panelStyles.td}>**{tutar.toFixed(2)}**</td>
                                    <td style={{...panelStyles.td, ...panelStyles.tdStatus(toplama.is_paid)}}>
                                        {toplama.is_paid ? 'Ödendi' : 'Bekliyor'}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            )}
        </div>
    );
};


const UreticiPanelComponent = () => {
    return (
        <Layout>
            <h1>Üretici Paneli - Hakediş Takibi</h1>
            <p>Süt toplamalarınızı ve ödeme durumlarını aşağıdan takip edebilirsiniz.</p>
            <HakedisTakibi />
        </Layout>
    );
};

// ... Stiller ve Yardımcı Fonksiyonlar
const formatDate = (timestamp) => {
    if (!timestamp || !timestamp.toDate) return 'Tarih Bilinmiyor';
    
    const date = timestamp.toDate();
    return date.toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const panelStyles = {
    container: {
        marginTop: '20px'
    },
    cardContainer: {
        display: 'flex',
        gap: '20px',
        marginTop: '10px',
        flexWrap: 'wrap'
    },
    card: {
        flex: '1',
        minWidth: '200px',
        padding: '20px',
        borderRadius: '8px',
        backgroundColor: '#fff',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
        textAlign: 'center'
    },
    cardPaid: {
        borderBottom: '4px solid #28a745'
    },
    cardPending: {
        borderBottom: '4px solid #ffc107'
    },
    value: {
        fontSize: '24px',
        fontWeight: 'bold',
        marginTop: '10px',
        color: '#007bff'
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        marginTop: '15px',
    },
    th: {
        border: '1px solid #dee2e6',
        padding: '12px',
        textAlign: 'left',
        backgroundColor: '#6c757d',
        color: 'white',
    },
    td: {
        border: '1px solid #dee2e6',
        padding: '10px',
        textAlign: 'left',
    },
    tdStatus: (isPaid) => ({
        fontWeight: 'bold',
        color: isPaid ? '#28a745' : '#dc3545',
        backgroundColor: isPaid ? '#e9f7ef' : '#f8e7e7',
        textAlign: 'center'
    })
};

export default UreticiPanelComponent;