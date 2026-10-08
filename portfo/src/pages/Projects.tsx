import { projects } from "../data/projects";

export default function Projects() {
  return <div className="page">
    <div className="projects-list">{projects.map(project => <article className="project-entry" key={project.id}>
      <div className="project-media"><video src={project.video} poster={project.video.replace('/videos/', '/posters/').replace('.mp4', '.webp')}
        muted loop playsInline preload="none" tabIndex={0}
        onMouseEnter={event => { void event.currentTarget.play().catch(() => {}); }}
        onMouseLeave={event => { event.currentTarget.pause(); event.currentTarget.currentTime = 0; }}
        onFocus={event => { void event.currentTarget.play().catch(() => {}); }}
        onBlur={event => { event.currentTarget.pause(); event.currentTarget.currentTime = 0; }}
        onPointerDown={event => {
          if (event.pointerType !== 'touch') return;
          const video = event.currentTarget;
          if (video.paused) void video.play().catch(() => {});
          else video.pause();
        }} aria-label={`${project.title} demonstration`} aria-describedby={`project-caption-${project.id}`} />
        <span className="video-caption" id={`project-caption-${project.id}`}>{project.caption}</span>
      </div>
      <div className="project-heading"><h2>{project.title}</h2><div>{[['Website',project.website],['Code',project.github],['Demo',project.demo],['X',project.twitter]].filter(([,url])=>url).map(([label,url])=><a key={label} href={url} target="_blank" rel="noopener noreferrer">{label} <span aria-hidden="true">↗</span></a>)}</div></div>
      <p>{project.description}</p><div className="tech-list">{project.tech.join(' · ')}</div>
    </article>)}</div>
  </div>;
}
