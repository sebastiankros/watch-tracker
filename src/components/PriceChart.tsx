'use client';

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface ChartData {
  date: string;
  price: number;
  source: string;
}

export default function PriceChart({ data }: { data: ChartData[] }) {
  if (data.length === 0) {
    return <div className="text-gray-500 text-center py-8">No price history available</div>;
  }

  const formatYAxis = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value}`;
  };

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f1f2e" />
          <XAxis
            dataKey="date"
            tick={{ fill: '#666', fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: '#333' }}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fill: '#666', fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: '#333' }}
            tickFormatter={formatYAxis}
            domain={['auto', 'auto']}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#111118',
              border: '1px solid #333',
              borderRadius: '8px',
              fontSize: '12px',
            }}
            labelStyle={{ color: '#999' }}
            formatter={(value: number) => [`$${value.toLocaleString()}`, 'Price']}
          />
          <Line
            type="monotone"
            dataKey="price"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, stroke: '#3b82f6', fill: '#111118' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
