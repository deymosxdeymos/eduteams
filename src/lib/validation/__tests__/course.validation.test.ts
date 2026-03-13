import { describe, expect, it } from "bun:test";
import { courseCreateSchema } from "@/lib/validation/course";

describe("validation/course", () => {
  it("accepts a valid course create payload", () => {
    const value = courseCreateSchema.parse({
      namaMataKuliah: "Algoritma",
      kelas: "RA",
      tahunAwalPeriode: 2025,
      tahunAkhirPeriode: 2025,
      periode: "ganjil",
    });
    expect(value.namaMataKuliah).toBe("Algoritma");
  });

  it("rejects invalid year range", () => {
    expect(() =>
      courseCreateSchema.parse({
        namaMataKuliah: "Algo",
        kelas: "RB",
        tahunAwalPeriode: 2025,
        tahunAkhirPeriode: 2024,
        periode: "genap",
      }),
    ).toThrow();
  });
});
