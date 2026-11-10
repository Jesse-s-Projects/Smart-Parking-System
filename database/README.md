# Smart Parking System - Database Setup

PostgreSQL database for local development and testing.

## Files

```
database/
    schema/
        db_bootstrap_v1.sql
    seeds/
        db_seed_demo_v1.sql
    README.md
```

Run the schema file first, then the seed file. Commands below assume your terminal is open at the repository root (the folder containing `database/`).

## Option 1: Docker (recommended)

Install and start Docker Desktop (or Docker Engine on Linux).

1. Start PostgreSQL:

```bash
docker run --name smart-parking-db -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=parking -e POSTGRES_DB=smart_parking -p 5432:5432 -d postgres:17
```

2. Create the tables:

```bash
docker exec -i smart-parking-db psql -v ON_ERROR_STOP=1 -U postgres -d smart_parking < database/schema/db_bootstrap_v1.sql
```

3. Add demo data:

```bash
docker exec -i smart-parking-db psql -v ON_ERROR_STOP=1 -U postgres -d smart_parking < database/seeds/db_seed_demo_v1.sql
```

On Windows, run steps 2–3 in Command Prompt or Git Bash (not PowerShell).

Later, use `docker stop smart-parking-db` to stop it and `docker start smart-parking-db` to restart it. Do not repeat `docker run` each time.

## Option 2: Windows (without Docker)

1. Install PostgreSQL for Windows. Keep port `5432` and remember the password you choose for the `postgres` user.
2. Open SQL Shell (psql) from the Start menu. Accept the defaults, enter your password, and run:

```sql
CREATE DATABASE smart_parking;
```

3. Open Command Prompt at the repository root and run (change `17` if you installed a different version):

```cmd
"C:\Program Files\PostgreSQL\17\bin\psql.exe" -v ON_ERROR_STOP=1 -U postgres -d smart_parking -f database/schema/db_bootstrap_v1.sql
"C:\Program Files\PostgreSQL\17\bin\psql.exe" -v ON_ERROR_STOP=1 -U postgres -d smart_parking -f database/seeds/db_seed_demo_v1.sql
```

Enter your PostgreSQL password when prompted.

## Option 3: Linux (Ubuntu/Debian, without Docker)

1. Install and start PostgreSQL:

```bash
sudo apt update
sudo apt install postgresql postgresql-client
sudo systemctl start postgresql
```

2. Open PostgreSQL:

```bash
sudo -u postgres psql
```

Create a local development user and database:

```sql
CREATE USER parking_dev WITH PASSWORD 'parking';
CREATE DATABASE smart_parking OWNER parking_dev;
```

Exit with `\q`.

3. At the repository root, create the tables and add demo data:

```bash
psql -h localhost -U parking_dev -d smart_parking -v ON_ERROR_STOP=1 -f database/schema/db_bootstrap_v1.sql
psql -h localhost -U parking_dev -d smart_parking -v ON_ERROR_STOP=1 -f database/seeds/db_seed_demo_v1.sql
```

Enter `parking` when prompted.

## Node.js Database Connection

**1. Install the PostgreSQL driver**

From the Node.js project directory:

```bash
npm install pg
```

**2. Configure the connection**

Create a `.env.local` file in the project root:

```env
DATABASE_URL=postgresql://postgres:parking@localhost:5432/smart_parking
```

For Linux installations, replace `postgres` with `parking_dev`. For Windows, use the password selected during PostgreSQL installation.

**3. Connect to PostgreSQL**

Example `db.js`:

```javascript
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

module.exports = pool;
```

**4. Test the connection**

```javascript
const pool = require('./db');

async function testConnection() {
    const result = await pool.query('SELECT NOW()');
    console.log('Database connected:', result.rows[0]);
    await pool.end();
}

testConnection().catch(console.error);
```

Run the test using:

```bash
node test-db.js
```

For standalone Node.js testing, load the `.env.local` file using `node --env-file=.env.local test-db.js` (Node.js 20.6+). Next.js automatically loads `.env.local`.

## Verify Demo Data

Once connected, run:

```sql
SELECT COUNT(*) FROM parking_space;
```

The result should be `16` if the demo seed was loaded successfully.

The database is now ready for backend development and testing.