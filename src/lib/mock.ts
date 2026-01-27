export type MockActivity = {
  id: string;
  date: string; 
  title: string;
  start: string; 
  end: string;    
};

export const mockActivities: MockActivity[] = [
  { id: "1", date: "2026-01-27", title: "Nastava (A101)", start: "10:00", end: "12:00" },
  { id: "2", date: "2026-01-28", title: "Sastanak tima", start: "13:00", end: "13:30" },
  { id: "3", date: "2026-01-30", title: "Priprema materijala", start: "09:00", end: "10:00" },
];
