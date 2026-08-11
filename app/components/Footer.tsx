export function Footer() {
  return (
    <footer className="border-t border-tsu-card-border mt-16">
      <div className="max-w-4xl mx-auto px-6 py-8 text-center space-y-1.5">
        <p className="text-md text-tsu-text-muted">
          &copy; {new Date().getFullYear()} Taraba State University &middot; Office of Postgraduate
          Studies &middot; Jalingo, Taraba State
        </p>
        <p className="text-md text-tsu-text-muted">
          &copy; {new Date().getFullYear()} TSU Digital Research Repository. All rights reserved.
        </p>
        <p className="text-md text-tsu-text-muted">
          <a
            href="https://www.kmfenterprise.ng"
            target="_blank"
            rel="noopener noreferrer"
            className="text-tsu-success-text hover:text-tsu-text-secondary transition-colors"
          >
            Built and Maintained by KMFenterprise
          </a>
        </p>
      </div>
    </footer>
  );
}