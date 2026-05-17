import type { ReactNode } from "react";

export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  date: string;
  author: string;
  coverImage?: string;
  body: ReactNode;
};

export const blogPosts: BlogPost[] = [
  {
    slug: "panduan-memilih-bunga-untuk-acara-spesial",
    title: "Panduan Memilih Bunga untuk Acara Spesial",
    description:
      "Setiap acara butuh karakter bunga yang berbeda. Begini cara kami membantu kamu memilih rangkaian yang pas.",
    date: "2026-04-12",
    author: "Tim njs Florist",
    body: (
      <>
        <p>
          Bali punya iklim yang ramah untuk berbagai jenis bunga, tapi tidak semua bunga cocok untuk
          setiap acara. Berikut beberapa panduan singkat yang sering kami berikan ke klien njs Florist.
        </p>
        <h2>Wedding</h2>
        <p>
          Untuk pernikahan, kami biasanya merekomendasikan rangkaian putih dengan aksen pink lembut —
          mawar putih, peony, dan eucalyptus. Cocok dengan dekorasi villa pantai maupun chapel.
        </p>
        <h2>Anniversary</h2>
        <p>
          Mawar merah klasik tetap nomor satu. Tambahkan baby breath untuk kesan romantis ringan,
          atau pilih varian premium dengan vase keramik untuk hadiah yang lebih berkesan.
        </p>
        <h2>Ucapan & opening</h2>
        <p>
          Standing flower dengan kombinasi cerah (kuning, oranye, merah) cocok untuk grand opening,
          ucapan sukses, atau ulang tahun perusahaan.
        </p>
      </>
    ),
  },
  {
    slug: "cara-merawat-bunga-segar-agar-tahan-lama",
    title: "Cara Merawat Bunga Segar agar Tahan Lama",
    description:
      "5 tips sederhana untuk menjaga rangkaian bunga tetap segar hingga seminggu lebih.",
    date: "2026-03-22",
    author: "Tim njs Florist",
    body: (
      <>
        <p>
          Bunga segar bisa bertahan jauh lebih lama dengan perawatan yang tepat. Ini hal-hal yang
          kami selalu beritahu ke pelanggan saat pengiriman.
        </p>
        <ol>
          <li>Ganti air vase setiap 2 hari sekali, dan potong batang miring 1cm setiap kali.</li>
          <li>Jauhkan dari sinar matahari langsung dan AC yang langsung mengarah ke bunga.</li>
          <li>Hindari menaruh dekat buah matang (etilen dari buah mempercepat pembusukan).</li>
          <li>Tambahkan sedikit gula + cuka putih ke air sebagai pengganti flower food.</li>
          <li>
            Buang daun yang tenggelam di air, karena akan membusuk dan mempercepat kerusakan
            rangkaian.
          </li>
        </ol>
      </>
    ),
  },
  {
    slug: "kenapa-rangkaian-custom-lebih-spesial",
    title: "Kenapa Rangkaian Custom Lebih Spesial",
    description:
      "Setiap orang punya cerita yang berbeda. Rangkaian custom membantu menyampaikannya dengan tepat.",
    date: "2026-02-08",
    author: "Tim njs Florist",
    body: (
      <>
        <p>
          Katalog kami menyediakan banyak pilihan, tapi ada momen-momen yang butuh sentuhan lebih
          personal. Rangkaian custom adalah jawaban untuk:
        </p>
        <ul>
          <li>Pernikahan dengan tema warna spesifik</li>
          <li>Hadiah ulang tahun dengan bunga favorit penerima</li>
          <li>Permintaan khusus seperti monokrom atau warna pastel</li>
          <li>Acara korporat dengan branding tertentu</li>
        </ul>
        <p>
          Ceritakan visi kamu lewat <a href="/custom">halaman custom inquiry</a>. Kami akan membalas
          dengan mockup, estimasi harga, dan timeline pengiriman dalam 1×24 jam.
        </p>
      </>
    ),
  },
];

export function findPostBySlug(slug: string): BlogPost | undefined {
  return blogPosts.find((post) => post.slug === slug);
}
