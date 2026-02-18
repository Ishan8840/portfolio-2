import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";

const PostDetail = () => {
  const { slug } = useParams();
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    fetch(`/posts/${slug}.md`)
      .then((res) => {
        if (!res.ok) throw new Error("Post not found");
        return res.text();
      })
      .then((text) => {
        setContent(text);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setIsLoading(false);
      });
  }, [slug]);

  return (
    <article className="min-h-screen py-35 px-6 bg-stone flex justify-center">
      <div className="w-full max-w-2xl">
        {/* AnimatePresence handles the smooth transition if the slug changes */}
        <AnimatePresence mode="wait">
          {!isLoading && (
            <motion.div
              key={slug} // Ensures animation re-runs if you switch posts
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                duration: 0.8, 
                ease: [0.16, 1, 0.3, 1] // A "quintic" ease-out for a premium, smooth feel
              }}
              className="prose prose-neutral lg:prose-lg max-w-none font-serif"
            >
              <ReactMarkdown>{content}</ReactMarkdown>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </article>
  );
};

export default PostDetail;