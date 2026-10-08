import ProjectVideo from "../components/ProjectVideo";
import SiteLink from "../components/SiteLink";
import { projects } from "../data/projects";

export default function Projects() {
  return (
    <div className="page">
      <h1 className="sr-only">Projects</h1>
      <div className="projects-list">
        {projects.map((project) => (
          <article className="project-entry" key={project.id}>
            <ProjectVideo project={project} />
            <div className="project-heading">
              <h2>{project.title}</h2>
              <div>
                {[
                  ["Website", project.website],
                  ["Code", project.github],
                  ["Demo", project.demo],
                  ["X", project.twitter],
                ]
                  .filter(([, url]) => url)
                  .map(([label, url]) => (
                    <SiteLink key={label} href={url}>
                      {label} <span aria-hidden="true">↗</span>
                    </SiteLink>
                  ))}
              </div>
            </div>
            <p>{project.description}</p>
            <div className="tech-list">{project.tech.join(" · ")}</div>
          </article>
        ))}
      </div>
    </div>
  );
}
