--
-- Reset Spark
--
source ./spark_db/setup.sql;
use spark;
source ./spark_db/ddl.sql;
source ./spark_db/insert.sql;
