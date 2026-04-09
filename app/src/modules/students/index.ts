// Students Module - Public API
// This module handles student management for personal trainers

// Components
export { StudentEditModal } from './components/StudentEditModal';
export * from './routes';
export { default as StudentAssessmentScreen } from './screens/StudentAssessmentScreen';

// Types (re-export from store for now)
export type { PhysicalAssessment, Student } from './store/studentStore';
// Store
export { useStudentStore } from './store/studentStore';
