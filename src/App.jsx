import 'bulma/css/bulma.min.css';
import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './components/Home';
import GardenCanvas from './components/GardenCanvas';
import AboutMe from './components/AboutMe';
import Footer from './components/Footer';

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/gardencanvas" element={<GardenCanvas />} />
        <Route path="/aboutme" element={<AboutMe />} />
      </Routes>
      <Footer/>
    </BrowserRouter>
  );
}

export default App;