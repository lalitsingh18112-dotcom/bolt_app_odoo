interface MetricCardProps {
  label: string;
  value: string | number;
  color?: string;
}

export const MetricCard = ({ label, value, color }: MetricCardProps) => {
  return (
    <div className="metric-card">
      <div className="text-sm font-medium text-gray-600 mb-2">{label}</div>
      <div className={`text-2xl font-bold ${color || 'text-gray-900'}`}>
        {typeof value === 'number' ? `₹ ${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : value}
      </div>
    </div>
  );
};
