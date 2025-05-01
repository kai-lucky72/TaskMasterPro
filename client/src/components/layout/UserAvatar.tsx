import { User } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface UserAvatarProps {
  user?: User;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const UserAvatar = ({ user, size = 'md', className = '' }: UserAvatarProps) => {
  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
  };

  // Get initials from user's name
  const getInitials = () => {
    if (!user) return '?';
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
  };

  // Get background color based on user role
  const getBgColor = () => {
    if (!user) return 'bg-gray-400';

    switch(user.role) {
      case 'admin':
        return 'bg-purple-500';
      case 'manager':
        return 'bg-blue-500';
      case 'sales_staff':
        return 'bg-green-500';
      case 'team_leader':
        return 'bg-amber-500';
      case 'individual_agent':
      case 'sales_agent':
        return 'bg-sky-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <Avatar className={`${sizeClasses[size]} ${className}`}>
      {/* If we had user profile images, they would go here */}
      <AvatarImage src="" alt={user ? `${user.firstName} ${user.lastName}` : 'User'} />
      <AvatarFallback className={`${getBgColor()} text-white`}>
        {getInitials()}
      </AvatarFallback>
    </Avatar>
  );
};

export default UserAvatar;
