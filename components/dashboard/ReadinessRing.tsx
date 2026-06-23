import { cn } from "@/lib/utils";

type ReadinessRingProps = {
  score: number;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeConfig = {
  sm: { dimension: 72, stroke: 6, fontSize: "text-lg", labelSize: "text-[0.62rem]" },
  md: { dimension: 96, stroke: 7, fontSize: "text-2xl", labelSize: "text-xs" },
  lg: { dimension: 120, stroke: 8, fontSize: "text-3xl", labelSize: "text-sm" },
} as const;

export function ReadinessRing({ score, size = "md", className }: ReadinessRingProps) {
  const { dimension, stroke, fontSize, labelSize } = sizeConfig[size];
  const radius = (dimension - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const isHealthy = score >= 70;

  return (
    <div className={cn("relative inline-flex flex-col items-center", className)}>
      <svg
        width={dimension}
        height={dimension}
        viewBox={`0 0 ${dimension} ${dimension}`}
        className="-rotate-90"
        aria-hidden="true"
      >
        <circle
          cx={dimension / 2}
          cy={dimension / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-white/55 dark:text-white/12"
        />
        <circle
          cx={dimension / 2}
          cy={dimension / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn(
            "readiness-ring-progress transition-[stroke-dashoffset] duration-700 ease-out",
            isHealthy
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-amber-500 dark:text-amber-400",
          )}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn("font-semibold leading-none tracking-tight", fontSize)}>{score}%</span>
        <span className={cn("mt-0.5 font-medium text-muted-foreground", labelSize)}>
          {isHealthy ? "Healthy" : "Review"}
        </span>
      </div>
      <span className="sr-only">Readiness score {score} percent</span>
    </div>
  );
}
