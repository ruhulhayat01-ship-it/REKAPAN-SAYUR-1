import { useState, useEffect } from "react";

type Item = {
  nama: string;
  qty: number;
};

export default function App() {
  const [nama, setNama] = useState("");
  const [qty, setQty] = useState<number>(0);
  const [items, setItems] = useState<Item[]>([]);

  // ambil data lama
  useEffect(() => {
    const saved = localStorage.getItem("rekapan-sayur");
    if (saved) setItems(JSON.parse(saved));
  }, []);

  // simpan otomatis
  useEffect(() => {
    localStorage.setItem("rekapan-sayur", JSON.stringify(items));
  }, [items]);

  const tambah = () => {
    if (!nama || qty <= 0) return;
    setItems([...items, { nama, qty }]);
    setNama("");
    setQty(0);
  };

  const hapus = (i: number) => {
    setItems(items.filter((_, index) => index !== i));
  };

  return (
    <div style={{ padding: 20, maxWidth: 500 }}>
      <h1>REKAPAN SAYUR 🥬</h1>

      <input
        placeholder="Nama sayur"
        value={nama}
        onChange={(e) => setNama(e.target.value)}
        style={{ width: "100%", padding: 8, marginBottom: 8 }}
      />

      <input
        type="number"
        placeholder="Jumlah (kg)"
        value={qty}
        onChange={(e) => setQty(Number(e.target.value))}
        style={{ width: "100%", padding: 8, marginBottom: 8 }}
      />

      <button onClick={tambah} style={{ padding: 10, width: "100%" }}>
        ➕ Tambah
      </button>

      <hr />

      {items.length === 0 && <p>Belum ada data</p>}

      {items.map((item, i) => (
        <div key={i} style={{ display: "flex", gap: 10, marginBottom: 6 }}>
          <span style={{ flex: 1 }}>
            {item.nama} — {item.qty} kg
          </span>
          <button onClick={() => hapus(i)}>❌</button>
        </div>
      ))}
    </div>
  );
}
