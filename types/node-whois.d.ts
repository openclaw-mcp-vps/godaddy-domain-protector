declare module "node-whois" {
  interface LookupOptions {
    server?: string;
    port?: number;
    follow?: number;
    timeout?: number;
    verbose?: boolean;
  }

  function lookup(
    query: string,
    options: LookupOptions,
    callback: (error: Error | null, data: string) => void,
  ): void;

  const whois: {
    lookup: typeof lookup;
  };

  export default whois;
}
