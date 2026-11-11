import { Link } from "react-router-dom";
import { reopenConsent } from "../lib/consent";
import { Wave } from "./decor";

export default function Footer() {
  return (
    <footer className="footer garden-footer">
      <Wave color="#f7f1e3" />
      <div className="content has-text-centered">
        <p className="footer-title">
          Aiuola<span>Lab</span>
        </p>
        <p className="footer-sub">progettato con cura, cresciuto con pazienza</p>
        <div className="footer-links">
          <Link to="/">Home</Link>
          <Link to="/piante">Scopri le piante</Link>
          <Link to="/stili">Stili di giardino</Link>
          <Link to="/guida">Guida al giardino</Link>
          <Link to="/gardencanvas">Progetta</Link>
          <Link to="/calendario">Calendario</Link>
          <Link to="/aboutme">Chi sono</Link>
          <Link to="/prezzi">Prezzi</Link>
          <Link to="/account">Account</Link>
          <Link to="/contatti">Contatti</Link>
          <Link to="/termini">Termini</Link>
          <Link to="/privacy">Privacy</Link>
          <Link to="/cookie">Cookie</Link>
          <a onClick={reopenConsent} role="button">
            Preferenze cookie
          </a>
        </div>
        <p className="footer-copy">© {new Date().getFullYear()} AiuolaLab · progetto indipendente nato ad Arezzo</p>
      </div>
    </footer>
  );
}
