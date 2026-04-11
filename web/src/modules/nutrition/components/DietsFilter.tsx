"use client";

interface DietsFilterProps {
  selectedStudentId: string;
  onStudentChange: (id: string) => void;
  students: { id: string; full_name: string }[];
}

export function DietsFilter({ selectedStudentId, onStudentChange, students }: DietsFilterProps) {
  return (
    <div className="bg-surface border border-white/10 rounded-xl p-4 flex items-center gap-4">
      <span className="text-sm font-medium text-muted-foreground">Filtrar por Aluno:</span>
      <div className="flex-1 max-w-sm">
        <select
          value={selectedStudentId}
          onChange={(e) => onStudentChange(e.target.value)}
          className="w-full bg-background border border-white/10 rounded-lg px-4 py-2 text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
        >
          <option value="">Todos os alunos</option>
          {students.map((student) => (
            <option key={student.id} value={student.id}>
              {student.full_name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
