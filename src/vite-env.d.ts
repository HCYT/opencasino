/// <reference types="vite/client" />

type ImportMetaEnv = {
  readonly [key: string]: string | undefined;
};

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
