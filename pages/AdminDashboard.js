import React from "react";
import {
  Users,
  Milk,
  UserCheck,
  Settings,
  BarChart3,
  FileText,
} from "lucide-react";

const stats = [
  { title: "Toplam Üretici", value: "124", icon: Users },
  { title: "Toplam Süt (L)", value: "12.450", icon: Milk },
  { title: "Aktif Kullanıcı", value: "56", icon: UserCheck },
  { title: "Raporlar", value: "89", icon: FileText },
];

const actions = [
  { label: "Üretici Ekle", icon: Users },
  { label: "Rapor Görüntüle", icon: FileText },
  { label: "Ayarlar", icon: Settings },
];

const AdminDashboard = () => {
  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold text-gray-800">
        Yönetici Paneli - Genel Bakış
      </h1>

      {/* Özet Kartları */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((item, i) => (
          <div
            key={i}
            className="flex items-center justify-between p-5 bg-white shadow-md rounded-2xl hover:shadow-lg transition"
          >
            <div>
              <p className="text-gray-500 text-sm">{item.title}</p>
              <h2 className="text-2xl font-semibold text-gray-800">
                {item.value}
              </h2>
            </div>
            <item.icon className="w-8 h-8 text-blue-500" />
          </div>
        ))}
      </div>

      {/* Grafik Alanı */}
      <div className="bg-white rounded-2xl shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">
            Haftalık Süt Üretimi
          </h2>
          <BarChart3 className="text-blue-500" />
        </div>
        <div className="h-48 flex items-center justify-center text-gray-400 border-2 border-dashed rounded-xl">
          (Buraya Recharts veya Chart.js ile grafik eklenecek)
        </div>
      </div>

      {/* Hızlı İşlemler */}
      <div>
        <h2 className="text-lg font-semibold mb-3 text-gray-800">
          Hızlı İşlemler
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {actions.map((action, i) => (
            <button
              key={i}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-5 rounded-xl shadow-md transition"
            >
              <action.icon className="w-5 h-5" />
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
