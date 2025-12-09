'use client';

import { useRouter } from 'next/router';
import { useEffect, useState, ReactNode } from 'react';
import type { UserPermissions, PermissionContext } from '@/types/permissions.types';

export function withAuth(Component: React.ComponentType<any>) {
  return function ProtectedComponent(props: any) {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

      if (!token) {
        router.push('/login');
      } else {
        setIsAuthenticated(true);
      }

      setIsLoading(false);
    }, [router]);

    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#212529' }}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 mx-auto" style={{ borderColor: '#FF6600' }}></div>
            <p className="mt-4" style={{ color: '#adb5bd' }}>Carregando...</p>
          </div>
        </div>
      );
    }

    if (!isAuthenticated) {
      return null;
    }

    return <Component {...props} />;
  };
}

export function withAuthAndFranchiser(Component: React.ComponentType<any>) {
  return function ProtectedComponent(props: any) {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isFranchiser, setIsFranchiser] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const accessLevel = typeof window !== 'undefined' ? localStorage.getItem('accessLevel') : null;

      if (!token) {
        router.push('/login');
      } else if (accessLevel === '0') {
        // Franqueado não tem acesso - redireciona
        router.push('/resultados');
      } else if (accessLevel === '1') {
        // Franqueadora tem acesso
        setIsAuthenticated(true);
        setIsFranchiser(true);
      }

      setIsLoading(false);
    }, [router]);

    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#212529' }}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 mx-auto" style={{ borderColor: '#FF6600' }}></div>
            <p className="mt-4" style={{ color: '#adb5bd' }}>Carregando...</p>
          </div>
        </div>
      );
    }

    if (!isAuthenticated || !isFranchiser) {
      return null;
    }

    return <Component {...props} />;
  };
}

export function useAuth() {
  const [user, setUser] = useState<UserPermissions | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const username = localStorage.getItem('username');
      const firstName = localStorage.getItem('firstName');
      const accessLevelStr = localStorage.getItem('accessLevel');
      const unitNamesStr = localStorage.getItem('unitNames');
      
      if (username && firstName && accessLevelStr) {
        const accessLevel = parseInt(accessLevelStr, 10) as 0 | 1;
        const unitNames = unitNamesStr ? JSON.parse(unitNamesStr) : undefined;
        setUser({
          username,
          firstName,
          accessLevel,
          unitNames
        });
      }
    }
    setIsLoading(false);
  }, []);

  const logout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('username');
      localStorage.removeItem('firstName');
      localStorage.removeItem('accessLevel');
      localStorage.removeItem('unitNames');
      window.location.href = '/login';
    }
  };

  return { user, logout, isLoading };
}

export function usePermissions(): PermissionContext | null {
  const { user, isLoading } = useAuth();

  if (isLoading || !user) {
    return null;
  }

  return {
    user,
    isFranchisee: user.accessLevel === 0,
    isFranchiser: user.accessLevel === 1,
    canViewAllUnits: user.accessLevel === 1
  };
}
