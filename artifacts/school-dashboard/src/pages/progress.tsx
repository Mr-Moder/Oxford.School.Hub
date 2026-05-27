import { useState, useEffect } from "react";
import { getStudents, getExamResults, getGrade, getPassingPercentage, EXAM_TYPES } from "@/lib/storage";
import { SearchableCombobox, ComboboxOption } from "@/components/searchable-combobox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  LineChart, Line, AreaChart, Area
} from "recharts";
import { TrendingUp, TrendingDown, UserCheck, BookOpen, AlertTriangle, Medal, Star } from "lucide-react";

function getMonthDays(year: number, month: number) {
  const days: string[] = [];
  const dim = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= dim; d++) days.push(new Date(year, month, d).toISOString().split("T")[0]);
  return days;
}

export default function StudentProgress() {
  const [studentId, setStudentId] = useState("");
  const students = getStudents();
  const allResults = getExamResults();
  const passingPct = getPassingPercentage();

  const now = new Date();
  const monthDays = getMonthDays(now.getFullYear(), now.getMonth());

  const student = students.find(s => s.id === studentId);
  const studentResults = allResults.filter(r => r.studentId === studentId);

  // Student options: searchable by name OR roll number
  const studentOptions: ComboboxOption[] = students.map(s => ({
    label: `${s.name} — Roll ${s.rollNumber} (${s.class})`,
    value: s.id,
  }));

  // Attendance
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
    count: pcts.length,
  })).sort((a, b) => b.avg - a.avg);

  const strongSubjects = subjectData.filter(s => s.avg >= 80);
  const weakSubjects = subjectData.filter(s => s.avg < passingPct + 10);

  // Performance by exam type
  const examTypeData = EXAM_TYPES.map(et => {
    const tr = studentResults.filter(r => r.examType === et.value);
    if (tr.length === 0) return null;
    const avg = Math.round(tr.reduce((acc, r) => acc + (r.obtainedMarks / r.totalMarks) * 100, 0) / tr.length);
    return { name: et.label.replace(" Test", ""), avg, count: tr.length };
  }).filter(Boolean) as { name: string; avg: number; count: number }[];

  // Class ranking
  const classmates = student ? students.filter(s => s.class === student.class) : [];
  const classPerfMap: Record<string, number> = {};
  classmates.forEach(s => {
    const sr = allResults.filter(r => r.studentId === s.id);
    if (sr.length > 0) {
      classPerfMap[s.id] = Math.round(sr.reduce((acc, r) => acc + (r.obtainedMarks / r.totalMarks) * 100, 0) / sr.length);
    }
  });
  const sortedClassmates = Object.entries(classPerfMap).sort((a, b) => b[1] - a[1]);
  const myRank = studentId ? sortedClassmates.findIndex(([id]) => id === studentId) + 1 : null;
  const totalRanked = sortedClassmates.length;

  // Improvement rate: compare avg of first half vs second half of results
  let improvementRate: number | null = null;
  if (studentResults.length >= 4) {
    const sorted = [...studentResults].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const half = Math.floor(sorted.length / 2);
    const firstHalf = sorted.slice(0, half);
    const secondHalf = sorted.slice(half);
    const firstAvg = firstHalf.reduce((acc, r) => acc + (r.obtainedMarks / r.totalMarks) * 100, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((acc, r) => acc + (r.obtainedMarks / r.totalMarks) * 100, 0) / secondHalf.length;
    improvementRate = Math.round(secondAvg - firstAvg);
  }

  // Recent results
  const recentResults = [...studentResults].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 12);

  const getBarColor = (avg: number) => {
    if (avg >= 80) return "#10b981";
    if (avg >= passingPct) return "#3b82f6";
    return "#ef4444";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Student Progress</h1>
        <p className="text-muted-foreground mt-1">Track individual student performance. Search by name or roll number.</p>
      </div>

      {/* Smart Student Search */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <label className="text-sm font-medium shrink-0">Search Student:</label>
            <SearchableCombobox
              options={studentOptions}
              value={studentId}
              onChange={setStudentId}
              placeholder="Type name or roll number..."
              className="max-w-md flex-1"
              data-testid="select-progress-student"
            />
          </div>
        </CardContent>
      </Card>

      {!student ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
          <TrendingUp className="h-12 w-12 opacity-20" />
          <p className="text-lg font-medium">Select a student to view progress</p>
          <p className="text-sm">Search by name or roll number above.</p>
        </div>
      ) : (
        <>
          {/* Student Banner */}
          <Card className="bg-gradient-to-r from-blue-600 to-blue-800 text-white border-0">
            <CardContent className="pt-5 pb-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-bold">{student.name}</h2>
                  <p className="opacity-80 text-sm">Father: {student.fatherName} · Class {student.class} · Roll No {student.rollNumber}</p>
                  <p className="opacity-70 text-xs mt-1">Admission: {student.admissionDate} · DOB: {student.dateOfBirth}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-white/20 text-white text-sm px-3 py-1">
                    {student.feeStatus === "paid" ? "✅ Fee Paid" : "⚠️ Fee Pending"}
                  </Badge>
                  {myRank !== null && myRank > 0 && (
                    <Badge className="bg-amber-400/80 text-amber-900 text-sm px-3 py-1">
                      🏆 Class Rank #{myRank} of {totalRanked}
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* KPI Overview */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-muted-foreground font-medium">Attendance (This Month)</p>
                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className={`text-2xl font-bold ${attendancePct !== null ? (attendancePct >= 75 ? "text-emerald-600" : "text-red-500") : "text-muted-foreground"}`}>
                  {attendancePct !== null ? `${attendancePct}%` : "—"}
                </p>
                <p className="text-xs text-muted-foreground">{presentDays.length}/{markedDays.length} days present</p>
                {attendancePct !== null && <Progress value={attendancePct} className="mt-2 h-1.5" />}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-muted-foreground font-medium">Average Score</p>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className={`text-2xl font-bold ${avgMarks !== null ? (avgMarks >= passingPct ? "text-emerald-600" : "text-red-500") : "text-muted-foreground"}`}>
                  {avgMarks !== null ? `${avgMarks}%` : "—"}
                </p>
                <p className="text-xs text-muted-foreground">{studentResults.length} exam{studentResults.length !== 1 ? "s" : ""} taken</p>
                {avgMarks !== null && <Progress value={avgMarks} className="mt-2 h-1.5" />}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-muted-foreground font-medium">Improvement Rate</p>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className={`text-2xl font-bold ${improvementRate === null ? "text-muted-foreground" : improvementRate >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                  {improvementRate === null ? "—" : `${improvementRate > 0 ? "+" : ""}${improvementRate}%`}
                </p>
                <p className="text-xs text-muted-foreground">{improvementRate === null ? "Need ≥4 exams" : improvementRate >= 0 ? "Improving" : "Declining"}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-muted-foreground font-medium">Class Rank</p>
                  <Medal className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className={`text-2xl font-bold ${myRank !== null && myRank <= 3 ? "text-amber-500" : "text-foreground"}`}>
                  {myRank !== null && myRank > 0 ? `#${myRank}` : "—"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {myRank !== null && myRank > 0 ? `Out of ${totalRanked} ranked students` : "No results yet"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Strong & Weak Subjects */}
          {(strongSubjects.length > 0 || weakSubjects.length > 0) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {strongSubjects.length > 0 && (
                <Card className="border-emerald-200 dark:border-emerald-800">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                      <Star className="h-4 w-4" />
                      <CardTitle className="text-sm">Strong Subjects</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {strongSubjects.map(s => (
                        <div key={s.subject} className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950 rounded-lg px-3 py-1.5 border border-emerald-200 dark:border-emerald-800">
                          <span className="text-sm font-medium">{s.subject}</span>
                          <Badge className="bg-emerald-500 text-white text-xs">{s.avg}%</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
              {weakSubjects.length > 0 && (
                <Card className="border-amber-200 dark:border-amber-800">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                      <AlertTriangle className="h-4 w-4" />
                      <CardTitle className="text-sm">Needs Improvement</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {weakSubjects.map(s => (
                        <div key={s.subject} className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950 rounded-lg px-3 py-1.5 border border-amber-200 dark:border-amber-800">
                          <span className="text-sm font-medium">{s.subject}</span>
                          <Badge className="bg-amber-500 text-white text-xs">{s.avg}%</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Charts */}
          {subjectData.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Subject performance - scrollable */}
              <Card>
                <CardHeader><CardTitle className="text-sm">Performance by Subject</CardTitle></CardHeader>
                <CardContent className="p-0 pb-2">
                  <div className="overflow-x-auto">
                    <div style={{ minWidth: Math.max(subjectData.length * 70, 300) + "px", height: 240 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={subjectData} margin={{ left: 8, right: 8, top: 8 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                          <XAxis dataKey="subject" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} angle={-30} textAnchor="end" height={50} />
                          <YAxis domain={[0, 100]} stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                          <Tooltip contentStyle={{ backgroundColor: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                            formatter={(val: number) => [`${val}%`, "Average"]} />
                          <Bar dataKey="avg" radius={[4, 4, 0, 0]} fill="hsl(var(--primary))" label={{ position: "top", fontSize: 10, formatter: (v: number) => `${v}%` }} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Exam type trend */}
              {examTypeData.length >= 2 && (
                <Card>
                  <CardHeader><CardTitle className="text-sm">Score Trend by Exam Type</CardTitle></CardHeader>
                  <CardContent className="h-[240px] pl-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={examTypeData}>
                        <defs>
                          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} angle={-20} textAnchor="end" height={40} />
                        <YAxis domain={[0, 100]} stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                          formatter={(val: number) => [`${val}%`, "Avg Score"]} />
                        <Area type="monotone" dataKey="avg" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#areaGrad)" dot={{ r: 4, fill: "hsl(var(--primary))" }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Subject Progress Bars */}
          {subjectData.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-sm">Subject Progress Breakdown</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {subjectData.map(s => {
                  const g = getGrade(s.avg, passingPct);
                  return (
                    <div key={s.subject} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{s.subject}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{s.count} test{s.count !== 1 ? "s" : ""}</span>
                          <Badge className={`${g.color} text-white text-xs px-1.5`}>{g.grade}</Badge>
                          <span className="text-muted-foreground text-sm">{s.avg}%</span>
                        </div>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${s.avg}%`, backgroundColor: getBarColor(s.avg) }} />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Performance by Exam Type - detailed */}
          {examTypeData.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-sm">Performance by Exam Type</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {examTypeData.map(et => {
                    const g = getGrade(et.avg, passingPct);
                    return (
                      <div key={et.name} className="text-center p-3 rounded-xl border bg-card hover:shadow-sm transition-shadow">
                        <p className="text-xs text-muted-foreground mb-1">{et.name}</p>
                        <p className={`text-xl font-bold ${g.color.replace("bg-", "text-").replace("-500", "-600").replace("-400", "-500")}`}>{et.avg}%</p>
                        <Badge className={`${g.color} text-white text-xs mt-1`}>{g.grade}</Badge>
                        <p className="text-xs text-muted-foreground mt-1">{et.count} test{et.count !== 1 ? "s" : ""}</p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Results */}
          {recentResults.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-sm">Recent Exam Results</CardTitle></CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        {["Exam", "Subject", "Type", "Marks", "Grade", "Date"].map(h => (
                          <th key={h} className="text-left px-4 py-2 font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {recentResults.map(r => {
                        const pct = Math.round((r.obtainedMarks / r.totalMarks) * 100);
                        const g = getGrade(pct, r.passingPercentage);
                        return (
                          <tr key={r.id} className="border-b last:border-0 hover:bg-muted/30">
                            <td className="px-4 py-2 font-medium">{r.examTitle}</td>
                            <td className="px-4 py-2">{r.subject}</td>
                            <td className="px-4 py-2"><Badge variant="outline" className="text-xs">{EXAM_TYPES.find(e => e.value === r.examType)?.label || r.examType}</Badge></td>
                            <td className="px-4 py-2">{r.obtainedMarks}/{r.totalMarks} <span className="text-muted-foreground">({pct}%)</span></td>
                            <td className="px-4 py-2"><Badge className={`${g.color} text-white text-xs`}>{g.grade}</Badge></td>
                            <td className="px-4 py-2 text-muted-foreground whitespace-nowrap">{new Date(r.date + "T12:00:00").toLocaleDateString()}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {studentResults.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>No exam results for this student yet.</p>
              <p className="text-sm">Go to Academics to enter marks.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
