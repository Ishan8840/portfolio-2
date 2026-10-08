import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import ReadingProgress from "../components/ReadingProgress";
import SiteLink from "../components/SiteLink";
import posts from "../data/blog-posts.json";

type State =
  | { status: "loading" }
  | { status: "ready"; body: string }
  | { status: "missing" }
  | { status: "error" };

export default function PostDetail() {
  const { slug } = useParams();
  const [state, setState] = useState<State>({ status: "loading" });
  const published = posts.some((post) => post.slug === slug);

  useEffect(() => {
    if (!published) return;
    const controller = new AbortController();
    fetch(`/posts/${slug}.md`, { signal: controller.signal })
      .then(async (res) => {
        // SPA hosting can answer unknown file paths with index.html and a 200.
        if (
          res.status === 404 ||
          res.headers.get("content-type")?.includes("text/html")
        ) {
          if (!controller.signal.aborted) setState({ status: "missing" });
          return;
        }
        if (!res.ok) throw new Error("Unable to load article");
        const body = await res.text();
        if (!controller.signal.aborted) setState({ status: "ready", body });
      })
      .catch(() => {
        if (!controller.signal.aborted) setState({ status: "error" });
      });
    return () => controller.abort();
  }, [slug, published]);

  return (
    <article className="page article-page">
      {!published || state.status === "missing" ? (
        <div className="page-message">
          <h1>Article not found</h1>
          <p>This article is no longer available.</p>
          <Link to="/writing">← Back to writing</Link>
        </div>
      ) : state.status === "error" ? (
        <div className="page-message" role="alert">
          <h1>Couldn’t load this article</h1>
          <p>Please check your connection and try again.</p>
          <button onClick={() => window.location.reload()}>Try again</button>
        </div>
      ) : state.status === "loading" ? (
        <p className="loading-state" role="status">
          Loading article…
        </p>
      ) : (
        <>
          <ReadingProgress />
          <div className="article-content">
            <div className="prose prose-neutral max-w-none article-prose">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  a: ({ children, href }) => (
                    <SiteLink href={href}>{children}</SiteLink>
                  ),
                  img: ({ src, alt }) => (
                    <img
                      src={src}
                      alt={alt ?? ""}
                      loading="lazy"
                      decoding="async"
                    />
                  ),
                }}
              >
                {state.body}
              </ReactMarkdown>
            </div>
            <div className="article-back">
              <Link to="/writing">← Back to writing</Link>
            </div>
          </div>
        </>
      )}
    </article>
  );
}
