import { useState } from "react";
import type { Distribution } from "../../shared/types";
import { formatRate } from "../../shared/rate";

const colorAt = (index: number) =>
  [
    "#151515",
    "#666666",
    "#a1a1a1",
    "#d1d1d1",
    "#454545",
    "#858585",
    "#b8b8b8",
    "#e2e2e2",
  ][index % 8];

export function PieChart({
  distribution,
  activeRate,
  choose,
}: {
  distribution: Distribution[];
  activeRate: number | null;
  choose: (rate: number) => void;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const total = distribution.reduce((sum, item) => sum + item.count, 0);
  let angle = -Math.PI / 2;
  const segments = distribution.map((item, index) => {
    const start = angle;
    angle += (item.count / total) * Math.PI * 2;
    const end = angle;
    const point = (r: number, a: number) =>
      `${130 + r * Math.cos(a)},${130 + r * Math.sin(a)}`;
    const large = end - start > Math.PI ? 1 : 0;
    const path = `M ${point(113, start)} A 113 113 0 ${large} 1 ${point(113, end)} L ${point(77, end)} A 77 77 0 ${large} 0 ${point(77, start)} Z`;
    return { ...item, path, color: colorAt(index) };
  });
  const focus =
    distribution.find((item) => item.rate === hovered) || distribution[0];
  return (
    <div className="distribution-layout">
      <div className="pie-wrap">
        <svg
          viewBox="0 0 260 260"
          className="pie-chart"
          aria-label="各提交值的占比饼图"
        >
          {segments.map((item) =>
            distribution.length === 1 ? (
              <circle
                key={item.rate}
                cx="130"
                cy="130"
                r="95"
                stroke={item.color}
                strokeWidth="36"
                fill="none"
                role="button"
                tabIndex={0}
                aria-label={`${formatRate(item.rate)}%，${item.count} 条提交，占比 100%`}
                onClick={() => choose(item.rate)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    choose(item.rate);
                  }
                }}
              />
            ) : (
              <path
                key={item.rate}
                d={item.path}
                fill={item.color}
                stroke="white"
                strokeWidth="2"
                role="button"
                tabIndex={0}
                className={activeRate === item.rate ? "selected-slice" : ""}
                aria-label={`${formatRate(item.rate)}%，${item.count} 条提交，占比 ${((item.count / total) * 100).toFixed(1)}%`}
                onMouseEnter={() => setHovered(item.rate)}
                onMouseLeave={() => setHovered(null)}
                onFocus={() => setHovered(item.rate)}
                onBlur={() => setHovered(null)}
                onClick={() => choose(item.rate)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    choose(item.rate);
                  }
                }}
              />
            ),
          )}
        </svg>
        <div className="pie-center" aria-hidden="true">
          <strong>
            {formatRate(focus.rate)}
            <span>%</span>
          </strong>
          <small>{((focus.count / total) * 100).toFixed(1)}% 提交占比</small>
        </div>
      </div>
      <div className="chart-legend">
        {segments.map((item) => (
          <button
            key={item.rate}
            className={`legend-row ${activeRate === item.rate ? "active" : ""}`}
            onClick={() => choose(item.rate)}
          >
            <span className="swatch" style={{ background: item.color }} />
            <strong>{formatRate(item.rate)}%</strong>
            <span>{item.count} 条</span>
            <b>{((item.count / total) * 100).toFixed(1)}%</b>
          </button>
        ))}
      </div>
    </div>
  );
}
