/**
 * Página PEX Index - Redireciona para Ranking
 */

import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function PexIndex() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/pex/ranking');
  }, [router]);

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#212529',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        textAlign: 'center',
        color: '#adb5bd',
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '4px solid #FF6600',
          borderTopColor: 'transparent',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 16px',
        }} />
        <p>Redirecionando...</p>
      </div>
      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
