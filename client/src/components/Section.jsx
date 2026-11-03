export default function Section({ id, title, children, className = '' }) {
  return (
    <section id={id} className={`section ${className}`} aria-labelledby={`${id}-h`}>
      <div className="wrap">
        <h2 className="h2" id={`${id}-h`}>{title}</h2>
        {children}
      </div>
    </section>
  );
}
