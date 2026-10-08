import { useState } from "react";
import { Link } from "react-router-dom";
import posts from "../data/blog-posts.json";

export default function Writing() {
  const [query, setQuery] = useState('');
  const visible = posts.filter(post => [post.title,post.description,...post.tags].join(' ').toLowerCase().includes(query.trim().toLowerCase()));
  return <div className="page">
    <div className="writing-tools"><label><span className="sr-only">Search posts</span><input type="search" placeholder="Search writing…" value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>{if(e.key==='Escape')setQuery('');}} /></label><span>{visible.length} articles</span></div>
    <div className="writing-list">{visible.map(post => <article key={post.id}><Link to={`/writing/${post.slug}`}><div className="writing-meta"><time dateTime={post.date}>{new Date(`${post.date}T12:00:00`).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</time><span>{post.readTime} read</span></div><h2>{post.title}<span aria-hidden="true">↗</span></h2><p>{post.description}</p></Link></article>)}</div>
    {!visible.length && <p className="empty-state">No articles match “{query}”. <button onClick={()=>setQuery('')}>Clear search</button></p>}
  </div>;
}
