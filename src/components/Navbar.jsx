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
          <a href = "/Login" className="navbar-item has-text-white">Login</a>
          <a href = "/AboutMe" className="navbar-item has-text-white">About me</a>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
