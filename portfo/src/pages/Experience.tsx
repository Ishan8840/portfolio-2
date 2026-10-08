import { jobs } from "../data/jobs";

export default function Experience() {
  return (
    <div className="page">
      <h1 className="sr-only">Experience</h1>
      <div className="experience-list">
        {jobs.map((job) => (
          <article key={job.id} className="experience-entry">
            <div className="job-heading">
              {job.img && <img src={job.img} alt="" width="40" height="40" />}
              <div>
                <h2>
                  <a
                    href={job.companyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {job.company.replace("@", "")}{" "}
                    <span aria-hidden="true">↗</span>
                  </a>
                </h2>
                <p className="job-role">{job.role}</p>
              </div>
            </div>
            {(job.date || job.location) && (
              <div className="job-meta">
                {job.date && <span>{job.date}</span>}
                {job.location && <span>{job.location}</span>}
              </div>
            )}
            <p className="job-description">{job.description}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
