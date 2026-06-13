export default function FounderCard() {
  return (
    <div className="founder-card">
      <img
        className="founder-photo"
        src="/damien.png"
        alt="Damien Schuster, founder of LocalScholarships.org"
        width={96}
        height={96}
      />
      <div className="founder-body">
        <p className="founder-name">Damien Schuster</p>
        <p className="founder-role">Founder, LocalScholarships.org</p>
        <p className="founder-bio">
          Education-access advocate building a free, verified directory of local
          and community-foundation scholarships across all 50 states.
        </p>
        <a
          className="founder-linkedin"
          href="https://www.linkedin.com/in/damienschuster/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Damien Schuster on LinkedIn"
        >
          <svg className="founder-linkedin-icon" viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
            <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.22.79 24 1.77 24h20.45c.98 0 1.78-.78 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" />
          </svg>
          <span>Connect on LinkedIn</span>
        </a>
      </div>
      <style>{`
        .founder-card { display: flex; gap: 20px; align-items: flex-start; max-width: 640px; padding: 24px; border: 1px solid #e6e8eb; border-radius: 14px; background: #fff; box-shadow: 0 1px 3px rgba(16,24,40,0.06); }
        .founder-photo { flex: 0 0 auto; width: 96px; height: 96px; border-radius: 50%; object-fit: cover; border: 2px solid #eef0f2; }
        .founder-body { min-width: 0; }
        .founder-name { margin: 0; font-size: 1.15rem; font-weight: 700; color: #14213d; line-height: 1.2; }
        .founder-role { margin: 2px 0 10px; font-size: 0.9rem; font-weight: 600; color: #5b6472; }
        .founder-bio { margin: 0 0 16px; font-size: 0.95rem; line-height: 1.5; color: #3a4150; }
        .founder-linkedin { display: inline-flex; align-items: center; gap: 8px; padding: 9px 16px; font-size: 0.9rem; font-weight: 600; color: #fff; background: #0a66c2; border-radius: 8px; text-decoration: none; transition: background 0.15s ease; }
        .founder-linkedin:hover { background: #084d92; }
        .founder-linkedin:focus-visible { outline: 2px solid #0a66c2; outline-offset: 2px; }
        .founder-linkedin-icon { display: block; }
        @media (max-width: 520px) { .founder-card { flex-direction: column; align-items: center; text-align: center; } .founder-linkedin { margin: 0 auto; } }
        @media (prefers-reduced-motion: reduce) { .founder-linkedin { transition: none; } }
      `}</style>
    </div>
  );
}
