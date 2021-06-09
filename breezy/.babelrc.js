module.exports = {
  presets: [
    [
      "@babel/preset-env",
      {
        useBuiltIns: "entry",
        corejs: "2",
        loose: true,
      }
    ],
    [
      "@babel/preset-react"
    ],
  ],
};
