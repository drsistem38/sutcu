// src/pages/AdminRoles.js (TAM KOD)

import React, { useState } from 'react';
import Layout from '../components/Layout';
import useFirestoreCollection from '../hooks/useFirestoreCollection';
import { db } from '../firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore'; 

const ROLES = [
    { value: 'admin', label: 'Yönetici' },
    { value: 'isveren', label: 'İşveren' },
    { value: 'isci', label: 'İşçi' },
    { value: 'uretici', label: 'Üretici' },
    { value: 'default', label: 'Varsayılan (Rol Atanmamış)' }
];

const RoleManagementTable = () => {
    // Tüm kullanıcıları çekiyoruz
    const { data: users, loading, error, refetch } = useFirestoreCollection('users', []);
    const [isUpdating, setIsUpdating] = useState(false);

    const handleRoleChange = async (userId, newRole) => {
        setIsUpdating(true);
        try {
            const userRef = doc(db, 'users', userId);
            
            await updateDoc(userRef, {
                role: newRole,
            });
            alert(`Kullanıcının rolü başarıyla ${newRole} olarak güncellendi.`);
            refetch(); // Tabloyu yenile
        } catch (error) {
            console.error("Rol güncellenirken hata:", error);
            alert("Rol güncelleme başarısız oldu.");
        } finally {
            setIsUpdating(false);
        }
    };

    const getRoleLabel = (roleValue) => {
        const role = ROLES.find(r => r.value === roleValue);
        return role ? role.label : 'Bilinmiyor';
    };

    if (loading) return <p>Kullanıcılar yükleniyor...</p>;
    if (error) return <p style={{ color: 'red' }}>Hata: Kullanıcı verileri çekilemedi. İzinleri (Rules) kontrol edin.</p>;

    return (
        <div style={tableStyles.container}>
            <h3>Kayıtlı Tüm Kullanıcılar ({users.length})</h3>
            
            <table style={tableStyles.table}>
                <thead>
                    <tr>
                        <th style={tableStyles.th}>Kullanıcı E-posta</th>
                        <th style={tableStyles.th}>Mevcut Rol</th>
                        <th style={tableStyles.th}>Rol Değiştir</th>
                        <th style={tableStyles.th}>Durum</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map((user) => (
                        <tr key={user.id}>
                            <td style={tableStyles.td}>{user.email}</td>
                            <td style={tableStyles.td}>{getRoleLabel(user.role)}</td>
                            <td style={tableStyles.td}>
                                <select 
                                    style={tableStyles.select}
                                    value={user.role || 'default'}
                                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                    disabled={isUpdating}
                                >
                                    {ROLES.map(role => (
                                        <option key={role.value} value={role.value}>
                                            {role.label}
                                        </option>
                                    ))}
                                </select>
                            </td>
                            <td style={tableStyles.td}>
                                {isUpdating ? 'İşlem yapılıyor...' : 'Hazır'}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

// --- Ana Bileşen: Rol Yönetimi ---
const AdminRoles = () => {
    return (
        <Layout>
            <h1>Kullanıcı & Rol Yönetimi</h1>
            <p>Bu sayfada mevcut tüm kullanıcıların rollerini görüntüleyebilir ve güncelleyebilirsiniz.</p>
            <RoleManagementTable />
        </Layout>
    );
};

export default AdminRoles;


// --- Stiller ---
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