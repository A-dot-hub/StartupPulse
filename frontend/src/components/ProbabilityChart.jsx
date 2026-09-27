import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts';

export default function ProbabilityChart({
  successProbability = 50,
  failureProbability = 50,
  size = 220,
  innerRadius = 60,
  outerRadius = 85,
  showLegend = true,
}) {
  const successVal = Number(successProbability) || 0;
  const failureVal = Number(failureProbability) || 0;

  const data = [
    { name: 'Success Probability', value: successVal, color: '#10B981' },
    { name: 'Failure Probability', value: failureVal, color: '#F43F5E' },
  ];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0];
      return (
        <div
          style={{
            background: '#0F172A',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            padding: '0.5rem 0.85rem',
            borderRadius: '8px',
            fontSize: '0.8rem',
            color: '#F8FAFC',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
          }}
        >
          <div style={{ color: item.payload.color, fontWeight: 600 }}>
            {item.name}
          </div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '1rem', marginTop: '2px' }}>
            {Number(item.value).toFixed(2)}%
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ width: '100%', height: size, position: 'relative' }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip content={<CustomTooltip />} />
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={4}
            dataKey="value"
            stroke="none"
            animationDuration={800}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          {showLegend && (
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value, entry) => (
                <span style={{ color: '#94A3B8', fontSize: '0.785rem', marginLeft: '4px' }}>
                  {value} ({Number(entry.payload.value).toFixed(1)}%)
                </span>
              )}
            />
          )}
        </PieChart>
      </ResponsiveContainer>

      {/* Center percentage label */}
      <div
        style={{
          position: 'absolute',
          top: showLegend ? '43%' : '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          pointerEvents: 'none',
        }}
      >
        <span
          style={{
            display: 'block',
            fontSize: '1.45rem',
            fontWeight: 800,
            fontFamily: 'JetBrains Mono, monospace',
            color: successVal >= 50 ? '#34D399' : '#FB7185',
            lineHeight: 1,
          }}
        >
          {successVal.toFixed(1)}%
        </span>
        <span
          style={{
            display: 'block',
            fontSize: '0.68rem',
            color: '#64748B',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginTop: '3px',
          }}
        >
          Success
        </span>
      </div>
    </div>
  );
}
