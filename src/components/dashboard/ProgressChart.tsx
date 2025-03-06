
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';

interface ProgressChartProps {
  data: any[];
}

const ProgressChart = ({ data }: ProgressChartProps) => {
  // Transform goal data into chart data
  // In a real app, this would use actual historical tracking data
  const chartData = [
    { name: 'Mon', progress: 30 },
    { name: 'Tue', progress: 45 },
    { name: 'Wed', progress: 60 },
    { name: 'Thu', progress: 40 },
    { name: 'Fri', progress: 70 },
    { name: 'Sat', progress: 55 },
    { name: 'Sun', progress: 65 },
  ];

  return (
    <div className="h-[250px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="name" 
            stroke="#888888"
            fontSize={12}
            tickLine={false}
            axisLine={{ stroke: '#e5e7eb' }}
          />
          <YAxis 
            stroke="#888888" 
            fontSize={12}
            tickLine={false}
            axisLine={{ stroke: '#e5e7eb' }}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'white', 
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              border: 'none'
            }} 
          />
          <Line 
            type="monotone" 
            dataKey="progress" 
            stroke="hsl(var(--primary))" 
            strokeWidth={2}
            dot={{ stroke: 'hsl(var(--primary))', strokeWidth: 2, r: 4, fill: 'white' }}
            activeDot={{ r: 6, stroke: 'hsl(var(--primary))', strokeWidth: 2, fill: 'hsl(var(--primary))' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ProgressChart;
