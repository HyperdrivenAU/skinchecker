type Props = {
  score: number;
  grade: string;
  colour: string;
};

export default function RiskGauge({ score, grade, colour }: Props) {
  return (
    <div className="mx-auto my-8 flex h-48 w-48 flex-col items-center justify-center rounded-full border-8 border-blue-600 bg-white shadow-lg">
      <div className="text-5xl font-bold text-slate-900">{score}</div>
      <div className="text-sm text-slate-500">/100</div>
      <div className="mt-2 text-lg font-semibold text-slate-800">{grade}</div>
      <div className="text-xs uppercase tracking-wide text-slate-500">{colour}</div>
    </div>
  );
}