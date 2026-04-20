import { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { getCategoryLabel, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../../constants/categories';
import type { Transaction } from '../../models/Transaction';
import '../charts/monthly-category-chart.css';

interface MonthlyCategoryChartProps {
  transactions: Transaction[];
  currencySymbol: string;
}

export default function MonthlyCategoryChart({ transactions, currencySymbol }: MonthlyCategoryChartProps) {
  const chartData = useMemo(() => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    // Filter transactions from current month
    const monthTransactions = transactions.filter(tx => {
      if (!tx.transaction_date) return false;
      const txDate = new Date(tx.transaction_date);
      return txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear;
    });

    // Separate expenses and income
    const expensesByCategory: Record<string, number> = {};
    const incomeByCategory: Record<string, number> = {};

    // Initialize categories
    EXPENSE_CATEGORIES.forEach(cat => {
      expensesByCategory[cat.id] = 0;
    });
    INCOME_CATEGORIES.forEach(cat => {
      incomeByCategory[cat.id] = 0;
    });

    // Accumulate transactions
    monthTransactions.forEach(tx => {
      const amount = tx.amount_converted || tx.amount || 0;
      const categoryId = tx.category_id || 'other';

      if (tx.type === 'expense') {
        expensesByCategory[categoryId] = (expensesByCategory[categoryId] || 0) + amount;
      } else if (tx.type === 'income') {
        incomeByCategory[categoryId] = (incomeByCategory[categoryId] || 0) + amount;
      }
    });

    const EXPENSE_COLORS = ['#ef4444', '#f87171', '#fca5a5', '#fcb5b5', '#fccccb'];
    const INCOME_COLORS = ['#17cf54', '#34d399', '#6ee7b7', '#a7f3d0', '#d1fae5'];

    const chartDataArray: Array<{ name: string; value: number; color: string; type: string }> = [];

    // Add expenses
    Object.entries(expensesByCategory)
      .filter(([_, amount]) => amount > 0)
      .forEach(([categoryId, amount], index) => {
        chartDataArray.push({
          name: `${getCategoryLabel(categoryId, 'expense')} (Expense)`,
          value: parseFloat(amount.toFixed(2)),
          color: EXPENSE_COLORS[index % EXPENSE_COLORS.length],
          type: 'expense'
        });
      });

    // Add income
    Object.entries(incomeByCategory)
      .filter(([_, amount]) => amount > 0)
      .forEach(([categoryId, amount], index) => {
        chartDataArray.push({
          name: `${getCategoryLabel(categoryId, 'income')} (Income)`,
          value: parseFloat(amount.toFixed(2)),
          color: INCOME_COLORS[index % INCOME_COLORS.length],
          type: 'income'
        });
      });

    return chartDataArray;
  }, [transactions]);
  const totalExpense = chartData
    .filter(item => item.type === 'expense')
    .reduce((sum, item) => sum + item.value, 0);
  const totalIncome = chartData
    .filter(item => item.type === 'income')
    .reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="monthly-category-chart-container">
      {chartData.length > 0 ? (
        <>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={110}
                paddingAngle={2}
                dataKey="value"
                isAnimationActive={false}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: 'rgba(5, 8, 5, 0.95)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '0.5rem',
                  padding: '0.5rem'
                }}
                formatter={(value: any) => `${currencySymbol}${parseFloat(value).toFixed(2)}`}
                labelStyle={{ color: 'rgba(255,255,255,0.9)' }}
              />
            </PieChart>
          </ResponsiveContainer>

          <div className="chart-legend-wrapper">
            <div className="chart-legend">
              {chartData.map((item, index) => (
                <div key={index} className="legend-item">
                  <div className="legend-color" style={{ backgroundColor: item.color }}></div>
                  <span className="legend-label">{item.name}</span>
                  <span className="legend-value">{currencySymbol}{item.value.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="chart-summary">
            <div className="summary-item">
              <span className="summary-label">Total Expenses:</span>
              <span className="summary-value expense">{currencySymbol}{totalExpense.toFixed(2)}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Total Income:</span>
              <span className="summary-value income">{currencySymbol}{totalIncome.toFixed(2)}</span>
            </div>
            <div className="summary-item total">
              <span className="summary-label">Net:</span>
              <span className={`summary-value ${totalIncome - totalExpense >= 0 ? 'income' : 'expense'}`}>
                {currencySymbol}{(totalIncome - totalExpense).toFixed(2)}
              </span>
            </div>
          </div>
        </>
      ) : (
        <p className="no-data">No transactions this month</p>
      )}
    </div>
  );
}
