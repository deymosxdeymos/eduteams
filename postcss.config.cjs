module.exports = {
  plugins: {
    "@stylexjs/postcss-plugin": {
      include: ["src/**/*.{js,jsx,ts,tsx}"],
      babelConfig: {
        babelrc: false,
        parserOpts: {
          plugins: ["typescript", "jsx"],
        },
        plugins: [
          [
            "@stylexjs/babel-plugin",
            {
              dev: false,
              runtimeInjection: false,
              enableInlinedConditionalMerge: true,
              treeshakeCompensation: true,
              unstable_moduleResolution: {
                type: "commonJS",
              },
            },
          ],
        ],
      },
      useCSSLayers: true,
    },
    autoprefixer: {},
  },
};
