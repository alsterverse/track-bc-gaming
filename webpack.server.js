const serverPath = require("path");
const nodeExternals = require("webpack-node-externals");
module.exports = {
  target: "node",
  entry: {
    app: ["./src/server/server.ts"],
  },
  output: {
    path: serverPath.resolve(__dirname, "built-server"),
    filename: "server.js",
  },
  module: {
    rules: [
      {
        test: /\.ts?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
  externals: [nodeExternals()],
  mode: "development",
};
