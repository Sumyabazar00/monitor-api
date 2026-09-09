# monitor-api

Service monitor-ийн **backend**. Энэ програм тодорхой хугацаа тутамд жагсаалтад байгаа
хаяг бүр рүү HTTP хүсэлт явуулж, юу хариулсныг Postgres-д бичдэг.

Frontend нь тусдаа repo: `monitor-web`.

## Юу хэрэгтэй вэ

- Node.js 18-аас дээш (`node -v`)
- PostgreSQL (`psql --version`)

## Нэг удаагийн тохиргоо

### 1. Postgres дээр database үүсгэх

Ubuntu дээр:

    sudo -u postgres psql -c "CREATE ROLE monitor LOGIN PASSWORD 'monitor';"
    sudo -u postgres psql -c "CREATE DATABASE monitor OWNER monitor;"

Ажиллаж байгаа эсэхийг шалга:

    psql "postgres://monitor:monitor@localhost:5432/monitor" -c "select now()"

### 2. Хүснэгтүүдээ үүсгэх

    psql "postgres://monitor:monitor@localhost:5432/monitor" -f sql/001_schema.sql

Энэ файл хоёр хүснэгт үүсгээд, хянах 5 service-ийг нэмнэ.

### 3. Тохиргооны файл

    cp .env.example .env

### 4. Package-уудаа суулгах

    npm install

## Ажиллуулах

    npm start

Terminal дээр иймэрхүү зүйл харагдана:

    Monitor API listening on http://localhost:3001
    Checking 5 services...
      Monitor API -> 200 (31ms)
      Baihgui hayg -> 404 (3ms)
      Untarsan server -> NO RESPONSE (fetch failed: ECONNREFUSED)

Энэ terminal одоо "завгүй" болно. Server ажиллаж байгаа гэсэн үг. Зогсоох бол Ctrl+C.

## Файлууд

| Файл | Юу хийдэг вэ |
|---|---|
| `src/index.js` | Server эхлүүлж, HTTP хаягуудыг (route) тодорхойлно |
| `src/poller.js` | Service бүр рүү хүсэлт явуулж, хариуг database-д бичнэ |
| `src/db.js` | Postgres-тэй холбогдоно. Энд бүх query гараар бичигдсэн, ORM байхгүй |
| `sql/001_schema.sql` | Хүснэгтүүд болон эхний өгөгдөл |

## Хаягууд

Хоёр дахь terminal нээгээд туршиж үз:

    curl -i http://localhost:3001/health
    curl -i http://localhost:3001/api/services
    curl -i http://localhost:3001/api/services/1/checks
    curl -i http://localhost:3001/api/services/1/uptime

## Database-ээ нүдээрээ харах

DBeaver нээгээд шинэ холболт үүсгэ:

| Талбар | Утга |
|---|---|
| Host | localhost |
| Port | 5432 |
| Database | monitor |
| Username | monitor |
| Password | monitor |

`checks` хүснэгтийг нээгээд server ажиллаж байх үед refresh дар. Мөр нэмэгдсээр байх ёстой.
