import './App.css'
import AboutMe from './pages/About'
import Experience from './pages/Experience'
import Projects from './pages/Projects'
import Writing from './pages/Writing'
import PostDetail from './pages/PostDetail'
import Navbar from './components/Navbar'
import { Routes, Route } from 'react-router-dom'

function App() {

  return (
    <div>
      <Navbar />      
      <Routes>
        <Route path="/" element={<AboutMe />} />
        <Route path="/experience" element={<Experience />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/writing" element={<Writing />} />
        <Route path="/writing/:slug" element={<PostDetail />} />
        
        {/* 404 Catch-all */}
        <Route path="*" element={<div className="p-20">404 - Not Found</div>} />
      </Routes>
    </div>
  )
}

export default App