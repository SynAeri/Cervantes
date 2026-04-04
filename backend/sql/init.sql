CREATE TABLE IF NOT EXISTS docker_init_check (
    id SERIAL PRIMARY KEY,
    message TEXT NOT NULL
);

INSERT INTO docker_init_check (message)
VALUES ('Docker DB init successful');
