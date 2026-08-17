export function Header() {
  return (
    <header>
      <span className="brand">
        <svg className="plumbob" viewBox="0 0 20 30" aria-hidden="true">
          <path d="M10 0 L4 11 L10 15 L16 11 Z" fill="#7fe04f" />
          <path d="M4 11 L10 15 L10 30 Z" fill="#3fa61f" />
          <path d="M16 11 L10 15 L10 30 Z" fill="#57c22e" />
        </svg>
        <span className="ttl">
          <h1>The Sims 4 — Dynasty Whiteboard</h1>
          <span className="sub">
            Households + real family trees pre-loaded. YOU draw the pairings.
            Drag tags · scroll to zoom · Connect to link · Save often.
          </span>
        </span>
      </span>
    </header>
  );
}
