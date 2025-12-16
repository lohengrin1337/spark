--
-- Insert for Spark
--

--
-- Delete
--

DELETE FROM `admin_account`;
DELETE FROM `fee`;
DELETE FROM `spark_zone`;
DELETE FROM `zone_type`;
DELETE FROM `invoice`;
DELETE FROM `rental`;
DELETE FROM `customer`;
DELETE FROM `bike`;
DELETE FROM `bike_status`;
DELETE FROM `city`;




--
-- Enable LOAD DATA LOCAL INFILE on the server.
--
SET GLOBAL local_infile = 1;
SHOW VARIABLES LIKE 'local_infile';

--
-- Insert into admin
--

-- LOAD DATA LOCAL INFILE '/docker-entrypoint-initdb.d/spark_db/admin_account'


LOAD DATA INFILE '/docker-entrypoint-initdb.d/spark_db/admin_account.csv'
INTO TABLE admin_account
CHARSET utf8
FIELDS
    TERMINATED BY ','
    ENCLOSED BY '"'
LINES
        TERMINATED BY '\n'
IGNORE 1 LINES
(`admin_id`, `password`)
;

--
-- Insert into bike_status
--

-- LOAD DATA LOCAL INFILE '/docker-entrypoint-initdb.d/spark_db/bike_status'
LOAD DATA INFILE '/docker-entrypoint-initdb.d/spark_db/bike_status.csv'
INTO TABLE bike_status
CHARSET utf8
FIELDS
    TERMINATED BY ','
    ENCLOSED BY '"'
LINES
        TERMINATED BY '\n'
IGNORE 1 LINES
(`status`)
;

--
-- Insert into fee
--

LOAD DATA INFILE '/docker-entrypoint-initdb.d/spark_db/fee.csv'
INTO TABLE fee
CHARSET utf8
FIELDS
    TERMINATED BY ','
    ENCLOSED BY '"'
LINES
        TERMINATED BY '\n'
IGNORE 1 LINES
(`fee_id`, `start`, `minute`, `discount`,  `penalty`)
;

SHOW WARNINGS;

--
-- Insert into spark_zone
--

LOAD DATA INFILE '/docker-entrypoint-initdb.d/spark_db/spark_zone.csv'
INTO TABLE spark_zone
CHARSET utf8
FIELDS
    TERMINATED BY ','
    ENCLOSED BY '"'
LINES
        TERMINATED BY '\n'
IGNORE 1 LINES
(`city`, `zone_type`, `coordinates`)
;


--
-- Insert into zone_type
--

LOAD DATA INFILE '/docker-entrypoint-initdb.d/spark_db/zone_type.csv'
INTO TABLE zone_type
CHARSET utf8
FIELDS
    TERMINATED BY ','
    ENCLOSED BY '"'
LINES
        TERMINATED BY '\n'
IGNORE 1 LINES
(`zone_type`, `speed_limit`)
;



--
-- Insert into invoice
--

LOAD DATA INFILE '/docker-entrypoint-initdb.d/spark_db/invoice.csv'
INTO TABLE invoice
CHARSET utf8
FIELDS
    TERMINATED BY ','
    ENCLOSED BY '"'
LINES
        TERMINATED BY '\n'
IGNORE 1 LINES
(`rental_id`, `status`, `due_date`)
;




/* --
-- Insert into rental
--

LOAD DATA INFILE '/docker-entrypoint-initdb.d/spark_db/rental.csv'
INTO TABLE rental
CHARSET utf8
FIELDS
    TERMINATED BY ','
    ENCLOSED BY '"'
LINES
        TERMINATED BY '\n'
IGNORE 1 LINES
(`customer_id`, `bike_id`, `start_point`, `start_time`, `end_point`, `end_time`, `route`)
;

 */
--
-- Insert into customer
--

LOAD DATA INFILE '/docker-entrypoint-initdb.d/spark_db/customer.csv'
INTO TABLE customer
CHARSET utf8
FIELDS
    TERMINATED BY ','
    ENCLOSED BY '"'
LINES
        TERMINATED BY '\n'
IGNORE 1 LINES
(`email`, `name`, `password`, `blocked`, `oauth_provider`, `oauth_provider_id`)
;


--
-- Insert into bike
--

LOAD DATA INFILE '/docker-entrypoint-initdb.d/spark_db/bike.csv'
INTO TABLE bike
CHARSET utf8
FIELDS
    TERMINATED BY ','
    ENCLOSED BY '"'
LINES
        TERMINATED BY '\n'
IGNORE 1 LINES
(`city`, `coordinates`)
;


--
-- Insert into city
--

LOAD DATA INFILE '/docker-entrypoint-initdb.d/spark_db/city.csv'
INTO TABLE city
CHARSET utf8
FIELDS
    TERMINATED BY ','
    ENCLOSED BY '"'
LINES
        TERMINATED BY '\n'
IGNORE 1 LINES
(`city`, `coordinates`)
;