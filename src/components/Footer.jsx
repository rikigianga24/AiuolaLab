import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="footer garden-footer">
      <div className="content has-text-centered">
        <p className="footer-title">AiuolaLab</p>
        <p className="footer-sub">Progetta le tue aiuole in modo semplice, naturale e consapevole.</p>
        <div className="footer-links">
          <Link to="/">Home</Link>
          <Link to="/gardencanvas">Progetta</Link>
          <Link to="/aboutme">Chi sono</Link>
        </div>
        <p className="footer-copy">© {new Date().getFullYear()} AiuolaLab — progetto indipendente</p>
      </div>
    </footer>
  );
}
