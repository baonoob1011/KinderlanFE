import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/button';

/**
 * Example component demonstrating the new authentication system
 * This shows how to use the useAuth hook in your components
 */
export const AuthStatusExample: React.FC = () => {
  const { 
    isAuthenticated, 
    isLoading, 
    userRole, 
    userEmail, 
    isTokenExpired, 
    logout,
    tokenInfo
  } = useAuth();

  if (isLoading) {
    return <div className="p-4">Loading authentication status...</div>;
  }

  return (
    <div className="p-6 border rounded-lg space-y-4">
      <h3 className="text-lg font-semibold">Authentication Status</h3>
      
      <div className="grid gap-2">
        <div>
          <strong>Is Authenticated:</strong>{' '}
          <span className={isAuthenticated ? 'text-green-600' : 'text-red-600'}>
            {isAuthenticated ? '✓ Yes' : '✗ No'}
          </span>
        </div>
        
        <div>
          <strong>Token Expired:</strong>{' '}
          <span className={isTokenExpired ? 'text-red-600' : 'text-green-600'}>
            {isTokenExpired ? '✗ Yes' : '✓ No'}
          </span>
        </div>
        
        <div>
          <strong>User Email:</strong> {userEmail || 'Not available'}
        </div>
        
        <div>
          <strong>User Role:</strong> {userRole || 'Not available'}
        </div>
      </div>

      {/* Development Info */}
      {process.env.NODE_ENV === 'development' && tokenInfo && (
        <div className="mt-4 p-3 bg-gray-100 rounded text-sm">
          <strong>Token Debug Info:</strong>
          <pre className="mt-2 text-xs overflow-auto">
            {JSON.stringify(tokenInfo, null, 2)}
          </pre>
        </div>
      )}

      {/* Logout Button */}
      {isAuthenticated && (
        <Button onClick={logout} variant="outline" className="mt-4">
          Logout
        </Button>
      )}
    </div>
  );
};

export default AuthStatusExample;