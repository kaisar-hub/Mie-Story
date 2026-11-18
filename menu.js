// Konfigurasi Mie Story
// Isi data warung kamu di sini
window.TOKO = {
  nama: "Mie Story",
  whatsapp: "6282323652121",
  lat: -6.80973,
  lng: 110.9224282
};

// Ongkir berdasarkan jarak (km) - aturan user
window.ONGKIR = [
  { max: 2,   biaya: 0,     label: "Gratis" },
  { max: 3,   biaya: 5000,  label: "Rp5.000" },
  { max: 5,   biaya: 10000, label: "Rp10.000" },
  { max: Infinity, biaya: -1, label: "Jarak >5km — tidak bisa antar langsung" }
];