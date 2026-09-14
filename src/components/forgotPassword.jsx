import { useState } from 'react';
import { toast } from 'react-hot-toast'; 
import './forgotPassword.css';
import { Link, useNavigate } from "react-router-dom"; 
import { getApiUrl } from "../config/api.js";
import { isValidEmail } from "../lib/validators.js";

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isValidEmail(email)) {
      toast.error('Por favor, ingresa un correo válido');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(getApiUrl('/auth/forgot-password'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('¡Código enviado! Revisa tu correo');
        
        navigate('/reset-password', { 
          state: {
            email: email,
            modoRecuperacion: true 
          }
        });
      } else {
        toast.error(data.error || 'Ocurrió un error al procesar tu solicitud');
      }
    } catch (error) {
      console.error("Error al conectar con el backend", error);
      toast.error('No pudimos conectar con el servidor');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Recuperar Contraseña</h2>
        <p className="forgot-description" style={{ fontSize: '0.9rem', color: '#666' }}>
          Ingresa tu correo y te enviaremos un <b>código de 6 dígitos</b> para que puedas crear una nueva contraseña. (Revisa SPAM)
        </p>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <input
              type="email"
              placeholder="Ingresa tu correo electrónico"
              value={email}
              className="input-field"
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          
          <button 
            type="submit" 
            className="form-button"
            disabled={isLoading}
            style={{ marginTop: '15px' }}
          >
            {isLoading ? 'Enviando...' : 'Enviar código'}
          </button>
        </form>

        <div className="back-login-container" style={{ marginTop: '20px' }}>
          <Link to="/" className="back-login-link">
            Volver
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;