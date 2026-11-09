import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useSession } from "../lib/session";

const LINKS = [
  { to: "/piante", label: "Scopri le piante", icon: "fa-heart" },
  { to: "/gardencanvas", label: "Progetta", icon: "fa-trowel" },
  { to: "/calendario", label: "Calendario", icon: "fa-calendar-days" },
  { to: "/aboutme", label: "Chi sono", icon: "fa-user" },
];

function UserMenu({ user, onNavigate }) {
  const { logout, refresh } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const go = (to) => {
    setOpen(false);
    onNavigate();
    navigate(to);
  };

  const exit = async () => {
    setOpen(false);
    onNavigate();
    await logout();
    await refresh();
    navigate("/");
  };

  const initial = user.email.slice(0, 1).toUpperCase();
  return (
    <div className="user-menu" ref={ref}>
      <button className="user-chip" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-haspopup="menu">
        <span className="user-avatar" aria-hidden="true">
          {initial}
        </span>
        <span className="user-email">{user.email}</span>
        <i className={`fa-solid fa-chevron-${open ? "up" : "down"}`} aria-hidden="true" />
      </button>
      {open && (
        <div className="user-dropdown" role="menu">
          <p className="user-dropdown-head">
            <span className="script">ciao!</span>
            <span>{user.email}</span>
          </p>
          <button role="menuitem" onClick={() => go("/account")}>
            <i className="fa-solid fa-sliders" /> Account e notifiche
          </button>
          <button role="menuitem" onClick={() => go("/calendario")}>
            <i className="fa-solid fa-calendar-days" /> Il mio calendario
          </button>
          <button role="menuitem" onClick={() => go("/piante?tab=preferiti")}>
            <i className="fa-solid fa-heart" /> Le mie piante preferite
          </button>
          <button role="menuitem" onClick={() => go("/gardencanvas")}>
            <i className="fa-solid fa-folder-open" /> I miei progetti
          </button>
          <hr />
          <button role="menuitem" className="is-exit" onClick={exit}>
            <i className="fa-solid fa-right-from-bracket" /> Esci
          </button>
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, loading } = useSession();
  const { pathname } = useLocation();
  const onHome = pathname === "/";
  const close = () => setOpen(false);

  return (
    <nav className={`navbar app-navbar ${onHome ? "is-home" : ""} ${open ? "is-open" : ""}`} aria-label="Navigazione principale">
      <div className="navbar-brand">
        <Link to="/" className="navbar-item brand" onClick={close}>
          <span className="brand-mark">
            <img src="/icons/icon.svg" alt="" width="26" height="26" />
          </span>
          <span className="brand-name">
            Aiuola<span>Lab</span>
          </span>
        </Link>
        <button className={`navbar-burger ${open ? "is-active" : ""}`} aria-label="Menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          <span aria-hidden="true" />
          <span aria-hidden="true" />
          <span aria-hidden="true" />
          <span aria-hidden="true" />
        </button>
      </div>
      <div className={`navbar-menu ${open ? "is-active" : ""}`}>
        <div className="navbar-start nav-links">
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} className="navbar-item nav-link" onClick={close}>
              <i className={`fa-solid ${l.icon}`} aria-hidden="true" />
              <span>{l.label}</span>
            </NavLink>
          ))}
        </div>
        <div className="navbar-end nav-auth">
          {loading ? null : user ? (
            <UserMenu user={user} onNavigate={close} />
          ) : (
            <>
              <NavLink to="/accedi" className="navbar-item nav-login" onClick={close}>
                <i className="fa-solid fa-right-to-bracket" aria-hidden="true" /> Accedi
              </NavLink>
              <Link to="/registrati" className="btn-country is-primary is-small nav-register" onClick={close}>
                <i className="fa-solid fa-seedling" aria-hidden="true" /> Registrati
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
