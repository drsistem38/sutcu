import React, { useState, useEffect, createContext, useContext } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, query, onSnapshot, doc, setLogLevel } from 'firebase/firestore';
import { Menu, X, Home, Users, BarChart2, DollarSign, Edit, Package, Truck, User, PieChart, TrendingUp, Zap } from 'lucide-react';

// --- MOCK SAYFA BİLEŞENLERİ (Tek dosyada çalışması için oluşturuldu) ---

// Tüm sayfaların kullanabileceği ortak bir kart bileşeni
const PageCard = ({ title, children, role }) => (
  <div className="p-4 sm:p-6 space-y-4">
    <h2 className="text-3xl font-bold text-gray-800 border-b pb-2">{title}</h2>
    {role && <p className="text-lg text-red-500 font-semibold mb-4">Erişim Rolü: {role}</p>}
    <div className="p-6 bg-white rounded-xl shadow-lg min-h-[50vh]">
      {children}
    </div>
  </div>
);

// Yeni Istatistik Kartı Bileşeni
const StatCard = ({ title, value, icon: Icon, colorClass, description }) => (
    <div className={`p-6 bg-white rounded-xl shadow-lg border-t-4 ${colorClass}`}>
        <div className="flex items-center justify-between">
            <div className="text-2xl font-semibold text-gray-700">{title}</div>
            <Icon size={32} className={`text-opacity-75 ${colorClass.replace('border-t-4', '').trim()}`} />
        </div>
        <div className="mt-2 text-4xl font-bold text-gray-900">{value}</div>
        <p className="mt-1 text-sm text-gray-500">{description}</p>
    </div>
);


const AdminDashboardComponent = () => (
    <div className="p-4 sm:p-6 space-y-6">
        <h1 className="text-4xl font-extrabold text-blue-800 border-b pb-3">Yönetici Paneli - Genel Bakış</h1>
        
        {/* HOŞ GELDİNİZ VE BİLGİ KUTUSU */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold text-blue-700">Hoş Geldiniz Yönetici!</h2>
            <p className="mt-2 text-blue-600">
                Bu panelde tüm sistemi yönetebilirsiniz. Sol menüden **Üretici Yönetimi**, **Rol Yönetimi** ve **Ödeme Takibi** sayfalarına erişebilirsiniz.
            </p>
            <p className="mt-4 text-sm text-blue-400">Admin, tüm kullanıcıları, rolleri ve üreticileri buradan yönetebilir.</p>
        </div>

        {/* İSTATİSTİK KARTLARI */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
                title="Toplam Üretici"
                value="45"
                icon={Users}
                colorClass="border-blue-500 text-blue-500"
                description="Sisteme kayıtlı aktif üretici sayısı."
            />
            <StatCard
                title="Toplam Süt (L)"
                value="12,450"
                icon={Package}
                colorClass="border-green-500 text-green-500"
                description="Bu ay toplam toplanan süt miktarı."
            />
            <StatCard
                title="Ödenecek Tutar"
                value="₺ 28,120"
                icon={DollarSign}
                colorClass="border-yellow-500 text-yellow-500"
                description="Bu ay ödeme bekleyen toplam miktar."
            />
            <StatCard
                title="Aktif İşçi"
                value="12"
                icon={Truck}
                colorClass="border-red-500 text-red-500"
                description="Şu anda aktif çalışan işçi sayısı."
            />
        </div>
        
        {/* DETAYLI İÇERİK ALANI */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Grafik Alanı */}
            <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-lg">
                <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center"><BarChart2 className="w-5 h-5 mr-2"/> Aylık Toplama Grafiği</h3>
                <div className="h-64 flex items-center justify-center bg-gray-100 rounded-lg border border-dashed text-gray-500">
                    {/* Buraya Chart.js veya Recharts gibi bir grafik kütüphanesi eklenecek. */}
                    Grafik Verisi Yer Tutucusu
                </div>
            </div>

            {/* Hızlı Erişim/Aksiyonlar */}
            <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-lg space-y-4">
                <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center"><Zap className="w-5 h-5 mr-2"/> Hızlı İşlemler</h3>
                <button className="w-full flex items-center justify-center p-3 bg-indigo-500 text-white font-bold rounded-lg hover:bg-indigo-600 transition shadow-md">
                    <User className="w-5 h-5 mr-2"/> Yeni Üretici Ekle
                </button>
                <button className="w-full flex items-center justify-center p-3 bg-teal-500 text-white font-bold rounded-lg hover:bg-teal-600 transition shadow-md">
                    <BarChart2 className="w-5 h-5 mr-2"/> Detaylı Rapor Oluştur
                </button>
                <button className="w-full flex items-center justify-center p-3 bg-red-500 text-white font-bold rounded-lg hover:bg-red-600 transition shadow-md">
                    <Edit className="w-5 h-5 mr-2"/> Rolleri Yönet
                </button>
            </div>
        </div>
    </div>
);

const AdminProducersComponent = () => (
    <PageCard title="Üretici Yönetimi" role="admin">
        <p className="text-lg text-gray-600">Admin, üreticileri ekleme, düzenleme ve silme işlemlerini buradan yapacak.</p>
        <p className="mt-4 text-sm text-gray-500">Bu sayfa sizin `/admin/producers` rotanıza karşılık gelmektedir.</p>
    </PageCard>
);

const AdminRolesComponent = () => (
    <PageCard title="Kullanıcı & Rol Yönetimi" role="admin">
        <p className="text-lg text-gray-600">Sistemdeki tüm kullanıcıların (İşçi, Üretici, İşveren) rol atamaları ve yetkilendirmeleri buradan yapılır.</p>
        <p className="mt-4 text-sm text-gray-500">Bu sayfa sizin `/admin/roles` rotanıza karşılık gelmektedir.</p>
    </PageCard>
);

const IsverenPanelComponent = () => (
    <PageCard title="İşveren Paneli - Ödeme Takibi" role="isveren, admin">
        <p className="text-lg text-gray-600">İşveren, ödenmesi gereken tutarları ve geçmiş ödeme kayıtlarını buradan takip edebilir.</p>
        <p className="mt-4 text-sm text-gray-500">Bu sayfa sizin `/isveren` rotanıza karşılık gelmektedir.</p>
    </PageCard>
);

const RaporlarComponent = () => (
    <PageCard title="Raporlar Sayfası" role="admin, isveren">
        <p className="text-lg text-gray-600">Tüm detaylı istatistikler ve PDF/Excel raporları buradan oluşturulacak ve indirilecektir.</p>
        <p className="mt-4 text-sm text-gray-500">Bu sayfa sizin `/raporlar` rotanıza karşılık gelmektedir.</p>
    </PageCard>
);

const IsciPanelComponent = () => (
    <PageCard title="İşçi Paneli" role="isci">
        <p className="text-xl text-green-700 font-bold">HOŞ GELDİN İŞÇİ!</p>
        <p className="mt-2 text-gray-600">İşçi, günlük süt toplama girişlerini ve kendi performansını buradan görebilir.</p>
        <p className="mt-4 text-sm text-gray-500">Bu sayfa sizin `/isci` rotanıza karşılık gelmektedir.</p>
    </PageCard>
);

const UreticiPanelComponent = () => (
    <PageCard title="Üretici Paneli" role="uretici">
        <p className="text-xl text-blue-700 font-bold">HOŞ GELDİN ÜRETİCİ!</p>
        <p className="mt-2 text-gray-600">Üretici, teslim ettiği süt miktarlarını ve kendisine yapılan ödemeleri buradan takip edebilir.</p>
        <p className="mt-4 text-sm text-gray-500">Bu sayfa sizin `/uretici` rotanıza karşılık gelmektedir.</p>
    </PageCard>
);

// --- CONTEXT VE FIREBASE BAŞLATMA MANTIĞI (Önceki Koddan) ---
const FirestoreContext = createContext(null);
const AuthContext = createContext({ userId: null, isAuthenticated: false, isAuthReady: false, userRole: 'guest' });

const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : null;
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// Firebase Sağlayıcı Bileşeni (Rol bilgisini de tutmak için güncellendi)
const FirebaseProvider = ({ children }) => {
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  // Rolü dışarıdan simüle etmek için eklendi. Varsayılan: admin
  const [userRole, setUserRole] = useState('admin'); 

  useEffect(() => {
    if (firebaseConfig && !db) {
      try {
        const app = initializeApp(firebaseConfig);
        const firestoreDb = getFirestore(app);
        const firebaseAuth = getAuth(app);
        
        setLogLevel('debug');
        setDb(firestoreDb);
        setAuth(firebaseAuth);

        const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
          if (user) {
            setUserId(user.uid);
            // Gerçek uygulamada: user.uid'ye göre Firestore'dan rol çekilmeli.
          } else {
            try {
              if (initialAuthToken) {
                await signInWithCustomToken(firebaseAuth, initialAuthToken);
              } else {
                await signInAnonymously(firebaseAuth);
              }
            } catch (error) {
              console.error("Firebase Auth hatası:", error);
              setUserId(null);
            }
          }
          setIsAuthReady(true);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error("Firebase başlatma hatası:", error);
      }
    } else if (!firebaseConfig) {
      console.warn("UYARI: Firebase yapılandırması eksik. Uygulama MOCK modunda çalışıyor.");
      setIsAuthReady(true);
      setUserId("MOCK_USER");
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const isAuthenticated = !!userId && userId !== "MOCK_USER";

  return (
    <FirestoreContext.Provider value={db}>
      <AuthContext.Provider value={{ userId, isAuthenticated, isAuthReady, auth, userRole, setUserRole }}>
        {children}
      </AuthContext.Provider>
    </FirestoreContext.Provider>
  );
};

// --- NAVİGASYON VE ROL KONTROL MANTIĞI ---

// Navigasyon Menü Linkleri (Sizin rotalarınıza göre güncellendi)
const navItems = [
  // Admin Rotaları
  { name: 'Genel Bakış', icon: Home, route: 'admin_dashboard', path: '/admin', roles: ['admin'] },
  { name: 'Üretici Yönetimi', icon: Users, route: 'admin_producers', path: '/admin/producers', roles: ['admin'] },
  { name: 'Rol Yönetimi', icon: Edit, route: 'admin_roles', path: '/admin/roles', roles: ['admin'] },
  // İşveren Rotaları
  { name: 'Ödeme Takibi', icon: DollarSign, route: 'isveren_panel', path: '/isveren', roles: ['admin', 'isveren'] },
  { name: 'Raporlar', icon: BarChart2, route: 'raporlar', path: '/raporlar', roles: ['admin', 'isveren'] },
  // İşçi ve Üretici panellerine link koymuyoruz, bunlar farklı giriş sonrası ana sayfalar.
];

/**
 * Yan Menü Bileşeni (Responsive)
 */
const Sidebar = ({ isOpen, setOpen, activeRoute, setActiveRoute, userRole }) => {
  const filteredNavItems = navItems.filter(item => item.roles.includes(userRole));

  return (
    <>
      {/* Mobile/Tablet Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-gray-900 bg-opacity-75 z-20 lg:hidden" 
          onClick={() => setOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <div 
        className={`
          fixed inset-y-0 left-0 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:relative lg:translate-x-0 transition-transform duration-300 ease-in-out
          w-64 bg-gray-800 text-white flex flex-col z-30 lg:z-10 h-screen
        `}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-xl font-semibold">Yönetim Menüsü</h2>
          <button 
            className="lg:hidden text-gray-400 hover:text-white" 
            onClick={() => setOpen(false)}
          >
            <X size={24} />
          </button>
        </div>

        {/* Navigasyon Linkleri */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredNavItems.length > 0 ? (
            filteredNavItems.map((item) => (
              <a
                key={item.route}
                href="#"
                onClick={(e) => {
                  e.preventDefault(); // Router olmadığı için sayfa yenilemeyi engeller
                  setActiveRoute(item.route);
                  setOpen(false); // Mobile'da menüyü kapat
                }}
                className={`
                  flex items-center space-x-3 p-3 rounded-lg transition duration-150 ease-in-out
                  ${activeRoute === item.route
                    ? 'bg-blue-600 font-bold shadow-md'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }
                `}
              >
                <item.icon size={20} />
                <span>{item.name}</span>
              </a>
            ))
          ) : (
             <p className="text-red-400 text-sm p-3">Bu rol için menü yok.</p>
          )}
        </nav>
      </div>
    </>
  );
};

/**
 * Ana Başlık (Header) Bileşeni
 */
const Header = ({ setSidebarOpen, userRole, handleLogout, userId, setUserRole }) => {
  return (
    <header className="bg-blue-700 text-white shadow-lg p-4 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center">
        {/* Hamburger Menü - Sadece Mobile'da Görünür */}
        <button 
          className="lg:hidden p-2 mr-4 rounded-md hover:bg-blue-600" 
          onClick={() => setSidebarOpen(true)}
        >
          <Menu size={24} />
        </button>
        <h1 className="text-xl font-bold">Sütçü Yönetim Sistemi</h1>
      </div>
      
      {/* Kullanıcı Bilgisi ve Rol Seçimi */}
      <div className="flex items-center space-x-3 sm:space-x-4 text-sm">
        {/* Rol Simülatörü */}
        <select 
            value={userRole}
            onChange={(e) => setUserRole(e.target.value)}
            className="bg-blue-600 border border-blue-500 rounded-lg p-1 text-white font-semibold cursor-pointer text-xs sm:text-sm"
            title="Rol Simülatörü"
        >
            <option value="admin">Admin</option>
            <option value="isveren">İşveren</option>
            <option value="isci">İşçi</option>
            <option value="uretici">Üretici</option>
        </select>
        <span className="hidden md:inline font-medium">({userId.substring(0, 8)}...)</span>
        <button 
          onClick={handleLogout} 
          className="bg-red-500 hover:bg-red-600 text-white font-semibold py-1 px-3 rounded-lg transition duration-150 shadow-md text-xs sm:text-sm"
        >
          Çıkış
        </button>
      </div>
    </header>
  );
};

/**
 * Ana İçerik Alanı (Sayfa Yönlendirmesi Burada Yapılır)
 */
const MainContent = ({ activeRoute, userRole }) => {
  const { isAuthReady } = useContext(AuthContext);

  if (!isAuthReady) {
    return (
      <div className="flex-1 bg-gray-50 flex justify-center items-center">
        <div className="text-lg text-gray-600">Yetkilendirme bekleniyor...</div>
      </div>
    );
  }

  // Kullanıcının rolüne göre hangi paneli gösterileceğini belirleme
  let activePanel = null;
  let defaultRouteComponent = null;

  switch (userRole) {
    case 'admin':
      defaultRouteComponent = <AdminDashboardComponent />; // Eğer admin menüden bir şey seçmediyse
      break;
    case 'isveren':
      defaultRouteComponent = <IsverenPanelComponent />; // Eğer işveren menüden bir şey seçmediyse
      break;
    case 'isci':
      return <IsciPanelComponent />; // İşçi direkt kendi paneline yönlendirilir
    case 'uretici':
      return <UreticiPanelComponent />; // Üretici direkt kendi paneline yönlendirilir
    default:
      return (
        <div className="flex-1 bg-gray-50 flex justify-center items-center">
            <h1 className="text-2xl text-red-500">Giriş Yapmalısınız veya Rolünüz Tanımsız.</h1>
        </div>
      );
  }
  
  // Menüden seçilen rotayı bileşenle eşleştirme (Admin/İşveren paneli için)
  switch (activeRoute) {
    case 'admin_dashboard':
        activePanel = <AdminDashboardComponent />;
        break;
    case 'admin_producers':
        activePanel = <AdminProducersComponent />;
        break;
    case 'admin_roles':
        activePanel = <AdminRolesComponent />;
        break;
    case 'isveren_panel':
        activePanel = <IsverenPanelComponent />;
        break;
    case 'raporlar':
        activePanel = <RaporlarComponent />;
        break;
    // Eğer menüden seçilen rota yoksa, varsayılanı göster
    default:
        activePanel = defaultRouteComponent; 
  }

  // Rol kontrolü: Eğer seçilen rota, kullanıcının rolüne uygun değilse
  const requiredRoles = navItems.find(item => item.route === activeRoute)?.roles;
  if (requiredRoles && !requiredRoles.includes(userRole)) {
      activePanel = (
          <PageCard title="Erişim Engellendi">
              <p className="text-xl text-red-600 font-bold">Bu sayfaya erişim yetkiniz ({userRole}) bulunmamaktadır.</p>
              <p className="mt-2 text-gray-600">Gerekli roller: {requiredRoles.join(', ')}</p>
          </PageCard>
      );
  }

  return (
    <main className="flex-1 bg-gray-50 pb-8 min-h-screen">
      {activePanel}
    </main>
  );
};

// Ana Uygulama Bileşeni
const App = () => {
  const { userRole, setUserRole, userId, isAuthReady } = useContext(AuthContext); // userRole'ü AuthContext'ten al
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  // Rol değiştiğinde aktif rotayı sıfırla
  const [activeRoute, setActiveRoute] = useState('admin_dashboard'); 

  useEffect(() => {
    // Rol değiştiğinde, eğer yeni rol Admin veya İşveren ise varsayılan sayfaya git
    if (userRole === 'admin') {
      setActiveRoute('admin_dashboard');
    } else if (userRole === 'isveren') {
      setActiveRoute('isveren_panel');
    }
    // İşçi ve Üretici için menü olmadığı için rotayı resetlemeye gerek yok
  }, [userRole]);

  // Mock Fonksiyon: Çıkış Yap
  const handleLogout = () => {
    console.log("Çıkış yapılıyor...");
    setUserRole('guest'); // Rolü misafir olarak ayarla
    setActiveRoute('admin_dashboard');
    // Gerçek uygulamada: auth.signOut() çağrılmalı ve kullanıcı LoginPage'e yönlendirilmeli.
  };

  // Henüz kimlik doğrulama hazır değilse, sadece yükleme ekranını göster (Header/Sidebar gereksiz)
  if (!isAuthReady && !userId) {
     return (
       <div className="flex justify-center items-center h-full min-h-screen bg-gray-50">
         <div className="text-lg text-gray-600">Uygulama yükleniyor...</div>
       </div>
     );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Sabit Başlık */}
      <Header 
        setSidebarOpen={setIsSidebarOpen} 
        userRole={userRole} 
        userId={userId || 'Yükleniyor'}
        handleLogout={handleLogout} 
        setUserRole={setUserRole} // Rol seçimi için eklendi
      />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Yan Menü (Sadece Admin ve İşveren için gösterilir) */}
        {(userRole === 'admin' || userRole === 'isveren') && (
            <Sidebar 
                isOpen={isSidebarOpen} 
                setOpen={setIsSidebarOpen} 
                activeRoute={activeRoute} 
                setActiveRoute={setActiveRoute}
                userRole={userRole}
            />
        )}
        
        {/* Ana İçerik */}
        <MainContent activeRoute={activeRoute} userRole={userRole} />
      </div>
    </div>
  );
};


// Uygulamanın Firebase Context'i ile sarılması
const WrappedApp = () => (
    <FirebaseProvider>
        <App />
    </FirebaseProvider>
);

export default WrappedApp;
