-- Tạo bảng provinces (Tỉnh/Thành phố)
CREATE TABLE IF NOT EXISTS provinces (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tạo bảng districts (Quận/Huyện)
CREATE TABLE IF NOT EXISTS districts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    province_id INTEGER REFERENCES provinces(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tạo bảng wards (Phường/Xã)
CREATE TABLE IF NOT EXISTS wards (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    district_id INTEGER REFERENCES districts(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tạo bảng treatment_locations (Địa điểm điều trị/cách ly)
CREATE TABLE IF NOT EXISTS treatment_locations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    capacity INTEGER NOT NULL DEFAULT 0,
    current_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tạo bảng users (Tài khoản người dùng)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    role VARCHAR(50) NOT NULL DEFAULT 'user', -- admin, manager, user
    is_active BOOLEAN DEFAULT true,
    first_login BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tạo bảng covid_people (Người liên quan Covid-19)
CREATE TABLE IF NOT EXISTS covid_people (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    id_number VARCHAR(20) UNIQUE NOT NULL,
    birth_year INTEGER NOT NULL,
    province_id INTEGER REFERENCES provinces(id),
    district_id INTEGER REFERENCES districts(id),
    ward_id INTEGER REFERENCES wards(id),
    status VARCHAR(10) NOT NULL DEFAULT 'F3', -- F0, F1, F2, F3
    treatment_location_id INTEGER REFERENCES treatment_locations(id),
    related_person_id INTEGER REFERENCES covid_people(id),
    user_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tạo bảng covid_history (Lịch sử quản lý Covid)
CREATE TABLE IF NOT EXISTS covid_history (
    id SERIAL PRIMARY KEY,
    person_id INTEGER REFERENCES covid_people(id),
    action_type VARCHAR(100) NOT NULL, -- status_change, location_change, etc.
    old_value VARCHAR(255),
    new_value VARCHAR(255),
    notes TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tạo bảng products (Sản phẩm nhu yếu phẩm)
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    images TEXT[], -- Array of image URLs
    price DECIMAL(10,2) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tạo bảng packages (Gói nhu yếu phẩm)
CREATE TABLE IF NOT EXISTS packages (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    limit_per_person INTEGER NOT NULL DEFAULT 1,
    time_limit_type VARCHAR(20) NOT NULL DEFAULT 'month', -- day, week, month
    time_limit_value INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tạo bảng package_products (Sản phẩm trong gói)
CREATE TABLE IF NOT EXISTS package_products (
    id SERIAL PRIMARY KEY,
    package_id INTEGER REFERENCES packages(id),
    product_id INTEGER REFERENCES products(id),
    max_quantity INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tạo bảng orders (Đơn hàng)
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    person_id INTEGER REFERENCES covid_people(id),
    package_id INTEGER REFERENCES packages(id),
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, paid, delivered
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tạo bảng order_items (Chi tiết đơn hàng)
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id),
    product_id INTEGER REFERENCES products(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tạo bảng payment_accounts (Tài khoản thanh toán)
CREATE TABLE IF NOT EXISTS payment_accounts (
    id SERIAL PRIMARY KEY,
    account_id VARCHAR(255) UNIQUE NOT NULL,
    balance DECIMAL(15,2) NOT NULL DEFAULT 0,
    is_main_account BOOLEAN DEFAULT false,
    person_id INTEGER REFERENCES covid_people(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tạo bảng transactions (Giao dịch thanh toán)
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    from_account_id VARCHAR(255) REFERENCES payment_accounts(account_id),
    to_account_id VARCHAR(255) REFERENCES payment_accounts(account_id),
    amount DECIMAL(15,2) NOT NULL,
    transaction_type VARCHAR(50) NOT NULL, -- payment, deposit, transfer
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'completed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tạo bảng system_settings (Cài đặt hệ thống)
CREATE TABLE IF NOT EXISTS system_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(255) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
