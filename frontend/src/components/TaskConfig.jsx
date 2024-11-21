function TaskConfig({ task, onTaskChange }) {
  return (
    <div className="mb-6 p-4 border rounded bg-white">
      <h3 className="font-semibold mb-2">Task Configuration</h3>

      <div className="mb-4">
        <label className="block text-sm mb-1">Team Size</label>
        <input
          type="number"
          min="2"
          value={task.teamSize}
          onChange={(e) =>
            onTaskChange({
              ...task,
              teamSize: parseInt(e.target.value),
            })
          }
          className="w-32 p-2 border rounded"
        />
      </div>

      <div className="mb-4">
        <h4 className="font-medium mb-2">Required Skills</h4>
        {task.skills.map((skill, index) => (
          <div key={skill.id} className="mb-2">
            <div className="flex items-center gap-4">
              <span>{skill.name}</span>
              <div className="flex-1">
                <label className="block text-xs">Required Level</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={skill.level}
                  onChange={(e) => {
                    const newSkills = [...task.skills];
                    newSkills[index] = {
                      ...skill,
                      level: parseFloat(e.target.value),
                    };
                    onTaskChange({ ...task, skills: newSkills });
                  }}
                  className="w-full"
                />
              </div>
              <div className="w-24">
                <label className="block text-xs">Importance</label>
                <input
                  type="number"
                  min="1"
                  value={skill.importance}
                  onChange={(e) => {
                    const newSkills = [...task.skills];
                    newSkills[index] = {
                      ...skill,
                      importance: parseInt(e.target.value),
                    };
                    onTaskChange({ ...task, skills: newSkills });
                  }}
                  className="w-full p-1 border rounded"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TaskConfig;
