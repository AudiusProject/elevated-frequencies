export function Logo({ size = 50 }: { size?: number }) {
  const w = size * (44 / 54)
  return (
    <svg width={w} height={size} viewBox="0 0 44 54" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="22" cy="14" r="13"   stroke="white" strokeWidth="0.85" fill="none"/>
      <circle cx="22" cy="14" r="10.5" stroke="white" strokeWidth="0.7"  fill="none"/>
      <circle cx="22" cy="14" r="8"    stroke="white" strokeWidth="0.7"  fill="none"/>
      <circle cx="22" cy="14" r="5.5"  stroke="white" strokeWidth="0.75" fill="none"/>
      <circle cx="22" cy="14" r="3"    stroke="white" strokeWidth="0.85" fill="none"/>
      <circle cx="22" cy="14" r="1.1"  fill="white"/>
      <ellipse cx="22" cy="28.5" rx="5.5" ry="3.2" stroke="white" strokeWidth="0.85" fill="none"/>
      <circle  cx="22" cy="28.5" r="1.5" fill="white"/>
      <circle cx="22" cy="43" r="10.5" stroke="white" strokeWidth="0.85" fill="none"/>
      <circle cx="22" cy="43" r="8"    stroke="white" strokeWidth="0.7"  fill="none"/>
      <circle cx="22" cy="43" r="5.5"  stroke="white" strokeWidth="0.7"  fill="none"/>
      <circle cx="22" cy="43" r="3"    stroke="white" strokeWidth="0.75" fill="none"/>
      <circle cx="22" cy="43" r="1.1"  fill="white"/>
    </svg>
  )
}
