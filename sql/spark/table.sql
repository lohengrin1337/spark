--
-- Tables for spark
--

--
-- DROP TABLES
--

DROP TABLE IF EXISTS `invoice`;
DROP TABLE IF EXISTS `rental`;
DROP TABLE IF EXISTS `customer`;
DROP TABLE IF EXISTS `bike`;
DROP TABLE IF EXISTS `city`;
DROP TABLE IF EXISTS `zone`;
DROP TABLE IF EXISTS `zone_type`;
DROP TABLE IF EXISTS `fee`;
DROP TABLE IF EXISTS `admin`;

--
-- CREATE TABLES
--

CREATE TABLE `invoice`
(
    `invoice_id` INT AUTO_INCREMENT NOT NULL,
    `status` VARCHAR(45) NOT NULL,
    `due_date`DATE,    

    PRIMARY KEY (`invoice_id`)
)
