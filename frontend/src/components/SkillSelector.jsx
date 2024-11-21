function SkillSelector({ studentSkills, onChange }) {
  const availableSkills = [
    { id: "1", name: "Python Programming" },
    { id: "2", name: "Data Analysis" },
    { id: "3", name: "Machine Learning" },
  ];

  const handleSkillToggle = (skillId) => {
    const hasSkill = studentSkills.some((s) => s.id === skillId);
    let newSkills;

    if (hasSkill) {
      newSkills = studentSkills.filter((s) => s.id !== skillId);
    } else {
      newSkills = [...studentSkills, { id: skillId, level: 0.5 }];
    }

    onChange(newSkills);
  };

  const handleLevelChange = (skillId, level) => {
    const newSkills = studentSkills.map((skill) =>
      skill.id === skillId ? { ...skill, level } : skill,
    );
    onChange(newSkills);
  };

  return (
    <div className="mb-4">
      <h4 className="font-medium mb-2">Skills</h4>
      {availableSkills.map((skill) => (
        <div key={skill.id} className="mb-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={studentSkills.some((s) => s.id === skill.id)}
              onChange={() => handleSkillToggle(skill.id)}
              className="form-checkbox"
            />
            <span>{skill.name}</span>
          </label>
          {studentSkills.some((s) => s.id === skill.id) && (
            <div className="ml-6 mt-1 flex items-center gap-2">
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={studentSkills.find((s) => s.id === skill.id)?.level || 0}
                onChange={(e) =>
                  handleLevelChange(skill.id, parseFloat(e.target.value))
                }
                className="flex-grow"
              />
              <span className="text-sm w-12 text-right">
                {(
                  studentSkills.find((s) => s.id === skill.id)?.level || 0
                ).toFixed(1)}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default SkillSelector;
