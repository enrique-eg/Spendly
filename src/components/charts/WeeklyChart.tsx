import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { Transaction } from '../../models/Transaction';

interface WeeklyChartProps {
  transactions: Transaction[];
  currencySymbol: string;
}

export default function WeeklyChart({ transactions, currencySymbol }: WeeklyChartProps) {
  const chartData = useMemo(() => {
    const today = new Date();
    const weekData: Record<string, { income: number; expense: number; day: string }> = {};

    // Initialize last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
      weekData[dateStr] = { income: 0, expense: 0, day: dayName };
    }

    // Accumulate transactions
    transactions.forEach((tx) => {
      if (!tx.transaction_date) return;
      const txDate = tx.transaction_date.split('T')[0];
      if (weekData[txDate]) {
        const amount = tx.amount_converted || tx.amount || 0;
        if (tx.type === 'income') {
          weekData[txDate].income += amount;
        } else if (tx.type === 'expense') {
          weekData[txDate].expense += amount;
        }
      }
    });

    return Object.values(weekData);
  }, [transactions]);

  return (
    <div>
      <h3 style={{ marginBottom: '0.75rem', fontSize: '1rem', fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>
        Last 7 days
      </h3>
      <div className="weekly-chart-container">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={chartData} 
            margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
          >
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="rgba(255,255,255,0.08)" 
              vertical={false}
            />
            <XAxis 
              dataKey="day" 
              stroke="rgba(255,255,255,0.4)" 
              style={{ fontSize: '0.7rem' }}
              tick={{ fill: 'rgba(255,255,255,0.6)' }}
            />
            <YAxis 
              stroke="rgba(255,255,255,0.4)" 
              style={{ fontSize: '0.7rem' }}
              tick={{ fill: 'rgba(255,255,255,0.6)' }}
              width={40}
            />
            <Tooltip 
              contentStyle={{ 
                background: 'rgba(5, 8, 5, 0.95)',
                border: '1px solid rgba(23, 207, 84, 0.3)',
                borderRadius: '0.75rem',
                padding: '0.75rem'
              }}
              labelStyle={{ color: 'rgba(255,255,255,0.9)' }}
              formatter={(value: any) => `${currencySymbol}${parseFloat(value).toFixed(0)}`}
            />
            <Legend 
              wrapperStyle={{ fontSize: '0.75rem', paddingTop: '0.35rem', paddingBottom: '0.2rem' }}
              align="center"
              verticalAlign="bottom"
              iconType="square"
            />
            <Bar 
              dataKey="income" 
              fill="#17cf54" 
              name="Income"
              radius={[6, 6, 0, 0]}
              isAnimationActive={true}
            />
            <Bar 
              dataKey="expense" 
              fill="#ef4444" 
              name="Expenses"
              radius={[6, 6, 0, 0]}
              isAnimationActive={true}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
