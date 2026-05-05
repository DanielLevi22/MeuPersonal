import { redirect } from "next/navigation";

// Member workout creation now uses the full periodization flow
export default function Page() {
  redirect("/dashboard/workouts");
}
