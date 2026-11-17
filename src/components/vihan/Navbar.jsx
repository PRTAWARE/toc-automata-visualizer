import React from "react";
import { NavLink } from "react-router-dom";
import "./Navbar.css";

export default function Navbar() {
  return (
    <nav className="navbar" aria-label="Main navigation">
      <div className="navbar__brand">
        <NavLink to="/" className="navbar__logo">
          TOC <span>Visualizer</span>
        </NavLink>
      </div>
      <ul className="navbar__links" role="list">
        <li><NavLink to="/" end className={navClass}>Home</NavLink></li>
        <li><NavLink to="/fa-simulator" className={navClass}>FA Simulator</NavLink></li>
        <li><NavLink to="/nfa-to-dfa" className={navClass}>NFA → DFA</NavLink></li>
        <li><NavLink to="/dfa-minimize" className={navClass}>DFA Minimize</NavLink></li>
        <li><NavLink to="/regex" className={navClass}>Regex → Automata</NavLink></li>
        <li><NavLink to="/pda" className={navClass}>PDA</NavLink></li>
        <li><NavLink to="/turing-machine" className={navClass}>Turing Machine</NavLink></li>
      </ul>
    </nav>
  );
}

function navClass({ isActive }) {
  return "navbar__link" + (isActive ? " navbar__link--active" : "");
}
