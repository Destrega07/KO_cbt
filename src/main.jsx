import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'

// 使用 Vite 的 BASE_URL 作为 React Router 的 basename，
// 以支持 GitHub Pages 子路径部署（生产为 /KO_cbt/，开发为 /）。
const basename = import.meta.env.BASE_URL || '/'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter basename={basename}>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)