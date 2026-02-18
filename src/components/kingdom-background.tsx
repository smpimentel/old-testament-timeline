interface KingdomBackgroundProps {
  yearToX: (year: number) => number;
  pixelsPerYear: number;
  trackHeight: number;
  topOffset: number;
}

const FIGMA_BASE_PX_PER_YEAR = 4;
const FIGMA_BODY_HEIGHT = 800;
const FIGMA_VIEWBOX_WIDTH = 9072;
const FIGMA_VIEWBOX_HEIGHT = 816;
const EXILE_ANCHOR_YEAR = 586;
const FIGMA_EXILE_VIEWBOX_X = 8300;

/**
 * Renders the kingdoms foundation using the exact Figma-exported geometry.
 * Horizontal alignment is anchored at exile start (586 BC) so the chevron/split
 * placement tracks correctly against the timeline years.
 */
export function KingdomBackground({ yearToX, pixelsPerYear, trackHeight, topOffset }: KingdomBackgroundProps) {
  const scaleX = pixelsPerYear / FIGMA_BASE_PX_PER_YEAR;
  const scaleY = trackHeight / FIGMA_BODY_HEIGHT;
  const exileX = yearToX(EXILE_ANCHOR_YEAR);
  const left = exileX - (FIGMA_EXILE_VIEWBOX_X * scaleX);

  return (
    <svg
      className="absolute pointer-events-none"
      style={{ top: topOffset, left }}
      width={FIGMA_VIEWBOX_WIDTH * scaleX}
      height={FIGMA_VIEWBOX_HEIGHT * scaleY}
      viewBox="0 0 9072 816"
      preserveAspectRatio="none"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g id="The Kingdoms">
        <g id="mainBody" filter="url(#filter0_d_kingdom)">
          <path
            id="Rectangle 33"
            d="M8 20C8 8.95429 16.9543 0 28 0H1588V800H28C16.9543 800 8 791.046 8 780V20Z"
            fill="url(#paint0_linear_kingdom)"
          />
          <path id="Rectangle 26" d="M4848 0H5108V800H4848V0Z" fill="url(#paint1_linear_kingdom)" />
          <path id="Rectangle 21" d="M2918 0H4508V800H2918V0Z" fill="#D0B474" />
          <path id="Rectangle 22" d="M4768 0H4848V800H4768V0Z" fill="#C4AB8A" />
          <path id="Rectangle 23" d="M1588 0H2658V800H1588V0Z" fill="#C7C5A4" />
          <path id="Rectangle 24" d="M2658 0H2918V800H2658V0Z" fill="url(#paint2_linear_kingdom)" />
          <path id="Rectangle 25" d="M4508 0H4768V800H4508V0Z" fill="url(#paint3_linear_kingdom)" />
          <path id="Rectangle 18" d="M5108 0H6176V800H5108V0Z" fill="#C9C0A4" />
          <path id="Rectangle 19" d="M6176 0H6424V400V800H6176V0Z" fill="url(#paint4_linear_kingdom)" />
          <path
            id="Rectangle 1"
            d="M6424 0H6661H6711.92C6719.87 0 6727.06 4.70388 6730.24 11.9836L6896.49 391.984C6898.73 397.094 6898.73 402.906 6896.49 408.016L6730.24 788.016C6727.06 795.296 6719.87 800 6711.92 800H6424V0Z"
            fill="#C1C7AA"
          />
        </g>

        <g id="Rectangle 3" filter="url(#filter1_d_kingdom)">
          <path
            d="M6761.02 27.9125C6755.34 14.711 6765.02 0 6779.39 0H7720C7731.05 0 7740 8.95431 7740 20V370C7740 381.046 7731.05 390 7720 390H6930.16C6922.17 390 6914.95 385.248 6911.79 377.912L6761.02 27.9125Z"
            fill="#ABC6C3"
          />
        </g>

        <g id="Rectangle 4" filter="url(#filter2_d_kingdom)">
          <path
            d="M6911.79 422.088C6914.95 414.752 6922.17 410 6930.16 410H8260C8271.05 410 8280 418.954 8280 430V780C8280 791.046 8271.05 800 8260 800H6779.39C6765.02 800 6755.34 785.289 6761.02 772.088L6911.79 422.088Z"
            fill="#EBCF88"
          />
        </g>

        <g id="Rectangle 9" filter="url(#filter3_d_kingdom)">
          <rect x="8300" y="410" width="192" height="390" rx="20" fill="#B7AFA3" />
        </g>

        <g id="Rectangle 10" filter="url(#filter4_d_kingdom)">
          <rect x="8512" y="410" width="552" height="390" rx="20" fill="#B7CCA9" />
        </g>

        <g id="label-israel">
          <rect x="6779" y="13" width="106" height="38" rx="19" fill="#F5EDD6" stroke="#ABC6C3" strokeWidth="2" />
          <text
            x="6832"
            y="32"
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#6B5D3E"
            fontFamily="Inter, 'Source Sans 3', sans-serif"
            fontWeight="700"
            fontSize="22"
          >
            ISRAEL
          </text>
        </g>

        <g id="label-judah">
          <rect x="6779" y="747" width="106" height="38" rx="19" fill="#F5EDD6" stroke="#F0DEAF" strokeWidth="2" />
          <text
            x="6832"
            y="766"
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#6B5D3E"
            fontFamily="Inter, 'Source Sans 3', sans-serif"
            fontWeight="700"
            fontSize="22"
          >
            JUDAH
          </text>
        </g>
      </g>

      <defs>
        <filter id="filter0_d_kingdom" x="0" y="0" width="6906.17" height="816" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
          <feOffset dy="8" />
          <feGaussianBlur stdDeviation="4" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0" />
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_kingdom" />
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_kingdom" result="shape" />
        </filter>
        <filter id="filter1_d_kingdom" x="6751.37" y="0" width="996.631" height="406" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
          <feOffset dy="8" />
          <feGaussianBlur stdDeviation="4" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0" />
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_kingdom" />
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_kingdom" result="shape" />
        </filter>
        <filter id="filter2_d_kingdom" x="6751.37" y="410" width="1536.63" height="406" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
          <feOffset dy="8" />
          <feGaussianBlur stdDeviation="4" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0" />
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_kingdom" />
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_kingdom" result="shape" />
        </filter>
        <filter id="filter3_d_kingdom" x="8292" y="410" width="208" height="406" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
          <feOffset dy="8" />
          <feGaussianBlur stdDeviation="4" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0" />
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_kingdom" />
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_kingdom" result="shape" />
        </filter>
        <filter id="filter4_d_kingdom" x="8504" y="410" width="568" height="406" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
          <feOffset dy="8" />
          <feGaussianBlur stdDeviation="4" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0" />
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_kingdom" />
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_kingdom" result="shape" />
        </filter>
        <linearGradient id="paint0_linear_kingdom" x1="-510" y1="400" x2="1588" y2="400" gradientUnits="userSpaceOnUse">
          <stop offset="0.759615" stopColor="#F5EDD6" />
          <stop offset="0.975962" stopColor="#C7C5A4" />
        </linearGradient>
        <linearGradient id="paint1_linear_kingdom" x1="4848" y1="398.545" x2="5108" y2="398.545" gradientUnits="userSpaceOnUse">
          <stop stopColor="#C4AB8A" />
          <stop offset="1" stopColor="#B5AD8E" stopOpacity="0.69" />
        </linearGradient>
        <linearGradient id="paint2_linear_kingdom" x1="2658" y1="398.545" x2="2918" y2="398.545" gradientUnits="userSpaceOnUse">
          <stop stopColor="#C7C5A4" />
          <stop offset="1" stopColor="#D0B474" />
        </linearGradient>
        <linearGradient id="paint3_linear_kingdom" x1="4508" y1="398.545" x2="4768" y2="398.545" gradientUnits="userSpaceOnUse">
          <stop stopColor="#D0B474" />
          <stop offset="1" stopColor="#C4AB8A" />
        </linearGradient>
        <linearGradient id="paint4_linear_kingdom" x1="6176" y1="400" x2="6424" y2="400" gradientUnits="userSpaceOnUse">
          <stop stopColor="#C9C0A4" />
          <stop offset="1" stopColor="#C1C7AA" />
        </linearGradient>
      </defs>
    </svg>
  );
}
