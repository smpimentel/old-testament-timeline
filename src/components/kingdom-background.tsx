import { BG_ANCHOR_COMPENSATION } from '../lib/scale';

interface KingdomBackgroundProps {
  yearToX: (year: number) => number;
  pixelsPerYear: number;
  topOffset: number;
}

const FIGMA_BASE_PX_PER_YEAR = 4;
const FIGMA_VIEWBOX_WIDTH = 8962;
const FIGMA_VIEWBOX_HEIGHT = 816;
const EXILE_ANCHOR_YEAR = 586;
const FIGMA_EXILE_VIEWBOX_X = 8190;

/**
 * Renders the kingdoms foundation using the exact Figma-exported geometry.
 * Horizontal alignment is anchored at exile start (586 BC) so the chevron/split
 * placement tracks correctly against the timeline years.
 * BG_ANCHOR_COMPENSATION undoes the timeline shift so background stays in place.
 */
export function KingdomBackground({ yearToX, pixelsPerYear, topOffset }: KingdomBackgroundProps) {
  const scaleX = pixelsPerYear / FIGMA_BASE_PX_PER_YEAR;
  const exileX = yearToX(EXILE_ANCHOR_YEAR);
  const left = exileX - (FIGMA_EXILE_VIEWBOX_X * scaleX) - BG_ANCHOR_COMPENSATION;

  return (
    <svg
      className="absolute pointer-events-none"
      style={{ top: topOffset, left, opacity: 0.5 }}
      width={FIGMA_VIEWBOX_WIDTH * scaleX}
      height={FIGMA_VIEWBOX_HEIGHT}
      viewBox="0 0 8962 816"
      preserveAspectRatio="none"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g id="The Kingdoms">
        <g id="mainBody" filter="url(#filter0_d_kingdom)">
          <path
            id="Rectangle 33"
            d="M8 20C8 8.95429 16.9543 0 28 0H1358V800H28C16.9543 800 8 791.046 8 780V20Z"
            fill="url(#paint0_linear_kingdom)"
          />
          <path id="Rectangle 26" d="M4759 0H5019V800H4759V0Z" fill="url(#paint1_linear_kingdom)" />
          <path id="Rectangle 21" d="M2829 0H4419V800H2829V0Z" fill="#D0B474" />
          <path id="Rectangle 22" d="M4679 0H4759V800H4679V0Z" fill="#C4AB8A" />
          <path id="Rectangle 23" d="M1358 0H2569V800H1358V0Z" fill="#C7C5A4" />
          <path id="Rectangle 24" d="M2569 0H2829V800H2569V0Z" fill="url(#paint2_linear_kingdom)" />
          <path id="Rectangle 25" d="M4419 0H4679V800H4419V0Z" fill="url(#paint3_linear_kingdom)" />
          <path id="Rectangle 18" d="M5019 0H6087V800H5019V0Z" fill="#C9C0A4" />
          <path id="Rectangle 19" d="M6087 0H6335V400V800H6087V0Z" fill="url(#paint4_linear_kingdom)" />
          <path
            id="Rectangle 1"
            d="M6335 0H6572H6622.92C6630.87 0 6638.06 4.70388 6641.24 11.9836L6807.49 391.984C6809.73 397.094 6809.73 402.906 6807.49 408.016L6641.24 788.016C6638.06 795.296 6630.87 800 6622.92 800H6335V0Z"
            fill="#C1C7AA"
          />
        </g>

        <g id="Rectangle 3" filter="url(#filter1_d_kingdom)">
          <path
            d="M6671.71 27.7703C6666.15 14.5864 6675.83 0 6690.14 0H7610C7621.05 0 7630 8.95431 7630 20V370C7630 381.046 7621.05 390 7610 390H6837.71C6829.67 390 6822.41 385.182 6819.28 377.77L6671.71 27.7703Z"
            fill="#ABC6C3"
          />
        </g>

        <g id="Rectangle 4" filter="url(#filter2_d_kingdom)">
          <path
            d="M6820.52 422.179C6823.66 414.795 6830.91 410 6838.93 410H8150C8161.05 410 8170 418.954 8170 430V780C8170 791.046 8161.05 800 8150 800H6690.23C6675.9 800 6666.22 785.37 6671.82 772.179L6820.52 422.179Z"
            fill="#EBCF88"
          />
        </g>

        <g id="Rectangle 9" filter="url(#filter3_d_kingdom)">
          <path
            d="M8190 430C8190 418.954 8198.95 410 8210 410H8362C8373.05 410 8382 418.954 8382 430V780C8382 791.046 8373.05 800 8362 800H8210C8198.95 800 8190 791.046 8190 780V430Z"
            fill="#B7AFA3"
          />
        </g>

        <g id="Rectangle 10" filter="url(#filter4_d_kingdom)">
          <path
            d="M8402 430C8402 418.954 8410.95 410 8422 410H8934C8945.05 410 8954 418.954 8954 430V780C8954 791.046 8945.05 800 8934 800H8422C8410.95 800 8402 791.046 8402 780V430Z"
            fill="#B7CCA9"
          />
        </g>

        <g id="label-israel">
          <rect x="6690" y="13" width="108" height="40" rx="27" fill="#F5EDD6" stroke="#ABC6C3" strokeWidth="2" />
          <text
            x="6744"
            y="33"
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
          <rect x="6690" y="747" width="108" height="40" rx="27" fill="#F5EDD6" stroke="#F0DEAF" strokeWidth="2" />
          <text
            x="6744"
            y="767"
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
        <filter id="filter0_d_kingdom" x="0" y="0" width="6817.17" height="816" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
          <feOffset dy="8" />
          <feGaussianBlur stdDeviation="4" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0" />
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_kingdom" />
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_kingdom" result="shape" />
        </filter>
        <filter id="filter1_d_kingdom" x="6662.12" y="0" width="975.883" height="406" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
          <feOffset dy="8" />
          <feGaussianBlur stdDeviation="4" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0" />
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_kingdom" />
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_kingdom" result="shape" />
        </filter>
        <filter id="filter2_d_kingdom" x="6662.21" y="410" width="1515.79" height="406" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
          <feOffset dy="8" />
          <feGaussianBlur stdDeviation="4" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0" />
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_kingdom" />
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_kingdom" result="shape" />
        </filter>
        <filter id="filter3_d_kingdom" x="8182" y="410" width="208" height="406" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
          <feOffset dy="8" />
          <feGaussianBlur stdDeviation="4" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0" />
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_kingdom" />
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_kingdom" result="shape" />
        </filter>
        <filter id="filter4_d_kingdom" x="8394" y="410" width="568" height="406" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
          <feOffset dy="8" />
          <feGaussianBlur stdDeviation="4" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0" />
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_kingdom" />
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_kingdom" result="shape" />
        </filter>
        <linearGradient id="paint0_linear_kingdom" x1="-434.595" y1="400" x2="1358" y2="400" gradientUnits="userSpaceOnUse">
          <stop offset="0.759615" stopColor="#F5EDD6" />
          <stop offset="0.975962" stopColor="#C7C5A4" />
        </linearGradient>
        <linearGradient id="paint1_linear_kingdom" x1="4759" y1="398.545" x2="5019" y2="398.545" gradientUnits="userSpaceOnUse">
          <stop stopColor="#C4AB8A" />
          <stop offset="1" stopColor="#B5AD8E" stopOpacity="0.69" />
        </linearGradient>
        <linearGradient id="paint2_linear_kingdom" x1="2569" y1="398.545" x2="2829" y2="398.545" gradientUnits="userSpaceOnUse">
          <stop stopColor="#C7C5A4" />
          <stop offset="1" stopColor="#D0B474" />
        </linearGradient>
        <linearGradient id="paint3_linear_kingdom" x1="4419" y1="398.545" x2="4679" y2="398.545" gradientUnits="userSpaceOnUse">
          <stop stopColor="#D0B474" />
          <stop offset="1" stopColor="#C4AB8A" />
        </linearGradient>
        <linearGradient id="paint4_linear_kingdom" x1="6087" y1="400" x2="6335" y2="400" gradientUnits="userSpaceOnUse">
          <stop stopColor="#C9C0A4" />
          <stop offset="1" stopColor="#C1C7AA" />
        </linearGradient>
      </defs>
    </svg>
  );
}
