import { useState } from 'react';
import { toast } from 'react-hot-toast'; 
import './forgotPassword.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = (correo) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(correo);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateEmail(email)) {
      toast.error('Por favor, ingresa un correo válido');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:5000/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('¡Solicitud enviada! Revisa tu correo');
        setEmail('');
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
        <p className="forgot-description">
          Ingresa tu correo y te enviaremos un enlace para recuperar tu acceso (por carpeta SPAM)
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
          >
            {isLoading ? 'Procesando...' : 'Generar enlace'}
          </button>
        </form>

        <div className="back-login-container">
          <a href="/login" className="back-login-link">
            Volver al Login
          </a>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;