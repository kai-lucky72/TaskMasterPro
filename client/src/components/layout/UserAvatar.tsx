import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, AuthUser } from "@/types";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  user: User | AuthUser;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function UserAvatar({ user, size = "md", className }: UserAvatarProps) {
  // Get initials from first and last name
  const getInitials = () => {
    if (!user) return "??";
    return `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase();
  };

  // Generate a color based on user role
  const getRoleColor = () => {
    switch (user.role) {
      case "admin":
        return "bg-blue-100 text-blue-600";
      case "manager":
        return "bg-indigo-100 text-indigo-600";
      case "sales_staff":
        return "bg-green-100 text-green-600";
      case "team_leader":
        return "bg-amber-100 text-amber-600";
      case "individual_agent":
      case "sales_agent":
        return "bg-orange-100 text-orange-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  // Determine avatar size
  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base"
  };

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      <AvatarFallback className={getRoleColor()}>
        {getInitials()}
      </AvatarFallback>
    </Avatar>
  );
}
