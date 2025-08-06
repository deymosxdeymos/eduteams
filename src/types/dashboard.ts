export interface Class {
  id: string;
  title: string;
  academicYear: string;
  studentCount: number;
  classCode: string;
}

export interface ClassGridProps {
  classes: Class[];
  showNoResults?: boolean;
}

export interface SearchInputProps {
  onCreateClass?: () => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
  placeholder?: string;
}
