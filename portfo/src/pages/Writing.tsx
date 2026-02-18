import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import postsData from "../data/blog-posts.json";

interface Post {
  id: string;
  title: string;
  slug: string;
  date: string;
  description: string;
  tags: string[];
  color: string;
  readTime?: string;
}

const posts = (postsData as Post[]) || [];

const Writing: React.FC = () => {
  return (
    <section className="min-h-screen py-35 px-6 bg-stone flex justify-center font-sans selection:bg-[#fff06b]">
      <motion.div
        className="w-full max-w-2xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex justify-between items-end mb-16">
          <h1 className="text-4xl tracking-tighter">
            Words I've written.
          </h1>
        </div>

        <div className="flex flex-col gap-12">
          {posts.length === 0 ? (
            <p className="text-gray-500 italic">No posts found.</p>
          ) : (
            posts.map((post) => (
              <Link
                key={post.id}
                to={`/writing/${post.slug}`}
                className="group block no-underline border-b border-gray-100 pb-8 last:border-0 hover:scale-101 transition-all duration-300"
              >
                <article className="flex flex-col gap-4">
                  {/* Top Row: Title + Date/Time + Arrow */}
                  <div className="flex items-baseline justify-between gap-4">
                    <h2 className="text-2xl font-bold text-black flex items-baseline flex-wrap gap-x-4">
                      {/* Title */}
                      <span className={`relative inline-block px-1 transition-all duration-300 ${post.color} bg-opacity-30 group-hover:bg-opacity-100`}>
                        {post.title}
                      </span>
                      
                      {/* Integrated Date & Time */}
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">
                        {post.date} 
                        {post.readTime && <span className="mx-2 text-gray-200">/</span>}
                        {post.readTime}
                      </span>
                    </h2>

                    {/* Desktop Arrow */}
                    <span className="hidden sm:block text-black transform translate-x-[-10px] opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300 font-light text-2xl">
                      →
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-md text-gray-600 leading-relaxed max-w-xl">
                    {post.description}
                  </p>

                  {/* Tags Row */}
                  <div className="flex flex-wrap gap-2">
                    {(post.tags || []).map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 text-[9px] font-black uppercase tracking-tighter text-black bg-white border border-black group-hover:bg-black group-hover:text-white transition-colors"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </article>
              </Link>
            ))
          )}
        </div>
      </motion.div>
    </section>
  );
};

export default Writing;