"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { buildFrontier, FRONTIER_MODELS, type FrontierEvent } from "@/lib/frontier";
import type { EvidenceRecord } from "@/lib/types";

const WIDTH = 1180;
const HEIGHT = 360;
const LEFT = 86;
const RIGHT = 1148;
const TOP = 36;
const BOTTOM = 282;

function formatValue(value: number | undefined): string {
  if (value === undefined) return "OPEN";
  return value.toFixed(6).replace(/0+$/u, "").replace(/\.$/u, "");
}

function formatForUnit(value: number | undefined, unit: "bits" | "work"): string {
  if (value === undefined) return "OPEN";
  const formatted = formatValue(value);
  return unit === "bits" ? formatted : `2^${formatted}`;
}

function eventDate(value: string): string {
  return new Date(value).toISOString().slice(0, 10);
}

function referenceDifference(frontierValue: number | undefined, reference: number | undefined): string {
  if (frontierValue === undefined || reference === undefined) return "no comparable accepted frontier";
  const difference = frontierValue - reference;
  const direction = difference >= 0 ? "above" : "below";
  return `proved frontier is ${formatValue(Math.abs(difference))} bits ${direction} this reference`;
}

function seriesPath(events: FrontierEvent[], side: "lower" | "upper", x: (index: number) => number, y: (value: number) => number): string | undefined {
  const first = events.findIndex((event) => event[side] !== undefined);
  if (first < 0) return undefined;
  let current = events[first]![side]!;
  let path = `M ${x(first)} ${y(current)}`;
  for (let index = first + 1; index < events.length; index += 1) {
    path += ` H ${x(index)}`;
    const next = events[index]![side];
    if (next !== undefined && next !== current) {
      current = next;
      path += ` V ${y(current)}`;
    }
  }
  return `${path} H ${RIGHT}`;
}

function intervalPath(events: FrontierEvent[], x: (index: number) => number, y: (value: number) => number): string | undefined {
  if (events.length === 0) return undefined;
  const upperY = (event: FrontierEvent) => event.upper === undefined ? TOP : y(event.upper);
  const lowerY = (event: FrontierEvent) => event.lower === undefined ? BOTTOM : y(event.lower);
  let path = `M ${x(0)} ${upperY(events[0]!)}`;
  for (let index = 1; index < events.length; index += 1) path += ` H ${x(index)} V ${upperY(events[index]!)}`;
  path += ` H ${RIGHT} L ${RIGHT} ${lowerY(events.at(-1)!)}`;
  for (let index = events.length - 1; index > 0; index -= 1) path += ` H ${x(index)} V ${lowerY(events[index - 1]!)}`;
  return `${path} H ${x(0)} Z`;
}

export function BoundChart({ records }: { records: EvidenceRecord[] }) {
  const defaultModel = FRONTIER_MODELS[0]!;
  const [modelId, setModelId] = useState(defaultModel.id);
  const [unit, setUnit] = useState<"bits" | "work">("bits");
  const model = FRONTIER_MODELS.find((candidate) => candidate.id === modelId) ?? defaultModel;
  const frontier = useMemo(() => buildFrontier(records, model), [records, model]);
  const [selectedRecordId, setSelectedRecordId] = useState<string | undefined>();
  const selected = frontier.events.find((event) => event.record.id === selectedRecordId) ?? frontier.events.at(-1);

  const values = frontier.events.flatMap((event) => [event.lower, event.upper]).filter((value): value is number => value !== undefined);
  if (frontier.reference !== undefined) values.push(frontier.reference);
  const center = values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
  const rawMinimum = values.length > 0 ? Math.min(...values) : center - 1;
  const rawMaximum = values.length > 0 ? Math.max(...values) : center + 1;
  const rawSpan = rawMaximum - rawMinimum;
  const minimumPadding = Math.max(Math.abs(center) * 0.0025, 0.05);
  const padding = Math.max(rawSpan * 0.28, minimumPadding);
  const minimum = rawMinimum - padding;
  const maximum = rawMaximum + padding;
  const y = (value: number) => TOP + ((maximum - value) / (maximum - minimum)) * (BOTTOM - TOP);
  const x = (index: number) => frontier.events.length <= 1
    ? LEFT + 18
    : LEFT + 18 + (index / (frontier.events.length - 1)) * (RIGHT - LEFT - 88);
  const lowerPath = seriesPath(frontier.events, "lower", x, y);
  const upperPath = seriesPath(frontier.events, "upper", x, y);
  const bandPath = intervalPath(frontier.events, x, y);
  const ticks = Array.from({ length: 6 }, (_, index) => minimum + (index / 5) * (maximum - minimum)).reverse();
  const gap = frontier.lower !== undefined && frontier.upper !== undefined ? frontier.upper - frontier.lower : undefined;

  return (
    <div className={`frontier-panel${frontier.inconsistent ? " frontier-inconsistent" : ""}`}>
      <div className="frontier-controls">
        <div className="frontier-model-tabs" role="tablist" aria-label="Bound model">
          {FRONTIER_MODELS.map((candidate) => (
            <button
              key={candidate.id}
              type="button"
              role="tab"
              aria-selected={candidate.id === model.id}
              className={candidate.id === model.id ? "active" : ""}
              onClick={() => {
                setModelId(candidate.id);
                setSelectedRecordId(undefined);
              }}
            >
              {candidate.shortTitle}
            </button>
          ))}
        </div>
        <div className="frontier-unit-controls" aria-label="Chart units">
          <span>Units</span>
          <button type="button" className={unit === "bits" ? "active" : ""} onClick={() => setUnit("bits")} aria-pressed={unit === "bits"}>Bits</button>
          <button type="button" className={unit === "work" ? "active" : ""} onClick={() => setUnit("work")} aria-pressed={unit === "work"}>Work</button>
        </div>
      </div>

      <div className="frontier-model-header">
        <div>
          <h3>{model.title}</h3>
          <p>{model.description}</p>
        </div>
        <div className={`frontier-current${frontier.reference !== undefined ? " has-reference" : ""}`} aria-label="Current bound interval">
          <div><span>{model.lowerLabel}</span><strong>{formatForUnit(frontier.lower, unit)}</strong><small>{frontier.lower === undefined ? "no accepted bound" : unit === "bits" ? model.unit : "work, logarithmic display"}</small></div>
          <div><span>{model.upperLabel}</span><strong>{formatForUnit(frontier.upper, unit)}</strong><small>{frontier.upper === undefined ? "no accepted bound" : unit === "bits" ? model.unit : "work, logarithmic display"}</small></div>
          <div><span>Unresolved interval</span><strong>{frontier.inconsistent ? "CONFLICT" : gap === undefined ? "OPEN" : unit === "bits" ? formatValue(gap) : `2^${formatValue(gap)}x`}</strong><small>{gap === undefined ? "one frontier is open" : unit === "bits" ? model.unit : "multiplicative ratio"}</small></div>
          {frontier.reference !== undefined ? <div className="frontier-reference-card"><span>{model.reference?.label ?? "Comparison reference"}</span><strong>{formatForUnit(frontier.reference, unit)}</strong><small>{referenceDifference(frontier.lower, frontier.reference)}; {model.reference?.qualification ?? "comparison only, excluded from both frontiers"}</small></div> : null}
        </div>
      </div>

      {frontier.events.length === 0 ? (
        <div className="empty">No accepted bound is recorded for this model.</div>
      ) : (
        <div className="frontier-chart-wrap">
          <svg className="frontier-chart" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={`${model.title} accepted frontier history`}>
            <defs>
              <pattern id={`open-band-${model.id}`} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <line x1="0" y1="0" x2="0" y2="8" className="frontier-band-hatch" />
              </pattern>
            </defs>
            <text x={LEFT} y="15" className="axis-title">{unit === "bits" ? model.axisLabel : `${model.axisLabel.replace("log2 ", "")} on logarithmic axis`}</text>
            {ticks.map((tick) => (
              <g key={tick}>
                <line x1={LEFT} x2={RIGHT} y1={y(tick)} y2={y(tick)} className="grid-line" />
                <text x={LEFT - 10} y={y(tick) + 4} textAnchor="end" className="axis-tick">{formatForUnit(tick, unit)}</text>
              </g>
            ))}
            {bandPath ? <path d={bandPath} fill={`url(#open-band-${model.id})`} className="frontier-band" /> : null}
            {frontier.reference !== undefined ? (
              <g>
                <line x1={LEFT} x2={RIGHT} y1={y(frontier.reference)} y2={y(frontier.reference)} className="reference-line" />
                <text x={RIGHT - 8} y={y(frontier.reference) - 8} textAnchor="end" className="reference-label">{model.reference?.label.toUpperCase() ?? "COMPARISON REFERENCE"}: {formatForUnit(frontier.reference, unit)}</text>
              </g>
            ) : null}
            {frontier.upper === undefined ? <text x={RIGHT - 8} y={TOP + 17} textAnchor="end" className="open-label">UPPER FRONTIER OPEN</text> : null}
            {frontier.lower === undefined ? <text x={RIGHT - 8} y={BOTTOM - 10} textAnchor="end" className="open-label">LOWER FRONTIER OPEN</text> : null}
            {lowerPath ? <path d={lowerPath} className="frontier-lower-line" /> : null}
            {upperPath ? <path d={upperPath} className="frontier-upper-line" /> : null}
            {frontier.events.map((event, index) => {
              const active = selected?.record.id === event.record.id;
              return (
                <g
                  key={event.record.id}
                  className={`frontier-event-point${active ? " active" : ""}`}
                  role="button"
                  tabIndex={0}
                  aria-label={`${event.record.title}, ${eventDate(event.record.acceptedAt)}`}
                  onMouseEnter={() => setSelectedRecordId(event.record.id)}
                  onFocus={() => setSelectedRecordId(event.record.id)}
                  onClick={() => setSelectedRecordId(event.record.id)}
                  onKeyDown={(keyboardEvent) => {
                    if (keyboardEvent.key === "Enter" || keyboardEvent.key === " ") setSelectedRecordId(event.record.id);
                  }}
                >
                  <line x1={x(index)} x2={x(index)} y1={TOP} y2={BOTTOM + 17} className="frontier-event-rule" />
                  {event.moves.filter((move) => move.side === "lower").map((move) => <circle key={move.metricId} cx={x(index)} cy={y(event.lower!)} r="5" className="frontier-lower-point" />)}
                  {event.moves.filter((move) => move.side === "upper").map((move) => <circle key={move.metricId} cx={x(index)} cy={y(event.upper!)} r="5" className="frontier-upper-point" />)}
                  <text x={x(index)} y={BOTTOM + 34} textAnchor="start" className="event-date" transform={`rotate(35 ${x(index)} ${BOTTOM + 34})`}>{eventDate(event.record.acceptedAt)}</text>
                </g>
              );
            })}
            <line x1={LEFT} x2={RIGHT} y1={BOTTOM} y2={BOTTOM} className="axis-line" />
            <text x={RIGHT} y={HEIGHT - 7} textAnchor="end" className="axis-title">accepted record history</text>
          </svg>
        </div>
      )}

      <div className="frontier-footer">
        <div className="frontier-legend">
          <span><i className="legend-lower" />Proofs raise the lower frontier</span>
          <span><i className="legend-upper" />Attacks or constructions lower the upper frontier</span>
          <span><i className="legend-band" />Unresolved interval</span>
          <span><i className="legend-reference" />Gray dashed comparison, excluded from both frontiers</span>
        </div>
        {selected ? (
          <div className="frontier-selected">
            <div><span>Selected accepted record</span><Link href={`/submissions/${selected.record.id}`}>{selected.record.title}</Link></div>
            <div><span>Accepted</span><strong>{eventDate(selected.record.acceptedAt)}</strong></div>
            <div><span>Frontier move</span><strong>{selected.moves.map((move) => `${move.side === "lower" ? "lower up" : "upper down"} to ${formatForUnit(move.value, unit)}${unit === "bits" ? ` ${model.unit}` : " work"}`).join(", ")}</strong></div>
            <div><span>Source</span><a href={selected.record.source.url}>{selected.record.source.authorLogin} / {selected.record.source.commit.slice(0, 12)}</a></div>
          </div>
        ) : null}
      </div>
      {frontier.inconsistent ? <div className="frontier-conflict">The accepted lower frontier exceeds the accepted upper frontier. The record contains a concrete contradiction that requires immediate review.</div> : null}
    </div>
  );
}
