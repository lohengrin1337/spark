// eslint.config.js
const { defineConfig } = require("eslint/config");
const js = require("@eslint/js");

module.exports = defineConfig([
	{
		rules: {
			semi: "error",
			"prefer-const": "error",
		},
	},
]);
