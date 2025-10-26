export interface UserAuthDisplayProps {
  isAuthenticated: boolean;
  user: { name: string; email: string } | null;
  onLogin?: () => void;
}
