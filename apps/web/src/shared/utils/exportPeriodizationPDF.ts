import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: typeof autoTable;
  }
}

interface Periodization {
  id: string;
  name: string;
  objective: string;
  duration_weeks: number;
  start_date?: string;
  end_date?: string;
}

interface Phase {
  id: string;
  name: string;
  start_week: number;
  end_week: number;
  description?: string;
  workouts: Workout[];
}

interface Workout {
  id: string;
  name: string;
  description?: string;
  exercises: Exercise[];
}

interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  rest_seconds: number;
  notes?: string;
  order_index: number;
}

export async function exportPeriodizationToPDF(
  periodization: Periodization,
  phases: Phase[],
  studentName: string
) {
  const doc = new jsPDF();
  let yPosition = 20;

  // Header
  doc.setFontSize(24);
  doc.setTextColor(0, 255, 136); // Primary color
  doc.text('MeuPersonal', 105, yPosition, { align: 'center' });
  
  yPosition += 10;
  doc.setFontSize(18);
  doc.setTextColor(0, 0, 0);
  doc.text('PERIODIZAÇÃO DE TREINO', 105, yPosition, { align: 'center' });
  
  yPosition += 15;

  // Periodization Info
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Periodização:', 20, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(periodization.name, 55, yPosition);
  
  yPosition += 7;
  doc.setFont('helvetica', 'bold');
  doc.text('Aluno:', 20, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(studentName, 55, yPosition);
  
  yPosition += 7;
  doc.setFont('helvetica', 'bold');
  doc.text('Objetivo:', 20, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(periodization.objective, 55, yPosition);
  
  yPosition += 7;
  doc.setFont('helvetica', 'bold');
  doc.text('Duração:', 20, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(`${periodization.duration_weeks} semanas`, 55, yPosition);
  
  if (periodization.start_date && periodization.end_date) {
    yPosition += 7;
    doc.setFont('helvetica', 'bold');
    doc.text('Período:', 20, yPosition);
    doc.setFont('helvetica', 'normal');
    const startDate = format(new Date(periodization.start_date), "dd/MM/yyyy", { locale: ptBR });
    const endDate = format(new Date(periodization.end_date), "dd/MM/yyyy", { locale: ptBR });
    doc.text(`${startDate} - ${endDate}`, 55, yPosition);
  }
  
  yPosition += 15;

  // Sort phases by start_week
  const sortedPhases = [...phases].sort((a, b) => a.start_week - b.start_week);

  // Render each phase
  for (let phaseIndex = 0; phaseIndex < sortedPhases.length; phaseIndex++) {
    const phase = sortedPhases[phaseIndex];
    
    // Check if we need a new page
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }

    // Phase header
    doc.setFillColor(0, 255, 136);
    doc.rect(20, yPosition - 5, 170, 12, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    const phaseTitle = `FASE ${phaseIndex + 1}: ${phase.name.toUpperCase()}`;
    doc.text(phaseTitle, 105, yPosition + 2, { align: 'center' });
    
    yPosition += 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Semanas ${phase.start_week} - ${phase.end_week}`, 105, yPosition, { align: 'center' });
    yPosition += 10;

    // Phase description
    if (phase.description) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(10);
      doc.setTextColor(80, 80, 80);
      const descLines = doc.splitTextToSize(phase.description, 170);
      doc.text(descLines, 20, yPosition);
      yPosition += descLines.length * 5 + 5;
    }

    // Render workouts
    const sortedWorkouts = [...phase.workouts].sort((a, b) => a.name.localeCompare(b.name));
    
    for (const workout of sortedWorkouts) {
      // Check if we need a new page
      if (yPosition > 240) {
        doc.addPage();
        yPosition = 20;
      }

      // Workout header
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text(workout.name, 20, yPosition);
      yPosition += 7;

      // Workout description
      if (workout.description) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        const descLines = doc.splitTextToSize(workout.description, 170);
        doc.text(descLines, 20, yPosition);
        yPosition += descLines.length * 4 + 3;
      }

      // Exercises table
      if (workout.exercises && workout.exercises.length > 0) {
        const sortedExercises = [...workout.exercises].sort((a, b) => a.order_index - b.order_index);
        
        const tableData = sortedExercises.map((exercise, index) => {
          const restMinutes = Math.floor(exercise.rest_seconds / 60);
          const restSeconds = exercise.rest_seconds % 60;
          const restTime = restMinutes > 0 
            ? `${restMinutes}min${restSeconds > 0 ? ` ${restSeconds}s` : ''}`
            : `${restSeconds}s`;
          
          return [
            (index + 1).toString(),
            exercise.name,
            `${exercise.sets}x${exercise.reps}`,
            restTime,
            exercise.notes || '-',
          ];
        });

        autoTable(doc, {
          startY: yPosition,
          head: [['#', 'Exercício', 'Séries x Reps', 'Descanso', 'Observações']],
          body: tableData,
          theme: 'grid',
          headStyles: {
            fillColor: [50, 50, 50],
            textColor: [255, 255, 255],
            fontSize: 9,
            fontStyle: 'bold',
          },
          bodyStyles: {
            fontSize: 9,
          },
          columnStyles: {
            0: { cellWidth: 10, halign: 'center' },
            1: { cellWidth: 70 },
            2: { cellWidth: 30, halign: 'center' },
            3: { cellWidth: 25, halign: 'center' },
            4: { cellWidth: 55 },
          },
          margin: { left: 20, right: 20 },
        });

        yPosition = (doc as any).lastAutoTable.finalY + 10;
      } else {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text('Nenhum exercício cadastrado', 20, yPosition);
        yPosition += 10;
      }
    }

    yPosition += 5;
  }

  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} - Página ${i} de ${pageCount}`,
      105,
      290,
      { align: 'center' }
    );
  }

  // Save PDF
  const fileName = `Periodizacao_${periodization.name.replace(/[^a-z0-9]/gi, '_')}_${format(new Date(), 'yyyyMMdd')}.pdf`;
  doc.save(fileName);
}
