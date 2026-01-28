import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

/* ======================
   SUPABASE
====================== */
const supabase = createClient(
  "https://rqmcpnkpctdlrayvouly.supabase.co",
  "ISI_ANON_PUBLIC_KEY"
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

/* ======================
   TYPE
====================== */
type Sayur = {
  nama: string;
  kg: number;
};

type DataDB = {
  id: string;
  tanggal: string;
  dapur: string;
  nama_sayur: string;
  kg: number;
};

/* ======================
   APP
====================== */
export default function App() {
  const [dapur, setDapur] = useState(dapurList[0]);
  const [sayur, setSayur] = useState<Sayur[]>([{ nama: "", kg: 0 }]);

  const [isAdmin, setIsAdmin] = useState(false);
  const [pin, setPin] = useState("");
  const [tanggal, setTanggal] = useState(todayISO);

  const [dataAdmin, setDataAdmin] = useState<DataDB[]>([]);

  /* ======================
     SIMPAN PESANAN
  ====================== */
  const simpanPesanan = async () => {
    const rows = sayur
      .filter((s) => s.nama && s.kg > 0)
      .map((s) => ({
        tanggal,
        dapur,
        nama_sayur: s.nama,
        kg: s.kg,
      }));

    if (rows.length === 0) {
      alert("❗ Isi sayur dulu");
      return;
    }

    const { error } = await supabase
      .from("aplikasi_rekap_sayur")
      .insert(rows);

    if (error) {
      alert("❌ Gagal simpan: " + error.message);
    } else {
      alert("✅ Pesanan terkirim");
      setSayur([{ nama: "", kg: 0 }]);
    }
  };

  /* ======================
     AMBIL DATA ADMIN
  ====================== */
  const ambilDataAdmin = async () => {
    const { data, error } = await supabase
      .from("aplikasi_rekap_sayur")
      .select("*")
      .eq("tanggal", tanggal)
      .order("dapur");

    if (error) {
      alert("❌ Gagal ambil data");
    } else {
      setDataAdmin(data || []);
    }
  };

  useEffect(() => {
    if (isAdmin) ambilDataAdmin();
  }, [isAdmin, tanggal]);

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
      {!isAdmin && (
        <>
          <select value={dapur} onChange={(e) => setDapur(e.target.value)}>
            {dapurList.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>

          {sayur.map((s, i) => (
            <div key={i}>
              <input
                placeholder="Nama Sayur"
                value={s.nama}
                onChange={(e) => {
                  const n = [...sayur];
                  n[i].nama = e.target.value;
                  setSayur(n);
                }}
              />
              <input
                type="number"
                placeholder="Kg"
                value={s.kg}
                onChange={(e) => {
                  const n = [...sayur];
                  n[i].kg = Number(e.target.value);
                  setSayur(n);
                }}
              />
            </div>
          ))}

          <button onClick={() => setSayur([...sayur, { nama: "", kg: 0 }])}>
            + Tambah Sayur
          </button>

          <br /><br />

          <button onClick={simpanPesanan}>
            💾 SIMPAN PESANAN
          </button>
        </>
      )}

      {/* ADMIN PANEL */}
      <div className="admin-panel">
        {!isAdmin ? (
          <>
            <input
              type="password"
              placeholder="PIN Admin"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
            />
            <button
              onClick={() => {
                if (pin === ADMIN_PIN) {
                  setIsAdmin(true);
                  setPin("");
                } else {
                  alert("❌ PIN salah");
                }
              }}
            >
              Masuk Admin
            </button>
          </>
        ) : (
          <>
            <strong>MODE ADMIN</strong><br />
            <input
              type="date"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
            />
            <button onClick={() => setIsAdmin(false)}>
              Keluar
            </button>
          </>
        )}
      </div>

      {/* DATA ADMIN */}
      {isAdmin && (
        <div className="dapur-grid">
          {dataAdmin.map((d) => (
            <div className="dapur-card" key={d.id}>
              <strong>{d.dapur}</strong><br />
              {d.nama_sayur} — {d.kg} Kg
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
