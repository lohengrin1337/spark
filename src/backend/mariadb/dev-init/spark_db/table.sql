--
-- Tables for spark
--

--
-- DROP TABLES
--
DROP TABLE IF EXISTS `third_party`;
DROP TABLE IF EXISTS `admin_account`;
DROP TABLE IF EXISTS `fee`;
DROP TABLE IF EXISTS `spark_zone`;
DROP TABLE IF EXISTS `invoice`;
DROP TABLE IF EXISTS `rental`;
DROP TABLE IF EXISTS `zone_type`;
DROP TABLE IF EXISTS `customer`;
DROP TABLE IF EXISTS `bike`;
DROP TABLE IF EXISTS `city`;
DROP TABLE IF EXISTS `bike_status`;


--
-- CREATE TABLES
--

CREATE TABLE `third_party`
(
    `third_party_id` VARCHAR(100),
    `password` CHAR(60),

    PRIMARY KEY (`third_party_id`)
);

CREATE TABLE `bike_status`
(
    `status` VARCHAR(45) NOT NULL,

    PRIMARY KEY (`status`)
);

CREATE TABLE `city`
(
    `name` VARCHAR(45) NOT NULL,

    PRIMARY KEY (`name`)
);

CREATE TABLE `bike`
(
    `bike_id` INT AUTO_INCREMENT NOT NULL,
    `city` VARCHAR(45),
    `status` VARCHAR(45) DEFAULT 'onService',
    `coordinates` POINT NULL DEFAULT NULL,

    PRIMARY KEY (`bike_id`),
    FOREIGN KEY (`city`) REFERENCES `city`(`name`),
    FOREIGN KEY (`status`) REFERENCES `bike_status`(`status`)
);

CREATE TABLE `customer`
(
    `customer_id` INT AUTO_INCREMENT NOT NULL,
    `email` VARCHAR(200) NOT NULL UNIQUE,
    `name` VARCHAR(200) NOT NULL,
    `password` CHAR(60),
    `blocked` BOOLEAN NOT NULL DEFAULT FALSE,
    `oauth_provider` VARCHAR(50),
    `oauth_provider_id` VARCHAR(255),

    PRIMARY KEY (`customer_id`)
);

CREATE TABLE `zone_type`
(
    `zone_type` VARCHAR(45) NOT NULL,
    `speed_limit` INT NOT NULL,

    PRIMARY KEY (`zone_type`)
);
 
CREATE TABLE `rental`
(
    `rental_id` INT AUTO_INCREMENT NOT NULL,
    `customer_id` INT NOT NULL,
    `bike_id` INT NOT NULL,
    `start_point` JSON,
    `end_point` JSON,
    `start_time` DATETIME NOT NULL,
    `end_time` DATETIME,
    `start_zone` VARCHAR(20),
    `end_zone` VARCHAR(20),
    `route` JSON, 

    PRIMARY KEY (`rental_id`),
    FOREIGN KEY (`customer_id`) REFERENCES `customer`(`customer_id`),
    FOREIGN KEY (`bike_id`) REFERENCES `bike`(`bike_id`)
);


CREATE TABLE `invoice`
(
    `invoice_id` INT AUTO_INCREMENT NOT NULL,
    `rental_id` INT NOT NULL,
    `customer_id` INT NOT NULL,
    `status` VARCHAR(45) NOT NULL DEFAULT 'unpaid',
    `amount` INT NOT NULL,
    `creation_date` DATETIME NOT NULL,
    `due_date` DATETIME NOT NULL,

    PRIMARY KEY (`invoice_id`),
    FOREIGN KEY (`rental_id`) REFERENCES `rental`(`rental_id`),
    FOREIGN KEY (`customer_id`) REFERENCES `customer`(`customer_id`)
);


CREATE TABLE `spark_zone` (
    
    `zone_id` INT AUTO_INCREMENT NOT NULL,
    `city` VARCHAR(45) NOT NULL,
    `zone_type` VARCHAR(45) NOT NULL,
    `coordinates` GEOMETRY NULL,    -- Changed from POLYGON to more flexible GEOMETRY (enable POINT)

    PRIMARY KEY (`zone_id`),
    FOREIGN KEY (`city`) REFERENCES `city`(`name`)
);

CREATE TABLE `fee`
(
    `fee_id` INT AUTO_INCREMENT NOT NULL,
    `updated` DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    `start` INT NOT NULL,
    `minute` INT NOT NULL,
    `discount` INT NOT NULL,
    `penalty` INT NOT NULL,   

    PRIMARY KEY (`fee_id`)
);

CREATE TABLE `admin_account`
(
    `admin_id` VARCHAR(25) NOT NULL,
    `password` CHAR(60),

    PRIMARY KEY (`admin_id`)
);

