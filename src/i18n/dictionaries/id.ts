export const messages = {
  greeting: 'Halo, {name}!',
  mahasiswaSubtitle:
    'Yuk, cek progres kelas dan siap-siap mulai bareng kelompokmu!',
  dosenSubtitle:
    'Pantau aktivitas dan kelola kelas Anda dengan mudah melalui dashboard ini',
  answersDefault: 'Jawaban Mahasiswa',

  // Homepage translations
  homepage: {
    hero: {
      titlePrefix: 'Dimana',
      rotatingWords: ['Keadilan', 'Kesetaraan', 'Kesempatan'],
      titleSuffix: 'Menciptakan Keunggulan',
      description:
        'Setiap hasil yang hebat dimulai dengan tim yang hebat. Selamat datang di EquiTeam, mari kita mulai sesuatu yang luar biasa.',
    },
    about: {
      title: 'EquiTeam itu apa sih?',
      description:
        'EquiTeam bukan sekadar alat pembagi kelompok biasa. Kami adalah sebuah platform pintar yang dirancang untuk mengakhiri drama "salah tim". Dengan bantuan kecerdasan buatan, kami memastikan setiap kelompok memiliki kombinasi anggota yang pas, baik dari segi keahlian maupun cara kerja, sehingga semua orang bisa nyaman berkontribusi dan meraih hasil terbaik bersama.',
    },
    problems: {
      title: 'Relate dengan permasalahan ini?',
      description:
        'Permasalahan-permasalahan ini pasti sering banget terjadi di perkuliahan kalian',
      problem1: 'Partisipasi tim tidak merata',
      problem2: 'Terdapat kelompok terbuang',
      problem3: 'Keahlian di tim tidak seimbang',
      solution:
        'Dengan adanya EquiTeam,\nhal-hal tersebut akan teratasi dengan lebih mudah',
    },
    solution: {
      title: 'Solusi EquiTeam',
      description:
        'Sistem cerdas yang membagi kelompok berdasarkan 4 aspek fundamental untuk menciptakan tim yang seimbang dan produktif',
      howItWorks: {
        title: 'Bagaimana EquiTeam bekerja?',
        step1: {
          title: 'Input Data Mahasiswa',
          description:
            'Sistem mengumpulkan data personality, skills, preferences, dan gender',
        },
        step2: {
          title: 'Analisis AI',
          description:
            'AI menganalisis kompatibilitas dan keseimbangan untuk pembentukan tim optimal',
        },
        step3: {
          title: 'Pembentukan Tim',
          description:
            'Sistem membentuk kelompok yang seimbang berdasarkan hasil analisis',
        },
      },
      aspects: {
        title: '4 Aspek Utama',
        description: 'Yang dianalisis untuk pembagian kelompok optimal',
        personality: {
          name: 'Personality',
          description: 'Based on MBTI',
        },
        skills: {
          name: 'Skills',
          description: 'Technical & soft skills',
        },
        gender: {
          name: 'Gender',
          description: 'Balanced Representation',
        },
        preferences: {
          name: 'Preferences',
          description: 'Preferences for task topics',
        },
      },
      features: {
        personalityMatching: {
          title: 'Personality Matching',
          description:
            'Kombinasi introvert-extrovert, thinking-feeling untuk dinamika yang seimbang',
        },
        skillBalancing: {
          title: 'Skill Balancing',
          description:
            'Distribusi kemampuan yang merata agar setiap tim memiliki kekuatan yang setara',
        },
        genderBalance: {
          title: 'Gender Balance',
          description:
            'Representasi yang adil untuk perspektif yang beragam dan inklusif',
        },
        taskPreference: {
          title: 'Task Preference',
          description:
            'Menyesuaikan ketertarikan mahasiswa terhadap topik tugas yang tersedia',
        },
      },
    },
    benefits: {
      title: 'Manfaat untuk Semua',
      description:
        'EquiTeam memberikan value yang signifikan untuk berbagai stakeholder',
      forStudents: {
        title: 'Untuk Mahasiswa',
        benefit1: 'Pengalaman belajar yang lebih menyenangkan',
        benefit2: 'Kesempatan mengembangkan soft skills',
        benefit3: 'Networking dengan teman yang lebih komplementer',
        benefit4: 'Hasil project yang lebih berkualitas',
      },
      forLecturers: {
        title: 'Untuk Dosen',
        benefit1: 'Menghemat waktu pembagian kelompok',
        benefit2: 'Mengurangi komplain dari mahasiswa',
        benefit3: 'Hasil pembelajaran yang lebih optimal',
        benefit4: 'Data analisis untuk evaluasi',
      },
    },
    focus: {
      title: 'Fokus pada Keadilan dan Keseimbangan',
      text: 'membuka gerbang kesempatan yang <mark>adil</mark> 👍, kami melepaskan potensi penuh setiap mahasiswa untuk meraih <mark>kesuksesan</mark> ⭐',
      justice: 'Keadilan bukan lagi impian',
    },
    footer: {
      title: "LET'S KEEP IN TOUCH",
      description:
        'Platform pintar yang mengakhiri drama "salah tim" di kampus.\nBagi kelompok dengan adil, cepat, dan tanpa ribet.',
      address: {
        title: 'Alamat',
        text: 'Ruang D215, Gedung D,\nKampus Itera',
      },
      contact: {
        title: 'Kontak',
        phone: '(0721) 8030188',
        email: 'informatika@itera.ac.id',
      },
      copyright: 'Copyright © 2025 EquiTeam\nSemua hak dilindungi.',
    },
  },

  // Onboarding translations
  onboarding: {
    role: {
      title: 'Pilih role kamu!',
      dosen: 'Dosen',
      mahasiswa: 'Mahasiswa',
      institutionalEmailRequired: 'Email institusi diperlukan',
      continue: 'Lanjut',
      loading: 'Loading...',
    },
    dataDiri: {
      title: 'Isi data diri',
      namaLengkap: 'Nama Lengkap',
      namaLengkapPlaceholder: 'Masukkan nama lengkap',
      nim: 'Nomor Induk Mahasiswa (NIM)',
      nimPlaceholder: 'Masukkan NIM',
      npm: 'Nomor Pokok Pegawai (NPM)',
      npmPlaceholder: 'Masukkan NPM',
      jenisKelamin: 'Jenis Kelamin',
      lakiLaki: 'Laki-laki',
      perempuan: 'Perempuan',
      continue: 'Lanjut',
      saving: 'Saving...',
      validation: {
        namaLengkapMin: 'Nama lengkap minimal 2 karakter',
        nimMin: 'NIM minimal 8 karakter',
        nimMax: 'NIM maksimal 15 karakter',
        npmMin: 'NPM minimal 8 karakter',
        npmMax: 'NPM maksimal 15 karakter',
        jenisKelaminRequired: 'Pilih jenis kelamin',
      },
    },
    kepribadian: {
      title: 'Tes Kepribadian',
      description:
        'Jawab pertanyaan berikut dengan jujur ya 😬 hasilnya akan digunakan untuk membentuk tim belajar yang paling cocok buat kamu!',
      pageOf: 'Halaman {current} dari {total}',
      sending: 'Mengirim...',
      selesai: 'Selesai',
      lanjut: 'Lanjut',
      instructions: {
        title: 'Instruksi Pengerjaan Tes Kepribadian',
        step1:
          'Pilihlah jawaban yang paling sesuai hingga yang tidak sesuai dengan kondisimu saat ini.',
        step2:
          'Temukan posisi senyaman mungkin dan pastikan tidak ada kegiatan lain yang sedang kamu lakukan saat menjawab tes.',
        step3:
          'Jawablah setiap pertanyaan dengan jujur. Setiap soal dalam tes ini hanya bisa satu kali, jadi kerjakanlah dengan teliti.',
        step4: 'Sesuaikan jawaban kamu dengan parameter jawaban berikut:',
        likertScale: {
          stronglyDisagree: 'Sangat Tidak\nSetuju',
          disagree: 'Tidak Setuju',
          neutral: 'Netral',
          agree: 'Setuju',
          stronglyAgree: 'Sangat Setuju',
        },
        startNow: 'Mulai Sekarang',
      },
    },
  },

  // Dashboard translations
  dashboard: {
    statistics: {
      totalAssignments: 'Total tugas telah dibuat',
      totalTeams: 'Total kelompok berhasil dibentuk',
      avgTeamQuality: 'Rata-rata skor kualitas kelompok',
    },
    search: {
      placeholder: 'Mencari sesuatu?',
    },
    emptyStates: {
      dosen: {
        title: 'Anda belum membuat kelas',
        description: 'Buat kelas untuk memulai pembagian kelompok',
      },
      student: {
        title: 'Anda belum memiliki kelas',
        description:
          'Masukkan token kelas yang diberikan oleh dosen untuk bergabung ke kelas',
      },
    },
    modals: {
      createClass: {
        button: 'Buat Kelas Baru',
        title: 'Buat Kelas Baru',
        description:
          'Silahkan isi seluruh data di bawah untuk membuat kelas baru',
        success: 'Kelas berhasil dibuat!',
        creating: 'Membuat...',
        create: 'Buat Kelas',
        fields: {
          courseName: 'Nama Mata Kuliah',
          courseNamePlaceholder: 'Masukkan nama mata kuliah',
          class: 'Kelas',
          classPlaceholder: 'Pilih kelas',
          startYear: 'Tahun Awal',
          startYearPlaceholder: 'Masukkan tahun awal',
          endYear: 'Tahun Akhir',
          endYearPlaceholder: 'Masukkan tahun akhir',
          period: 'Periode',
          periodPlaceholder: 'Pilih periode',
        },
        options: {
          noClass: 'Tanpa Kelas',
          odd: 'Ganjil',
          even: 'Genap',
        },
      },
      joinClass: {
        button: 'Masuk Kelas',
        title: 'Masuk ke Kelas',
        description:
          'Masukkan kode kelas yang kamu dapatkan dari dosen untuk bergabung ke dalam kelas ini. Pastikan kode yang dimasukkan sudah benar, ya!',
        classCode: 'Kode Kelas',
        classCodePlaceholder: '687ad8sa',
        invalidCode: 'Kode yang Anda masukkan salah. Silahkan coba lagi',
        joining: 'Masuk...',
        join: 'Masuk',
      },
    },
    layout: {
      unavailable: 'Dashboard tidak tersedia untuk role Anda.',
    },
    languageSwitcher: {
      indonesiaAlt: 'Beralih ke Bahasa Inggris',
      englishAlt: 'Beralih ke Bahasa Indonesia',
    },
    classAssignments: {
      createAssignment: 'Buat Tugas Baru',
      shareClass: 'Bagikan Kelas',
      searchPlaceholder: 'Cari tugas?',
      searchAria: 'Cari tugas',
      noMatches: 'Tidak ada tugas yang cocok untuk "{query}".',
      status: {
        formed: 'Pembagian grup berhasil dilakukan',
        waiting: 'Menunggu pembagian grup',
        noneFilled: 'Belum ada yang mengisi kuisioner',
        progress: '{filled} dari {total} mahasiswa telah mengisi kuisioner',
      },
      back: 'Kembali',
    },
    assignment: {
      actions: {
        createTeamsButton: 'Buat Kelompok',
        createTeamsTitle: 'Buat Kelompok',
        createTeamsDesc:
          'Pilih cara pembagian, sistem akan menyusun kelompok secara otomatis berdasarkan data mahasiswa.',
        methodLabel: 'Metode Pembagian Kelompok',
        methodPlaceholder: 'Pilih metode',
        methodByGroupCount: 'Jumlah Kelompok',
        methodByStudentsPerGroup: 'Jumlah Mahasiswa per Kelompok',
        valuePlaceholderGroups: 'mis. 5',
        valuePlaceholderStudents: 'mis. 4',
        noteTopicsMismatch:
          'Catatan: Jumlah topik ({topicCount}) tidak sama dengan jumlah kelompok ({groups}). Preferensi topik akan dipetakan secara best‑effort.',
        errorCreateFailed: 'Gagal membentuk kelompok. Coba lagi sebentar lagi.',
        successCreate: 'Berhasil membentuk kelompok!',
        networkError: 'Terjadi kesalahan jaringan. Coba lagi.',
        submitCreating: 'Membuat...',
        submitCreate: 'Buat Kelompok',
        resetButton: 'Reset Kelompok',
        resetting: 'Mereset...',
        resetConfirm:
          'Reset pembagian kelompok untuk tugas ini?\nIni tidak menghapus data preferensi. Anda dapat membentuk ulang setelah reset.',
        resetFailed: 'Gagal mereset pembagian kelompok',
        resetSuccess: 'Berhasil mereset. Anda dapat membentuk ulang.',
        resetNetworkError: 'Terjadi kesalahan jaringan saat reset.',
        viewAnswers: 'Lihat Jawaban Mahasiswa',
        viewMyAnswers: 'Lihat Jawaban Saya',
        back: 'Kembali',
      },
      charts: {
        distributionLabel: 'Grafik Persebaran',
        personalityTitle: 'Personality Mahasiswa',
        averageLabel: 'Grafik Rata-Rata',
        skillsTitle: 'Keahlian Mahasiswa',
        preferencesTitle: 'Preferensi Tugas',
        genderTitle: 'Gender Mahasiswa',
      },
      studentWaiting: {
        alt: 'Menunggu pembagian kelompok',
        title: 'Menunggu pembagian kelompok!',
        description:
          'Tenang, datamu sudah terekam dengan baik. Tunggu sebentar ya, dosen sedang memproses pembagian kelompok.',
      },
    },
    profile: {
      title: 'Profil',
      instructions:
        'Untuk mengubah data diri Anda, harap isi kolom-kolom berikut.',
      fullName: 'Nama Lengkap',
      fullNamePlaceholder: 'Masukkan nama lengkap',
      gender: 'Jenis Kelamin',
      male: 'Laki-laki',
      female: 'Perempuan',
      back: 'Kembali',
      saving: 'Menyimpan...',
      save: 'Simpan perubahan',
      saveSuccess: 'Perubahan berhasil disimpan',
      saveFailed: 'Gagal menyimpan perubahan',
      errorGeneric: 'Terjadi kesalahan',
      close: 'Tutup',
      studentProfileTitle: 'Profil {name}',
      viewMbtiDistribution: 'Lihat Persebaran MBTI',
      removeStudent: 'Keluarkan Mahasiswa',
    },
  },
} as const;

export type Messages = typeof messages;
