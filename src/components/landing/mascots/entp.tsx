import { motion } from "framer-motion";
import { armSwayRight, legSwayLeft, spinSlow } from "./animation-config";

export function EntPMascot({ className }: { className?: string }) {
  return (
    <svg
      width="303"
      height="254"
      viewBox="0 0 303 254"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Left leg */}
      <motion.g {...legSwayLeft} style={{ transformOrigin: "129px 228px" }}>
        <path
          d="M121.488 227.323L136.362 229.702C135.767 232.28 135.172 238.507 137.552 242.79C139.932 247.074 139.734 252.111 139.337 253.499H111.373C106.613 238.626 122.678 242.195 122.083 241.601C120.655 237.793 121.091 230.496 121.488 227.323Z"
          fill="black"
        />
      </motion.g>
      {/* Body */}
      <path
        d="M94.0003 38.4094C99.8715 40.0775 102.365 48.1182 102.608 53.8397C103.756 37.511 113.396 9.09336 127 9.09336C136.902 9.09336 140.427 17.8121 140.489 25.5189C140.915 14.0997 146.611 -1.34653 161.5 0.0938326C177 1.59328 177.734 25.7348 177 38.4094C178.651 26.9024 181.699 10.9706 196.043 13.8934C214.203 17.5936 215.033 46.9176 216.5 61.5936C218.701 52.0876 222 41.2704 234.564 43.4122C242 44.6798 260.852 62.042 257 143.094C253.148 224.145 173.481 233.033 152.019 234.034C130.558 235.035 54.6164 224.028 48.5631 152.983C42.5098 81.9372 81.1116 34.7475 94.0003 38.4094Z"
        fill="url(#entp_paint0)"
      />
      {/* Right leg */}
      <path
        d="M184.556 245.216C180.748 235.221 180.59 221.618 180.986 216.065C180.986 213.884 182.414 209.402 188.126 208.926C195.266 208.331 195.861 213.685 195.861 216.065C195.861 218.445 197.646 242.836 202.406 245.216C206.214 247.119 206.769 251.958 206.571 253.544H176.227C176.227 245.929 181.78 244.819 184.556 245.216Z"
        fill="black"
      />
      {/* Left eye (sunglasses - static) */}
      <g>
        <path
          d="M146.942 116.562H52.734C49.1658 139.233 61.2981 169.66 99.8379 168.989C132.382 168.422 150.51 143.484 146.942 116.562Z"
          fill="#181D27"
        />
        <mask
          id="entp_mask0"
          style={{ maskType: "alpha" }}
          maskUnits="userSpaceOnUse"
          x="52"
          y="116"
          width="95"
          height="53"
        >
          <path
            d="M146.499 116.834H53.2533C49.7216 139.371 61.73 169.618 99.8761 168.951C132.088 168.387 150.031 143.597 146.499 116.834Z"
            fill="#181D27"
          />
        </mask>
        <g mask="url(#entp_mask0)">
          <rect
            x="91.7734"
            y="100.223"
            width="9.98182"
            height="83.1596"
            transform="rotate(16.4718 91.7734 100.223)"
            fill="white"
          />
          <rect
            x="115.665"
            y="97.98"
            width="9.98182"
            height="83.1596"
            transform="rotate(16.4718 115.665 97.98)"
            fill="white"
          />
        </g>
      </g>
      {/* Right eye (sunglasses - static) */}
      <g>
        <path
          d="M246.478 116.562H154.387C150.899 139.233 162.758 169.66 200.432 168.989C232.245 168.422 249.966 143.484 246.478 116.562Z"
          fill="#181D27"
        />
        <mask
          id="entp_mask1"
          style={{ maskType: "alpha" }}
          maskUnits="userSpaceOnUse"
          x="153"
          y="116"
          width="95"
          height="53"
        >
          <path
            d="M247.426 116.835H154.18C150.648 139.372 162.657 169.618 200.803 168.951C233.015 168.388 250.958 143.597 247.426 116.835Z"
            fill="#181D27"
          />
        </mask>
        <g mask="url(#entp_mask1)">
          <rect
            x="192.699"
            y="100.223"
            width="9.98182"
            height="83.1596"
            transform="rotate(16.4718 192.699 100.223)"
            fill="white"
          />
          <rect
            x="216.592"
            y="97.98"
            width="9.98182"
            height="83.1596"
            transform="rotate(16.4718 216.592 97.98)"
            fill="white"
          />
        </g>
      </g>
      {/* Eye bar */}
      <rect x="50" y="108" width="215.105" height="9.63158" rx="4.81579" fill="#4A1FB8" />
      {/* Mouth - subtle open/close */}
      <motion.g
        animate={{ scaleY: [1, 1.15, 1, 0.85, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", repeatDelay: 2 }}
        style={{ transformOrigin: "148px 177px" }}
      >
        <path
          d="M137.607 169.844C136.62 162.345 142.891 159.804 146.151 159.472C169.498 160.696 162.61 195.411 148.274 195.162C141.918 195.052 135.558 191.902 137.995 186.333C139.922 181.93 138.842 179.217 137.607 169.844Z"
          fill="black"
        />
        <mask
          id="entp_mask2"
          style={{ maskType: "alpha" }}
          maskUnits="userSpaceOnUse"
          x="137"
          y="159"
          width="25"
          height="37"
        >
          <path
            d="M137.607 169.844C136.62 162.345 142.891 159.804 146.151 159.472C169.498 160.696 162.61 195.411 148.274 195.162C141.918 195.052 135.558 191.902 137.995 186.333C139.922 181.93 138.842 179.217 137.607 169.844Z"
            fill="black"
          />
        </mask>
        <g mask="url(#entp_mask2)">
          <path
            d="M137.669 160.245C140.918 164.764 148.81 170.583 154.385 157.711L137.669 160.245Z"
            fill="#F4F3FF"
          />
          <ellipse
            cx="164.689"
            cy="196.872"
            rx="27.9396"
            ry="13.8771"
            transform="rotate(8.53964 164.689 196.872)"
            fill="#FDA29B"
          />
        </g>
      </motion.g>
      {/* Left arm */}
      <path
        d="M92.0008 214.422C81.977 215.753 60.2695 214.107 53.6309 196.872"
        stroke="black"
        strokeWidth="15"
        strokeLinecap="round"
      />
      {/* Skateboard/book accessory */}
      <path
        d="M60 195V187V186.5L57 187V191L44 195V189L37.5 189.5L45 200.5L60 195Z"
        fill="#3E1C96"
      />
      <path d="M72 174H76V189L72 189.5L70.5 186V177L72 174Z" fill="#9B8AFB" />
      <path d="M23.5 156L70.5 176.5V186.5L22.5 192.5L20 183L21 165L23.5 156Z" fill="#9B8AFB" />
      <path d="M21 165L70.5 177V181.5L20 183.5L21 165Z" fill="url(#entp_paint1)" />
      <path d="M20 183.5L70.5 181.5V186.5L22.5 192.5L20 183.5Z" fill="#6938EF" />
      {/* Right arm - sway */}
      <motion.g {...armSwayRight} style={{ transformOrigin: "235px 190px" }}>
        <path
          d="M235.855 185C242.106 192.948 251.746 212.467 240.295 226.958"
          stroke="black"
          strokeWidth="15"
          strokeLinecap="round"
        />
        <path
          d="M249.554 227.631L233.455 221.813C234.416 221.216 236.965 213.391 237.876 209.496L255.056 213.35C255.081 214.999 251.957 224.592 249.554 227.631Z"
          fill="#5925DC"
        />
      </motion.g>
      {/* Book spines */}
      <path
        d="M9.5 154.5C11.1667 154.333 15.5 154.9 19.5 158.5C17 158.333 11.5 157.3 9.5 154.5Z"
        fill="#3E1C96"
      />
      <path
        d="M0.00514294 171.026C1.60477 170.529 5.96387 170.217 10.6032 172.944C8.12041 173.281 2.52485 173.369 0.00514294 171.026Z"
        fill="#3E1C96"
      />
      <path
        d="M7.01071 189.191C8.4563 188.345 12.6316 187.054 17.7679 188.66C15.4259 189.55 9.99558 190.903 7.01071 189.191Z"
        fill="#3E1C96"
      />
      {/* Gold star - spin */}
      <motion.g {...spinSlow} style={{ transformOrigin: "261px 61px" }}>
        <path
          d="M261.186 60.7078L235.506 56.6406L235.507 56.6339C249.612 58.6009 262.759 49.0488 265.246 35.0268L265.253 35.0279L261.186 60.7078Z"
          fill="#FDB022"
        />
        <path
          d="M261.186 60.708L286.865 64.7751L286.867 64.7684C272.845 62.2808 263.292 49.1335 265.259 35.0291L265.253 35.028L261.186 60.708Z"
          fill="#FDB022"
        />
        <path
          d="M262.133 61.0286L236.453 56.9614L236.452 56.9682C250.474 59.4558 260.026 72.6031 258.059 86.7075L258.066 86.7085L262.133 61.0286Z"
          fill="#FDB022"
        />
        <path
          d="M262.132 61.0288L287.812 65.096L287.811 65.1027C273.707 63.1356 260.56 72.6878 258.072 86.7098L258.065 86.7087L262.132 61.0288Z"
          fill="#FDB022"
        />
      </motion.g>
      <defs>
        <linearGradient
          id="entp_paint0"
          x1="152.719"
          y1="0"
          x2="153"
          y2="234"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#D78AFB" />
          <stop offset="0.737483" stopColor="#9B8AFB" />
          <stop offset="1" stopColor="#BDB2FF" />
        </linearGradient>
        <linearGradient
          id="entp_paint1"
          x1="50"
          y1="182"
          x2="45.25"
          y2="165"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0.022061" stopColor="#7A5AF8" />
          <stop offset="1" stopColor="#8C5AD3" />
        </linearGradient>
      </defs>
    </svg>
  );
}
