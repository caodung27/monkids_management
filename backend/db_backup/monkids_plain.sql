--
-- PostgreSQL database dump
--

-- Dumped from database version 17.5
-- Dumped by pg_dump version 17.5

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: users_role_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.users_role_enum AS ENUM (
    'ADMIN',
    'TEACHER',
    'STUDENT'
);


ALTER TYPE public.users_role_enum OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: app_student; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.app_student (
    student_id integer,
    birthdate date,
    classroom character varying(50),
    base_fee numeric(10,2) DEFAULT 0 NOT NULL,
    discount_percentage numeric(5,2) DEFAULT 0 NOT NULL,
    final_fee numeric(10,2) DEFAULT 0 NOT NULL,
    utilities_fee numeric(10,2) DEFAULT 0 NOT NULL,
    pt numeric(5,1) DEFAULT 0 NOT NULL,
    pm numeric(5,1) DEFAULT 0 NOT NULL,
    meal_fee numeric(10,2) DEFAULT 0 NOT NULL,
    eng_fee numeric(10,2) DEFAULT 0 NOT NULL,
    skill_fee numeric(10,2) DEFAULT 0 NOT NULL,
    total_fee numeric(10,2) DEFAULT 0 NOT NULL,
    paid_amount numeric(10,2) DEFAULT 0 NOT NULL,
    remaining_amount numeric(10,2) DEFAULT 0 NOT NULL,
    student_fund numeric(10,2) DEFAULT 0 NOT NULL,
    facility_fee numeric(10,2) DEFAULT 0 NOT NULL,
    sequential_number uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    name character varying
);


ALTER TABLE public.app_student OWNER TO postgres;

--
-- Name: app_teacher; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.app_teacher (
    id uuid NOT NULL,
    role character varying(100) NOT NULL,
    phone character varying(20),
    base_salary numeric(10,2) DEFAULT 0 NOT NULL,
    teaching_days numeric(5,1) DEFAULT 0 NOT NULL,
    absence_days numeric(5,1) DEFAULT 0 NOT NULL,
    received_salary numeric(10,2) DEFAULT 0 NOT NULL,
    extra_teaching_days numeric(5,1) DEFAULT 0 NOT NULL,
    extra_salary numeric(10,2) DEFAULT 0 NOT NULL,
    insurance_support numeric(10,2) DEFAULT 0 NOT NULL,
    responsibility_support numeric(10,2) DEFAULT 0 NOT NULL,
    breakfast_support numeric(10,2) DEFAULT 0 NOT NULL,
    skill_sessions numeric(5,1) DEFAULT 0 NOT NULL,
    skill_salary numeric(10,2) DEFAULT 0 NOT NULL,
    english_sessions numeric(5,1) DEFAULT 0 NOT NULL,
    english_salary numeric(10,2) DEFAULT 0 NOT NULL,
    new_students_list text,
    paid_amount numeric(10,2) DEFAULT 0 NOT NULL,
    total_salary numeric(10,2) DEFAULT 0 NOT NULL,
    note text,
    teacher_no integer NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    name character varying
);


ALTER TABLE public.app_teacher OWNER TO postgres;

--
-- Name: app_user; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.app_user (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(100),
    email character varying(255) NOT NULL,
    phone character varying(20),
    address text,
    image text,
    account_type character varying(20) DEFAULT 'LOCAL'::character varying NOT NULL,
    role character varying(10) DEFAULT 'USER'::character varying NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    code_id uuid,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    password character varying(255),
    code_expired timestamp without time zone
);


ALTER TABLE public.app_user OWNER TO postgres;

--
-- Name: attendance; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.attendance (
    id integer NOT NULL,
    "teacherId" uuid NOT NULL,
    year integer NOT NULL,
    month integer NOT NULL,
    full_days integer[] DEFAULT ARRAY[]::integer[] NOT NULL,
    half_days integer[] DEFAULT ARRAY[]::integer[] NOT NULL,
    absent_days integer[] DEFAULT ARRAY[]::integer[] NOT NULL,
    extra_days integer[] DEFAULT ARRAY[]::integer[] NOT NULL
);


ALTER TABLE public.attendance OWNER TO postgres;

--
-- Name: attendance_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.attendance_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.attendance_id_seq OWNER TO postgres;

--
-- Name: attendance_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.attendance_id_seq OWNED BY public.attendance.id;


--
-- Name: audit_log_auditlog; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_log_auditlog (
    id bigint NOT NULL,
    action character varying(10) NOT NULL,
    model_name character varying(100),
    object_id character varying(255),
    changes jsonb,
    "timestamp" timestamp with time zone NOT NULL,
    ip_address inet,
    description text,
    user_id integer
);


ALTER TABLE public.audit_log_auditlog OWNER TO postgres;

--
-- Name: audit_log_auditlog_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.audit_log_auditlog ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.audit_log_auditlog_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: auth_group; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.auth_group (
    id integer NOT NULL,
    name character varying(150) NOT NULL
);


ALTER TABLE public.auth_group OWNER TO postgres;

--
-- Name: auth_group_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.auth_group ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.auth_group_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: auth_group_permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.auth_group_permissions (
    id bigint NOT NULL,
    group_id integer NOT NULL,
    permission_id integer NOT NULL
);


ALTER TABLE public.auth_group_permissions OWNER TO postgres;

--
-- Name: auth_group_permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.auth_group_permissions ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.auth_group_permissions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: auth_permission; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.auth_permission (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    content_type_id integer NOT NULL,
    codename character varying(100) NOT NULL
);


ALTER TABLE public.auth_permission OWNER TO postgres;

--
-- Name: auth_permission_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.auth_permission ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.auth_permission_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: auth_user; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.auth_user (
    id integer NOT NULL,
    password character varying(128) NOT NULL,
    last_login timestamp with time zone,
    is_superuser boolean NOT NULL,
    username character varying(150) NOT NULL,
    first_name character varying(150) NOT NULL,
    last_name character varying(150) NOT NULL,
    email character varying(254) NOT NULL,
    is_staff boolean NOT NULL,
    is_active boolean NOT NULL,
    date_joined timestamp with time zone NOT NULL
);


ALTER TABLE public.auth_user OWNER TO postgres;

--
-- Name: auth_user_groups; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.auth_user_groups (
    id bigint NOT NULL,
    user_id integer NOT NULL,
    group_id integer NOT NULL
);


ALTER TABLE public.auth_user_groups OWNER TO postgres;

--
-- Name: auth_user_groups_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.auth_user_groups ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.auth_user_groups_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: auth_user_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.auth_user ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.auth_user_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: auth_user_user_permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.auth_user_user_permissions (
    id bigint NOT NULL,
    user_id integer NOT NULL,
    permission_id integer NOT NULL
);


ALTER TABLE public.auth_user_user_permissions OWNER TO postgres;

--
-- Name: auth_user_user_permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.auth_user_user_permissions ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.auth_user_user_permissions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: django_admin_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.django_admin_log (
    id integer NOT NULL,
    action_time timestamp with time zone NOT NULL,
    object_id text,
    object_repr character varying(200) NOT NULL,
    action_flag smallint NOT NULL,
    change_message text NOT NULL,
    content_type_id integer,
    user_id integer NOT NULL,
    CONSTRAINT django_admin_log_action_flag_check CHECK ((action_flag >= 0))
);


ALTER TABLE public.django_admin_log OWNER TO postgres;

--
-- Name: django_admin_log_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.django_admin_log ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.django_admin_log_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: django_content_type; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.django_content_type (
    id integer NOT NULL,
    app_label character varying(100) NOT NULL,
    model character varying(100) NOT NULL
);


ALTER TABLE public.django_content_type OWNER TO postgres;

--
-- Name: django_content_type_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.django_content_type ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.django_content_type_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: django_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.django_migrations (
    id bigint NOT NULL,
    app character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    applied timestamp with time zone NOT NULL
);


ALTER TABLE public.django_migrations OWNER TO postgres;

--
-- Name: django_migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.django_migrations ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.django_migrations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: django_session; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.django_session (
    session_key character varying(40) NOT NULL,
    session_data text NOT NULL,
    expire_date timestamp with time zone NOT NULL
);


ALTER TABLE public.django_session OWNER TO postgres;

--
-- Name: migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.migrations (
    id integer NOT NULL,
    "timestamp" bigint NOT NULL,
    name character varying NOT NULL
);


ALTER TABLE public.migrations OWNER TO postgres;

--
-- Name: migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.migrations_id_seq OWNER TO postgres;

--
-- Name: migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.migrations_id_seq OWNED BY public.migrations.id;


--
-- Name: monthly_stats; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.monthly_stats (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    year integer NOT NULL,
    month integer NOT NULL,
    total_students integer DEFAULT 0 NOT NULL,
    total_teachers integer DEFAULT 0 NOT NULL,
    total_fees numeric(15,2) DEFAULT 0 NOT NULL,
    total_salaries numeric(15,2) DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.monthly_stats OWNER TO postgres;

--
-- Name: social_auth_association; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.social_auth_association (
    id bigint NOT NULL,
    server_url character varying(255) NOT NULL,
    handle character varying(255) NOT NULL,
    secret character varying(255) NOT NULL,
    issued integer NOT NULL,
    lifetime integer NOT NULL,
    assoc_type character varying(64) NOT NULL
);


ALTER TABLE public.social_auth_association OWNER TO postgres;

--
-- Name: social_auth_association_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.social_auth_association ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.social_auth_association_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: social_auth_code; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.social_auth_code (
    id bigint NOT NULL,
    email character varying(254) NOT NULL,
    code character varying(32) NOT NULL,
    verified boolean NOT NULL,
    "timestamp" timestamp with time zone NOT NULL
);


ALTER TABLE public.social_auth_code OWNER TO postgres;

--
-- Name: social_auth_code_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.social_auth_code ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.social_auth_code_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: social_auth_nonce; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.social_auth_nonce (
    id bigint NOT NULL,
    server_url character varying(255) NOT NULL,
    "timestamp" integer NOT NULL,
    salt character varying(65) NOT NULL
);


ALTER TABLE public.social_auth_nonce OWNER TO postgres;

--
-- Name: social_auth_nonce_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.social_auth_nonce ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.social_auth_nonce_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: social_auth_partial; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.social_auth_partial (
    id bigint NOT NULL,
    token character varying(32) NOT NULL,
    next_step smallint NOT NULL,
    backend character varying(32) NOT NULL,
    data jsonb NOT NULL,
    "timestamp" timestamp with time zone NOT NULL,
    CONSTRAINT social_auth_partial_next_step_check CHECK ((next_step >= 0))
);


ALTER TABLE public.social_auth_partial OWNER TO postgres;

--
-- Name: social_auth_partial_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.social_auth_partial ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.social_auth_partial_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: social_auth_usersocialauth; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.social_auth_usersocialauth (
    id bigint NOT NULL,
    provider character varying(32) NOT NULL,
    uid character varying(255) NOT NULL,
    extra_data jsonb NOT NULL,
    created timestamp with time zone NOT NULL,
    modified timestamp with time zone NOT NULL,
    user_id uuid NOT NULL
);


ALTER TABLE public.social_auth_usersocialauth OWNER TO postgres;

--
-- Name: social_auth_usersocialauth_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.social_auth_usersocialauth ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.social_auth_usersocialauth_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: attendance id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance ALTER COLUMN id SET DEFAULT nextval('public.attendance_id_seq'::regclass);


--
-- Name: migrations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.migrations ALTER COLUMN id SET DEFAULT nextval('public.migrations_id_seq'::regclass);


--
-- Data for Name: app_student; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.app_student (student_id, birthdate, classroom, base_fee, discount_percentage, final_fee, utilities_fee, pt, pm, meal_fee, eng_fee, skill_fee, total_fee, paid_amount, remaining_amount, student_fund, facility_fee, sequential_number, created_at, updated_at, name) FROM stdin;
5	\N	Mon1	1500000.00	0.15	1275000.00	120000.00	0.0	26.0	780000.00	0.00	0.00	2175000.00	0.00	2175000.00	0.00	0.00	f90b36c5-0692-44a2-b406-541722a0debd	2025-05-20 07:30:11.592364	2025-05-20 07:30:11.592364	Nguyễn Ngọc Minh Anh ( Mì)
6	\N	Mon1	1500000.00	0.15	1275000.00	120000.00	0.0	26.0	780000.00	0.00	0.00	2175000.00	0.00	2175000.00	0.00	0.00	cd6c8d66-0d28-4fbf-b28a-0cb2263ad5d9	2025-05-20 07:30:11.592364	2025-05-20 07:30:11.592364	Vũ Ngọc Anh
7	2024-01-19	Mon1	1500000.00	0.30	1050000.00	120000.00	1.0	26.0	750000.00	0.00	0.00	1920000.00	0.00	1920000.00	0.00	0.00	3daee1f7-ea54-4af6-863b-6d8076edd62c	2025-05-20 07:30:11.592364	2025-05-20 07:30:11.592364	Phùng Bích Thảo
8	2023-11-18	Mon1	0.00	0.30	0.00	120000.00	24.0	26.0	60000.00	0.00	0.00	180000.00	0.00	180000.00	0.00	0.00	d1190a16-ae9e-4074-8d94-a85568ad793c	2025-05-20 07:30:11.592364	2025-05-20 07:30:11.592364	Lê Cao Khánh Vy
9	2024-01-21	Mon1	1500000.00	0.40	900000.00	120000.00	7.0	26.0	570000.00	0.00	0.00	1590000.00	0.00	1590000.00	0.00	0.00	d417059f-9cec-4b95-a154-7bdac20c6c32	2025-05-20 07:30:11.592364	2025-05-20 07:30:11.592364	Nguyễn Minh Anh
10	\N	Mon3	1000000.00	0.15	850000.00	120000.00	0.0	26.0	780000.00	0.00	100000.00	1850000.00	0.00	1850000.00	0.00	0.00	280cdd8f-7200-48b1-9215-f7d94e9957aa	2025-05-20 07:30:11.592364	2025-05-20 07:30:11.592364	Phan Gia Hưng
12	\N	Mon3	1200000.00	0.15	1020000.00	120000.00	2.0	26.0	720000.00	200000.00	0.00	2060000.00	0.00	2060000.00	0.00	0.00	21db39c8-1430-4726-a095-89121bc0d201	2025-05-20 07:30:11.592364	2025-05-20 07:30:11.592364	Đỗ Trung Quân
13	\N	Mon3	1200000.00	0.15	1020000.00	120000.00	0.0	26.0	780000.00	200000.00	100000.00	2220000.00	0.00	2220000.00	0.00	0.00	2de151a9-4791-4620-a117-6d09b7e03fde	2025-05-20 07:30:11.592364	2025-05-20 07:30:11.592364	Nguyễn Tuấn Huy
14	\N	Mon3	1200000.00	0.15	1020000.00	120000.00	3.0	26.0	690000.00	0.00	0.00	1830000.00	0.00	1830000.00	0.00	0.00	29440a38-dfe1-4489-b981-13a37f70a088	2025-05-20 07:30:11.592364	2025-05-20 07:30:11.592364	Đặng Quang Trung
15	\N	Mon3	1200000.00	0.15	1020000.00	120000.00	7.0	26.0	570000.00	200000.00	100000.00	2010000.00	0.00	2010000.00	0.00	0.00	5bbcd458-2844-42a0-beca-65757a68bf0a	2025-05-20 07:30:11.592364	2025-05-20 07:30:11.592364	Phùng Hoàng Anh
16	\N	Mon3	1000000.00	0.30	700000.00	120000.00	15.0	26.0	330000.00	200000.00	100000.00	1450000.00	0.00	1450000.00	0.00	0.00	29eb8a39-542b-4fb1-8e33-3cf468d95890	2025-05-20 07:30:11.592364	2025-05-20 07:30:11.592364	Phùng Thiên An
17	\N	Mon3	1000000.00	0.15	850000.00	120000.00	4.0	26.0	660000.00	0.00	0.00	1630000.00	0.00	1630000.00	0.00	0.00	9c403a48-2f08-478d-9d37-d086d5756f8a	2025-05-20 07:30:11.592364	2025-05-20 07:30:11.592364	Phùng Tú Anh
18	\N	Mon3	1000000.00	0.15	850000.00	120000.00	1.0	26.0	750000.00	200000.00	100000.00	2020000.00	0.00	2020000.00	0.00	0.00	483b4d61-469e-44eb-93fa-4fc6af8ac89a	2025-05-20 07:30:11.592364	2025-05-20 07:30:11.592364	Phùng Bích Thư
19	\N	Mon3	1000000.00	0.15	850000.00	120000.00	3.0	26.0	690000.00	0.00	0.00	1660000.00	0.00	1660000.00	0.00	0.00	a257efbe-382a-4718-95cc-2bb0ce13f5f6	2025-05-20 07:30:11.592364	2025-05-20 07:30:11.592364	Lê Khánh Linh
20	\N	Mon3	1000000.00	0.15	850000.00	120000.00	7.0	26.0	570000.00	200000.00	100000.00	1840000.00	0.00	1840000.00	0.00	0.00	9e56c631-09b8-4934-91c8-8dd56c583b3f	2025-05-20 07:30:11.592364	2025-05-20 07:30:11.592364	Trần Hoàng Vy
21	\N	Mon2	1200000.00	0.15	1020000.00	120000.00	1.0	26.0	750000.00	0.00	0.00	1890000.00	0.00	1890000.00	0.00	0.00	226fc08a-0566-452e-b05b-a71fdd50fe89	2025-05-20 07:30:11.592364	2025-05-20 07:30:11.592364	Đỗ Nhật Minh
22	\N	Mon2	1200000.00	0.15	1020000.00	120000.00	2.0	26.0	720000.00	0.00	0.00	1860000.00	0.00	1860000.00	0.00	0.00	ea7e1d30-e539-41f1-85a3-5b41e7d91990	2025-05-20 07:30:11.592364	2025-05-20 07:30:11.592364	Phùng Tiến Đạt
23	\N	Mon3	1200000.00	0.15	1020000.00	120000.00	1.0	26.0	750000.00	0.00	0.00	1890000.00	0.00	1890000.00	0.00	0.00	06c385ff-dafc-4224-8343-7e604312b4d6	2025-05-20 07:30:11.592364	2025-05-20 07:30:11.592364	Nguyễn Khánh Ngân
24	\N	Mon2	1200000.00	0.20	960000.00	120000.00	0.0	27.0	810000.00	0.00	0.00	1890000.00	0.00	1890000.00	0.00	0.00	ee977371-c8d0-406d-90c1-8cffbbd41167	2025-05-20 07:30:11.592364	2025-05-20 07:30:11.592364	Nguyễn Vũ Phong
25	\N	Mon4	1000000.00	0.15	850000.00	120000.00	7.0	26.0	570000.00	200000.00	100000.00	1840000.00	0.00	1840000.00	0.00	0.00	a4c51093-251f-4ece-aec6-e83d86684a8b	2025-05-20 07:30:11.592364	2025-05-20 07:30:11.592364	Nguyễn Ánh Dương
26	\N	Mon4	1000000.00	0.15	850000.00	120000.00	0.0	26.0	780000.00	200000.00	100000.00	2050000.00	0.00	2050000.00	0.00	0.00	a0f1c845-2f5c-4418-b2e1-d3f47f1dd18e	2025-05-20 07:30:11.592364	2025-05-20 07:30:11.592364	Nguyễn Lê Minh Khôi
27	\N	Mon4	1000000.00	0.15	850000.00	120000.00	0.0	26.0	780000.00	200000.00	100000.00	2050000.00	0.00	2050000.00	0.00	0.00	2f3208d6-0bd5-4860-bd8e-68a6780c5820	2025-05-20 07:30:11.592364	2025-05-20 07:30:11.592364	Nguyễn Ngọc Đăng Khôi
28	\N	Mon4	1000000.00	0.15	850000.00	120000.00	6.0	26.0	600000.00	0.00	0.00	1570000.00	0.00	1570000.00	0.00	0.00	1a6056c8-8346-4d59-a317-3a7f1cae339a	2025-05-20 07:30:11.592364	2025-05-20 07:30:11.592364	Nguyễn Gia Huy
29	\N	Mon4	1000000.00	0.15	850000.00	120000.00	4.0	26.0	660000.00	200000.00	100000.00	1930000.00	0.00	1930000.00	0.00	0.00	13edaeb9-158a-4aa4-8414-142d43672b96	2025-05-20 07:30:11.592364	2025-05-20 07:30:11.592364	Nguyễn Ngọc Minh Anh ( Bông)
30	\N	Mon4	1000000.00	0.15	850000.00	120000.00	0.0	26.0	780000.00	200000.00	100000.00	2050000.00	0.00	2050000.00	0.00	0.00	df094a40-8d56-477f-b7e5-6436e0426acd	2025-05-20 07:30:11.592364	2025-05-20 07:30:11.592364	Cao Đức Phong
31	\N	Mon4	1000000.00	0.50	500000.00	120000.00	0.0	26.0	780000.00	0.00	0.00	1400000.00	0.00	1400000.00	0.00	0.00	7541303f-64a0-4e6b-a567-085703f46f29	2025-05-20 07:30:11.592364	2025-05-20 07:30:11.592364	Nguyễn Gia Khiêm
32	\N	Mon4	1000000.00	0.15	850000.00	120000.00	0.0	26.0	780000.00	200000.00	100000.00	2050000.00	0.00	2050000.00	0.00	0.00	7bdc9616-79d3-4a42-a682-6aabfc4ec264	2025-05-20 07:30:11.592364	2025-05-20 07:30:11.592364	Phạm Minh Ngọc
33	\N	Mon4	1000000.00	0.20	800000.00	120000.00	9.0	26.0	510000.00	200000.00	100000.00	1730000.00	0.00	1730000.00	0.00	0.00	a1fa94e9-e0ba-40e3-8217-d756024a6c7a	2025-05-20 07:30:11.592364	2025-05-20 07:30:11.592364	Nguyễn Gia Hân
34	\N	Mon4	1000000.00	0.15	850000.00	120000.00	0.0	26.0	780000.00	0.00	0.00	1750000.00	0.00	1750000.00	0.00	0.00	2a5381e8-270a-44dc-84c2-3c75921c117a	2025-05-20 07:30:11.592364	2025-05-20 07:30:11.592364	Phùng Nguyên Đăng
35	\N	Mon4	1000000.00	0.15	850000.00	120000.00	2.0	26.0	720000.00	200000.00	100000.00	1990000.00	0.00	1990000.00	0.00	0.00	94f12ee6-5c72-4292-9af3-20969e14099c	2025-05-20 07:30:11.592364	2025-05-20 07:30:11.592364	Đỗ Tú Anh
37	2023-04-20	Mon2	1200000.00	0.20	960000.00	120000.00	2.0	26.0	720000.00	0.00	0.00	1800000.00	0.00	1800000.00	0.00	0.00	83571069-d79d-45fe-a274-bef845de01d9	2025-05-20 07:30:11.592364	2025-05-20 07:30:11.592364	Phùng Thế Minh
38	2023-04-11	Mon1	1500000.00	0.15	1275000.00	120000.00	0.0	26.0	650000.00	0.00	0.00	2045000.00	0.00	2045000.00	0.00	0.00	ed0855c3-e350-4a9a-ac3c-bcbaaa0e6c21	2025-05-20 07:30:11.592364	2025-05-20 07:30:11.592364	Phạm Minh Đăng
39	\N	Mon1	1500000.00	0.20	1200000.00	120000.00	2.0	26.0	720000.00	0.00	0.00	2040000.00	0.00	2040000.00	0.00	0.00	1059d654-f696-4ac5-bbd5-58a26e236abe	2025-05-20 07:30:11.592364	2025-05-20 07:30:11.592364	Hoàng Tấn Dũng
40	\N	Mon1	0.00	0.40	0.00	0.00	26.0	26.0	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	bdf8a8f4-2bec-4736-8397-df7076b4fd22	2025-05-20 07:30:11.592364	2025-05-20 07:30:11.592364	Nguyễn Hoàng Phúc (Muối)
41	\N	Mon2	1500000.00	0.20	1200000.00	120000.00	2.0	26.0	720000.00	0.00	0.00	2040000.00	0.00	2040000.00	0.00	0.00	74cadb95-a5ae-4add-acbe-e1833c7dfb13	2025-05-20 07:30:11.592364	2025-05-20 07:30:11.592364	Trần Nguyễn Duy Anh (Mỡ)
42	\N	Mon3	1200000.00	0.30	840000.00	120000.00	0.0	31.0	930000.00	0.00	0.00	2365000.00	0.00	2365000.00	200000.00	275000.00	bdf567d6-3dbc-44d8-b5f6-c9fbcd609c26	2025-05-20 07:30:11.592364	2025-05-20 07:30:11.592364	Nguyễn Minh Châu (Bông)
43	2023-10-23	Mon1	1500000.00	0.40	900000.00	120000.00	3.0	26.0	690000.00	0.00	0.00	1710000.00	0.00	1710000.00	0.00	0.00	902f31e5-69ef-4aa9-b8b7-bf444031e4d4	2025-05-20 07:30:11.592364	2025-05-20 07:30:11.592364	Đỗ Hải Đăng
44	2022-11-26	Mon2 	1200000.00	0.40	720000.00	120000.00	6.0	26.0	600000.00	0.00	0.00	1440000.00	0.00	1440000.00	0.00	0.00	7b212aba-bc86-4fba-b75d-be7de1fdc2e9	2025-05-20 07:30:11.592364	2025-05-20 07:30:11.592364	Đỗ Khánh An
45	\N	Mon4	1000000.00	0.30	700000.00	120000.00	2.0	26.0	720000.00	200000.00	0.00	1740000.00	0.00	1740000.00	0.00	0.00	5a7add0e-f10d-4bac-a456-1c5755d8fc87	2025-05-20 07:30:11.592364	2025-05-20 07:30:11.592364	Nguyễn Hữu Minh Nhật
46	\N	Mon4	1000000.00	0.30	700000.00	120000.00	2.0	26.0	720000.00	200000.00	0.00	1740000.00	0.00	1740000.00	0.00	0.00	f49c90d0-fe80-4205-8255-e0e425a7e7cb	2025-05-20 07:30:11.592364	2025-05-20 07:30:11.592364	Nguyễn Vũ Gia Hân
51	\N	Mon3	1200000.00	0.20	960000.00	120000.00	0.0	26.0	780000.00	0.00	0.00	1860000.00	0.00	1860000.00	0.00	0.00	11b51ece-3cf4-4124-8559-3e0a6988b59c	2025-05-20 07:30:11.592364	2025-05-20 07:30:11.592364	Bin
52	2023-06-05	Mon2	1200000.00	0.30	840000.00	120000.00	0.0	24.0	720000.00	0.00	0.00	2155000.00	0.00	2155000.00	200000.00	275000.00	f078b6f0-6428-4ad2-a723-b8a12ac0f5c4	2025-05-20 07:30:11.592364	2025-05-20 07:30:11.592364	Trần Duy Khánh
53	2024-01-07	Mon1	1500000.00	0.30	1050000.00	120000.00	0.0	24.0	720000.00	0.00	0.00	2365000.00	0.00	2365000.00	200000.00	275000.00	2666189f-7e40-4287-ac8d-b842945730f9	2025-05-20 07:30:11.592364	2025-05-20 07:30:11.592364	Phạm Nhật Minh
54	2023-11-12	Mon1	1500000.00	0.30	1050000.00	120000.00	0.0	19.0	570000.00	0.00	0.00	2215000.00	0.00	2215000.00	200000.00	275000.00	73170a67-f32f-4a67-a478-518448fa7364	2025-05-20 07:30:11.592364	2025-05-20 07:30:11.592364	Nguyễn Hoàng Phúc
55	2024-05-25	Mon1	1500000.00	0.35	975000.00	120000.00	0.0	18.0	540000.00	0.00	0.00	2110000.00	0.00	2110000.00	200000.00	275000.00	237ef658-b2c8-40af-b2a9-c2c4f81f4a24	2025-05-20 07:30:11.592364	2025-05-20 07:30:11.592364	Phùng Châm Anh
1	\N	Mon2	1500000.00	0.15	1275000.00	120000.00	0.0	26.0	780000.00	0.00	0.00	2175000.00	0.00	2175000.00	0.00	0.00	b9012229-a86f-4c66-833f-9c9848b57606	2025-05-20 07:30:11.592364	2025-05-20 07:30:11.592364	Đường Hà Nhi
2	\N	Mon2	1200000.00	0.15	1020000.00	120000.00	3.0	26.0	690000.00	0.00	0.00	1830000.00	0.00	1830000.00	0.00	0.00	ec93ed68-9a4e-4570-b4ed-037d4fee510a	2025-05-20 07:30:11.592364	2025-05-20 07:30:11.592364	Phùng Đức Cường
3	\N	Mon2	1500000.00	0.15	1275000.00	120000.00	0.0	26.0	780000.00	0.00	0.00	2175000.00	0.00	2175000.00	0.00	0.00	b5b3ba04-8410-450f-9e19-c842e1aeef43	2025-05-20 07:30:11.592364	2025-05-20 07:30:11.592364	Nguyễn Diệp Chi
4	\N	Mon2	0.00	0.15	0.00	120000.00	0.0	26.0	780000.00	0.00	0.00	900000.00	0.00	900000.00	0.00	0.00	54d84217-3fab-4393-b77d-df4b64f3cb59	2025-05-20 07:30:11.592364	2025-05-20 07:30:11.592364	Nguyễn Thị Thu Thảo
11	\N	Mon3	1000000.00	0.15	850000.00	120000.00	1.0	26.0	750000.00	0.00	0.00	1720000.00	0.00	1720000.00	0.00	0.00	6142400b-0fa3-4874-94eb-b177ac2a239f	2025-05-20 07:30:11.592364	2025-05-20 07:30:11.592364	Phùng Bảo Hân
36	2021-04-10	Mon4	1000000.00	0.15	850000.00	120000.00	3.0	26.0	690000.00	200000.00	100000.00	1960000.00	0.00	1960000.00	0.00	0.00	169b7e1c-738f-4299-9617-8f3257c0bfe1	2025-05-20 07:30:11.592364	2025-05-20 07:30:11.592364	Nguyễn Trâm Anh
47	2021-03-26	Mon4	1000000.00	0.15	850000.00	120000.00	3.0	26.0	690000.00	0.00	0.00	1660000.00	0.00	1660000.00	0.00	0.00	593ceaf5-7bd7-4035-a354-60b58459baf1	2025-05-20 07:30:11.592364	2025-05-20 07:30:11.592364	Nguyễn Phúc Khang
48	2024-01-03	Mon2	1500000.00	0.20	1200000.00	120000.00	0.0	26.0	780000.00	0.00	0.00	2100000.00	0.00	2100000.00	0.00	0.00	bc4fc578-7b0f-4cd7-96d2-6e4ed46e6790	2025-05-20 07:30:11.592364	2025-05-20 07:30:11.592364	Bùi Minh Hoàng
49	2023-07-25	Mon2	1200000.00	0.30	840000.00	120000.00	0.0	26.0	780000.00	0.00	0.00	1740000.00	0.00	1740000.00	0.00	0.00	9def4348-23b4-44da-866e-6be6d163df4d	2025-05-20 07:30:11.592364	2025-05-20 07:30:11.592364	Nguyễn Tuấn Hưng
50	2024-05-30	Mon1	1800000.00	0.20	1440000.00	120000.00	3.0	26.0	690000.00	0.00	0.00	2250000.00	0.00	2250000.00	0.00	0.00	f2646599-f8d2-4b4c-875e-3a718dfaa144	2025-05-20 07:30:11.592364	2025-05-20 07:30:11.592364	Phùng Nguyên Đức
56	2023-05-11	Mon2	1200000.00	0.50	600000.00	70000.00	0.0	16.0	480000.00	0.00	0.00	1625000.00	0.00	1625000.00	200000.00	275000.00	4710f7e3-f102-48a2-bb3d-6960d198e8d1	2025-05-20 19:23:07.067243	2025-05-20 23:13:29.341697	Bùi Tuấn Lâm
57	\N	Mon1	1400000.00	0.10	1260000.00	120000.00	1.5	24.5	690000.00	0.00	0.00	2070000.00	0.00	2070000.00	0.00	0.00	2e71aea7-2324-429a-ab1c-d8c5c12b63ef	2025-05-23 23:35:26.141421	2025-05-23 23:35:26.141421	VCC
\.


--
-- Data for Name: app_teacher; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.app_teacher (id, role, phone, base_salary, teaching_days, absence_days, received_salary, extra_teaching_days, extra_salary, insurance_support, responsibility_support, breakfast_support, skill_sessions, skill_salary, english_sessions, english_salary, new_students_list, paid_amount, total_salary, note, teacher_no, created_at, updated_at, name) FROM stdin;
e40227a7-2088-4acf-8cb2-db412f83461f	Quản lý, Giáo viên	0982126634	6500000.00	24.0	0.0	6500000.00	1.0	150000.00	500000.00	2000000.00	0.00	0.0	0.00	0.0	0.00	0	0.00	9150000.00	\N	1	2025-05-20 07:30:11.592364	2025-05-23 03:10:55.191551	Hà Thị Thanh Tâm
579251f9-ab20-40ae-9511-a9713e1e31af	Giáo viên	0386849349	6500000.00	6.0	18.0	1625000.00	0.0	0.00	0.00	0.00	0.00	0.0	0.00	0.0	0.00	0	0.00	1625000.00	\N	2	2025-05-20 07:30:11.592364	2025-05-23 03:14:51.790363	Hoàng Thị Thanh Huyền
127fdb88-08fb-450a-af29-54481066bb88	Giáo viên	0984061836	6000000.00	24.0	0.0	6000000.00	3.0	450000.00	500000.00	0.00	0.00	3.0	375000.00	0.0	0.00	200000	0.00	7525000.00	Thế Minh + Vũ Phong đi thêm	3	2025-05-20 07:30:11.592364	2025-05-23 03:15:44.581456	Đỗ Thị Anh
8e7d15a2-a665-483e-8c92-17171e72c6f4	Giáo viên	0337709743	6000000.00	9.0	15.0	2250000.00	0.0	0.00	0.00	0.00	0.00	0.0	0.00	0.0	0.00	100000	0.00	2350000.00	Minh Đăng đi thêm	4	2025-05-20 07:30:11.592364	2025-05-23 22:47:02.909318	Nguyễn Thùy Liên
b0dad27b-6b03-4553-b7a9-61eafc1410c8	Giáo viên	0336614618	0.00	0.0	0.0	0.00	0.0	0.00	0.00	0.00	0.00	0.0	0.00	7.0	1050000.00	0	0.00	1050000.00	\N	6	2025-05-20 07:30:11.592364	2025-05-23 02:55:49.859494	Cô Thúy
737fa159-1221-471f-af35-f31cf7a0b23c	Giáo viên	0393988443	6000000.00	8.5	15.5	2125000.00	0.0	0.00	0.00	0.00	0.00	0.0	0.00	0.0	0.00	100000	0.00	2225000.00	Minh Đăng đi thêm	5	2025-05-20 07:30:11.592364	2025-05-23 23:12:08.766187	Nguyễn Thị Thu Hà
4113764a-c076-48cb-8e66-6032aa32dee8	Giáo viên	0972614883	6000000.00	19.0	5.0	4750000.00	2.0	300000.00	0.00	0.00	0.00	0.0	0.00	0.0	0.00	0	0.00	5050000.00	\N	7	2025-05-20 07:30:11.592364	2025-05-23 23:13:07.59556	Cô Phương
f0ae8a96-a135-4056-aeee-2973c6e01447	Giáo viên	0948865868	5500000.00	13.0	11.0	2979167.00	0.0	0.00	0.00	0.00	0.00	0.0	0.00	0.0	0.00	0	0.00	2979167.00	\N	8	2025-05-20 07:30:11.592364	2025-05-23 23:13:33.840019	Cô Vân
21c2c219-cecb-4f0b-a32e-71c3f1aa8ae3	Giáo viên	0943035111	5000000.00	14.0	10.0	2916667.00	1.0	150000.00	0.00	0.00	0.00	0.0	0.00	0.0	0.00	0	0.00	3066667.00	\N	9	2025-05-20 07:30:11.592364	2025-05-23 23:14:04.557941	Cô Mai Anh
e3c466a1-b384-46fd-9bde-732876bcb0e6	Giáo viên	0375543646	0.00	0.0	0.0	0.00	3.0	450000.00	0.00	0.00	0.00	0.0	0.00	0.0	0.00	0	0.00	450000.00	\N	10	2025-05-20 07:30:11.592364	2025-05-23 23:14:35.436945	Cô Tình
8411f1fe-152a-4cd7-979a-204f4b5030bc	Đầu bếp	\N	5000000.00	24.0	2.0	4615385.00	0.0	0.00	0.00	0.00	0.00	0.0	0.00	0.0	0.00	0	0.00	4615385.00	\N	11	2025-05-20 07:30:11.592364	2025-05-23 23:15:04.24897	Bà Thơ
\.


--
-- Data for Name: app_user; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.app_user (id, name, email, phone, address, image, account_type, role, is_active, code_id, created_at, updated_at, password, code_expired) FROM stdin;
5886021e-e25c-4cbf-85b6-4923fca5e667	Admin	admin@admin.com	0961537211	Hoi Hop, Vinh Yen, Vinh Phuc	https://res.cloudinary.com/drpbgq0fj/image/upload/v1747764948/fbjdnxdyjnzmcmkn5gfp.jpg	LOCAL	ADMIN	t	\N	2025-05-20 18:05:28.415801	2025-05-21 01:18:32.240449	$2b$10$XKOKh9OW4tnmXgzmcsGlNu8baeo30Ho0wLX2PNXXPn9Aq6D.h.c6q	\N
\.


--
-- Data for Name: attendance; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.attendance (id, "teacherId", year, month, full_days, half_days, absent_days, extra_days) FROM stdin;
3	e40227a7-2088-4acf-8cb2-db412f83461f	2025	5	{}	{}	{}	{}
\.


--
-- Data for Name: audit_log_auditlog; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.audit_log_auditlog (id, action, model_name, object_id, changes, "timestamp", ip_address, description, user_id) FROM stdin;
\.


--
-- Data for Name: auth_group; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.auth_group (id, name) FROM stdin;
\.


--
-- Data for Name: auth_group_permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.auth_group_permissions (id, group_id, permission_id) FROM stdin;
\.


--
-- Data for Name: auth_permission; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.auth_permission (id, name, content_type_id, codename) FROM stdin;
1	Can add log entry	1	add_logentry
2	Can change log entry	1	change_logentry
3	Can delete log entry	1	delete_logentry
4	Can view log entry	1	view_logentry
5	Can add permission	2	add_permission
6	Can change permission	2	change_permission
7	Can delete permission	2	delete_permission
8	Can view permission	2	view_permission
9	Can add user	3	add_user
10	Can change user	3	change_user
11	Can delete user	3	delete_user
12	Can view user	3	view_user
13	Can add group	4	add_group
14	Can change group	4	change_group
15	Can delete group	4	delete_group
16	Can view group	4	view_group
17	Can add content type	5	add_contenttype
18	Can change content type	5	change_contenttype
19	Can delete content type	5	delete_contenttype
20	Can view content type	5	view_contenttype
21	Can add session	6	add_session
22	Can change session	6	change_session
23	Can delete session	6	delete_session
24	Can view session	6	view_session
25	Can add User	7	add_user
26	Can change User	7	change_user
27	Can delete User	7	delete_user
28	Can view User	7	view_user
29	Can add Audit Log	8	add_auditlog
30	Can change Audit Log	8	change_auditlog
31	Can delete Audit Log	8	delete_auditlog
32	Can view Audit Log	8	view_auditlog
33	Can add Student	9	add_student
34	Can change Student	9	change_student
35	Can delete Student	9	delete_student
36	Can view Student	9	view_student
37	Can add Teacher	10	add_teacher
38	Can change Teacher	10	change_teacher
39	Can delete Teacher	10	delete_teacher
40	Can view Teacher	10	view_teacher
41	Can add blacklisted token	11	add_blacklistedtoken
42	Can change blacklisted token	11	change_blacklistedtoken
43	Can delete blacklisted token	11	delete_blacklistedtoken
44	Can view blacklisted token	11	view_blacklistedtoken
45	Can add outstanding token	12	add_outstandingtoken
46	Can change outstanding token	12	change_outstandingtoken
47	Can delete outstanding token	12	delete_outstandingtoken
48	Can view outstanding token	12	view_outstandingtoken
49	Can add partial	13	add_partial
50	Can change partial	13	change_partial
51	Can delete partial	13	delete_partial
52	Can view partial	13	view_partial
53	Can add nonce	14	add_nonce
54	Can change nonce	14	change_nonce
55	Can delete nonce	14	delete_nonce
56	Can view nonce	14	view_nonce
57	Can add code	15	add_code
58	Can change code	15	change_code
59	Can delete code	15	delete_code
60	Can view code	15	view_code
61	Can add association	16	add_association
62	Can change association	16	change_association
63	Can delete association	16	delete_association
64	Can view association	16	view_association
65	Can add user social auth	17	add_usersocialauth
66	Can change user social auth	17	change_usersocialauth
67	Can delete user social auth	17	delete_usersocialauth
68	Can view user social auth	17	view_usersocialauth
\.


--
-- Data for Name: auth_user; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.auth_user (id, password, last_login, is_superuser, username, first_name, last_name, email, is_staff, is_active, date_joined) FROM stdin;
\.


--
-- Data for Name: auth_user_groups; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.auth_user_groups (id, user_id, group_id) FROM stdin;
\.


--
-- Data for Name: auth_user_user_permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.auth_user_user_permissions (id, user_id, permission_id) FROM stdin;
\.


--
-- Data for Name: django_admin_log; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.django_admin_log (id, action_time, object_id, object_repr, action_flag, change_message, content_type_id, user_id) FROM stdin;
\.


--
-- Data for Name: django_content_type; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.django_content_type (id, app_label, model) FROM stdin;
1	admin	logentry
2	auth	permission
3	auth	user
4	auth	group
5	contenttypes	contenttype
6	sessions	session
7	users	user
8	audit_log	auditlog
9	students	student
10	teachers	teacher
11	token_blacklist	blacklistedtoken
12	token_blacklist	outstandingtoken
13	social_django	partial
14	social_django	nonce
15	social_django	code
16	social_django	association
17	social_django	usersocialauth
\.


--
-- Data for Name: django_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.django_migrations (id, app, name, applied) FROM stdin;
1	contenttypes	0001_initial	2025-05-20 05:23:48.150282+07
2	auth	0001_initial	2025-05-20 05:23:48.244958+07
3	admin	0001_initial	2025-05-20 05:23:48.27071+07
4	admin	0002_logentry_remove_auto_add	2025-05-20 05:23:48.282016+07
5	admin	0003_logentry_add_action_flag_choices	2025-05-20 05:23:48.292403+07
6	audit_log	0001_initial	2025-05-20 05:23:48.316035+07
7	contenttypes	0002_remove_content_type_name	2025-05-20 05:23:48.339911+07
8	auth	0002_alter_permission_name_max_length	2025-05-20 05:23:48.360176+07
9	auth	0003_alter_user_email_max_length	2025-05-20 05:23:48.371701+07
10	auth	0004_alter_user_username_opts	2025-05-20 05:23:48.383765+07
11	auth	0005_alter_user_last_login_null	2025-05-20 05:23:48.394816+07
12	auth	0006_require_contenttypes_0002	2025-05-20 05:23:48.399383+07
13	auth	0007_alter_validators_add_error_messages	2025-05-20 05:23:48.409237+07
14	auth	0008_alter_user_username_max_length	2025-05-20 05:23:48.42665+07
15	auth	0009_alter_user_last_name_max_length	2025-05-20 05:23:48.438706+07
16	auth	0010_alter_group_name_max_length	2025-05-20 05:23:48.454754+07
17	auth	0011_update_proxy_permissions	2025-05-20 05:23:48.465977+07
18	auth	0012_alter_user_first_name_max_length	2025-05-20 05:23:48.478652+07
19	sessions	0001_initial	2025-05-20 05:23:48.49332+07
20	users	0001_initial	2025-05-20 05:25:06.140741+07
21	students	0001_initial	2025-05-20 05:25:09.293983+07
22	teachers	0001_initial	2025-05-20 05:25:12.780842+07
23	token_blacklist	0001_initial	2025-05-20 05:25:17.120542+07
24	token_blacklist	0002_outstandingtoken_jti_hex	2025-05-20 05:25:17.133809+07
25	token_blacklist	0003_auto_20171017_2007	2025-05-20 05:25:17.155762+07
26	token_blacklist	0004_auto_20171017_2013	2025-05-20 05:25:17.172808+07
27	token_blacklist	0005_remove_outstandingtoken_jti	2025-05-20 05:25:17.187757+07
28	token_blacklist	0006_auto_20171017_2113	2025-05-20 05:25:17.204855+07
29	token_blacklist	0007_auto_20171017_2214	2025-05-20 05:25:17.2447+07
30	token_blacklist	0008_migrate_to_bigautofield	2025-05-20 05:25:17.308252+07
34	social_django	0001_initial	2025-05-20 05:35:15.041012+07
38	token_blacklist	0010_fix_migrate_to_bigautofield	2025-05-20 05:59:07.807832+07
39	token_blacklist	0011_linearizes_history	2025-05-20 05:59:07.812355+07
40	token_blacklist	0012_alter_outstandingtoken_user	2025-05-20 05:59:07.827926+07
\.


--
-- Data for Name: django_session; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.django_session (session_key, session_data, expire_date) FROM stdin;
\.


--
-- Data for Name: migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.migrations (id, "timestamp", name) FROM stdin;
7	1710000000000	CreateTables1710000000000
8	1710000000000	CreateMonthlyStats1710000000000
9	1710000000001	UpdateHistoricalStats1710000000001
10	1716182400001	UpdateStudentTable1716182400001
11	1716182400002	UpdateStudentIdColumn1716182400002
12	1706788800000	CreateAttendanceTable1706788800000
13	1717000000000	UpdateTeacherDecimalFieldsManual1717000000000
14	1717000000001	UpdateStudentDecimalFieldsManual1717000000001
\.


--
-- Data for Name: monthly_stats; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.monthly_stats (id, year, month, total_students, total_teachers, total_fees, total_salaries, created_at, updated_at) FROM stdin;
9c9478e2-013c-49d8-aeb2-cbf62348039a	2025	5	57	12	104380000.00	47270310.00	2025-05-23 00:50:35.821147	2025-05-25 22:20:11.758804
\.


--
-- Data for Name: social_auth_association; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.social_auth_association (id, server_url, handle, secret, issued, lifetime, assoc_type) FROM stdin;
\.


--
-- Data for Name: social_auth_code; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.social_auth_code (id, email, code, verified, "timestamp") FROM stdin;
\.


--
-- Data for Name: social_auth_nonce; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.social_auth_nonce (id, server_url, "timestamp", salt) FROM stdin;
\.


--
-- Data for Name: social_auth_partial; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.social_auth_partial (id, token, next_step, backend, data, "timestamp") FROM stdin;
\.


--
-- Data for Name: social_auth_usersocialauth; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.social_auth_usersocialauth (id, provider, uid, extra_data, created, modified, user_id) FROM stdin;
\.


--
-- Name: attendance_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.attendance_id_seq', 4, true);


--
-- Name: audit_log_auditlog_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.audit_log_auditlog_id_seq', 1, false);


--
-- Name: auth_group_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.auth_group_id_seq', 1, false);


--
-- Name: auth_group_permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.auth_group_permissions_id_seq', 1, false);


--
-- Name: auth_permission_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.auth_permission_id_seq', 68, true);


--
-- Name: auth_user_groups_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.auth_user_groups_id_seq', 1, false);


--
-- Name: auth_user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.auth_user_id_seq', 1, false);


--
-- Name: auth_user_user_permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.auth_user_user_permissions_id_seq', 1, false);


--
-- Name: django_admin_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.django_admin_log_id_seq', 1, false);


--
-- Name: django_content_type_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.django_content_type_id_seq', 17, true);


--
-- Name: django_migrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.django_migrations_id_seq', 40, true);


--
-- Name: migrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.migrations_id_seq', 14, true);


--
-- Name: social_auth_association_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.social_auth_association_id_seq', 1, false);


--
-- Name: social_auth_code_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.social_auth_code_id_seq', 1, false);


--
-- Name: social_auth_nonce_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.social_auth_nonce_id_seq', 1, false);


--
-- Name: social_auth_partial_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.social_auth_partial_id_seq', 1, false);


--
-- Name: social_auth_usersocialauth_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.social_auth_usersocialauth_id_seq', 1, false);


--
-- Name: monthly_stats PK_3247caee66ea9084bc2abeba98a; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.monthly_stats
    ADD CONSTRAINT "PK_3247caee66ea9084bc2abeba98a" PRIMARY KEY (id);


--
-- Name: migrations PK_8c82d7f526340ab734260ea46be; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.migrations
    ADD CONSTRAINT "PK_8c82d7f526340ab734260ea46be" PRIMARY KEY (id);


--
-- Name: attendance PK_ee0ffe42c1f1a01e72b725c0cb2; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT "PK_ee0ffe42c1f1a01e72b725c0cb2" PRIMARY KEY (id);


--
-- Name: app_teacher PK_ffa07456f22a9b16e4abc86598e; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.app_teacher
    ADD CONSTRAINT "PK_ffa07456f22a9b16e4abc86598e" PRIMARY KEY (teacher_no);


--
-- Name: app_teacher UQ_de69baf2ce576427b851323ec28; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.app_teacher
    ADD CONSTRAINT "UQ_de69baf2ce576427b851323ec28" UNIQUE (id);


--
-- Name: app_student app_student_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.app_student
    ADD CONSTRAINT app_student_pkey PRIMARY KEY (sequential_number);


--
-- Name: app_user app_user_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.app_user
    ADD CONSTRAINT app_user_email_key UNIQUE (email);


--
-- Name: app_user app_user_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.app_user
    ADD CONSTRAINT app_user_pkey PRIMARY KEY (id);


--
-- Name: audit_log_auditlog audit_log_auditlog_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_log_auditlog
    ADD CONSTRAINT audit_log_auditlog_pkey PRIMARY KEY (id);


--
-- Name: auth_group auth_group_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_group
    ADD CONSTRAINT auth_group_name_key UNIQUE (name);


--
-- Name: auth_group_permissions auth_group_permissions_group_id_permission_id_0cd325b0_uniq; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_group_permissions
    ADD CONSTRAINT auth_group_permissions_group_id_permission_id_0cd325b0_uniq UNIQUE (group_id, permission_id);


--
-- Name: auth_group_permissions auth_group_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_group_permissions
    ADD CONSTRAINT auth_group_permissions_pkey PRIMARY KEY (id);


--
-- Name: auth_group auth_group_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_group
    ADD CONSTRAINT auth_group_pkey PRIMARY KEY (id);


--
-- Name: auth_permission auth_permission_content_type_id_codename_01ab375a_uniq; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_permission
    ADD CONSTRAINT auth_permission_content_type_id_codename_01ab375a_uniq UNIQUE (content_type_id, codename);


--
-- Name: auth_permission auth_permission_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_permission
    ADD CONSTRAINT auth_permission_pkey PRIMARY KEY (id);


--
-- Name: auth_user_groups auth_user_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_user_groups
    ADD CONSTRAINT auth_user_groups_pkey PRIMARY KEY (id);


--
-- Name: auth_user_groups auth_user_groups_user_id_group_id_94350c0c_uniq; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_user_groups
    ADD CONSTRAINT auth_user_groups_user_id_group_id_94350c0c_uniq UNIQUE (user_id, group_id);


--
-- Name: auth_user auth_user_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_user
    ADD CONSTRAINT auth_user_pkey PRIMARY KEY (id);


--
-- Name: auth_user_user_permissions auth_user_user_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_user_user_permissions
    ADD CONSTRAINT auth_user_user_permissions_pkey PRIMARY KEY (id);


--
-- Name: auth_user_user_permissions auth_user_user_permissions_user_id_permission_id_14a6b632_uniq; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_user_user_permissions
    ADD CONSTRAINT auth_user_user_permissions_user_id_permission_id_14a6b632_uniq UNIQUE (user_id, permission_id);


--
-- Name: auth_user auth_user_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_user
    ADD CONSTRAINT auth_user_username_key UNIQUE (username);


--
-- Name: django_admin_log django_admin_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.django_admin_log
    ADD CONSTRAINT django_admin_log_pkey PRIMARY KEY (id);


--
-- Name: django_content_type django_content_type_app_label_model_76bd3d3b_uniq; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.django_content_type
    ADD CONSTRAINT django_content_type_app_label_model_76bd3d3b_uniq UNIQUE (app_label, model);


--
-- Name: django_content_type django_content_type_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.django_content_type
    ADD CONSTRAINT django_content_type_pkey PRIMARY KEY (id);


--
-- Name: django_migrations django_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.django_migrations
    ADD CONSTRAINT django_migrations_pkey PRIMARY KEY (id);


--
-- Name: django_session django_session_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.django_session
    ADD CONSTRAINT django_session_pkey PRIMARY KEY (session_key);


--
-- Name: social_auth_association social_auth_association_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.social_auth_association
    ADD CONSTRAINT social_auth_association_pkey PRIMARY KEY (id);


--
-- Name: social_auth_association social_auth_association_server_url_handle_078befa2_uniq; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.social_auth_association
    ADD CONSTRAINT social_auth_association_server_url_handle_078befa2_uniq UNIQUE (server_url, handle);


--
-- Name: social_auth_code social_auth_code_email_code_801b2d02_uniq; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.social_auth_code
    ADD CONSTRAINT social_auth_code_email_code_801b2d02_uniq UNIQUE (email, code);


--
-- Name: social_auth_code social_auth_code_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.social_auth_code
    ADD CONSTRAINT social_auth_code_pkey PRIMARY KEY (id);


--
-- Name: social_auth_nonce social_auth_nonce_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.social_auth_nonce
    ADD CONSTRAINT social_auth_nonce_pkey PRIMARY KEY (id);


--
-- Name: social_auth_nonce social_auth_nonce_server_url_timestamp_salt_f6284463_uniq; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.social_auth_nonce
    ADD CONSTRAINT social_auth_nonce_server_url_timestamp_salt_f6284463_uniq UNIQUE (server_url, "timestamp", salt);


--
-- Name: social_auth_partial social_auth_partial_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.social_auth_partial
    ADD CONSTRAINT social_auth_partial_pkey PRIMARY KEY (id);


--
-- Name: social_auth_usersocialauth social_auth_usersocialauth_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.social_auth_usersocialauth
    ADD CONSTRAINT social_auth_usersocialauth_pkey PRIMARY KEY (id);


--
-- Name: social_auth_usersocialauth social_auth_usersocialauth_provider_uid_e6b5e668_uniq; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.social_auth_usersocialauth
    ADD CONSTRAINT social_auth_usersocialauth_provider_uid_e6b5e668_uniq UNIQUE (provider, uid);


--
-- Name: monthly_stats uq_monthly_stats_year_month; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.monthly_stats
    ADD CONSTRAINT uq_monthly_stats_year_month UNIQUE (year, month);


--
-- Name: audit_log_auditlog_user_id_e60de996; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX audit_log_auditlog_user_id_e60de996 ON public.audit_log_auditlog USING btree (user_id);


--
-- Name: auth_group_name_a6ea08ec_like; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX auth_group_name_a6ea08ec_like ON public.auth_group USING btree (name varchar_pattern_ops);


--
-- Name: auth_group_permissions_group_id_b120cbf9; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX auth_group_permissions_group_id_b120cbf9 ON public.auth_group_permissions USING btree (group_id);


--
-- Name: auth_group_permissions_permission_id_84c5c92e; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX auth_group_permissions_permission_id_84c5c92e ON public.auth_group_permissions USING btree (permission_id);


--
-- Name: auth_permission_content_type_id_2f476e4b; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX auth_permission_content_type_id_2f476e4b ON public.auth_permission USING btree (content_type_id);


--
-- Name: auth_user_groups_group_id_97559544; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX auth_user_groups_group_id_97559544 ON public.auth_user_groups USING btree (group_id);


--
-- Name: auth_user_groups_user_id_6a12ed8b; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX auth_user_groups_user_id_6a12ed8b ON public.auth_user_groups USING btree (user_id);


--
-- Name: auth_user_user_permissions_permission_id_1fbb5f2c; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX auth_user_user_permissions_permission_id_1fbb5f2c ON public.auth_user_user_permissions USING btree (permission_id);


--
-- Name: auth_user_user_permissions_user_id_a95ead1b; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX auth_user_user_permissions_user_id_a95ead1b ON public.auth_user_user_permissions USING btree (user_id);


--
-- Name: auth_user_username_6821ab7c_like; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX auth_user_username_6821ab7c_like ON public.auth_user USING btree (username varchar_pattern_ops);


--
-- Name: django_admin_log_content_type_id_c4bce8eb; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX django_admin_log_content_type_id_c4bce8eb ON public.django_admin_log USING btree (content_type_id);


--
-- Name: django_admin_log_user_id_c564eba6; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX django_admin_log_user_id_c564eba6 ON public.django_admin_log USING btree (user_id);


--
-- Name: django_session_expire_date_a5c62663; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX django_session_expire_date_a5c62663 ON public.django_session USING btree (expire_date);


--
-- Name: django_session_session_key_c0390e0f_like; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX django_session_session_key_c0390e0f_like ON public.django_session USING btree (session_key varchar_pattern_ops);


--
-- Name: social_auth_code_code_a2393167; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX social_auth_code_code_a2393167 ON public.social_auth_code USING btree (code);


--
-- Name: social_auth_code_code_a2393167_like; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX social_auth_code_code_a2393167_like ON public.social_auth_code USING btree (code varchar_pattern_ops);


--
-- Name: social_auth_code_timestamp_176b341f; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX social_auth_code_timestamp_176b341f ON public.social_auth_code USING btree ("timestamp");


--
-- Name: social_auth_partial_timestamp_50f2119f; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX social_auth_partial_timestamp_50f2119f ON public.social_auth_partial USING btree ("timestamp");


--
-- Name: social_auth_partial_token_3017fea3; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX social_auth_partial_token_3017fea3 ON public.social_auth_partial USING btree (token);


--
-- Name: social_auth_partial_token_3017fea3_like; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX social_auth_partial_token_3017fea3_like ON public.social_auth_partial USING btree (token varchar_pattern_ops);


--
-- Name: social_auth_usersocialauth_uid_796e51dc; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX social_auth_usersocialauth_uid_796e51dc ON public.social_auth_usersocialauth USING btree (uid);


--
-- Name: social_auth_usersocialauth_uid_796e51dc_like; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX social_auth_usersocialauth_uid_796e51dc_like ON public.social_auth_usersocialauth USING btree (uid varchar_pattern_ops);


--
-- Name: social_auth_usersocialauth_user_id_17d28448; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX social_auth_usersocialauth_user_id_17d28448 ON public.social_auth_usersocialauth USING btree (user_id);


--
-- Name: attendance FK_f54ba615668462ce0f3001c7a4d; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT "FK_f54ba615668462ce0f3001c7a4d" FOREIGN KEY ("teacherId") REFERENCES public.app_teacher(id) ON DELETE CASCADE;


--
-- Name: audit_log_auditlog audit_log_auditlog_user_id_e60de996_fk_auth_user_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_log_auditlog
    ADD CONSTRAINT audit_log_auditlog_user_id_e60de996_fk_auth_user_id FOREIGN KEY (user_id) REFERENCES public.auth_user(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: auth_group_permissions auth_group_permissio_permission_id_84c5c92e_fk_auth_perm; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_group_permissions
    ADD CONSTRAINT auth_group_permissio_permission_id_84c5c92e_fk_auth_perm FOREIGN KEY (permission_id) REFERENCES public.auth_permission(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: auth_group_permissions auth_group_permissions_group_id_b120cbf9_fk_auth_group_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_group_permissions
    ADD CONSTRAINT auth_group_permissions_group_id_b120cbf9_fk_auth_group_id FOREIGN KEY (group_id) REFERENCES public.auth_group(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: auth_permission auth_permission_content_type_id_2f476e4b_fk_django_co; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_permission
    ADD CONSTRAINT auth_permission_content_type_id_2f476e4b_fk_django_co FOREIGN KEY (content_type_id) REFERENCES public.django_content_type(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: auth_user_groups auth_user_groups_group_id_97559544_fk_auth_group_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_user_groups
    ADD CONSTRAINT auth_user_groups_group_id_97559544_fk_auth_group_id FOREIGN KEY (group_id) REFERENCES public.auth_group(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: auth_user_groups auth_user_groups_user_id_6a12ed8b_fk_auth_user_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_user_groups
    ADD CONSTRAINT auth_user_groups_user_id_6a12ed8b_fk_auth_user_id FOREIGN KEY (user_id) REFERENCES public.auth_user(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: auth_user_user_permissions auth_user_user_permi_permission_id_1fbb5f2c_fk_auth_perm; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_user_user_permissions
    ADD CONSTRAINT auth_user_user_permi_permission_id_1fbb5f2c_fk_auth_perm FOREIGN KEY (permission_id) REFERENCES public.auth_permission(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: auth_user_user_permissions auth_user_user_permissions_user_id_a95ead1b_fk_auth_user_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_user_user_permissions
    ADD CONSTRAINT auth_user_user_permissions_user_id_a95ead1b_fk_auth_user_id FOREIGN KEY (user_id) REFERENCES public.auth_user(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: django_admin_log django_admin_log_content_type_id_c4bce8eb_fk_django_co; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.django_admin_log
    ADD CONSTRAINT django_admin_log_content_type_id_c4bce8eb_fk_django_co FOREIGN KEY (content_type_id) REFERENCES public.django_content_type(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: django_admin_log django_admin_log_user_id_c564eba6_fk_auth_user_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.django_admin_log
    ADD CONSTRAINT django_admin_log_user_id_c564eba6_fk_auth_user_id FOREIGN KEY (user_id) REFERENCES public.auth_user(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: social_auth_usersocialauth social_auth_usersocialauth_user_id_17d28448_fk_app_user_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.social_auth_usersocialauth
    ADD CONSTRAINT social_auth_usersocialauth_user_id_17d28448_fk_app_user_id FOREIGN KEY (user_id) REFERENCES public.app_user(id) DEFERRABLE INITIALLY DEFERRED;


--
-- PostgreSQL database dump complete
--

