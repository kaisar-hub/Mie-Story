// Konfigurasi Mie Story
// Isi data warung kamu di sini
window.TOKO = {
  nama: "Mie Story",
  whatsapp: "6282323652121",
  lat: -6.8097053,
  lng: 110.9224859
};

// Ongkir berdasarkan jarak (km) - aturan user
window.ONGKIR = [
  { max: 1,   biaya: 0,     label: "Gratis" },
  { max: 1.5, biaya: 2000,  label: "Rp2.000" },
  { max: 2.5, biaya: 5000,  label: "Rp5.000" },
  { max: 5,   biaya: 10000, label: "Rp10.000" },
  { max: Infinity, biaya: -1, label: "Jarak >5km — tidak bisa antar langsung" }
];