const HIGHLIGHTS = [
  { icon: "fa-location-dot", label: "Arezzo, Toscana" },
  { icon: "fa-leaf", label: "Titolare di un agriturismo" },
  { icon: "fa-seedling", label: "Studi di botanica" },
  { icon: "fa-code", label: "Sviluppatore software" },
];

const AboutMe = () => {
  return (
    <>
      {/* HERO */}
      <section className="hero is-medium green-dark">
        <div className="hero-body">
          <div className="container">
            <h1 className="title is-2">Chi c'è dietro AiuolaLab</h1>
            <h2 className="subtitle is-5">Un progetto nato tra i fiori di un agriturismo e le righe di codice</h2>
          </div>
        </div>
      </section>

      {/* CHI SONO */}
      <section className="section">
        <div className="container">
          <div className="columns is-vcentered">
            <div className="column is-7">
              <p className="is-size-7 has-text-grey is-uppercase mb-2">Il creatore</p>
              <h3 className="title is-3 mb-2">Riccardo Giangani</h3>
              <p className="subtitle is-6 has-text-grey mb-5">24 anni, Arezzo</p>
              <p className="mb-4">
                Vivo in mezzo al verde: ho un agriturismo, dove aiuole, vasi e orto fanno parte della vita di tutti i giorni. È lì che è
                nata la passione per i fiori e per tutto ciò che serve a farli crescere bene.
              </p>
              <p className="mb-4">
                Negli anni ho approfondito botanica e coltivazione con studi personali, e ho avuto la fortuna di confrontarmi spesso con
                tanti vivaisti: da loro ho imparato i trucchi del mestiere che nessun manuale racconta.
              </p>
              <p>
                Di professione faccio lo sviluppatore. AiuolaLab è il punto d'incontro tra queste due anime: uno strumento pratico per
                progettare giardini, balconi e orti, che mette insieme l'esperienza sul campo e la tecnologia.
              </p>
            </div>

            <div className="column is-5">
              <div className="box about-card">
                <div className="about-avatar" aria-hidden="true">
                  RG
                </div>
                <ul className="about-highlights">
                  {HIGHLIGHTS.map((h) => (
                    <li key={h.label}>
                      <span className="icon has-text-primary">
                        <i className={`fa-solid ${h.icon}`} />
                      </span>
                      {h.label}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* IL PROGETTO */}
      <section className="section has-background-white-bis">
        <div className="container">
          <h3 className="title is-4">Il progetto</h3>

          <div className="columns">
            <div className="column is-4">
              <div className="box" style={{ height: "100%" }}>
                <h4 className="title is-6">Perché</h4>
                <p>
                  Chi vuole un bel giardino spesso non sa da dove partire: quali piante scegliere, quante, dove metterle e come curarle.
                  AiuolaLab nasce per rispondere a queste domande in modo semplice.
                </p>
              </div>
            </div>

            <div className="column is-4">
              <div className="box" style={{ height: "100%" }}>
                <h4 className="title is-6">Cosa fa</h4>
                <p>
                  Disegno in scala reale, catalogo di piante, consigli con l'intelligenza artificiale, irrigazione a goccia, orto e un
                  calendario che ti ricorda cosa fare, stagione dopo stagione.
                </p>
              </div>
            </div>

            <div className="column is-4">
              <div className="box" style={{ height: "100%" }}>
                <h4 className="title is-6">Dove va</h4>
                <p>
                  Collaborazioni con vivai e professionisti del verde, preventivi dei materiali e strumenti sempre più precisi, costruiti
                  ascoltando chi il giardino lo vive davvero.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default AboutMe;
