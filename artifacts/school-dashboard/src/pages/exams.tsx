import { useState, useEffect } from "react";
import { getExams, saveExams, Exam, CLASSES, SUBJECTS, EXAM_TYPES } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Plus, Edit2, Trash2, ClipboardList } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Exams() {
  const { toast } = useToast();
  const [exams, setExams] = useState<Exam[]>([]);
  const [activeType, setActiveType] = useState("daily");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form
  const [title, setTitle] = useState("");
  const [cls, setCls] = useState("");
  const [subject, setSubject] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [totalMarks, setTotalMarks] = useState("100");
  const [passingPct, setPassingPct] = useState("33");

  useEffect(() => {
    setExams(getExams());
  }, []);

  const resetForm = () => {
    setTitle(""); setCls(""); setSubject("");
    setDate(new Date().toISOString().split("T")[0]);
    setTotalMarks("100"); setPassingPct("33");
    setEditingId(null); setShowForm(false);
  };

  const handleSubmit = () => {
    if (!title || !cls || !subject || !totalMarks) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }
    const exam: Exam = {
      id: editingId || Date.now().toString(),
      title,
      type: activeType,
      class: cls,
      subject,
      date,
      totalMarks: parseFloat(totalMarks),
      passingPercentage: parseFloat(passingPct),
    };
    let updated: Exam[];
    if (editingId) {
      updated = exams.map(e => e.id === editingId ? exam : e);
      toast({ title: "Exam updated" });
    } else {
      updated = [exam, ...exams];
      toast({ title: "Exam created" });
    }
    setExams(updated);
    saveExams(updated);
    resetForm();
  };

  const handleEdit = (exam: Exam) => {
    setTitle(exam.title);
    setCls(exam.class);
    setSubject(exam.subject);
    setDate(exam.date);
    setTotalMarks(String(exam.totalMarks));
    setPassingPct(String(exam.passingPercentage));
    setEditingId(exam.id);
    setActiveType(exam.type);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = (id: string) => {
    if (!window.confirm("Delete this exam?")) return;
    const updated = exams.filter(e => e.id !== id);
    setExams(updated);
    saveExams(updated);
  };

  const activeLabel = EXAM_TYPES.find(e => e.value === activeType)?.label || activeType;
  const filtered = exams.filter(e => e.type === activeType);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Exams</h1>
          <p className="text-muted-foreground mt-1">Create and manage all exam schedules.</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} data-testid="button-new-exam">
          <Plus className="mr-2 h-4 w-4" />
          {showForm ? "Cancel" : "New Exam"}
        </Button>
      </div>

      {/* Exam Type Tabs */}
      <div className="flex flex-wrap gap-2">
        {EXAM_TYPES.map(et => (
          <button
            key={et.value}
            onClick={() => setActiveType(et.value)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
              activeType === et.value
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
            }`}
            data-testid={`tab-exam-${et.value}`}
          >
            {et.label}
          </button>
        ))}
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle>{editingId ? "Edit Exam" : `Create ${activeLabel}`}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Exam Title <span className="text-destructive">*</span></Label>
                <Input placeholder="e.g. Chapter 5 Test" value={title} onChange={e => setTitle(e.target.value)} data-testid="input-exam-title" />
              </div>
              <div className="space-y-1.5">
                <Label>Class <span className="text-destructive">*</span></Label>
                <Select value={cls} onValueChange={setCls}>
                  <SelectTrigger data-testid="select-exam-class"><SelectValue placeholder="Select class" /></SelectTrigger>
                  <SelectContent>
                    {CLASSES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Subject <span className="text-destructive">*</span></Label>
                <Select value={subject} onValueChange={setSubject}>
                  <SelectTrigger data-testid="select-exam-subject"><SelectValue placeholder="Select subject" /></SelectTrigger>
                  <SelectContent>
                    {SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Exam Date</Label>
                <Input type="date" value={date} onChange={e => setDate(e.target.value)} data-testid="input-exam-date" />
              </div>
              <div className="space-y-1.5">
                <Label>Total Marks <span className="text-destructive">*</span></Label>
                <Input type="number" min="1" value={totalMarks} onChange={e => setTotalMarks(e.target.value)} data-testid="input-total-marks" />
              </div>
              <div className="space-y-1.5">
                <Label>Passing Percentage (%)</Label>
                <Input type="number" min="1" max="99" value={passingPct} onChange={e => setPassingPct(e.target.value)} data-testid="input-passing-pct" />
              </div>
            </div>
            <div className="flex gap-3">
              <Button onClick={handleSubmit} data-testid="button-save-exam">
                {editingId ? "Update Exam" : "Create Exam"}
              </Button>
              <Button variant="outline" onClick={resetForm}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Exam List */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-primary" />
            <CardTitle>{activeLabel} — {filtered.length} exam{filtered.length !== 1 ? "s" : ""}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Total Marks</TableHead>
                <TableHead>Passing %</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                    No {activeLabel.toLowerCase()} exams created yet. Click "New Exam" to add one.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map(exam => (
                  <TableRow key={exam.id} data-testid={`row-exam-${exam.id}`}>
                    <TableCell className="font-medium">{exam.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{exam.class}</Badge>
                    </TableCell>
                    <TableCell>{exam.subject}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(exam.date + "T12:00:00").toLocaleDateString("en-PK", { year: "numeric", month: "short", day: "numeric" })}
                    </TableCell>
                    <TableCell>{exam.totalMarks}</TableCell>
                    <TableCell>{exam.passingPercentage}%</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(exam)} data-testid={`button-edit-exam-${exam.id}`}>
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(exam.id)}
                          className="text-destructive hover:bg-destructive/10" data-testid={`button-delete-exam-${exam.id}`}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
