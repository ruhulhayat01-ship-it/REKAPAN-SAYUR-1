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

/* ======================
   TYPE
====================== */
type Sayur = { nama: string; kg: number };
type DapurData = { nama: string; sayur: Sayur[] };

type Order = {
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

  const [data, setData] = useState<DapurData[]>(
    dapurList.map((d) => ({
      nama: d,
      sayur: [{ nama: "", kg: 0 }],
    }))
  );

  const [orders, setOrders] = useState<Order[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [editNama, setEditNama] = useState("");
  const [editKg, setEditKg] = useState(0);

  /* ======================
     HANDLER INPUT
  ====================== */
  const updateSayur = (
    dIndex: number,
    sIndex: number,
    field: "nama" | "kg",
    value: string
  ) => {
    const newData = [...data];
    newData[dIndex].sayur[sIndex][field] =
      field === "kg" ? Number(value) : value;
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

  /* ======================
     SIMPAN PER DAPUR
  ====================== */
  const simpanPesanan = async (dIndex: number) => {
    const dapur = data[dIndex];

    const rows = dapur.sayur
      .filter((s) => s.nama && s.kg > 0)
      .map((s) => ({
        tanggal,
        dapur: dapur.nama,
        nama_sayur: s.nama,
        kg: s.kg,
      }));

    if (!rows.length) {
      alert("❌ Tidak ada data");
      return;
    }

    const { error } = await supabase
      .from("aplikasi_rekap_sayur")
      .insert(rows);

    if (error) {
      alert("❌ Gagal simpan: " + error.message);
    } else {
      alert(`✅ Pesanan ${dapur.nama} tersimpan`);
    }
  };

  /* ======================
     ADMIN LOAD DATA
  ====================== */
  const loadOrders = async () => {
    const { data, error } = await supabase
      .from("aplikasi_rekap_sayur")
      .select("*")
      .eq("tanggal", tanggal)
      .order("dapur");

    if (!error && data) setOrders(data);
  };

  useEffect(() => {
    if (isAdmin) loadOrders();
  }, [isAdmin, tanggal]);

  /* ======================
     ADMIN EDIT
  ====================== */
  const simpanEdit = async () => {
    const { error } = await supabase
      .from("aplikasi_rekap_sayur")
      .update({
        nama_sayur: editNama,
        kg: editKg,
      })
      .eq("id", editId);

    if (error) {
      alert("❌ Gagal update");
    } else {
      alert("✅ Data diperbarui");
      setEditId(null);
      loadOrders();
    }
  };

  const hapusOrder = async (id: string) => {
    if (!confirm("Hapus pesanan ini?")) return;

    const { error } = await supabase
      .from("aplikasi_rekap_sayur")
      .delete()
      .eq("id", id);

    if (!error) loadOrders();
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
            <button
              className="secondary"
              onClick={() => setIsAdmin(false)}
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
              <div key={sIndex}>
                <input
                  placeholder="Nama Sayur"
                  value={s.nama}
                  onChange={(e) =>
                    updateSayur(dIndex, sIndex, "nama", e.target.value)
                  }
                />
                <input
                  type="number"
                  value={s.kg}
                  onChange={(e) =>
                    updateSayur(dIndex, sIndex, "kg", e.target.value)
                  }
                />
                <button
                  className="danger"
                  onClick={() => hapusSayur(dIndex, sIndex)}
                >
                  Hapus
                </button>
              </div>
            ))}

            <button onClick={() => tambahSayur(dIndex)}>
              + Tambah Sayur
            </button>

            <br />
            <br />

            <button onClick={() => simpanPesanan(dIndex)}>
              💾 SIMPAN PESANAN
            </button>
          </div>
        ))}
      </div>

      {/* ADMIN LIST */}
      {isAdmin && (
        <div style={{ marginTop: 30 }}>
          <h3>📋 Data Pesanan</h3>

          {orders.map((o) => (
            <div className="dapur-card" key={o.id}>
              <strong>{o.dapur}</strong> —{" "}
              {editId === o.id ? (
                <>
                  <input
                    value={editNama}
                    onChange={(e) => setEditNama(e.target.value)}
                  />
                  <input
                    type="number"
                    value={editKg}
                    onChange={(e) =>
                      setEditKg(Number(e.target.value))
                    }
                  />
                  <button onClick={simpanEdit}>Simpan</button>
                  <button onClick={() => setEditId(null)}>
                    Batal
                  </button>
                </>
              ) : (
                <>
                  {o.nama_sayur} ({o.kg} Kg)
                  <button
                    onClick={() => {
                      setEditId(o.id);
                      setEditNama(o.nama_sayur);
                      setEditKg(o.kg);
                    }}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    className="danger"
                    onClick={() => hapusOrder(o.id)}
                  >
                    🗑️ Hapus
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
