import { Link } from "react-router-dom";
import { socials } from "../lib/nav";
import { projects } from "../data/projects";
import MusicShelf from "../components/MusicShelf";
import ProjectVideo from "../components/ProjectVideo";
import SiteLink from "../components/SiteLink";
import { formatDate } from "../lib/format";
import posts from "../data/blog-posts.json";

export default function AboutMe() {
  return (
    <div className="page home-page">
      <h1 className="sr-only">Ishan Shah</h1>
      <section className="intro">
        <div className="intro-copy">
          <p>
            I’m a founding research engineer at{" "}
            <a
              href="https://preload.ai/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Preload
            </a>
            , teaching robots how humans move and feel. Previously, I worked on
            foundation models for humanoid manipulation at{" "}
            <a
              href="https://www.axibo.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Axibo
            </a>
            .
          </p>
          <p>
            I study at the{" "}
            <a
              href="https://uwaterloo.ca/"
              target="_blank"
              rel="noopener noreferrer"
            >
              University of Waterloo
            </a>
            . Lately, I’ve been thinking about world models, automated research,
            and learning physical intelligence from internet video.
          </p>
          <p>
            Outside of work, I enjoy writing, playing sports, and meeting new
            people.
          </p>
        </div>
        <div className="social-links">
          {socials.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target={link.href.startsWith("mailto:") ? undefined : "_blank"}
              rel="noopener noreferrer"
            >
              {link.label}
              <span aria-hidden="true">↗</span>
            </a>
          ))}
        </div>
      </section>
      <section className="home-section">
        <div className="section-heading">
          <h2>Selected work</h2>
          <Link to="/projects">
            All projects <span aria-hidden="true">↗</span>
          </Link>
        </div>
        <div className="selected-projects">
          {projects.slice(0, 2).map((project) => (
            <SiteLink
              className="selected-project"
              key={project.id}
              href={project.website || project.github || project.demo}
            >
              <ProjectVideo project={project} linked />
              <h3>
                {project.title}
                <span aria-hidden="true">↗</span>
              </h3>
              <p>{project.description}</p>
            </SiteLink>
          ))}
        </div>
      </section>
      <section className="home-section">
        <div className="section-heading">
          <h2>Recent writing</h2>
          <Link to="/writing">
            All writing <span aria-hidden="true">↗</span>
          </Link>
        </div>
        <div className="recent-writing">
          {posts.slice(0, 3).map((post) => (
            <Link key={post.id} to={`/writing/${post.slug}`}>
              <span>{post.title}</span>
              <time dateTime={post.date}>{formatDate(post.date, false)}</time>
            </Link>
          ))}
        </div>
      </section>
      <MusicShelf />
    </div>
  );
}
