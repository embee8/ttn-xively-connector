-- CLEANING UP

DROP TABLE IF EXISTS firmware, application_config, rules, device_config, images;
DROP SEQUENCE IF EXISTS app_id_sequence, devices_id_sequence, mapping_id_sequence, setting_id_sequence;

SET default_with_oids = false;

-- SEQUENCES

CREATE SEQUENCE app_id_sequence
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE devices_id_sequence
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE mapping_id_sequence
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE setting_id_sequence
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;




-- TABLES

CREATE TABLE mappings (
    json_field text,
    xi_topic text,
    mapping_id bigint DEFAULT nextval('mapping_id_sequence'::regclass) NOT NULL,
    time_series boolean DEFAULT false,
    category text,
    app_eui text
);

CREATE TABLE settings (
    setting_id bigint DEFAULT nextval('setting_id_sequence'::regclass) NOT NULL,
    xi_account_id text,
    xi_broker_url text,
    xi_broker_port integer,
    xi_id_username text,
    xi_id_password text,
    xi_api_endpoint_id text,
    xi_api_endpoint_bp text,
    ttn_broker_url text,
    ttn_broker_port integer
);

CREATE TABLE ttn_apps (
    name text,
    app_eui text NOT NULL,
    app_access_key text,
    app_id bigint DEFAULT nextval('app_id_sequence'::regclass) NOT NULL
);

CREATE TABLE ttn_devices (
    device_id bigint DEFAULT nextval('devices_id_sequence'::regclass) NOT NULL,
    device_eui character varying(200),
    app_eui character varying,
    device_name character varying(200),
    xi_device_id character varying(200)
);



-- PRIMARY KEYS

ALTER TABLE ONLY mappings
    ADD CONSTRAINT mappings_pkey PRIMARY KEY (mapping_id);

ALTER TABLE ONLY settings
    ADD CONSTRAINT settings_pkey PRIMARY KEY (setting_id);

ALTER TABLE ONLY ttn_apps
    ADD CONSTRAINT ttn_apps_pkey PRIMARY KEY (app_id);

ALTER TABLE ONLY ttn_devices
    ADD CONSTRAINT ttn_devices_pkey PRIMARY KEY (device_id);



-- UNIQUE CONSTRAINTS

ALTER TABLE ONLY ttn_apps
    ADD CONSTRAINT ttn_apps_app_eui_key UNIQUE (app_eui);

ALTER TABLE ONLY ttn_devices
    ADD CONSTRAINT ttn_devices_device_eui_key UNIQUE (device_eui);


-- INDEXES

CREATE INDEX fki_app_eui ON mappings USING btree (app_eui);

CREATE INDEX fki_app_eui_fkey ON mappings USING btree (app_eui);

CREATE INDEX fki_mappings_app_eui_fkey ON mappings USING btree (app_eui);

CREATE INDEX fki_ttn_devices_app_eui_fkey ON ttn_devices USING btree (app_eui);

CREATE INDEX fki_ttn_devices_app_eui_fkeyn ON ttn_devices USING btree (app_eui);


-- FOREIGN KEYS

ALTER TABLE ONLY mappings
    ADD CONSTRAINT mappings_app_eui_fkey FOREIGN KEY (app_eui) REFERENCES ttn_apps(app_eui) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY ttn_devices
    ADD CONSTRAINT ttn_devices_app_eui_fkeyn FOREIGN KEY (app_eui) REFERENCES ttn_apps(app_eui) ON UPDATE CASCADE ON DELETE CASCADE;


-- DEFAULT SETTINGS
INSERT INTO settings (xi_broker_url, xi_broker_port, xi_api_endpoint_id, xi_api_endpoint_bp) VALUES ('broker.xively.eu', 443, 'id.xively.eu', 'blueprint.xively.eu');