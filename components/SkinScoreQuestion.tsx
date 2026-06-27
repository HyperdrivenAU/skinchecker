type Props = {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
};

export default function SkinScoreQuestion({ label, value, options, onChange }: Props) {
  return (
    <div className="mb-6">
      <h3 className="mb-3 text-lg font-semibold text-slate-900">{label}</h3>

      <div className="grid gap-3">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={`rounded-2xl border px-4 py-3 text-left text-sm font-medium transition ${
              value === option
                ? "border-blue-600 bg-blue-50 text-blue-900"
                : "border-slate-200 bg-white text-slate-700"
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}