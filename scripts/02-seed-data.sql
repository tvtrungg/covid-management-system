-- Insert data into provinces
INSERT INTO provinces (name) VALUES
('Hà Nội'),
('TP. Hồ Chí Minh'),
('Đà Nẵng');

-- Insert data into districts
INSERT INTO districts (name, province_id) VALUES
('Hoàn Kiếm', 1),
('Cầu Giấy', 1),
('Quận 1', 2),
('Quận 7', 2),
('Hải Châu', 3);

-- Insert data into wards
INSERT INTO wards (name, district_id) VALUES
('Hàng Bông', 1),
('Trung Hòa', 2),
('Bến Nghé', 3),
('Tân Phú', 4),
('Thanh Khê Đông', 5);

-- Insert data into treatment_locations
INSERT INTO treatment_locations (name, capacity, current_count) VALUES
('Bệnh viện Bạch Mai', 500, 100),
('Bệnh viện Chợ Rẫy', 600, 150),
('Bệnh viện Đà Nẵng', 300, 80);

-- Insert data into users
INSERT INTO users (username, password_hash, role, is_active, first_login) VALUES
('admin', '$2b$10$OzFC.pk4CKBBzttP4o0rIu73W24P8yOpFuwC5YD3NsVc6k2zscag.', 'admin', true, false),
('manager1', '$2b$10$GX37WDbeM9hwnm7wf3NU2e67bxTB.4LZVIPpOSf8ZNuGUSotZursm', 'manager', true, false),
('user1', '$2b$10$GOgeK/l1tlzEkfX328tL0.atJnN9dB1/cwRbT0.wYLnl/4t7CD9Qu', 'user', true, true);

-- Insert data into covid_people
INSERT INTO covid_people (full_name, id_number, birth_year, province_id, district_id, ward_id, status, treatment_location_id, user_id) VALUES
('Nguyễn Văn A', '123456789', 1990, 1, 1, 1, 'F0', 1, 3),
('Trần Thị B', '987654321', 1985, 2, 3, 3, 'F1', 2, NULL),
('Lê Văn C', '456789123', 1995, 3, 5, 5, 'F2', 3, NULL);

-- Insert data into covid_history
INSERT INTO covid_history (person_id, action_type, old_value, new_value, notes, created_by) VALUES
(1, 'status_change', 'F1', 'F0', 'Test positive', 1),
(2, 'location_change', NULL, 'Bệnh viện Chợ Rẫy', 'Transferred to hospital', 1);

-- Insert data into products
INSERT INTO products (name, images, price, unit) VALUES
('Gạo', ARRAY['https://example.com/rice.jpg'], 15.00, 'kg'),
('Mì gói', ARRAY['https://example.com/noodle.jpg'], 5.00, 'package'),
('Nước suối', ARRAY['https://example.com/water.jpg'], 2.00, 'bottle');

-- Insert data into packages
INSERT INTO packages (name, limit_per_person, time_limit_type, time_limit_value) VALUES
('Gói cơ bản', 2, 'month', 1),
('Gói nâng cao', 1, 'week', 1);

-- Insert data into package_products
INSERT INTO package_products (package_id, product_id, max_quantity) VALUES
(1, 1, 5),
(1, 2, 10),
(2, 3, 20);

-- Insert data into orders
INSERT INTO orders (person_id, package_id, total_amount, status) VALUES
(1, 1, 50.00, 'pending'),
(2, 2, 40.00, 'delivered');

-- Insert data into order_items
INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price) VALUES
(1, 1, 2, 15.00, 30.00),
(1, 2, 4, 5.00, 20.00),
(2, 3, 20, 2.00, 40.00);

-- Insert data into payment_accounts
INSERT INTO payment_accounts (account_id, balance, is_main_account, person_id) VALUES
('ACC001', 1000.00, true, 1),
('ACC002', 500.00, false, 2);

-- Insert data into transactions
INSERT INTO transactions (from_account_id, to_account_id, amount, transaction_type, description, status) VALUES
('ACC001', 'ACC002', 100.00, 'transfer', 'Transfer for package purchase', 'completed'),
('ACC002', NULL, 200.00, 'deposit', 'Top up account', 'completed');

-- Insert data into system_settings
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
('max_order_per_day', '5', 'Maximum number of orders per person per day'),
('default_currency', 'VND', 'Default currency for transactions');