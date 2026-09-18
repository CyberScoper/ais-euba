// Mock dataset so the PWA is fully explorable without a live AIS session.
// Enabled with AIS_MOCK=1. Shapes match the normalize* output in aisClient.js.

export const mockUser = { fullName: 'Ján Študent', login: 'xstudent', program: 'Ekonomika a manažment' };

export const mockStudies = [
  { id: 's1', program: 'Ekonomika a manažment', year: 2, status: 'aktívne' },
];

export const mockSubjects = [
  { code: 'KME_1', name: 'Mikroekonómia', credits: 6, semester: 'ZS', grade: 'A', points: 94, completed: 'skúška' },
  { code: 'KUF_2', name: 'Účtovníctvo', credits: 5, semester: 'ZS', grade: 'B', points: 82, completed: 'skúška' },
  { code: 'KMV_3', name: 'Matematika B', credits: 6, semester: 'ZS', grade: null, points: 61, completed: 'skúška' },
  { code: 'KAJ_4', name: 'Angličtina II', credits: 3, semester: 'ZS', grade: 'A', points: 97, completed: 'zápočet' },
  { code: 'KIS_5', name: 'Informatika', credits: 4, semester: 'ZS', grade: 'C', points: 74, completed: 'skúška' },
  { code: 'KPR_6', name: 'Právo v podnikaní', credits: 4, semester: 'ZS', grade: null, points: null, completed: 'skúška' },
];

export const mockPayments = [
  { title: 'Školné za semester', amount: 0, currency: 'EUR', dueDate: '2026-10-15', paid: true, variableSymbol: '100200300' },
  { title: 'Poplatok za preukaz ISIC', amount: 20, currency: 'EUR', dueDate: '2026-10-01', paid: false, variableSymbol: '100200301' },
  { title: 'Poplatok za druhé štúdium', amount: 500, currency: 'EUR', dueDate: '2026-11-30', paid: false, variableSymbol: '100200302' },
];

export const mockMessages = [
  { id: 'm1', subject: 'Zmena termínu skúšky — Matematika B', from: 'doc. Nováková', date: '2026-09-17T09:12:00', unread: true, body: 'Skúška sa presúva na 12. 1. 2027, miestnosť B1.14.' },
  { id: 'm2', subject: 'Zverejnené hodnotenie — Informatika', from: 'AIS', date: '2026-09-16T14:03:00', unread: true, body: 'Bolo zverejnené hodnotenie predmetu Informatika.' },
  { id: 'm3', subject: 'Zápis na letný semester', from: 'Študijné oddelenie', date: '2026-09-10T08:00:00', unread: false, body: 'Zápis na LS 2026/2027 prebieha od 20. 1. do 5. 2. 2027.' },
];

// day: 1=Mon .. 5=Fri; times in HH:MM
export const mockSchedule = [
  { day: 1, from: '08:00', to: '09:30', subject: 'Mikroekonómia', type: 'prednáška', room: 'D1.14', teacher: 'prof. Horák' },
  { day: 1, from: '09:45', to: '11:15', subject: 'Matematika B', type: 'cvičenie', room: 'B1.02', teacher: 'Mgr. Kollár' },
  { day: 2, from: '11:00', to: '12:30', subject: 'Účtovníctvo', type: 'prednáška', room: 'A2.30', teacher: 'doc. Bieliková' },
  { day: 2, from: '13:00', to: '14:30', subject: 'Informatika', type: 'cvičenie', room: 'V4.21', teacher: 'Ing. Šimko' },
  { day: 3, from: '09:45', to: '11:15', subject: 'Angličtina II', type: 'cvičenie', room: 'C3.11', teacher: 'Mgr. Green' },
  { day: 4, from: '08:00', to: '09:30', subject: 'Právo v podnikaní', type: 'prednáška', room: 'D1.01', teacher: 'JUDr. Malý' },
  { day: 4, from: '09:45', to: '11:15', subject: 'Mikroekonómia', type: 'cvičenie', room: 'B2.14', teacher: 'Ing. Kovář' },
  { day: 5, from: '11:00', to: '12:30', subject: 'Matematika B', type: 'prednáška', room: 'D1.14', teacher: 'doc. Nováková' },
];
