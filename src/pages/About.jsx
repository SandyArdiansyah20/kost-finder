export default function About() {
    return (
        <div className="mx-auto max-w-3xl space-y-6 rounded-xl bg-white p-6 shadow-sm sm:p-8">
            <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-pine">Tentang KostFinder</h1>
                <p className="mt-2 text-slate-600">
                    Platform pencarian dan pengelolaan indekos yang memudahkan pencari menemukan hunian nyaman sesuai kebutuhan, serta membantu pemilik kos mengelola properti dan penyewaan secara praktis.
                </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
                    <h2 className="font-bold text-slate-900">Untuk Pencari Kos</h2>
                    <p className="mt-1 text-sm text-slate-600">
                        Cari kos berdasarkan kota, tipe penghuni, rentang harga, serta filter fasilitas spesifik, lalu ajukan booking langsung secara online.
                    </p>
                </div>
                <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
                    <h2 className="font-bold text-slate-900">Untuk Pemilik Kos</h2>
                    <p className="mt-1 text-sm text-slate-600">
                        Kelola daftar kamar, pantau ketersediaan unit secara real-time, dan tanggapi pengajuan sewa dari calon penghuni dalam satu dashboard.
                    </p>
                </div>
            </div>
        </div>
    )
}