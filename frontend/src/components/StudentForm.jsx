import React from "react";
import PersonalitySliders from "./PersonalitySliders";
import SkillSelector from "./SkillSelector";

function StudentForm({ student, index, onStudentChange }) {
  return (
    <div className="mb-6 p-4 border rounded bg-white">
      <h3 className="font-semibold mb-2">Student {index + 1}</h3>

      <input
        type="text"
        placeholder="Name"
        value={student.name}
        onChange={(e) => onStudentChange(index, "name", e.target.value)}
        className="w-full p-2 mb-2 border rounded"
      />

      <select
        value={student.gender}
        onChange={(e) => onStudentChange(index, "gender", e.target.value)}
        className="w-full p-2 mb-4 border rounded"
        required
      >
        <option value="">Select Gender</option>
        <option value="FEMALE">Female</option>
        <option value="MALE">Male</option>
      </select>

      <PersonalitySliders
        personality={student.personality}
        onChange={(trait, value) =>
          onStudentChange(index, "personality", {
            ...student.personality,
            [trait]: value,
          })
        }
      />

      <SkillSelector
        studentSkills={student.skills}
        onChange={(newSkills) => onStudentChange(index, "skills", newSkills)}
      />
    </div>
  );
}

export default StudentForm;
