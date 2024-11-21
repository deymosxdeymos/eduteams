import { useState } from "react";
import StudentForm from "./components/StudentForm";
import TaskConfig from "./components/TaskConfig";

function App() {
  const [students, setStudents] = useState([
    {
      id: "1",
      name: "",
      gender: "FEMALE",
      personality: {
        ei: 0,
        sn: 0,
        tf: 0,
        pj: 0,
      },
      skills: [],
    },
  ]);

  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [task, setTask] = useState({
    id: "1",
    skills: [
      { id: "1", name: "Python Programming", level: 0.6, importance: 2 },
      { id: "2", name: "Data Analysis", level: 0.5, importance: 1 },
      { id: "3", name: "Machine Learning", level: 0.7, importance: 1 },
    ],
    teamSize: 2,
  });

  const handleStudentChange = (index, field, value) => {
    const newStudents = [...students];
    newStudents[index] = {
      ...newStudents[index],
      [field]: value,
    };
    setStudents(newStudents);
  };

  const handleAddStudent = () => {
    setStudents([
      ...students,
      {
        id: (students.length + 1).toString(),
        name: "",
        gender: "FEMALE",
        personality: { ei: 0, sn: 0, tf: 0, pj: 0 },
        skills: [],
      },
    ]);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const totalStudents = students.length;
    const { teamSize } = task;

    // Log initial data
    console.log("Total students:", totalStudents);
    console.log("Team size:", teamSize);

    // Calculate how many teams we need
    const numberOfTeams = Math.floor(totalStudents / teamSize);
    console.log("Number of teams possible:", numberOfTeams);

    if (numberOfTeams < 1) {
      setError(`Need at least ${teamSize} students to form a team`);
      setLoading(false);
      return;
    }

    // Create separate tasks for each team we want to form
    const tasks = Array(numberOfTeams)
      .fill()
      .map((_, index) => ({
        id: `${task.id}_${index + 1}`,
        skills: task.skills.map(({ id, level, importance }) => ({
          id,
          level,
          importance,
        })),
        teamSize: task.teamSize,
      }));

    const formData = {
      people: students.map(({ id, gender, personality, skills }) => ({
        id,
        gender,
        personality,
        skills,
      })),
      tasks: tasks, // Using the array of tasks
      alpha: 0.5,
      beta: 0.3,
      gamma: 0.1,
      delta: 0.1,
    };

    console.log("Sending to API:", JSON.stringify(formData, null, 2));

    try {
      const response = await fetch("http://localhost:3001/api/transform", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to form teams");
      }

      const data = await response.json();
      console.log("API Response:", JSON.stringify(data, null, 2));
      setResults(data);
    } catch (err) {
      console.error("Error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Team Formation System</h1>

      <form onSubmit={handleSubmit}>
        <TaskConfig task={task} onTaskChange={setTask} />

        {students.map((student, index) => (
          <StudentForm
            key={student.id}
            student={student}
            index={index}
            onStudentChange={handleStudentChange}
          />
        ))}

        <div className="flex gap-4">
          <button
            type="button"
            onClick={handleAddStudent}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Add Student
          </button>

          <button
            type="submit"
            disabled={loading}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
          >
            {loading ? "Forming Teams..." : "Form Teams"}
          </button>
        </div>
      </form>

      {error && (
        <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {results && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">
            Formed Teams for Task {task.id}
          </h2>
          {results.teams.map((team, index) => (
            <div key={index} className="mb-4 p-4 border rounded">
              <h3 className="font-semibold">Team {index + 1}</h3>
              <p className="text-sm text-gray-600">
                Quality Score: {(team.quality * 100).toFixed(1)}%
              </p>
              <div className="mt-2">
                <h4 className="font-medium">Members:</h4>
                <ul className="list-disc pl-5">
                  {team.people.map((person, pidx) => (
                    <li key={pidx}>
                      {students.find((s) => s.id === person.id)?.name ||
                        `Student ${person.id}`}
                      <span className="text-sm text-gray-600">
                        {" "}
                        (Skills: {person.skillIds.join(", ")})
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}
      {/* Add debug information */}
      <div className="mt-4 p-4 bg-gray-100 rounded">
        <h4 className="font-medium">Debug Info:</h4>
        <p>Total Students: {students.length}</p>
        <p>Team Size: {task.teamSize}</p>
        {results && <p>Teams Formed: {results.teams.length}</p>}
      </div>
    </div>
  );
}

export default App;
