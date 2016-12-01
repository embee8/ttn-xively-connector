--
-- PostgreSQL database dump
--

-- Dumped from database version 9.5.5
-- Dumped by pg_dump version 9.5.5

-- Started on 2016-12-01 14:32:06

SET statement_timeout = 0;
SET lock_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 1 (class 3079 OID 12355)
-- Name: plpgsql; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS plpgsql WITH SCHEMA pg_catalog;


--
-- TOC entry 2147 (class 0 OID 0)
-- Dependencies: 1
-- Name: EXTENSION plpgsql; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION plpgsql IS 'PL/pgSQL procedural language';


SET search_path = public, pg_catalog;

--
-- TOC entry 184 (class 1259 OID 16459)
-- Name: app_id_sequence; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE app_id_sequence
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 185 (class 1259 OID 16490)
-- Name: devices_id_sequence; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE devices_id_sequence
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 183 (class 1259 OID 16434)
-- Name: mapping_id_sequence; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE mapping_id_sequence
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


SET default_with_oids = false;

--
-- TOC entry 182 (class 1259 OID 16399)
-- Name: mappings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE mappings (
    json_field character varying(200),
    xi_topic character varying(500),
    mapping_id bigint DEFAULT nextval('mapping_id_sequence'::regclass) NOT NULL,
    time_series boolean DEFAULT false,
    category character varying(500),
    app_eui character varying(200)
);


--
-- TOC entry 188 (class 1259 OID 16513)
-- Name: setting_id_sequence; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE setting_id_sequence
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 187 (class 1259 OID 16510)
-- Name: settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE settings (
    conn_xi_device_id character varying(200),
    conn_xi_device_pw character varying(200),
    setting_id bigint DEFAULT nextval('setting_id_sequence'::regclass) NOT NULL,
    xi_account_id character varying(200),
    xi_broker_url character varying(200),
    xi_broker_port integer,
    xi_id_username character varying(200),
    xi_id_password character varying(200)
);


--
-- TOC entry 181 (class 1259 OID 16385)
-- Name: ttn_apps; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE ttn_apps (
    name character varying(500),
    app_eui character varying(200) NOT NULL,
    app_access_key character varying(200),
    app_id bigint DEFAULT nextval('app_id_sequence'::regclass) NOT NULL
);


--
-- TOC entry 186 (class 1259 OID 16492)
-- Name: ttn_devices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE ttn_devices (
    device_id bigint DEFAULT nextval('devices_id_sequence'::regclass) NOT NULL,
    device_eui character varying(200),
    app_eui character varying,
    device_name character varying(200),
    xi_device_id character varying(200)
);


--
-- TOC entry 2016 (class 2606 OID 16426)
-- Name: mappings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY mappings
    ADD CONSTRAINT mappings_pkey PRIMARY KEY (mapping_id);


--
-- TOC entry 2024 (class 2606 OID 16517)
-- Name: settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY settings
    ADD CONSTRAINT settings_pkey PRIMARY KEY (setting_id);


--
-- TOC entry 2009 (class 2606 OID 16466)
-- Name: ttn_apps_app_eui_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY ttn_apps
    ADD CONSTRAINT ttn_apps_app_eui_key UNIQUE (app_eui);


--
-- TOC entry 2011 (class 2606 OID 16464)
-- Name: ttn_apps_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY ttn_apps
    ADD CONSTRAINT ttn_apps_pkey PRIMARY KEY (app_id);


--
-- TOC entry 2020 (class 2606 OID 16509)
-- Name: ttn_devices_device_eui_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY ttn_devices
    ADD CONSTRAINT ttn_devices_device_eui_key UNIQUE (device_eui);


--
-- TOC entry 2022 (class 2606 OID 16501)
-- Name: ttn_devices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY ttn_devices
    ADD CONSTRAINT ttn_devices_pkey PRIMARY KEY (device_id);


--
-- TOC entry 2012 (class 1259 OID 16458)
-- Name: fki_app_eui; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX fki_app_eui ON mappings USING btree (app_eui);


--
-- TOC entry 2013 (class 1259 OID 16472)
-- Name: fki_app_eui_fkey; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX fki_app_eui_fkey ON mappings USING btree (app_eui);


--
-- TOC entry 2014 (class 1259 OID 16483)
-- Name: fki_mappings_app_eui_fkey; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX fki_mappings_app_eui_fkey ON mappings USING btree (app_eui);


--
-- TOC entry 2017 (class 1259 OID 16507)
-- Name: fki_ttn_devices_app_eui_fkey; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX fki_ttn_devices_app_eui_fkey ON ttn_devices USING btree (app_eui);


--
-- TOC entry 2018 (class 1259 OID 16535)
-- Name: fki_ttn_devices_app_eui_fkeyn; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX fki_ttn_devices_app_eui_fkeyn ON ttn_devices USING btree (app_eui);


--
-- TOC entry 2025 (class 2606 OID 16478)
-- Name: mappings_app_eui_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY mappings
    ADD CONSTRAINT mappings_app_eui_fkey FOREIGN KEY (app_eui) REFERENCES ttn_apps(app_eui) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 2026 (class 2606 OID 16530)
-- Name: ttn_devices_app_eui_fkeyn; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY ttn_devices
    ADD CONSTRAINT ttn_devices_app_eui_fkeyn FOREIGN KEY (app_eui) REFERENCES ttn_apps(app_eui) ON UPDATE CASCADE ON DELETE CASCADE;


-- Completed on 2016-12-01 14:32:07

--
-- PostgreSQL database dump complete
--

