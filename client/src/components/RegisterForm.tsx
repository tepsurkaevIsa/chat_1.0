import { useState } from 'react';
import { MessageCircle, Eye, EyeOff } from 'lucide-react';
import { ThemeToggle } from './ui/ThemeToggle';
import styles from './AuthForm.module.css';

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
    <div className={styles.page}>
      <div className={styles.toggle}>
        <ThemeToggle />
      </div>
      <div className={styles.card}>
        <div className={styles.brand}>
          <div className={styles.brandIcon}>
            <MessageCircle width={32} height={32} color="#ffffff" />
          </div>
          <h2 className={styles.brandTitle}>Создать аккаунт</h2>
          <p className={styles.brandText}>Зарегистрируйтесь, чтобы начать общение</p>
        </div>
        
        <form className={styles.form} onSubmit={handleSubmit}>
          <div>
            <label htmlFor="username" className={styles.label}>Имя пользователя</label>
            <input
              id="username"
              name="username"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={styles.input}
              placeholder="Введите имя пользователя"
              maxLength={20}
              disabled={isLoading}
            />
            {errors.username && (
              <p className={styles.errorText}>{errors.username}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className={styles.label}>Пароль</label>
            <div className={styles.inputWrap}>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={styles.input}
                placeholder="Введите пароль"
                disabled={isLoading}
              />
              <button
                type="button"
                className={styles.togglePass}
                onClick={() => setShowPassword(!showPassword)}
                aria-label="Показать пароль"
              >
                {showPassword ? (
                  <EyeOff width={20} height={20} />
                ) : (
                  <Eye width={20} height={20} />
                )}
              </button>
            </div>
            {errors.password && (
              <p className={styles.errorText}>{errors.password}</p>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className={styles.label}>Подтверждение пароля</label>
            <div className={styles.inputWrap}>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={styles.input}
                placeholder="Подтвердите пароль"
                disabled={isLoading}
              />
              <button
                type="button"
                className={styles.togglePass}
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label="Показать пароль"
              >
                {showConfirmPassword ? (
                  <EyeOff width={20} height={20} />
                ) : (
                  <Eye width={20} height={20} />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className={styles.errorText}>{errors.confirmPassword}</p>
            )}
          </div>

          <div>
            <button type="submit" disabled={isLoading} className={styles.submit}>
              {isLoading ? 'Создание аккаунта...' : 'Создать аккаунт'}
            </button>
          </div>
        </form>

        <div className={styles.switch}>
          Уже есть аккаунт?{' '}
          <button onClick={onSwitchToLogin} className={styles.switchBtn}>
            Войти
          </button>
        </div>
      </div>
    </div>
  );
}