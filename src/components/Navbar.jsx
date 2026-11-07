import { useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useSession } from "../lib/session";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, features } = useSession();
  const { pathname } = useLocation();
  const solid = pathname !== "/";
  const close = () => setOpen(false);

  return (
    <nav className={`navbar app-navbar ${solid ? "is-solid" : "is-transparent"}`} aria-label="Navigazione principale">
      <div className="navbar-brand">
        <Link to="/" className="navbar-item brand" onClick={close}>
          <img src="/icons/icon.svg" alt="" width="28" height="28" />
          <strong>AiuolaLab</strong>
        </Link>
        <button
          className={`navbar-burger ${open ? "is-active" : ""}`}
          aria-label="Menu"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          <span aria-hidden="true" />
          <span aria-hidden="true" />
          <span aria-hidden="true" />
          <span aria-hidden="true" />
        </button>
      </div>
      <div className={`navbar-menu ${open ? "is-active" : ""}`}>
        <div className="navbar-end">
          <NavLink to="/gardencanvas" className="navbar-item" onClick={close}>
            Progetta
          </NavLink>
          <NavLink to="/calendario" className="navbar-item" onClick={close}>
            Calendario
          </NavLink>
          <NavLink to="/aboutme" className="navbar-item" onClick={close}>
            Chi sono
          </NavLink>
          {features.accounts && (
            <NavLink to="/account" className="navbar-item" onClick={close}>
              <i className={`fa-solid ${user ? "fa-circle-user" : "fa-right-to-bracket"}`} />
              &nbsp;{user ? "Account" : "Accedi"}
            </NavLink>
          )}
        </div>
      </div>
    </nav>
  );
}
