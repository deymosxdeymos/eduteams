"use client";

import { useEffect, useState } from "react";

interface CopyrightYearProps {
  initialYear: number;
}

export function CopyrightYear({ initialYear }: CopyrightYearProps) {
  const [year, setYear] = useState(initialYear);

  useEffect(() => {
    const currentYear = new Date().getFullYear();

    if (currentYear !== initialYear) {
      setYear(currentYear);
    }
  }, [initialYear]);

  return <time dateTime={`${year}`}>{year}</time>;
}
