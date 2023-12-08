/*
Helpers are application-specific functions.

They're useful for abstracting away plumbing and other important-but-
uninteresting parts of the code, specific to this codebase.

NOTE: For generalized concerns that aren't specific to this project,
use `utils.js` instead.
*/
const os = require("os");
const fs = require("fs");
const path = require("path");

const prettier = require("prettier");
const chalk = require("chalk");

const { requireOptional, sample } = require("./utils");
const AFFIRMATIONS = require("./affirmations");

// Get the configuration for this component.
// Overrides are as follows:
//  - default values
//  - globally-set overrides
//  - project-specific overrides
//  - command-line arguments.
//
// The CLI args aren't processed here; this config is used when no CLI argument
// is provided.
module.exports.getConfig = () => {
  const home = os.homedir();
  const currentPath = process.cwd();

  const defaults = {
    default: {
      component: {
        dir: "src/components",
        index: true,
      },
    },
  };

  const globalOverrides = requireOptional(
    `/${home}/.new-component-config.json`,
  );

  const localOverrides = requireOptional(
    `/${currentPath}/.new-component-config.json`,
  );

  return Object.assign({}, defaults, globalOverrides, localOverrides);
};

module.exports.buildPrettifier = () => {
  return (text) =>
    prettier.format(text, {
      semi: true,
      singleQuote: false,
      trailingComma: "es5",
      parser: "babel",
    });
};

module.exports.createParentDirectoryIfNecessary = async (dir) => {
  const fullPathToParentDir = path.resolve(dir);

  if (!fs.existsSync(fullPathToParentDir)) {
    fs.mkdirSync(dir);
  }
};

// Emit a message confirming the creation of the component
const colors = {
  red: [216, 16, 16],
  green: [142, 215, 0],
  blue: [0, 186, 255],
  gold: [255, 204, 0],
  mediumGray: [128, 128, 128],
  darkGray: [90, 90, 90],
};

module.exports.logIntro = ({ name, dir, template }) => {
  console.info("\n");
  console.info(
    `✨  Creating the ${chalk.bold.rgb(...colors.gold)(name)} component ✨`,
  );
  console.info("\n");

  const pathString = chalk.bold.rgb(...colors.blue)(dir);
  const templateString = chalk.rgb(...colors.green)(template);

  console.info(`Directory:  ${pathString}`);
  console.info(`Template:   ${templateString}`);
  console.info(
    chalk.rgb(...colors.darkGray)("========================================="),
  );

  console.info("\n");
};

module.exports.logItemCompletion = (successText) => {
  const checkmark = chalk.rgb(...colors.green)("✓");
  console.info(`${checkmark} ${successText}`);
};

module.exports.logConclusion = () => {
  console.info("\n");
  console.info(chalk.bold.rgb(...colors.green)("Component created!"));
  console.info(chalk.rgb(...colors.mediumGray)(sample(AFFIRMATIONS)));
  console.info("\n");
};

module.exports.logError = (error) => {
  console.info("\n");
  console.info(chalk.bold.rgb(...colors.red)("Error creating component."));
  console.info(chalk.rgb(...colors.red)(error));
  console.info("\n");
};

module.exports.toPascalCase = (str) =>
  str
    .match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g)
    .map((x) => x.charAt(0).toUpperCase() + x.slice(1).toLowerCase())
    .join("");
