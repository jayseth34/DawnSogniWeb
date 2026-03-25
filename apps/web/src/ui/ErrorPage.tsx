import { Link, isRouteErrorResponse, useRouteError } from "react-router-dom";

export function ErrorPage() {
  const err = useRouteError();

  let title = "Something went wrong";
  let message = "";

  if (isRouteErrorResponse(err)) {
    title = `${err.status} ${err.statusText}`;
    message = typeof err.data === "string" ? err.data : JSON.stringify(err.data ?? "", null, 2);
  } else if (err instanceof Error) {
    message = err.message;
  } else {
    message = String(err);
  }

  return (
    <div className="container page publicPageShell" style={{ paddingTop: 24 }}>
      <div className="card sectionGlow">
        <div className="p">
          <div className="h2">{title}</div>
          <div className="muted" style={{ marginTop: 8, whiteSpace: "pre-wrap" }}>{message || "No details"}</div>
          <div className="hr" />
          <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
            <button className="btn primary" onClick={() => window.location.reload()}>
              Reload
            </button>
            <Link className="btn" to="/">
              Go home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
