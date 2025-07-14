# Covid-19 Management System

## **Yêu cầu Hệ thống**

### Phần mềm cần thiết:

- **Node.js** >= 18.0.0
- **npm** hoặc **yarn** hoặc **pnpm**
- **Git**
- **Tài khoản Supabase** (miễn phí)


## **Bước 1: Thiết lập Dự án**

### 1.1 Clone hoặc Download dự án

```bash
# Nếu có Git repository
git clone <repository-url>
cd covid-management-system

# Hoặc tạo thư mục mới và copy code
mkdir covid-management-system
cd covid-management-system
```

### 1.2 Cài đặt Dependencies

```bash
# Sử dụng npm
npm install

# Hoặc sử dụng yarn
yarn install

# Hoặc sử dụng pnpm
pnpm install
```

## ️ **Bước 2: Thiết lập Supabase**

### 2.1 Tạo Project Supabase

1. Truy cập [supabase.com](https://supabase.com)
2. Đăng ký/Đăng nhập tài khoản
3. Click **"New Project"**
4. Chọn Organization và nhập thông tin:

1. **Name**: `covid-management-system`
2. **Database Password**: Tạo mật khẩu mạnh (lưu lại)
3. **Region**: Chọn gần nhất với vị trí của bạn



5. Click **"Create new project"**
6. Đợi 2-3 phút để project được khởi tạo


### 2.2 Lấy thông tin kết nối

Sau khi project được tạo:

1. Vào **Settings** → **API**
2. Copy các thông tin sau:

1. **Project URL** (dạng: `https://xxx.supabase.co`)
2. **anon public key** (dạng: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)
3. **service_role key** (dạng: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)



3. Vào **Settings** → **Database**
4. Copy **Connection string** (URI format)


## **Bước 3: Cấu hình Biến Môi trường**

### 3.1 Tạo file .env.local

Tạo file `.env.local` trong thư mục gốc của dự án:

```bash
touch .env.local
```

### 3.2 Thêm các biến môi trường

Mở file `.env.local` và thêm:

```javascript
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Database Configuration (từ Supabase Settings → Database)
POSTGRES_URL=postgresql://postgres:[YOUR-PASSWORD]@db.your-project-id.supabase.co:5432/postgres
POSTGRES_PRISMA_URL=postgresql://postgres:[YOUR-PASSWORD]@db.your-project-id.supabase.co:5432/postgres?pgbouncer=true&connect_timeout=15
POSTGRES_URL_NON_POOLING=postgresql://postgres:[YOUR-PASSWORD]@db.your-project-id.supabase.co:5432/postgres
POSTGRES_USER=postgres
POSTGRES_HOST=db.your-project-id.supabase.co
POSTGRES_PASSWORD=your-database-password
POSTGRES_DATABASE=postgres

# JWT Secrets (Tạo random strings mạnh)
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random
JWT_REFRESH_SECRET=your-super-secret-refresh-key-here-make-it-different

# Supabase JWT Secret (từ Supabase Settings → API → JWT Settings)
SUPABASE_JWT_SECRET=your-supabase-jwt-secret
SUPABASE_ANON_KEY=your-anon-key-here

# Environment
NODE_ENV=development
```

### 3.3 Tạo JWT Secrets mạnh

Sử dụng một trong các cách sau để tạo JWT secrets:

```bash
# Cách 1: Sử dụng Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Cách 2: Sử dụng OpenSSL (nếu có)
openssl rand -hex 64

# Cách 3: Online generator
# Truy cập: https://generate-secret.vercel.app/64
```

## ️ **Bước 4: Thiết lập Database**

### 4.1 Chạy SQL Scripts

Chạy các script SQL để khởi tạo và cấu hình database:

1. **Chạy script khởi tạo database:**

```sql
-- Chạy scripts/01-init-database.sql
```


2. **Chạy script seed data:**

```sql
-- Chạy scripts/02-seed-data.sql
```


3. **Chạy các script bổ sung theo thứ tự:**

```sql
-- scripts/03-add-functions.sql
-- scripts/04-fix-sample-data.sql
-- scripts/05-fix-foreign-keys.sql
-- scripts/06-fix-transactions.sql
-- scripts/07-auth-security-tables.sql
-- scripts/08-analytics-notifications-search.sql
```




### 4.2 Kiểm tra Database

Sau khi chạy scripts, kiểm tra trong Supabase Dashboard:

1. Vào **Table Editor**
2. Xem các bảng đã được tạo:

1. `users`, `covid_people`, `provinces`, `districts`, `wards`
2. `treatment_locations`, `products`, `packages`, `orders`
3. `payment_accounts`, `transactions`
4. `user_sessions`, `audit_logs`, `notifications`





## **Bước 5: Chạy Dự án**

### 5.1 Development Mode

```bash
# Chạy development server
npm run dev

# Hoặc
yarn dev

# Hoặc
pnpm dev
```

### 5.2 Truy cập ứng dụng

Mở trình duyệt và truy cập:

- **URL**: `http://localhost:3000`
- **Tài khoản mặc định**:

- Admin: `admin` / `admin123`
- Manager: `manager1` / `manager123`
- User: `user1` / `user123`





## **Bước 6: Kiểm tra Chức năng**

### 6.1 Test Authentication

1. Truy cập `/login`
2. Đăng nhập với tài khoản admin
3. Kiểm tra dashboard admin


### 6.2 Test Database Connection

1. Vào trang Admin
2. Thử tạo Manager mới
3. Kiểm tra dữ liệu trong Supabase


### 6.3 Test API Endpoints

```bash
# Test health check
curl http://localhost:3000/api/health

# Test login API
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

## ️ **Bước 7: Cấu hình Nâng cao**

### 7.1 Email Configuration (Tùy chọn)

Nếu muốn gửi email thật:

```plaintext
# Thêm vào .env.local
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=your-email@gmail.com
```

### 7.2 File Upload Configuration

```plaintext
# Supabase Storage
NEXT_PUBLIC_SUPABASE_STORAGE_URL=https://your-project-id.supabase.co/storage/v1
```

### 7.3 Rate Limiting Configuration

```plaintext
# Redis (nếu có)
REDIS_URL=redis://localhost:6379
```

## **Troubleshooting**

### Lỗi thường gặp:

#### 1. Database Connection Error

```plaintext
Error: connect ECONNREFUSED
```

**Giải pháp:**

- Kiểm tra POSTGRES_URL trong .env.local
- Đảm bảo Supabase project đang chạy
- Kiểm tra mật khẩu database


#### 2. JWT Error

```plaintext
Error: jwt malformed
```

**Giải pháp:**

- Tạo lại JWT_SECRET và JWT_REFRESH_SECRET
- Đảm bảo secrets đủ dài (ít nhất 32 ký tự)


#### 3. Supabase API Error

```plaintext
Error: Invalid API key
```

**Giải pháp:**

- Kiểm tra NEXT_PUBLIC_SUPABASE_URL
- Kiểm tra SUPABASE_SERVICE_ROLE_KEY
- Đảm bảo không có khoảng trắng thừa


#### 4. Build Error

```plaintext
Module not found
```

**Giải pháp:**

```bash
# Xóa node_modules và reinstall
rm -rf node_modules package-lock.json
npm install
```

## **Bước 8: Production Deployment**

### 8.1 Build Production

```bash
npm run build
npm start
```

### 8.2 Environment Variables cho Production

```plaintext
NODE_ENV=production
NEXTAUTH_URL=https://your-domain.com
```

### 8.3 Deploy lên Vercel

1. Push code lên GitHub
2. Connect với Vercel
3. Thêm environment variables trong Vercel dashboard
4. Deploy


## **Tài liệu Tham khảo**

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com/)


## **Hỗ trợ**

Nếu gặp vấn đề:

1. Kiểm tra console logs
2. Kiểm tra Network tab trong DevTools
3. Xem Supabase logs trong dashboard
4. Kiểm tra file .env.local


**Chúc bạn triển khai thành công! 🎉**

SuggestionsClose suggestions[data-radix-scroll-area-viewport]{scrollbar-width:none;-ms-overflow-style:none;-webkit-overflow-scrolling:touch;}[data-radix-scroll-area-viewport]::-webkit-scrollbar{display:none}Add IntegrationTạo Docker SetupSetup CI/CD PipelineMonitoring SetupPerformance OptimizationSecurity HardeningScroll leftScroll right