import { Link } from "react-router-dom";
import { reopenConsent } from "../lib/consent";

export default function Footer() {
  return (
    <footer className="footer garden-footer">
      <div className="content has-text-centered">
        <p className="footer-title">AiuolaLab</p>
        <p className="footer-sub">Progetta le tue aiuole in modo semplice, naturale e consapevole.</p>
        <div className="footer-links">
          <Link to="/">Home</Link>
          <Link to="/gardencanvas">Progetta</Link>
          <Link to="/calendario">Calendario</Link>
          <Link to="/aboutme">Chi sono</Link>
          <Link to="/privacy">Privacy</Link>
          <Link to="/cookie">Cookie</Link>
          <a onClick={reopenConsent} role="button">Preferenze cookie</a>
        </div>
        <p className="footer-copy">© {new Date().getFullYear()} AiuolaLab — progetto indipendente</p>
      </div>
    </footer>
  );
}
