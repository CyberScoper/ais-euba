// Mock dataset so the PWA is fully explorable without a live AIS session.
// Enabled with AIS_MOCK=1. Shapes match the normalize* output in aisClient.js.

export const mockUser = { fullName: 'Ján Študent', login: 'xstudent', program: 'Ekonomika a manažment' };

export const mockStudies = [
  { id: 's1', program: 'Ekonomika a manažment', year: 2, status: 'aktívne' },
];

export const mockSubjects = [
  { code: 'OOC21151', name: 'Cestovný ruch', credits: 8, semester: 'Z', grade: 'A', completed: 'Skúška' },
  { code: 'OOE25087', name: 'Právo pre podnikateľov', credits: 5, semester: 'Z', grade: 'B', completed: 'Skúška' },
  { code: 'OOA25183', name: 'Marketing', credits: 6, semester: 'Z', grade: null, completed: 'Skúška' },
  { code: 'KAJ_4', name: 'Angličtina II', credits: 3, semester: 'Z', grade: 'A', completed: 'Zápočet' },
  { code: 'KIS_5', name: 'Informatika', credits: 4, semester: 'Z', grade: 'C', completed: 'Skúška' },
  { code: 'KMV_3', name: 'Matematika B', credits: 6, semester: 'Z', grade: null, completed: 'Skúška' },
];
export const mockAverages = { all: 2.1, graded: 1.5, gradedRecognised: 1.5 };

export const mockPayments = [
  { title: 'Školné za semester', amount: 0, currency: 'EUR', dueDate: '2026-10-15', paid: true, variableSymbol: '100200300' },
  { title: 'Poplatok za preukaz ISIC', amount: 20, currency: 'EUR', dueDate: '2026-10-01', paid: false, variableSymbol: '100200301' },
  { title: 'Poplatok za druhé štúdium', amount: 500, currency: 'EUR', dueDate: '2026-11-30', paid: false, variableSymbol: '100200302' },
];

export const mockMessages = [
  { id: 1, category: 'Rozvrh', body: 'Zmena miestnosti pre Marketing — po novom B208.', date: '2026-09-17T09:12:00' },
  { id: 2, category: 'Hodnotenie', body: 'Bolo zverejnené hodnotenie predmetu Cestovný ruch.', date: '2026-09-16T14:03:00' },
  { id: 3, category: 'Štúdium', body: 'Zápis na letný semester prebieha od 20. 1. do 5. 2. 2027.', date: '2026-09-10T08:00:00' },
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
