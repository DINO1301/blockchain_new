-- Add country and brand columns to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS brand TEXT;
