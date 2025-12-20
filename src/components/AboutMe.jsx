const AboutMe = () => {
  return (
    <>
      {/* HERO */}
      <section className="hero is-medium green-dark">
        <div className="hero-body">
          <div className="container">
            <h1 className="title is-2">AiuolaLab</h1>
            <h2 className="subtitle is-5">
              Progettare spazi verdi in modo semplice, preciso e visivo
            </h2>
          </div>
        </div>
      </section>

      {/* CHI SONO */}
      <section className="section">
        <div className="container">
          <div className="columns is-vcentered">
            <div className="column is-6">
              <h3 className="title is-4">Chi sono</h3>
              <p className="mb-4">
                Sono uno sviluppatore con un approccio pratico: mi interessa costruire
                strumenti che abbiano senso usare, non solo belli da vedere.
              </p>
              <p className="mb-4">
                AiuolaLab nasce dall’unione tra programmazione, progettazione
                e attenzione al dettaglio, con l’obiettivo di dare controllo
                e chiarezza nella pianificazione degli spazi verdi.
              </p>
              <p>
                Preferisco soluzioni semplici, modulari e migliorabili nel tempo.
              </p>
            </div>

            <div className="column is-6">
              <div className="box has-background-light">
                <ul>
                  <li>• React & Canvas interattivo</li>
                  <li>• Gestione geometrie e distanze</li>
                  <li>• UI pulita, senza fronzoli</li>
                  <li>• Evoluzione continua del progetto</li>
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
              <div className="box">
                <h4 className="title is-6">Obiettivo</h4>
                <p>
                  Offrire uno strumento chiaro per progettare aiuole,
                  con misure reali, materiali e disposizione delle piante.
                </p>
              </div>
            </div>

            <div className="column is-4">
              <div className="box">
                <h4 className="title is-6">Come funziona</h4>
                <p>
                  Canvas interattivo, zoom e spostamento,
                  bordi intelligenti e gestione di più aiuole nello stesso spazio.
                </p>
              </div>
            </div>

            <div className="column is-4">
              <div className="box">
                <h4 className="title is-6">Direzione futura</h4>
                <p>
                  Integrazione API botaniche, suggerimenti automatici
                  e strumenti sempre più precisi.
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
