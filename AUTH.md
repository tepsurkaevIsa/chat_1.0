# Система авторизации Chat MVP

## 🔐 Типы авторизации

### 1. Регистрация с паролем
- **Endpoint**: `POST /auth/register`
- **Поля**: username, password
- **Валидация**: 
  - Username: 3-20 символов
  - Password: минимум 6 символов
- **Безопасность**: Пароли хешируются с bcrypt

### 2. Вход с паролем
- **Endpoint**: `POST /auth/login`
- **Поля**: username, password
- **Проверка**: Сравнение с хешированным паролем

<!-- Гостевой режим удален: вход доступен только по логину и паролю -->

## 🛡️ Безопасность

### Хеширование паролей
```javascript
// Сервер использует bcrypt с солью
const hashedPassword = await bcrypt.hash(password, 10);
const isValid = await bcrypt.compare(password, hashedPassword);
```

### JWT токены
- **Срок действия**: 24 часа
- **Секретный ключ**: Настраивается через JWT_SECRET
- **Payload**: { userId, iat, exp }

### Валидация на клиенте
- Минимальная длина пароля: 6 символов
- Максимальная длина username: 20 символов
- Проверка совпадения паролей при регистрации

## 📱 UI компоненты

### LoginForm
- Поля: username, password
- Кнопка перехода к регистрации
- Валидация в реальном времени

### RegisterForm
- Поля: username, password, confirmPassword
- Показ/скрытие паролей
- Валидация совпадения паролей
- Кнопка перехода к входу

## 🔄 Поток авторизации

### Регистрация
1. Пользователь заполняет форму регистрации
2. Клиент валидирует данные
3. Отправка POST /auth/register
4. Сервер хеширует пароль и создает пользователя
5. Возврат JWT токена и данных пользователя
6. Сохранение в localStorage
7. Подключение к WebSocket

### Вход
1. Пользователь заполняет форму входа
2. Клиент валидирует данные
3. Отправка POST /auth/login
4. Сервер проверяет пароль
5. Возврат JWT токена и данных пользователя
6. Сохранение в localStorage
7. Подключение к WebSocket

<!-- Раздел гостевого режима удален -->

## 🗄️ Хранение данных

### localStorage
```javascript
localStorage.setItem('chatToken', token);
localStorage.setItem('chatUser', JSON.stringify(user));
```

### Серверное хранилище
- **In-memory**: Пользователи хранятся в Map
- **Пароли**: Хешированные с bcrypt
- **Метаданные**: createdAt, isOnline, lastSeen

## 🔧 API Reference

### POST /auth/register
```json
{
  "username": "string (3-20 chars)",
  "password": "string (min 6 chars)"
}
```

**Response (200)**:
```json
{
  "token": "jwt_token",
  "user": {
    "id": "string",
    "username": "string",
    "isOnline": true,
    "createdAt": "ISO_date"
  }
}
```

**Response (400)**:
```json
{
  "error": "User already exists"
}
```

### POST /auth/login
```json
{
  "username": "string",
  "password": "string"
}
```

**Response (200)**:
```json
{
  "token": "jwt_token",
  "user": { ... }
}
```

**Response (401)**:
```json
{
  "error": "Invalid username or password"
}
```

<!-- Endpoint /auth/guest удален -->

## 🚀 Использование

### Регистрация нового пользователя
```javascript
const response = await apiClient.register('newuser', 'password123');
```

### Вход существующего пользователя
```javascript
const response = await apiClient.login('existinguser', 'password123');
```

<!-- Пример гостевого входа удален -->

## 🔒 Безопасность в продакшене

### Рекомендации
1. **JWT_SECRET**: Используйте криптографически стойкий секрет
2. **HTTPS**: Обязательно в продакшене
3. **Rate Limiting**: Ограничьте попытки входа
4. **Валидация**: Строгая валидация на сервере
5. **Логирование**: Логируйте попытки входа

### Переменные окружения
```bash
JWT_SECRET=your-super-secret-key-here
NODE_ENV=production
```

## 🐛 Обработка ошибок

### Клиентская валидация
- Пустые поля
- Неправильная длина
- Несовпадение паролей
- Сетевые ошибки

### Серверная валидация
- Дублирование пользователей
- Неправильные пароли
- Некорректные данные
- Внутренние ошибки

## 📊 Статистика

### Метрики безопасности
- Количество попыток входа
- Неудачные попытки
- Новые регистрации
- Активные пользователи

### Мониторинг
- Логи авторизации
- Подозрительная активность
- Производительность bcrypt
- Использование памяти