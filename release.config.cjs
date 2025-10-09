/** release.config.cjs */
module.exports = {
  branches: [
    // release from main; add prerelease channels if desired
    "master",
    // Example prerelease channel:
    // { name: "next", prerelease: true }
  ],

  preset: "angular", // conventional commits (Angular style)

  plugins: [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",

    // Publishes to npm using NPM_TOKEN
    ["@semantic-release/npm", { npmPublish: true }],

    // Creates GitHub release + attaches assets
    "@semantic-release/github",

    // If you want to commit built artifacts, add them here.
    // Typically you should NOT commit dist for libraries.
    // ["@semantic-release/git", { "assets": ["dist/**"] }]
  ],
};
