-- Simulated database for publisher performance reports

CREATE TABLE IF NOT EXISTS publishers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS reports (
  id SERIAL PRIMARY KEY,
  publisher_id INT REFERENCES publishers(id),
  revenue NUMERIC(10,2),
  impressions INT,
  clicks INT,
  date DATE
);

CREATE TABLE IF NOT EXISTS click_events (
  id SERIAL PRIMARY KEY,
  ad_id VARCHAR(100),
  clicked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  user_agent TEXT,
  ip_address VARCHAR(45)
);

INSERT INTO publishers (name) VALUES
('TechMedia'),
('FoodDaily'),
('TravelNow');

INSERT INTO reports (publisher_id, revenue, impressions, clicks, date) VALUES
(1, 120.50, 10000, 250, '2025-10-01'),
(1, 150.75, 11000, 270, '2025-10-02'),
(2, 80.20, 8500, 190, '2025-10-01'),
(2, 0, 0, 0, '2025-10-02'),  
(3, 200.00, 15000, 400, '2025-10-01'),
(1, 120.50, 10000, 250, '2025-10-01'),
(2, 85.30, 8500, 195, '2025-10-01');
