--
-- PostgreSQL database dump
--

\restrict B8uyy6xRUHeNaENawQHflXW9FcF4QUdQkvDpFyjiQCKqFasU0AaOhr2NnFyn8lz

-- Dumped from database version 18.1
-- Dumped by pg_dump version 18.1

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
-- Name: accountcreationrequeststatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.accountcreationrequeststatus AS ENUM (
    'pending',
    'approved',
    'rejected'
);


ALTER TYPE public.accountcreationrequeststatus OWNER TO postgres;

--
-- Name: durationtype; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.durationtype AS ENUM (
    'full',
    'half_morning',
    'half_afternoon'
);


ALTER TYPE public.durationtype OWNER TO postgres;

--
-- Name: leavestatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.leavestatus AS ENUM (
    'pending',
    'approved',
    'rejected',
    'cancelled'
);


ALTER TYPE public.leavestatus OWNER TO postgres;

--
-- Name: leavetype; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.leavetype AS ENUM (
    'casual',
    'sick',
    'special'
);


ALTER TYPE public.leavetype OWNER TO postgres;

--
-- Name: userrole; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.userrole AS ENUM (
    'worker',
    'manager',
    'hr',
    'admin'
);


ALTER TYPE public.userrole OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: account_creation_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.account_creation_requests (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    phone character varying(20) NOT NULL,
    email character varying(100),
    requested_role public.userrole NOT NULL,
    manager_id integer,
    requested_by integer NOT NULL,
    status public.accountcreationrequeststatus,
    rejection_reason text,
    approved_by integer,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone
);


ALTER TABLE public.account_creation_requests OWNER TO postgres;

--
-- Name: account_creation_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.account_creation_requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.account_creation_requests_id_seq OWNER TO postgres;

--
-- Name: account_creation_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.account_creation_requests_id_seq OWNED BY public.account_creation_requests.id;


--
-- Name: attachments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.attachments (
    id integer NOT NULL,
    leave_request_id integer NOT NULL,
    file_url character varying(500) NOT NULL,
    file_type character varying(50),
    uploaded_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.attachments OWNER TO postgres;

--
-- Name: attachments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.attachments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.attachments_id_seq OWNER TO postgres;

--
-- Name: attachments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.attachments_id_seq OWNED BY public.attachments.id;


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_logs (
    id integer NOT NULL,
    leave_request_id integer,
    action character varying(50) NOT NULL,
    actor_id integer,
    actor_phone character varying(20),
    details text,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.audit_logs OWNER TO postgres;

--
-- Name: audit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.audit_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.audit_logs_id_seq OWNER TO postgres;

--
-- Name: audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.audit_logs_id_seq OWNED BY public.audit_logs.id;


--
-- Name: holidays; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.holidays (
    id integer NOT NULL,
    date date NOT NULL,
    name character varying(100) NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.holidays OWNER TO postgres;

--
-- Name: holidays_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.holidays_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.holidays_id_seq OWNER TO postgres;

--
-- Name: holidays_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.holidays_id_seq OWNED BY public.holidays.id;


--
-- Name: leave_balance_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.leave_balance_history (
    id integer NOT NULL,
    user_id integer NOT NULL,
    leave_type public.leavetype NOT NULL,
    days_changed double precision NOT NULL,
    balance_after double precision NOT NULL,
    reason character varying(200) NOT NULL,
    leave_request_id integer,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.leave_balance_history OWNER TO postgres;

--
-- Name: leave_balance_history_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.leave_balance_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.leave_balance_history_id_seq OWNER TO postgres;

--
-- Name: leave_balance_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.leave_balance_history_id_seq OWNED BY public.leave_balance_history.id;


--
-- Name: leave_balances; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.leave_balances (
    id integer NOT NULL,
    user_id integer NOT NULL,
    casual double precision,
    sick double precision,
    special double precision,
    year integer NOT NULL,
    updated_at timestamp with time zone
);


ALTER TABLE public.leave_balances OWNER TO postgres;

--
-- Name: leave_balances_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.leave_balances_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.leave_balances_id_seq OWNER TO postgres;

--
-- Name: leave_balances_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.leave_balances_id_seq OWNED BY public.leave_balances.id;


--
-- Name: leave_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.leave_requests (
    id integer NOT NULL,
    user_id integer NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    days double precision NOT NULL,
    leave_type public.leavetype NOT NULL,
    duration_type public.durationtype,
    reason text,
    status public.leavestatus,
    rejection_reason text,
    approved_by integer,
    approved_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone
);


ALTER TABLE public.leave_requests OWNER TO postgres;

--
-- Name: leave_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.leave_requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.leave_requests_id_seq OWNER TO postgres;

--
-- Name: leave_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.leave_requests_id_seq OWNED BY public.leave_requests.id;


--
-- Name: processed_messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.processed_messages (
    id integer NOT NULL,
    message_id character varying(100) NOT NULL,
    processed_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.processed_messages OWNER TO postgres;

--
-- Name: processed_messages_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.processed_messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.processed_messages_id_seq OWNER TO postgres;

--
-- Name: processed_messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.processed_messages_id_seq OWNED BY public.processed_messages.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    phone character varying(20) NOT NULL,
    email character varying(100),
    password_hash character varying(255),
    role public.userrole NOT NULL,
    manager_id integer,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: account_creation_requests id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.account_creation_requests ALTER COLUMN id SET DEFAULT nextval('public.account_creation_requests_id_seq'::regclass);


--
-- Name: attachments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attachments ALTER COLUMN id SET DEFAULT nextval('public.attachments_id_seq'::regclass);


--
-- Name: audit_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs ALTER COLUMN id SET DEFAULT nextval('public.audit_logs_id_seq'::regclass);


--
-- Name: holidays id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.holidays ALTER COLUMN id SET DEFAULT nextval('public.holidays_id_seq'::regclass);


--
-- Name: leave_balance_history id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_balance_history ALTER COLUMN id SET DEFAULT nextval('public.leave_balance_history_id_seq'::regclass);


--
-- Name: leave_balances id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_balances ALTER COLUMN id SET DEFAULT nextval('public.leave_balances_id_seq'::regclass);


--
-- Name: leave_requests id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_requests ALTER COLUMN id SET DEFAULT nextval('public.leave_requests_id_seq'::regclass);


--
-- Name: processed_messages id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.processed_messages ALTER COLUMN id SET DEFAULT nextval('public.processed_messages_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: account_creation_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.account_creation_requests (id, name, phone, email, requested_role, manager_id, requested_by, status, rejection_reason, approved_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: attachments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.attachments (id, leave_request_id, file_url, file_type, uploaded_at) FROM stdin;
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.audit_logs (id, leave_request_id, action, actor_id, actor_phone, details, created_at) FROM stdin;
\.


--
-- Data for Name: holidays; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.holidays (id, date, name, created_at) FROM stdin;
4	0026-03-06	birthday	2025-12-08 23:42:37.300158+05:30
\.


--
-- Data for Name: leave_balance_history; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.leave_balance_history (id, user_id, leave_type, days_changed, balance_after, reason, leave_request_id, created_at) FROM stdin;
\.


--
-- Data for Name: leave_balances; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.leave_balances (id, user_id, casual, sick, special, year, updated_at) FROM stdin;
12	13	12	12	5	2025	\N
13	14	12	12	5	2025	\N
14	15	12	12	5	2025	\N
15	16	12	12	5	2025	\N
16	17	12	12	5	2025	\N
17	18	12	12	5	2025	\N
18	19	12	12	5	2025	\N
19	20	12	12	5	2025	\N
20	21	12	12	5	2025	\N
21	22	12	12	5	2025	\N
22	23	12	12	5	2025	\N
23	24	12	12	5	2025	\N
24	25	12	12	5	2025	\N
25	26	12	12	5	2025	\N
26	27	12	12	5	2025	\N
27	28	12	12	5	2025	\N
28	29	12	12	5	2025	\N
29	30	12	12	5	2025	\N
30	31	12	12	5	2025	\N
31	32	12	12	5	2025	\N
32	33	12	12	5	2025	\N
33	34	12	12	5	2025	\N
34	35	12	12	5	2025	\N
35	36	12	12	5	2025	\N
36	37	12	12	5	2025	\N
37	38	12	12	5	2025	\N
38	39	12	12	5	2025	\N
39	40	12	12	5	2025	\N
40	41	12	12	5	2025	\N
41	42	12	12	5	2025	\N
42	43	12	12	5	2025	\N
43	44	12	12	5	2025	\N
44	45	12	12	5	2025	\N
45	46	12	12	5	2025	\N
46	47	12	12	5	2025	\N
47	48	12	12	5	2025	\N
48	49	12	12	5	2025	\N
49	50	12	12	5	2025	\N
50	51	12	12	5	2025	\N
51	52	12	12	5	2025	\N
52	53	12	12	5	2025	\N
53	54	12	12	5	2025	\N
54	55	12	12	5	2025	\N
55	56	12	12	5	2025	\N
56	57	12	12	5	2025	\N
57	58	12	12	5	2025	\N
58	59	12	12	5	2025	\N
59	60	12	12	5	2025	\N
60	61	12	12	5	2025	\N
61	62	12	12	5	2025	\N
62	63	12	12	5	2025	\N
\.


--
-- Data for Name: leave_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.leave_requests (id, user_id, start_date, end_date, days, leave_type, duration_type, reason, status, rejection_reason, approved_by, approved_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: processed_messages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.processed_messages (id, message_id, processed_at) FROM stdin;
1	wamid.HBgMOTE5NTgxNjk3OTU1FQIAEhggQUNBMDE2Qzk5MTA2MUQ5RTI3RjQwQjk3MTc3NTJDOTQA	2025-12-08 19:46:34.592888+05:30
2	wamid.HBgMOTE5NTgxNjk3OTU1FQIAEhggQUMwM0Y4MkE2NkFCNzM5OTNEQjg1RUQzNUQzRkE1RjEA	2025-12-08 19:46:57.143669+05:30
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, name, phone, email, password_hash, role, manager_id, created_at, updated_at) FROM stdin;
13	Sarah Johnson	+1234567001	admin@leaveflow.com	$2b$04$WUB/pfM.dtE7dhw5lPwODuQNhbYDbQN7xDyMW8P.OedWL/qw.O7Kq	admin	\N	2025-12-08 23:31:58.776486+05:30	\N
14	Michael Chen	+1234567002	hr1@leaveflow.com	$2b$04$d67AaDe0OryAt7N9Ykrl8etfXI/KP3xC6rOUblLBj95Glbp1.pAam	hr	\N	2025-12-08 23:31:58.776486+05:30	\N
15	Priya Sharma	+1234567003	hr2@leaveflow.com	$2b$04$Pl1rugp1R.N3zjfA0.MOxeDzdN7fB/Dw90eGP2uqY.X45SiIKA/BC	hr	\N	2025-12-08 23:31:58.776486+05:30	\N
16	Robert Williams	+1234567004	hr3@leaveflow.com	$2b$04$IyN03QwXnvy.gLgdsPjSYeqq.XzrnAqHFM9K8KMZ1i4DqRP18SDSW	hr	\N	2025-12-08 23:31:58.776486+05:30	\N
17	Emily Rodriguez	+1234567010	manager1@leaveflow.com	$2b$04$oQoChBn7UUjRhcc1i/AcM.ndhbPgtlAXyEMhPleL2ts69CMfu0OLu	manager	\N	2025-12-08 23:31:58.776486+05:30	\N
18	David Park	+1234567011	manager2@leaveflow.com	$2b$04$CGmqD2m.A7RfHbDYz8wd/OWutgRnCtb7IH9ipHdY7OcZwNOYP1Myy	manager	\N	2025-12-08 23:31:58.776486+05:30	\N
19	Amanda Foster	+1234567012	manager3@leaveflow.com	$2b$04$LBxvY9kjLbsWMPMqZAgemef.AJZOw.ZWsPORCGC2LdOiOWnCp9AOC	manager	\N	2025-12-08 23:31:58.776486+05:30	\N
20	Kevin Zhang	+1234567013	manager4@leaveflow.com	$2b$04$HfomjViD/iosEbDGxq2y9eXQH2kM7IkEwv8H9/Xytl2SZZTwkoZ4e	manager	\N	2025-12-08 23:31:58.776486+05:30	\N
21	Lisa Brown	+1234567014	manager5@leaveflow.com	$2b$04$6Qy10SampAzqUDqeI7HZq.C0iPdYHBvY0pNutLWDoXVueRpW8tYG2	manager	\N	2025-12-08 23:31:58.776486+05:30	\N
22	Carlos Garcia	+1234567015	manager6@leaveflow.com	$2b$04$p4mbhKJ04Q01vCZwFOzdwe5CpBFom8NxEGpiYS7A9Xqqb5UaR.Piq	manager	\N	2025-12-08 23:31:58.776486+05:30	\N
23	Nina Patel	+1234567016	manager7@leaveflow.com	$2b$04$hVDkzgSCyUrO39aqphg9Tu7nrHp5lP7mBQ/db47k68xkKG4PIbpTO	manager	\N	2025-12-08 23:31:58.776486+05:30	\N
24	Alex Thompson	+1234567050	worker1@leaveflow.com	$2b$04$bgdTY0L.a085juFpTG6eDe3jKlhyoLoDKGqheBfKBYrW8mGt/R.ju	worker	18	2025-12-08 23:31:58.776486+05:30	\N
25	Jessica Lee	+1234567051	worker2@leaveflow.com	$2b$04$Xq2cOOy3kmdUy8qu7oHypuF18XUHxl4214lbt0i0kZ7o/gfPsN47C	worker	22	2025-12-08 23:31:58.776486+05:30	\N
26	Ryan Martinez	+1234567052	worker3@leaveflow.com	$2b$04$MwHlKHkdddDBvfWprexZk.WwlbcYMNAk3x4IA5dCwSRl2jGB.0u0i	worker	18	2025-12-08 23:31:58.776486+05:30	\N
27	Sophia Kumar	+1234567053	worker4@leaveflow.com	$2b$04$cYn1wGfApwKcuHEWQhoWAeFcQPuXK.mtts7C5in56no59C8vw3uRm	worker	22	2025-12-08 23:31:58.776486+05:30	\N
28	James Wilson	+1234567054	worker5@leaveflow.com	$2b$04$W0hC0y3cDI3VfJviNWrbq.83JS0xDRq7L/am4t7rxcdAoqB.CUwV2	worker	23	2025-12-08 23:31:58.776486+05:30	\N
29	Emma Davis	+1234567055	worker6@leaveflow.com	$2b$04$0YO7G1oVWnLFVuryTVhcCONgPW.U2qVsFL6rmEXQY5atuag3mCVvi	worker	20	2025-12-08 23:31:58.776486+05:30	\N
30	Oliver Johnson	+1234567056	worker7@leaveflow.com	$2b$04$PA5V9BJbV41t9APZCWFkNuUCSs3XtslbQ5paNrCzyC1F.5XRUKdVK	worker	17	2025-12-08 23:31:58.776486+05:30	\N
31	Ava Miller	+1234567057	worker8@leaveflow.com	$2b$04$X79r9WcuIE7d5kShWV8fRuygChaAX2/f8UA6cgPxq1F6RpafQ9eYq	worker	22	2025-12-08 23:31:58.776486+05:30	\N
32	Liam Anderson	+1234567058	worker9@leaveflow.com	$2b$04$YFOgAQGh7jxZBewUXcQ9PucUReqA6FnvmR5TI75yhKkc6Yt7Bhy/G	worker	20	2025-12-08 23:31:58.776486+05:30	\N
33	Isabella Taylor	+1234567059	worker10@leaveflow.com	$2b$04$EFbonIYk9DkThcqc8YXrYuKY79iA7PazQcplmjhg5f0ZkfkrAdPLG	worker	18	2025-12-08 23:31:58.776486+05:30	\N
34	Noah Thomas	+1234567060	worker11@leaveflow.com	$2b$04$YvtqiwmOML1kPdDPZwl5ceotYzMDNSBcGrPO4IXmsKvYQgoSJcGk.	worker	21	2025-12-08 23:31:58.776486+05:30	\N
35	Mia Jackson	+1234567061	worker12@leaveflow.com	$2b$04$8H/7rFyTon7TJAnfxVY6J.r9flM7OR6eARC0tLwgqtKiO8bdtv0e6	worker	23	2025-12-08 23:31:58.776486+05:30	\N
36	Ethan White	+1234567062	worker13@leaveflow.com	$2b$04$sHHvZyF9UNG9o0n2d6j4Nug/R68FDqH/oI3q8.IL4uX13HlfZYZo6	worker	21	2025-12-08 23:31:58.776486+05:30	\N
37	Charlotte Harris	+1234567063	worker14@leaveflow.com	$2b$04$Ar.C9rWJwN1ndbZiTo6gFOnZ8nK59afecZHoTglKf8yB8Px3oOBq6	worker	23	2025-12-08 23:31:58.776486+05:30	\N
38	Mason Martin	+1234567064	worker15@leaveflow.com	$2b$04$L37zGFhKwiBfMATjaa618uQpktNcHdSzoMrtwXoxdMuRKoIE9Y.mG	worker	19	2025-12-08 23:31:58.776486+05:30	\N
39	Amelia Thompson	+1234567065	worker16@leaveflow.com	$2b$04$XMDvPnn1eD1wWi/yi/HxxOd.rpkkXosbqVc0ZzBsiNELZB.qtw.W6	worker	21	2025-12-08 23:31:58.776486+05:30	\N
40	Logan Garcia	+1234567066	worker17@leaveflow.com	$2b$04$j6tyyL6k6r2Qe05KjuCCreV/pIEbhXkeoesQUxfj0U7fGlX.Wut.2	worker	20	2025-12-08 23:31:58.776486+05:30	\N
41	Harper Martinez	+1234567067	worker18@leaveflow.com	$2b$04$eV1dWkvL3rsqGWVFUgOfy.4kZL7r9qZRLMmeoBBUDS/0RE.aOkBLW	worker	17	2025-12-08 23:31:58.776486+05:30	\N
42	Lucas Robinson	+1234567068	worker19@leaveflow.com	$2b$04$agmkoE//EKwutFC9glfze..WmyvvjWZUPyvSyZpQ9Xav66PwYFmSK	worker	22	2025-12-08 23:31:58.776486+05:30	\N
43	Evelyn Clark	+1234567069	worker20@leaveflow.com	$2b$04$R2VWvB.m9n..8iyl7ofunO08ox1YaMgqloSzdxtZjc8hqSUxciFjm	worker	21	2025-12-08 23:31:58.776486+05:30	\N
44	Benjamin Rodriguez	+1234567070	worker21@leaveflow.com	$2b$04$.aKTofHLyQY.1ZlVQDXnBueOoUXOtnnZNYEnTiQ7aii48RFZFB2D6	worker	22	2025-12-08 23:31:58.776486+05:30	\N
45	Abigail Lewis	+1234567071	worker22@leaveflow.com	$2b$04$zhDy0F7GS.Fe.G7Zl4VVV.tS76UwiUdb2rxShcb//aPhzJSeqszIu	worker	20	2025-12-08 23:31:58.776486+05:30	\N
46	Henry Lee	+1234567072	worker23@leaveflow.com	$2b$04$KmrptDbu5pFtbvOl.qhHZOQ2krOJ6OHgrWEDlzVBNXHD13wHuMITS	worker	19	2025-12-08 23:31:58.776486+05:30	\N
47	Emily Walker	+1234567073	worker24@leaveflow.com	$2b$04$fooLE0GbrjdhUZHSacTWBe5I0AQugqk6bQYtDbrQlAVG9wDT02tnW	worker	21	2025-12-08 23:31:58.776486+05:30	\N
48	Alexander Hall	+1234567074	worker25@leaveflow.com	$2b$04$R6MA331M8dKc.6bKBlmqOOJobBQcK7MEoIprlZmbg7Zm3eL79vWIW	worker	21	2025-12-08 23:31:58.776486+05:30	\N
49	Sofia Allen	+1234567075	worker26@leaveflow.com	$2b$04$wabW.NBl13RyMcaYlC3LweJvbbJiQwCdX.y0wKhHj3LloSty/xxlO	worker	20	2025-12-08 23:31:58.776486+05:30	\N
50	Daniel Young	+1234567076	worker27@leaveflow.com	$2b$04$B701ucHbnh1dN9vU0XymQeRsGxGzPaU6wNL5tauabaEa8uTKRD61i	worker	21	2025-12-08 23:31:58.776486+05:30	\N
51	Avery Hernandez	+1234567077	worker28@leaveflow.com	$2b$04$a/F22rFTkiSkGBRGevbgCOo.2IzHZRLVTVOeXWh6wC12uZgDz0hAu	worker	21	2025-12-08 23:31:58.776486+05:30	\N
52	Matthew King	+1234567078	worker29@leaveflow.com	$2b$04$l2aMVUOi43cDDrJ5AYtdsONzgHcAJroTXMqlxMr61ZjoSNrnOATWW	worker	19	2025-12-08 23:31:58.776486+05:30	\N
53	Ella Wright	+1234567079	worker30@leaveflow.com	$2b$04$gytG09ZQXwEfStkoVt3o1.Tpu5e3qwZztlMWvpPCVaVGkXoSZsMIK	worker	19	2025-12-08 23:31:58.776486+05:30	\N
54	Joseph Lopez	+1234567080	worker31@leaveflow.com	$2b$04$B4pnQk6NWGQswKLi/3YA4eQ0CKMjtQt64cwfmmWKk.P7G5Ju29DUS	worker	17	2025-12-08 23:31:58.776486+05:30	\N
55	Scarlett Hill	+1234567081	worker32@leaveflow.com	$2b$04$r2m6E4mOW9aPMDjWSNKtie0LiFD8/FSfAcGkTRkkEfFeDXIkfBsli	worker	17	2025-12-08 23:31:58.776486+05:30	\N
56	David Scott	+1234567082	worker33@leaveflow.com	$2b$04$aCL5V0LygfrzVd.Qcjsduulwzps5yCx6vU7Hj5UrlBUqqlormbeGm	worker	23	2025-12-08 23:31:58.776486+05:30	\N
57	Grace Green	+1234567083	worker34@leaveflow.com	$2b$04$KaFqJOSi1Dw9RYDd7k9AMuFogEIqx6ZSsLL43DarNNsGbWCvu.4Ay	worker	18	2025-12-08 23:31:58.776486+05:30	\N
58	Jackson Adams	+1234567084	worker35@leaveflow.com	$2b$04$4Q.AyNUHneJC3jK8VG4Asu8Fe4UOmVcVT17BN9oBCMahrgvHVqfCK	worker	21	2025-12-08 23:31:58.776486+05:30	\N
59	Chloe Baker	+1234567085	worker36@leaveflow.com	$2b$04$VJXmpybB461JDmeI52SXcOtKJh3dPbw4vn8u/zgqwCtZ/uLDZnjwe	worker	20	2025-12-08 23:31:58.776486+05:30	\N
60	Sebastian Nelson	+1234567086	worker37@leaveflow.com	$2b$04$6fo7FBViE7/A8373kPMdXu5WH959tt53SX/4kpImjJS5SZOiS88li	worker	23	2025-12-08 23:31:58.776486+05:30	\N
61	Victoria Carter	+1234567087	worker38@leaveflow.com	$2b$04$p33rvVi/xxXDvhnlf7aoZOwHQ7AB.JB5V15CbT/Hej6s3NRa6FuzK	worker	22	2025-12-08 23:31:58.776486+05:30	\N
62	Jack Mitchell	+1234567088	worker39@leaveflow.com	$2b$04$js9eqxkgsfnn9gTDCMYsL.x72pSUiTxZj/Yz2GQMKhRHezFByouKa	worker	20	2025-12-08 23:31:58.776486+05:30	\N
63	Aria Perez	+1234567089	worker40@leaveflow.com	$2b$04$7pOROb9lKeDfogKz0AdOWeVZEf0b8QVM9GbxEkXsSj.H1Kv0mttdW	worker	22	2025-12-08 23:31:58.776486+05:30	\N
\.


--
-- Name: account_creation_requests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.account_creation_requests_id_seq', 1, false);


--
-- Name: attachments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.attachments_id_seq', 1, false);


--
-- Name: audit_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.audit_logs_id_seq', 1, false);


--
-- Name: holidays_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.holidays_id_seq', 4, true);


--
-- Name: leave_balance_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.leave_balance_history_id_seq', 1, false);


--
-- Name: leave_balances_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.leave_balances_id_seq', 62, true);


--
-- Name: leave_requests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.leave_requests_id_seq', 1, false);


--
-- Name: processed_messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.processed_messages_id_seq', 2, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 63, true);


--
-- Name: account_creation_requests account_creation_requests_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.account_creation_requests
    ADD CONSTRAINT account_creation_requests_email_key UNIQUE (email);


--
-- Name: account_creation_requests account_creation_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.account_creation_requests
    ADD CONSTRAINT account_creation_requests_pkey PRIMARY KEY (id);


--
-- Name: attachments attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attachments
    ADD CONSTRAINT attachments_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: holidays holidays_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.holidays
    ADD CONSTRAINT holidays_pkey PRIMARY KEY (id);


--
-- Name: leave_balance_history leave_balance_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_balance_history
    ADD CONSTRAINT leave_balance_history_pkey PRIMARY KEY (id);


--
-- Name: leave_balances leave_balances_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_balances
    ADD CONSTRAINT leave_balances_pkey PRIMARY KEY (id);


--
-- Name: leave_balances leave_balances_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_balances
    ADD CONSTRAINT leave_balances_user_id_key UNIQUE (user_id);


--
-- Name: leave_requests leave_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_requests
    ADD CONSTRAINT leave_requests_pkey PRIMARY KEY (id);


--
-- Name: processed_messages processed_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.processed_messages
    ADD CONSTRAINT processed_messages_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: ix_account_creation_requests_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_account_creation_requests_id ON public.account_creation_requests USING btree (id);


--
-- Name: ix_account_creation_requests_phone; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_account_creation_requests_phone ON public.account_creation_requests USING btree (phone);


--
-- Name: ix_account_creation_requests_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_account_creation_requests_status ON public.account_creation_requests USING btree (status);


--
-- Name: ix_attachments_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_attachments_id ON public.attachments USING btree (id);


--
-- Name: ix_audit_logs_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_audit_logs_id ON public.audit_logs USING btree (id);


--
-- Name: ix_holidays_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_holidays_date ON public.holidays USING btree (date);


--
-- Name: ix_holidays_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_holidays_id ON public.holidays USING btree (id);


--
-- Name: ix_leave_balance_history_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_leave_balance_history_id ON public.leave_balance_history USING btree (id);


--
-- Name: ix_leave_balance_history_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_leave_balance_history_user_id ON public.leave_balance_history USING btree (user_id);


--
-- Name: ix_leave_balances_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_leave_balances_id ON public.leave_balances USING btree (id);


--
-- Name: ix_leave_requests_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_leave_requests_id ON public.leave_requests USING btree (id);


--
-- Name: ix_leave_requests_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_leave_requests_status ON public.leave_requests USING btree (status);


--
-- Name: ix_leave_requests_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_leave_requests_user_id ON public.leave_requests USING btree (user_id);


--
-- Name: ix_processed_messages_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_processed_messages_id ON public.processed_messages USING btree (id);


--
-- Name: ix_processed_messages_message_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_processed_messages_message_id ON public.processed_messages USING btree (message_id);


--
-- Name: ix_users_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_users_id ON public.users USING btree (id);


--
-- Name: ix_users_phone; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_users_phone ON public.users USING btree (phone);


--
-- Name: account_creation_requests account_creation_requests_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.account_creation_requests
    ADD CONSTRAINT account_creation_requests_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.users(id);


--
-- Name: account_creation_requests account_creation_requests_manager_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.account_creation_requests
    ADD CONSTRAINT account_creation_requests_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES public.users(id);


--
-- Name: account_creation_requests account_creation_requests_requested_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.account_creation_requests
    ADD CONSTRAINT account_creation_requests_requested_by_fkey FOREIGN KEY (requested_by) REFERENCES public.users(id);


--
-- Name: attachments attachments_leave_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attachments
    ADD CONSTRAINT attachments_leave_request_id_fkey FOREIGN KEY (leave_request_id) REFERENCES public.leave_requests(id);


--
-- Name: audit_logs audit_logs_actor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES public.users(id);


--
-- Name: audit_logs audit_logs_leave_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_leave_request_id_fkey FOREIGN KEY (leave_request_id) REFERENCES public.leave_requests(id);


--
-- Name: leave_balance_history leave_balance_history_leave_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_balance_history
    ADD CONSTRAINT leave_balance_history_leave_request_id_fkey FOREIGN KEY (leave_request_id) REFERENCES public.leave_requests(id);


--
-- Name: leave_balance_history leave_balance_history_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_balance_history
    ADD CONSTRAINT leave_balance_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: leave_balances leave_balances_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_balances
    ADD CONSTRAINT leave_balances_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: leave_requests leave_requests_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_requests
    ADD CONSTRAINT leave_requests_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.users(id);


--
-- Name: leave_requests leave_requests_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_requests
    ADD CONSTRAINT leave_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: users users_manager_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--

\unrestrict B8uyy6xRUHeNaENawQHflXW9FcF4QUdQkvDpFyjiQCKqFasU0AaOhr2NnFyn8lz

