// =========================================================================
// NAVIGASI SIDEBAR MODULAR (SKFLS)
// =========================================================================

const menuHTML = `
    <!-- TAJUK PORTAL -->
    <div class="p-6 text-center border-b border-slate-700 sticky top-0 bg-slate-900 z-10 flex justify-between items-center md:block">
        <div>
            <h1 class="text-2xl font-bold tracking-wider text-blue-400">SKFLS</h1>
            <p class="text-xs text-slate-400 mt-1">Portal Kurikulum Digital</p>
        </div>
    </div>

    <!-- PAUTAN NAVIGASI -->
    <nav class="flex-1 px-3 py-4 space-y-1 overflow-y-auto pb-20 custom-scrollbar text-xs">
        
        <!-- DASHBOARD UTAMA -->
        <a href="index.html" class="flex items-center space-x-3 p-2 bg-blue-600 rounded-lg text-white font-medium transition mb-2">
            <i class="fas fa-home w-5 text-center text-sm"></i> <span class="text-sm">Dashboard Utama</span>
        </a>

        <!-- ADMIN CONSOLE (KHAS UNTUK ADMIN) -->
        <a href="admin.html" class="hanya-admin hidden flex items-center space-x-3 p-2 text-amber-300 hover:bg-slate-800 rounded-lg transition mb-3">
            <i class="fas fa-cogs w-5 text-center text-sm"></i> <span class="text-sm font-medium">Admin Console</span>
        </a>

        <!-- 1. PENGURUSAN UNIT KURIKULUM -->
        <details class="group mb-1">
            <summary class="flex justify-between items-center p-2 rounded-lg text-slate-300 hover:bg-slate-800 cursor-pointer transition select-none font-semibold">
                <span class="flex items-center space-x-2.5"><i class="fas fa-sitemap w-4 text-center text-blue-400"></i><span>1. Pengurusan Unit</span></span>
                <i class="fas fa-chevron-down text-[10px] transition-transform duration-200 group-open:rotate-180 text-slate-500"></i>
            </summary>
            <div class="ml-3 pl-3 border-l border-slate-700 my-1 space-y-1 text-slate-400">
                <a href="panitia.html?subjek=surat_lantikan_kurikulum" class="block p-1.5 hover:text-white hover:bg-slate-800 rounded">Surat Lantikan JK</a>
                <a href="panitia.html?subjek=carta_kurikulum" class="block p-1.5 hover:text-white hover:bg-slate-800 rounded">Carta Organisasi Unit</a>
                <a href="panitia.html?subjek=visi_misi_kpm" class="block p-1.5 hover:text-white hover:bg-slate-800 rounded">Visi & Misi KPM</a>
                <a href="panitia.html?subjek=visi_misi_sekolah" class="block p-1.5 hover:text-white hover:bg-slate-800 rounded">Visi & Misi Sekolah</a>
                <a href="panitia.html?subjek=dasar_kurikulum" class="block p-1.5 hover:text-white hover:bg-slate-800 rounded">Matlamat / Dasar / Ketetapan</a>
                <a href="panitia.html?subjek=buku_pengurusan" class="block p-1.5 hover:text-white hover:bg-slate-800 rounded">Buku Pengurusan Kurikulum</a>
                <a href="panitia.html?subjek=takwim_persekolahan" class="block p-1.5 hover:text-white hover:bg-slate-800 rounded">Takwim Persekolahan</a>
                <a href="panitia.html?subjek=takwim_kurikulum" class="block p-1.5 hover:text-white hover:bg-slate-800 rounded">Takwim Kurikulum</a>
            </div>
        </details>

        <!-- 2. PEKELILING & MAKLUMAN -->
        <details class="group mb-1">
            <summary class="flex justify-between items-center p-2 rounded-lg text-slate-300 hover:bg-slate-800 cursor-pointer transition select-none font-semibold">
                <span class="flex items-center space-x-2.5"><i class="fas fa-file-contract w-4 text-center text-emerald-400"></i><span>2. Pekeliling & Makluman</span></span>
                <i class="fas fa-chevron-down text-[10px] transition-transform duration-200 group-open:rotate-180 text-slate-500"></i>
            </summary>
            <div class="ml-3 pl-3 border-l border-slate-700 my-1 space-y-1 text-slate-400">
                <a href="panitia.html?subjek=spi" class="block p-1.5 hover:text-white hover:bg-slate-800 rounded">Surat Pekeliling Ikhtisas (SPI)</a>
                <a href="panitia.html?subjek=surat_makluman" class="block p-1.5 hover:text-white hover:bg-slate-800 rounded">Surat Makluman</a>
            </div>
        </details>

        <!-- 3. DOKUMEN KURIKULUM -->
        <details class="group mb-1">
            <summary class="flex justify-between items-center p-2 rounded-lg text-slate-300 hover:bg-slate-800 cursor-pointer transition select-none font-semibold">
                <span class="flex items-center space-x-2.5"><i class="fas fa-folder-open w-4 text-center text-amber-400"></i><span>3. Dokumen Kurikulum</span></span>
                <i class="fas fa-chevron-down text-[10px] transition-transform duration-200 group-open:rotate-180 text-slate-500"></i>
            </summary>
            <div class="ml-3 pl-3 border-l border-slate-700 my-1 space-y-1 text-slate-400">
                <a href="panitia.html?subjek=dskp" class="block p-1.5 hover:text-white hover:bg-slate-800 rounded">DSKP Semua Mata Pelajaran</a>
                <a href="panitia.html?subjek=bahan_muat_turun" class="block p-1.5 hover:text-white hover:bg-slate-800 rounded">Bahan Dimuat Turun</a>
                <a href="panitia.html?subjek=bahan_muat_naik" class="block p-1.5 hover:text-white hover:bg-slate-800 rounded">Bahan Dimuat Naik</a>
            </div>
        </details>

        <!-- 4. PERANCANGAN KURIKULUM -->
        <details class="group mb-1">
            <summary class="flex justify-between items-center p-2 rounded-lg text-slate-300 hover:bg-slate-800 cursor-pointer transition select-none font-semibold">
                <span class="flex items-center space-x-2.5"><i class="fas fa-chart-line w-4 text-center text-purple-400"></i><span>4. Perancangan Kurikulum</span></span>
                <i class="fas fa-chevron-down text-[10px] transition-transform duration-200 group-open:rotate-180 text-slate-500"></i>
            </summary>
            <div class="ml-3 pl-3 border-l border-slate-700 my-1 space-y-1 text-slate-400">
                <a href="panitia.html?subjek=perancangan_strategik" class="block p-1.5 hover:text-white hover:bg-slate-800 rounded">Perancangan Strategik</a>
                <a href="panitia.html?subjek=analisis_swot" class="block p-1.5 hover:text-white hover:bg-slate-800 rounded">Analisis SWOT</a>
                <a href="panitia.html?subjek=pelan_taktikal" class="block p-1.5 hover:text-white hover:bg-slate-800 rounded">Pelan Taktikal</a>
                <a href="panitia.html?subjek=pelan_operasi" class="block p-1.5 hover:text-white hover:bg-slate-800 rounded">Pelan Operasi</a>
                <a href="panitia.html?subjek=oppm_pintas" class="block p-1.5 hover:text-white hover:bg-slate-800 rounded">OPPM & PINTAS</a>
            </div>
        </details>

        <!-- 5. MENGURUS MASA INSTRUKSIONAL -->
        <details class="group mb-1">
            <summary class="flex justify-between items-center p-2 rounded-lg text-slate-300 hover:bg-slate-800 cursor-pointer transition select-none font-semibold">
                <span class="flex items-center space-x-2.5"><i class="fas fa-clock w-4 text-center text-cyan-400"></i><span>5. Masa Instruksional</span></span>
                <i class="fas fa-chevron-down text-[10px] transition-transform duration-200 group-open:rotate-180 text-slate-500"></i>
            </summary>
            <div class="ml-3 pl-3 border-l border-slate-700 my-1 space-y-1 text-slate-400">
                <a href="panitia.html?subjek=jk_jadual_waktu" class="block p-1.5 hover:text-white hover:bg-slate-800 rounded">JK Jadual Waktu</a>
                <a href="panitia.html?subjek=jadual_waktu" class="block p-1.5 hover:text-white hover:bg-slate-800 rounded">Jadual Waktu Induk/Kelas</a>
                <a href="panitia.html?subjek=jadual_guru_ganti" class="block p-1.5 hover:text-white hover:bg-slate-800 rounded">Jadual Guru Ganti</a>
            </div>
        </details>

        <!-- 6. MESYUARAT INDUK KURIKULUM -->
        <details class="group mb-1">
            <summary class="flex justify-between items-center p-2 rounded-lg text-slate-300 hover:bg-slate-800 cursor-pointer transition select-none font-semibold">
                <span class="flex items-center space-x-2.5"><i class="fas fa-users w-4 text-center text-rose-400"></i><span>6. Mesyuarat Induk</span></span>
                <i class="fas fa-chevron-down text-[10px] transition-transform duration-200 group-open:rotate-180 text-slate-500"></i>
            </summary>
            <div class="ml-3 pl-3 border-l border-slate-700 my-1 space-y-1 text-slate-400">
                <a href="panitia.html?subjek=mesyuarat_bil1" class="block p-1.5 hover:text-white hover:bg-slate-800 rounded">Minit Mesyuarat Bil. 1</a>
                <a href="panitia.html?subjek=mesyuarat_bil2" class="block p-1.5 hover:text-white hover:bg-slate-800 rounded">Minit Mesyuarat Bil. 2</a>
                <a href="panitia.html?subjek=mesyuarat_bil3" class="block p-1.5 hover:text-white hover:bg-slate-800 rounded">Minit Mesyuarat Bil. 3</a>
                <a href="panitia.html?subjek=mesyuarat_bil4" class="block p-1.5 hover:text-white hover:bg-slate-800 rounded">Minit Mesyuarat Bil. 4</a>
                <a href="panitia.html?subjek=maklum_balas_mesyuarat" class="block p-1.5 hover:text-white hover:bg-slate-800 rounded">Maklum Balas Minit</a>
            </div>
        </details>

        <!-- 7. PENGURUSAN PANITIA & PROGRAM -->
        <details class="group mb-1">
            <summary class="flex justify-between items-center p-2 rounded-lg text-slate-300 hover:bg-slate-800 cursor-pointer transition select-none font-semibold">
                <span class="flex items-center space-x-2.5"><i class="fas fa-graduation-cap w-4 text-center text-indigo-400"></i><span>7. Panitia & Program</span></span>
                <i class="fas fa-chevron-down text-[10px] transition-transform duration-200 group-open:rotate-180 text-slate-500"></i>
            </summary>
            <div class="ml-3 pl-3 border-l border-slate-700 my-1 space-y-1 text-slate-400">
                <!-- SUB-DROPDOWN PANITIA SUBJEK -->
                <details class="group/sub my-1">
                    <summary class="flex justify-between items-center p-1.5 rounded hover:bg-slate-800 hover:text-white cursor-pointer transition">
                        <span>Nama Panitia (12 Subjek)</span>
                        <i class="fas fa-chevron-right text-[9px] transition-transform duration-200 group-open/sub:rotate-90 text-slate-500"></i>
                    </summary>
                    <div class="ml-2 pl-2 border-l border-slate-600 my-1 space-y-1 text-slate-300">
                        <a href="panitia.html?subjek=bm" class="block p-1 hover:text-white">Bahasa Melayu</a>
                        <a href="panitia.html?subjek=bi" class="block p-1 hover:text-white">Bahasa Inggeris</a>
                        <a href="panitia.html?subjek=mt" class="block p-1 hover:text-white">Matematik</a>
                        <a href="panitia.html?subjek=sn" class="block p-1 hover:text-white">Sains</a>
                        <a href="panitia.html?subjek=pi" class="block p-1 hover:text-white">Pendidikan Islam</a>
                        <a href="panitia.html?subjek=pm" class="block p-1 hover:text-white">Pendidikan Moral</a>
                        <a href="panitia.html?subjek=sej" class="block p-1 hover:text-white">Sejarah</a>
                        <a href="panitia.html?subjek=rbt" class="block p-1 hover:text-white">RBT</a>
                        <a href="panitia.html?subjek=psv" class="block p-1 hover:text-white">Pend. Seni Visual</a>
                        <a href="panitia.html?subjek=mz" class="block p-1 hover:text-white">Pend. Muzik</a>
                        <a href="panitia.html?subjek=pjpk" class="block p-1 hover:text-white">PJPK</a>
                        <a href="panitia.html?subjek=ba" class="block p-1 hover:text-white">Bahasa Arab</a>
                    </div>
                </details>

                <a href="panitia.html?subjek=plc_panitia" class="block p-1.5 hover:text-white hover:bg-slate-800 rounded">PLC Panitia</a>
                <a href="panitia.html?subjek=kertas_kerja_program" class="block p-1.5 hover:text-white hover:bg-slate-800 rounded">Kertas Kerja Program</a>
                <a href="panitia.html?subjek=laporan_program" class="block p-1.5 hover:text-white hover:bg-slate-800 rounded">Dokumentasi / Laporan</a>
            </div>
        </details>

        <!-- 8. PEMANTAUAN KURIKULUM -->
        <details class="group mb-1">
            <summary class="flex justify-between items-center p-2 rounded-lg text-slate-300 hover:bg-slate-800 cursor-pointer transition select-none font-semibold">
                <span class="flex items-center space-x-2.5"><i class="fas fa-tasks w-4 text-center text-teal-400"></i><span>8. Pemantauan Kurikulum</span></span>
                <i class="fas fa-chevron-down text-[10px] transition-transform duration-200 group-open:rotate-180 text-slate-500"></i>
            </summary>
            <div class="ml-3 pl-3 border-l border-slate-700 my-1 space-y-1 text-slate-400">
                <a href="panitia.html?subjek=instrumen_pencerapan" class="block p-1.5 hover:text-white hover:bg-slate-800 rounded">Instrumen Pencerapan</a>
                <a href="panitia.html?subjek=jadual_pencerapan" class="block p-1.5 hover:text-white hover:bg-slate-800 rounded">Agihan Jadual Pencerapan</a>
                <a href="panitia.html?subjek=pencerapan_erph" class="block p-1.5 hover:text-white hover:bg-slate-800 rounded">Pencerapan e-RPH</a>
                <a href="panitia.html?subjek=pencerapan_kendiri" class="block p-1.5 hover:text-white hover:bg-slate-800 rounded">PdPc Kendiri</a>
                <a href="panitia.html?subjek=pencerapan_fasa1" class="block p-1.5 hover:text-white hover:bg-slate-800 rounded">PdPc Fasa 1</a>
                <a href="panitia.html?subjek=pencerapan_fasa2" class="block p-1.5 hover:text-white hover:bg-slate-800 rounded">PdPc Fasa 2</a>
                <a href="panitia.html?subjek=semakan_buku_latihan" class="block p-1.5 hover:text-white hover:bg-slate-800 rounded">Semakan Buku Latihan</a>
            </div>
        </details>

        <!-- 9. PENTAKSIRAN BILIK DARJAH (PBD) -->
        <details class="group mb-1">
            <summary class="flex justify-between items-center p-2 rounded-lg text-slate-300 hover:bg-slate-800 cursor-pointer transition select-none font-semibold">
                <span class="flex items-center space-x-2.5"><i class="fas fa-spell-check w-4 text-center text-yellow-400"></i><span>9. Pentaksiran (PBD)</span></span>
                <i class="fas fa-chevron-down text-[10px] transition-transform duration-200 group-open:rotate-180 text-slate-500"></i>
            </summary>
            <div class="ml-3 pl-3 border-l border-slate-700 my-1 space-y-1 text-slate-400">
                <a href="panitia.html?subjek=jk_pbd" class="block p-1.5 hover:text-white hover:bg-slate-800 rounded">Jawatankuasa PBD</a>
                <a href="panitia.html?subjek=takwim_pbd" class="block p-1.5 hover:text-white hover:bg-slate-800 rounded">Takwim PBD</a>
                <a href="panitia.html?subjek=jadual_pbd" class="block p-1.5 hover:text-white hover:bg-slate-800 rounded">Jadual Pelaksanaan PBD</a>
                <a href="panitia.html?subjek=instrumen_pbd" class="block p-1.5 hover:text-white hover:bg-slate-800 rounded">Instrumen PBD</a>
                <a href="panitia.html?subjek=analisis_pbd" class="block p-1.5 hover:text-white hover:bg-slate-800 rounded">Analisis PBD</a>
                <a href="panitia.html?subjek=intervensi_pbd" class="block p-1.5 hover:text-white hover:bg-slate-800 rounded">Program Intervensi</a>
                <a href="panitia.html?subjek=penjaminan_kualiti_pbd" class="block p-1.5 hover:text-white hover:bg-slate-800 rounded">Penjaminan Kualiti</a>
                <a href="panitia.html?subjek=pelaporan_pbd" class="block p-1.5 hover:text-white hover:bg-slate-800 rounded">Pelaporan PBD</a>
            </div>
        </details>

        <!-- 10. UPSA / UASA -->
        <details class="group mb-1">
            <summary class="flex justify-between items-center p-2 rounded-lg text-slate-300 hover:bg-slate-800 cursor-pointer transition select-none font-semibold">
                <span class="flex items-center space-x-2.5"><i class="fas fa-award w-4 text-center text-pink-400"></i><span>10. UPSA / UASA</span></span>
                <i class="fas fa-chevron-down text-[10px] transition-transform duration-200 group-open:rotate-180 text-slate-500"></i>
            </summary>
            <div class="ml-3 pl-3 border-l border-slate-700 my-1 space-y-1 text-slate-400">
                <a href="panitia.html?subjek=takwim_upsa" class="block p-1.5 hover:text-white hover:bg-slate-800 rounded">Takwim Pentaksiran</a>
                <a href="panitia.html?subjek=jadual_upsa" class="block p-1.5 hover:text-white hover:bg-slate-800 rounded">Jadual UPSA / UASA</a>
                <a href="panitia.html?subjek=jadual_gubal_soalan" class="block p-1.5 hover:text-white hover:bg-slate-800 rounded">Jadual Penggubalan Soalan</a>
                <a href="panitia.html?subjek=analisis_upsa" class="block p-1.5 hover:text-white hover:bg-slate-800 rounded">Analisis Keputusan</a>
                <a href="panitia.html?subjek=intervensi_upsa" class="block p-1.5 hover:text-white hover:bg-slate-800 rounded">Program Intervensi</a>
            </div>
        </details>

        <!-- 11. BMI5-9T & SEGAK -->
        <details class="group mb-1">
            <summary class="flex justify-between items-center p-2 rounded-lg text-slate-300 hover:bg-slate-800 cursor-pointer transition select-none font-semibold">
                <span class="flex items-center space-x-2.5"><i class="fas fa-heartbeat w-4 text-center text-red-400"></i><span>11. BMI5-9T & SEGAK</span></span>
                <i class="fas fa-chevron-down text-[10px] transition-transform duration-200 group-open:rotate-180 text-slate-500"></i>
            </summary>
            <div class="ml-3 pl-3 border-l border-slate-700 my-1 space-y-1 text-slate-400">
                <a href="panitia.html?subjek=jk_segak" class="block p-1.5 hover:text-white hover:bg-slate-800 rounded">Jawatankuasa</a>
                <a href="panitia.html?subjek=takwim_segak" class="block p-1.5 hover:text-white hover:bg-slate-800 rounded">Takwim Pelaksanaan</a>
                <a href="panitia.html?subjek=jadual_segak" class="block p-1.5 hover:text-white hover:bg-slate-800 rounded">Jadual Pelaksanaan</a>
            </div>
        </details>

        <!-- 12. KBAT -->
        <details class="group mb-1">
            <summary class="flex justify-between items-center p-2 rounded-lg text-slate-300 hover:bg-slate-800 cursor-pointer transition select-none font-semibold">
                <span class="flex items-center space-x-2.5"><i class="fas fa-brain w-4 text-center text-orange-400"></i><span>12. KBAT</span></span>
                <i class="fas fa-chevron-down text-[10px] transition-transform duration-200 group-open:rotate-180 text-slate-500"></i>
            </summary>
            <div class="ml-3 pl-3 border-l border-slate-700 my-1 space-y-1 text-slate-400">
                <a href="panitia.html?subjek=jk_kbat" class="block p-1.5 hover:text-white hover:bg-slate-800 rounded">Jawatankuasa KBAT</a>
                <a href="panitia.html?subjek=instrumen_kbat" class="block p-1.5 hover:text-white hover:bg-slate-800 rounded">Instrumen KBAT</a>
                <a href="panitia.html?subjek=pencerapan_kbat_kendiri" class="block p-1.5 hover:text-white hover:bg-slate-800 rounded">PdPc KBAT (Kendiri)</a>
                <a href="panitia.html?subjek=pencerapan_kbat_pentadbir" class="block p-1.5 hover:text-white hover:bg-slate-800 rounded">PdPc KBAT (Pentadbir)</a>
            </div>
        </details>

        <!-- 13. STANDARD KUALITI @ SEKOLAH -->
        <details class="group mb-1">
            <summary class="flex justify-between items-center p-2 rounded-lg text-slate-300 hover:bg-slate-800 cursor-pointer transition select-none font-semibold">
                <span class="flex items-center space-x-2.5"><i class="fas fa-star w-4 text-center text-amber-300"></i><span>13. Standard Kualiti</span></span>
                <i class="fas fa-chevron-down text-[10px] transition-transform duration-200 group-open:rotate-180 text-slate-500"></i>
            </summary>
            <div class="ml-3 pl-3 border-l border-slate-700 my-1 space-y-1 text-slate-400">
                <a href="panitia.html?subjek=jk_standard_kualiti" class="block p-1.5 hover:text-white hover:bg-slate-800 rounded">Jawatankuasa / PPS</a>
                <a href="panitia.html?subjek=panduan_standard_kualiti" class="block p-1.5 hover:text-white hover:bg-slate-800 rounded">Buku Panduan</a>
                <a href="panitia.html?subjek=standard_kurikulum" class="block p-1.5 hover:text-white hover:bg-slate-800 rounded">Standard Kurikulum</a>
                <a href="panitia.html?subjek=instrumen_standard_kualiti" class="block p-1.5 hover:text-white hover:bg-slate-800 rounded">Instrumen Kurikulum</a>
            </div>
        </details>

        <!-- 14. PENDIGITALAN ICT -->
        <details class="group mb-1">
            <summary class="flex justify-between items-center p-2 rounded-lg text-slate-300 hover:bg-slate-800 cursor-pointer transition select-none font-semibold">
                <span class="flex items-center space-x-2.5"><i class="fas fa-laptop-code w-4 text-center text-sky-400"></i><span>14. Pendigitalan ICT</span></span>
                <i class="fas fa-chevron-down text-[10px] transition-transform duration-200 group-open:rotate-180 text-slate-500"></i>
            </summary>
            <div class="ml-3 pl-3 border-l border-slate-700 my-1 space-y-1 text-slate-400">
                <a href="panitia.html?subjek=jk_ict" class="block p-1.5 hover:text-white hover:bg-slate-800 rounded">Jawatankuasa ICT</a>
            </div>
        </details>

        <!-- 15. PAUTAN PANTAS LUAR -->
        <div class="pt-4 pb-1"><p class="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2">Pautan Pantas</p></div>
        <a href="https://sekolah-4997-cm6-source.github.io/Sistem-OPR-Laka-Selatan/" target="_blank" class="flex items-center space-x-3 p-2 text-amber-400 hover:bg-slate-800 rounded-lg transition"><i class="fas fa-external-link-alt w-4 text-center"></i> <span>Sistem OPR</span></a>
        <a href="https://classroom.google.com/" target="_blank" class="flex items-center space-x-3 p-2 text-emerald-400 hover:bg-slate-800 rounded-lg transition"><i class="fas fa-chalkboard w-4 text-center"></i> <span>Google Classroom</span></a>
        <a href="https://idme.moe.gov.my/" target="_blank" class="flex items-center space-x-3 p-2 text-blue-400 hover:bg-slate-800 rounded-lg transition"><i class="fas fa-id-badge w-4 text-center"></i> <span>Idme / SPPB</span></a>

    </nav>
`;

// Paparkan menu secara automatik ke dalam sidebar
document.addEventListener("DOMContentLoaded", () => {
    const sidebar = document.getElementById("sidebar");
    if (sidebar) {
        sidebar.innerHTML = menuHTML;
    }
});
