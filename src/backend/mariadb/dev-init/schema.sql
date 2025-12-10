
DROP TABLE IF EXISTS invoices;
CREATE TABLE invoices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  issued_date DATE NOT NULL,
  due_date DATE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  paid BOOLEAN DEFAULT FALSE,
  rental_id VARCHAR(10) NOT NULL
);

CREATE TABLE rentals (
  rental_id TEXT PRIMARY KEY,
  customer_id INT NOT NULL,
  bike_id INT NOT NULL,
  start_point POINT,
  start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  end_point POINT,
  end_time DATETIME,
  route JSON NOT NULL DEFAULT '[]'
);


