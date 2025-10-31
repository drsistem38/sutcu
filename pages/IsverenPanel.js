// src/pages/IsverenPanel.js (VEYA AdminPaymentTracking.js) - TAM KOD

import React, { useState } from 'react';
import Layout from '../components/Layout';
import useFirestoreCollection from '../hooks/useFirestoreCollection';
import { db } from '../firebaseConfig';
import { doc, updateDoc, writeBatch, query, where, getDocs } from 'firebase/firestore'; 

// Fiyatı sabit bir değerden okuyoruz, böylece hesaplamalar tutarlı olur.
const MILK_PRICE_PER_LITER = 10.00;

// Yardımcı fonksiyonlar
const formatCurrency = (amount) => `₺${amount.toFixed(2)}`;
const formatDate = (timestamp) => {
    if (!timestamp) return '---';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    // Türkiye saati ve saat dilimi gösterimi
    return date.toLocaleString('tr-TR', { 
        day: '2-digit', month: '2-digit', year: 'numeric', 
        hour: '2-digit', minute: '2-digit', 
        timeZone: 'Europe/Istanbul' 
    });
};

// --- Toplu Ödeme Yönetimi Bileşeni ---
// Hata Giderimi: Prop ismi doğru şekilde destructuring ediliyor.
const BulkPaymentManager = ({ allCollections, workers, producers, refetchCollections }) => { 
    const [selectedProducerId, setSelectedProducerId] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [statusMessage, setStatusMessage] = useState(''); 
    const [isSuccess, setIsSuccess] = useState(false);
    
    // Toplama verisini Üretici ID'ye göre gruplar
    const groupedCollections = allCollections.reduce((acc, item) => {
        if (!item.is_paid) { 
            const key = item.uretici_id;
            if (!acc[key]) {
                acc[key] = {
                    name: producers.find(p => p.id === key)?.name || 'Bilinmeyen Üretici',
                    totalQuantity: 0,
                    collections: [],
                };
            }
            acc[key].totalQuantity += item.quantity_lt || 0;
            acc[key].collections.push(item.id);
        }
        return acc;
    }, {});
    
    const totalAmountToPay = selectedProducerId 
        ? groupedCollections[selectedProducerId]?.totalQuantity * MILK_PRICE_PER_LITER || 0 
        : 0;

    const handleBulkPayment = async () => {
        if (!selectedProducerId || isProcessing) return;

        const producerGroup = groupedCollections[selectedProducerId];
        if (!producerGroup || producerGroup.collections.length === 0) {
            setStatusMessage('Hata: Ödenecek toplama kaydı bulunamadı.');
            setIsSuccess(false);
            return;
        }

        if (!window.confirm(`${producerGroup.name} için toplam ${formatCurrency(totalAmountToPay)} tutarındaki ${producerGroup.collections.length} kaydı ÖDENDİ olarak işaretlemek istediğinizden emin misiniz?`)) {
            return;
        }

        setIsProcessing(true);
        setStatusMessage('');
        setIsSuccess(false);
        const batch = writeBatch(db);
        
        try {
            producerGroup.collections.forEach(collectionId => {
                const collectionRef = doc(db, 'toplamalar', collectionId);
                batch.update(collectionRef, {
                    is_paid: true,
                    payment_date: new Date(),
                });
            });
            
            await batch.commit();
            setStatusMessage(`${producerGroup.name} üreticisine ait tüm ödenmemiş ${producerGroup.collections.length} kayıt toplu olarak ödendi olarak işaretlendi.`);
            setIsSuccess(true);
            setSelectedProducerId('');
            
            // [DÜZELTME]: Fonksiyon çağrısı prop'u kontrol ederek yapılıyor.
            if (refetchCollections) {
                 refetchCollections(); 
            } else {
                 console.warn("refetchCollections fonksiyonu bulunamadı, tablo otomatik güncellenmeyebilir.");
            }

        } catch (error) {
            console.error("Toplu ödeme işleminde hata:", error);
            setStatusMessage("Hata: Toplu ödeme yapılırken bir sorun oluştu. (Yine de kayıtlar güncellenmiş olabilir.)");
            setIsSuccess(false);
        } finally {
            setIsProcessing(false);
        }
    };
    
    const availableProducers = Object.keys(groupedCollections).map(id => ({
        id: id,
        name: groupedCollections[id].name,
        totalAmount: groupedCollections[id].totalQuantity * MILK_PRICE_PER_LITER,
        count: groupedCollections[id].collections.length
    }));

    return (
        <div style={bulkStyles.container}>
            <h3>💰 Toplu Ödeme İşlemi (Ay Sonu Pratik Çözüm)</h3>
            
            {statusMessage && (
                <p style={isSuccess ? bulkStyles.successMessage : bulkStyles.errorMessage}>
                    {statusMessage}
                </p>
            )}

            <div style={bulkStyles.controls}>
                <select
                    value={selectedProducerId}
                    onChange={(e) => setSelectedProducerId(e.target.value)}
                    style={bulkStyles.select}
                    disabled={isProcessing || availableProducers.length === 0}
                >
                    <option value="">-- Ödeme Yapılacak Üreticiyi Seçin --</option>
                    {availableProducers.map(p => (
                        <option key={p.id} value={p.id}>
                            {p.name} ({p.count} Kayıt, {formatCurrency(p.totalAmount)})
                        </option>
                    ))}
                </select>
                <button
                    onClick={handleBulkPayment}
                    disabled={!selectedProducerId || isProcessing}
                    style={bulkStyles.button}
                >
                    {isProcessing 
                        ? 'İşleniyor...' 
                        : selectedProducerId 
                            ? `${groupedCollections[selectedProducerId]?.name} (${formatCurrency(totalAmountToPay)}) ÖDE` 
                            : 'Toplu Ödeme Yap'
                    }
                </button>
            </div>
            {availableProducers.length === 0 && (
                <p style={{marginTop: '10px', color: 'green'}}>Tüm ödemeleriniz yapılmış görünüyor. Yeni ödenmemiş kayıt yok.</p>
            )}
        </div>
    );
};


// --- Detaylı Toplama Tablosu Bileşeni ---
// Hata Giderimi: Prop ismi doğru şekilde destructuring ediliyor.
const PaymentDetailTable = ({ collections, workers, producers, refetchCollections }) => {
    
    // İşçi ID -> İsim Eşleştirmesi (name varsa onu, yoksa e-postanın ilk kısmını kullan)
    const workerMap = workers.reduce((acc, worker) => {
        acc[worker.id] = worker.name || worker.email.split('@')[0]; 
        return acc;
    }, {});
    
    // Üretici ID -> İsim Eşleştirmesi
    const producerMap = producers.reduce((acc, producer) => {
        acc[producer.id] = producer.name;
        return acc;
    }, {});
    
    // Ödeme Durumunu Tek Tek Değiştirme (Geri Alma/Yapma)
    const handlePaymentStatusChange = async (collectionId, currentStatus) => {
        const newStatus = !currentStatus;
        const actionText = newStatus ? 'ÖDENDİ' : 'ÖDEME GERİ ALINDI';

        if (!window.confirm(`Bu kaydın durumunu ${actionText} olarak değiştirmek istediğinizden emin misiniz?`)) {
            return;
        }

        try {
            const collectionRef = doc(db, 'toplamalar', collectionId);
            await updateDoc(collectionRef, {
                is_paid: newStatus,
                payment_date: newStatus ? new Date() : null,
            });
            
            // [DÜZELTME]: Fonksiyon çağrısı prop'u kontrol ederek yapılıyor.
            if (refetchCollections) {
                 refetchCollections(); 
            } else {
                 console.warn("refetchCollections fonksiyonu bulunamadı, tablo otomatik güncellenmeyebilir.");
            }
            
        } catch (error) {
            console.error("Ödeme durumu güncellenirken hata:", error);
            alert("Durum güncellenemedi.");
        }
    };
    
    return (
        <div style={tableStyles.container}>
            <h3>Tüm Toplama Hakedişleri ({collections.length})</h3>
            <p style={{color: 'green', marginBottom: '15px'}}>Veriler gerçek zamanlıdır.</p>
            
            <table style={tableStyles.table}>
                <thead>
                    <tr>
                        <th style={tableStyles.th}>Toplayan İşçi</th> 
                        <th style={tableStyles.th}>Tarih</th>
                        <th style={tableStyles.th}>Üretici</th>
                        <th style={tableStyles.th}>Miktar (Lt)</th>
                        <th style={tableStyles.th}>Tutar (₺)</th>
                        <th style={tableStyles.th}>Durum</th>
                        <th style={tableStyles.th}>İşlem</th>
                    </tr>
                </thead>
                <tbody>
                    {collections.map((item) => {
                        const amount = (item.quantity_lt || 0) * (item.price_per_lt || MILK_PRICE_PER_LITER);
                        return (
                            <tr key={item.id}>
                                <td style={tableStyles.td}>**{workerMap[item.isci_id] || 'Bilinmiyor'}**</td> 
                                <td style={tableStyles.td}>{formatDate(item.date)}</td>
                                <td style={tableStyles.td}>{producerMap[item.uretici_id] || 'Bilinmiyor'}</td>
                                <td style={tableStyles.td}>{item.quantity_lt.toFixed(2)}</td>
                                <td style={tableStyles.td}>{formatCurrency(amount)}</td>
                                <td style={tableStyles.td}>
                                    <span style={item.is_paid ? tableStyles.statusPaid : tableStyles.statusPending}>
                                        {item.is_paid ? 'Ödendi' : 'Bekliyor'}
                                    </span>
                                </td>
                                <td style={tableStyles.td}>
                                    <button 
                                        onClick={() => handlePaymentStatusChange(item.id, item.is_paid)}
                                        style={item.is_paid ? tableStyles.btnUndo : tableStyles.btnPay}
                                    >
                                        {item.is_paid ? 'Ödemeyi Geri Al' : 'ÖDEME YAPILDI'}
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};


// --- Ana Bileşen: İşveren Paneli (Ödeme Takibi) ---
const IsverenPanel = () => {
    // Veri çekme ve refetch fonksiyonu
    const { data: collections, loading: cLoading, error: cError, refetch: refetchCollections } = useFirestoreCollection('toplamalar', []);
    const { data: producers, loading: pLoading, error: pError } = useFirestoreCollection('uretici', []);
    const { data: workers, loading: wLoading, error: wError } = useFirestoreCollection('users', [['role', '==', 'isci']]);

    if (cLoading || pLoading || wLoading) return <Layout>Ödeme Verileri Yükleniyor...</Layout>;
    if (cError || pError || wError) return <Layout><p style={{ color: 'red' }}>Veri çekme hatası. Firebase Rules'u kontrol edin.</p></Layout>;

    const sortedCollections = collections.sort((a, b) => {
        // Ödenmemiş kayıtları üstte tut (Öncelik ver)
        if (a.is_paid !== b.is_paid) {
            return a.is_paid ? 1 : -1;
        }
        // Aynı durumda ise en yeni tarih üste
        const dateA = a.date.toDate ? a.date.toDate() : new Date(a.date);
        const dateB = b.date.toDate ? b.date.toDate() : new Date(b.date);
        return dateB - dateA;
    }); 
    
    return (
        <Layout>
            <h1>İşveren Paneli - Ödeme Yönetimi</h1>
            <p>Bu alanda tüm üreticilerin hakedişlerini görüntüleyebilir ve ödeme onaylarını yapabilirsiniz.</p>
            
            {/* [DÜZELTME]: refetchCollections prop'u doğru isimle gönderiliyor */}
            <BulkPaymentManager 
                allCollections={collections} 
                workers={workers} 
                producers={producers} 
                refetchCollections={refetchCollections} 
            />

            {/* [DÜZELTME]: refetchCollections prop'u doğru isimle gönderiliyor */}
            {sortedCollections.length > 0 ? (
                <PaymentDetailTable 
                    collections={sortedCollections} 
                    workers={workers} 
                    producers={producers} 
                    refetchCollections={refetchCollections} 
                />
            ) : (
                <p style={{marginTop: '30px', padding: '20px', border: '1px solid #ccc'}}>Henüz hiç süt toplama kaydı yapılmamıştır.</p>
            )}
            
        </Layout>
    );
};

export default IsverenPanel;


// --- Stiller (Değişiklik yapılmadı) ---
const tableStyles = {
    container: {
        marginTop: '30px',
        padding: '20px',
        backgroundColor: '#fff',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
    },
    table: {
        width: '100%',
        borderCollapse: 'separate',
        borderSpacing: '0',
        marginTop: '15px',
        borderRadius: '8px',
        overflow: 'hidden'
    },
    th: {
        borderBottom: '2px solid #0056b3',
        padding: '12px',
        textAlign: 'left',
        backgroundColor: '#007bff',
        color: 'white',
        fontWeight: 'bold'
    },
    td: {
        borderBottom: '1px solid #dee2e6',
        padding: '10px',
        textAlign: 'left',
        verticalAlign: 'middle'
    },
    statusPaid: {
        display: 'inline-block',
        padding: '4px 8px',
        borderRadius: '12px',
        backgroundColor: '#28a745',
        color: 'white',
        fontSize: '0.9em',
        fontWeight: 'bold'
    },
    statusPending: {
        display: 'inline-block',
        padding: '4px 8px',
        borderRadius: '12px',
        backgroundColor: '#ffc107',
        color: '#343a40',
        fontSize: '0.9em',
        fontWeight: 'bold'
    },
    btnPay: {
        backgroundColor: '#28a745',
        color: 'white',
        border: 'none',
        padding: '8px 12px',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '0.85em'
    },
    btnUndo: {
        backgroundColor: '#dc3545',
        color: 'white',
        border: 'none',
        padding: '8px 12px',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '0.85em'
    }
};

const bulkStyles = {
    container: {
        marginTop: '30px',
        padding: '25px',
        backgroundColor: '#e6f7ff',
        border: '1px solid #b3e0ff',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
    },
    controls: {
        display: 'flex',
        gap: '15px',
        marginTop: '15px'
    },
    select: {
        flex: 2,
        padding: '10px',
        borderRadius: '4px',
        border: '1px solid #007bff',
        fontSize: '16px'
    },
    button: {
        flex: 1,
        padding: '10px',
        borderRadius: '4px',
        border: 'none',
        backgroundColor: '#007bff',
        color: 'white',
        cursor: 'pointer',
        fontSize: '16px',
        fontWeight: 'bold'
    },
    errorMessage: {
        padding: '10px',
        marginBottom: '10px',
        backgroundColor: '#f8d7da',
        color: '#721c24',
        border: '1px solid #f5c6cb',
        borderRadius: '4px'
    },
    successMessage: {
        padding: '10px',
        marginBottom: '10px',
        backgroundColor: '#d4edda',
        color: '#155724',
        border: '1px solid #c3e6cb',
        borderRadius: '4px'
    }
};