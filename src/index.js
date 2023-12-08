#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const { program } = require("commander");

const {
  getConfig,
  buildPrettifier,
  createParentDirectoryIfNecessary,
  logIntro,
  logItemCompletion,
  logConclusion,
  logError,
  toPascalCase,
} = require("./helpers");
const {
  mkDirPromise,
  readFilePromiseRelative,
  writeFilePromise,
} = require("./utils");

// Load our package.json, so that we can pass the version onto `commander`.
const { version } = require("../package.json");

// Get the default config for this component (looks for local/global overrides,
// falls back to sensible defaults).
const config = getConfig();

// Convenience wrapper around Prettier, so that config doesn't have to be
// passed every time.
const prettify = buildPrettifier(config.prettierConfig);
const templateList = fs
  .readdirSync(path.join(__dirname, "./templates"))
  .map((item) => `"${item.slice(0, item.lastIndexOf("."))}"`);

program
  .version(version)
  .arguments("<componentName>")
  .option(
    "-p, --project <projectName>",
    "Project name of the configuration",
    "default",
  )
  .option(
    `-t, --template <templateName>`,
    `Template name to create (options: ${templateList.join(", ")})`,
    "component",
  )
  .parse(process.argv);

const [componentName] = program.args;

const options = program.opts();

const fileExtension = "tsx";
const indexExtension = "ts";

// Find the path to the selected template file.
const templatePath = `./templates/${options.template}.js`;
const templateConfig = (
  options.project === "default"
    ? config["default"]
    : config["project"][options.project]
)[options.template];

// Get all of our file paths worked out, for the user's project.
const componentDir = `${templateConfig.dir}/${componentName}`;
const filePath = `${componentDir}/${componentName}.${fileExtension}`;
const indexPath = `${componentDir}/index.${indexExtension}`;

logIntro({
  name: componentName,
  dir: componentDir,
  template: options.template,
});

// Check to see if the parent directory exists.
// Create it if not
createParentDirectoryIfNecessary(templateConfig.dir);

// Check to see if this component has already been created
const fullPathToComponentDir = path.resolve(componentDir);
if (fs.existsSync(fullPathToComponentDir)) {
  logError(
    `Looks like this component already exists! There's already a component at ${componentDir}.\nPlease delete this directory and try again.`,
  );
  process.exit(0);
}

// Start by creating the directory that our component lives in.
mkDirPromise(componentDir)
  .then(() => readFilePromiseRelative(templatePath))
  .then((template) => {
    logItemCompletion("Directory created.");
    return template;
  })
  // TODO: Pascalcase로 변경
  .then((template) =>
    // Replace our placeholders with real data (so far, just the component name)
    template.replace(/COMPONENT_NAME/g, toPascalCase(componentName)),
  )
  .then((template) => {
    return prettify(template).then((formattedTemplate) =>
      writeFilePromise(filePath, formattedTemplate),
    );
  })
  .then((template) => {
    logItemCompletion("Component built and saved to disk.");
    return template;
  })
  .then(() => {
    if (templateConfig.index === false) {
      return;
    }

    const indexTemplate = `\
    export * from './${componentName}';
    export { default } from './${componentName}';
    `;

    return prettify(indexTemplate).then((formattedTemplate) =>
      writeFilePromise(indexPath, formattedTemplate),
    );
  })
  .then(() => {
    logItemCompletion("Index file built and saved to disk.");
  })
  .then(() => {
    logConclusion();
  })
  .catch((err) => {
    console.error(err);
  });
