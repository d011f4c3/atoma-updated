const verticalLines = Array.from({ length: 41 }, (_, index) => {
  const position = (index - 20) / 20;
  const x = Math.round(720 + 760 * (position * 0.82 + position ** 3 * 0.18));
  const bow = Math.round((720 - x) * 0.035);

  return `M${x} -40 C${x + bow} 230 ${x + bow} 670 ${x} 940`;
});

const horizontalLines = Array.from({ length: 21 }, (_, index) => {
  const y = index * 50 - 50;
  const depth = Math.round((450 - y) * 0.44);

  return `M-40 ${y} Q720 ${y + depth} 1480 ${y}`;
});

export function SpecimenField({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 1440 900"
      preserveAspectRatio="none"
      fill="none"
      stroke="currentColor"
      strokeWidth="0.75"
      aria-hidden="true"
      focusable="false"
    >
      <g opacity="0.1">
        {verticalLines.map((path, index) => (
          <path d={path} key={index} />
        ))}
      </g>
      <g opacity="0.13">
        {horizontalLines.map((path, index) => (
          <path d={path} key={index} />
        ))}
      </g>
      <g opacity="0.26">
        <path d="M48 450H1392" />
        <circle cx="48" cy="450" r="2" fill="currentColor" stroke="none" />
        <circle cx="1392" cy="450" r="2" fill="currentColor" stroke="none" />
      </g>
    </svg>
  );
}
