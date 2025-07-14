-- Xóa dữ liệu cũ để tránh conflict
DELETE FROM order_items;
DELETE FROM orders;
DELETE FROM transactions WHERE from_account_id != 'MAIN_ACCOUNT' AND to_account_id != 'MAIN_ACCOUNT';
DELETE FROM payment_accounts WHERE person_id IS NOT NULL;
DELETE FROM covid_history;
DELETE FROM covid_people;
DELETE FROM users WHERE role != 'admin';

-- Tạo người dùng mẫu trước (đảm bảo ID sequence)
INSERT INTO users (id, username, password_hash, role, first_login) VALUES 
(2, 'user001', '123123', 'user', false),
(3, 'user002', '123123', 'user', false),
(4, 'manager001', '123123', 'manager', false)
ON CONFLICT (id) DO UPDATE SET
username = EXCLUDED.username,
password_hash = EXCLUDED.password_hash,
role = EXCLUDED.role,
first_login = EXCLUDED.first_login;

-- Cập nhật sequence cho users
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));

-- Tạo người liên quan Covid-19 mẫu (sử dụng user_id hợp lệ)
INSERT INTO covid_people (full_name, id_number, birth_year, province_id, district_id, ward_id, status, treatment_location_id, user_id) VALUES 
('Nguyễn Văn An', '123456789', 1985, 1, 1, 1, 'F1', 1, 2),
('Trần Thị Bình', '987654321', 1990, 2, 6, 2, 'F2', 2, 3),
('Lê Văn Cường', '456789123', 1988, 1, 2, 2, 'F0', 1, 4);

-- Tạo tài khoản thanh toán cho người dùng
INSERT INTO payment_accounts (account_id, balance, is_main_account, person_id) VALUES 
('USER_001', 500000, false, 1),
('USER_002', 750000, false, 2),
('USER_003', 300000, false, 3);

-- Bây giờ tạo đơn hàng mẫu với person_id hợp lệ
INSERT INTO orders (person_id, package_id, total_amount, status) VALUES 
(1, 1, 150000, 'pending'),
(1, 2, 280000, 'paid'),
(2, 1, 120000, 'delivered'),
(3, 3, 95000, 'pending');

-- Tạo chi tiết đơn hàng
INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price) VALUES 
-- Đơn hàng 1
(1, 1, 5, 25000, 125000),
(1, 7, 5, 4000, 20000),
(1, 3, 1, 15000, 15000),
-- Đơn hàng 2
(2, 1, 10, 25000, 250000),
(2, 2, 1, 120000, 120000),
-- Đơn hàng 3
(3, 1, 3, 25000, 75000),
(3, 3, 2, 15000, 30000),
(3, 7, 3, 4000, 12000),
-- Đơn hàng 4
(4, 2, 1, 120000, 120000),
(4, 4, 5, 3500, 17500);

-- Tạo giao dịch thanh toán mẫu
INSERT INTO transactions (from_account_id, to_account_id, amount, transaction_type, description, status) VALUES 
-- Nạp tiền
('EXTERNAL', 'USER_001', 500000, 'deposit', 'Nạp tiền vào tài khoản', 'completed'),
('EXTERNAL', 'USER_002', 750000, 'deposit', 'Nạp tiền vào tài khoản', 'completed'),
('EXTERNAL', 'USER_003', 300000, 'deposit', 'Nạp tiền vào tài khoản', 'completed'),
-- Thanh toán
('USER_001', 'MAIN_ACCOUNT', 280000, 'payment', 'Thanh toán đơn hàng #2', 'completed'),
('USER_002', 'MAIN_ACCOUNT', 120000, 'payment', 'Thanh toán đơn hàng #3', 'completed');

-- Cập nhật số dư tài khoản sau giao dịch
UPDATE payment_accounts SET balance = 220000 WHERE account_id = 'USER_001';
UPDATE payment_accounts SET balance = 630000 WHERE account_id = 'USER_002';
UPDATE payment_accounts SET balance = 400000 WHERE account_id = 'MAIN_ACCOUNT';

-- Tạo lịch sử quản lý Covid
INSERT INTO covid_history (person_id, action_type, old_value, new_value, notes, created_by) VALUES 
(1, 'status_change', 'F2', 'F1', 'Chuyển từ F2 sang F1 sau kết quả xét nghiệm', 1),
(2, 'location_change', NULL, 'Bệnh viện Chợ Rẫy', 'Chuyển vào điều trị tại bệnh viện', 1),
(3, 'status_change', 'F1', 'F0', 'Xác nhận dương tính Covid-19', 1);

-- Cập nhật số lượng hiện tại tại các địa điểm điều trị
UPDATE treatment_locations SET current_count = (
    SELECT COUNT(*) 
    FROM covid_people 
    WHERE treatment_location_id = treatment_locations.id
);
