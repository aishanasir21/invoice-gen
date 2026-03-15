import React from 'react'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import Signup from './pages/Signup'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Clients from './pages/Clients'
import Quotes from './pages/Quotes'

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path='/signup' element={<Signup/>}/>
        <Route path='/login' element={<Login/>}/>
        <Route path='/dashboard' element={<Dashboard/>}/>
        <Route path='/clients' element={<Clients/>}/>
        <Route path='/quotes' element={<Quotes/>}/>
        <Route path='/' element={<Login/>}/>
      </Routes>
    </Router>
  )
}

export default App