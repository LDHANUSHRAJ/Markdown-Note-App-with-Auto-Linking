import { TrendingUp } from 'lucide-react';

interface PageRankBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
}

export function PageRankBadge({ score, size = 'sm' }: PageRankBadgeProps) {
  const percentage = Math.round(score * 100);

  const sizeClasses = {
    sm: 'pagerank-badge-sm',
    md: 'pagerank-badge-md',
    lg: 'pagerank-badge-lg',
  };

  const getColor = () => {
    if (percentage >= 80) return 'pagerank-high';
    if (percentage >= 50) return 'pagerank-medium';
    if (percentage >= 20) return 'pagerank-low';
    return 'pagerank-minimal';
  };

  return (
    <span className={`pagerank-badge ${sizeClasses[size]} ${getColor()}`} title={`PageRank: ${percentage}%`}>
      <TrendingUp size={size === 'sm' ? 10 : size === 'md' ? 12 : 14} />
      <span>{percentage}</span>
    </span>
  );
}
