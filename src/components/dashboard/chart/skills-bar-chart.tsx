import type { AssignmentStats } from "@/lib/stats/assignment";

interface SkillsBarChartProps {
  skills: AssignmentStats["skills"];
  skillsReady: boolean;
}

export function SkillsBarChart({ skills, skillsReady }: SkillsBarChartProps) {
  return (
    <div className="flex flex-col gap-3 flex-1 justify-center">
      {(skills.length > 0 ? skills : []).map((s) => (
        <div className="flex items-center gap-8 w-full" key={s.label}>
          <div className="text-neutral-700 text-sm shrink-0 w-[80px] whitespace-pre-wrap">
            {(s.label || "").replace(/\s+/g, "\n")}
          </div>
          <div className="flex-1 h-3 rounded-full bg-neutral-200">
            <div
              className="h-3 rounded-full"
              style={{
                width: `${skillsReady ? s.value : 0}%`,
                backgroundColor: "oklch(from #235ADF l c h)",
              }}
            />
          </div>
        </div>
      ))}
      <div className="flex items-center gap-3 w-full text-neutral-400 text-xs mt-1">
        <div className="w-[80px]"></div>
        <div className="flex-1 flex justify-between">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>
    </div>
  );
}
