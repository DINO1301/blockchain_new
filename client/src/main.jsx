import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { BrowserRouter } from 'react-router-dom';
import { Web3Provider } from './context/Web3Context.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { CartProvider } from './context/CartContext.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Web3Provider> 
          <CartProvider>
            <App />
          </CartProvider>
        </Web3Provider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);