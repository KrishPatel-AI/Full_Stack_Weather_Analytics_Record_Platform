export default function Footer() {
  return (
    <footer className="mt-10 border-t border-border pt-4 text-xs text-muted">
      <details>
        <summary className="inline-block cursor-pointer select-none text-muted transition-colors hover:text-ink">
          About this project
        </summary>
        <div className="mt-2 max-w-2xl leading-relaxed">
          <p className="font-medium text-ink">Krish Patel — AI Engineer Intern Candidate, Cohort #10</p>
          <p className="mt-1">
            PM Accelerator is a US-based company with global reach, specializing in AI learning and product
            development. It features mentors from Google, Meta, Apple, and Nvidia, and runs a hands-on AI PM
            Bootcamp that gives aspiring AI professionals real-world project experience.
          </p>
        </div>
      </details>
    </footer>
  );
}
