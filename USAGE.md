# Использование Chat MVP

## Быстрый старт

### Вариант 1: Автоматический запуск
```bash
cd /workspace
./start.sh
```

### Вариант 2: Ручной запуск

1. **Запуск сервера:**
```bash
cd server
npm install
npm start
```

2. **Запуск клиента (в новом терминале):**
```bash
cd client
npm install
npm run dev
```

## Тестирование

1. Откройте браузер и перейдите на http://localhost:3000
2. Введите имя пользователя (например, "Alice")
3. Выберите другого пользователя из списка для начала чата
4. Отправьте сообщение

## Демо пользователи

При первом запуске доступны:
- Alice
- Bob  
- Charlie
- Diana
- Eve

## API тестирование

### Health Check
```bash
curl http://localhost:3001/health
```

### Аутентификация
```bash
curl -X POST http://localhost:3001/auth/guest \
  -H "Content-Type: application/json" \
  -d '{"username":"TestUser"}'
```

### Список пользователей
```bash
curl http://localhost:3001/users
```

## Особенности

- **Реал-тайм**: Сообщения доставляются мгновенно
- **Онлайн статус**: Видно кто онлайн/оффлайн
- **Индикатор печати**: "Someone is typing..."
- **История**: Загружается при входе в диалог
- **Автопрокрутка**: К новым сообщениям
- **Rate limiting**: Максимум 5 сообщений/сек
- **Переподключение**: Автоматическое при потере связи

## Структура

```
/workspace/
├── client/          # React фронтенд (порт 3000)
├── server/          # Node.js бэкенд (порт 3001)
├── start.sh         # Скрипт запуска
├── README.md        # Основная документация
└── USAGE.md         # Инструкция по использованию
```

## Остановка

Нажмите `Ctrl+C` в терминале где запущен скрипт, или:

```bash
pkill -f "node dist/index.js"
pkill -f "vite"
```

## Устранение проблем

### Порт занят
```bash
# Найти процесс
lsof -i :3001
lsof -i :3000

# Убить процесс
kill -9 <PID>
```

### Очистка
```bash
# Очистить node_modules
rm -rf client/node_modules server/node_modules

# Переустановить
npm run install:all
```

## Логи

- Сервер: вывод в консоль
- Клиент: DevTools Console (F12)
- WebSocket: Network tab в DevTools