import React, { useState, useEffect, useContext, createContext } from 'react';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, query, getDocs } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';

// ----------------------------------------------------------------------
// GÜVENLİ GLOBAL DEĞİŞKEN OKUYUCU FONKSİYONLARI 
// ----------------------------------------------------------------------
/* eslint-disable no-undef */
const getFirebaseConfig = () => {
    try {
        // Global firebase config değişkenini JSON olarak parse et
        if (typeof __firebase_config !== 'undefined' && __firebase_config) {
            const config = JSON.parse(__firebase_config);
            if (config.apiKey && config.projectId) {
                return config;
            }
        }
    } catch (e) {
        console.warn("Could not parse __firebase_config or config is incomplete.", e);
    }
    return null;
};

const getInitialAuthToken = () => {
    // Global başlangıç kimlik doğrulama token'ını al
    if (typeof __initial_auth_token !== 'undefined') {
        return __initial_auth_token;
    }
    return null; 
};

/* eslint-enable no-undef */

const firebaseConfig = getFirebaseConfig();
const initialAuthToken = getInitialAuthToken();
const isConfigAvailable = firebaseConfig !== null; 

// Firestore koleksiyon yolları
const PRODUCER_COLLECTION = 'uretici'; 
const COLLECTION_RECORDS = 'toplamalar'; 

// ----------------------------------------------------------------------
// 1. AuthContext ve Hook (useAuth)
// ----------------------------------------------------------------------

const AuthContext = createContext({
    currentUser: null,
    db: null,
    loading: true,
    userId: null,
    isFirebaseReady: isConfigAvailable,
});

let appInstance = null;

if (isConfigAvailable) {
    try {
        appInstance = initializeApp(firebaseConfig);
    } catch (e) {
        // Firebase uygulamasının zaten başlatılmış olma durumunu ele alır
        if (!/already exists/.test(e.message)) {
            console.error("Firebase initialization error:", e);
        }
        appInstance = null;
    }
} 

const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [db, setDb] = useState(null);
    const [userId, setUserId] = useState(null);
    const isFirebaseReady = isConfigAvailable && appInstance != null;

    useEffect(() => {
        if (!isFirebaseReady) {
            // Config eksikse mock auth state kullan
            setCurrentUser({ uid: 'MOCK_USER_ID' });
            setUserId('MOCK_USER_ID');
            setLoading(false);
            return;
        }

        const auth = getAuth(appInstance);
        const firestoreDb = getFirestore(appInstance);
        setDb(firestoreDb);

        // Kimlik doğrulama dinleyicisi
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setCurrentUser(user);
                setUserId(user.uid);
                setLoading(false);
            } else {
                try {
                    // Oturum açmaya zorla: Ya token ile ya da anonim
                    if (initialAuthToken) {
                        const userCredential = await signInWithCustomToken(auth, initialAuthToken);
                        setCurrentUser(userCredential.user);
                        setUserId(userCredential.user.uid);
                    } else {
                        const userCredential = await signInAnonymously(auth);
                        setCurrentUser(userCredential.user);
                        setUserId(userCredential.user.uid);
                    }
                } catch (error) {
                    console.error("Auth sign-in failed:", error);
                    setCurrentUser(null);
                    setUserId(null);
                } finally {
                    setLoading(false);
                }
            }
        });

        return () => unsubscribe();
    }, [isFirebaseReady]); 

    const value = {
        currentUser,
        db,
        loading,
        userId,
        isFirebaseReady,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook
const useAuth = () => useContext(AuthContext);


// ----------------------------------------------------------------------
// MOCK (SAHTE) VERİLER 
// ----------------------------------------------------------------------
const MOCK_REPORT_DATA = [
    { id: 'mock-user-1', name: 'Ayşe Çiftçi (MOCK)', address: 'Kaya Pınar Köyü', totalMilk: 550, totalPayment: 2750.00, pendingPayment: 100.00 },
    { id: 'mock-user-2', name: 'Ali Üretici (MOCK)', address: 'Merkez', totalMilk: 820, totalPayment: 4100.00, pendingPayment: 0.00 },
    { id: 'mock-user-3', name: 'Veli Sütçü (MOCK)', address: 'Güney Mah.', totalMilk: 1200, totalPayment: 5950.00, pendingPayment: 50.00 },
];

const MOCK_METRICS = {
    totalUsers: MOCK_REPORT_DATA.length,
    totalMilk: MOCK_REPORT_DATA.reduce((sum, user) => sum + user.totalMilk, 0).toFixed(2), 
    totalPayment: MOCK_REPORT_DATA.reduce((sum, user) => sum + user.totalPayment, 0).toFixed(2), 
    pendingPayment: MOCK_REPORT_DATA.reduce((sum, user) => sum + user.pendingPayment, 0).toFixed(2) 
};


// ----------------------------------------------------------------------
// 2. Layout Component
// ----------------------------------------------------------------------
const Layout = ({ children }) => {
    const { currentUser, loading, isFirebaseReady } = useAuth();
    
    return (
        <div className="min-h-screen bg-gray-100 p-4 font-sans">
            <header className="bg-white shadow-md p-4 rounded-lg mb-4 flex justify-between items-center">
                <h1 className="text-xl font-bold text-indigo-700">Sütçü Yönetim Sistemi</h1>
                <div className="text-sm text-gray-600">
                    {loading ? (
                        <span className="text-yellow-600">Yükleniyor...</span>
                    ) : currentUser && currentUser.uid !== 'MOCK_USER_ID' ? (
                        <span className="text-green-600 font-medium">Hoş geldiniz, Kullanıcı ID: ({currentUser.uid.substring(0, 8)}...)</span>
                    ) : (
                        <span className="text-yellow-600 font-medium">ÇEVRİMDIŞI TEST MODU</span>
                    )}
                </div>
            </header>
            <main>{children}</main>
            {/* UYARI MESAJI GÜNCELLENDİ: Daha belirgin kırmızı hata çubuğu */}
            {!isFirebaseReady && (
                 <div className="fixed bottom-0 left-0 right-0 p-3 bg-red-700 text-white text-center font-bold text-sm z-50">
                     HATA: Firebase yapılandırması eksik. Gerçek veriler yüklenemedi, uygulama sahte (MOCK) veri ile çalışıyor.
                 </div>
            )}
        </div>
    );
};


// ----------------------------------------------------------------------
// 3. RaporlarView - Ana İş Mantığı
// ----------------------------------------------------------------------
const RaporlarView = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [reportData, setReportData] = useState([]); 
    const [metrics, setMetrics] = useState({}); 
    // Arama filtresi state'i
    const [searchTerm, setSearchTerm] = useState('');
    
    const { currentUser, db: firestoreDb, loading: authLoading, isFirebaseReady } = useAuth(); 

    // Veri çekme tetikleyicisi
    useEffect(() => {
        if (authLoading) return;
        
        // Eğer Firebase hazır değilse veya MOCK modundaysak, sahte veriyi yükle
        if (!isFirebaseReady || !currentUser || currentUser.uid === 'MOCK_USER_ID') {
            setReportData(MOCK_REPORT_DATA.map(p => ({
                ...p,
                totalMilk: p.totalMilk.toFixed(2), 
                totalPayment: p.totalPayment.toFixed(2), 
                pendingPayment: p.pendingPayment.toFixed(2)
            })));
            setMetrics(MOCK_METRICS);
            setLoading(false);
            if (!isFirebaseReady) {
                 setError("Firebase yapılandırması eksik: Gerçek veriler yüklenemedi.");
            } else if (currentUser.uid === 'MOCK_USER_ID') {
                setError("Oturum açılamadı, sahte veriler gösteriliyor.");
            }
            return;
        }

        // Firebase hazırsa ve kullanıcı girişi yapılmışsa (MOCK_USER_ID değilse) gerçek veriyi çek
        if (firestoreDb && currentUser) {
            fetchReports();
        } 
    }, [authLoading, currentUser, firestoreDb, isFirebaseReady]);


    // Gerçek Rapor verilerini çeker
    const fetchReports = async () => {
        setLoading(true);
        setError(null);

        try {
            // 1. Üretici Verilerini Çek
            const producerCollectionRef = collection(firestoreDb, PRODUCER_COLLECTION);
            const producerSnapshot = await getDocs(query(producerCollectionRef));
            
            const producersMap = {};
            producerSnapshot.forEach((doc) => {
                const data = doc.data();
                producersMap[doc.id] = { id: doc.id, name: data.name || 'Ad Bilgisi Yok', address: data.address || '', totalMilk: 0, totalPayment: 0, pendingPayment: 0, ...data };
            });
            
            // 2. Toplama Kayıtlarını Çek ve Raporları Hesapla
            const collectionRecordsRef = collection(firestoreDb, COLLECTION_RECORDS);
            const recordsSnapshot = await getDocs(query(collectionRecordsRef));
            
            let totalMilkGlobal = 0;
            let totalPaymentGlobal = 0;
            let pendingPaymentGlobal = 0;

            recordsSnapshot.forEach((doc) => {
                const data = doc.data();
                const producerId = data.uretici_id;
                // Verilerin sayı olduğundan emin ol
                const quantity = Number(data.quantity_lt || 0);
                const price = Number(data.price_per_lt || 0);
                const isPaid = data.is_paid === true || data.is_paid === 'true'; 
                const paymentDue = quantity * price;
                
                if (producerId && producersMap[producerId]) {
                    const producer = producersMap[producerId];
                    producer.totalMilk += quantity;
                    
                    // Ödeme durumuna göre toplam ve bekleyen hakları ayır
                    if (isPaid) {
                        producer.totalPayment += paymentDue;
                        totalPaymentGlobal += paymentDue;
                    } else {
                        producer.pendingPayment += paymentDue;
                        pendingPaymentGlobal += paymentDue;
                    }
                    totalMilkGlobal += quantity;
                } 
            });

            // 3. Sonuçları Ayarla
            const calculatedReportData = Object.values(producersMap).sort((a, b) => b.totalMilk - a.totalMilk);

            // Ondalık sayıları iki basamakla sınırla
            setReportData(calculatedReportData.map(p => ({
                ...p,
                totalMilk: p.totalMilk.toFixed(2),
                totalPayment: p.totalPayment.toFixed(2),
                pendingPayment: p.pendingPayment.toFixed(2)
            })));
            
            setMetrics({
                totalUsers: calculatedReportData.length,
                totalMilk: totalMilkGlobal.toFixed(2),
                totalPayment: totalPaymentGlobal.toFixed(2),
                pendingPayment: pendingPaymentGlobal.toFixed(2)
            });
            
        } catch (err) {
            console.error("Rapor verisi çekilirken hata oluştu:", err);
            
            let friendlyError = "Rapor verileri yüklenirken bir sorun oluştu. Detaylar için konsola bakın.";
            if (err.code === 'permission-denied') {
                friendlyError = "Güvenlik İzni Reddedildi (Permission Denied). Oturum açmış olmanıza rağmen, gerekli okuma izinlerine sahip değilsiniz. Lütfen Firebase Güvenlik Kurallarınızı kontrol edin.";
            } else if (err.code === 'not-found') {
                friendlyError = "Koleksiyonlar bulunamadı. Lütfen koleksiyon isimlerinin doğru olduğundan emin olun.";
            } else {
                friendlyError = `Bilinmeyen Hata: ${err.message}`;
            }
                
            setError(friendlyError);
            
            // Hata durumunda MOCK veriyi göster
            setReportData(MOCK_REPORT_DATA.map(p => ({
                ...p,
                totalMilk: p.totalMilk.toFixed(2), 
                totalPayment: p.totalPayment.toFixed(2), 
                pendingPayment: p.pendingPayment.toFixed(2)
            })));
            setMetrics(MOCK_METRICS);

        } finally {
            setLoading(false);
        }
    };
    
    // Arama filtresine göre veriyi filtrele
    const filteredReportData = reportData.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.id.toLowerCase().includes(searchTerm.toLowerCase())
    );


    // Ana Görünüm Render
    if (authLoading || (loading && isFirebaseReady && !error)) { 
        return (
            <div className="flex items-center justify-center p-20 text-gray-500 font-semibold">
                {isFirebaseReady ? 'Gerçek veriler yükleniyor...' : 'Kimlik doğrulama bilgileri yükleniyor...'}
            </div>
        );
    }
    
    return (
        <div className="p-6 bg-white rounded-lg shadow-xl min-h-[80vh] w-full">
            <h2 className="text-3xl font-bold mb-6 text-gray-800 border-b pb-2">Raporlar ve Analizler Paneli</h2>
            
            {/* Hata Durumu */}
            {error && (
                 <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                    <strong className="font-bold">HATA: </strong>
                    <span className="block sm:inline ml-2">{error}</span>
                    {error.includes("Güvenlik İzni Reddedildi") && (
                        <p className="mt-2 text-sm">
                            <span className="font-semibold">Çözüm İpucu:</span> Bu hata, Firebase Güvenlik Kurallarınızın mevcut kullanıcının (anonim olarak oturum açtı) `uretici` ve `toplamalar` koleksiyonlarını okumasına izin vermediği anlamına gelir. Lütfen Firebase Console'a gidip kurallarınızı, oturum açmış kullanıcılara okuma izni verecek şekilde güncelleyin.
                        </p>
                    )}
                </div>
            )}


            {/* Rapor İçeriği */}
            {!loading && (
                <div className="mt-8">
                    <h3 className="text-2xl font-semibold mb-4 text-gray-700">Genel Bakış Metrikleri</h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        
                        <MetricCard 
                            title="Kayıtlı Üretici Sayısı" 
                            value={metrics.totalUsers} 
                            color="yellow"
                            info={isFirebaseReady && !error ? 'Gerçek veritabanı' : 'Sahte veri (MOCK)'}
                        />

                        <MetricCard 
                            title="Toplam Toplanan Süt" 
                            value={`${metrics.totalMilk || '0.00'} Lt`} 
                            color="green"
                        />
                        
                        <MetricCard 
                            title="Toplam Yapılan Ödeme" 
                            value={`${metrics.totalPayment || '0.00'} ₺`} 
                            color="indigo"
                        />
                        
                        <MetricCard 
                            title="Ödenmeyi Bekleyen Hak" 
                            value={`${metrics.pendingPayment || '0.00'} ₺`} 
                            color="red"
                        />
                    </div>

                    {/* Detay Tablosu: Üretici Bazlı Raporlar */}
                    <div className="mt-12">
                        <h3 className="text-xl font-semibold mb-3 text-gray-700 border-b pb-2">Üretici Bazlı Özet Rapor ({filteredReportData.length} / {reportData.length} kayıt gösteriliyor)</h3>
                        
                        {/* Arama Çubuğu */}
                        <div className="mb-4">
                            <input
                                type="text"
                                placeholder="Üretici Adı, Adresi veya ID'ye göre ara..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                            />
                        </div>
                        
                        <div className="overflow-x-auto bg-gray-50 p-6 rounded-lg border border-gray-200 shadow-inner">
                            {filteredReportData.length > 0 ? (
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-100">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Üretici Adı</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Üretici ID</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Toplam Süt (Lt)</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Toplam Ödeme (₺)</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bekleyen Hak (₺)</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Adres</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {filteredReportData.map((user) => (
                                            <tr key={user.id} className="hover:bg-gray-50 transition duration-150">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-indigo-600">
                                                    {user.name}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                                                    {user.id.substring(0, 8) + '...'} 
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-700">
                                                    {user.totalMilk}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-700">
                                                    {user.totalPayment}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-700">
                                                    {user.pendingPayment}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-xs truncate">
                                                    {user.address || '--'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <p className="text-gray-500 text-base py-5 text-center">
                                    {searchTerm
                                        ? "Arama kriterlerinize uyan kayıt bulunamadı."
                                        : (isFirebaseReady && !error
                                            ? "Veritabanınızda üretici veya toplama kaydı bulunamadı. Kayıt girmeye başlayın!"
                                            : "Veritabanına bağlanılamadı veya yetki yok. Sahte veriler gösteriliyor."
                                        )
                                    }
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// ----------------------------------------------------------------------
// 4. Yardımcı Bileşen: MetricCard
// ----------------------------------------------------------------------
const MetricCard = ({ title, value, color, info }) => {
    
    let bgColor, borderColor, valueColor;

    switch(color) {
        case 'yellow':
            bgColor = 'bg-yellow-100';
            borderColor = 'border-yellow-600';
            valueColor = 'text-yellow-800';
            break;
        case 'green':
            bgColor = 'bg-green-100';
            borderColor = 'border-green-600';
            valueColor = 'text-green-800';
            break;
        case 'indigo':
            bgColor = 'bg-indigo-100';
            borderColor = 'border-indigo-600';
            valueColor = 'text-indigo-800';
            break;
        case 'red':
            bgColor = 'bg-red-100';
            borderColor = 'border-red-600';
            valueColor = 'text-red-800';
            break;
        default:
            bgColor = 'bg-gray-100';
            borderColor = 'border-gray-300';
            valueColor = 'text-gray-800';
            break;
    }

    return (
        <div className={`${bgColor} p-5 rounded-xl border-l-4 ${borderColor} shadow-lg hover:shadow-xl transition-shadow transform hover:scale-[1.02] duration-300`}>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className={`text-2xl lg:text-3xl font-extrabold ${valueColor} mt-1`}>{value}</p>
            {info && <p className="text-xs text-gray-500 mt-1">{info}</p>}
        </div>
    );
};


// Ana bileşeni AuthProvider ile sarıyoruz ve varsayılan export olarak dışa aktarıyoruz.
const RaporlarComponent = () => (
    <AuthProvider>
        <Layout>
            <RaporlarView />
        </Layout>
    </AuthProvider>
);

export default RaporlarComponent;
