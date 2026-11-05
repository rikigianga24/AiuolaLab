import "bulma/css/bulma.min.css";
import "./App.css";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import AboutMe from "./components/AboutMe";
import Footer from "./components/Footer";
import GardenPage from "./components/garden/GardenPage";
import Home from "./components/Home";
import Navbar from "./components/Navbar";

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
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
      {!isApp && <Footer />}
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  );
}
