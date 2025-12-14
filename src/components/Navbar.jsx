const Navbar = () => {
  return (
    <nav className="navbar is-transparent">
      <div className="navbar-brand">
        <a className="navbar-item has-text-white">
          <strong>AiuolaLab</strong>
        </a>
      </div>

      <div className="navbar-menu">
        <div className="navbar-end">
          <a className="navbar-item has-text-white">About</a>
          <a className="navbar-item has-text-white">Materials</a>
          <a className="navbar-item has-text-white">Contact</a>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
