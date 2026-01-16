export function Footer() {
  return (
    <footer style={{ 
      textAlign: 'center', 
      padding: '2.5rem 1.5rem', 
      color: '#6b5c4c',
      fontSize: '0.9rem',
      lineHeight: '1.8'
    }}>
      <p style={{ margin: '0 0 0.25rem 0', fontWeight: 500, color: '#3d3530' }}>
        Mio - The home for your personal AI.
      </p>
      <p style={{ margin: '0 0 1rem 0' }}>
        Part of{' '}
        <a 
          href="https://andea.ai" 
          target="_blank" 
          rel="noopener noreferrer"
          style={{ color: '#c17f59', textDecoration: 'underline', textUnderlineOffset: '2px' }}
        >
          Andea
        </a>
        {' '}- The personal AI company.
      </p>
      <p style={{ margin: 0, fontSize: '0.85rem', color: '#8a7a6a' }}>
        © 2025 Andea
        {' · '}
        <a 
          href="/terms" 
          style={{ color: '#8a7a6a', textDecoration: 'underline', textUnderlineOffset: '2px' }}
        >
          Terms
        </a>
        {' · '}
        <a 
          href="/privacy" 
          style={{ color: '#8a7a6a', textDecoration: 'underline', textUnderlineOffset: '2px' }}
        >
          Privacy
        </a>
      </p>
    </footer>
  );
}
