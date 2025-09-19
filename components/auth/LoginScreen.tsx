
import React, { useState, FormEvent } from 'react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Card from '../ui/Card';

interface LoginScreenProps {
  onLogin: (password: string) => boolean;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const success = onLogin(password);
    if (!success) {
      setError('Contraseña inválida. Pista: intenta con "admin".');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center items-center mb-6">
            <span className="text-5xl mr-3">📦</span>
            <h1 className="text-4xl font-bold text-gray-800">MRK</h1>
        </div>
        <Card>
            <form onSubmit={handleSubmit} className="space-y-6">
                <h2 className="text-center text-2xl font-semibold text-gray-700">Bienvenido de Nuevo</h2>
                <div>
                    <Input
                        id="password"
                        label="Contraseña"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder="Ingresa tu contraseña"
                    />
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <div>
                    <Button type="submit" className="w-full" size="lg">
                    Iniciar Sesión
                    </Button>
                </div>
                 <p className="text-xs text-center text-gray-500">
                    Esta es una aplicación de demostración. Los datos se guardan localmente en tu navegador y no se comparten.
                 </p>
            </form>
        </Card>
      </div>
    </div>
  );
};

export default LoginScreen;