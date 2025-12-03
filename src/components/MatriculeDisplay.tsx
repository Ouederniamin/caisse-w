/**
 * Component for displaying Tunisian vehicle matricules like real license plates
 * Format: 3 digits (left) + "تونس" (center) + 4 digits (right)
 * Example: 238 تونس 8008
 * Design: Black background, white text, white border - matching real Tunisian plates
 */

interface MatriculeDisplayProps {
  matricule: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function MatriculeDisplay({ matricule, className = '', size = 'md' }: MatriculeDisplayProps) {
  // Parse the matricule to ensure proper display
  const parts = matricule.match(/(\d{2,3})\s*تونس\s*(\d{3,4})/);
  
  if (!parts) {
    // Fallback if format doesn't match
    return <span className={`font-mono ${className}`}>{matricule}</span>;
  }

  const [, serie, unique] = parts;

  // Size classes for license plate
  const sizeClasses = {
    sm: {
      container: 'px-2 py-1',
      text: 'text-lg',
      arabic: 'text-base',
      border: 'border-2',
    },
    md: {
      container: 'px-3 py-1.5',
      text: 'text-2xl',
      arabic: 'text-xl',
      border: 'border-[3px]',
    },
    lg: {
      container: 'px-4 py-2',
      text: 'text-3xl',
      arabic: 'text-2xl',
      border: 'border-[3px]',
    },
  };

  const sizes = sizeClasses[size];

  return (
    <span 
      className={`inline-flex items-center justify-between gap-2 bg-black ${sizes.border} border-white rounded-lg ${sizes.container} shadow-lg ${className}`}
      dir="ltr"
      style={{ fontFamily: 'monospace' }}
    >
      <span className={`font-bold text-white ${sizes.text}`}>{serie.padStart(3, '0')}</span>
      <span className={`font-bold text-white ${sizes.arabic} tracking-wider`} dir="rtl">تونس</span>
      <span className={`font-bold text-white ${sizes.text}`}>{unique.padStart(4, '0')}</span>
    </span>
  );
}

/**
 * Badge variant - same license plate design, smaller size
 */
export function MatriculeBadge({ matricule, className = '', size = 'sm' }: MatriculeDisplayProps) {
  return <MatriculeDisplay matricule={matricule} className={className} size={size} />;
}

/**
 * Card-style display - license plate design for larger prominence
 */
export function MatriculeCard({ matricule, className = '' }: MatriculeDisplayProps) {
  return <MatriculeDisplay matricule={matricule} className={className} size="lg" />;
}
