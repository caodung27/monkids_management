import { useAuth } from '@/contexts/AuthContext';

export const usePermissions = () => {
  const { user } = useAuth();

  const canEdit = () => {
    return user?.role === 'ADMIN';
  };

  const canDelete = () => {
    return user?.role === 'ADMIN';
  };

  const canPrint = () => {
    return ['ADMIN', 'USER', 'TEACHER'].includes(user?.role || '');
  };

  const canViewStudents = () => {
    return ['ADMIN', 'USER'].includes(user?.role || '');
  };

  const canViewTeachers = () => {
    return ['ADMIN', 'TEACHER'].includes(user?.role || '');
  };

  const canViewAttendance = () => {
    return user?.role === 'ADMIN';
  };

  const canViewAccounts = () => {
    return user?.role === 'ADMIN';
  };

  return {
    canEdit,
    canDelete,
    canPrint,
    canViewStudents,
    canViewTeachers,
    canViewAttendance,
    canViewAccounts,
  };
}; 