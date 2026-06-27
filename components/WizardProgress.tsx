type Props = {
  step: number;
  total: number;
};

export default function ProgressBar({ step, total }: Props) {
  const percent = Math.round((step / total) * 100);

  return (
    <div className="mb-8">
      <div className="mb-2 flex justify-between text-sm text-slate-600">
        <span>Step {step} of {total}</span>
        <span>{percent}%</span>
      </div>

      <div className="h-3 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-blue-600 transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}