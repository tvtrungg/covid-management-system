-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'info', -- info, success, warning, error
    category VARCHAR(50) NOT NULL DEFAULT 'general', -- general, covid, order, payment, system
    is_read BOOLEAN DEFAULT false,
    action_url VARCHAR(500),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP
);

-- Create notification preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    email_enabled BOOLEAN DEFAULT true,
    sms_enabled BOOLEAN DEFAULT false,
    push_enabled BOOLEAN DEFAULT true,
    categories JSONB DEFAULT '{"general": true, "covid": true, "order": true, "payment": true, "system": true}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create search history table
CREATE TABLE IF NOT EXISTS search_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    query VARCHAR(500) NOT NULL,
    filters JSONB,
    results_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create analytics cache table for performance
CREATE TABLE IF NOT EXISTS analytics_cache (
    id SERIAL PRIMARY KEY,
    cache_key VARCHAR(255) UNIQUE NOT NULL,
    data JSONB NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create email templates table
CREATE TABLE IF NOT EXISTS email_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    subject VARCHAR(255) NOT NULL,
    html_content TEXT NOT NULL,
    text_content TEXT,
    variables JSONB, -- Available template variables
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_search_history_user_id ON search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_search_history_created_at ON search_history(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_cache_key ON analytics_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_analytics_cache_expires_at ON analytics_cache(expires_at);

-- Full-text search indexes
CREATE INDEX IF NOT EXISTS idx_covid_people_search ON covid_people USING gin(to_tsvector('english', full_name || ' ' || id_number));
CREATE INDEX IF NOT EXISTS idx_products_search ON products USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_packages_search ON packages USING gin(to_tsvector('english', name));

-- Insert default email templates
INSERT INTO email_templates (name, subject, html_content, text_content, variables) VALUES 
(
    'password_reset',
    'Đặt lại mật khẩu - Hệ thống quản lý Covid-19',
    '<h2>Đặt lại mật khẩu</h2><p>Xin chào {{username}},</p><p>Bạn đã yêu cầu đặt lại mật khẩu. Nhấp vào liên kết bên dưới để đặt lại:</p><p><a href="{{reset_url}}">Đặt lại mật khẩu</a></p><p>Liên kết này sẽ hết hạn sau 1 giờ.</p>',
    'Xin chào {{username}}, Bạn đã yêu cầu đặt lại mật khẩu. Truy cập: {{reset_url}}',
    '["username", "reset_url"]'
),
(
    'order_confirmation',
    'Xác nhận đơn hàng #{{order_id}}',
    '<h2>Đơn hàng đã được tạo</h2><p>Xin chào {{customer_name}},</p><p>Đơn hàng #{{order_id}} của bạn đã được tạo thành công.</p><p>Tổng tiền: {{total_amount}} VNĐ</p><p>Trạng thái: {{status}}</p>',
    'Đơn hàng #{{order_id}} đã được tạo. Tổng tiền: {{total_amount}} VNĐ',
    '["customer_name", "order_id", "total_amount", "status"]'
),
(
    'covid_status_change',
    'Thay đổi trạng thái Covid-19',
    '<h2>Thông báo thay đổi trạng thái</h2><p>Xin chào {{person_name}},</p><p>Trạng thái Covid-19 của bạn đã được cập nhật từ {{old_status}} thành {{new_status}}.</p><p>Ghi chú: {{notes}}</p>',
    'Trạng thái Covid-19 đã thay đổi từ {{old_status}} thành {{new_status}}',
    '["person_name", "old_status", "new_status", "notes"]'
);

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
    p_user_id INTEGER,
    p_title VARCHAR(255),
    p_message TEXT,
    p_type VARCHAR(50) DEFAULT 'info',
    p_category VARCHAR(50) DEFAULT 'general',
    p_action_url VARCHAR(500) DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    notification_id INTEGER;
BEGIN
    INSERT INTO notifications (user_id, title, message, type, category, action_url, metadata)
    VALUES (p_user_id, p_title, p_message, p_type, p_category, p_action_url, p_metadata)
    RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get analytics data with caching
CREATE OR REPLACE FUNCTION get_cached_analytics(
    p_cache_key VARCHAR(255),
    p_query TEXT,
    p_cache_duration INTERVAL DEFAULT '1 hour'
)
RETURNS JSONB AS $$
DECLARE
    cached_data JSONB;
    fresh_data JSONB;
BEGIN
    -- Try to get from cache
    SELECT data INTO cached_data
    FROM analytics_cache
    WHERE cache_key = p_cache_key AND expires_at > CURRENT_TIMESTAMP;
    
    IF cached_data IS NOT NULL THEN
        RETURN cached_data;
    END IF;
    
    -- Execute query and cache result
    EXECUTE p_query INTO fresh_data;
    
    -- Store in cache
    INSERT INTO analytics_cache (cache_key, data, expires_at)
    VALUES (p_cache_key, fresh_data, CURRENT_TIMESTAMP + p_cache_duration)
    ON CONFLICT (cache_key) DO UPDATE SET
        data = EXCLUDED.data,
        expires_at = EXCLUDED.expires_at;
    
    RETURN fresh_data;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old data
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void AS $$
BEGIN
    -- Clean up old notifications (older than 3 months)
    DELETE FROM notifications WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '3 months';
    
    -- Clean up old search history (older than 1 month)
    DELETE FROM search_history WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '1 month';
    
    -- Clean up expired cache
    DELETE FROM analytics_cache WHERE expires_at < CURRENT_TIMESTAMP;
    
    -- Clean up old audit logs (older than 1 year)
    DELETE FROM audit_logs WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '1 year';
END;
$$ LANGUAGE plpgsql;
