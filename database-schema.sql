-- Create database
CREATE DATABASE IF NOT EXISTS product_calculator;
USE product_calculator;

-- Create users table with salt column for more secure password storage
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  salt VARCHAR(255) NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  pros TEXT,
  cons TEXT,
  category_id INT NOT NULL,
  base_price DECIMAL(10, 2) NOT NULL,
  price_per_square_meter BOOLEAN DEFAULT FALSE,
  can_export BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Create extra options table
CREATE TABLE IF NOT EXISTS extra_options (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  price_per_square_meter BOOLEAN DEFAULT FALSE,
  use_product_dimensions BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Create product images table
CREATE TABLE IF NOT EXISTS product_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  image_url VARCHAR(255) NOT NULL,
  display_order INT DEFAULT 0,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Create export history table
CREATE TABLE IF NOT EXISTS export_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  export_data JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Insert sample data
INSERT INTO categories (name) VALUES 
('Flooring'),
('Wall Coverings'),
('Countertops'),
('Roofing');

INSERT INTO products (name, description, pros, cons, category_id, base_price, price_per_square_meter, can_export) VALUES
('Hardwood Flooring', 'Premium oak hardwood flooring with natural grain patterns. Our hardwood floors are sourced from sustainable forests and treated with eco-friendly finishes for durability and beauty.', 'Durable and long-lasting
Adds warmth and character
Can be refinished multiple times
Increases property value
Natural and sustainable material', 'Susceptible to water damage
Requires regular maintenance
Can be scratched by pets
More expensive than some alternatives
Not ideal for basements or bathrooms', 1, 45.99, TRUE, TRUE),
('Ceramic Tiles', 'Durable ceramic tiles for floors and walls with stain-resistant finish. Available in various patterns and colors to match any interior design style.', 'Extremely durable
Water and stain resistant
Easy to clean
Fire resistant
Allergy-friendly', 'Cold underfoot
Hard surface can be uncomfortable
Grout requires maintenance
Can crack if heavy items are dropped
Installation is labor-intensive', 1, 29.99, TRUE, TRUE),
('Vinyl Flooring', 'Water-resistant vinyl flooring with realistic wood and stone patterns. Perfect for high-traffic areas and rooms with moisture exposure.', 'Waterproof
Easy to install
Low maintenance
Comfortable underfoot
Affordable', 'Can be punctured by sharp objects
May fade in direct sunlight
Difficult to repair if damaged
Not as eco-friendly
Lower resale value', 1, 19.99, TRUE, FALSE),
('Wallpaper', 'Decorative wallpaper with various patterns from classic to contemporary designs. Our premium wallpapers are fade-resistant and easy to clean.', 'Wide variety of designs
Can hide wall imperfections
Easy to change for new looks
More durable than paint
Adds texture and dimension', 'Difficult to remove
Can peel in humid environments
Pattern matching can be challenging
More expensive than paint
Requires professional installation for best results', 2, 15.99, TRUE, TRUE),
('Granite Countertop', 'Natural stone countertop with unique patterns and colors. Each granite slab is one-of-a-kind, offering a luxurious and timeless appeal to any kitchen or bathroom.', 'Extremely durable
Heat resistant
Unique natural patterns
Increases home value
Resistant to bacteria', 'Requires periodic sealing
Can chip or crack if impacted
Heavy - requires sturdy cabinets
Expensive
Limited color consistency', 3, 89.99, TRUE, TRUE),
('Asphalt Shingles', 'Standard roofing material with excellent weather resistance and durability. Our asphalt shingles come with a 30-year warranty and are available in multiple colors.', 'Cost-effective
Easy to install
Good fire resistance
Wide variety of colors
Low maintenance', 'Shorter lifespan than other materials
Less environmentally friendly
Can be damaged by extreme weather
Poor insulation properties
Can develop algae in humid climates', 4, 25.99, TRUE, FALSE);

INSERT INTO extra_options (product_id, name, price, price_per_square_meter, use_product_dimensions) VALUES
(1, 'Premium Finish', 5.99, TRUE, TRUE),
(1, 'Underfloor Heating', 120.00, FALSE, TRUE),
(2, 'Waterproofing', 3.99, TRUE, TRUE),
(2, 'Anti-Slip Treatment', 2.50, TRUE, TRUE),
(3, 'Soundproofing', 4.99, TRUE, TRUE),
(4, 'Premium Adhesive', 2.99, TRUE, FALSE),
(5, 'Edge Polishing', 15.00, FALSE, TRUE),
(5, 'Sealing Treatment', 7.99, TRUE, TRUE),
(6, 'Extended Warranty', 50.00, FALSE, FALSE);

-- Insert sample product images
INSERT INTO product_images (product_id, image_url, display_order) VALUES
(1, '/placeholder.svg?height=400&width=600', 0),
(1, '/placeholder.svg?height=400&width=600', 1),
(2, '/placeholder.svg?height=400&width=600', 0),
(3, '/placeholder.svg?height=400&width=600', 0),
(4, '/placeholder.svg?height=400&width=600', 0),
(5, '/placeholder.svg?height=400&width=600', 0),
(6, '/placeholder.svg?height=400&width=600', 0);

-- Create admin user with secure password hashing
-- Initial salt and hash for 'admin123'
INSERT INTO users (username, password, salt, is_admin) VALUES
('admin', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', 'admin_salt_123456', TRUE);

-- Create regular user with secure password hashing
-- Initial salt and hash for 'user123'
INSERT INTO users (username, password, salt, is_admin) VALUES
('user', '04f8996da763b7a969b1028ee3007569eaf3a635486ddab211d512c85b9df8fb', 'user_salt_123456', FALSE);

