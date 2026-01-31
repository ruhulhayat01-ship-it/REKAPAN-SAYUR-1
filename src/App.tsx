import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

/* ======================
   SUPABASE
====================== */
const supabase = createClient(
  "https://rqmcpnkpctdlrayvouly.supabase.co",
  "sb_publishable_8Phqrx84tQKTHlm5Rkwffw__qC0V3Q2"
);

/* ======================
   KONFIGURASI
====================== */
const dapurList = [
  "Krai",
  "Petahunan",
  "Kunir",
  "Bades",
  "Wonorejo",
  "Randuagung",
];

const ADMIN_PIN = "1234";
const todayISO = new Date().toISOString().split("T")[0];

type Sayur = { nama: string; kg: number };

type Pesanan = {
  id: string;
  tanggal: string;
  dapur: string;
  nama_sayur: string;
  kg: number;
  keterangan: string | null;
  tanggal_kirim: string | null;
  is_saved: boolean;
};

/* ======================
   APP
====================== */
export default function App() {
  const [tanggal, setTanggal] = useState(todayISO);
  const [isAdmin, setIsAdmin] = useState(false);
  const [pin, setPin] = useState("");

  const [input, setInput] = useState<Record<string, Sayur[]>>(
    Object.fromEntries(dapurList.map((d) => [d, [{ nama: "", kg: 0 }]]))
  );

  const [pesanan, setPesanan] = useState<Pesanan[]>([]);

  /* ======================
     LOAD DATA
  ====================== */
  const loadPesanan = async () => {
    const { data } = await supabase
      .from("aplikasi_rekap_sayur")
      .select("*")
      .eq("tanggal", tanggal)
      .order("created_at", { ascending: true });

    setPesanan(data || []);
  };

  useEffect(() => {
    loadPesanan();
  }, [tanggal]);

  /* ======================
     INPUT DAPUR
  ====================== */
  const updateSayur = (
    dapur: string,
    index: number,
    field: "nama" | "kg",
    value: string
  ) => {
    const newData = { ...input };
    newData[dapur][index][field] =
      field === "kg" ? Number(value) : value;
    setInput(newData);
  };

  const tambahSayur = (dapur: string) => {
    setInput({
      ...input,
      [dapur]: [...input[dapur], { nama: "", kg: 0 }],
    });
  };

  const hapusSayur = (dapur: string, index: number) => {
    const newData = { ...input };
    newData[dapur].splice(index, 1);
    setInput(newData);
  };

  /* ======================
     SIMPAN DRAFT
  ====================== */
  const simpanPesanan = async (dapur: string) => {
    const rows = input[dapur]
      .filter((s) => s.nama && s.kg > 0)
      .map((s) => ({
        tanggal,
        dapur,
        nama_sayur: s.nama,
        kg: s.kg,
        is_saved: false,
      }));

    if (!rows.length) {
      alert("❌ Tidak ada data");
      return;
    }

    await supabase
      .from("aplikasi_rekap_sayur")
      .upsert(rows, {
        onConflict: "tanggal,dapur,nama_sayur",
      });

    loadPesanan();
    alert(`✅ Draft ${dapur} tersimpan`);
  };

  /* ======================
     UPDATE FIELD
  ====================== */
  const updatePesanan = async (
    id: string,
    field: keyof Pesanan,
    value: any
  ) => {
    await supabase
      .from("aplikasi_rekap_sayur")
      .update({ [field]: value })
      .eq("id", id);

    loadPesanan();
  };

  const hapusPesanan = async (id: string) => {
    if (!confirm("Hapus pesanan ini?")) return;
    await supabase.from("aplikasi_rekap_sayur").delete().eq("id", id);
    loadPesanan();
  };

  const saveFinal = async (p: Pesanan) => {
    if (!p.tanggal_kirim) {
      alert("❌ Tanggal kirim wajib diisi");
      return;
    }

    await supabase
      .from("aplikasi_rekap_sayur")
      .update({ is_saved: true })
      .eq("id", p.id);

    alert("✅ Pesanan FINAL disimpan");
    loadPesanan();
  };

  /* ======================
     UI
  ====================== */
  return (
    <div className="app-container">
      <h2>Rekap Kebutuhan Sayur – MBG</h2>

      {/* ADMIN */}
      <div className="admin-panel">
        {!isAdmin ? (
          <>
            <input
              type="password"
              placeholder="PIN Admin"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
            />
            <button onClick={() => pin === ADMIN_PIN ? setIsAdmin(true) : alert("PIN salah")}>
              Masuk Admin
            </button>
          </>
        ) : (
          <>
            <strong>Mode Admin</strong><br />
            <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
            <button onClick={() => setIsAdmin(false)}>Keluar</button>
          </>
        )}
      </div>

      {/* INPUT */}
      <div className="dapur-grid">
        {dapurList.map((dapur) => (
          <div key={dapur}>
            <h3>{dapur}</h3>
            {input[dapur].map((s, i) => (
              <div key={i}>
                <input
                  placeholder="Nama Sayur"
                  value={s.nama}
                  onChange={(e) => updateSayur(dapur, i, "nama", e.target.value)}
                />
                <input
                  type="number"
                  value={s.kg}
                  onChange={(e) => updateSayur(dapur, i, "kg", e.target.value)}
                />
                <button onClick={() => hapusSayur(dapur, i)}>Hapus</button>
              </div>
            ))}
            <button onClick={() => tambahSayur(dapur)}>+ Tambah Sayur</button><br />
            <button onClick={() => simpanPesanan(dapur)}>💾 SIMPAN PESANAN</button>
          </div>
        ))}
      </div>

      {/* TABEL */}
      <h3>📋 Data Pesanan</h3>
      <table width="100%" border={1} cellPadding={6}>
        <thead>
          <tr>
            <th>Dapur</th>
            <th>Sayur</th>
            <th>Kg</th>
            <th>Keterangan</th>
            <th>Tgl Kirim</th>
            <th>Status</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {pesanan.map((p) => (
            <tr key={p.id}>
              <td>{p.dapur}</td>
              <td><input value={p.nama_sayur} onChange={(e) => updatePesanan(p.id, "nama_sayur", e.target.value)} /></td>
              <td><input type="number" value={p.kg} onChange={(e) => updatePesanan(p.id, "kg", Number(e.target.value))} /></td>
              <td><input value={p.keterangan || ""} onChange={(e) => updatePesanan(p.id, "keterangan", e.target.value)} /></td>
              <td><input type="date" value={p.tanggal_kirim || ""} onChange={(e) => updatePesanan(p.id, "tanggal_kirim", e.target.value)} /></td>
              <td>{p.is_saved ? "✅ FINAL" : "🕓 DRAFT"}</td>
              <td>
                {!p.is_saved && <button onClick={() => saveFinal(p)}>SAVE</button>}
                <button onClick={() => hapusPesanan(p.id)}>Hapus</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
