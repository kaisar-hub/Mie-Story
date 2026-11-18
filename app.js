(function () {
  const rupiah = (n) => "Rp" + Math.round(n).toLocaleString("id-ID");

  // ══════════════════════════════════════
  //  STATE
  // ══════════════════════════════════════
  let metode = null;        // "antar" | "ambil"
  let lokasiPelanggan = null; // { lat, lng }
  let jarakKm = null;
  let ongkir = 0;
  let jamAmbil = "";

  // ══════════════════════════════════════
  //  PAGE NAVIGATION
  // ══════════════════════════════════════
  function showPage(id) {
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
    document.getElementById(id).classList.add("active");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ══════════════════════════════════════
  //  RENDER
  // ══════════════════════════════════════
  function render() {
    // Reset UI
    document.getElementById("metode-antar").classList.remove("aktif");
    document.getElementById("metode-ambil").classList.remove("aktif");
    document.getElementById("bagian-jam").style.display = "none";
    document.getElementById("bagian-lokasi").style.display = "none";
    document.getElementById("bagian-rincian").style.display = "none";
    document.getElementById("btn-kirim").disabled = true;

    if (metode) {
      document.getElementById("metode-" + metode).classList.add("aktif");

      if (metode === "ambil") {
        document.getElementById("bagian-jam").style.display = "block";
        cekSiapKirim();
      }

      if (metode === "antar") {
        document.getElementById("bagian-lokasi").style.display = "block";
        if (lokasiPelanggan) tampilkanLokasi();
      }
    }

    if (metode === "ambil" && jamAmbil) {
      renderRincian();
    }
    if (metode === "antar" && jarakKm !== null) {
      renderRincian();
    }
  }

  // ══════════════════════════════════════
  //  PILIH METODE
  // ══════════════════════════════════════
  document.getElementById("metode-antar").onclick = () => {
    metode = "antar";
    lokasiPelanggan = null;
    jarakKm = null;
    ongkir = 0;
    render();
  };

  document.getElementById("metode-ambil").onclick = () => {
    metode = "ambil";
    ongkir = 0;
    jarakKm = null;
    lokasiPelanggan = null;
    jamAmbil = "";
    document.getElementById("input-jam").value = "";
    render();
  };

  // ══════════════════════════════════════
  //  JAM AMBIL
  // ══════════════════════════════════════
  document.getElementById("input-jam").onchange = (e) => {
    jamAmbil = e.target.value;
    render();
  };

  // ══════════════════════════════════════
  //  LOKASI (GPS)
  // ══════════════════════════════════════
  document.getElementById("btn-lokasi").onclick = () => {
    const btn = document.getElementById("btn-lokasi");
    btn.innerHTML = '<span class="spinner"></span> Mendapatkan lokasi...';
    btn.disabled = true;

    if (!navigator.geolocation) {
      alert("Browser kamu tidak mendukung GPS.");
      btn.textContent = "📍 Bagikan Lokasi";
      btn.disabled = false;
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        lokasiPelanggan = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        hitungJarak();
      },
      (err) => {
        alert("Gagal mendapatkan lokasi: " + err.message);
        btn.textContent = "📍 Bagikan Lokasi";
        btn.disabled = false;
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  // Hitung jarak via OSRM
  function hitungJarak() {
    const toko = window.TOKO;
    const url = `https://router.project-osrm.org/route/v1/driving/${toko.lng},${toko.lat};${lokasiPelanggan.lng},${lokasiPelanggan.lat}?overview=false`;

    fetch(url)
      .then(r => r.json())
      .then(data => {
        if (data.code !== "Ok" || !data.routes || !data.routes.length) {
          jarakKm = haversine(toko.lat, toko.lng, lokasiPelanggan.lat, lokasiPelanggan.lng);
        } else {
          jarakKm = Math.round(data.routes[0].distance / 100) / 10; // 1 decimal
        }
        tentukanOngkir();
        tampilkanLokasi();
        render();
      })
      .catch(() => {
        jarakKm = haversine(toko.lat, toko.lng, lokasiPelanggan.lat, lokasiPelanggan.lng);
        tentukanOngkir();
        tampilkanLokasi();
        render();
      });
  }

  function haversine(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) ** 2;
    return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
  }

  function tentukanOngkir() {
    for (const tier of window.ONGKIR) {
      if (jarakKm <= tier.max) {
        ongkir = tier.biaya;
        return;
      }
    }
  }

  function tampilkanLokasi() {
    const el = document.getElementById("lokasi-result");
    el.style.display = "block";

    const tier = window.ONGKIR.find(t => jarakKm <= t.max);
    const isJauh = tier && tier.biaya === -1;
    const badgeClass = isJauh ? "ekspedisi" : (tier && tier.biaya === 0 ? "gratis" : "");

    el.innerHTML = `
      <div class="lokasi-info">
        <div>📍 Lokasi diterima</div>
        <div style="margin-top:6px">Jarak: <span class="jarak">${jarakKm} km</span></div>
        <div style="margin-top:6px">Ongkir: <span class="ongkir-badge ${badgeClass}">${tier.label}</span></div>
        ${isJauh ? '<div style="margin-top:8px;color:var(--danger);font-size:0.85rem">Jarak terlalu jauh untuk antar langsung. Silakan pilih Ambil Sendiri atau hubungi kami.</div>' : ''}
      </div>`;

    document.getElementById("btn-lokasi").textContent = "📍 Perbarui Lokasi";
    document.getElementById("btn-lokasi").disabled = false;
  }

  // ══════════════════════════════════════
  //  RINCIAN BIAYA
  // ══════════════════════════════════════
  function renderRincian() {
    const box = document.getElementById("bagian-rincian");
    const isi = document.getElementById("rincian-isi");
    box.style.display = "block";

    const isJauh = ongkir === -1;
    const ongkirFinal = isJauh ? 0 : ongkir;
    const grand = ongkirFinal; // tidak ada harga menu, cuma ongkir

    let html = "";
    if (metode === "antar" && jarakKm !== null) {
      const ongkirLabel = isJauh ? "Tidak bisa antar (jarak >5km)" : (ongkir === 0 ? "Gratis" : rupiah(ongkir));
      html += `<div class="row"><span>Ongkir (${jarakKm} km)</span><span>${ongkirLabel}</span></div>`;
    }
    if (metode === "ambil" && jamAmbil) {
      html += `<div class="row"><span>Jam Ambil</span><span>${jamAmbil}</span></div>`;
    }
    html += `<div class="row total-row"><span>Total Ongkir</span><span>${isJauh ? "—" : rupiah(grand)}</span></div>`;
    isi.innerHTML = html;

    cekSiapKirim();
  }

  function cekSiapKirim() {
    const btn = document.getElementById("btn-kirim");
    const nama = document.getElementById("input-nama").value.trim();
    const catatan = document.getElementById("input-catatan").value.trim();

    let siap = false;
    if (metode === "ambil") {
      siap = nama && jamAmbil;
    } else if (metode === "antar") {
      siap = nama && jarakKm !== null && ongkir !== -1;
    }
    btn.disabled = !siap;
  }

  // Nama & catatan listener
  ["input-nama", "input-catatan"].forEach(id => {
    document.getElementById(id).addEventListener("input", cekSiapKirim);
  });

  // ══════════════════════════════════════
  //  KIRIM KE WHATSAPP
  // ══════════════════════════════════════
  document.getElementById("btn-kirim").onclick = () => {
    const nama = document.getElementById("input-nama").value.trim();
    const catatan = document.getElementById("input-catatan").value.trim();

    let teks = `*🍜 Pesanan Mie Story*\n`;
    teks += `Nama: ${nama}\n`;
    teks += `Metode: ${metode === "antar" ? "Pesan Antar / COD" : "Ambil Sendiri"}\n`;

    if (metode === "antar" && jarakKm !== null) {
      teks += `Jarak: ${jarakKm} km\n`;
      if (ongkir === -1) {
        teks += `Ongkir: Tidak bisa antar (jarak >5km)\n`;
      } else {
        teks += `Ongkir: ${ongkir === 0 ? "Gratis" : rupiah(ongkir)}\n`;
      }
      if (lokasiPelanggan) {
        teks += `Lokasi: https://maps.google.com/?q=${lokasiPelanggan.lat},${lokasiPelanggan.lng}\n`;
      }
    }
    if (metode === "ambil" && jamAmbil) {
      teks += `Jam Ambil: ${jamAmbil}\n`;
    }

    if (catatan) teks += `\nCatatan: ${catatan}`;

    const wa = window.TOKO.whatsapp;
    const url = `https://wa.me/${wa}?text=${encodeURIComponent(teks)}`;
    window.open(url, "_blank");

    showPage("page-sukses");
  };

  // Kembali / Pesan lagi
  document.getElementById("btn-kembali").onclick = () => showPage("page-metode");
  document.getElementById("btn-pesan-lagi").onclick = () => {
    metode = null;
    lokasiPelanggan = null;
    jarakKm = null;
    ongkir = 0;
    jamAmbil = "";
    document.getElementById("input-nama").value = "";
    document.getElementById("input-catatan").value = "";
    document.getElementById("input-jam").value = "";
    showPage("page-metode");
    render();
  };

  // ══════════════════════════════════════
  //  INIT
  // ══════════════════════════════════════
  render();
})();