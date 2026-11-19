export type InstrumentStyle = "forceps" | "scissors" | "needle" | "artery" | "retractor";

interface InstrumentArtProps {
  style: InstrumentStyle;
  className?: string;
}

export function InstrumentArt({ style, className = "" }: InstrumentArtProps) {
  const isScissors = style === "scissors";
  const isLooped = style === "needle" || style === "artery";
  const isRetractor = style === "retractor";

  return (
    <svg
      className={`instrument-art ${className}`}
      viewBox="0 0 360 220"
      role="img"
      aria-label={`${style.replace("-", " ")} surgical instrument illustration`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={`steel-${style}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f8ffff" />
          <stop offset=".24" stopColor="#a8bdc5" />
          <stop offset=".44" stopColor="#f4fbfc" />
          <stop offset=".68" stopColor="#758f9b" />
          <stop offset="1" stopColor="#dce8eb" />
        </linearGradient>
        <linearGradient id={`handle-${style}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#d9e8e8" />
          <stop offset=".5" stopColor="#6d8992" />
          <stop offset="1" stopColor="#eef5f5" />
        </linearGradient>
        <filter id={`shadow-${style}`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
          <feOffset dy="4" />
          <feComponentTransfer>
            <feFuncA type="linear" slope=".28" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g
        fill="none"
        stroke={`url(#steel-${style})`}
        strokeLinecap="round"
        strokeLinejoin="round"
        filter={`url(#shadow-${style})`}
        strokeWidth={isRetractor ? "10" : "7"}
      >
        {isScissors ? (
          <>
            <path d="M66 166 271 41" />
            <path d="M76 46 281 169" />
            <path d="m190 89 78-49q12-7 21 3t-2 20l-84 51" />
            <path d="m165 123-75 48q-12 8-21-3t3-20l81-50" />
            <ellipse cx="54" cy="181" rx="24" ry="17" transform="rotate(-33 54 181)" stroke={`url(#handle-${style})`} />
            <ellipse cx="294" cy="184" rx="24" ry="17" transform="rotate(33 294 184)" stroke={`url(#handle-${style})`} />
          </>
        ) : isRetractor ? (
          <>
            <path d="M62 112h220" />
            <path d="M77 91v42m190-42v42" />
            <path d="M77 91q-17-23-32-14v70q16 8 32-14m190-42q17-23 32-14v70q-16 8-32-14" />
            <path d="M148 101v22m64-22v22" strokeWidth="4" />
          </>
        ) : (
          <>
            <path d={isLooped ? "M70 171 267 48" : "M74 174 278 46"} />
            <path d={isLooped ? "M72 48 270 171" : "M78 47 282 174"} />
            {isLooped ? (
              <>
                <ellipse cx="50" cy="184" rx="23" ry="16" transform="rotate(-32 50 184)" stroke={`url(#handle-${style})`} />
                <ellipse cx="294" cy="35" rx="23" ry="16" transform="rotate(-32 294 35)" stroke={`url(#handle-${style})`} />
                <path d={style === "needle" ? "m260 49 23-19" : "m257 50 31-19"} strokeWidth="5" />
              </>
            ) : (
              <>
                <path d="M74 174 38 196m40-25-38 17" strokeWidth="5" />
                <path d="M278 46 313 24m-39 25 37-17" strokeWidth="5" />
              </>
            )}
            <circle cx="176" cy="109" r="11" fill="#b9c9cc" stroke="#718992" strokeWidth="4" />
            <path d="M159 99 192 119M158 119l34-20" strokeWidth="3" opacity=".8" />
          </>
        )}
      </g>
      <path
        d={isScissors ? "M88 51 174 103" : "M100 58 175 103"}
        stroke="#fff"
        strokeLinecap="round"
        strokeWidth="2"
        opacity=".8"
      />
    </svg>
  );
}
