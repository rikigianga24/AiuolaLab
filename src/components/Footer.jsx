const Footer = () => {
  return (
    <footer className="footer garden-footer">
      <div className="content has-text-centered">
        <p className="footer-title">AiuolaLab</p>

        <p className="footer-sub">
          Progetta le tue aiuole in modo semplice, naturale e consapevole.
        </p>

        <div className="footer-links">
          <a href="/">Home</a>
          <a href="/gardencanvas">Garden Canvas</a>
          <a href="/aboutme">About</a>
        </div>

        <p className="footer-copy">
          © {new Date().getFullYear()} AiuolaLab — progetto indipendente
        </p>
      </div>
    </footer>
  );
};

export default Footer;