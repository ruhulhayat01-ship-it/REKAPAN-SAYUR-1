import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

/* ======================
   SUPABASE
====================== */
const supabaseUrl = "https://rqmcpnkpctdlrayvouly.supabase.co";
const supabaseAnonKey = "sb_publishable_8Phqrx84tQKTHlm5Rkwffw__qC0V3Q2";
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

const ADMIN_PIN = "0852";
const todayISO = new Date().toISOString().split("T")[0];

const tanggalIndonesia = new Date().toLocaleDateString("id-ID", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

/* ======================
   TYPE
====================== */
type Sayur = {
  nama: string;
  kg: number;
};

type Dapur = {
  nama: string;
  sayur: Sayur[];
};

/* ======================
   APP
====================== */
export default function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [selectedDate, setSelectedDate] = useState(todayISO);

  const dataKey = "MBG-" + selectedDate;

  const [data, setData] = useState<Dapur[]>(() => {
    const saved = localStorage.getItem(dataKey);
    if (saved) return JSON.parse(saved);

    return dapurList.map((d) => ({
      nama: d,
      sayur: [{ nama: "", kg: 0 }],
    }));
  });

  /* ======================
     SIMPAN KE SUPABASE
  ====================== */
  const simpanKeDatabase = async () => {
    const rows: any[] = [];

    data.forEach((d) => {
      d.sayur.forEach((s) => {
        if (s.nama && s.kg > 0) {
          rows.push({
            tanggal: selectedDate,
            dapur: d.nama,
            nama_sayur: s.nama,
            kg: s.kg,
          });
        }
      });
    });

    const { error } = await supabase
      .from("aplikasi_rekap_sayur")
      .insert(rows);

    if (error) {
      alert("❌ Gagal simpan: " + error.message);
    } else {
      alert("✅ Data berhasil disimpan");
    }
  };

  /* ======================
     UI
  ====================== */
  return (
    <div className="app-container">
      <h2>Rekap Kebutuhan Sayur – MBG</h2>

      {data.map((d, dIndex) => (
        <div key={dIndex}>
          <h3>{d.nama}</h3>

          {d.sayur.map((s, sIndex) => (
            <div key={sIndex}>
              <input
                placeholder="Nama Sayur"
                value={s.nama}
                onChange={(e) => {
                  const newData = [...data];
                  newData[dIndex].sayur[sIndex].nama = e.target.value;
                  setData(newData);
                }}
              />
              <input
                type="number"
                placeholder="Kg"
                value={s.kg}
                onChange={(e) => {
                  const newData = [...data];
                  newData[dIndex].sayur[sIndex].kg = Number(e.target.value);
                  setData(newData);
                }}
              />
            </div>
          ))}
        </div>
      ))}

      {/* 🔥 INI BARU BENAR */}
      {isAdmin && (
        <button onClick={simpanKeDatabase}>
          💾 Simpan Data ke Database
        </button>
      )}
    </div>
  );
}
