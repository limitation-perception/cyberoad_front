# cyberoad_front

Фронтенд для **cyberoad**, roadmap для підготовки до CTF-змагань. Можна обрати категорію (Web, Crypto, Pwn…), переглянути її типи завдань і відкрити статті та відео для вивчення кожної теми. Також на сайті можна додавати, редагувати й видаляти категорії, типи завдань і матеріали.

Написано на HTML, CSS і jQuery. Дані фронтенд отримує з бекенду [cybersec_roadmap](https://github.com/limitation-perception/cybersec_roadmap) через REST API.

## Адреси та порти

| Що | Адреса |
|---|---|
| Фронтенд | http://localhost:5173 |
| Бекенд (API) | http://127.0.0.1:8000 |

Адреса бекенду задана в константі `API_URL` у файлі [script.js](script.js).

## Як запустити проєкт

1. Запустіть бекенд за інструкцією з його [README](https://github.com/limitation-perception/cybersec_roadmap). Сервер має працювати на http://127.0.0.1:8000.
2. Склонуйте репозиторій і перейдіть у теку:

   ```bash
   git clone https://github.com/limitation-perception/cyberoad_front.git
   cd cyberoad_front
   ```

3. Запустіть статичний сервер на порту 5173:

   ```bash
   python -m http.server 5173
   ```

4. Відкрийте в браузері http://localhost:5173.

Відкривайте `http://localhost:5173` або `http://127.0.0.1:5173`. Посилання `http://0.0.0.0:5173`, яке пише в терміналі `http.server`, не підійде: цієї адреси немає в CORS-налаштуваннях бекенду, і браузер заблокує запити до API.
