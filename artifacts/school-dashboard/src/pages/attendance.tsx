import { useState, useEffect } from "react";
import { getStudents, saveStudents, Student, CLASSES } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle } from "lucide-react";

function getToday() {
  return new Date().toISOString().split("T")[0];
}

function getMonthDays(year: number, month: number): string[] {
  const days: string[] = [];
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    const iso = date.toISOString().split("T")[0];
    days.push(iso);
  }
  return days;
}

export default function Attendance() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classFilter, setClassFilter] = useState("One");
  const [selectedDate, setSelectedDate] = useState(getToday());

  useEffect(() => {
    setStudents(getStudents());
  }, []);

  const classStudents = students.filter(s => s.class === classFilter);

  const toggleAttendance = (studentId: string) => {
    const updated = students.map(s => {
      if (s.id !== studentId) return s;
      const current = s.attendanceRecord[selectedDate];
      return {
        ...s,
        attendanceRecord: {
          ...s.attendanceRecord,
          [selectedDate]: current === "present" ? "absent" : "present",
        },
      };
    });
    setStudents(updated);
    saveStudents(updated);
  };

  const markAll = (status: "present" | "absent") => {
    const updated = students.map(s => {
      if (s.class !== classFilter) return s;
      return {
        ...s,
        attendanceRecord: {
          ...s.attendanceRecord,
          [selectedDate]: status,
        },
      };
    });
    setStudents(updated);
    saveStudents(updated);
  };

  const now = new Date(selectedDate);
  const year = now.getFullYear();
  const month = now.getMonth();
  const monthDays = getMonthDays(year, month);

  const getMonthlyAttendance = (student: Student) => {
    const presentDays = monthDays.filter(d => student.attendanceRecord[d] === "present").length;
    const markedDays = monthDays.filter(d => student.attendanceRecord[d]).length;
    if (markedDays === 0) return null;
    return Math.round((presentDays / markedDays) * 100);
  };

  const presentToday = classStudents.filter(s => s.attendanceRecord[selectedDate] === "present").length;
  const absentToday = classStudents.filter(s => s.attendanceRecord[selectedDate] === "absent").length;
  const unmarkedToday = classStudents.length - presentToday - absentToday;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Attendance</h1>
        <p className="text-muted-foreground mt-1">Mark and track daily student attendance by class.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center bg-card p-4 rounded-lg border">
        <div className="flex gap-4 flex-1 flex-wrap">
          <Select value={classFilter} onValueChange={setClassFilter}>
            <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-attendance-class">
              <SelectValue placeholder="Select class" />
            </SelectTrigger>
            <SelectContent>
              {CLASSES.map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            data-testid="input-attendance-date"
          />
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => markAll("present")} className="bg-emerald-600 hover:bg-emerald-700 text-white" data-testid="button-mark-all-present">
            Mark All Present
          </Button>
          <Button size="sm" variant="destructive" onClick={() => markAll("absent")} data-testid="button-mark-all-absent">
            Mark All Absent
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="border-emerald-200 dark:border-emerald-800">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-emerald-600">{presentToday}</div>
            <div className="text-sm text-muted-foreground">Present Today</div>
          </CardContent>
        </Card>
        <Card className="border-red-200 dark:border-red-800">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-red-500">{absentToday}</div>
            <div className="text-sm text-muted-foreground">Absent Today</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-muted-foreground">{unmarkedToday}</div>
            <div className="text-sm text-muted-foreground">Not Marked</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Class {classFilter} — {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-PK", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Roll No</TableHead>
                <TableHead>Student Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Monthly %</TableHead>
                <TableHead className="text-right">Toggle</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {classStudents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No students in this class. Add students first.
                  </TableCell>
                </TableRow>
              ) : (
                classStudents.map(student => {
                  const status = student.attendanceRecord[selectedDate];
                  const monthly = getMonthlyAttendance(student);
                  return (
                    <TableRow key={student.id} data-testid={`row-attendance-${student.id}`}>
                      <TableCell className="font-medium">{student.rollNumber}</TableCell>
                      <TableCell>{student.name}</TableCell>
                      <TableCell>
                        {status === "present" ? (
                          <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Present
                          </Badge>
                        ) : status === "absent" ? (
                          <Badge variant="destructive" className="gap-1">
                            <XCircle className="h-3 w-3" /> Absent
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">Not Marked</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {monthly !== null ? (
                          <span className={`font-medium ${monthly >= 75 ? "text-emerald-600" : "text-red-500"}`}>
                            {monthly}%
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">No data</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant={status === "present" ? "default" : "outline"}
                          onClick={() => toggleAttendance(student.id)}
                          className={status === "present" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}
                          data-testid={`button-toggle-attendance-${student.id}`}
                        >
                          {status === "present" ? "Mark Absent" : "Mark Present"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
