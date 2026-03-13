import { motion } from "framer-motion";
import { legSwayLeft, legSwayRight, spinSlow } from "./animation-config";

export function EntJMascot({ className }: { className?: string }) {
  return (
    <svg
      width="196"
      height="245"
      viewBox="0 0 196 245"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Left arm stroke (subtle sway) */}
      <motion.g
        animate={{ rotate: [0, 4, 0, -4, 0] }}
        transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "58px 174px" }}
      >
        <path
          d="M58.0164 173.647C45.4544 170.777 26.6869 160.37 28.6058 129.422"
          stroke="black"
          strokeWidth="12.5787"
          strokeLinecap="round"
        />
        {/* Microphone handle */}
        <rect
          width="10.9016"
          height="27.6732"
          rx="5.45079"
          transform="matrix(-1 -0.000475497 -0.000475497 1 36.939 95.0684)"
          fill="black"
        />
        <ellipse
          cx="14.2559"
          cy="15.5138"
          rx="14.2559"
          ry="15.5138"
          transform="matrix(-1 -0.000475497 -0.000475497 1 40.2764 107.782)"
          fill="black"
        />
        <ellipse
          cx="8.38583"
          cy="9.22441"
          rx="8.38583"
          ry="9.22441"
          transform="matrix(-1 -0.000475497 -0.000475497 1 28.8372 106.952)"
          fill="black"
        />
      </motion.g>
      {/* Left leg */}
      <motion.g {...legSwayLeft} style={{ transformOrigin: "96px 202px" }}>
        <path
          d="M91.0942 201.324L103.093 205.274C102.257 207.329 100.935 212.406 102.335 216.269C103.735 220.132 102.901 224.276 102.387 225.372L79.2347 221.649C77.2739 208.702 90.0993 213.796 89.6858 213.224C89.0105 209.882 90.3433 203.898 91.0942 201.324Z"
          fill="black"
        />
      </motion.g>
      {/* Body */}
      <path
        d="M93.4888 41.254C98.1277 43.4167 99.1217 50.406 98.5608 55.1754C101.685 41.8089 113.451 19.5643 124.714 21.3755C132.912 22.6938 134.67 30.3818 133.695 36.7709C135.568 27.3731 142.341 15.3428 154.476 18.5178C167.11 21.8229 164.503 41.9084 162.208 52.3047C165.107 42.9973 169.752 30.2125 181.239 34.5422C195.782 40.0236 192.564 64.4127 191.825 76.759C194.913 69.1816 199.085 60.6648 209.202 64.1109C215.19 66.1504 228.487 83.0354 214.506 149.629C200.525 216.223 133.382 212.974 115.48 210.945C97.5774 208.916 36.1676 189.692 40.6149 130.065C45.0621 70.4371 83.3052 36.5061 93.4888 41.254Z"
        fill="url(#entj_paint0)"
      />
      {/* Right leg */}
      <motion.g {...legSwayRight} style={{ transformOrigin: "147px 195px" }}>
        <path
          d="M141.885 219.149C139.308 210.559 140.002 199.171 140.672 194.551C140.804 192.727 142.271 189.066 147.077 189.015C153.085 188.952 153.257 193.466 153.112 195.456C152.968 197.446 152.977 217.955 156.814 220.235C159.883 222.059 160.053 226.139 159.791 227.454L134.411 225.609C134.874 219.24 139.586 218.649 141.885 219.149Z"
          fill="black"
        />
      </motion.g>
      {/* Left arm reach (subtle sway) */}
      <motion.g
        animate={{ rotate: [0, 4, 0, -4, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "90px 118px" }}
      >
        <path
          d="M69.9642 106.533L107.509 130.07C110.146 131.593 114.65 136.152 105.569 137.326C96.4885 138.5 72.9931 140.758 62.3805 141.741"
          stroke="#181D27"
          strokeWidth="7.54724"
          strokeLinecap="round"
        />
      </motion.g>
      {/* Right arm reach (subtle sway) */}
      <motion.g
        animate={{ rotate: [0, -4, 0, 4, 0] }}
        transition={{ duration: 4.3, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "163px 130px" }}
      >
        <path
          d="M184.947 125.261L141.916 135.841C138.934 136.46 133.228 139.377 141.483 143.339C149.738 147.3 171.34 156.811 181.11 161.071"
          stroke="#181D27"
          strokeWidth="7.54724"
          strokeLinecap="round"
        />
      </motion.g>
      {/* Right arm stroke (subtle sway) */}
      <motion.g
        animate={{ rotate: [0, -4, 0, 4, 0] }}
        transition={{ duration: 4.6, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "182px 194px" }}
      >
        <path
          d="M181.891 193.992C190.23 195.526 202.605 194.619 208.887 180.462"
          stroke="black"
          strokeWidth="12.5787"
          strokeLinecap="round"
        />
      </motion.g>
      {/* Mouth */}
      <path
        d="M108.176 153.259C104.492 184.093 134.15 187.164 135.284 156.345L108.176 153.259Z"
        fill="#181D27"
      />
      <mask
        id="entj_mask0"
        style={{ maskType: "alpha" }}
        maskUnits="userSpaceOnUse"
        x="107"
        y="153"
        width="29"
        height="25"
      >
        <path
          d="M108.176 153.259C104.491 184.093 134.15 187.164 135.284 156.345L108.176 153.259Z"
          fill="#181D27"
        />
      </mask>
      <g mask="url(#entj_mask0)">
        <path
          d="M115.823 153.164C118.217 156.506 124.323 161.427 129.6 154.378L115.823 153.164Z"
          fill="#F4F3FF"
        />
        <ellipse
          cx="136.437"
          cy="187.384"
          rx="28.9311"
          ry="15.5138"
          transform="rotate(19.3512 136.437 187.384)"
          fill="#FDA29B"
        />
      </g>
      {/* Shoes */}
      <path
        d="M144.811 192.347C148.379 173.035 129.15 183.085 119.09 190.524L120.095 202.247C134.554 220.18 140.351 216.488 144.811 192.347Z"
        fill="#7A5AF8"
      />
      <path
        d="M130.477 196.477C130.285 191.892 123.241 192.896 119.742 193.971L119.983 199.701C123.561 200.537 130.669 201.061 130.477 196.477Z"
        fill="#5925DC"
      />
      <path
        d="M88.7237 186.316C89.9892 166.718 106.174 181.167 114.109 190.841L110.266 201.962C91.8587 215.813 87.1418 210.814 88.7237 186.316Z"
        fill="#7A5AF8"
      />
      <path
        d="M101.611 193.826C102.919 189.428 109.503 192.125 112.632 194.023L110.996 199.521C107.323 199.455 100.303 198.225 101.611 193.826Z"
        fill="#5925DC"
      />
      <circle
        cx="116.019"
        cy="195.232"
        r="8.56131"
        transform="rotate(9.13548 116.019 195.232)"
        fill="#FEC84B"
      />
      {/* Gold star - spin */}
      <motion.g {...spinSlow} style={{ transformOrigin: "39.5px 80.7px" }}>
        <path
          d="M39.5159 80.7095L25.7465 82.6205L25.746 82.6166C33.2674 81.4304 38.5088 74.4997 37.6019 66.9395L37.6048 66.9391L39.5159 80.7095Z"
          fill="#FDB022"
        />
        <path
          d="M39.5174 80.7098L53.2878 78.7987L53.2873 78.7948C45.7271 79.7018 38.7965 74.4602 37.6102 66.9389L37.6063 66.9394L39.5174 80.7098Z"
          fill="#FDB022"
        />
        <path
          d="M39.5175 80.7092L25.7471 82.6203L25.7475 82.6232C33.3081 81.7164 40.2392 86.9579 41.4247 94.4801L41.4286 94.4795L39.5175 80.7092Z"
          fill="#FDB022"
        />
        <path
          d="M39.5175 80.7099L53.2869 78.799L53.2874 78.8028C45.7663 79.9895 40.5254 86.9197 41.4325 94.4798L41.4286 94.4803L39.5175 80.7099Z"
          fill="#FDB022"
        />
      </motion.g>
      {/* Side panel */}
      <rect
        width="45.5464"
        height="20.2429"
        transform="matrix(-0.941329 -0.337489 -0.337489 0.941329 238.218 158.333)"
        fill="url(#entj_paint1)"
      />
      <defs>
        <linearGradient
          id="entj_paint0"
          x1="147.218"
          y1="17.2709"
          x2="116.296"
          y2="211.048"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#D78AFB" />
          <stop offset="0.737483" stopColor="#9B8AFB" />
          <stop offset="1" stopColor="#BDB2FF" />
        </linearGradient>
        <linearGradient
          id="entj_paint1"
          x1="-58.6182"
          y1="44.6212"
          x2="27.5995"
          y2="14.6706"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#B84ABE" />
          <stop offset="1" stopColor="#6172F3" />
        </linearGradient>
      </defs>
    </svg>
  );
}
