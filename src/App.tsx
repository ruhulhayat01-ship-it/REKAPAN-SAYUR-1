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
};

/* ======================
   APP
====================== */
export default function App() {
  const [tanggal, setTanggal] = useState(todayISO);
  const [isAdmin, setIsAdmin] = useState(false);
  const [pin, setPin] = useState("");

  /* INPUT PER DAPUR */
  const [input, setInput] = useState<Record<string, Sayur[]>>(
    Object.fromEntries(
      dapurList.map((d) => [d, [{ nama: "", kg: 0 }]])
    )
  );

  /* DATA DARI DATABASE */
  const [pesanan, setPesanan] = useState<Pesanan[]>([]);

  /* ======================
     LOAD DATA DB
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
     HANDLER INPUT
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
     SIMPAN (UPSERT)
  ====================== */
  const simpanPesanan = async (dapur: string) => {
    const rows = input[dapur]
      .filter((s) => s.nama && s.kg > 0)
      .map((s) => ({
        tanggal,
        dapur,
        nama_sayur: s.nama,
        kg: s.kg,
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

    await loadPesanan();
    alert(`✅ Pesanan ${dapur} tersimpan`);
  };

  /* ======================
     EDIT & HAPUS (DB)
  ====================== */
  const updatePesanan = async (
    id: string,
    field: "nama_sayur" | "kg",
    value: string
  ) => {
    await supabase
      .from("aplikasi_rekap_sayur")
      .update({
        [field]: field === "kg" ? Number(value) : value,
      })
      .eq("id", id);

    loadPesanan();
  };

  const hapusPesanan = async (id: string) => {
    if (!confirm("Hapus pesanan ini?")) return;

    await supabase
      .from("aplikasi_rekap_sayur")
      .delete()
      .eq("id", id);

    loadPesanan();
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
            <button
              onClick={() =>
                pin === ADMIN_PIN
                  ? setIsAdmin(true)
                  : alert("PIN salah")
              }
            >
              Masuk Admin
            </button>
          </>
        ) : (
          <>
            <strong>Mode Admin Aktif</strong>
            <br />
            <input
              type="date"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
            />
            <button className="secondary" onClick={() => setIsAdmin(false)}>
              Keluar Admin
            </button>
          </>
        )}
      </div>

      {/* INPUT GRID */}
      <div className="dapur-grid">
        {dapurList.map((dapur) => (
          <div className="dapur-card" key={dapur}>
            <h3>{dapur}</h3>

            {input[dapur].map((s, i) => (
              <div key={i}>
                <input
                  placeholder="Nama Sayur"
                  value={s.nama}
                  onChange={(e) =>
                    updateSayur(dapur, i, "nama", e.target.value)
                  }
                />
                <input
                  type="number"
                  value={s.kg}
                  onChange={(e) =>
                    updateSayur(dapur, i, "kg", e.target.value)
                  }
                />
                <button
                  className="danger"
                  onClick={() => hapusSayur(dapur, i)}
                >
                  Hapus
                </button>
              </div>
            ))}

            <button onClick={() => tambahSayur(dapur)}>
              + Tambah Sayur
            </button>
            <br /><br />
            <button onClick={() => simpanPesanan(dapur)}>
              💾 SIMPAN PESANAN
            </button>
          </div>
        ))}
      </div>

      {/* TABEL DATA */}
      <h3 style={{ marginTop: 30 }}>📋 Data Pesanan</h3>

      <table width="100%" cellPadding={6} border={1}>
        <thead>
          <tr>
            <th>Dapur</th>
            <th>Sayur</th>
            <th>Kg</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {pesanan.map((p) => (
            <tr key={p.id}>
              <td>{p.dapur}</td>
              <td>
                <input
                  value={p.nama_sayur}
                  onChange={(e) =>
                    updatePesanan(p.id, "nama_sayur", e.target.value)
                  }
                />
              </td>
              <td>
                <input
                  type="number"
                  value={p.kg}
                  onChange={(e) =>
                    updatePesanan(p.id, "kg", e.target.value)
                  }
                />
              </td>
              <td>
                <button
                  className="danger"
                  onClick={() => hapusPesanan(p.id)}
                >
                  Hapus
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
