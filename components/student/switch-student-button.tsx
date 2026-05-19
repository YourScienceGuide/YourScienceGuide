"use client";

import { useRouter } from "next/navigation";

import { useActiveStudent } from "@/components/family/active-student-provider";
import { Button } from "@/components/ui/button";

export function SwitchStudentButton({
  variant = "ghost",
  size = "sm",
}: {
  variant?: "ghost" | "outline";
  size?: "sm" | "default";
}) {
  const router = useRouter();
  const { students, clearStudent } = useActiveStudent();

  if (students.length <= 1) return null;

  function handleSwitch() {
    clearStudent();
    router.push("/student");
  }

  return (
    <Button type="button" variant={variant} size={size} onClick={handleSwitch}>
      Switch student
    </Button>
  );
}
