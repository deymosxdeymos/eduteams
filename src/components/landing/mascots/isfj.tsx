import { motion } from 'framer-motion';
import { blinkTransition, legSwayLeft, legSwayRight, spinMedium } from './animation-config';

export function IsfJMascot({ className }: { className?: string }) {
  return (
    <svg
      width="325"
      height="255"
      viewBox="0 0 325 255"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Left leg */}
      <motion.g
        {...legSwayLeft}
        style={{ transformOrigin: '131px 215px' }}
      >
        <path
          d="M131.596 215.476C137.187 217.971 143.385 224.941 143.385 224.941C142.038 227.255 139.102 238.007 140.263 242.781C141.424 247.554 139.766 252.341 138.964 253.566L103.211 239.966C102.714 224.357 125.429 238.106 125.001 237.37C124.663 233.316 126.953 221.489 131.596 215.476Z"
          fill="black"
        />
      </motion.g>
      {/* Body */}
      <path
        d="M105.646 64.5C96.9352 55.2087 106.646 43 119.509 45.2793C106.201 -12.7913 208.046 14.7579 220.144 16.5C229.823 17.8937 228.169 6.00063 225.144 0C249.341 7.43304 243.922 35.6009 239.889 50.5057C239.889 50.5057 252.592 45.2793 262.271 54.5706C271.95 63.8619 271.799 81.4767 268.699 87.6709C276.275 89.1233 291.56 119.734 287.143 144C276.085 204.758 246.644 210 236.864 213.104C201.053 256.308 150.645 239.5 132.818 221.814C84.1464 230.5 75.9549 197.037 75.35 180.584C68.4942 181.358 49.647 175.5 48.1285 150.968C46.5162 124.918 60.4287 114.383 69.9059 112.061C62.6468 111.093 51.0415 104.014 60.6468 80C67.6467 62.5 90.7248 58.3058 105.646 64.5Z"
        fill="url(#isfj_paint0)"
      />
      {/* Right leg */}
      <motion.g
        {...legSwayRight}
        style={{ transformOrigin: '209px 210px' }}
      >
        <path
          d="M208.741 244C204.745 234.006 204.924 222.237 205.341 216.685C205.341 214.503 206.839 210.022 212.835 209.546C220.328 208.951 220.953 214.305 220.953 216.685C220.953 219.064 222.826 243.456 227.822 245.835C231.819 247.739 232.402 252.577 232.194 254.164H200.345C200.345 246.549 205.827 243.603 208.741 244Z"
          fill="black"
        />
      </motion.g>
      {/* Both eyes - clipped by animated eyelid rect */}
      <g clipPath="url(#isfj_eyeClip)">
        {/* Left eye */}
        <path
          d="M112.061 96.5053C115.405 95.9339 118.494 97.9488 120.465 100.709C121.735 102.488 123.193 104.244 124.826 105.932C130.165 111.452 136.283 115.12 141.652 116.463C146.196 117.599 151.458 119.68 152.354 124.276C152.778 126.452 153 128.701 153 131V135C153 154.33 137.33 170 118 170C98.6702 170 82.9992 154.33 82.999 135V131C82.999 113.695 95.5596 99.3249 112.061 96.5053Z"
          fill="white"
        />
        <circle cx="123.526" cy="137.526" r="25.5263" fill="url(#isfj_paint1)" stroke="#0BA5EC" strokeWidth="2" />
        <circle cx="117.275" cy="131.115" r="13.5" fill="white" />
        {/* Right eye */}
        <path
          d="M222.233 96.0971C218.889 95.5256 215.8 97.5405 213.829 100.301C212.558 102.08 211.1 103.836 209.467 105.525C204.128 111.044 198.01 114.712 192.641 116.055C188.097 117.192 182.835 119.272 181.939 123.869C181.515 126.045 181.293 128.292 181.293 130.592V134.592C181.293 153.922 196.963 169.592 216.293 169.592C235.623 169.592 251.293 153.922 251.293 134.592V130.592C251.293 113.287 238.734 98.9173 222.233 96.0971Z"
          fill="white"
        />
        <circle cx="215.819" cy="138.526" r="25.5263" fill="url(#isfj_paint2)" stroke="#0BA5EC" strokeWidth="2" />
        <circle cx="209.568" cy="132.115" r="13.5" fill="white" />
      </g>
      {/* Bicycle frame */}
      <rect x="58.4824" y="177.185" width="16.2507" height="41.7773" transform="rotate(-17.3692 58.4824 177.185)" fill="#293056" />
      <path d="M27.7383 51.6765L48.6561 69.875L75.7685 156.554L61.8999 160.892L27.7383 51.6765Z" fill="url(#isfj_paint3)" />
      <path d="M27.7383 51.6765L20.9189 78.551L48.0313 165.23L61.8999 160.892L27.7383 51.6765Z" fill="#EAECF5" />
      <path d="M89.6357 152.215L93.9737 166.084L67.1854 177.794L61.8985 160.891L89.6357 152.215Z" fill="#363F72" />
      <path d="M34.1621 169.567L38.5001 183.436L67.1863 177.794L61.8993 160.891L34.1621 169.567Z" fill="#4E5BA6" />
      {/* Left wheel - spin */}
      <motion.g
        {...spinMedium}
        style={{ transformOrigin: '57.58px 196px' }}
      >
        <circle cx="57.5756" cy="196.001" r="16.5" transform="rotate(11.5169 57.5756 196.001)" fill="black" />
      </motion.g>
      {/* Sparkle */}
      <g filter="url(#isfj_filter0)">
        <path d="M19 71.0005C27.2104 74.1584 24 71.1584 27.079 68.0005C25.5 74.0005 26.5 73.5005 30.5 76.8426C25.3584 74.1857 22.8002 78.2212 22.116 80.1344C22.0791 80.2542 22.0404 80.3762 22 80.5005C22.0297 80.3908 22.0683 80.2677 22.116 80.1344C23.5807 75.3833 22.3368 74.0807 19 71.0005Z" fill="#FDFDFD" />
      </g>
      {/* Right wheel group - spin */}
      <motion.g
        {...spinMedium}
        style={{ transformOrigin: '270.5px 199.5px' }}
      >
        <circle cx="278.5" cy="184.5" r="16.5" fill="black" />
      </motion.g>
      {/* Right eye frame */}
      <path d="M216.559 81C243.873 81 265.514 102.023 265.514 127.352C265.514 152.68 243.873 173.704 216.559 173.704C189.244 173.704 167.604 152.68 167.604 127.352C167.604 102.023 189.244 81 216.559 81Z" stroke="#026AA2" strokeWidth="12" />
      {/* Cheek highlights */}
      <path d="M141.802 173.092C148.432 156.023 167.07 159.885 170.817 165.673C174.564 171.462 174.029 189.977 158.32 196.858C142.611 203.739 114.338 193.995 102.166 188.263C112.579 191.861 135.172 190.161 141.802 173.092Z" fill="#FAFAFF" />
      <path d="M198.955 167.281C189.28 151.588 171.644 158.51 169.023 164.836C166.402 171.162 170.344 189.299 187.078 193.443C203.812 197.587 229.847 183.26 240.773 175.579C231.185 180.865 208.63 182.974 198.955 167.281Z" fill="#FAFAFF" />
      {/* Antenna */}
      <path d="M262 141C265.052 148.19 274.324 159.152 287 145.477" stroke="#065986" strokeWidth="4" strokeLinecap="round" />
      {/* Right wheel decorative rings */}
      <circle cx="270.5" cy="199.5" r="38.5" transform="rotate(-37.6742 270.5 199.5)" fill="#3E4784" />
      <circle cx="270.499" cy="199.5" r="32.0833" transform="rotate(-37.6742 270.499 199.5)" fill="#4E5BA6" />
      <path d="M289.709 225.195C275.703 235.672 255.833 233.002 245.106 219.109C234.378 205.216 236.821 185.317 250.5 174.417L289.709 225.195Z" fill="url(#isfj_paint4)" />
      <circle cx="270.5" cy="199.5" r="10.9083" transform="rotate(-37.6742 270.5 199.5)" fill="#3E4784" />
      {/* Right sparkle */}
      <g filter="url(#isfj_filter1)">
        <path d="M280 169C288.21 172.158 285 169.158 288.079 166C286.5 172 287.5 171.5 291.5 174.842C286.358 172.185 283.8 176.221 283.116 178.134C283.079 178.254 283.04 178.376 283 178.5C283.03 178.39 283.068 178.267 283.116 178.134C284.581 173.383 283.337 172.08 280 169Z" fill="#FDFDFD" />
      </g>
      <defs>
        <clipPath id="isfj_eyeClip">
          <motion.rect
            x={70}
            width={195}
            animate={{
              y: [85, 85, 85, 85, 85, 175, 85, 85, 85, 175, 85],
              height: [95, 95, 95, 95, 95, 5, 95, 95, 95, 5, 95],
            }}
            transition={blinkTransition}
          />
        </clipPath>
        <filter id="isfj_filter0" x="16" y="65.0005" width="17.5" height="18.5" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
          <feOffset />
          <feGaussianBlur stdDeviation="1.5" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix type="matrix" values="0 0 0 0 0.8878 0 0 0 0 0.980769 0 0 0 0 0.183894 0 0 0 0.25 0" />
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow" />
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow" result="shape" />
        </filter>
        <filter id="isfj_filter1" x="277" y="163" width="17.5" height="18.5" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
          <feOffset />
          <feGaussianBlur stdDeviation="1.5" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix type="matrix" values="0 0 0 0 0.8878 0 0 0 0 0.980769 0 0 0 0 0.183894 0 0 0 0.25 0" />
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow" />
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow" result="shape" />
        </filter>
        <linearGradient id="isfj_paint0" x1="167.965" y1="0" x2="168" y2="248" gradientUnits="userSpaceOnUse">
          <stop stopColor="#82FFFF" />
          <stop offset="0.68397" stopColor="#7CD4FD" />
          <stop offset="1" stopColor="#D5F2FF" />
        </linearGradient>
        <linearGradient id="isfj_paint1" x1="122.275" y1="128.615" x2="122.275" y2="193.615" gradientUnits="userSpaceOnUse">
          <stop offset="0.0987639" stopColor="#1D1D1D" />
          <stop offset="1" stopColor="#0086C9" />
        </linearGradient>
        <linearGradient id="isfj_paint2" x1="214.568" y1="129.615" x2="214.568" y2="194.615" gradientUnits="userSpaceOnUse">
          <stop offset="0.0987639" stopColor="#1D1D1D" />
          <stop offset="1" stopColor="#0086C9" />
        </linearGradient>
        <linearGradient id="isfj_paint3" x1="34.6726" y1="49.5075" x2="68.8342" y2="158.723" gradientUnits="userSpaceOnUse">
          <stop stopColor="#C8DFE5" />
          <stop offset="1" stopColor="#9CA2C9" />
        </linearGradient>
        <linearGradient id="isfj_paint4" x1="238" y1="184.068" x2="276.002" y2="291" gradientUnits="userSpaceOnUse">
          <stop stopColor="#717BBC" />
          <stop offset="1" stopColor="#C37EEB" />
        </linearGradient>
      </defs>
    </svg>
  );
}
