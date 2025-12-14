import 'bulma/css/bulma.min.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './components/Home';
import GardenCanvas from './components/GardenCanvas';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/gardencanvas" element={<GardenCanvas />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;