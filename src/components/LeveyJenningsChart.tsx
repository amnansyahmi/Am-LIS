import React, { useMemo } from 'react';
import * as d3 from 'd3';

interface QCPoint {
  date: string;
  value: number;
}

interface LeveyJenningsChartProps {
  data: QCPoint[];
  mean: number;
  sd: number;
  title: string;
}

const LeveyJenningsChart: React.FC<LeveyJenningsChartProps> = ({ data, mean, sd, title }) => {
  const width = 600;
  const height = 300;
  const margin = { top: 20, right: 80, bottom: 40, left: 50 };

  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const scales = useMemo(() => {
    const xScale = d3.scalePoint()
      .domain(data.map(d => d.date))
      .range([0, innerWidth]);

    const yScale = d3.scaleLinear()
      .domain([mean - 4 * sd, mean + 4 * sd])
      .range([innerHeight, 0]);

    return { xScale, yScale };
  }, [data, mean, sd, innerWidth, innerHeight]);

  const lineGenerator = d3.line<QCPoint>()
    .x(d => scales.xScale(d.date) || 0)
    .y(d => scales.yScale(d.value))
    .curve(d3.curveMonotoneX);

  const sigmaLines = [
    { label: '+3 SD', val: mean + 3 * sd, color: 'stroke-red-400' },
    { label: '+2 SD', val: mean + 2 * sd, color: 'stroke-amber-400' },
    { label: '+1 SD', val: mean + sd, color: 'stroke-blue-300' },
    { label: 'Mean', val: mean, color: 'stroke-slate-400' },
    { label: '-1 SD', val: mean - sd, color: 'stroke-blue-300' },
    { label: '-2 SD', val: mean - 2 * sd, color: 'stroke-amber-400' },
    { label: '-3 SD', val: mean - 3 * sd, color: 'stroke-red-400' },
  ];

  return (
    <div className="bg-white/40 border border-white/60 rounded-3xl p-6 backdrop-blur-xl">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-800">{title} Control Chart</h3>
        <span className="text-[10px] font-mono text-slate-400">Levey-Jennings Model</span>
      </div>
      
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
        <g transform={`translate(${margin.left},${margin.top})`}>
          {/* Sigma Lines */}
          {sigmaLines.map((line, i) => (
            <g key={i}>
              <line
                x1={0}
                y1={scales.yScale(line.val)}
                x2={innerWidth}
                y2={scales.yScale(line.val)}
                className={`${line.color} stroke-[1] ${line.label === 'Mean' ? '' : 'stroke-dasharray-4'}`}
                strokeDasharray={line.label === 'Mean' ? "0" : "4,4"}
              />
              <text
                x={innerWidth + 10}
                y={scales.yScale(line.val)}
                className="text-[9px] font-mono fill-slate-400 align-middle"
              >
                {line.label}
              </text>
            </g>
          ))}

          {/* Data Path */}
          <path
            d={lineGenerator(data) || undefined}
            fill="none"
            className="stroke-blue-600 stroke-[2]"
          />

          {/* Points */}
          {data.map((d, i) => (
            <circle
              key={i}
              cx={scales.xScale(d.date)}
              cy={scales.yScale(d.value)}
              r={4}
              className={`${
                Math.abs(d.value - mean) > 3 * sd ? 'fill-red-600' :
                Math.abs(d.value - mean) > 2 * sd ? 'fill-amber-500' :
                'fill-blue-600'
              } stroke-white stroke-[2]`}
            />
          ))}

          {/* Bottom Axis Labels */}
          {data.filter((_, i) => i % 3 === 0).map((d, i) => (
            <text
              key={i}
              x={scales.xScale(d.date)}
              y={innerHeight + 20}
              className="text-[9px] font-mono fill-slate-400 text-center"
              textAnchor="middle"
            >
              {d.date}
            </text>
          ))}
        </g>
      </svg>
    </div>
  );
};

export default LeveyJenningsChart;
