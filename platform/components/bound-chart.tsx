import type { EvidenceRecord } from "@/lib/types";

interface Point {
  id: string;
  value: number;
  label: string;
  date: string;
}

export function BoundChart({ records }: { records: EvidenceRecord[] }) {
  const points: Point[] = records
    .flatMap((record) =>
      record.effects.flatMap((effect) =>
        effect.metrics
          .filter((metric) => metric.id === "category-one.gate-depth-floor")
          .map((metric) => ({
            id: record.id,
            value: Number(metric.value),
            label: record.title,
            date: record.acceptedAt
          }))
      )
    )
    .sort((left, right) => left.date.localeCompare(right.date));
  if (points.length === 0) return <div className="empty">No accepted measurements.</div>;
  const width = 920;
  const height = 270;
  const padding = { left: 54, right: 24, top: 24, bottom: 44 };
  const minimum = Math.min(168, ...points.map((point) => Math.floor(point.value - 1)));
  const maximum = Math.max(175, ...points.map((point) => Math.ceil(point.value + 1)));
  const x = (index: number) =>
    points.length === 1
      ? width / 2
      : padding.left + (index / (points.length - 1)) * (width - padding.left - padding.right);
  const y = (value: number) =>
    padding.top + ((maximum - value) / (maximum - minimum)) * (height - padding.top - padding.bottom);
  const path = points.map((point, index) => `${index === 0 ? "M" : "L"} ${x(index)} ${y(point.value)}`).join(" ");
  const ticks = Array.from({ length: maximum - minimum + 1 }, (_, index) => minimum + index);
  return (
    <div className="chart-wrap">
      <svg className="chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="History of the conditional ideal Category 1 gate-depth floor">
        {ticks.map((tick) => (
          <g key={tick}>
            <line x1={padding.left} x2={width - padding.right} y1={y(tick)} y2={y(tick)} className="grid-line" />
            <text x={padding.left - 10} y={y(tick) + 4} textAnchor="end">
              {tick}
            </text>
          </g>
        ))}
        <line x1={padding.left} x2={width - padding.right} y1={y(170)} y2={y(170)} className="reference-line" />
        <text x={width - padding.right} y={y(170) - 7} textAnchor="end" className="reference-label">
          NIST reference 170
        </text>
        {points.length > 1 ? <path d={path} className="bound-line" /> : null}
        {points.map((point, index) => (
          <g key={point.id}>
            <circle cx={x(index)} cy={y(point.value)} r="5" className="bound-point" />
            <text x={x(index)} y={y(point.value) - 12} textAnchor="middle" className="point-value">
              {point.value.toFixed(12)}
            </text>
            <text x={x(index)} y={height - 15} textAnchor="middle">
              {new Date(point.date).toISOString().slice(0, 10)}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
