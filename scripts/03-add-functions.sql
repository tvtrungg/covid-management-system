-- Function to increment treatment location count
CREATE OR REPLACE FUNCTION increment_location_count(location_id INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE treatment_locations 
    SET current_count = current_count + 1,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = location_id;
END;
$$ LANGUAGE plpgsql;

-- Function to decrement treatment location count
CREATE OR REPLACE FUNCTION decrement_location_count(location_id INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE treatment_locations 
    SET current_count = GREATEST(current_count - 1, 0),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = location_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get package purchase count for a person in time period
CREATE OR REPLACE FUNCTION get_package_purchase_count(
    p_person_id INTEGER,
    p_package_id INTEGER,
    p_time_limit_type VARCHAR,
    p_time_limit_value INTEGER
)
RETURNS INTEGER AS $$
DECLARE
    start_date TIMESTAMP;
    purchase_count INTEGER;
BEGIN
    -- Calculate start date based on time limit
    CASE p_time_limit_type
        WHEN 'day' THEN
            start_date := CURRENT_TIMESTAMP - (p_time_limit_value || ' days')::INTERVAL;
        WHEN 'week' THEN
            start_date := CURRENT_TIMESTAMP - (p_time_limit_value * 7 || ' days')::INTERVAL;
        WHEN 'month' THEN
            start_date := CURRENT_TIMESTAMP - (p_time_limit_value || ' months')::INTERVAL;
        ELSE
            start_date := CURRENT_TIMESTAMP - '1 month'::INTERVAL;
    END CASE;

    -- Count purchases in the time period
    SELECT COUNT(*)
    INTO purchase_count
    FROM orders
    WHERE person_id = p_person_id
      AND package_id = p_package_id
      AND created_at >= start_date;

    RETURN purchase_count;
END;
$$ LANGUAGE plpgsql;

-- Add some sample order data for testing
INSERT INTO orders (person_id, package_id, total_amount, status) VALUES 
(1, 1, 150000, 'pending'),
(1, 2, 280000, 'paid');

INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price) VALUES 
(1, 1, 5, 25000, 125000),
(1, 2, 5, 4000, 20000), -- Sửa product_id từ 7 thành 2
(1, 3, 1, 15000, 15000),
(2, 1, 10, 25000, 250000),
(2, 2, 1, 120000, 120000);