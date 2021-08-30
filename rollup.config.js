import { terser } from "rollup-plugin-terser";
import { visualizer } from "rollup-plugin-visualizer";
import json from "@rollup/plugin-json";
import vue from "rollup-plugin-vue";
import strip from "@rollup/plugin-strip";
import analyze from "rollup-plugin-analyzer";
import cssbundle from "rollup-plugin-css-bundle";
import nodeResolve from "rollup-plugin-node-resolve";
import commonjs from "rollup-plugin-commonjs";
import replace from "@rollup/plugin-replace";

const globals = {
  markdownit: "markdownit",
  Dropzone: "Dropzone",
  SimpleMDE: "SimpleMDE",
};

const dev_packages = process.env["DIST"]
  ? [strip(), terser(), analyze(), visualizer()]
  : [];

const plugins = [
  vue({ css: true, target: "browser", preprocessStyles: true }),
  json(),
  nodeResolve({ preferBuiltins: false }),
  commonjs(),
  cssbundle(),
  ...dev_packages,
  replace({
    preventAssignment: true,
    values: {
      "process.env.NODE_ENV": '"production"',
      module: "undefined",
    },
  }),
];

function Entry(name) {
  return {
    input: `src/${name}/index.js`,
    plugins,
    output: {
      globals,
      name: "app",
      format: "iife",
      sourcemap: true,
      validate: true,
      compact: true,
      file: `apps/${name}.js`,
    },
  };
}

export default [Entry("main")];
