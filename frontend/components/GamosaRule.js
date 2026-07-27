export default function GamosaRule({ className = "" }) {
  return (
    <div className={`gamosa-rule ${className}`} aria-hidden="true">
      {Array.from({ length: 40 }).map((_, i) => (
        <span key={i} />
      ))}
    </div>
  );
}
