const path = require("path");
const fs = require("fs");

const vaultPath =
  process.env.VAULT_CONTENT_PATH ||
  process.env.VAULT_PATH ||
  path.join(__dirname, "content");
if (!fs.existsSync(vaultPath)) {
  console.warn(`[viewer] Missing vault path: ${vaultPath}`);
}

const ignore = [
  "/*.md",
  "**/_system/**",
  "**/templates/**",
  "**/.obsidian/**",
  "**/.vault/**",
  "**/.vault-*/**",
  "**/.git/**",
  "**/config.*",
  "**/*.config.*",
];

const sources = [
  {
    resolve: "gatsby-source-filesystem",
    options: {
      name: "vault",
      path: vaultPath,
      ignore,
    },
  },
];

module.exports = {
  siteMetadata: {
    title: "Vaulty Viewer",
    description: "Browse and edit Vaulty notes with Gatsby + Decap CMS.",
  },
  plugins: [
    ...sources,
    {
      resolve: "gatsby-transformer-remark",
      options: {
        excerpt_separator: "<!-- end -->",
      },
    },
  ],
};
