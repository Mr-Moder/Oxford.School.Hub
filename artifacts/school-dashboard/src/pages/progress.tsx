import { useState, useEffect } from "react";
import { getStudents, getExamResults, getGrade, getPassingPercentage, EXAM_TYPES } from "@/lib/storage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line, Legend } from "recharts";
import { TrendingUp, TrendingDown, UserCheck, BookOpen, AlertTriangle } from "lucide-react";

function getMonthDays(year: number, month: number): string[] {
  const days: string[] = [];
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    days.push(new Date(year, month, d).toISOString().split("T")[0]);
  }
  return days;
}

export default function StudentProgress() {
  const [studentId, setStudentId] = useState("");
  const students = getStudents();
  const examResults = getExamResults();
  const passingPct = getPassingPercentage();

  const student = students.find(s => s.id === studentId);
  const studentResults = examResults.filter(r => r.studentId === studentId);

  // Attendance
  const now = new Date();
  const monthDays = getMonthDays(now.getFullYear(), now.getMonth());
  const markedDays = student ? monthDays.filter(d => student.attendanceRecord[d]) : [];
  const presentDays = student ? monthDays.filter(d => student.attendanceRecord[d] === "present") : [];
  const attendancePct = markedDays.length > 0 ? Math.round((presentDays.length / markedDays.length) * 100) : null;

  // Overall marks
  const avgMarks = studentResults.length > 0
    ? Math.round(studentResults.reduce((acc, r) => acc + (r.obtainedMarks / r.totalMarks) * 100, 0) / studentResults.length)
    : null;

  // Subject performance
  const subjectMap: Record<string, number[]> = {};
  studentResults.forEach(r => {
    const pct = Math.round((r.obtainedMarks / r.totalMarks) * 100);
    if (!subjectMap[r.subject]) subjectMap[r.subject] = [];
    subjectMap[r.subject].push(pct);
  });
  const subjectData = Object.entries(subjectMap).map(([subject, pcts]) => ({
    subject,
    avg: Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length),
  })).sort((a, b) => b.avg - a.avg);

  const weakSubjects = subjectData.filter(s => s.avg < passingPct + 10);

  // Progress over time by exam type
  const examTypeData = EXAM_TYPES.map(et => {
    const typeResults = studentResults.filter(r => r.examType === et.value);
    if (typeResults.length === 0) return null;
    const avg = Math.round(typeResults.reduce((acc, r) => acc + (r.obtainedMarks / r.totalMarks) * 100, 0) / typeResults.length);
    return { name: et.label.replace(" Test", ""), avg };
  }).filter(Boolean) as { name: string; avg: number }[];

  // Recent results
  const recentResults = [...studentResults].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);

  const getBarColor = (avg: number) => {
    if (avg >= 80) return "#10b981";
    if (avg >= passingPct) return "#3b82f6";
    return "#ef4444";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Student Progress</h1>
        <p className="text-muted-foreground mt-1">Track individual student performance across all exams.</p>
      </div>

      {/* Student Selector */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <label className="text-sm font-medium shrink-0">Select Student:</label>
            <Select value={studentId} onValueChange={setStudentId}>
              <SelectTrigger className="max-w-xs" data-testid="select-progress-student">
                <SelectValue placeholder="Choose a student to view progress" />
              </SelectTrigger>
              <SelectContent>
                {students.map(s => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name} — Class {s.class} (Roll {s.rollNumber})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {!student ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
          <TrendingUp className="h-12 w-12 opacity-30" />
          <p>Select a student above to view their progress report.</p>
        </div>
      ) : (
        <>
          {/* Student Info Banner */}
          <Card className="bg-primary text-primary-foreground">
            <CardContent className="pt-5 pb-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-2xl font-bold">{student.name}</h2>
                  <p className="opacity-80 text-sm">Father: {student.fatherName} · Class {student.class} · Roll No {student.rollNumber}</p>
                </div>
                <Badge className="bg-white/20 text-white hover:bg-white/30 self-start sm:self-auto text-sm px-3 py-1">
                  {student.feeStatus === "paid" ? "Fee Paid" : "Fee Pending"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Overview Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium">Attendance</CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${attendancePct !== null ? (attendancePct >= 75 ? "text-emerald-600" : "text-red-500") : "text-muted-foreground"}`}>
                  {attendancePct !== null ? `${attendancePct}%` : "—"}
                </div>
                <p className="text-xs text-muted-foreground">{presentDays.length}/{markedDays.length} days this month</p>
                {attendancePct !== null && <Progress value={attendancePct} className="mt-2 h-1.5" />}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium">Avg Score</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${avgMarks !== null ? (avgMarks >= passingPct ? "text-emerald-600" : "text-red-500") : "text-muted-foreground"}`}>
                  {avgMarks !== null ? `${avgMarks}%` : "—"}
                </div>
                <p className="text-xs text-muted-foreground">Across {studentResults.length} exam{studentResults.length !== 1 ? "s" : ""}</p>
                {avgMarks !== null && <Progress value={avgMarks} className="mt-2 h-1.5" />}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium">Best Subject</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold text-emerald-600">
                  {subjectData.length > 0 ? subjectData[0].subject : "—"}
                </div>
                <p className="text-xs text-muted-foreground">
                  {subjectData.length > 0 ? `${subjectData[0].avg}% average` : "No exam data"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium">Needs Work</CardTitle>
                <TrendingDown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold text-red-500">
                  {weakSubjects.length > 0 ? weakSubjects[weakSubjects.length - 1].subject : "—"}
                </div>
                <p className="text-xs text-muted-foreground">
                  {weakSubjects.length > 0 ? `${weakSubjects[weakSubjects.length - 1].avg}% average` : "All subjects good"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          {subjectData.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Performance by Subject</CardTitle>
                </CardHeader>
                <CardContent className="h-[260px] pl-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={subjectData} layout="vertical" margin={{ left: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                      <XAxis type="number" domain={[0, 100]} stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis type="category" dataKey="subject" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} width={90} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                        formatter={(val: number) => [`${val}%`, "Average"]}
                      />
                      <Bar dataKey="avg" radius={[0, 4, 4, 0]}
                        fill="hsl(var(--primary))"
                        label={{ position: "right", fontSize: 11, formatter: (v: number) => `${v}%` }}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {examTypeData.length > 1 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Progress by Exam Type</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[260px] pl-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={examTypeData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis domain={[0, 100]} stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                        <Tooltip
                          contentStyle={{ backgroundColor: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                          formatter={(val: number) => [`${val}%`, "Average Score"]}
                        />
                        <Line type="monotone" dataKey="avg" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Weak subjects warning */}
          {weakSubjects.length > 0 && (
            <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="h-4 w-4" />
                  <CardTitle className="text-sm">Subjects Needing Improvement</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {weakSubjects.map(s => (
                    <div key={s.subject} className="flex items-center gap-2 bg-white dark:bg-black/20 rounded-lg px-3 py-1.5 border border-amber-200 dark:border-amber-700">
                      <span className="text-sm font-medium">{s.subject}</span>
                      <Badge className="bg-amber-500 text-white text-xs">{s.avg}%</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Subject Progress Bars */}
          {subjectData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Subject Progress Bars</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {subjectData.map(s => {
                  const g = getGrade(s.avg, passingPct);
                  return (
                    <div key={s.subject} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{s.subject}</span>
                        <div className="flex items-center gap-2">
                          <Badge className={`${g.color} text-white text-xs px-1.5`}>{g.grade}</Badge>
                          <span className="text-muted-foreground">{s.avg}%</span>
                        </div>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${s.avg}%`, backgroundColor: getBarColor(s.avg) }}
                        />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Recent Results */}
          {recentResults.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent Exam Results</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left px-4 py-2 font-medium text-muted-foreground">Exam</th>
                      <th className="text-left px-4 py-2 font-medium text-muted-foreground">Subject</th>
                      <th className="text-left px-4 py-2 font-medium text-muted-foreground">Marks</th>
                      <th className="text-left px-4 py-2 font-medium text-muted-foreground">Grade</th>
                      <th className="text-left px-4 py-2 font-medium text-muted-foreground">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentResults.map(r => {
                      const pct = Math.round((r.obtainedMarks / r.totalMarks) * 100);
                      const g = getGrade(pct, r.passingPercentage);
                      return (
                        <tr key={r.id} className="border-b last:border-0 hover:bg-muted/30">
                          <td className="px-4 py-2">{r.examTitle}</td>
                          <td className="px-4 py-2">{r.subject}</td>
                          <td className="px-4 py-2">{r.obtainedMarks}/{r.totalMarks} <span className="text-muted-foreground">({pct}%)</span></td>
                          <td className="px-4 py-2">
                            <Badge className={`${g.color} text-white text-xs`}>{g.grade}</Badge>
                          </td>
                          <td className="px-4 py-2 text-muted-foreground">
                            {new Date(r.date + "T12:00:00").toLocaleDateString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}

          {studentResults.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>No exam results recorded for this student yet.</p>
              <p className="text-sm">Go to Academics to enter marks.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
