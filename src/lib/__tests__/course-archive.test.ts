import { describe, expect, it } from "bun:test";
import {
  getCourseForceVisibleArchivedAt,
  getNextCourseArchivedAt,
  resolveCourseArchivedState,
} from "@/lib/utils/course-archive";

const currentPeriod = {
  tahunAwalPeriode: 2025,
  tahunAkhirPeriode: 2026,
  periode: "genap" as const,
  label: "2025/2026 Genap",
};

describe("course archive helpers", () => {
  it("keeps force-visible past courses out of the archived section", () => {
    expect(
      resolveCourseArchivedState(
        {
          archivedAt: null,
          tahunAkhirPeriode: 2025,
          periode: "ganjil",
        },
        currentPeriod,
      ),
    ).toBe(true);

    expect(
      resolveCourseArchivedState(
        {
          archivedAt: getCourseForceVisibleArchivedAt(),
          tahunAkhirPeriode: 2025,
          periode: "ganjil",
        },
        currentPeriod,
      ),
    ).toBe(false);
  });

  it("stores a force-visible marker when restoring auto-archived courses", () => {
    expect(
      getNextCourseArchivedAt(
        {
          archive: false,
          tahunAkhirPeriode: 2025,
          periode: "ganjil",
        },
        currentPeriod,
      )?.getTime(),
    ).toBe(getCourseForceVisibleArchivedAt().getTime());
  });
});
