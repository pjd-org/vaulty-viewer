import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const vaultPath =
  process.env.VAULT_CONTENT_PATH ||
  process.env.VAULT_PATH ||
  path.join(__dirname, 'content');

if (!fs.existsSync(vaultPath)) {
  console.warn(`[viewer] Missing vault path: ${vaultPath}`);
}

const ignore = [
  '/*.md',
  '**/_system/**',
  '**/templates/**',
  '**/.obsidian/**',
  '**/.vault/**',
  '**/.vault-*/**',
  '**/.git/**',
  '**/config.*',
  '**/*.config.*',
  // Vault sync runtime artifacts — these may not exist at build time
  '**/.sync.lock',
  '**/.sync-status.json',
  '**/.sync-*',
];

const sources = [
  {
    resolve: 'gatsby-source-filesystem',
    options: {
      name: 'vault',
      path: vaultPath,
      ignore,
    },
  },
];

const config = {
  siteMetadata: {
    title: 'Vaulty Viewer',
    description: 'Browse and edit Vaulty notes with Gatsby + Decap CMS.',
  },
  plugins: [
    ...sources,
    {
      resolve: 'gatsby-transformer-remark',
      options: {
        excerpt_separator: '<!-- end -->',
        plugins: [
          // Sanitise the HTML produced by gatsby-transformer-remark before it
          // reaches dangerouslySetInnerHTML.  Strips <script>, inline event
          // handlers (on*), and javascript:/vbscript: hrefs.
          //
          // Why a local plugin instead of rehypePlugins + rehype-sanitize:
          //   - gatsby-transformer-remark@6 has no rehype pipeline; the
          //     rehypePlugins key in options is silently ignored.
          //   - rehype-sanitize v5+ is ESM-only; it cannot be require()'d
          //     from the CJS plugin runner inside gatsby-transformer-remark.
          //   - sanitize-html (used by the local plugin) is CJS-compatible
          //     and actively maintained.
          {
            resolve: `${__dirname}/plugins/gatsby-remark-sanitize-html`,
          },
        ],
      },
    },
  ],
};

export default config;
