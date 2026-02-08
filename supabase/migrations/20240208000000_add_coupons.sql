-- Create coupons table
CREATE TABLE IF NOT EXISTS coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    discount_percent INTEGER NOT NULL CHECK (discount_percent > 0 AND discount_percent <= 100),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    valid_from TIMESTAMP WITH TIME ZONE,
    valid_until TIMESTAMP WITH TIME ZONE,
    max_uses INTEGER,
    current_uses INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add coupon_id to bookings table
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS coupon_id UUID REFERENCES coupons(id),
ADD COLUMN IF NOT EXISTS coupon_code VARCHAR(50),
ADD COLUMN IF NOT EXISTS discount_amount INTEGER DEFAULT 0;

-- Create index for faster coupon code lookups
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON coupons(is_active) WHERE is_active = true;

-- Enable RLS on coupons table
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- Allow admins to manage coupons
CREATE POLICY "Admins can manage coupons"
ON coupons FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
);

-- Allow anyone to read active coupons (for validation)
CREATE POLICY "Anyone can read active coupons"
ON coupons FOR SELECT
TO authenticated
USING (is_active = true);

-- Create function to validate and apply coupon
CREATE OR REPLACE FUNCTION validate_coupon(coupon_code_input VARCHAR)
RETURNS TABLE (
    coupon_id UUID,
    code VARCHAR,
    discount_percent INTEGER,
    is_valid BOOLEAN,
    error_message TEXT
) AS $$
DECLARE
    coupon_record RECORD;
BEGIN
    -- Find the coupon
    SELECT * INTO coupon_record
    FROM coupons c
    WHERE UPPER(c.code) = UPPER(coupon_code_input);

    -- Check if coupon exists
    IF NOT FOUND THEN
        RETURN QUERY SELECT
            NULL::UUID,
            NULL::VARCHAR,
            0::INTEGER,
            false,
            'Érvénytelen kuponkód'::TEXT;
        RETURN;
    END IF;

    -- Check if coupon is active
    IF NOT coupon_record.is_active THEN
        RETURN QUERY SELECT
            NULL::UUID,
            NULL::VARCHAR,
            0::INTEGER,
            false,
            'Ez a kupon már nem aktív'::TEXT;
        RETURN;
    END IF;

    -- Check validity period
    IF coupon_record.valid_from IS NOT NULL AND NOW() < coupon_record.valid_from THEN
        RETURN QUERY SELECT
            NULL::UUID,
            NULL::VARCHAR,
            0::INTEGER,
            false,
            'Ez a kupon még nem érvényes'::TEXT;
        RETURN;
    END IF;

    IF coupon_record.valid_until IS NOT NULL AND NOW() > coupon_record.valid_until THEN
        RETURN QUERY SELECT
            NULL::UUID,
            NULL::VARCHAR,
            0::INTEGER,
            false,
            'Ez a kupon már lejárt'::TEXT;
        RETURN;
    END IF;

    -- Check usage limit
    IF coupon_record.max_uses IS NOT NULL AND coupon_record.current_uses >= coupon_record.max_uses THEN
        RETURN QUERY SELECT
            NULL::UUID,
            NULL::VARCHAR,
            0::INTEGER,
            false,
            'Ez a kupon már elfogyott'::TEXT;
        RETURN;
    END IF;

    -- Coupon is valid
    RETURN QUERY SELECT
        coupon_record.id,
        coupon_record.code,
        coupon_record.discount_percent,
        true,
        NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to increment coupon usage
CREATE OR REPLACE FUNCTION increment_coupon_usage(coupon_id_input UUID)
RETURNS void AS $$
BEGIN
    UPDATE coupons
    SET current_uses = current_uses + 1,
        updated_at = NOW()
    WHERE id = coupon_id_input;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
