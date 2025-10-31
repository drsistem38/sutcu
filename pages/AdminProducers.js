// src/pages/AdminProducers.js (TAM KOD)

import React, { useState } from 'react';
import Layout from '../components/Layout';
import useFirestoreCollection from '../hooks/useFirestoreCollection';
import { db } from '../firebaseConfig';
import { collection, addDoc, doc, updateDoc, query, where, getDocs } from 'firebase/firestore'; 

// Yeni Üretici Ekleme Formu
const AddProducerForm = ({ refreshProducers }) => {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [userEmail, setUserEmail] = useState(''); // Yeni üretici için kullanıcı e-posta adresi
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        setIsSuccess(false);

        if (!name || !phone || !userEmail) {
            setMessage("Ad, Telefon ve Kullanıcı E-posta alanı zorunludur.");
            setLoading(false);
            return;
        }

        try {
            // Firestore'da 'users' koleksiyonundan e-postaya göre UID bulma (Kullanıcı zaten Firebase Auth'a kayıtlı olmalı)
            const usersRef = collection(db, "users");
            const q = query(usersRef, where("email", "==", userEmail));
            const querySnapshot = await getDocs(q);
            
            if (querySnapshot.empty) {
                setMessage("Hata: Belirtilen e-posta adresine sahip kayıtlı bir kullanıcı bulunamadı.");
                setLoading(false);
                return;
            }

            const userDoc = querySnapshot.docs[0];
            const user_uid = userDoc.id; // UID, users dokümanının ID'sidir.

            // 1. Üretici Kaydını Oluşturma
            const newProducer = {
                name,
                phone,
                address,
                user_uid: user_uid, // Bulunan UID'yi kaydet
                assigned_isci_id: null, // Başlangıçta işçi atanmamış
                created_at: new Date()
            };

            await addDoc(collection(db, "uretici"), newProducer);
            
            // 2. Kullanıcının rolünü "uretici" olarak güncelleme (Gerekliyse)
            await updateDoc(userDoc.ref, {
                role: 'uretici'
            });

            setName('');
            setPhone('');
            setAddress('');
            setUserEmail('');
            setMessage("Üretici ve kullanıcı rolü başarıyla kaydedildi!");
            setIsSuccess(true);
            refreshProducers(); // Listeyi yenile
        } catch (error) {
            console.error("Üretici kaydında hata:", error);
            setMessage(`Kaydetme sırasında bir hata oluştu: ${error.message}`);
            setIsSuccess(false);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={formStyles.container}>
            <h3>Yeni Üretici Ekle</h3>
            {message && <p style={isSuccess ? formStyles.success : formStyles.error}>{message}</p>}
            <form onSubmit={handleSubmit}>
                <input style={formStyles.input} type="text" placeholder="Üretici / Çiftlik Adı" value={name} onChange={e => setName(e.target.value)} required />
                <input style={formStyles.input} type="text" placeholder="Telefon Numarası (Zorunlu)" value={phone} onChange={e => setPhone(e.target.value)} required />
                <input style={formStyles.input} type="email" placeholder="Kullanıcı E-posta Adresi (Zorunlu)" value={userEmail} onChange={e => setUserEmail(e.target.value)} required />
                <textarea style={formStyles.input} placeholder="Adres (Opsiyonel)" value={address} onChange={e => setAddress(e.target.value)} />
                <button style={formStyles.button} type="submit" disabled={loading}>
                    {loading ? 'Kaydediliyor...' : 'Üreticiyi Kaydet'}
                </button>
            </form>
        </div>
    );
};

// Üretici Listesi ve İşçi Atama
const ProducersList = ({ producers, workers }) => {
    const [isUpdating, setIsUpdating] = useState(false);
    
    // İşçi ID'lerini isme eşleyen map oluşturma
    const workerMap = workers.reduce((acc, worker) => {
        acc[worker.id] = `${worker.name} (${worker.email})`;
        return acc;
    }, {});

    const handleWorkerAssignment = async (producerId, workerId) => {
        setIsUpdating(true);
        try {
            const producerRef = doc(db, 'uretici', producerId);
            
            await updateDoc(producerRef, {
                assigned_isci_id: workerId === 'null' ? null : workerId,
            });
            alert(`İşçi ataması başarıyla güncellendi!`);
        } catch (error) {
            console.error("İşçi ataması güncellenirken hata:", error);
            alert("İşçi ataması güncellenemedi.");
        } finally {
            setIsUpdating(false);
        }
    };
    
    return (
        <div style={listStyles.container}>
            <h3>Kayıtlı Üreticiler ({producers.length})</h3>
            <p style={{marginBottom: '10px', color: isUpdating ? 'orange' : 'green'}}>
                {isUpdating ? 'Güncelleniyor...' : `${producers.length} adet üretici bulundu.`}
            </p>
            
            {producers.length === 0 ? (
                <p>Henüz kayıtlı üretici yok.</p>
            ) : (
                <table style={listStyles.table}>
                    <thead>
                        <tr>
                            <th style={listStyles.th}>Adı</th>
                            <th style={listStyles.th}>Telefon</th>
                            <th style={listStyles.th}>Atanan İşçi</th>
                            <th style={listStyles.th}>İşlem (Atama)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {producers.map((producer) => (
                            <tr key={producer.id}>
                                <td style={listStyles.td}>{producer.name}</td>
                                <td style={listStyles.td}>{producer.phone}</td>
                                <td style={listStyles.td}>
                                    {producer.assigned_isci_id ? workerMap[producer.assigned_isci_id] : 'Atanmamış'}
                                </td>
                                <td style={listStyles.td}>
                                    <select 
                                        style={listStyles.select}
                                        value={producer.assigned_isci_id || 'null'}
                                        onChange={(e) => handleWorkerAssignment(producer.id, e.target.value)}
                                        disabled={isUpdating}
                                    >
                                        <option value="null">--- İşçi Seç/Atamayı Kaldır ---</option>
                                        {workers.map(worker => (
                                            <option key={worker.id} value={worker.id}>
                                                {worker.name} ({worker.email})
                                            </option>
                                        ))}
                                    </select>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
            <p style={{marginTop: '10px', fontSize: '12px', color: '#666'}}>İşlemleriniz gerçek zamanlıdır.</p>
        </div>
    );
};

// --- Ana Bileşen: Üretici Yönetimi ---
const AdminProducers = () => {
    // Tüm üreticileri çek
    const { data: producers, loading: producersLoading, error: producersError, refetch } = useFirestoreCollection('uretici', []);
    
    // Sadece 'isci' rolündeki kullanıcıları çek
    const { data: workers, loading: workersLoading, error: workersError } = useFirestoreCollection('users', [
        { field: 'role', operator: '==', value: 'isci' }
    ]);

    if (producersLoading || workersLoading) return <Layout>Yükleniyor...</Layout>;
    if (producersError || workersError) return <Layout><p style={{ color: 'red' }}>Veri çekme hatası. Firebase Rules'u kontrol edin.</p></Layout>;
    
    return (
        <Layout>
            <h1>Üretici Yönetimi</h1>
            <p>Bu sayfada yeni üreticiler ekleyebilir, mevcut üreticileri yönetebilir ve işçi ataması yapabilirsiniz.</p>
            
            <div style={mainStyles.contentWrapper}>
                <div style={mainStyles.formColumn}>
                    <AddProducerForm refreshProducers={refetch} />
                </div>
                <div style={mainStyles.listColumn}>
                    <ProducersList producers={producers} workers={workers} />
                </div>
            </div>
        </Layout>
    );
};

export default AdminProducers;


// --- Stiller ---

const mainStyles = {
    contentWrapper: {
        display: 'flex',
        gap: '30px',
        marginTop: '20px',
        flexWrap: 'wrap'
    },
    formColumn: {
        flex: '1',
        minWidth: '300px',
    },
    listColumn: {
        flex: '2',
        minWidth: '500px',
    }
};

const formStyles = {
    container: {
        padding: '20px',
        backgroundColor: '#fff',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
    },
    input: {
        width: '100%',
        padding: '10px',
        margin: '10px 0',
        border: '1px solid #ced4da',
        borderRadius: '4px'
    },
    button: {
        width: '100%',
        padding: '12px',
        backgroundColor: '#28a745',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        marginTop: '10px'
    },
    error: {
        color: 'red',
        marginBottom: '10px'
    },
    success: {
        color: 'green',
        marginBottom: '10px'
    }
};

const listStyles = {
    container: {
        padding: '20px',
        backgroundColor: '#fff',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
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
    select: {
        padding: '8px',
        width: '100%',
        borderRadius: '4px',
        border: '1px solid #ced4da'
    }
};