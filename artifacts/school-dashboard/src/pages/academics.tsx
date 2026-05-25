import { useState, useEffect } from "react";
import { getStudents, saveStudents, Student, CLASSES } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { BookOpen, TrendingUp } from "lucide-react";

const SUBJECTS = ["Urdu", "English", "Mathematics", "Science", "Social Studies", "Islamiat", "Computer", "Physics", "Chemistry", "Biology"];

function getResultPercentage(marks: Record<string, number>): number | null {
  const values = Object.values(marks);
  if (values.length === 0) return null;
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  return Math.round(avg);
}

function getGrade(pct: number): { grade: string; label: string; color: string } {
  if (pct >= 90) return { grade: "A+", label: "Excellent", color: "bg-emerald-500" };
  if (pct >= 80) return { grade: "A", label: "Very Good", color: "bg-emerald-400" };
  if (pct >= 70) return { grade: "B", label: "Good", color: "bg-blue-500" };
  if (pct >= 60) return { grade: "C", label: "Average", color: "bg-amber-500" };
  if (pct >= 33) return { grade: "D", label: "Pass", color: "bg-orange-500" };
  return { grade: "F", label: "Fail", color: "bg-red-500" };
}

function MarksDialog({ student, onSave }: { student: Student; onSave: (marks: Record<string, number>) => void }) {
  const [marks, setMarks] = useState<Record<string, string>>({});

  useEffect(() => {
    const initial: Record<string, string> = {};
    SUBJECTS.forEach(s => {
      initial[s] = student.examMarks[s] !== undefined ? String(student.examMarks[s]) : "";
    });
    setMarks(initial);
  }, [student]);

  const handleSave = () => {
    const numericMarks: Record<string, number> = {};
    Object.entries(marks).forEach(([subj, val]) => {
      const n = parseFloat(val);
      if (!isNaN(n)) numericMarks[subj] = Math.min(100, Math.max(0, n));
    });
    onSave(numericMarks);
  };

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>Exam Marks — {student.name}</DialogTitle>
      </DialogHeader>
      <div className="space-y-3 mt-2 max-h-[400px] overflow-y-auto pr-1">
        {SUBJECTS.map(subject => (
          <div key={subject} className="flex items-center gap-3">
            <Label className="w-36 text-sm shrink-0">{subject}</Label>
            <Input
              type="number"
              min="0"
              max="100"
              placeholder="0–100"
              value={marks[subject] || ""}
              onChange={e => setMarks(prev => ({ ...prev, [subject]: e.target.value }))}
              className="flex-1"
              data-testid={`input-marks-${subject}`}
            />
            <span className="text-xs text-muted-foreground w-8">/ 100</span>
          </div>
        ))}
      </div>
      <Button onClick={handleSave} className="w-full mt-4" data-testid="button-save-marks">Save Marks</Button>
    </DialogContent>
  );
}

export default function Academics() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classFilter, setClassFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [openDialogId, setOpenDialogId] = useState<string | null>(null);

  useEffect(() => {
    setStudents(getStudents());
  }, []);

  const handleSaveMarks = (studentId: string, marks: Record<string, number>) => {
    const updated = students.map(s =>
      s.id === studentId ? { ...s, examMarks: marks } : s
    );
    setStudents(updated);
    saveStudents(updated);
    setOpenDialogId(null);
  };

  const filtered = students.filter(s => {
    const matchesClass = classFilter === "all" || s.class === classFilter;
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase());
    return matchesClass && matchesSearch;
  });

  const withResults = filtered.filter(s => Object.keys(s.examMarks).length > 0);
  const avgPercentage = withResults.length > 0
    ? Math.round(withResults.reduce((acc, s) => acc + (getResultPercentage(s.examMarks) || 0), 0) / withResults.length)
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Academic Records</h1>
        <p className="text-muted-foreground mt-1">Enter exam marks and view student results.</p>
      </div>

      {avgPercentage !== null && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Class Average</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgPercentage}%</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Students Passing</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">
                {withResults.filter(s => (getResultPercentage(s.examMarks) || 0) >= 33).length}
                <span className="text-sm font-normal text-muted-foreground"> / {withResults.length}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 items-center bg-card p-4 rounded-lg border">
        <Input
          placeholder="Search student..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1"
          data-testid="input-search-academics"
        />
        <Select value={classFilter} onValueChange={setClassFilter}>
          <SelectTrigger className="w-full sm:w-[200px]" data-testid="select-academics-class">
            <SelectValue placeholder="All Classes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Classes</SelectItem>
            {CLASSES.map(c => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-lg bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Roll No</TableHead>
              <TableHead>Student Name</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Result %</TableHead>
              <TableHead>Grade</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No students found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(student => {
                const pct = getResultPercentage(student.examMarks);
                const gradeInfo = pct !== null ? getGrade(pct) : null;
                return (
                  <TableRow key={student.id} data-testid={`row-academic-${student.id}`}>
                    <TableCell className="font-medium">{student.rollNumber}</TableCell>
                    <TableCell>
                      <div>{student.name}</div>
                      <div className="text-xs text-muted-foreground">{student.fatherName}</div>
                    </TableCell>
                    <TableCell>{student.class}</TableCell>
                    <TableCell>
                      {pct !== null ? (
                        <span className="font-semibold">{pct}%</span>
                      ) : (
                        <span className="text-muted-foreground text-sm">No marks</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {gradeInfo ? (
                        <Badge className={`${gradeInfo.color} text-white hover:opacity-90`}>
                          {gradeInfo.grade}
                        </Badge>
                      ) : "—"}
                    </TableCell>
                    <TableCell>
                      {pct !== null ? (
                        <Badge variant={pct >= 33 ? "outline" : "destructive"}
                               className={pct >= 33 ? "border-emerald-500 text-emerald-600" : ""}>
                          {pct >= 33 ? "Pass" : "Fail"}
                        </Badge>
                      ) : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Dialog open={openDialogId === student.id} onOpenChange={open => setOpenDialogId(open ? student.id : null)}>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" data-testid={`button-enter-marks-${student.id}`}>
                            Enter Marks
                          </Button>
                        </DialogTrigger>
                        <MarksDialog student={student} onSave={(marks) => handleSaveMarks(student.id, marks)} />
                      </Dialog>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
