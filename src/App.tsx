import { useEffect, useState } from "react";
const supabaseUrl = "https://rqmcpnkpctdlrayvouly.supabase.co";
const supabaseAnonKey = "sb_publishable_8Phqrx84tQKTHlm5Rkwffw__qC0V3Q2";
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

const ADMIN_PIN = "0852"; // ganti PIN sesukamu
const todayISO = new Date().toISOString().split("T")[0];

const tanggalIndonesia = new Date().toLocaleDateString("id-ID", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

/* ======================
   TYPE DATA
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
  /* ===== ADMIN ===== */
  const [isAdmin, setIsAdmin] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [selectedDate, setSelectedDate] = useState(todayISO);

  const dataKey = "MBG-" + selectedDate;

  /* ===== DATA ===== */
  const [data, setData] = useState<Dapur[]>(() => {
    const saved = localStorage.getItem(dataKey);
    if (saved) return JSON.parse(saved);

    return dapurList.map((d) => ({
      nama: d,
      sayur: [{ nama: "", kg: 0 }],
    }));
  });

  /* simpan otomatis */
  useEffect(() => {
    localStorage.setItem(dataKey, JSON.stringify(data));
  }, [data, dataKey]);

  /* ganti data saat ganti tanggal */
  useEffect(() => {
    const saved = localStorage.getItem(dataKey);
    if (saved) {
      setData(JSON.parse(saved));
    } else {
      setData(
        dapurList.map((d) => ({
          nama: d,
          sayur: [{ nama: "", kg: 0 }],
        }))
      );
    }
  }, [dataKey]);

  /* ===== HANDLER ===== */
  const updateSayur = (
    dIndex: number,
    sIndex: number,
    field: "nama" | "kg",
    value: string
  ) => {
    const newData = [...data];
    if (field === "kg") {
      newData[dIndex].sayur[sIndex].kg = Number(value);
    } else {
      newData[dIndex].sayur[sIndex].nama = value;
    }
    setData(newData);
  };

  const tambahSayur = (dIndex: number) => {
    const newData = [...data];
    newData[dIndex].sayur.push({ nama: "", kg: 0 });
    setData(newData);
  };

  const hapusSayur = (dIndex: number, sIndex: number) => {
    const newData = [...data];
    newData[dIndex].sayur.splice(sIndex, 1);
    setData(newData);
  };

  const totalKg = data.reduce(
    (t, d) => t + d.sayur.reduce((s, x) => s + x.kg, 0),
    0
  );

  /* ===== EXPORT ===== */
  const exportExcel = () => {
    let csv = "Tanggal,Dapur,Nama Sayur,Kg\n";
    data.forEach((d) => {
      d.sayur.forEach((s) => {
        csv += `${selectedDate},${d.nama},${s.nama},${s.kg}\n`;
      });
    });

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Rekap-Sayur-${selectedDate}.csv`;
    link.click();
  };

  /* ======================
     UI
  ====================== */
  return (
    <div className="app-container">
      {/* HEADER */}
      <div className="app-header">
        <h2>Rekap Kebutuhan Sayur – MBG</h2>
        <p>{tanggalIndonesia}</p>
      </div>

      {/* ADMIN PANEL */}
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
                if (pinInput === ADMIN_PIN) {
                  setIsAdmin(true);
                  setPinInput("");
                } else {
                  alert("PIN salah");
                }
              }}
            >
              Masuk Admin
            </button>
          </>
        ) : (
          <>
            <strong>Mode Admin Aktif</strong>
            <br />
            <label>Pilih Tanggal: </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
            <button
              className="secondary"
              style={{ marginLeft: 10 }}
              onClick={() => {
                setIsAdmin(false);
                setSelectedDate(todayISO);
              }}
            >
              Keluar Admin
            </button>
          </>
        )}
      </div>

      {/* GRID DAPUR */}
      <div className="dapur-grid">
        {data.map((d, dIndex) => (
          <div className="dapur-card" key={dIndex}>
            <h3>{d.nama}</h3>

            {d.sayur.map((s, sIndex) => (
              <div key={sIndex} style={{ marginBottom: 6 }}>
                <input
                  placeholder="Nama Sayur"
                  value={s.nama}
                  onChange={(e) =>
                    updateSayur(dIndex, sIndex, "nama", e.target.value)
                  }
                />
                <input
                  type="number"
                  placeholder="Kg"
                  value={s.kg}
                  onChange={(e) =>
                    updateSayur(dIndex, sIndex, "kg", e.target.value)
                  }
                  style={{ marginLeft: 5 }}
                />
                <button
                  className="danger"
                  style={{ marginLeft: 5 }}
                  onClick={() => hapusSayur(dIndex, sIndex)}
                >
                  Hapus
                </button>
              </div>
            ))}

            <button onClick={() => tambahSayur(dIndex)}>
              + Tambah Sayur
            </button>
          </div>
        ))}
      </div>

      {/* FOOTER */}
      <div className="app-footer">
        {isAdmin && (
          <>
            <button onClick={exportExcel} style={{ marginRight: 10 }}>
              Export Excel
            </button>
            <button onClick={() => window.print()}>
              Export PDF
            </button>
            <br />
            <br />
          </>
        )}
        Total Semua Sayur: {totalKg} Kg
      </div>
    </div>
  );
}
