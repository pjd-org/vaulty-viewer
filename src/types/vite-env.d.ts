interface ImportMeta {
  readonly env: ImportMetaEnv
}

interface ImportMetaEnv {
  readonly VITE_SHELL_V3?: string
  readonly VITE_API_URL?: string
  readonly VITE_API_PROXY_URL?: string
  [key: string]: string | undefined
}
