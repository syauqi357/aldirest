CREATE DATABASE servisaldi;

USE servisaldi;

CREATE TABLE service (
    id integer auto_increment primary key ,
    name varchar(120),
    price integer,
    description varchar(750)
);

CREATE TABLE service_transactions (
    id integer auto_increment primary key ,
    service_id INTEGER NOT NULL,
    customer_name varchar(120),
    device_type varchar(18),
    device_brand varchar(75),
    problem varchar(750),
    price integer,
    date timestamp default  current_timestamp,
    status varchar(14)
);