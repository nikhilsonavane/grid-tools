module.export = {
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    '@semantic-release/github',
    '@semantic-release/git',
    '@semantic-release/npm',
  ],
  preset: 'angular',
}
