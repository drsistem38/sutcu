// src/firebaseConfig.js

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// BURAYI KENDİ PROJE AYARLARINIZLA DEĞİŞTİRİN
const firebaseConfig = {
   apiKey: "AIzaSyAlRzNXJWKo5XZfeLDL5MytJdZz_l2k9FA",
  authDomain: "sutcu-uygulamasi-40cda.firebaseapp.com",
  projectId: "sutcu-uygulamasi-40cda",
  storageBucket: "sutcu-uygulamasi-40cda.firebasestorage.app",
  messagingSenderId: "253676475539",
  appId: "1:253676475539:web:43779243c85b5ecc22a966"
};
// BURAYI KENDİ PROJE AYARLARINIZLA DEĞİŞTİRİN

// Uygulamayı Başlat
const app = initializeApp(firebaseConfig);

// Servisleri Dışa Aktar
export const auth = getAuth(app); // Kimlik Doğrulama
export const db = getFirestore(app); // Veritabanı (Firestore)

// Not: getStorage (Storage için), getFunctions (Cloud Functions için)
// gibi diğer servisleri de buraya ekleyebilirsiniz.