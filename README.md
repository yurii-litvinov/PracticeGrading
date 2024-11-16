# PracticeGrading

![GitHub Actions CI](https://github.com/yurii-litvinov/PracticeGrading/actions/workflows/ci.yml/badge.svg)

Веб-приложение для оценивания учебных практик и ВКР во время защиты

## Локальная сборка и запуск

1. Установите необходимые инструменты:
    * [PostgreSQL](https://www.postgresql.org/download/)
    * [.NET SDK](https://dotnet.microsoft.com/en-us/download/dotnet)
    * [Node.js](https://nodejs.org)
2. Клонируйте репозиторий:
   ```shell
   git clone https://github.com/yurii-litvinov/PracticeGrading.git
   ```
3. Инициализируйте базу данных:
   ```shell
   psql -U postgres -d postgres -f PracticeGrading.Data/init_database.sql
   ```
4. Соберите и запустите сервер:
   ```shell
   cd PracticeGrading.API
   dotnet restore
   dotnet build
   dotnet run
   ```
5. Запустите клиент:
   ```shell
   cd ../frontend
   npm install
   npm run dev
   ```
   
## Сборка и запуск в Docker
1. Убедитесь, что у вас установлен [Docker](https://www.docker.com).
2. Клонируйте репозиторий:
   ```shell
   git clone https://github.com/yurii-litvinov/PracticeGrading.git
   ```
3. Соберите Docker-образы:
   ```shell
   docker-compose build
   ```
4. Запустите контейнеры:
   ```shell
   docker-compose up -d
   ```
5. Для остановки контейнеров выполните следующую команду:
   ```shell
   docker-compose down
   ```

## Данные для входа

**Логин:** admin  
**Пароль:** admin