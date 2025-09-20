import { useState } from 'react';
import { MessageCircle, Eye, EyeOff } from 'lucide-react';
import { ThemeToggle } from './ui/ThemeToggle';

interface RegisterFormProps {
  onRegister: (username: string, password: string) => void;
  onSwitchToLogin: () => void;
  isLoading: boolean;
}

export function RegisterForm({ onRegister, onSwitchToLogin, isLoading }: RegisterFormProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!username.trim()) {
      newErrors.username = 'Требуется имя пользователя';
    } else if (username.length < 3) {
      newErrors.username = 'Имя пользователя должно быть не короче 3 символов';
    } else if (username.length > 20) {
      newErrors.username = 'Имя пользователя должно быть короче 20 символов';
    }

    if (!password) {
      newErrors.password = 'Требуется пароль';
    } else if (password.length < 6) {
      newErrors.password = 'Пароль должен быть не короче 6 символов';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Подтвердите пароль';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Пароли не совпадают';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onRegister(username.trim(), password);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 flex items-center justify-center p-4 relative">
      <div className="absolute top-3 right-3">
        <ThemeToggle />
      </div>
      <div className="max-w-md w-full space-y-6 sm:space-y-8 p-4 sm:p-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 sm:h-16 sm:w-16 bg-primary-600 rounded-full flex items-center justify-center shadow-sm">
            <MessageCircle className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
          </div>
          <h2 className="mt-4 sm:mt-6 text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Создать аккаунт
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Зарегистрируйтесь, чтобы начать общение
          </p>
        </div>
        
        <form className="mt-6 sm:mt-8 space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Имя пользователя
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={`relative block w-full px-3 py-3 sm:py-2 border ${
                errors.username ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'
              } placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white/80 dark:bg-gray-900/60 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 text-base sm:text-sm backdrop-blur`}
              placeholder="Введите имя пользователя"
              maxLength={20}
              disabled={isLoading}
            />
            {errors.username && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.username}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Пароль
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`relative block w-full px-3 py-3 sm:py-2 pr-10 border ${
                  errors.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'
                } placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white/80 dark:bg-gray-900/60 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 text-base sm:text-sm backdrop-blur`}
                placeholder="Введите пароль"
                disabled={isLoading}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password}</p>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Подтверждение пароля
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`relative block w-full px-3 py-3 sm:py-2 pr-10 border ${
                  errors.confirmPassword ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'
                } placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white/80 dark:bg-gray-900/60 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 text-base sm:text-sm backdrop-blur`}
                placeholder="Подтвердите пароль"
                disabled={isLoading}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.confirmPassword}</p>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 sm:py-2 px-4 border border-transparent text-base sm:text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed shadow"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Создание аккаунта...
                </div>
              ) : (
                'Создать аккаунт'
              )}
            </button>
          </div>
        </form>

        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Уже есть аккаунт?{' '}
            <button
              onClick={onSwitchToLogin}
              className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
            >
              Войти
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}