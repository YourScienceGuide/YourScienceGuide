import { beforeEach, describe, expect, it } from "vitest";

import {
  clearActiveStudentId,
  readActiveStudentId,
  writeActiveStudentId,
} from "@/lib/family/active-student";

describe("active student localStorage", () => {
  beforeEach(() => {
    clearActiveStudentId();
  });

  it("reads and writes active student id", () => {
    expect(readActiveStudentId()).toBeNull();
    writeActiveStudentId("student-1");
    expect(readActiveStudentId()).toBe("student-1");
    clearActiveStudentId();
    expect(readActiveStudentId()).toBeNull();
  });
});
