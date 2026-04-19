ALTER TABLE "student_specialists"
  ADD CONSTRAINT "student_specialists_student_specialist_service_unique"
  UNIQUE ("student_id", "specialist_id", "service_type");
