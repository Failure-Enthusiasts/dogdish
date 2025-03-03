# cater_me_up

To start the Postgres instance using docker copy the `example.env` file and name it `.env` and fill out the environment  
variables.

Run the command below to start the container:

``` bash
docker compose -f storage/compose.yaml up -d
```

To test to see if the container was spun up correctly with the tables created use the `psql` command below, be sure to replace the environment variables:

``` bash
psql -h localhost -U $DATABASE_USER -d $DATABASE_NAME -W
```

Once you have been connected run the command `\dt` to see the tables that were create for your database.

Once you are done you can run the `\q` command to terminate your connection.

Destroy the database with the docker command below:

``` bash
docker compose -f storage/compose.yaml down
```

### Spin up

#### Database handler
```
cd database_handler
flask --app database_handler run
```
