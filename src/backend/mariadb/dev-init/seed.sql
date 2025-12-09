-- src/backend/mariadb/seed.sql
DROP TABLE IF EXISTS invoices;
DROP TABLE IF EXISTS customer;

CREATE TABLE invoices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  issued_date DATE NOT NULL,
  due_date DATE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  paid BOOLEAN DEFAULT FALSE,
  rental_id VARCHAR(10) NOT NULL
);

CREATE TABLE customer
(
    customer_id INT AUTO_INCREMENT NOT NULL PRIMARY KEY,
    email VARCHAR(200) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    password CHAR(60),
    blocked BOOLEAN NOT NULL DEFAULT FALSE,
    oauth_provider VARCHAR(50) NULL,
    oauth_provider_id VARCHAR(255) NULL
);

INSERT INTO invoices (issued_date, due_date, amount, paid, rental_id) VALUES
('2025-01-01','2025-01-31',95.00,TRUE,'#4832'),
('2025-01-03','2025-02-02',47.00,FALSE,'#9124'),
('2025-01-05','2025-02-04',132.00,FALSE,'#5531'),
('2025-01-07','2025-02-06',59.00,TRUE,'#7748'),
('2025-01-09','2025-02-08',148.00,FALSE,'#1203'),
('2025-01-11','2025-02-10',26.00,TRUE,'#6920'),
('2025-01-13','2025-02-12',73.00,FALSE,'#8841'),
('2025-01-15','2025-02-14',121.00,TRUE,'#3307'),
('2025-01-17','2025-02-16',42.00,FALSE,'#5599'),
('2025-01-19','2025-02-18',88.00,TRUE,'#2415');

INSERT INTO customer (email, name, password, blocked, oauth_provider, oauth_provider_id) VALUES
('lisa@lisa.se', 'Lisa', null, FALSE, null, null),
('emma@emma.se', 'Emma', null, FALSE, null, null),
('herman@herman.se', 'Herman', null, FALSE, null, null),
('olof@olof.se', 'Olof', null, FALSE, null, null),
('marvin@marvin.se', 'Marvin', null, TRUE, null, null);