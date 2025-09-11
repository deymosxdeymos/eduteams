export const messages = {
  greeting: 'Hello, {name}!',
  mahasiswaSubtitle:
    "Let's check your class progress and get ready with your team!",
  dosenSubtitle:
    'Track activities and manage your classes easily from this dashboard',
  answersDefault: 'Student Answers',

  // Homepage translations
  homepage: {
    hero: {
      titlePrefix: 'Where',
      rotatingWords: ['Justice', 'Equality', 'Opportunity'],
      titleSuffix: 'Creates Excellence',
      description:
        "Every great result starts with a great team. Welcome to EquiTeam, let's start something extraordinary.",
    },
    about: {
      title: 'What is EquiTeam?',
      description:
        'EquiTeam is not just another ordinary group division tool. We are a smart platform designed to end the drama of "wrong team". With the help of artificial intelligence, we ensure every group has the perfect combination of members, both in terms of skills and working styles, so everyone can comfortably contribute and achieve the best results together.',
    },
    problems: {
      title: 'Relate to this problem?',
      description: 'These problems definitely happen a lot in your lectures',
      problem1: 'Uneven team participation',
      problem2: 'There are wasted groups',
      problem3: 'Skills in team are unbalanced',
      solution: 'With EquiTeam, these things will be resolved more easily',
    },
    solution: {
      title: 'EquiTeam Solution',
      description:
        'Smart system that divides groups based on 4 fundamental aspects to create balanced and productive teams',
      howItWorks: {
        title: 'How does EquiTeam work?',
        step1: {
          title: 'Input Student Data',
          description:
            'System collects personality, skills, preferences, and gender data',
        },
        step2: {
          title: 'AI Analysis',
          description:
            'AI analyzes compatibility and balance for optimal team formation',
        },
        step3: {
          title: 'Team Formation',
          description: 'System forms balanced groups based on analysis results',
        },
      },
      aspects: {
        title: '4 Main Aspects',
        description: 'Analyzed for optimal group division',
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
            'Combination of introvert-extrovert, thinking-feeling for balanced dynamics',
        },
        skillBalancing: {
          title: 'Skill Balancing',
          description:
            'Even distribution of abilities so every team has equal strength',
        },
        genderBalance: {
          title: 'Gender Balance',
          description:
            'Fair representation for diverse and inclusive perspectives',
        },
        taskPreference: {
          title: 'Task Preference',
          description:
            'Adjusting student interest towards available task topics',
        },
      },
    },
    benefits: {
      title: 'Benefits for Everyone',
      description:
        'EquiTeam provides significant value for various stakeholders',
      forStudents: {
        title: 'For Students',
        benefit1: 'More enjoyable learning experience',
        benefit2: 'Opportunity to develop soft skills',
        benefit3: 'Networking with more complementary friends',
        benefit4: 'Higher quality project results',
      },
      forLecturers: {
        title: 'For Lecturers',
        benefit1: 'Save time dividing groups',
        benefit2: 'Reduce student complaints',
        benefit3: 'More optimal learning outcomes',
        benefit4: 'Analysis data for evaluation',
      },
    },
    focus: {
      title: 'Focus on Justice and Balance',
      text: 'EquiTeam opens the gate of fair opportunities 👍, we unleash the full potential of every student to achieve success ⭐',
      justice: 'Justice is no longer a dream',
    },
    footer: {
      title: "LET'S KEEP IN TOUCH",
      description:
        'Smart platform that ends the "wrong team" drama on campus. Divide groups fairly, quickly, and without hassle.',
      address: {
        title: 'Address',
        text: 'Room D215, Building D, Itera Campus',
      },
      contact: {
        title: 'Contact',
        phone: '(0721) 8030188',
        email: 'informatika@itera.ac.id',
      },
      copyright: 'Copyright © 2025 EquiTeam All rights reserved.',
    },
  },

  // Onboarding translations
  onboarding: {
    role: {
      title: 'Choose your role!',
      dosen: 'Lecturer',
      mahasiswa: 'Student',
      institutionalEmailRequired: 'Institutional email required',
      continue: 'Continue',
      loading: 'Loading...',
    },
    dataDiri: {
      title: 'Fill in your personal data',
      namaLengkap: 'Full Name',
      namaLengkapPlaceholder: 'Enter full name',
      nim: 'Student ID Number (NIM)',
      nimPlaceholder: 'Enter NIM',
      npm: 'Employee ID Number (NPM)',
      npmPlaceholder: 'Enter NPM',
      jenisKelamin: 'Gender',
      lakiLaki: 'Male',
      perempuan: 'Female',
      continue: 'Continue',
      saving: 'Saving...',
      validation: {
        namaLengkapMin: 'Full name must be at least 2 characters',
        nimMin: 'NIM must be at least 8 characters',
        nimMax: 'NIM must be at most 15 characters',
        npmMin: 'NPM must be at least 8 characters',
        npmMax: 'NPM must be at most 15 characters',
        jenisKelaminRequired: 'Please select gender',
      },
    },
    kepribadian: {
      title: 'Personality Test',
      description:
        'Answer the following questions honestly 😬 the results will be used to form the most suitable study team for you!',
      pageOf: 'Page {current} of {total}',
      sending: 'Sending...',
      selesai: 'Finish',
      lanjut: 'Continue',
      instructions: {
        title: 'Personality Test Instructions',
        step1:
          'Choose the answer that is most suitable until the one that is not suitable with your current condition.',
        step2:
          'Find the most comfortable position and make sure there are no other activities you are doing when answering the test.',
        step3:
          'Answer each question honestly. Each question in this test can only be done once, so do it carefully.',
        step4:
          'Adjust your answers according to the following answer parameters:',
        likertScale: {
          stronglyDisagree: 'Strongly\nDisagree',
          disagree: 'Disagree',
          neutral: 'Neutral',
          agree: 'Agree',
          stronglyAgree: 'Strongly\nAgree',
        },
        startNow: 'Start Now',
      },
    },
  },

  // Dashboard translations
  dashboard: {
    statistics: {
      totalAssignments: 'Total assignments created',
      totalTeams: 'Total teams successfully formed',
      avgTeamQuality: 'Average team quality score',
    },
    search: {
      placeholder: 'Search for something?',
    },
    emptyStates: {
      dosen: {
        title: "You haven't created any classes yet",
        description: 'Create a class to start team formation',
      },
      student: {
        title: "You don't have any classes yet",
        description:
          'Enter the class token provided by your lecturer to join a class',
      },
    },
    modals: {
      createClass: {
        button: 'Create New Class',
        title: 'Create New Class',
        description: 'Please fill in all the data below to create a new class',
        success: 'Class created successfully!',
        creating: 'Creating...',
        create: 'Create Class',
        fields: {
          courseName: 'Course Name',
          courseNamePlaceholder: 'Enter course name',
          class: 'Class',
          classPlaceholder: 'Select class',
          startYear: 'Start Year',
          startYearPlaceholder: 'Enter start year',
          endYear: 'End Year',
          endYearPlaceholder: 'Enter end year',
          period: 'Period',
          periodPlaceholder: 'Select period',
        },
        options: {
          noClass: 'No Class',
          odd: 'Odd',
          even: 'Even',
        },
      },
      joinClass: {
        button: 'Join Class',
        title: 'Join Class',
        description:
          'Enter the class code you received from your lecturer to join this class. Make sure the code you enter is correct!',
        classCode: 'Class Code',
        classCodePlaceholder: '687ad8sa',
        invalidCode: 'The code you entered is incorrect. Please try again',
        joining: 'Joining...',
        join: 'Join',
      },
    },
    layout: {
      unavailable: 'Dashboard is not available for your role.',
    },
    languageSwitcher: {
      indonesiaAlt: 'Switch to English',
      englishAlt: 'Switch to Indonesian',
    },
  },
} as const;

export type Messages = typeof messages;
