import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";

const PostDetail = () => {
  const { slug } = useParams(); // Grabs the 'slug' from the URL
  const [content, setContent] = useState("");

  useEffect(() => {
    // Fetch the .md file from your public folder
    fetch(`/posts/${slug}.md`)
      .then((res) => {
        if (!res.ok) throw new Error("Post not found");
        return res.text();
      })
      .then((text) => {
        setContent(text);
      })
      .catch((err) => {
        console.error(err);
      });
  }, [slug]);


  return (
    <article className="min-h-screen py-35 px-6 bg-white flex justify-center">
      <div className="w-full max-w-2xl">
        {/* Markdown Content */}
        <div className="prose prose-neutral max-w-none 
                        prose-h1:text-4xl prose-h1:font-black 
                        prose-p:text-gray-800 prose-p:leading-relaxed
                        prose-img:border-2 prose-img:border-black prose-img:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      </div>
    </article>
  );
};

export default PostDetail;