import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

/* ======================
   SUPABASE
====================== */
const supabaseUrl = "https://rqmcpnkpctdlrayvouly.supabase.co";
const supabaseAnonKey = "PASTE_ANON_KEY_LU_DI_SINI";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

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

/* ======================
   TYPE
====================== */
type Sayur = {
  nama: string;
  kg: number;
};

type Pesanan = {
  dapur: string;
  sayur: Sayur[];
};

/* ======================
   APP
====================== */
export default function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [tanggal, setTanggal] = useState(todayISO);

  const [pesanan, setPesanan] = useState<Pesanan>({
    dapur: dapurList[0],
    sayur: [{ nama: "", kg: 0 }],
  });

  /* ======================
     HANDLER
  ====================== */
  const updateSayur = (index: number, field: "nama" | "kg", value: string) => {
    const newSayur = [...pesanan.sayur];
    newSayur[index][field] = field === "kg" ? Number(value) : value;
    setPesanan({ ...pesanan, sayur: newSayur });
  };

  const tambahSayur = () => {
    setPesanan({
      ...pesanan,
      sayur: [...pesanan.sayur, { nama: "", kg: 0 }],
    });
  };

  const hapusSayur = (index: number) => {
    const newSayur = [...pesanan.sayur];
    newSayur.splice(index, 1);
    setPesanan({ ...pesanan, sayur: newSayur });
  };

  /* ======================
     SIMPAN KE SUPABASE
  ====================== */
  const simpanPesanan = async () => {
    const rows = pesanan.sayur
      .filter((s) => s.nama && s.kg > 0)
      .map((s) => ({
        tanggal,
        dapur: pesanan.dapur,
        nama_sayur: s.nama,
        kg: s.kg,
      }));

    if (rows.length === 0) {
      alert("❌ Tidak ada data");
      return;
    }

    const { error } = await supabase
      .from("aplikasi_rekap_sayur")
      .insert(rows);

    if (error) {
      alert("❌ Gagal simpan: " + error.message);
    } else {
      alert("✅ Pesanan berhasil dikirim");
      setPesanan({ ...pesanan, sayur: [{ nama: "", kg: 0 }] });
    }
  };

  /* ======================
     UI
  ====================== */
  return (
    <div className="app-container">
      <div className="app-header">
        <h2>Rekap Kebutuhan Sayur – MBG</h2>
        <p>{tanggal}</p>
      </div>

      {/* FORM DAPUR */}
      <div className="dapur-card">
        <select
          value={pesanan.dapur}
          onChange={(e) => setPesanan({ ...pesanan, dapur: e.target.value })}
        >
          {dapurList.map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>

        {pesanan.sayur.map((s, i) => (
          <div key={i} style={{ marginTop: 6 }}>
            <input
              placeholder="Nama Sayur"
              value={s.nama}
              onChange={(e) => updateSayur(i, "nama", e.target.value)}
            />
            <input
              type="number"
              value={s.kg}
              onChange={(e) => updateSayur(i, "kg", e.target.value)}
            />
            <button className="danger" onClick={() => hapusSayur(i)}>
              Hapus
            </button>
          </div>
        ))}

        <button onClick={tambahSayur}>+ Tambah Sayur</button>
        <br />
        <br />
        <button onClick={simpanPesanan}>💾 SIMPAN PESANAN</button>
      </div>

      {/* ADMIN */}
      <div className="admin-panel">
        {!isAdmin ? (
          <>
            <input
              type="password"
              placeholder="PIN Admin"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
            />
            <button
              onClick={() => {
                if (pinInput === ADMIN_PIN) setIsAdmin(true);
                else alert("PIN salah");
              }}
            >
              Masuk Admin
            </button>
          </>
        ) : (
          <strong>Mode Admin Aktif</strong>
        )}
      </div>
    </div>
  );
}
