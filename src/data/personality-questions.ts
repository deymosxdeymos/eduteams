export interface Question {
  id: number;
  text: string;
}

export const personalityQuestions: Question[] = [
  // Extraversion vs Introversion
  {
    id: 1,
    text: 'Saya lebih suka menghabiskan waktu luang dengan berkumpul bersama teman-teman daripada sendirian',
  },
  {
    id: 2,
    text: 'Saya merasa berenergi ketika berada di tengah-tengah keramaian',
  },
  {
    id: 3,
    text: 'Saya lebih mudah berbicara dengan orang yang baru saya kenal',
  },
  {
    id: 4,
    text: 'Saya membutuhkan waktu sendirian untuk mengisi ulang energi setelah berinteraksi dengan banyak orang',
  },
  {
    id: 5,
    text: 'Saya lebih suka bekerja dalam tim daripada bekerja sendiri',
  },
  {
    id: 6,
    text: 'Saya cenderung berbicara lebih dulu sebelum berpikir dalam diskusi',
  },

  // Sensing vs Intuition
  {
    id: 7,
    text: 'Saya lebih fokus pada fakta dan detail konkret daripada kemungkinan-kemungkinan abstrak',
  },
  {
    id: 8,
    text: 'Saya lebih suka mengikuti instruksi yang jelas dan terperinci',
  },
  {
    id: 9,
    text: 'Saya lebih tertarik pada ide-ide baru dan inovatif daripada cara-cara yang sudah terbukti',
  },
  {
    id: 10,
    text: 'Saya lebih mempercayai pengalaman praktis daripada teori',
  },
  {
    id: 11,
    text: 'Saya sering memikirkan kemungkinan-kemungkinan masa depan',
  },
  {
    id: 12,
    text: 'Saya lebih suka bekerja dengan hal-hal yang nyata dan dapat diukur',
  },

  // Thinking vs Feeling
  {
    id: 13,
    text: 'Saya lebih mengutamakan logika dan objektivitas dalam mengambil keputusan',
  },
  {
    id: 14,
    text: 'Saya lebih mempertimbangkan perasaan orang lain ketika membuat keputusan',
  },
  {
    id: 15,
    text: 'Saya merasa tidak nyaman ketika harus memberikan kritik kepada orang lain',
  },
  {
    id: 16,
    text: 'Saya lebih suka menyelesaikan konflik dengan pendekatan yang rasional',
  },
  {
    id: 17,
    text: 'Saya mudah berempati dengan perasaan orang lain',
  },
  {
    id: 18,
    text: 'Saya lebih menghargai keadilan daripada belas kasihan dalam situasi sulit',
  },

  // Judging vs Perceiving
  {
    id: 19,
    text: 'Saya lebih suka membuat rencana detail sebelum memulai suatu proyek',
  },
  {
    id: 20,
    text: 'Saya merasa nyaman dengan perubahan rencana mendadak',
  },
  {
    id: 21,
    text: 'Saya lebih suka menyelesaikan tugas dengan cepat daripada menunda-nunda',
  },
  {
    id: 22,
    text: 'Saya lebih suka bekerja dengan deadline yang fleksibel',
  },
  {
    id: 23,
    text: 'Saya merasa tidak nyaman dengan ketidakpastian dan situasi yang tidak terstruktur',
  },
  {
    id: 24,
    text: 'Saya lebih suka mengeksplorasi berbagai pilihan sebelum membuat keputusan final',
  },
];

// Helper function to get questions for a specific page (6 questions per page)
export const getQuestionsForPage = (page: number): Question[] => {
  const startIndex = (page - 1) * 6;
  return personalityQuestions.slice(startIndex, startIndex + 6);
};

// Helper function to get total number of pages
export const getTotalPages = (): number => {
  return Math.ceil(personalityQuestions.length / 6);
};
