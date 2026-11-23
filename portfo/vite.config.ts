import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: "local-writing",
      configureServer(server) {
        const root = fileURLToPath(new URL(".", import.meta.url));
        const content = path.join(root, "content/writing");
        let timer: ReturnType<typeof setTimeout>;
        const update = (file: string) => {
          if (!file.startsWith(content + path.sep) || !file.endsWith(".md"))
            return;
          clearTimeout(timer);
          timer = setTimeout(() => {
            try {
              execFileSync(
                process.execPath,
                [path.join(root, "scripts/sync-writing.js")],
                { cwd: root, stdio: "pipe" },
              );
              server.ws.send({ type: "full-reload" });
            } catch (error) {
              server.config.logger.error(
                `Writing update failed: ${String(error)}`,
              );
              server.ws.send({
                type: "error",
                err: {
                  message: `Writing update failed: ${String(error)}`,
                  stack: "",
                },
              });
            }
          }, 100);
        };
        server.watcher.add(content);
        server.watcher
          .on("add", update)
          .on("change", update)
          .on("unlink", update);
        server.httpServer?.once("close", () => {
          clearTimeout(timer);
          server.watcher
            .off("add", update)
            .off("change", update)
            .off("unlink", update);
        });
      },
    },
  ],
});
