const paths: Record<string, string> = {
  Ringkasan: "M3 11 12 3l9 8v10h-6v-7H9v7H3Z",
  Produk: "m12 3 9 5v8l-9 5-9-5V8Zm0 9 9-4M12 12 3 8m9 4v9",
  Kategori: "M4 4h6v6H4Zm10 0h6v6h-6ZM4 14h6v6H4Zm10 0h6v6h-6Z",
  "Add-on": "M3 8h18v4H3Zm2 4v9h14v-9M12 8v13M12 8H8a3 3 0 1 1 3-3l1 3Zm0 0h4a3 3 0 1 0-3-3l-1 3Z",
  Inventori: "M3 8h18v13H3Zm-1-5h20v5H2Zm7 9h6",
  Pesanan: "M6 3h12v18l-3-2-3 2-3-2-3 2Zm3 5h6m-6 4h6",
  Invoice: "M5 3h10l4 4v14H5Zm9 0v5h5M8 12h8m-8 4h8",
  "Slot pickup": "M4 5h16v16H4ZM8 2v6m8-6v6M4 10h16m-12 4h3m3 3h3",
  Pembayaran: "M3 5h18v14H3Zm0 5h18m-14 5h4",
  Diskon: "M3 3h8l10 10-8 8L3 11Zm4 4h.01M10 15l5-5",
  Analytics: "M4 3v18h17M8 16v-5m5 5V7m5 9V4",
  Inquiry: "M3 5h18v14H3Zm0 0 9 8 9-8",
  Homepage: "M3 4h18v16H3Zm0 5h18m-13 0v11",
  Pengguna: "M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 21v-3a8 8 0 0 1 16 0v3",
  Pengaturan: "M4 6h16M4 12h16M4 18h16M8 3v6m8 0v6m-6 0v6",
};
export function AdminIcon({ name, className = "" }: { name: string; className?: string }) {
  return <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name] ?? paths.Ringkasan} /></svg>;
}
