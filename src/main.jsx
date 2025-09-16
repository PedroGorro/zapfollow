import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

// Tailwind base / estilos globais
import './index.css';

// ⚠️ este import garante as variáveis/classes de cor que o dashboard usava
import './App.css';   // se seu App.css estiver em outro lugar, ajuste o caminho

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
