--
-- Reset Spark
--
-- source ./spark_db/setup.sql;
-- use spark_db;
source /docker-entrypoint-initdb.d/spark_db/ddl.sql;
source /docker-entrypoint-initdb.d/spark_db/insert.sql;
