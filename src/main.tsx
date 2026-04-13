import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { Toaster } from 'react-hot-toast' // Import the Toaster
import { store } from './redux/store'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      {/* Toaster configuration: 
          positioning it top-center for best visibility in judicial dashboards 
      */}
      <Toaster 
        position="top-center" 
        reverseOrder={false} 
        toastOptions={{
          style: {
            fontSize: '11px',
            fontWeight: '900',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            borderRadius: '12px',
            background: '#1a3a32',
            color: '#fff',
          },
          success: {
            iconTheme: {
              primary: '#b48222',
              secondary: '#fff',
            },
          },
        }}
      />
      <App />
    </Provider>
  </React.StrictMode>,
)