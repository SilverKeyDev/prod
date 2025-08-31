import { User } from 'lucide-react';

interface CardAgentInfoProps {
  /** Agent name */
  agentName: string;
  /** Broker name (optional) */
  brokerName?: string;
  /** Size variant */
  size?: 'xs' | 'sm' | 'md';
  /** Show icon */
  showIcon?: boolean;
  /** Additional className */
  className?: string;
}

/**
 * Reusable card agent information display
 */
export default function CardAgentInfo({
  agentName,
  brokerName,
  size = 'xs',
  showIcon = false,
  className = ''
}: CardAgentInfoProps) {
  const getSizeClasses = () => {
    switch (size) {
      case 'xs':
        return {
          icon: 'mobile-icon-xs',
          text: 'text-responsive-xs'
        };
      case 'sm':
        return {
          icon: 'mobile-icon-sm',
          text: 'text-responsive-sm'
        };
      case 'md':
        return {
          icon: 'mobile-icon-md',
          text: 'text-responsive-base'
        };
      default:
        return {
          icon: 'mobile-icon-xs',
          text: 'text-responsive-xs'
        };
    }
  };

  const sizeClasses = getSizeClasses();

  return (
    <div className={`flex items-center gap-responsive-xs ${className}`}>
      {showIcon && (
        <User className={`${sizeClasses.icon} text-gray-500 flex-shrink-0`} />
      )}
      <span className={`${sizeClasses.text} text-gray-500 flex-shrink-0`}>Agent:</span>
      <span className={`${sizeClasses.text} font-medium text-navy truncate`}>
        {agentName}
      </span>
      {brokerName && (
        <>
          <span className={`${sizeClasses.text} text-gray-400`}>•</span>
          <span className={`${sizeClasses.text} text-gray-600 truncate`}>
            {brokerName}
          </span>
        </>
      )}
    </div>
  );
}
