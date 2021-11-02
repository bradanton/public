--name: Schema columns
--connection: System:DatagrokAdmin

SELECT *
FROM information_schema.columns
where
  table_catalog = 'datagrok' and
  table_schema = 'public'
ORDER BY table_schema,table_name;