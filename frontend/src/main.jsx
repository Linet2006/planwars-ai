import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { EventProvider } from './context/EventContext.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <StrictMode>
    <EventProvider>
      <App />
    </EventProvider>
  </StrictMode>
);
