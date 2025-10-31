// src/App.js (TAM KOD)

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AuthGuard from './components/AuthGuard'; 

// Gerekli tüm sayfa bileşenlerini import et
import LoginPage from './pages/LoginPage';
import AdminDashboardComponent from './pages/AdminDashboard';
import AdminProducersComponent from './pages/AdminProducers';
import AdminRolesComponent from './pages/AdminRoles';
import IsciPanelComponent from './pages/IsciPanel'; 
import UreticiPanelComponent from './pages/UreticiPanel'; 
import IsverenPanelComponent from './pages/IsverenPanel'; 
import RaporlarComponent from './pages/Raporlar'; // YENİ: Raporlar sayfasını import ediyoruz

// Bileşen Tanımlamaları
const AdminDashboard = AdminDashboardComponent;
const AdminProducers = AdminProducersComponent;
const AdminRoles = AdminRolesComponent;
const IsciPanel = IsciPanelComponent;
const UreticiPanel = UreticiPanelComponent;
const IsverenPanel = IsverenPanelComponent; 
const Raporlar = RaporlarComponent; // YENİ: Raporlar bileşenini tanımlıyoruz

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Giriş Sayfası (Herkese Açık) */}
          <Route path="/" element={<LoginPage />} />

          {/* Admin Rotaları (Yönetici) */}
          <Route path="/admin" element={<AuthGuard roles={['admin']}><AdminDashboard /></AuthGuard>} />
          <Route path="/admin/producers" element={<AuthGuard roles={['admin']}><AdminProducers /></AuthGuard>} />
          <Route path="/admin/roles" element={<AuthGuard roles={['admin']}><AdminRoles /></AuthGuard>} />
          
          {/* İşveren Rotaları (Ödeme Takibi) */}
          <Route path="/isveren" element={<AuthGuard roles={['admin', 'isveren']}><IsverenPanel /></AuthGuard>} /> 
          
          {/* YENİ ROTA: Raporlar Sayfası (Admin ve İşveren) */}
          <Route path="/raporlar" element={
  <AuthGuard roles={['admin', 'isveren']}>
    <Raporlar />
  </AuthGuard>
} />

          {/* İşçi Rotaları */}
          <Route path="/isci" element={<AuthGuard roles={['isci']}><IsciPanel /></AuthGuard>} />

          {/* Üretici Rotaları */}
          <Route path="/uretici" element={<AuthGuard roles={['uretici']}><UreticiPanel /></AuthGuard>} />

          {/* 404 Sayfası */}
          <Route path="*" element={<h1>404 - Sayfa Bulunamadı</h1>} />

  
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
