import "bulma/css/bulma.min.css";
import "./App.css";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import AboutMe from "./components/AboutMe";
import Footer from "./components/Footer";
import GardenPage from "./components/garden/GardenPage";
import Home from "./components/Home";
import Navbar from "./components/Navbar";
import AccountPage from "./components/AccountPage";
import CalendarPage from "./components/CalendarPage";
import CookieBanner from "./components/CookieBanner";
import { CookiePage, PrivacyPage } from "./components/LegalPages";
import { SessionProvider } from "./lib/session";

function Layout() {
  const { pathname } = useLocation();
  const isApp = pathname.startsWith("/gardencanvas");
  return (
    <>
      <Navbar />
      <main className={isApp ? "app-main" : "site-main"}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/gardencanvas" element={<GardenPage />} />
          <Route path="/aboutme" element={<AboutMe />} />
          <Route path="/calendario" element={<CalendarPage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/cookie" element={<CookiePage />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
      {!isApp && <Footer />}
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
