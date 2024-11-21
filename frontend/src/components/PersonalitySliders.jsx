function PersonalitySliders({ personality, onChange }) {
  const traits = [
    {
      key: "ei",
      label: "Extraversion/Introversion",
      left: "Introvert",
      right: "Extrovert",
    },
    {
      key: "sn",
      label: "Sensing/iNtuition",
      left: "Sensing",
      right: "Intuitive",
    },
    {
      key: "tf",
      label: "Thinking/Feeling",
      left: "Thinking",
      right: "Feeling",
    },
    {
      key: "pj",
      label: "Perception/Judging",
      left: "Perceiving",
      right: "Judging",
    },
  ];

  return (
    <div className="mb-4">
      <h4 className="font-medium mb-2">Personality Traits</h4>
      {traits.map((trait) => (
        <div key={trait.key} className="mb-2">
          <label className="block text-sm mb-1">{trait.label}</label>
          <div className="flex items-center gap-2">
            <span className="text-xs w-20">{trait.left}</span>
            <input
              type="range"
              min="-1"
              max="1"
              step="0.1"
              value={personality[trait.key]}
              onChange={(e) => onChange(trait.key, parseFloat(e.target.value))}
              className="flex-grow"
            />
            <span className="text-xs w-20 text-right">{trait.right}</span>
            <span className="text-xs w-12 text-right">
              {personality[trait.key].toFixed(1)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default PersonalitySliders;
