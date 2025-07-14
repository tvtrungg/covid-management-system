# Covid-19 Management System

A web-based platform for managing Covid-related data including patients, locations, orders, and analytics.

## 🚀 System Requirements

- **Node.js** >= 18.x
- **npm**, **yarn**, or **pnpm**
- **Git**
- **[Supabase](https://supabase.com)** account

## ⚙️ Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd covid-management-system
```

### 2. Install Dependencies

```bash
# Choose one
npm install
# or
yarn install
# or
pnpm install
```

### 3. Configure Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. From the dashboard, collect the following:

- **Settings → API**

  - `Project URL`
  - `anon public key`
  - `service_role key`
  - `JWT secret`

- **Settings → Database**

  - `Connection string` (URI format)

### 4. Set Up Environment Variables

1. Copy the example file:

```bash
cp .env.example .env.local
```

2. Open `.env.local` and replace placeholder values with your actual Supabase keys and database info.

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# JWT
JWT_SECRET=generate-a-strong-secret
JWT_REFRESH_SECRET=generate-another-strong-secret

# Environment
NODE_ENV=development
```

3. Generate Strong Secrets

```bash
# Option 1: Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Option 2: OpenSSL
openssl rand -hex 64

# Option 3: Online
https://generate-secret.vercel.app/64
```

---

### 5. Initialize the Database

Run all SQL scripts located in the `/scripts` folder, in numerical order.
You can use Supabase SQL editor or any Postgres client.

In order:

```sql
-- scripts/01-init-database.sql
-- scripts/02-seed-data.sql
-- scripts/03-add-functions.sql
-- scripts/04-auth-security-tables.sql
-- scripts/05-analytics-notifications-search.sql
```

### 6. Run the App

```bash
# Start the development server
npm run dev
# or
yarn dev
# or
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000)

### Default Accounts

| Role    | Username | Password   |
| ------- | -------- | ---------- |
| Admin   | admin    | admin   |
| Manager | manager1 | manager123 |
| User    | user1    | user123    |

## ⚠️ Troubleshooting

### Database Connection Error

```
Error: connect ECONNREFUSED
```

- Check `POSTGRES_URL` in `.env.local`
- Make sure Supabase project is running

### JWT Error

```
Error: jwt malformed
```

- Use strong, valid JWT secrets in `.env.local`

### Supabase API Error

```
Error: Invalid API key
```

- Ensure correct values in `SUPABASE_URL` and keys

## 🚢 Production Deployment

### 1. Build & Start

```bash
npm run build
npm start
```

### 2. Deploy to Vercel

- Push the project to GitHub
- Connect it to [vercel.com](https://vercel.com)
- Add environment variables via the Vercel dashboard

## 📚 References

- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com/)

## 👥 Contributors

- [Vinh Trung THIEU](https://github.com/tvtrungg)
- [Huynh Man NGUYEN](https://github.com/nhman2002)

**Happy coding! 🎉**
