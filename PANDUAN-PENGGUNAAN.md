# Panduan Penggunaan Website njs Florist Bali

Panduan lengkap untuk pemilik toko & pelanggan. Dokumen ini dibagi 2 bagian:

1. **Bagian A — Sisi Pelanggan (Storefront)** — apa yang dilihat pembeli.
2. **Bagian B — Sisi Admin (Dashboard)** — cara mengelola toko Anda.

---

## Bagian A — Sisi Pelanggan (Storefront)

Alamat website: `https://your-domain.com` (atau domain yang Anda pasang di Vercel).

### A.1 Halaman utama (Home)

Saat pelanggan membuka website, mereka melihat:

- **Hero image** — gambar besar pembuka (bisa diganti dari admin → Homepage).
- **Marquee** — running text (biasanya promo / pengumuman singkat).
- **Best Sellers** — 4 produk terlaris.
- **Header** — link ke menu utama (Shop, Custom, Cart, Account).
- **Footer** — info toko, sosmed, kontak.

### A.2 Belanja produk

1. Klik menu **Shop** di header.
2. Pelanggan bisa memilih kategori (mis. Bouquet, Standing Flower, Hampers).
   - URL kategori: `/shop/{nama-kategori}`.
3. Klik produk untuk melihat detail:
   - Foto produk, deskripsi, harga.
   - Pilihan **varian** (mis. ukuran S/M/L).
   - **Add-on** (mis. kartu ucapan, balon, coklat).
4. Klik **Tambah ke Keranjang**.

### A.3 Custom order

Untuk pesanan custom (rangkaian khusus, request khusus):

1. Klik menu **Custom**.
2. Isi form: jenis bunga, budget, tanggal, catatan.
3. Submit — masuk ke **Inquiries** di admin.

### A.4 Cart (Keranjang)

- Akses dari ikon keranjang di header (`/cart`).
- Pelanggan bisa ubah qty atau hapus item.
- Tombol **Checkout** untuk lanjut pembayaran.

### A.5 Checkout

Pelanggan mengisi:

- **Data penerima**: nama, no. HP, alamat.
- **Tanggal & slot pickup/pengiriman**: dipilih dari slot yang Anda buat di admin.
- **Kode diskon** (jika punya).
- Metode pembayaran (Midtrans / transfer manual, tergantung yang aktif).
- Klik **Bayar Sekarang**.

### A.6 Pembayaran

- Jika pakai **Midtrans**: pelanggan dialihkan ke halaman pembayaran (QRIS, VA, e-wallet).
- Jika **transfer manual**: pelanggan menerima instruksi rekening + diminta upload bukti.
- Setelah berhasil, status pesanan otomatis berubah ke `PAID`.

### A.7 Tracking pesanan

- Halaman **Track** (`/track`) — pelanggan masukkan nomor pesanan untuk cek status.
- Atau lewat **Account → Orders** jika punya akun.

### A.8 Akun pelanggan

- **Sign up / Sign in** di `/sign-up` dan `/sign-in`.
- `/account` — profil & daftar pesanan.

---

## Bagian B — Sisi Admin (Dashboard)

### B.1 Login admin

1. Buka `https://your-domain.com/admin`.
2. Anda akan diarahkan ke `/sign-in`.
3. Login dengan akun yang punya role **ADMIN** atau **SUPER_ADMIN**.
   - Jika belum ada akun admin: daftar dulu lewat `/sign-up`, lalu Super Admin bisa naikkan role-nya dari menu **Pengguna**.

### B.2 Layout dashboard

Sidebar kiri berisi menu, dikelompokkan:

| Grup        | Menu                                              |
| ----------- | ------------------------------------------------- |
| —           | 🏠 Ringkasan                                       |
| Katalog     | 🌸 Produk · 🏷️ Kategori · 🎁 Add-on · 📦 Inventori |
| Penjualan   | 🧾 Pesanan · 📅 Slot pickup · 💳 Pembayaran · 🏷️ Diskon |
| Engagement  | 📈 Analytics · ✉️ Inquiry                          |
| Tampilan    | 🖼️ Homepage                                        |
| Sistem      | 👤 Pengguna · ⚙️ Pengaturan                        |

### B.3 🏠 Ringkasan

Halaman pertama saat masuk admin. Berisi:

- **Stat cards**: jumlah produk aktif, pesanan baru, revenue terbayar, bahan low stock.
- **Pesanan terbaru** (5 terakhir) — klik untuk buka detail.
- **Aksi cepat** — shortcut ke task umum.
- **Bahan baku perlu di-restock** — peringatan stok rendah.

### B.4 🌸 Produk

**Lihat daftar produk**: `/admin/products`.

**Tambah produk baru**:

1. Klik **Tambah produk baru** (atau buka `/admin/products/new`).
2. Isi:
   - Nama produk
   - Kategori
   - Harga dasar
   - Deskripsi
   - Foto (upload via Cloudinary)
   - **Varian** (opsional — mis. S/M/L dengan harga berbeda)
3. Simpan.

**Edit produk**: klik produk dari list → ubah → Simpan.

**Tips**: matikan produk dengan menonaktifkannya (jangan dihapus) supaya histori order tetap aman.

### B.5 🏷️ Kategori

`/admin/categories`. Tambah / edit kategori (mis. "Wedding", "Anniversary", "Sympathy"). Kategori dipakai di Shop dan di form produk.

### B.6 🎁 Add-on

`/admin/addons`. Item tambahan yang bisa dibeli bersama produk (kartu ucapan, coklat, balon). Set nama, harga, gambar.

### B.7 📦 Inventori

`/admin/inventory`. Untuk catat bahan baku (bunga, ribbon, kertas).

- Setiap item punya: nama, satuan (stem, pcs, m), **stok saat ini**, **reorder level**.
- Item di bawah reorder level muncul di Ringkasan sebagai *low stock*.
- **Movements** (`/admin/inventory/movements`) — log keluar/masuk barang.

### B.8 🧾 Pesanan

`/admin/orders` — daftar semua pesanan.

**Status pesanan**:

| Status            | Arti                                       |
| ----------------- | ------------------------------------------ |
| `PENDING_PAYMENT` | Pelanggan belum bayar                      |
| `PAID`            | Sudah bayar, siap diproses                 |
| `IN_PRODUCTION`   | Florist sedang mengerjakan                 |
| `READY`           | Siap dikirim / di-pickup                   |
| `OUT_FOR_DELIVERY`| Sedang dikirim                             |
| `DELIVERED`       | Selesai sampai ke penerima                 |
| `CANCELLED`       | Dibatalkan                                 |

**Detail pesanan** (`/admin/orders/{id}`):

- Lihat item, alamat penerima, slot, pembayaran.
- Tombol untuk **update status** secara manual.
- Bisa diteruskan ke staff florist / delivery.

### B.9 📅 Slot pickup / pengiriman

`/admin/delivery`. Atur slot waktu yang tersedia untuk pelanggan saat checkout.

1. Klik **Tambah slot**.
2. Pilih tanggal, jam mulai-selesai, kapasitas (mis. 5 order per slot).
3. Simpan.

Slot yang penuh otomatis tidak bisa dipilih pelanggan.

### B.10 💳 Pembayaran

`/admin/payments` — list semua transaksi.

- Filter berdasarkan status (paid / pending / failed).
- Untuk transfer manual: verifikasi bukti transfer di sini, lalu tandai `PAID`.
- Untuk Midtrans: status update otomatis via webhook.

### B.11 🏷️ Diskon

`/admin/discounts`. Buat kode promo.

1. Klik **Buat kode diskon**.
2. Isi: kode (mis. `IMLEK25`), tipe (persen / nominal), nilai, masa berlaku, batas penggunaan.
3. Simpan. Pelanggan tinggal masukkan kode di checkout.

### B.12 📈 Analytics

`/admin/analytics` — grafik revenue, top produk, dsb. Untuk monitoring performa.

### B.13 ✉️ Inquiry

`/admin/inquiries` — pesan dari form Custom Order. Reply via WhatsApp / email yang tercantum.

### B.14 🖼️ Homepage

`/admin/homepage`. Atur isi homepage tanpa perlu coding:

- Ganti **hero image** (gambar besar).
- Edit **marquee text** (running text).
- Pilih produk yang muncul di **Best Sellers**.

### B.15 👤 Pengguna

`/admin/users`. Daftar semua user yang daftar di website.

- Atur **role**: `CUSTOMER`, `STAFF`, `ADMIN`, `SUPER_ADMIN`.
- Hanya **SUPER_ADMIN** yang bisa naikkan role orang lain ke ADMIN.

### B.16 ⚙️ Pengaturan

`/admin/settings`. Pengaturan global toko:

- Nama toko, alamat, kontak.
- Jam operasional.
- Integrasi (WhatsApp, Resend, Midtrans, Cloudinary).
- Pajak / ongkir default.

---

## Bagian C — Staff (Florist & Delivery)

Untuk akun ber-role `STAFF`:

- **Florist** (`/staff/florist`) — list order yang harus dikerjakan, update status `IN_PRODUCTION` → `READY`.
- **Delivery** (`/staff/delivery`) — list order siap kirim, update status `OUT_FOR_DELIVERY` → `DELIVERED`.

---

## Bagian D — Alur Operasional Sehari-hari (Cheat Sheet)

**Pagi:**

1. Buka **Ringkasan** — cek pesanan baru & low stock.
2. Buka **Pesanan** — verifikasi pembayaran manual jika ada.
3. Buka **Slot pickup** — pastikan slot hari ini siap.

**Saat ada pesanan masuk:**

1. Status `PAID` → assign ke florist → florist ubah ke `IN_PRODUCTION`.
2. Setelah jadi → `READY` → kirim → `OUT_FOR_DELIVERY` → `DELIVERED`.

**Mingguan:**

- Cek **Analytics** untuk lihat tren.
- Cek **Inventori** — restock bahan.
- Buat **kode diskon** untuk campaign berikutnya.

**Bulanan:**

- Audit **Pengguna** — pastikan tidak ada akun admin yang tidak dikenal.
- Backup database (lewat Supabase dashboard).
- Review **Pengaturan** — update info jika ada perubahan operasional.

---

## Bagian E — Troubleshooting

| Masalah                              | Solusi                                                                 |
| ------------------------------------ | ---------------------------------------------------------------------- |
| Tidak bisa login admin               | Pastikan role akun = ADMIN/SUPER_ADMIN. Hubungi Super Admin.           |
| Produk tidak muncul di Shop          | Cek status produk → harus **aktif**. Cek kategori juga.                |
| Pelanggan tidak bisa pilih slot      | Slot habis kapasitas atau belum dibuat. Tambah slot di **Slot pickup**.|
| Pembayaran Midtrans tidak terupdate  | Cek webhook URL di dashboard Midtrans + env `MIDTRANS_*` di Vercel.    |
| Gambar tidak ke-upload                | Cek env `CLOUDINARY_*` di Vercel.                                      |
| WhatsApp notification tidak terkirim | Cek env `WHATSAPP_*` di Vercel.                                        |

---

## Bagian F — Kontak Teknis

Jika butuh bantuan teknis (bug, error, request fitur), hubungi developer Anda dengan info:

- URL halaman yang error.
- Screenshot error.
- Waktu kejadian.
- Langkah yang dilakukan sebelum error.

---

*Dokumen ini dibuat untuk njs Florist Bali. Versi: 1.0 — 2026-05-17.*
