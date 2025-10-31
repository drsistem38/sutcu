// src/pages/Raporlar.js
import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import Layout from "../components/Layout";


import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

const Raporlar = () => {
  const [raporlar, setRaporlar] = useState([]);
  const [filtreliRaporlar, setFiltreliRaporlar] = useState([]);
  const [isciler, setIsciler] = useState([]);
  const [ureticiler, setUreticiler] = useState([]);
  const [filtre, setFiltre] = useState({
    isci: "",
    uretici: "",
    baslangic: "",
    bitis: "",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRaporlar = async () => {
      try {
        const toplamaRef = collection(db, "toplamalar");
        const snapshot = await getDocs(query(toplamaRef, orderBy("date", "desc")));

        const usersSnap = await getDocs(collection(db, "users"));
        const iscilerList = usersSnap.docs
          .filter((d) => d.data().role === "isci")
          .map((d) => ({ id: d.id, ...d.data() }));
        setIsciler(iscilerList);

        const ureticiSnap = await getDocs(collection(db, "uretici"));
        const ureticiList = ureticiSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        setUreticiler(ureticiList);

        const raporListesi = snapshot.docs.map((docSnap) => {
          const veri = docSnap.data();
          const uretici = ureticiList.find((u) => u.id === veri.uretici_id);
          const isci = iscilerList.find((i) => i.id === veri.isci_id);
          const tarihObj = veri.date?.toDate ? veri.date.toDate() : null;
          return {
            id: docSnap.id,
            isci_id: veri.isci_id,
            uretici_id: veri.uretici_id,
            isciAdi: isci ? isci.name : "Bilinmiyor",
            ureticiAdi: uretici ? uretici.name : "Bilinmiyor",
            miktar: veri.quantity_lt || 0,
            fiyat: veri.price_per_lt || 0,
            toplam: (veri.quantity_lt || 0) * (veri.price_per_lt || 0),
            tarih: tarihObj ? tarihObj.toLocaleDateString("tr-TR") : "Bilinmiyor",
            tarihObj,
          };
        });

        setRaporlar(raporListesi);
        setFiltreliRaporlar(raporListesi);
        setLoading(false);
      } catch (error) {
        console.error("Raporlar alınırken hata:", error);
        setLoading(false);
      }
    };

    fetchRaporlar();
  }, []);

  // 🔹 Filtreleme
  useEffect(() => {
    let filtreli = raporlar;
    if (filtre.isci) filtreli = filtreli.filter((r) => r.isci_id === filtre.isci);
    if (filtre.uretici) filtreli = filtreli.filter((r) => r.uretici_id === filtre.uretici);
    if (filtre.baslangic && filtre.bitis) {
      const bas = new Date(filtre.baslangic);
      const bit = new Date(filtre.bitis);
      filtreli = filtreli.filter((r) => r.tarihObj >= bas && r.tarihObj <= bit);
    }
    setFiltreliRaporlar(filtreli);
  }, [filtre, raporlar]);

  // 🔹 Toplam Hesapları
  const toplamLitre = filtreliRaporlar.reduce((a, b) => a + b.miktar, 0);
  const toplamTutar = filtreliRaporlar.reduce((a, b) => a + b.toplam, 0);
  const ortalamaFiyat =
    filtreliRaporlar.length > 0 ? (toplamTutar / toplamLitre).toFixed(2) : 0;

  // 🔹 PDF İndir
  const exportPDF = () => {
  const doc = new jsPDF();

  doc.text("Toplama Raporları", 14, 15);

  autoTable(doc, {
    head: [["İşçi", "Üretici", "Miktar (L)", "Birim Fiyat (₺)", "Toplam (₺)", "Tarih"]],
    body: filtreliRaporlar.map((r) => [
      r.isciAdi,
      r.ureticiAdi,
      r.miktar,
      r.fiyat,
      r.toplam,
      r.tarih,
    ]),
    startY: 25,
  });

  const finalY = doc.lastAutoTable.finalY || 25;
  doc.text(
    `Toplam Süt: ${toplamLitre} L   |   Toplam Tutar: ${toplamTutar.toLocaleString(
      "tr-TR"
    )} ₺   |   Ortalama: ${ortalamaFiyat} ₺/L`,
    14,
    finalY + 10
  );

  doc.save("Raporlar.pdf");
};


  // 🔹 Excel İndir
  const exportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      filtreliRaporlar.map((r) => ({
        İşçi: r.isciAdi,
        Üretici: r.ureticiAdi,
        "Miktar (L)": r.miktar,
        "Birim Fiyat (₺)": r.fiyat,
        "Toplam (₺)": r.toplam,
        Tarih: r.tarih,
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Raporlar");
    XLSX.writeFile(workbook, "Raporlar.xlsx");
  };

  if (loading) {
    return (
      <Layout>
        <h2>Yükleniyor...</h2>
      </Layout>
    );
  }

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-4">Toplama Raporları</h1>
      <p className="mb-4">
        İşçilerin üreticilerden topladığı süt miktarlarını görebilir, filtreleyebilir ve
        raporları dışa aktarabilirsiniz.
      </p>

      {/* 🔹 Filtre Alanı */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "10px",
          marginBottom: "20px",
          background: "#f8f9fa",
          padding: "10px",
          borderRadius: "8px",
        }}
      >
        <select
          value={filtre.isci}
          onChange={(e) => setFiltre({ ...filtre, isci: e.target.value })}
        >
          <option value="">Tüm İşçiler</option>
          {isciler.map((isci) => (
            <option key={isci.id} value={isci.id}>
              {isci.name}
            </option>
          ))}
        </select>

        <select
          value={filtre.uretici}
          onChange={(e) => setFiltre({ ...filtre, uretici: e.target.value })}
        >
          <option value="">Tüm Üreticiler</option>
          {ureticiler.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={filtre.baslangic}
          onChange={(e) => setFiltre({ ...filtre, baslangic: e.target.value })}
        />
        <input
          type="date"
          value={filtre.bitis}
          onChange={(e) => setFiltre({ ...filtre, bitis: e.target.value })}
        />

        <button
          onClick={() =>
            setFiltre({ isci: "", uretici: "", baslangic: "", bitis: "" })
          }
          style={{
            background: "#dc3545",
            color: "white",
            border: "none",
            padding: "5px 10px",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Temizle
        </button>
      </div>

      {/* 🔹 Tablo */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ backgroundColor: "#007bff", color: "white" }}>
            <tr>
              <th style={{ padding: "10px" }}>İşçi</th>
              <th style={{ padding: "10px" }}>Üretici</th>
              <th style={{ padding: "10px" }}>Miktar (L)</th>
              <th style={{ padding: "10px" }}>Birim Fiyat (₺)</th>
              <th style={{ padding: "10px" }}>Toplam (₺)</th>
              <th style={{ padding: "10px" }}>Tarih</th>
            </tr>
          </thead>
          <tbody>
            {filtreliRaporlar.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: "center", padding: "10px" }}>
                  Veri bulunamadı.
                </td>
              </tr>
            ) : (
              filtreliRaporlar.map((r) => (
                <tr key={r.id} style={{ borderBottom: "1px solid #ddd" }}>
                  <td style={{ padding: "8px" }}>{r.isciAdi}</td>
                  <td style={{ padding: "8px" }}>{r.ureticiAdi}</td>
                  <td style={{ padding: "8px" }}>{r.miktar}</td>
                  <td style={{ padding: "8px" }}>{r.fiyat}</td>
                  <td style={{ padding: "8px" }}>{r.toplam}</td>
                  <td style={{ padding: "8px" }}>{r.tarih}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 🔹 Toplam Alanı + Dışa Aktar */}
      <div
        style={{
          marginTop: "25px",
          padding: "20px",
          backgroundColor: "#f1f3f5",
          borderRadius: "8px",
        }}
      >
        <h3>Toplamlar</h3>
        <p>Toplam Süt Miktarı: <strong>{toplamLitre} L</strong></p>
        <p>Toplam Tutar: <strong>{toplamTutar.toLocaleString("tr-TR")} ₺</strong></p>
        <p>Ortalama Fiyat: <strong>{ortalamaFiyat} ₺/L</strong></p>

        <div style={{ marginTop: "15px" }}>
          <button
            onClick={exportPDF}
            style={{
              background: "#28a745",
              color: "white",
              border: "none",
              padding: "8px 12px",
              borderRadius: "5px",
              marginRight: "10px",
              cursor: "pointer",
            }}
          >
            📄 PDF İndir
          </button>

          <button
            onClick={exportExcel}
            style={{
              background: "#17a2b8",
              color: "white",
              border: "none",
              padding: "8px 12px",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            📊 Excel'e Aktar
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default Raporlar;
