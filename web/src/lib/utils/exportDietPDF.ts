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

interface DietPlan {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  plan_type: 'unique' | 'cyclic';
  target_calories?: number;
  target_protein?: number;
  target_carbs?: number;
  target_fat?: number;
}

interface DietMeal {
  id: string;
  day_of_week: number;
  meal_type: string;
  meal_order: number;
  name?: string;
  meal_time?: string;
  diet_meal_items: DietMealItem[];
}

interface DietMealItem {
  id: string;
  quantity: number;
  unit: string;
  food: {
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

const DAYS_OF_WEEK = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export async function exportDietToPDF(
  dietPlan: DietPlan,
  meals: DietMeal[],
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
  doc.text('PLANO DE DIETA', 105, yPosition, { align: 'center' });
  
  yPosition += 15;

  // Plan Info
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Plano:', 20, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(dietPlan.name, 45, yPosition);
  
  yPosition += 7;
  doc.setFont('helvetica', 'bold');
  doc.text('Aluno:', 20, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(studentName, 45, yPosition);
  
  yPosition += 7;
  doc.setFont('helvetica', 'bold');
  doc.text('Período:', 20, yPosition);
  doc.setFont('helvetica', 'normal');
  const startDate = format(new Date(dietPlan.start_date), "dd/MM/yyyy", { locale: ptBR });
  const endDate = format(new Date(dietPlan.end_date), "dd/MM/yyyy", { locale: ptBR });
  doc.text(`${startDate} - ${endDate}`, 45, yPosition);
  
  yPosition += 7;
  doc.setFont('helvetica', 'bold');
  doc.text('Tipo:', 20, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(dietPlan.plan_type === 'cyclic' ? 'Cíclico (7 dias)' : 'Único (todos os dias)', 45, yPosition);
  
  yPosition += 12;

  // Nutritional Goals
  if (dietPlan.target_calories) {
    doc.setFillColor(240, 240, 240);
    doc.rect(20, yPosition - 5, 170, 20, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('METAS NUTRICIONAIS', 105, yPosition, { align: 'center' });
    
    yPosition += 8;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    const goals = `Calorias: ${dietPlan.target_calories}kcal | Proteínas: ${dietPlan.target_protein}g | Carboidratos: ${dietPlan.target_carbs}g | Gorduras: ${dietPlan.target_fat}g`;
    doc.text(goals, 105, yPosition, { align: 'center' });
    
    yPosition += 15;
  }

  // Group meals by day
  const mealsByDay = meals.reduce((acc, meal) => {
    const day = meal.day_of_week;
    if (!acc[day]) acc[day] = [];
    acc[day].push(meal);
    return acc;
  }, {} as Record<number, DietMeal[]>);

  // Sort days
  const sortedDays = Object.keys(mealsByDay).map(Number).sort((a, b) => a - b);

  // Render each day
  for (const dayNum of sortedDays) {
    const dayMeals = mealsByDay[dayNum].sort((a, b) => a.meal_order - b.meal_order);
    
    // Check if we need a new page
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }

    // Day header (only for cyclic plans)
    if (dietPlan.plan_type === 'cyclic') {
      doc.setFillColor(0, 255, 136);
      doc.rect(20, yPosition - 5, 170, 10, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(0, 0, 0);
      doc.text(DAYS_OF_WEEK[dayNum].toUpperCase(), 105, yPosition, { align: 'center' });
      yPosition += 12;
    }

    // Render each meal
    for (const meal of dayMeals) {
      // Check if we need a new page
      if (yPosition > 240) {
        doc.addPage();
        yPosition = 20;
      }

      // Meal header
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      const mealTitle = `${meal.name || meal.meal_type}${meal.meal_time ? ` - ${meal.meal_time}` : ''}`;
      doc.text(mealTitle, 20, yPosition);
      yPosition += 7;

      // Meal items table
      if (meal.diet_meal_items && meal.diet_meal_items.length > 0) {
        const tableData = meal.diet_meal_items.map(item => [
          item.food.name,
          `${item.quantity}${item.unit}`,
          `${item.food.calories.toFixed(0)}kcal`,
          `P: ${item.food.protein.toFixed(1)}g`,
          `C: ${item.food.carbs.toFixed(1)}g`,
          `G: ${item.food.fat.toFixed(1)}g`,
        ]);

        autoTable(doc, {
          startY: yPosition,
          head: [['Alimento', 'Quantidade', 'Calorias', 'Proteína', 'Carboidratos', 'Gordura']],
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
            0: { cellWidth: 60 },
            1: { cellWidth: 25 },
            2: { cellWidth: 25 },
            3: { cellWidth: 25 },
            4: { cellWidth: 30 },
            5: { cellWidth: 25 },
          },
          margin: { left: 20, right: 20 },
        });

        yPosition = (doc as any).lastAutoTable.finalY + 5;

        // Calculate totals
        const totals = meal.diet_meal_items.reduce(
          (acc, item) => ({
            calories: acc.calories + item.food.calories,
            protein: acc.protein + item.food.protein,
            carbs: acc.carbs + item.food.carbs,
            fat: acc.fat + item.food.fat,
          }),
          { calories: 0, protein: 0, carbs: 0, fat: 0 }
        );

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text(
          `Total: ${totals.calories.toFixed(0)}kcal | P: ${totals.protein.toFixed(1)}g | C: ${totals.carbs.toFixed(1)}g | G: ${totals.fat.toFixed(1)}g`,
          20,
          yPosition
        );
        yPosition += 10;
      } else {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text('Nenhum alimento cadastrado', 20, yPosition);
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
  const fileName = `Dieta_${dietPlan.name.replace(/[^a-z0-9]/gi, '_')}_${format(new Date(), 'yyyyMMdd')}.pdf`;
  doc.save(fileName);
}
