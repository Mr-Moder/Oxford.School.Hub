export type Student = {
  id: string;
  name: string;
  fatherName: string;
  class: string;
  rollNumber: string;
  phone: string;
  address: string;
  admissionDate: string;
  dateOfBirth: string;
  feeStatus: "paid" | "pending";
  attendanceRecord: Record<string, "present" | "absent">;
  examMarks: Record<string, number>;
};

export type Teacher = {
  id: string;
  name: string;
  subject: string;
  phone: string;
  qualification: string;
  joiningDate: string;
  attendanceRecord: Record<string, "present" | "absent">;
  classPerformance: number;
};

export const CLASSES = [
  "Play Group", "Prep", "One", "Two", "Three", "Four", "Five", 
  "Six", "Seven", "Eight", "Ninth", "Tenth", "First Year", "Second Year"
];

const INITIAL_STUDENTS: Student[] = [
  { id: "1", name: "Ali Khan", fatherName: "Tariq Khan", class: "Nine", rollNumber: "901", phone: "03001234567", address: "Lahore", admissionDate: "2023-08-01", dateOfBirth: "2008-05-12", feeStatus: "paid", attendanceRecord: {}, examMarks: {} },
  { id: "2", name: "Fatima Ahmed", fatherName: "Ahmed Raza", class: "Tenth", rollNumber: "1001", phone: "03007654321", address: "Karachi", admissionDate: "2022-08-01", dateOfBirth: "2007-11-23", feeStatus: "pending", attendanceRecord: {}, examMarks: {} },
  { id: "3", name: "Usman Tariq", fatherName: "Tariq Mehmood", class: "Eight", rollNumber: "801", phone: "03331234567", address: "Islamabad", admissionDate: "2024-08-01", dateOfBirth: "2009-02-15", feeStatus: "paid", attendanceRecord: {}, examMarks: {} },
];

const INITIAL_TEACHERS: Teacher[] = [
  { id: "1", name: "Sarah Zafar", subject: "Mathematics", phone: "03001112233", qualification: "MSc Mathematics", joiningDate: "2019-01-10", attendanceRecord: {}, classPerformance: 85 },
  { id: "2", name: "Kamran Shah", subject: "Physics", phone: "03004445566", qualification: "MSc Physics", joiningDate: "2020-03-15", attendanceRecord: {}, classPerformance: 92 },
];

export function getStudents(): Student[] {
  const data = localStorage.getItem("school_students");
  return data ? JSON.parse(data) : INITIAL_STUDENTS;
}

export function saveStudents(students: Student[]) {
  localStorage.setItem("school_students", JSON.stringify(students));
}

export function getTeachers(): Teacher[] {
  const data = localStorage.getItem("school_teachers");
  return data ? JSON.parse(data) : INITIAL_TEACHERS;
}

export function saveTeachers(teachers: Teacher[]) {
  localStorage.setItem("school_teachers", JSON.stringify(teachers));
}

export function initializeStorage() {
  if (!localStorage.getItem("school_students")) {
    saveStudents(INITIAL_STUDENTS);
  }
  if (!localStorage.getItem("school_teachers")) {
    saveTeachers(INITIAL_TEACHERS);
  }
}
