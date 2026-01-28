'use client';

export default function LoginPage() {
  const handleGitHubLogin = () => {
    // In a real implementation, this would redirect to GitHub OAuth
    window.location.href = '/api/auth/github';
  };

  return (
    <div style={{ maxWidth: 400, margin: '48px auto', padding: 24 }}>
      <h1>AI Coach Login</h1>
      <p>Sign in with GitHub to access your AI coaching session.</p>
      <button 
        onClick={handleGitHubLogin}
        style={{ 
          padding: '12px 24px',
          background: '#24292f',
          color: 'white',
          border: 'none',
          borderRadius: 6,
          cursor: 'pointer',
          fontSize: 16,
          marginTop: 16
        }}
      >
        Sign in with GitHub
      </button>
    </div>
  );
}