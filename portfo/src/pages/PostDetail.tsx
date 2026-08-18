import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion } from "framer-motion";

type State =
  | { status: "loading" }
  | { status: "ready"; body: string }
  | { status: "missing" };

const PostDetail = () => {
  const { slug } = useParams();
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    // `ignore` rather than an AbortController: switching posts mid-flight should
    // drop the stale response, and aborting would also surface as a rejection to
    // handle. Without it a slow earlier fetch can land last and win.
    let ignore = false;

    fetch(`/posts/${slug}.md`)
      .then(async (res) => {
        // A 200 is not enough. vercel.json rewrites everything to /index.html,
        // so an unknown slug answers with the app shell — which would otherwise
        // be rendered as if it were the post's markdown.
        const type = res.headers.get("content-type") || "";
        if (!res.ok || type.includes("text/html")) throw new Error("not found");
        return res.text();
      })
      .then((body) => {
        if (!ignore) setState({ status: "ready", body });
      })
      .catch(() => {
        if (!ignore) setState({ status: "missing" });
      });

    return () => {
      ignore = true;
    };
  }, [slug]);

  return (
    <article className="min-h-screen py-35 px-6 flex justify-center">
      <div className="w-full max-w-2xl">
        {state.status === "missing" ? (
          <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
            <p>no post at “{slug}”.</p>
            <Link
              to="/writing"
              className="mt-3 inline-block border-b border-ink text-ink transition-colors hover:border-muted hover:text-muted"
            >
              back to writing
            </Link>
          </div>
        ) : state.status === "ready" ? (
          <motion.div
            key={slug}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="prose prose-neutral lg:prose-lg max-w-none font-serif">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{state.body}</ReactMarkdown>
            </div>

            {/* Outside the prose wrapper so typography styles don't reach it. */}
            <div className="mt-16 border-t border-ink/10 pt-6">
              <Link
                to="/writing"
                className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted transition-colors hover:text-ink"
              >
                ← back to writing
              </Link>
            </div>
          </motion.div>
        ) : null}
      </div>
    </article>
  );
};

export default PostDetail;
