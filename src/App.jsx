import "bulma/css/bulma.min.css";
import "./styles/theme.css";
import "./App.css";
import "./styles/plants.css";
import "./styles/gardenStyles.css";
// Stili condivisi da più pagine: restano nel file principale, nello stesso
// ordine di prima, così l'aspetto non cambia anche se le pagine arrivano dopo.
import "./styles/pages.css";
import "./styles/garden.css";
import "./styles/guide.css";
import { Suspense } from "react";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import Footer from "./components/Footer";
import Home from "./components/Home";
import "./styles/discover.css";
import "./styles/calendar.css";
import Navbar from "./components/Navbar";
import CookieBanner from "./components/CookieBanner";
import { SessionProvider, useSession } from "./lib/session";
import { setArtStyle } from "./lib/artStyle";
import { usePathMeta } from "./lib/pageMeta";
import { lazyPage } from "./lib/lazyPage";

// Le pagine si scaricano solo quando servono: la home resta leggera.
const AboutMe = lazyPage(() => import("./components/AboutMe"));
const GardenPage = lazyPage(() => import("./components/garden/GardenPage"));
const AccountPage = lazyPage(() => import("./components/AccountPage"));
const AuthPage = lazyPage(() => import("./components/AuthPage"));
const DiscoverPage = lazyPage(() => import("./components/DiscoverPage"));
const SharedPage = lazyPage(() => import("./components/SharedPage"));
const GuidePage = lazyPage(() => import("./components/GuidePage"));
const CalendarPage = lazyPage(() => import("./components/CalendarPage"));
const ContactPage = lazyPage(() => import("./components/ContactPage"));
const StylesPage = lazyPage(() => import("./components/StylesPage"));
const StylePage = lazyPage(() => import("./components/StylesPage"), "StylePage");
const CookiePage = lazyPage(() => import("./components/LegalPages"), "CookiePage");
const PrivacyPage = lazyPage(() => import("./components/LegalPages"), "PrivacyPage");
const TermsPage = lazyPage(() => import("./components/LegalPages"), "TermsPage");

function Layout() {
  const { pathname } = useLocation();
  const { settings } = useSession();
  usePathMeta(pathname);
  // lo stile del disegno vale per tutta l'app; cambiandolo le pagine si ridisegnano
  setArtStyle(settings.artStyle);
  const artStyle = settings.artStyle ?? "tempera";
  const isApp = pathname.startsWith("/gardencanvas");
  const isAuth = pathname === "/accedi" || pathname === "/registrati";
  return (
    <>
      <Navbar />
      <main key={artStyle} className={isApp ? "app-main" : "site-main"}>
        <Suspense fallback={<div className="page-loading" aria-busy="true" />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/piante" element={<DiscoverPage />} />
            <Route path="/stili" element={<StylesPage />} />
            <Route path="/stili/:id" element={<StylePage />} />
            <Route path="/condiviso/:token" element={<SharedPage />} />
            <Route path="/guida" element={<GuidePage />} />
            <Route path="/gardencanvas" element={<GardenPage />} />
            <Route path="/aboutme" element={<AboutMe />} />
            <Route path="/calendario" element={<CalendarPage />} />
            <Route path="/account" element={<AccountPage />} />
            <Route path="/accedi" element={<AuthPage mode="login" />} />
            <Route path="/registrati" element={<AuthPage mode="register" />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/cookie" element={<CookiePage />} />
            <Route path="/termini" element={<TermsPage />} />
            <Route path="/contatti" element={<ContactPage />} />
            <Route path="*" element={<Home />} />
          </Routes>
        </Suspense>
      </main>
      {!isApp && !isAuth && <Footer />}
      <CookieBanner />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <SessionProvider>
        <Layout />
      </SessionProvider>
    </BrowserRouter>
  );
}
