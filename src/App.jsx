import { useState, useMemo, useEffect, useRef } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, collection, onSnapshot, serverTimestamp }
  from "firebase/firestore";

// ── FIREBASE CONFIG ── Replace these values with your own from Firebase console
const FB_CONFIG = {
  apiKey:            "AIzaSyCU9q6r1qAGCWCsFE8gwro8bSOoSLTr_YQ",
  authDomain:        "bb-summit-2026.firebaseapp.com",
  projectId:         "bb-summit-2026",
  storageBucket:     "bb-summit-2026.firebasestorage.app",
  messagingSenderId: "251888268350",
  appId:             "1:251888268350:web:e90a8a0522b7a87ff08d6f",
};
let db = null;
try {
  const fbApp = initializeApp(FB_CONFIG);
  db = getFirestore(fbApp);
} catch(e) { console.warn("Firebase init failed — running offline", e); }

// ─── THEME ────────────────────────────────────────────────────────────────────
const LIGHT = {
  bg:"#F5F7F6", surface:"#fff", card:"#fff", border:"rgba(0,0,0,0.07)",
  text:"#1A2A25", muted:"rgba(0,0,0,0.45)", gold:"#9E7C0A", goldBright:"#B8960A",
  green:"#10B981", red:"#E63946", corp:"#4A7AE8", vendor:"#8B6FE8",
  teal:"#0891B2", tealBg:"rgba(8,145,178,0.06)", tealBorder:"rgba(8,145,178,0.12)",
  goldBg:"rgba(184,134,11,0.06)", goldBorder:"rgba(184,134,11,0.15)",
  navBg:"rgba(255,255,255,0.92)", shadow:"0 1px 4px rgba(0,0,0,0.04)",
  inputBg:"#fff", modalBg:"rgba(245,247,246,0.97)", overlayBg:"rgba(0,0,0,0.5)",
};
const DARK = {
  bg:"#0C1518", surface:"#111A1F", card:"#151F25", border:"rgba(34,211,238,0.08)",
  text:"#E8EDE8", muted:"rgba(255,255,255,0.45)", gold:"#F0D060", goldBright:"#F0D060",
  green:"#34D399", red:"#E63946", corp:"#7BA8FF", vendor:"#A78BFA",
  teal:"#22D3EE", tealBg:"rgba(34,211,238,0.06)", tealBorder:"rgba(34,211,238,0.12)",
  goldBg:"rgba(240,208,96,0.06)", goldBorder:"rgba(240,208,96,0.15)",
  navBg:"rgba(12,21,24,0.95)", shadow:"none",
  inputBg:"#151F25", modalBg:"rgba(12,21,24,0.97)", overlayBg:"rgba(0,0,0,0.7)",
};

// ─── GROUP CONFIG ─────────────────────────────────────────────────────────────
const GROUP_INFO = {
  1:{ label:"Group 1", color:"#F4A261", icon:"🎬", locations:["Bolivar","Miami","Clinton","Harrisonville","Moberly","Chillicothe","Lebanon","Monett","Junction City","Leavenworth","Emporia"] },
  2:{ label:"Group 2", color:"#A78BFA", icon:"🎞️", locations:["Claremore","Dodge City","Festus","Grain Valley","Ridgeland","Hannibal","Port Arthur","Ozark","Neosho","Hutchinson"] },
  3:{ label:"Group 3", color:"#4CAF7D", icon:"⭐", locations:["Airway Heights","Athens","Lee's Summit New Longview","Mainstreet KC","North Richland Hills","Wildwood","Sapulpa","Waynesville","Portland","Union Station"] },
  4:{ label:"Group 4", color:"#5B8FFF", icon:"🎥", locations:["Northland 14","Tulsa","Bloomington","Omaha","Lee's Summit 16","Shawnee","Warrensburg","Overland Park"] },
  5:{ label:"Group 5", color:"#D4AF37", icon:"🎟️", locations:["Liberty 12","Liberty JOHNNIE'S","Wesley Chapel","Wentzville","Topeka","Liberty Township","Wylie"] },
  6:{ label:"Group 6 — CEC", color:"#E63946", icon:"🍿", locations:["Ankeny","Blacksburg","Creve Coeur","Red Oak","Grand Island","Joplin"] },
};
const LOCATION_GROUP = {
  "Bolivar":1,"Miami":1,"Clinton":1,"Harrisonville":1,"Moberly":1,"Chillicothe":1,
  "Lebanon":1,"Monett":1,"Junction City":1,"Leavenworth":1,"Emporia":1,
  "Claremore":2,"Dodge City":2,"Festus":2,"Grain Valley":2,"Ridgeland":2,
  "Hannibal":2,"Port Arthur":2,"Ozark":2,"Neosho":2,"Hutchinson":2,
  "Airway Heights":3,"Athens":3,"Lee's Summit New Longview":3,"Mainstreet KC":3,
  "North Richland Hills":3,"Wildwood":3,"Sapulpa":3,"Waynesville":3,"Portland":3,"Union Station":3,
  "Northland 14":4,"Tulsa":4,"Bloomington":4,"Omaha":4,"Lee's Summit 16":4,
  "Shawnee":4,"Warrensburg":4,"Overland Park":4,
  "Liberty 12":5,"Liberty JOHNNIE'S":5,"Wesley Chapel":5,"Wentzville":5,
  "Topeka":5,"Liberty Township":5,"Wylie":5,
  "Ankeny":6,"Blacksburg":6,"Creve Coeur":6,"Red Oak":6,"Grand Island":6,"Joplin":6,
};

// ─── WEDNESDAY ROUND ROBIN ────────────────────────────────────────────────────
const SESSION_COLORS = {
  "Stock Room Glow Up":"#F4A261","FUNdamentals":"#A78BFA","HR Behind the Handbook":"#4CAF7D",
  "Driving the Magic with Metrics":"#5B8FFF","Leaders Set the Tone":"#E63946",
  "Lights Camera, Loyalty":"#D4AF37","Making Guests Fans":"#FF8C42",
  "Lunch & Networking":"#4CAF7D",
};
const ROTATIONS = {
  1:[
    {time:"10:00–10:50 AM", session:"Stock Room Glow Up",                          host:"Jason Foster & Chad Kirby",              loc:"Auditorium 9",  emoji:"📦"},
    {time:"11:00–11:50 AM", session:"Driving the Magic with Metrics",               host:"Curtis Diehl, Michael Hagan & Kent Peterson",   loc:"Auditorium 7",  emoji:"💰"},
    {time:"12:00 PM",       session:"Lunch & Networking",                 host:"",                                              loc:"Johnnie's",     emoji:"🍽️", isLunch:true},
    {time:"1:00–1:50 PM",   session:"FUNdamentals",                       host:"Tyler Rice & Jacob Mellor",                    loc:"Auditorium 4",  emoji:"🎉"},
    {time:"2:00–2:50 PM",   session:"HR Behind the Handbook",                             host:"Pam Carr & James Warner",                      loc:"Auditorium 6",  emoji:"💼"},
    {time:"3:00–3:30 PM",   session:"Lights Camera, Loyalty",host:"Paul Weiss & Haleigh Oetting",                  loc:"Auditorium 12",           emoji:"🎟️"},
    {time:"3:30–4:00 PM",   session:"Making Guests Fans",             host:"Bobbie Bagby & Brett Zornes",                  loc:"Auditorium 12",     emoji:"⭐"},
    {time:"4:00–4:50 PM",   session:"Leaders Set the Tone",        host:"Steven Ramskill & Jeff Horton",                              loc:"Auditorium 8",  emoji:"🎬"},
  ],
  2:[
    {time:"10:00–10:50 AM", session:"FUNdamentals",                       host:"Tyler Rice & Jacob Mellor",                    loc:"Auditorium 4",  emoji:"🎉"},
    {time:"11:00–11:50 AM", session:"Stock Room Glow Up",                          host:"Jason Foster & Chad Kirby",              loc:"Auditorium 9",  emoji:"📦"},
    {time:"12:00–12:50 PM", session:"Driving the Magic with Metrics",               host:"Curtis Diehl, Michael Hagan & Kent Peterson",   loc:"Auditorium 7",  emoji:"💰"},
    {time:"12:50 PM",       session:"Lunch & Networking",                 host:"",                                              loc:"Johnnie's",     emoji:"🍽️", isLunch:true},
    {time:"2:00–2:30 PM",   session:"Lights Camera, Loyalty",host:"Paul Weiss & Haleigh Oetting",                  loc:"Auditorium 12",           emoji:"🎟️"},
    {time:"2:30–3:00 PM",   session:"Making Guests Fans",             host:"Bobbie Bagby & Brett Zornes",                  loc:"Auditorium 12",     emoji:"⭐"},
    {time:"3:00–3:50 PM",   session:"HR Behind the Handbook",                             host:"Pam Carr & James Warner",                      loc:"Auditorium 6",  emoji:"💼"},
    {time:"4:00–4:50 PM",   session:"Leaders Set the Tone",        host:"Steven Ramskill & Jeff Horton",                              loc:"Auditorium 8",  emoji:"🎬"},
  ],
  3:[
    {time:"10:00–10:50 AM", session:"HR Behind the Handbook",                             host:"Pam Carr & James Warner",                      loc:"Auditorium 6",  emoji:"💼"},
    {time:"11:00–11:50 AM", session:"Leaders Set the Tone",        host:"Steven Ramskill & Jeff Horton",                              loc:"Auditorium 8",  emoji:"🎬"},
    {time:"12:00 PM",       session:"Lunch & Networking",                 host:"",                                              loc:"Johnnie's",     emoji:"🍽️", isLunch:true},
    {time:"1:00–1:50 PM",   session:"Stock Room Glow Up",                          host:"Jason Foster & Chad Kirby",              loc:"Auditorium 9",  emoji:"📦"},
    {time:"2:00–2:50 PM",   session:"Driving the Magic with Metrics",               host:"Curtis Diehl, Michael Hagan & Kent Peterson",   loc:"Auditorium 7",  emoji:"💰"},
    {time:"3:00–3:50 PM",   session:"FUNdamentals",                       host:"Tyler Rice & Jacob Mellor",                    loc:"Auditorium 4",  emoji:"🎉"},
    {time:"4:00–4:30 PM",   session:"Lights Camera, Loyalty",host:"Paul Weiss & Haleigh Oetting",                  loc:"Auditorium 12",           emoji:"🎟️"},
    {time:"4:30–5:00 PM",   session:"Making Guests Fans",             host:"Bobbie Bagby & Brett Zornes",                  loc:"Auditorium 12",     emoji:"⭐"},
  ],
  4:[
    {time:"10:00–10:50 AM", session:"Driving the Magic with Metrics",               host:"Curtis Diehl, Michael Hagan & Kent Peterson",   loc:"Auditorium 7",  emoji:"💰"},
    {time:"11:00–11:45 AM", session:"HR Behind the Handbook",                             host:"Pam Carr & James Warner",                      loc:"Auditorium 6",  emoji:"💼"},
    {time:"11:45 AM–12:15", session:"Lights Camera, Loyalty",host:"Paul Weiss & Haleigh Oetting",                  loc:"Auditorium 12",           emoji:"🎟️"},
    {time:"12:15 PM",       session:"Lunch & Networking",                 host:"",                                              loc:"Johnnie's",     emoji:"🍽️", isLunch:true},
    {time:"1:15–1:45 PM",   session:"Making Guests Fans",             host:"Bobbie Bagby & Brett Zornes",                  loc:"Auditorium 12",     emoji:"⭐"},
    {time:"2:00–2:50 PM",   session:"Stock Room Glow Up",                          host:"Jason Foster & Chad Kirby",              loc:"Auditorium 9",  emoji:"📦"},
    {time:"3:00–3:50 PM",   session:"Leaders Set the Tone",        host:"Steven Ramskill & Jeff Horton",                              loc:"Auditorium 8",  emoji:"🎬"},
    {time:"4:00–4:50 PM",   session:"FUNdamentals",                       host:"Tyler Rice & Jacob Mellor",                    loc:"Auditorium 4",  emoji:"🎉"},
  ],
  5:[
    {time:"10:00–10:50 AM", session:"Driving the Magic with Metrics",               host:"Curtis Diehl, Michael Hagan & Kent Peterson",   loc:"Auditorium 7",  emoji:"💰"},
    {time:"11:00–11:50 AM", session:"HR Behind the Handbook",                             host:"Pam Carr & James Warner",                      loc:"Auditorium 6",  emoji:"💼"},
    {time:"12:00–12:50 PM", session:"Leaders Set the Tone",        host:"Steven Ramskill & Jeff Horton",                              loc:"Auditorium 8",  emoji:"🎬"},
    {time:"1:00 PM",        session:"Lunch & Networking",                 host:"",                                              loc:"Johnnie's",     emoji:"🍽️", isLunch:true},
    {time:"2:00–2:30 PM",   session:"Making Guests Fans",             host:"Bobbie Bagby & Brett Zornes",                  loc:"Auditorium 12",     emoji:"⭐"},
    {time:"2:30–3:00 PM",   session:"Lights Camera, Loyalty",host:"Paul Weiss & Haleigh Oetting",                  loc:"Auditorium 12",           emoji:"🎟️"},
    {time:"3:00–3:50 PM",   session:"Stock Room Glow Up",                          host:"Jason Foster & Chad Kirby",              loc:"Auditorium 9",  emoji:"📦"},
    {time:"4:00–4:50 PM",   session:"FUNdamentals",                       host:"Tyler Rice & Jacob Mellor",                    loc:"Auditorium 4",  emoji:"🎉"},
  ],
  6:[
    {time:"10:00–10:50 AM", session:"Leaders Set the Tone",        host:"Steven Ramskill & Jeff Horton",                              loc:"Auditorium 8",  emoji:"🎬"},
    {time:"11:00–11:50 AM", session:"FUNdamentals",                       host:"Tyler Rice & Jacob Mellor",                    loc:"Auditorium 4",  emoji:"🎉"},
    {time:"12:00 PM",       session:"Lunch & Networking",                 host:"",                                              loc:"Johnnie's",     emoji:"🍽️", isLunch:true},
    {time:"1:00–1:50 PM",   session:"HR Behind the Handbook",                             host:"Pam Carr & James Warner",                      loc:"Auditorium 6",  emoji:"💼"},
    {time:"2:00–2:30 PM",   session:"Making Guests Fans",             host:"Bobbie Bagby & Brett Zornes",                  loc:"Auditorium 12",     emoji:"⭐"},
    {time:"2:30–3:00 PM",   session:"Lights Camera, Loyalty",host:"Paul Weiss & Haleigh Oetting",                  loc:"Auditorium 12",           emoji:"🎟️"},
    {time:"3:00–3:50 PM",   session:"Driving the Magic with Metrics",               host:"Curtis Diehl, Michael Hagan & Kent Peterson",   loc:"Auditorium 7",  emoji:"💰"},
    {time:"4:00–4:50 PM",   session:"Stock Room Glow Up",                          host:"Jason Foster & Chad Kirby",              loc:"Auditorium 9",  emoji:"📦"},
  ],
};

// ─── CORPORATE SCHEDULE ──────────────────────────────────────────────────────
const CORPORATE_SCHEDULE = {
  "Tuesday, March 10":[
    {time:"1:30 PM",  event:"🪄 All Company Welcome + State of the Company",  note:"ALL Corporate — Required", emoji:"🪄"},
    {time:"2:15 PM",  event:"😊 HR Session",                                   note:"ALL Corporate — Required", emoji:"😊"},
    {time:"3:30 PM",  event:"📦 Inventory Session",                            note:"If you're involved in this process, please plan to attend", emoji:"📦"},
    {time:"4:15 PM",  event:"📒 Scheduling Session",                           note:"If you're involved in this process, please plan to attend", emoji:"📒"},
    {time:"6:30 PM",  event:"🎬 Film Screening!",                              note:"Optional — Be among the first to see a brand new film before its official release. Popcorn & Soft Drinks provided.", emoji:"🎬"},
  ],
  "Wednesday, March 11":[
    {time:"6:00 PM",  event:"🎳 Main Event — Kansas City North",               note:"Optional, but strongly encouraged! We would love to see you there. If you're presenting at any time during the Summit, your attendance is highly encouraged. Please plan to drive yourself to Main Event.", emoji:"🎳",
      address:"8081 NW Roanridge Rd, Kansas City, MO 64151", mapUrl:"https://maps.google.com/?q=8081+NW+Roanridge+Rd+Kansas+City+MO+64151"},
  ],
  "Thursday, March 12":[
    {time:"1:45 PM",  event:"💻 IT Presentation",                              note:"ALL Corporate — Required", emoji:"💻"},
    {time:"2:30 PM",  event:"🎖️ Years of Service Awards",                     note:"Optional, but encouraged to stay!", emoji:"🎖️"},
    {time:"3:00 PM",  event:"🏆 Awards Ceremony",                              note:"Optional, but encouraged to stay!", emoji:"🏆"},
  ],
};

// ─── HOTEL LOOKUP ─────────────────────────────────────────────────────────────
const LOCATION_HOTEL = {
  "Airway Heights":"TownePlace Suites","Athens":"TownePlace Suites",
  "Blacksburg":"TownePlace Suites","Bloomington":"TownePlace Suites",
  "North Richland Hills":"TownePlace Suites","Port Arthur":"TownePlace Suites",
  "Portland":"TownePlace Suites","Ridgeland":"TownePlace Suites",
  "Wesley Chapel":"TownePlace Suites","Wylie":"TownePlace Suites",
  "Liberty Township":"TownePlace Suites",
  "Ankeny":"Hampton Inn","Bolivar":"Hampton Inn","Chillicothe":"Hampton Inn",
  "Claremore":"Hampton Inn","Clinton":"Hampton Inn","Creve Coeur":"Hampton Inn",
  "Dodge City":"Hampton Inn","Emporia":"Hampton Inn","Festus":"Hampton Inn",
  "Grain Valley":"Hampton Inn","Grand Island":"Hampton Inn","Hannibal":"Hampton Inn",
  "Harrisonville":"Hampton Inn","Hutchinson":"Hampton Inn","Joplin":"Hampton Inn",
  "Junction City":"Hampton Inn","Leavenworth":"Hampton Inn","Lebanon":"Hampton Inn",
  "Lee's Summit 16":"Hampton Inn","Lee's Summit New Longview":"Hampton Inn",
  "Mainstreet KC":"Hampton Inn","Miami":"Hampton Inn","Moberly":"Hampton Inn",
  "Monett":"Hampton Inn","Neosho":"Hampton Inn","Northland 14":"Hampton Inn",
  "Omaha":"Hampton Inn","Overland Park":"Hampton Inn","Ozark":"Hampton Inn",
  "Sapulpa":"Hampton Inn","Shawnee":"Hampton Inn","Topeka":"Hampton Inn",
  "Tulsa":"Hampton Inn","Union Station":"Hampton Inn","Warrensburg":"Hampton Inn",
  "Waynesville":"Hampton Inn","Wentzville":"Hampton Inn","Wildwood":"Hampton Inn",
  "Red Oak":"Hampton Inn","Liberty 12":"Hampton Inn","Liberty JOHNNIE'S":"Hampton Inn",
};
const HOTEL_INFO = {
  "TownePlace Suites":{ emoji:"🏨", color:"#5B8FFF",
    address:"130 S Stewart Rd, Liberty, MO 64068", phone:"(816) 415-9200",
    notes:"Flyers & select corporate staff. Enjoy breakfast every morning at the hotel! Coffee only will be available at the theatre. Check-in after 3 PM." },
  "Hampton Inn":{ emoji:"🏨", color:"#4CAF7D",
    address:"8551 Church Rd, Kansas City, MO 64117", phone:"(816) 415-9600",
    notes:"Theatre managers & drivers. Enjoy breakfast every morning at the hotel! Coffee only will be available at the theatre. Check-in after 3 PM." },
};

// ─── FLIGHTS ─────────────────────────────────────────────────────────────────
const FLIGHTS = [
  { name:"Jake Anderson",       loc:"Airway Heights",       airline:"Southwest",        conf:"AEJG9Z",  arrival:"Sun 1:10 PM",   departure:"Thu 7:10 PM",  notes:"" },
  { name:"Terika Rucker",       loc:"Athens",               airline:"Southwest",        conf:"AFIIAE",  arrival:"Sun 2:40 PM",   departure:"Thu 6:33 PM",  notes:"" },
  { name:"Patrick Doherty",     loc:"Blacksburg",           airline:"American Airlines",conf:"GZYJUV",  arrival:"",              departure:"",             notes:"Made own flight arrangements" },
  { name:"Kirstin Bradel",      loc:"Bloomington",          airline:"Delta",            conf:"F6CT50",  arrival:"Sun 3:04 PM",   departure:"Thu 6:55 PM",  notes:"" },
  { name:"Jeff Horton",         loc:"Corporate",            airline:"Southwest",        conf:"CFC8IE",  arrival:"Sun 11:00 PM",  departure:"Thu 7:55 PM",  notes:"Made own flight arrangements" },
  { name:"Meagan Faulk",        loc:"North Richland Hills", airline:"Southwest",        conf:"AEYREP",  arrival:"Sun 5:00 PM",   departure:"Thu 6:50 PM",  notes:"" },
  { name:"John Bernard",        loc:"Port Arthur",          airline:"United",           conf:"DR9PKF",  arrival:"Sun 4:52 PM",   departure:"Thu 6:13 PM",  notes:"" },
  { name:"Jonathan Turner",     loc:"Portland",             airline:"Southwest",        conf:"ADT92F",  arrival:"Sun 4:35 PM",   departure:"Thu 6:13 PM",  notes:"" },
  { name:"CB Williams",         loc:"Red Oak",              airline:"Southwest",        conf:"AFCF38",  arrival:"",              departure:"",             notes:"" },
  { name:"Charles Pate",        loc:"Ridgeland",            airline:"Southwest",        conf:"ADWIYS",  arrival:"Sun 10:15 AM",  departure:"Thu 6:13 PM",  notes:"" },
  { name:"Yasemin Henningsen",  loc:"Wesley Chapel",        airline:"Southwest",        conf:"AFFGV6",  arrival:"Sun 12:35 PM",  departure:"Thu 6:55 PM",  notes:"" },
  { name:"Alyssa Valenti",      loc:"Wesley Chapel",        airline:"Southwest",        conf:"AFKCPZ",  arrival:"Sun 12:35 PM",  departure:"Thu 6:55 PM",  notes:"" },
  { name:"Christy Hinkley",     loc:"Wylie",                airline:"Southwest",        conf:"AFKQ93",  arrival:"Sun 2:30 PM",   departure:"Thu 6:50 PM",  notes:"" },
  { name:"Jaughn Cyr",          loc:"Wylie",                airline:"Southwest",        conf:"AFPNUR",  arrival:"Sun 2:30 PM",   departure:"Thu 6:50 PM",  notes:"" },
  { name:"Kevin Cowden",        loc:"Liberty Township",     airline:"Southwest",        conf:"AFRSSV",  arrival:"Sun 11:40 AM",  departure:"Thu 6:00 PM",  notes:"" },
  { name:"Steve Ramskill",      loc:"Corporate",            airline:"Delta",            conf:"GCU6VC",  arrival:"Sun 2:54 PM",   departure:"Thu 5:31 PM",  notes:"Made own flight arrangements. Rental car: Hertz #L47741042B0" },
];
const VENDORS = [
    { id:"v_amazonmgm", name:"Amazon MGM Studios",         logo:"🎬", logoUrl:"https://logo.clearbit.com/mgm.com", color:"#FF9900",
    booth:"Studio Row — Lobby", contact:"Branden Miller", days:"Mon–Wed",
    description:"One of Hollywood's biggest studios — Amazon MGM brings an exciting film slate to B&B screens. They're bringing phone ring lights for the welcome bags!",
    quiz:[
      {q:"Amazon MGM Studios is presenting films for which year?",options:["2024","2025","2026","2027"],answer:2},
      {q:"What welcome bag item is Amazon MGM providing?",options:["Hats","Phone ring lights","Water bottles","Tote bags"],answer:1},
      {q:"Amazon MGM's B&B contact is?",options:["Paul Weiss","Brock Bagby","Chris Tickner","Bobbie Bagby"],answer:2},
    ]},
    { id:"v_apple", name:"Apple Industries",               logo:"🍎", logoUrl:"https://logo.clearbit.com/appleind.com", color:"#FF3B30",
    booth:"Lobby", contact:"Heather Blair & Julie K", days:"Tue–Thu",
    description:"Innovative photo booth and entertainment solutions for cinema lobbies. Apple Industries brings fun, revenue-generating experiences to B&B guests.",
    quiz:[
      {q:"Apple Industries provides what type of lobby experience?",options:["Arcade games only","Photo booths & entertainment solutions","VR headsets","Concession stands"],answer:1},
      {q:"Apple Industries' B&B contact is?",options:["Brock Bagby","Bobbie Bagby","Chris Tickner","Tyler Rice"],answer:1},
      {q:"How many contacts does Apple Industries have at the summit?",options:["One","Two","Three","Four"],answer:1},
    ]},
    { id:"v_barco", name:"Barco",                          logo:"🔦", logoUrl:"https://logo.clearbit.com/barco.com", color:"#4CAF7D",
    booth:"Vendor Table", contact:"Casey Collins", days:"Tue–Thu",
    description:"Global leader in cinema projection technology — the projectors powering B&B screens. Stop by their table to learn more!",
    quiz:[
      {q:"What product category is Barco known for in cinema?",options:["Sound systems","Cinema projectors","Ticketing software","Concession equipment"],answer:1},
      {q:"Barco projectors are used in how many cinemas worldwide?",options:["Over 1,000","Over 10,000","Over 50,000","Over 100,000"],answer:2},
      {q:"What is Barco's sponsorship level?",options:["$5,000","$7,500","$2,500","$10,000"],answer:3},
    ]},
    { id:"v_cretors", name:"Cretors",                      logo:"🍿", logoUrl:"https://logo.clearbit.com/cretors.com", color:"#FFA000",
    booth:"Lobby", contact:"Shelly Olson & Brett Torgler", days:"Tue–Thu",
    description:"The original popcorn machine company — Cretors has been making theatres smell amazing since 1885. A cornerstone of the cinema concession experience.",
    quiz:[
      {q:"Cretors is famous for making what?",options:["Projectors","Popcorn machines","Seating","Point-of-sale systems"],answer:1},
      {q:"Cretors has been in business since approximately what year?",options:["1950","1920","1885","1965"],answer:2},
      {q:"How many Cretors reps are attending the summit?",options:["One","Two","Three","Four"],answer:1},
    ]},
    { id:"v_drpepper", name:"Dr Pepper",                   logo:"🥤", logoUrl:"https://logo.clearbit.com/drpepper.com", color:"#8B0000",
    booth:"Lobby", contact:"Mike Riffle", days:"Tuesday",
    description:"B&B's beverage partner keeping guests refreshed in every theatre. Dr Pepper is bringing their famous traveling mugs for the welcome bags!",
    quiz:[
      {q:"What welcome bag item is Dr Pepper providing?",options:["Koozies","Tumblers","Dr Pepper Traveling Mugs","Hats"],answer:2},
      {q:"Dr Pepper is part of which company?",options:["PepsiCo","The Coca-Cola Company","Keurig Dr Pepper","Nestlé"],answer:2},
      {q:"When is Dr Pepper's rep at the summit?",options:["Mon–Wed","Wed–Thu","Tuesday","Thu only"],answer:2},
    ]},
    { id:"v_fandango", name:"Fandango",                    logo:"🎟️", logoUrl:"https://logo.clearbit.com/fandango.com", color:"#FF6B35",
    booth:"Lobby", contact:"Brittany Rials", days:"Tue–Fri",
    description:"The nation's leading digital ticketing platform connecting millions of moviegoers to B&B shows — integrates with the Backstage Pass loyalty program.",
    quiz:[
      {q:"What is Fandango's primary function?",options:["Film distribution","Online movie ticketing","Concession management","Theatre staffing"],answer:1},
      {q:"Fandango connects with B&B's loyalty program — what's it called?",options:["B&B Rewards","Movie Club","Backstage Pass","CinemaPoints"],answer:2},
      {q:"How do most customers use Fandango?",options:["In-person kiosks only","Mobile app and website","Phone calls","None of the above"],answer:1},
    ]},
    { id:"v_gdc", name:"GDC Technology",                   logo:"🖥️", logoUrl:"https://logo.clearbit.com/gdc-tech.com", color:"#1565C0",
    booth:"Auditorium 1 — Presentation", contact:"Tony Adamson", days:"Tue–Thu",
    description:"Leading provider of digital cinema solutions including servers, media storage, and automation systems. GDC is presenting Thursday morning at the summit.",
    quiz:[
      {q:"GDC is best known for which cinema product?",options:["Seating systems","Digital cinema servers & automation","Concession equipment","Loyalty software"],answer:1},
      {q:"GDC's sponsorship level is?",options:["$2,500","$5,000","$10,000","$7,500"],answer:3},
      {q:"When does GDC present at the summit?",options:["Tuesday afternoon","Wednesday morning","Thursday morning","Monday dinner"],answer:2},
    ]},
    { id:"v_haleigh", name:"Haleigh — Influencer/Ambassador", logo:"📱", color:"#E91E9C",
    booth:"Sponsor Table — Lobby", contact:"Haleigh", days:"Tuesday",
    description:"B&B's influencer and brand ambassador bringing social media savvy and community engagement to the summit. Stop by the sponsor table to connect!",
    quiz:[
      {q:"What is Haleigh's role at the summit?",options:["Vendor rep","Influencer & Brand Ambassador","Corporate staff","Presenter"],answer:1},
      {q:"Where is Haleigh's sponsor table?",options:["Auditorium 1","Stockroom","Lobby","Johnnie's"],answer:2},
      {q:"Social media influencers help B&B with what?",options:["Projection setup","Community engagement & brand awareness","Concession supply","Scheduling"],answer:1},
    ]},
    { id:"v_ims", name:"Integrated Media Systems",         logo:"📡", logoUrl:"https://logo.clearbit.com/integratedmediasystems.com", color:"#546E7A",
    booth:"Lobby", contact:"Mohammad Ahmadi", days:"Summit",
    description:"AV integration experts providing cinema-grade audio, video, and control systems. IMS helps B&B deliver the best possible on-screen experience.",
    quiz:[
      {q:"IMS specializes in which type of systems?",options:["Loyalty programs","AV integration & cinema systems","Food & beverage","HR software"],answer:1},
      {q:"What did IMS's payment status show in the summit records?",options:["Not paid","Invoice sent","Paid - confirmed","TBD"],answer:2},
      {q:"IMS's sponsorship level is?",options:["$5,000","$7,500","$2,500","$10,000"],answer:2},
    ]},
    { id:"v_lionsgate", name:"Lionsgate",                  logo:"🦁", logoUrl:"https://logo.clearbit.com/lionsgate.com", color:"#FF5722",
    booth:"Studio Row — Aud 1", contact:"Ryan Garcia & Clara Madenwald", days:"Summit",
    description:"The studio behind John Wick, The Hunger Games, and countless hits. Lionsgate is attending the summit with items at their booth!",
    quiz:[
      {q:"What franchise is Lionsgate famous for?",options:["Fast & Furious","John Wick / Hunger Games","Mission Impossible","Transformers"],answer:1},
      {q:"Lionsgate's B&B contact is?",options:["Brock Bagby","Paul Weiss","Chris Tickner","Bobbie Bagby"],answer:2},
      {q:"Lionsgate will have what at their summit presence?",options:["Nothing","Items at booth","A 30-min presentation","A dinner event"],answer:1},
    ]},
    { id:"v_paramount", name:"Paramount Pictures",         logo:"⭐", logoUrl:"https://logo.clearbit.com/paramount.com", color:"#FFD700",
    booth:"Studio Row — Aud 1", contact:"Tritia Nakamura", days:"Thu",
    description:"One of Hollywood's most iconic studios presenting their exciting 2026 slate. Paramount is bringing SWEATSHIRTS for attendees — presenting Thursday morning. 🧥",
    quiz:[
      {q:"What welcome bag / gift is Paramount bringing?",options:["Hats","Phone cases","Sweatshirts","Tote bags"],answer:2},
      {q:"When does Paramount present?",options:["Tuesday","Wednesday","Thursday","Monday"],answer:2},
      {q:"Studio Row presentations are in which location?",options:["Stockroom","Johnnie's","Auditorium 1","Lobby"],answer:2},
    ]},
    { id:"v_popcorn", name:"Preferred Popcorn",            logo:"🌽", logoUrl:"https://logo.clearbit.com/preferredpopcorn.com", color:"#F9A825",
    booth:"Lobby", contact:"Jayne Davis", days:"Tue–Wed",
    description:"Premium popcorn supplier bringing the best kernels to B&B screens. Preferred Popcorn provides welcome bag gifts including bags and pens!",
    quiz:[
      {q:"What welcome bag items is Preferred Popcorn providing?",options:["T-shirts","Bags & pens","Hats","Phone cases"],answer:1},
      {q:"Preferred Popcorn's B&B contact is?",options:["Brock Bagby","Bobbie Bagby","Chris Tickner","Paul Weiss"],answer:2},
      {q:"Preferred Popcorn is present at the summit which days?",options:["Mon–Thu","Wed–Thu","Tue–Wed","Fri only"],answer:2},
    ]},
    { id:"v_redemption", name:"Redemption Plus",            logo:"🎮", logoUrl:"https://logo.clearbit.com/redemptionplus.com", color:"#2E7D32",
    booth:"Lobby", contact:"Holly Shoaf", days:"Tue–Thu",
    description:"The leader in redemption and entertainment solutions for cinema entertainment centers. Redemption Plus helps B&B's CEC locations drive revenue and guest delight.",
    quiz:[
      {q:"Redemption Plus specializes in which type of solutions?",options:["Food & beverage","Redemption & entertainment","Projection systems","Ticketing"],answer:1},
      {q:"Redemption Plus is particularly relevant for which B&B locations?",options:["All locations","Drive-ins only","CEC entertainment centers","Corporate offices"],answer:2},
      {q:"Redemption Plus's B&B contact is?",options:["Tyler Rice","Brock Bagby","Paul Weiss","Chris Tickner"],answer:1},
    ]},
    { id:"v_screenvision", name:"Screenvision Media",     logo:"📽️", logoUrl:"https://logo.clearbit.com/screenvisionmedia.com", color:"#E63946",
    booth:"Lobby Booth A", contact:"Jessica Benson", days:"Mon–Wed",
    description:"National cinema advertising network powering pre-show entertainment and advertising for hundreds of theatre circuits across the country.",
    quiz:[
      {q:"What does Screenvision primarily provide to theatres?",options:["Projection equipment","Pre-show advertising & entertainment","Concession software","Point-of-sale systems"],answer:1},
      {q:"Which event kicks off Tuesday with a Screenvision presentation?",options:["Thursday Awards","The All Company Gathering","Wednesday Round Robin","Monday Dinner"],answer:1},
      {q:"Where is the Screenvision booth located?",options:["Auditorium 1","Lobby Booth B","Lobby Booth A","Stockroom"],answer:2},
    ]},
    { id:"v_screenx", name:"ScreenX / 4DX",               logo:"🎥", logoUrl:"https://logo.clearbit.com/cj4dx.com", color:"#0D47A1",
    booth:"Auditorium 1 — Presentation", contact:"Duncan McDonald", days:"Mon–Thu",
    description:"The ultimate premium large-format experience. ScreenX wraps the audience in 270° immersive cinema and 4DX moves you into the story. Presenting Tuesday evening!",
    quiz:[
      {q:"ScreenX wraps the audience in how many degrees of screen?",options:["180°","360°","270°","90°"],answer:2},
      {q:"ScreenX / 4DX is a sponsor at what sponsorship level?",options:["$2,500","$5,000","$7,500","$10,000"],answer:3},
      {q:"When is the ScreenX presentation at the summit?",options:["Monday dinner","Tuesday evening","Wednesday wrap-up","Thursday morning"],answer:1},
    ]},
    { id:"v_sony", name:"Sony Pictures",                   logo:"🎥", logoUrl:"https://logo.clearbit.com/sonypictures.com", color:"#A78BFA",
    booth:"Studio Row — Aud 1", contact:"Wesley Ratliffe", days:"Wed–Thu",
    description:"Columbia Pictures, Screen Gems, and more — Sony brings a powerful film slate to B&B screens every year. Presenting their 2026 lineup on Thursday. Items in welcome bags after presentation!",
    quiz:[
      {q:"Which logo is Sony Pictures known for?",options:["A golden star","The Torch Lady","A film reel","A castle"],answer:1},
      {q:"When does Sony present?",options:["10:00 AM Thursday","11:15 AM Thursday","1:15 PM Thursday","2:30 PM Thursday"],answer:0},
      {q:"Sony Pictures is part of which parent company?",options:["Disney","Warner Bros","Sony Group Corporation","Comcast"],answer:2},
    ]},
    { id:"v_vivian", name:"Vivian",                        logo:"💼", logoUrl:"https://logo.clearbit.com/vivianhealth.com", color:"#7B1FA2",
    booth:"Lobby", contact:"Matt Kopp", days:"Mon–Wed",
    description:"Innovative solutions partner helping B&B theatres grow. Vivian brings tools and expertise to elevate the guest experience across B&B locations.",
    quiz:[
      {q:"Vivian's rep at the summit is?",options:["Jessica Benson","Matt Kopp","Holly Shoaf","Tony Adamson"],answer:1},
      {q:"Vivian is present at the summit which days?",options:["Tue–Thu","Mon–Wed","Wed–Thu","Mon only"],answer:1},
      {q:"What is Vivian's sponsorship level?",options:["$5,000","$10,000","$7,500","$2,500"],answer:3},
    ]},
];

// ─── SCHEDULE ────────────────────────────────────────────────────────────────
const SCHEDULE = {
  "Monday, March 9":[
    {time:"1:30 PM",  event:"District Manager Stockroom Training",                loc:"Stockroom",                  venue:"🏪"},
    {time:"2:30 PM",  event:"Registration",                                       loc:"Main Lobby",                 venue:"🏛️"},
    {time:"3:00 PM",  event:"CEC Meeting",                                        loc:"Auditorium 12",              venue:"🎬"},
    {time:"6:00 PM+",        event:"🍽️ Dinner — Johnnie's Jazz Bar & Grill. Build-Your-Own Sliders & Fresh Salad Bar — craft your perfect bite with a spread of slider options and toppings. Use your drink tickets received at registration — valid for mocktails, cocktails, and specialty sodas. Bartenders on hand all evening!", loc:"Johnnie's Jazz Bar & Grill", venue:"🎷", food:true},
    {time:"6:15 PM",         event:"RealD — Special Guest Dinner. Meet and Greet",       loc:"Johnnie's Jazz Bar & Grill", venue:"🎷"},
    {time:"7:00 PM",  event:"🚌 Transport from Theatre to Hotel",                 loc:"Hotel",                      venue:"🚌"},
  ],
  "Tuesday, March 10":[
    {time:"Breakfast",          event:"🍳 Breakfast at Home or Hotel",                     loc:"Home / Hotel",               venue:"🏨", food:true},
    {time:"9:30 AM",   event:"☕️ Coffee & Juice Provided at the Theatre",          loc:"Johnnie's Jazz Bar & Grill", venue:"🎷", food:true},
    {time:"10:00 AM",  event:"🍽️ F&B Town Meeting (Food & Bar Managers)",         loc:"Auditorium 12",              venue:"🎬"},
    {time:"11:15 AM",  event:"✅ Non-CEC Registration",                            loc:"Main Lobby",                 venue:"🏛️"},
    {time:"11:30 AM",event:"📽️ ScreenX Presentation — If you have a ScreenX in your location, please attend this presentation prior to attending lunch.", loc:"Auditorium 1", venue:"🎬"},
    {time:"11:30 AM",   event:"🍽️ Lunch & ✔️ Vendor Meet & Greet Tables Open — Meddy's Mediterranean: Chicken & Steak Shawarma with garlic potatoes, roasted veggies, Mediterranean salad, and hummus with warm chips & pita. Falafel available for vegetarians. Check in and earn points via the app 🎯", loc:"Johnnie's & Main Lobby", venue:"🎷", food:true},
    {time:"1:15 PM",    event:"🎬 B&B Circle Up! — When you enter the auditorium, don't grab a seat just yet. We're forming one big circle — lined up by the year you joined the B&B family. From our founding in 1924 to our newest team members in 2026, every year matters. Every person matters. Take a look around. This circle? That's what Creating Community looks like.", loc:"Auditorium 1", venue:"🎬"},
    {time:"1:30 PM",    event:"📽️ Screenvision Presentation",                     loc:"Auditorium 1",               venue:"🎬"},
    {time:"1:45 PM",    event:"🪄 All Company Gathering — Welcome & State of Company", loc:"Auditorium 1",            venue:"🎬"},
    {time:"2:15 PM",    event:"😊 Respect. Safety. Belonging. Creating Community Within — HR", loc:"Auditorium 1",    venue:"🎬"},
    {time:"3:15 PM",    event:"Break",                                              loc:"Lobby",                      venue:"☕️"},
    {time:"3:30 PM",    event:"📦 The Inventory Standard",                          loc:"Auditorium 1",               venue:"🎬"},
    {time:"4:15 PM",    event:"📒 Smart Scheduling — Amanda Carmichael",                       loc:"Auditorium 1",               venue:"🎬"},
    {time:"4:45 PM",    event:"Break",                                              loc:"Lobby",                      venue:"☕️"},
    {time:"5:00 PM",    event:"👨‍🏫 Training the Magic — Training & Development", loc:"Auditorium 1",  venue:"🎬"},
    {time:"5:45 PM",    event:"🍕 Dinner — J&S Pizza (Local & Cinema-Obsessed!). A mountain of hand-crafted pizzas — Cheese, Pepperoni, Sausage, Veggie, and Gluten-Free options. Spinach & Chicken Salads, Turkey Bacon Ranch, and a classic Garden Salad. Save room for fresh-baked Chocolate Chip, Snickerdoodle, M&M, and Sugar Cookies. Use your drink tickets at the bar or grab a soda from concessions!", loc:"Auditorium 1", venue:"🍕", food:true},
    {time:"6:15 PM",    event:"📽️ ScreenX Presentation",                          loc:"Auditorium 1",               venue:"🎬"},
    {time:"6:30 PM+",          event:"📽️ Studio Screening",                               loc:"Auditorium 1",               venue:"🎬"},
    {time:"9:00 PM",   event:"🎉 After Party & Dessert",                          loc:"Johnnie's Jazz Bar & Grill", venue:"🎷", food:true},
    {time:"10:15 PM",          event:"🚌 Bus Returns to Hotels",                           loc:"Hotel",                      venue:"🚌"},
  ],
  "Wednesday, March 11":[
    {time:"Breakfast",        event:"🍳 Breakfast at Home or Hotel",                     loc:"Home / Hotel",               venue:"🏨", food:true},
    {time:"9:30 AM", event:"☕ Coffee & Juice Provided at the Theatre — grab a cup and get ready for Round Robin day!", loc:"Johnnie's Jazz Bar & Grill", venue:"🎷", food:true},
    {time:"10:00 AM", event:"🔄 Round Robin Sessions (see My Group tab!)",        loc:"Aud 1 / 4 / 6 / 7 / 8 / 9 / 12", venue:"🎬"},
    {time:"Staggered",       event:"🍽️ Lunch — Brancato's Catering. Slow-smoked Beef Brisket with au jus and Grilled Chicken, garlic whipped mashed potatoes with pan gravy, green beans, pasta salad, garden salad, warm rolls, and fudge brownies. See My Group Tab for your time!", loc:"Johnnie's Jazz Bar & Grill", venue:"🎷", food:true},
    {time:"5:00 PM",  event:"🚌 Buses → Main Event (Managers Only — Corp drive yourself)", loc:"Liberty Cinema 12", venue:"🚌"},
    {time:"5:30 PM",  event:"🎳 Off-Site Activity & Dinner at Main Event — 🔥 BBQ Feast! Pork Ribs, Grilled Chicken Legs & Thighs, and Smoked Jalapeño Cheddar Sausage. Baked Mac & Cheese, Baked Beans & Bacon, House-Made Potato Salad, Coleslaw, Seasonal Fruit, and Honey Cornbread with honey butter. 🎟️ Please check in at the welcome table to receive your drink tickets for the night and arcade information! Corporate employees in KC Metro — drive yourself. 8081 NW Roanridge Rd., Kansas City, MO 64151", loc:"Main Event", venue:"🎳", food:true},
    {time:"8:45 PM",  event:"🚌 Return Trip to Hotel and Theatre",               loc:"Hotel / Theatre",            venue:"🚌"},
  ],
  "Thursday, March 12":[
    {time:"Breakfast",        event:"🍳 Breakfast at Home or Hotel",                     loc:"Home / Hotel",               venue:"🏨", food:true},
    {time:"9:30 AM", event:"🍩 Donuts, Coffee & Juice at the Theatre — the sweetest way to start the final day!", loc:"Johnnie's Jazz Bar & Grill", venue:"🎷", food:true},
    {time:"10:00 AM",event:"🎥 Sony — Studio Presentation",                     loc:"Auditorium 1",               venue:"🎥"},
    {time:"10:15 AM",event:"🎞️ Programming — Chad Christopher & Ed Carl",      loc:"Auditorium 1",               venue:"🎬"},
    {time:"10:45 AM",event:"📽️ GDC Presentation",                              loc:"Auditorium 1",               venue:"🎬"},
    {time:"11:00 AM",event:"⭐ Paramount — Studio Presentation",                loc:"Auditorium 1",               venue:"⭐"},
    {time:"11:15 AM",event:"🔨 Facilities Maintenance",                         loc:"Auditorium 1",               venue:"🎬"},
    {time:"11:45 AM",event:"🦁 Lionsgate Presentation",                         loc:"Auditorium 1",               venue:"🎬"},
    {time:"12:00 PM", event:"🍽️ Lunch — Rancho Grande. 🌮 Taco Bar! Ground Beef & Shredded Chicken Tacos plus Bean Burritos, with beans, rice, queso, guac, sour cream, and pico. Churros for dessert — the perfect send-off meal!", loc:"Johnnie's Jazz Bar & Grill", venue:"🎷", food:true},
    {time:"1:15 PM",  event:"🎉 Cheers! — Paul Farnsworth & Toma Foster",       loc:"Auditorium 1",               venue:"🎬"},
    {time:"1:45 PM",  event:"💻 Smart Systems, Seamless Experiences — IT Talks", loc:"Auditorium 1",               venue:"🎬"},
    {time:"2:15 PM",  event:"☕️ Break",                                          loc:"Lobby",                      venue:"☕️"},
    {time:"2:30 PM",  event:"🎖️ Years of Service Recognition",                  loc:"Auditorium 1",               venue:"🏆"},
    {time:"3:00 PM",  event:"🏆 Awards Ceremony",                                loc:"Auditorium 1",               venue:"🏆"},
  ],
};
const DAYS = ["Monday, March 9","Tuesday, March 10","Wednesday, March 11","Thursday, March 12"];

// ─── AWARD CATEGORIES ────────────────────────────────────────────────────────
const SPOTLIGHT_AWARDS = [
  { id:"iconic",     emoji:"🎬", label:"Unapologetically Iconic",          desc:"You owned the moment." },
  { id:"lowkey",     emoji:"🌟", label:"Low Key Famous by Lunch",           desc:"Your reputation traveled fast." },
  { id:"charisma",   emoji:"✨", label:"Peak Charisma Award",               desc:"You made connection look effortless." },
  { id:"gravity",    emoji:"🪐", label:"Social Gravity Award",              desc:"People just kept orbiting you." },
  { id:"moviequote", emoji:"🎥", label:"Most Likely to Use a Movie Quote",  desc:"And somehow it was perfectly timed." },
  { id:"nametag",   emoji:"🏷️", label:"Best Designed Name Tag",             desc:"Creativity on full display." },
];
const VALUE_AWARDS = [
  { id:"family",    emoji:"🏠", label:"Made Me Feel Like Family",  desc:"You turned a stranger into someone who belonged." },
  { id:"joyfilled", emoji:"🌈", label:"Most Joyfilled",            desc:"Your joy was unmistakable." },
  { id:"fun",       emoji:"🎉", label:"Most FUN",                  desc:"You made every interaction lighter." },
];
const ALL_AWARDS = [...SPOTLIGHT_AWARDS, ...VALUE_AWARDS];

const VERIFY_QUESTIONS = [
  "What's one thing you learned about them?",
  "What made your conversation memorable?",
  "What's something they're proud of at their theatre?",
  "What did you discover you have in common?",
  "Share one word that describes their energy.",
  "What's a goal they mentioned?",
  "What surprised you most about them?",
];

// ─── ALL ATTENDEES (134 people, A–Z) ─────────────────────────────────────────
const GROUP_COLOR = {"Group 1":"#F4A261","Group 2":"#A78BFA","Group 3":"#4CAF7D","Group 4":"#5B8FFF","Group 5":"#D4AF37","Group 6":"#E63946","Corporate":"#6A4C93"};
const GROUP_ICON = {"Group 1":"🎬","Group 2":"🎞️","Group 3":"⭐","Group 4":"🎥","Group 5":"🎟️","Group 6":"🍿","Corporate":"🏢"};
const ATTENDEES = [
  { id:  1, name:"Abraham LaFrance",    role:"General Manager",                   theatre:"Monett",                    group:"Group 1", corporate:false },
  { id:  2, name:"Alyssa Valenti",      role:"Operations Manager",                theatre:"Wesley Chapel",             group:"Group 5", corporate:false },
  { id:  3, name:"Bobby Hartley",       role:"General Manager",                   theatre:"Overland Park",             group:"Group 4", corporate:false },
  { id:  4, name:"Bobby Kittel",        role:"General Manager",                   theatre:"Lee's Summit New Longview", group:"Group 3", corporate:false },
  { id:  5, name:"Bradley Butin",      role:"Marketing & Communications Specialist",                   theatre:"Ankeny",                    group:"Group 6", corporate:false },
  { id:  6, name:"Brandi Heinsohn",     role:"General Manager",                   theatre:"Harrisonville",             group:"Group 1", corporate:false },
  { id:  7, name:"Brandon Winchester",  role:"General Manager",                   theatre:"Northland 14",              group:"Group 4", corporate:false },
  { id:  8, name:"Bryan Langston",      role:"Operations Manager",                theatre:"Topeka",                    group:"Group 5", corporate:false },
  { id:  9, name:"CB Williams",         role:"General Manager",                   theatre:"Red Oak",                   group:"Group 6", corporate:false },
  { id: 10, name:"Charles Pate",        role:"General Manager",                   theatre:"Ridgeland",                 group:"Group 2", corporate:false },
  { id: 11, name:"Christy Hinkley",     role:"General Manager",                   theatre:"Wylie",                     group:"Group 5", corporate:false },
  { id: 12, name:"Cole Watkins",        role:"General Manager",                   theatre:"Liberty Johnnie's",         group:"Group 5", corporate:false },
  { id: 13, name:"Connor Arnold",       role:"General Manager",                   theatre:"Hannibal",                  group:"Group 2", corporate:false },
  { id: 14, name:"Dalton Crooks",       role:"Operations Manager",                theatre:"Red Oak",                   group:"Group 6", corporate:false },
  { id: 15, name:"Davin Cruz",          role:"General Manager",                   theatre:"Waynesville",               group:"Group 3", corporate:false },
  { id: 16, name:"Denell Stein",        role:"General Manager",                   theatre:"Moberly",                   group:"Group 1", corporate:false },
  { id: 17, name:"Dylan McGhee",        role:"General Manager",                   theatre:"Wildwood",                  group:"Group 3", corporate:false },
  { id: 18, name:"Emily Hall",          role:"General Manager",                   theatre:"Lebanon",                   group:"Group 1", corporate:false },
  { id: 19, name:"Eric Williams",       role:"General Manager",                   theatre:"Grain Valley",              group:"Group 2", corporate:false },
  { id: 20, name:"Erica Close",         role:"General Manager",                   theatre:"Shawnee",                   group:"Group 4", corporate:false },
  { id: 21, name:"Faro Rodakowski",     role:"Operations Manager",                theatre:"Wentzville",                group:"Group 5", corporate:false },
  { id: 22, name:"Gage Roberts",        role:"General Manager",                   theatre:"Neosho",                    group:"Group 2", corporate:false },
  { id: 23, name:"Jacob Berggren",      role:"General Manager",                   theatre:"Topeka",                    group:"Group 5", corporate:false },
  { id: 24, name:"Jacob Lynch",         role:"General Manager",                   theatre:"Claremore",                 group:"Group 2", corporate:false },
  { id: 25, name:"Jake Anderson",       role:"General Manager",                   theatre:"Airway Heights",            group:"Group 3", corporate:false },
  { id: 26, name:"Jaughn Cyr",          role:"Operations Manager",                theatre:"Wylie",                     group:"Group 5", corporate:false },
  { id: 27, name:"JC Roberts",          role:"Operations Manager",                theatre:"Joplin",                    group:"Group 6", corporate:false },
  { id: 28, name:"Jeremy Mack",         role:"General Manager",                   theatre:"Miami",                     group:"Group 1", corporate:false },
  { id: 29, name:"Joe Kitchen",         role:"General Manager",                   theatre:"Hutchinson",                group:"Group 2", corporate:false },
  { id: 30, name:"John Bernard",        role:"General Manager",                   theatre:"Port Arthur",               group:"Group 2", corporate:false },
  { id: 31, name:"Jonathan Turner",     role:"General Manager",                   theatre:"Portland",                  group:"Group 3", corporate:false },
  { id: 32, name:"Josh McConnell",      role:"General Manager",                   theatre:"Joplin",                    group:"Group 6", corporate:false },
  { id: 33, name:"Josh Wickwire",       role:"General Manager",                   theatre:"Omaha",                     group:"Group 4", corporate:false },
  { id: 35, name:"Karen Calderon",      role:"General Manager",                   theatre:"Emporia",                   group:"Group 1", corporate:false },
  { id: 36, name:"Kathy Mys",           role:"General Manager",                   theatre:"Leavenworth",               group:"Group 1", corporate:false },
  { id: 37, name:"Keaton Potter",       role:"Operations Manager",                theatre:"Lee's Summit 16",           group:"Group 4", corporate:false },
  { id: 38, name:"Kelly Kinne",         role:"Operations Manager",                theatre:"Chillicothe",               group:"Group 1", corporate:false },
  { id: 39, name:"Kelly Morris",        role:"General Manager",                   theatre:"Warrensburg",               group:"Group 4", corporate:false },
  { id: 40, name:"Kevin Cowden",        role:"General Manager",                   theatre:"Liberty Township",          group:"Group 5", corporate:false },
  { id: 41, name:"Kevin White",         role:"Director of Facilities Management",  theatre:"Overland Park",             group:"Group 4", corporate:false },
  { id: 42, name:"Kirstin Bradel",      role:"General Manager",                   theatre:"Bloomington",               group:"Group 4", corporate:false },
  { id: 43, name:"Kris Simmons",        role:"General Manager",                   theatre:"Union Station KC",          group:"Group 3", corporate:false },
  { id: 44, name:"Lindsey Lorscheider", role:"General Manager",                   theatre:"Ozark",                     group:"Group 2", corporate:false },
  { id: 45, name:"Lisa Crane",          role:"Operations Manager",                theatre:"Overland Park",             group:"Group 4", corporate:false },
  { id: 46, name:"Lovie Lightner",      role:"General Manager",                   theatre:"Chillicothe",               group:"Group 1", corporate:false },
  { id: 47, name:"Lucas Slater",        role:"Operations Manager",                theatre:"Mainstreet KC",             group:"Group 3", corporate:false },
  { id: 48, name:"Lucas Ventura",      role:"Marketing & Events Manager",        theatre:"Grand Island",              group:"Group 6", corporate:false },
  { id: 49, name:"Matt Rice",           role:"General Manager",                   theatre:"Clinton",                   group:"Group 1", corporate:false },
  { id: 50, name:"Matthew Collishaw",   role:"Operations Manager",                theatre:"Tulsa",                     group:"Group 4", corporate:false },
  { id: 51, name:"Meagan Faulk",        role:"General Manager",                   theatre:"North Richland Hills",      group:"Group 3", corporate:false },
  { id: 52, name:"Melissa Riesenberg",  role:"General Manager",                   theatre:"Ankeny",                    group:"Group 6", corporate:false },
  { id: 53, name:"Mike Schmidt",        role:"General Manager",                   theatre:"Grand Island",              group:"Group 6", corporate:false },
  { id: 54, name:"Natalie Thompson",    role:"Operations Manager",                theatre:"Liberty 12",                group:"Group 5", corporate:false },
  { id: 55, name:"Nathan Campbell",     role:"General Manager",                   theatre:"Liberty 12",                group:"Group 5", corporate:false },
  { id: 56, name:"Noel Scott",          role:"General Manager",                   theatre:"Sapulpa",                   group:"Group 3", corporate:false },
  { id: 57, name:"Patrick Doherty",     role:"General Manager",                   theatre:"Blacksburg",                group:"Group 6", corporate:false },
  { id: 58, name:"Rachel Cunningham",   role:"Operations Manager",                theatre:"Creve Coeur",               group:"Group 6", corporate:false },
  { id: 59, name:"Roman King",          role:"General Manager",                   theatre:"Wentzville",                group:"Group 5", corporate:false },
  { id: 60, name:"Ryan Novak",          role:"General Manager",                   theatre:"Creve Coeur",               group:"Group 6", corporate:false },
  { id: 61, name:"Tad Bradshaw",        role:"General Manager",                   theatre:"Lee's Summit 16",           group:"Group 4", corporate:false },
  { id: 62, name:"Tannim Coley",        role:"Operations Manager",                theatre:"Ankeny",                    group:"Group 6", corporate:false },
  { id: 63, name:"Terika Rucker",      role:"Assistant Manager",            theatre:"Athens",                    group:"Group 3", corporate:false },
  { id: 64, name:"Tokina Kerri",        role:"General Manager",                   theatre:"Festus",                    group:"Group 2", corporate:false },
  { id: 65, name:"Travis George",       role:"General Manager",                   theatre:"Bolivar",                   group:"Group 1", corporate:false },
  { id: 66, name:"Trinidad Garcia",     role:"General Manager",                   theatre:"Junction City",             group:"Group 1", corporate:false },
  { id: 67, name:"Wesley Minet",        role:"General Manager",                   theatre:"Dodge City",                group:"Group 2", corporate:false },
  { id: 68, name:"Yasemin Henningsen",  role:"General Manager",                   theatre:"Wesley Chapel",             group:"Group 5", corporate:false },
  { id: 69, name:"Zane Fincham",        role:"Operations Manager",                theatre:"Northland 14",              group:"Group 4", corporate:false },
  { id: 70, name:"Alyssa McManus",      role:"Director of Creative Project Management",           theatre:"B&B Corporate", group:"Corporate", corporate:true },
  { id: 71, name:"Amanda Koebbe",      role:"Executive Director of Training & Scheduling",    theatre:"B&B Corporate", group:"Corporate", corporate:true },
  { id: 72, name:"Andrea Zlab",         role:"HR Generalist",    theatre:"B&B Corporate", group:"Corporate", corporate:true },
  { id: 73, name:"Angela Fisher",      role:"Director of Film Payment Processing",    theatre:"B&B Corporate", group:"Corporate", corporate:true },
  { id: 74, name:"Barbara Parkison",      role:"Reports Analyst & Claims",    theatre:"B&B Corporate", group:"Corporate", corporate:true },
  { id: 75, name:"Bob Bagby",           role:"President & CEO",    theatre:"B&B Corporate", group:"Corporate", corporate:true },
  { id: 76, name:"Bobbi Loessel",       role:"Executive Administrative Assistant",  theatre:"B&B Corporate", group:"Corporate", corporate:true },
  { id:130, name:"Bobbie Bagby Ford",      role:"Chief Creative Officer",             theatre:"B&B Corporate", group:"Corporate", corporate:true },
  { id: 77, name:"Brandon Woodall",      role:"Corporate Trainer",                theatre:"B&B Corporate", group:"Corporate", corporate:true },
  { id: 78, name:"Brett Zornes",        role:"District Manager",   theatre:"B&B Corporate", group:"Corporate", corporate:true },
  { id:131, name:"Bridget Bagby",      role:"Owners",             theatre:"B&B Corporate", group:"Corporate", corporate:true },
  { id:132, name:"Brittanie Bagby Baker",      role:"Chief Operating Officer",            theatre:"B&B Corporate", group:"Corporate", corporate:true },
  { id:133, name:"Brock Bagby",      role:"Chief Content, Programming & Development",             theatre:"B&B Corporate", group:"Corporate", corporate:true },
  { id: 79, name:"Brooke Anderson",     role:"Payables Assistant",    theatre:"B&B Corporate", group:"Corporate", corporate:true },
  { id: 80, name:"Chad Christopher",      role:"Executive Director of Programming & Film",    theatre:"B&B Corporate", group:"Corporate", corporate:true },
  { id: 81, name:"Chad Kirby",      role:"Financial Analyst",       theatre:"B&B Corporate", group:"Corporate", corporate:true },
  { id: 82, name:"Chris Hartzler",      role:"Director of Facilities Maintenance",         theatre:"B&B Corporate", group:"Corporate", corporate:true },
  { id: 83, name:"Chris Tickner",      role:"Executive Director of Marketing",           theatre:"B&B Corporate", group:"Corporate", corporate:true },
  { id: 84, name:"Cristie Evangelista", role:"Corporate Staff",    theatre:"B&B Corporate", group:"Corporate", corporate:true },
  { id: 85, name:"Curtis Diehl",      role:"Controller",    theatre:"B&B Corporate", group:"Corporate", corporate:true },
  { id: 86, name:"Dan VanOrden",      role:"Vice President of Operations",        theatre:"B&B Corporate", group:"Corporate", corporate:true },
  { id: 87, name:"Dennis McIntire",      role:"VP of Strategic Planning & Innovation",      theatre:"B&B Corporate", group:"Corporate", corporate:true },
  { id: 88, name:"Ed Carl",      role:"Vice President of Film",    theatre:"B&B Corporate", group:"Corporate", corporate:true },
  { id: 89, name:"Emma Christopher",    role:"Corporate Staff",    theatre:"B&B Corporate", group:"Corporate", corporate:true },
  { id: 90, name:"Gabriel Munoz",      role:"Videographer & Creative Content",           theatre:"B&B Corporate", group:"Corporate", corporate:true },
  { id: 91, name:"Haleigh Oetting",      role:"Director of Social Media",           theatre:"B&B Corporate", group:"Corporate", corporate:true },
  { id: 92, name:"Hanna Tapp-Laws",      role:"Special Sales & Projects Manager",           theatre:"B&B Corporate", group:"Corporate", corporate:true },
  { id: 93, name:"Heather Sutton",      role:"Executive Director of Accounting",    theatre:"B&B Corporate", group:"Corporate", corporate:true },
  { id: 94, name:"Jacob Mellor",      role:"Action Team Director",                theatre:"B&B Corporate", group:"Corporate", corporate:true },
  { id: 95, name:"Jake White",      role:"Director of Restaurants",   theatre:"B&B Corporate", group:"Corporate", corporate:true },
  { id: 96, name:"James Warner",        role:"District Manager",   theatre:"B&B Corporate", group:"Corporate", corporate:true },
  { id: 97, name:"Jarod Hallmark",      role:"IT Support Technician",                 theatre:"B&B Corporate", group:"Corporate", corporate:true },
  { id: 98, name:"Jason Foster",      role:"Senior District Manager",   theatre:"B&B Corporate", group:"Corporate", corporate:true },
  { id: 99, name:"Jeff Horton",      role:"District Manager",   theatre:"B&B Corporate", group:"Corporate", corporate:true },
  { id:100, name:"Jen Varone",          role:"Corporate Staff",    theatre:"B&B Corporate", group:"Corporate", corporate:true },
  { id:101, name:"Jim King",      role:"Executive Director of Construction",    theatre:"B&B Corporate", group:"Corporate", corporate:true },
  { id:102, name:"Joel Snyder",      role:"Director of IT Projects",                 theatre:"B&B Corporate", group:"Corporate", corporate:true },
  { id:103, name:"Justin Billingsley",      role:"IT Support Lead",                 theatre:"B&B Corporate", group:"Corporate", corporate:true },
  { id:104, name:"Kent Peterson",      role:"Executive Director of Finance",    theatre:"B&B Corporate", group:"Corporate", corporate:true },
  { id:105, name:"Kevin White",         role:"Director of Facilities Management",         theatre:"B&B Corporate", group:"Corporate", corporate:true },
  { id:106, name:"Lindsy Lawyer",      role:"HR Talent Acquisition Specialist",    theatre:"B&B Corporate", group:"Corporate", corporate:true },
  { id:107, name:"Maddie Fuchsman",      role:"Live Entertainment Manager",           theatre:"B&B Corporate", group:"Corporate", corporate:true },
  { id:108, name:"Marcela Munoz",      role:"Restaurant & Events Coordinator",           theatre:"B&B Corporate", group:"Corporate", corporate:true },
  { id:109, name:"Marissa Aguilera",    role:"Corporate Staff",    theatre:"B&B Corporate", group:"Corporate", corporate:true },
  { id:110, name:"Melissa Hagan",       role:"Corporate Staff",    theatre:"B&B Corporate", group:"Corporate", corporate:true },
  { id:111, name:"Merrie-Pat McIntire",      role:"Development Department Admin",      theatre:"B&B Corporate", group:"Corporate", corporate:true },
  { id:112, name:"Michael Geist",      role:"Executive Director of IT & Systems Engineering",                 theatre:"B&B Corporate", group:"Corporate", corporate:true },
  { id:113, name:"Michael Hagan",      role:"Chief Financial Officer",    theatre:"B&B Corporate", group:"Corporate", corporate:true },
  { id:114, name:"Noah Braun",      role:"Operations Department Assistant",       theatre:"B&B Corporate", group:"Corporate", corporate:true },
  { id:115, name:"Pam Carr",      role:"Executive Director of HR",    theatre:"B&B Corporate", group:"Corporate", corporate:true },
  { id:116, name:"Patrick Moore",      role:"Systems Engineer",                 theatre:"B&B Corporate", group:"Corporate", corporate:true },
  { id:117, name:"Paul Farnsworth",      role:"Executive Director of Communications & Content",           theatre:"B&B Corporate", group:"Corporate", corporate:true },
  { id:118, name:"Paul Weiss",      role:"Executive Director of Digital Marketing",           theatre:"B&B Corporate", group:"Corporate", corporate:true },
  { id:119, name:"Robert Swearingin",      role:"Vice President of IT",                 theatre:"B&B Corporate", group:"Corporate", corporate:true },
  { id:120, name:"Ryan Lewis",      role:"IT Support Specialist",                 theatre:"B&B Corporate", group:"Corporate", corporate:true },
  { id:121, name:"Samantha Jack",       role:"Corporate Staff",    theatre:"B&B Corporate", group:"Corporate", corporate:true },
  { id:122, name:"Sierra Liberty",      role:"Entertainment Marketing Manager",           theatre:"B&B Corporate", group:"Corporate", corporate:true },
  { id:123, name:"Steve Ramskill",      role:"Executive Director of Strategy",        theatre:"B&B Corporate", group:"Corporate", corporate:true },
  { id:124, name:"Tristan Liberty",      role:"Development & Programming Analyst",    theatre:"B&B Corporate", group:"Corporate", corporate:true },
  { id:125, name:"Tyler Rice",      role:"Executive Director of Operations",   theatre:"B&B Corporate", group:"Corporate", corporate:true },
  { id:126, name:"Vanessa Fantoni",      role:"HR Payroll Manager",    theatre:"B&B Corporate", group:"Corporate", corporate:true },
  { id:127, name:"Vanessa McNair",      role:"Reports Analyst",    theatre:"B&B Corporate", group:"Corporate", corporate:true },
  { id:128, name:"Will Werner",      role:"District Manager - St. Louis",   theatre:"B&B Corporate", group:"Corporate", corporate:true },
  { id:129, name:"Zac Jones",      role:"IT Support Technician",                 theatre:"B&B Corporate", group:"Corporate", corporate:true },
];

// ─── POINTS ───────────────────────────────────────────────────────────────────
const BOOTH_PTS = 30, QUIZ_PTS = 25, CONNECT_PTS = 50;

// ─── STORAGE ─────────────────────────────────────────────────────────────────
const STORE = "bb_summit_2026_v1";
function load(key, def) {
  try { const v = localStorage.getItem(`${STORE}_${key}`); return v ? JSON.parse(v) : def; }
  catch { return def; }
}
function save(key, val) {
  try { localStorage.setItem(`${STORE}_${key}`, JSON.stringify(val)); } catch {}
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const AV_COLORS = ["#E63946","#2A9D8F","#F4A261","#264653","#7B2D8B","#457B9D","#06D6A0","#FB8500","#6A4C93","#1982C4","#8AC926","#FF595E","#3A86FF","#FFBE0B","#118AB2","#EF476F","#4361EE"];
const avColor = (id) => AV_COLORS[(id - 1) % AV_COLORS.length];
function ini(name) { return (name||"?").split(" ").filter(Boolean).map(w=>w[0]).slice(0,2).join("").toUpperCase(); }
function vpClass(v) {
  if(v==="🎷") return "vp-j"; if(v==="🍕") return "vp-f"; if(v==="🎳") return "vp-m";
  if(v==="🏨") return "vp-h"; if(v==="🚌") return "vp-b"; return "vp-a";
}

// ─── NAV ──────────────────────────────────────────────────────────────────────
const NAV = [
  { id:"schedule",    ico:"📅", lbl:"Schedule"  },
  { id:"mygroup",     ico:"🔄", lbl:"My Group"  },
  { id:"hotel",       ico:"🏨", lbl:"Travel"    },
  { id:"vendors",     ico:"🏪", lbl:"Vendors"   },
  { id:"connect",     ico:"🤝", lbl:"Connect"   },
  { id:"leaderboard", ico:"🏆", lbl:"Leaders"   },
  { id:"gallery",     ico:"📸", lbl:"Gallery"   },
];

// ─── CSS ──────────────────────────────────────────────────────────────────────
const buildCSS = (C) => `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
body{background:${C.bg};color:${C.text};font-family:'Plus Jakarta Sans',sans-serif;display:flex;justify-content:center;min-height:100vh;transition:background .3s,color .3s}
.wrap{max-width:480px;width:100%;margin:0 auto;padding:14px 14px 90px}
.hdr{margin-bottom:14px;padding-bottom:12px;border-bottom:1px solid ${C.border}}
.hdr-row{display:flex;justify-content:space-between;align-items:flex-start}
.logo{font-size:18px;font-weight:800;color:${C.teal};letter-spacing:-0.3px}
.logo-cc{font-size:9px;color:${C.teal};letter-spacing:0.14em;text-transform:uppercase;font-weight:700;opacity:0.6}
.sub{font-size:11px;color:${C.muted};margin-top:2px}
.pts-badge{background:${C.goldBg};border:1px solid ${C.goldBorder};border-radius:14px;padding:6px 12px;text-align:right;cursor:pointer}
.pts-n{font-size:18px;color:${C.gold};font-weight:800;line-height:1}
.pts-l{font-size:9px;color:${C.muted};margin-top:1px}
.nav-bar{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:480px;background:${C.navBg};border-top:1px solid ${C.border};display:flex;z-index:100;padding:6px 0 env(safe-area-inset-bottom,6px);backdrop-filter:blur(20px)}
.ni{display:flex;flex-direction:column;align-items:center;gap:1px;padding:6px 0;flex:1;border:none;background:none;color:${C.muted};cursor:pointer;transition:color .2s;font-family:'Plus Jakarta Sans',sans-serif}
.ni.on{color:${C.teal}}
.ni .ico{font-size:19px;line-height:1}
.ni .lbl{font-size:9px;font-weight:700;letter-spacing:.3px;text-transform:uppercase}
.card{background:${C.card};border:1px solid ${C.border};border-radius:16px;padding:14px;margin-bottom:10px;box-shadow:${C.shadow}}
.stitle{font-size:20px;font-weight:800;margin-bottom:4px;color:${C.text}}
.ssub{font-size:12px;color:${C.muted};margin-bottom:14px;line-height:1.5}
.tabs{display:flex;gap:5px;margin-bottom:13px;overflow-x:auto;scrollbar-width:none;flex-wrap:wrap}
.tab{padding:6px 14px;border-radius:24px;border:1px solid ${C.border};background:${C.card};color:${C.muted};font-family:'Plus Jakarta Sans',sans-serif;font-size:11px;font-weight:600;cursor:pointer;transition:all .2s;white-space:nowrap;box-shadow:${C.shadow}}
.tab.on{background:${C.teal};color:#fff;border-color:${C.teal};font-weight:700;box-shadow:0 4px 14px ${C.teal}30}
.si{display:flex;gap:9px;padding:10px 13px;background:${C.card};border:1px solid ${C.border};border-radius:12px;margin-bottom:5px;box-shadow:${C.shadow};transition:all .3s}
.si.now{border-color:${C.teal};border-left:3px solid ${C.teal};background:${C.tealBg}}
.si-time{font-size:10px;color:${C.teal};min-width:78px;padding-top:2px;flex-shrink:0;line-height:1.4;font-weight:700}
.si-ev{font-size:13px;font-weight:600;line-height:1.4;color:${C.text}}
.si-meta{display:flex;align-items:center;gap:5px;margin-top:3px;flex-wrap:wrap}
.now-tag{display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:10px;font-size:9px;font-weight:700;background:${C.teal};color:#fff;animation:pulse 2s ease-in-out infinite;letter-spacing:.5px;text-transform:uppercase}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.7}}
.vpill{display:inline-flex;align-items:center;gap:3px;padding:2px 7px;border-radius:8px;font-size:10px;font-weight:600}
.vp-j{background:${C.red}14;color:${C.red};border:1px solid ${C.red}30}
.vp-a{background:${C.corp}14;color:${C.corp};border:1px solid ${C.corp}30}
.vp-m{background:${C.gold}14;color:${C.gold};border:1px solid ${C.gold}30}
.vp-h{background:${C.green}14;color:${C.green};border:1px solid ${C.green}30}
.vp-b{background:#88888814;color:${C.muted};border:1px solid #88888830}
.vp-f{background:#F4A26114;color:#F4A261;border:1px solid #F4A26130}
.vc{border-radius:16px;border:1px solid ${C.border};margin-bottom:9px;overflow:hidden;box-shadow:${C.shadow}}
.vc-hdr{display:flex;align-items:center;gap:11px;padding:14px;background:${C.card}}
.vc-logo{width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0}
.vc-name{font-weight:700;font-size:14px;color:${C.text}}
.vc-booth{font-size:11px;color:${C.muted};margin-top:2px}
.vc-acts{display:flex;gap:6px;padding:0 14px 14px}
.btn{padding:10px 13px;border-radius:12px;border:none;font-family:'Plus Jakarta Sans',sans-serif;font-size:13px;font-weight:700;cursor:pointer;transition:all .15s;flex:1;text-align:center}
.btn-g{background:linear-gradient(135deg,${C.gold},${C.goldBright});color:#fff;box-shadow:0 3px 10px ${C.gold}30}
.btn-s{background:${C.tealBg};border:1px solid ${C.tealBorder};color:${C.teal}}
.ci-ok{display:flex;align-items:center;justify-content:center;gap:6px;padding:9px 10px;border-radius:12px;font-size:12px;font-weight:600;flex:1;background:${C.green}18;color:${C.green};border:1px solid ${C.green}35}
.pb-wrap{height:5px;border-radius:3px;background:${C.border};margin-bottom:4px;overflow:hidden}
.pb-fill{height:100%;border-radius:3px;background:linear-gradient(90deg,${C.teal},${C.gold});transition:width .5s ease}
.le{display:flex;align-items:center;gap:10px;padding:12px 14px;background:${C.card};border:1px solid ${C.border};border-radius:14px;margin-bottom:6px;box-shadow:${C.shadow}}
.le.g1{border-color:#FFD700;background:#FFD70010}
.le.g2{border-color:#C0C0C0;background:#C0C0C010}
.le.g3{border-color:#CD7F32;background:#CD7F3210}
.rb{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:900;flex-shrink:0}
.r1{background:#FFD700;color:#0A0A0F}.r2{background:#C0C0C0;color:#0A0A0F}.r3{background:#CD7F32;color:#0A0A0F}.ro{background:${C.tealBg};color:${C.teal}}
.lb-n{font-weight:700;font-size:14px;flex:1;color:${C.text}}
.lb-l{font-size:11px;color:${C.muted}}
.lb-t{font-size:10px;padding:2px 6px;border-radius:6px;background:${C.tealBg};color:${C.teal};display:inline-block;margin-top:3px;font-weight:600}
.lb-p{font-weight:800;font-size:20px;color:${C.gold};text-align:right}
.lb-pl{font-size:10px;color:${C.muted};text-align:right}
.srch{width:100%;padding:10px 15px;border-radius:12px;border:1px solid ${C.border};background:${C.inputBg};color:${C.text};font-family:'Plus Jakarta Sans',sans-serif;font-size:14px;outline:none;margin-bottom:10px;box-shadow:${C.shadow}}
.srch:focus{border-color:${C.teal}}
.srch::placeholder{color:${C.muted}}
.rs{display:flex;gap:10px;padding:11px 13px;border-radius:12px;border:1px solid ${C.border};background:${C.card};margin-bottom:6px;box-shadow:${C.shadow}}
.rs.lunch{background:${C.goldBg};border-color:${C.goldBorder}}
.rs-time{font-size:11px;color:${C.teal};min-width:90px;flex-shrink:0;padding-top:1px;line-height:1.5;font-weight:700}
.rs-session{font-size:13px;font-weight:600;line-height:1.3;color:${C.text}}
.gc{border-radius:16px;padding:16px;margin-bottom:14px;text-align:center}
.hcard{border-radius:16px;padding:18px;margin-bottom:12px;box-shadow:${C.shadow}}
.hname{font-size:20px;font-weight:800;margin-bottom:6px;color:${C.text}}
.hrow{display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid ${C.border};font-size:13px;color:${C.text}}
.hrow:last-child{border-bottom:none}
.hrow-l{color:${C.muted};font-size:11px;min-width:60px;flex-shrink:0}
.att{display:flex;align-items:center;gap:10px;padding:10px 12px;background:${C.card};border:1px solid ${C.border};border-left:3px solid transparent;border-radius:14px;margin-bottom:5px;cursor:pointer;transition:border-color .2s;box-shadow:${C.shadow}}
.att.met{border-color:${C.green}50;border-left-color:${C.green};background:${C.green}06}
.att-av{width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:13px;flex-shrink:0}
.ws{display:flex;flex-direction:column;justify-content:center;align-items:center;min-height:100vh;padding:36px 22px;text-align:center;background:${C.bg}}
.wlogo{font-size:52px;font-weight:800;background:linear-gradient(135deg,${C.teal},${C.gold});-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin-bottom:4px}
.wsub{color:${C.muted};font-size:14px;margin-bottom:28px;line-height:1.7}
.wi{width:100%;max-width:340px;padding:13px 16px;border-radius:14px;border:2px solid ${C.border};background:${C.inputBg};color:${C.text};font-family:'Plus Jakarta Sans',sans-serif;font-size:16px;outline:none;transition:border-color .2s;margin-bottom:8px}
.wi:focus{border-color:${C.teal}}
.wsel{appearance:none;-webkit-appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%237A7A9A' stroke-width='2' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 14px center;padding-right:36px;cursor:pointer}
.web{padding:13px 34px;border-radius:14px;border:none;background:linear-gradient(135deg,${C.teal},#06B6D4);color:#fff;font-family:'Plus Jakarta Sans',sans-serif;font-size:16px;font-weight:700;cursor:pointer;transition:all .2s;width:100%;max-width:340px;margin-top:4px}
.web:hover{opacity:.9;transform:translateY(-2px)}
.web:disabled{opacity:.4;cursor:not-allowed;transform:none}
.qo{position:fixed;inset:0;background:${C.modalBg};z-index:200;display:flex;align-items:flex-end;justify-content:center}
.qm{background:${C.card};border-radius:22px 22px 0 0;padding:22px;width:100%;max-width:480px;max-height:90vh;overflow-y:auto}
.qq{font-size:16px;font-weight:800;margin-bottom:15px;line-height:1.35;color:${C.text}}
.qopt{width:100%;padding:12px 14px;border-radius:12px;border:1px solid ${C.border};background:${C.surface};color:${C.text};font-family:'Plus Jakarta Sans',sans-serif;font-size:14px;text-align:left;cursor:pointer;margin-bottom:6px;transition:all .15s}
.qopt:hover{border-color:${C.teal};background:${C.tealBg}}
.qopt.ok{border-color:${C.green};background:${C.green}18;color:${C.green}}
.qopt.no{border-color:${C.red};background:${C.red}15;color:${C.red}}
.qprog{display:flex;gap:4px;margin-bottom:16px}
.qpip{flex:1;height:4px;border-radius:2px;background:${C.border};transition:background .3s}
.qpip.done{background:${C.teal}}.qpip.cur{background:${C.gold}}
.ctm{position:fixed;inset:0;background:${C.overlayBg};z-index:300;display:flex;align-items:flex-end;justify-content:center;backdrop-filter:blur(4px)}
.csh{background:${C.surface};border-radius:22px 22px 0 0;width:100%;max-width:480px;max-height:92vh;overflow-y:auto}
.csh-hdr{padding:22px 18px 14px;border-radius:22px 22px 0 0;display:flex;flex-direction:column;align-items:center;gap:3px;position:relative}
.csh-av{width:58px;height:58px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:15px;border:2px solid ${C.border};margin-bottom:5px}
.csh-body{padding:18px 16px}
.step-lbl{font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:${C.muted};margin-bottom:11px;font-weight:700}
.q-box{background:${C.goldBg};border:1px solid ${C.goldBorder};border-radius:12px;padding:12px 14px;display:flex;gap:10px;align-items:flex-start;margin-bottom:11px}
.q-text{margin:0;font-size:14px;line-height:1.55;font-style:italic;font-weight:600;color:${C.text}}
.ctextarea{width:100%;box-sizing:border-box;background:${C.tealBg};border:1px solid ${C.tealBorder};border-radius:12px;color:${C.text};font-size:14px;padding:10px 12px;resize:vertical;outline:none;font-family:'Plus Jakarta Sans',sans-serif;line-height:1.6;margin-bottom:5px}
.hint{font-size:11px;color:${C.muted};margin-bottom:9px}
.pts-note{font-size:12px;color:${C.gold};margin-bottom:13px;background:${C.goldBg};border:1px solid ${C.goldBorder};border-radius:10px;padding:8px 12px;line-height:1.5}
.prim-btn{width:100%;background:linear-gradient(135deg,${C.teal},#06B6D4);border:none;border-radius:14px;color:#fff;font-size:15px;font-weight:700;padding:13px;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;margin-top:5px;transition:opacity .2s}
.prim-btn:disabled{opacity:.35;cursor:not-allowed}
.ghost-btn{flex:1;background:transparent;border:1px solid ${C.border};border-radius:14px;color:${C.muted};font-size:14px;padding:12px;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif}
.award-card{display:flex;align-items:center;gap:10px;background:${C.tealBg};border:1px solid ${C.tealBorder};border-radius:14px;padding:10px 12px;margin-bottom:6px;cursor:pointer;user-select:none}
.award-card.sel{background:${C.goldBg};border-color:${C.goldBorder}}
.check{margin-left:auto;width:21px;height:21px;border-radius:50%;border:1.5px solid ${C.goldBorder};display:flex;align-items:center;justify-content:center;color:${C.gold};font-weight:700;font-size:12px;flex-shrink:0}
.check.sel{background:${C.goldBg};border-color:${C.gold}}
.met-banner{display:flex;align-items:center;gap:12px;margin-bottom:14px;background:${C.green}0A;border:1px solid ${C.green}25;border-radius:14px;padding:12px 14px}
.nom-chip{display:inline-block;background:${C.goldBg};border:1px solid ${C.goldBorder};border-radius:20px;padding:4px 10px;font-size:11px;color:${C.gold};margin-right:5px;margin-bottom:5px}
.admin-overlay{position:fixed;inset:0;background:rgba(0,0,0,.97);z-index:600;overflow-y:auto;padding:20px 16px 40px}
.admin-hdr{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;padding-bottom:14px;border-bottom:1px solid rgba(255,215,0,.2)}
.admin-title{font-size:22px;font-weight:800;color:#D4AF37}
.admin-close{background:rgba(255,255,255,.08);border:none;color:#fff;border-radius:50%;width:34px;height:34px;font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center}
.admin-section{margin-bottom:22px}
.admin-sh{font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:rgba(255,215,0,.6);margin-bottom:10px;font-weight:700}
.nom-row{display:flex;align-items:center;gap:10px;padding:10px 12px;background:rgba(255,255,255,.04);border-radius:10px;margin-bottom:5px}
.nom-rank{font-size:18px;color:#D4AF37;font-weight:900;min-width:28px}
.nom-bar-wrap{flex:1;height:6px;background:rgba(255,255,255,.08);border-radius:3px;overflow:hidden;margin:4px 0}
.nom-bar-fill{height:100%;border-radius:3px;background:linear-gradient(90deg,#D4AF37,#F0D060)}
.score-row{display:flex;align-items:center;gap:10px;padding:9px 12px;background:rgba(255,255,255,.04);border-radius:10px;margin-bottom:5px}
.score-rank{font-size:16px;min-width:28px;text-align:center}
.admin-badge{font-size:9px;padding:2px 7px;border-radius:10px;background:rgba(255,215,0,.12);color:#D4AF37;border:1px solid rgba(255,215,0,.2)}
.notice-banner{position:fixed;top:0;left:0;right:0;z-index:400;display:flex;align-items:stretch;max-width:480px;margin:0 auto;animation:slideDown .35s ease-out}
@keyframes slideDown{from{transform:translateY(-100%);opacity:0}to{transform:translateY(0);opacity:1}}
.notice-bar{flex:1;padding:12px 14px 12px 14px;display:flex;align-items:center;gap:10px}
.notice-bar.warning{background:linear-gradient(135deg,#7a3a00,#5a2800);border-bottom:2px solid #FF8C00}
.notice-bar.info{background:linear-gradient(135deg,#0a3a3a,#051a2a);border-bottom:2px solid #22D3EE}
.notice-bar.success{background:linear-gradient(135deg,#0a3a1a,#051810);border-bottom:2px solid #4CAF7D}
.notice-bar.urgent{background:linear-gradient(135deg,#5a0a0a,#3a0505);border-bottom:2px solid #FF4444}
.notice-ico{font-size:22px;flex-shrink:0}
.notice-txt{font-size:13px;color:#fff;font-weight:600;line-height:1.4;flex:1}
.notice-close{background:none;border:none;color:rgba(255,255,255,.5);font-size:18px;cursor:pointer;padding:0 4px;flex-shrink:0;font-family:sans-serif}
.tut-overlay{position:fixed;inset:0;background:rgba(0,0,0,.92);z-index:500;display:flex;align-items:flex-end;justify-content:center;backdrop-filter:blur(6px)}
.tut-sheet{background:linear-gradient(160deg,#0a2020 0%,#0d1b20 60%,#0f1518 100%);border-radius:28px 28px 0 0;width:100%;max-width:480px;padding:32px 24px 40px;border-top:1px solid ${C.tealBorder};animation:slideUp .4s ease-out}
.tut-dots{display:flex;gap:6px;justify-content:center;margin-bottom:24px}
.tut-dot{width:8px;height:8px;border-radius:50%;background:rgba(255,255,255,.2);transition:all .3s}
.tut-dot.on{background:${C.teal};width:24px;border-radius:4px}
.tut-icon{font-size:52px;text-align:center;margin-bottom:12px;display:block}
.tut-title{font-size:26px;font-weight:800;color:#fff;text-align:center;margin-bottom:8px;line-height:1.2}
.tut-desc{font-size:14px;color:rgba(240,230,211,.6);text-align:center;line-height:1.7;margin-bottom:24px}
.tut-tip{background:${C.tealBg};border:1px solid ${C.tealBorder};border-radius:14px;padding:12px 16px;margin-bottom:24px}
.tut-tip-row{display:flex;align-items:center;gap:10px;padding:5px 0}
.tut-tip-ico{font-size:18px;width:24px;text-align:center;flex-shrink:0}
.tut-tip-txt{font-size:13px;color:rgba(240,230,211,.75);line-height:1.4}
.tut-nav{display:flex;gap:10px;align-items:center}
.tut-skip{background:none;border:none;color:rgba(240,230,211,.3);font-size:13px;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;padding:4px 8px;flex-shrink:0}
.tut-next{flex:1;background:linear-gradient(135deg,${C.teal},#06B6D4);border:none;border-radius:14px;color:#fff;font-family:'Plus Jakarta Sans',sans-serif;font-size:16px;font-weight:700;padding:15px;cursor:pointer;transition:opacity .2s}
@keyframes slideUp{from{transform:translateY(40px);opacity:0}to{transform:translateY(0);opacity:1}}
.gallery-grid{columns:2;gap:8px;margin-top:12px}
.gallery-item{break-inside:avoid;margin-bottom:8px;border-radius:14px;overflow:hidden;position:relative;cursor:pointer;background:${C.card};border:1px solid ${C.border};box-shadow:${C.shadow}}
.gallery-item img{width:100%;display:block;transition:transform .3s}
.gallery-item:hover img{transform:scale(1.03)}
.gallery-cap{padding:7px 10px;font-size:11px;color:${C.muted};line-height:1.4}
.gallery-who{font-size:10px;color:${C.gold};margin-top:2px}
.gallery-upload{background:${C.tealBg};border:2px dashed ${C.tealBorder};border-radius:16px;padding:22px;text-align:center;cursor:pointer;transition:all .2s;margin-bottom:12px}
.gallery-upload:hover{background:${C.teal}15;border-color:${C.teal}40}
.lightbox{position:fixed;inset:0;background:rgba(0,0,0,.95);z-index:700;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px}
.lightbox img{max-width:100%;max-height:75vh;border-radius:14px;object-fit:contain}
.lightbox-close{position:absolute;top:16px;right:16px;background:rgba(255,255,255,.1);border:none;color:#fff;width:38px;height:38px;border-radius:50%;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center}
.lightbox-cap{margin-top:14px;font-size:14px;color:rgba(255,255,255,.7);text-align:center;max-width:320px;line-height:1.5}
.lightbox-who{font-size:12px;color:rgba(255,215,0,.6);margin-top:4px;text-align:center}
.pending-photo{display:flex;gap:10px;background:${C.tealBg};border:1px solid ${C.tealBorder};border-radius:14px;padding:10px;margin-bottom:8px;align-items:flex-start}
.pending-photo img{width:72px;height:72px;border-radius:10px;object-fit:cover;flex-shrink:0}
.toast{position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:${C.teal};color:#fff;padding:10px 20px;border-radius:30px;font-weight:700;font-size:14px;box-shadow:0 4px 20px ${C.teal}40;z-index:400;display:flex;gap:8px;align-items:center;white-space:nowrap}
@keyframes fup{0%{opacity:1;transform:translate(-50%,-50%) scale(1)}100%{opacity:0;transform:translate(-50%,-120%) scale(1.3)}}
.pfloat{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:linear-gradient(135deg,${C.teal},${C.gold});color:#fff;padding:10px 22px;border-radius:40px;font-size:20px;font-weight:800;animation:fup 1.6s ease-out forwards;z-index:500;pointer-events:none}
.theme-toggle{display:flex;align-items:center;gap:6px;padding:4px 10px;border-radius:20px;background:${C.tealBg};border:1px solid ${C.tealBorder};cursor:pointer;font-size:11px;font-weight:600;color:${C.teal};transition:all .2s}
.theme-toggle:hover{background:${C.teal}15}
.preview-banner{background:${C.tealBg};border:1px solid ${C.tealBorder};border-radius:12px;padding:12px 14px;margin-bottom:12px;display:flex;align-items:center;gap:10px;font-size:12px;color:${C.teal};line-height:1.5}
.settings-overlay{position:fixed;inset:0;z-index:250;display:flex;align-items:flex-end;justify-content:center}
.settings-bg{position:absolute;inset:0;background:${C.overlayBg}}
.settings-sheet{position:relative;z-index:1;background:${C.surface};border-radius:22px 22px 0 0;width:100%;max-width:480px;max-height:80vh;overflow-y:auto;padding:24px 20px env(safe-area-inset-bottom,20px)}
.settings-hdr{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px}
.settings-title{font-size:18px;font-weight:800;color:${C.text}}
.settings-row{display:flex;justify-content:space-between;align-items:center;padding:14px 0;border-bottom:1px solid ${C.border}}
.settings-label{font-size:14px;font-weight:600;color:${C.text}}
.settings-sub{font-size:11px;color:${C.muted};margin-top:2px}
.countdown-bar{background:linear-gradient(135deg,${C.teal}15,${C.gold}10);border:1px solid ${C.tealBorder};border-radius:12px;padding:10px 14px;margin-bottom:12px;text-align:center}
.current-event{background:${C.tealBg};border:1px solid ${C.tealBorder};border-radius:10px;padding:8px 12px;margin-bottom:10px;font-size:12px;color:${C.teal}}
.poll-card{background:${C.card};border:1px solid ${C.border};border-radius:14px;padding:14px;margin-bottom:12px}
.poll-opt{padding:10px 12px;border:1.5px solid ${C.border};border-radius:10px;margin-bottom:6px;cursor:pointer;font-size:13px;color:${C.text};transition:all .2s;display:flex;align-items:center;gap:10px}
.poll-opt:hover{border-color:${C.teal}}
.poll-opt.voted{border-color:${C.teal};background:${C.tealBg}}
.poll-bar{height:6px;border-radius:3px;background:${C.border};overflow:hidden;flex:1}
.poll-fill{height:100%;border-radius:3px;background:linear-gradient(90deg,${C.teal},${C.gold});transition:width .6s ease}
.findme-card{background:${C.card};border:1px solid ${C.border};border-radius:12px;padding:12px 14px;margin-bottom:12px}
.findme-input{width:100%;padding:8px 12px;border-radius:8px;border:1px solid ${C.border};background:${C.inputBg};color:${C.text};font-family:'Plus Jakarta Sans',sans-serif;font-size:13px;outline:none}
.thankyou-wrap{text-align:center;padding:30px 10px}
.group-members{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}
.gm-chip{display:flex;align-items:center;gap:5px;background:${C.tealBg};border:1px solid ${C.tealBorder};border-radius:20px;padding:3px 10px 3px 3px;font-size:11px;color:${C.text}}
.gm-av{width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:7px;font-weight:700;color:#fff}
`;

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  // Theme
  const [darkMode, setDarkMode] = useState(() => load("darkMode", false));
  const C = darkMode ? DARK : LIGHT;
  const css = useMemo(() => buildCSS(C), [darkMode]);
  function toggleDark() { const v = !darkMode; setDarkMode(v); save("darkMode", v); }

  // "Happening Now" helper — checks if current time falls within a schedule item's range
  function isHappeningNow(dayLabel, timeStr, allEvents, idx) {
    const now = new Date();
    const dayMap = {"Monday, March 9":9,"Tuesday, March 10":10,"Wednesday, March 11":11,"Thursday, March 12":12};
    const dayNum = dayMap[dayLabel];
    if (!dayNum || now.getMonth() !== 2 || now.getDate() !== dayNum || now.getFullYear() !== 2026) return false;
    // Parse a single time like "1:30 PM" or "9:30 AM"
    function parseT(t) {
      const m = t.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
      if (!m) return null;
      let h = parseInt(m[1]); const min = parseInt(m[2]); const p = m[3].toUpperCase();
      if (p==='PM' && h!==12) h+=12; if (p==='AM' && h===12) h=0;
      return h*60+min;
    }
    const start = parseT(timeStr);
    if (start===null) return false;
    // End = next event's start time, or +45 min if last
    let end = start + 45;
    if (allEvents && idx < allEvents.length - 1) {
      const nextStart = parseT(allEvents[idx+1].time);
      if (nextStart !== null && nextStart > start) end = nextStart;
    }
    const nowMins = now.getHours()*60 + now.getMinutes();
    return nowMins >= start && nowMins < end;
  }

  // Onboarding
  const [uName,  setUName]  = useState(() => load("name",""));
  const [uLoc,   setULoc]   = useState(() => load("loc",""));
  const [nameIn, setNameIn] = useState("");
  const [locIn,  setLocIn]  = useState("");
  const [photos, setPhotos] = useState(() => load("photos",{}));
  function handlePhotoUpload(attendeeId, file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const updated = {...photos, [attendeeId]: e.target.result};
      setPhotos(updated); save("photos", updated);
    };
    reader.readAsDataURL(file);
  }

  // Tutorial
  const [showTutorial, setShowTutorial] = useState(() => !load("tutorialSeen", false));
  const [tutSlide, setTutSlide] = useState(0);
  function dismissTutorial() { save("tutorialSeen", true); setShowTutorial(false); }

  // Live notice banner
  const [notice, setNotice] = useState(null);
  const [noticeDismissed, setNoticeDismissed] = useState(() => load("noticeDismissed",""));
  useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(doc(db, "config", "notice"), snap => {
      if (snap.exists()) {
        const data = snap.data();
        setNotice(data.active && data.message ? data : null);
        if (data.message) setBannerMsg(data.message);
        if (data.type)    setBannerType(data.type);
      } else { setNotice(null); }
    }, () => {});
    return () => unsub();
  }, []);
  const noticeVisible = notice && noticeDismissed !== notice.updated;

  // Tabs / day
  const [tab, setTab] = useState("schedule");
  const [expandedGroup, setExpandedGroup] = useState(null);
  const [day, setDay] = useState(0);

  // Vendor state
  const [checkedIn, setCI]  = useState(() => load("ci",{}));
  const [quizDone,  setQD]  = useState(() => load("qd",{}));
  const [aq,  setAQ]  = useState(null);
  const [qIdx, setQI] = useState(0);
  const [sel,  setSel] = useState(null);
  const [ans,  setAns] = useState([]);
  const [fin,  setFin] = useState(false);
  const [popup, setPopup] = useState(null);

  // Connect state
  const [conns,   setConns]  = useState(() => load("conns",{}));
  const [modal,   setModal]  = useState(null);
  const [cStep,   setCStep]  = useState(1);
  const [cAnswer, setCAnswer]= useState("");
  const [cNoms,   setCNoms]  = useState([]);
  const [cNote,   setCNote]  = useState("");
  const [cSearch, setCSearch]= useState("");
  const [cFilter, setCFilter]= useState("all");
  const [cGroup,  setCGroup] = useState("All");
  const [toast,   setToast]  = useState(null);
  const [ptsAnim, setPtsAnim]= useState(false);
  const [attSearch, setAttSearch] = useState("");

  // Admin state
  const [adminTaps, setAdminTaps]   = useState(0);
  const [showAdmin, setShowAdmin]   = useState(false);
  const [adminData, setAdminData]   = useState(null);
  const [lbData,    setLbData]      = useState(null);
  const adminTapTimer = useRef(null);
  const [bannerMsg,  setBannerMsg]  = useState("");
  const [bannerType, setBannerType] = useState("warning");
  const [bannerSaving, setBannerSaving] = useState(false);
  const [bannerSaved,  setBannerSaved]  = useState(false);
  const [pushGranted, setPushGranted] = useState(false);
  const [pushMsg,     setPushMsg]     = useState("");
  const [pushSending, setPushSending] = useState(false);
  const [pushSent,    setPushSent]    = useState(false);

  // Push notification registration (disabled)
  useEffect(() => {
    if (!uName || !uLoc || !db) return;
    return; // Push notifications disabled - requires FCM setup
  }, [uName, uLoc]);

  // Gallery state
  const [galleryPhotos, setGalleryPhotos] = useState([]);
  const [pendingPhotos, setPendingPhotos] = useState([]);
  const [galleryCaption, setGalleryCaption] = useState("");
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [galleryUploaded, setGalleryUploaded] = useState(false);
  const [lightbox, setLightbox] = useState(null);

  // Settings panel
  const [showSettings, setShowSettings] = useState(false);

  // Corporate schedule accordion
  const [corpExpDay, setCorpExpDay] = useState(null);

  // Find me at status
  const [findMeAt, setFindMeAt] = useState(() => load("findMeAt",""));
  const [findMeEdit, setFindMeEdit] = useState(false);
  const [allStatuses, setAllStatuses] = useState({});

  // Daily poll
  const [pollVote, setPollVote] = useState(() => load("pollVote",{}));
  const [pollResults, setPollResults] = useState({});

  // Nomination count (live from Firebase)
  const [nomCount, setNomCount] = useState(0);

  // Auto-reset: wipe all user data on Sunday March 8 midnight so summit starts fresh
  useEffect(() => {
    const now = new Date();
    const resetDate = new Date(2026, 2, 8); // March 8, 2026
    const alreadyReset = load("summitReset2026", false);
    if (now >= resetDate && !alreadyReset) {
      // Wipe all progress data
      save("ci", {});     save("qd", {});
      save("conns", {});  save("pollVote", {});
      save("findMeAt", "");
      save("summitReset2026", true);
      // Reset in-memory state
      setCI({}); setQD({}); setConns({});
      setPollVote({}); setFindMeAt("");
    }
  }, []);

  useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(collection(db, "gallery"), snap => {
      const approved = [], pending = [];
      snap.forEach(d => {
        const photo = { id: d.id, ...d.data() };
        if (photo.status === "approved") approved.push(photo);
        else if (photo.status === "pending") pending.push(photo);
      });
      approved.sort((a,b) => (b.uploadedAt?.seconds||0) - (a.uploadedAt?.seconds||0));
      pending.sort((a,b) => (a.uploadedAt?.seconds||0) - (b.uploadedAt?.seconds||0));
      setGalleryPhotos(approved);
      setPendingPhotos(pending);
    });
    return () => unsub();
  }, []);

  // Subscribe to daily poll results
  useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(collection(db, "polls"), snap => {
      const results = {};
      snap.forEach(d => { results[d.id] = d.data(); });
      setPollResults(results);
    });
    return () => unsub();
  }, []);

  // Subscribe to nomination count for teaser
  useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(collection(db, "nominations"), snap => {
      setNomCount(snap.size);
    });
    return () => unsub();
  }, []);

  // Subscribe to "find me at" statuses
  useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(collection(db, "statuses"), snap => {
      const s = {};
      snap.forEach(d => { s[d.id] = d.data(); });
      setAllStatuses(s);
    });
    return () => unsub();
  }, []);

  // ══════════════════════════════════════════════════════════════════════════
  // ██ FIX: Derived values MUST be declared BEFORE the useEffect that uses them
  // ══════════════════════════════════════════════════════════════════════════
  const myGroup = uLoc ? LOCATION_GROUP[uLoc] || null : null;
  const myHotel = uLoc ? (LOCATION_HOTEL[uLoc] || null) : null;
  const hotelInfo = myHotel ? HOTEL_INFO[myHotel] : null;

  // Flight lookup — match by location, then refine by name if multiple
  const myFlights = useMemo(() => {
    if (!uLoc) return [];
    const locMatch = FLIGHTS.filter(f => f.loc === uLoc || (uLoc === "Corporate Staff" && f.loc === "Corporate"));
    if (locMatch.length <= 1) return locMatch;
    // Multiple flyers at same location — try to match by name
    const nameMatch = locMatch.filter(f => uName && f.name.toLowerCase().includes(uName.split(" ")[0].toLowerCase()));
    return nameMatch.length > 0 ? nameMatch : locMatch;
  }, [uName, uLoc]);

  const vendorPts = Object.keys(checkedIn).length * BOOTH_PTS +
    Object.values(quizDone).reduce((s,v) => s + (v||0)*QUIZ_PTS, 0);

  const connectPts = Object.entries(conns).reduce((acc,[idStr,conn]) => {
    const p = ATTENDEES.find(a=>a.id===Number(idStr));
    if (!p) return acc;
    if (p.corporate) return acc + CONNECT_PTS;
    if (conn.nominations?.length > 0) return acc + CONNECT_PTS;
    return acc;
  }, 0);

  const totalPts = vendorPts + connectPts;
  const metCount = Object.keys(conns).length;
  const pct = Math.round((metCount / ATTENDEES.length) * 100);
  const cQuestion = modal ? VERIFY_QUESTIONS[(modal.id-1) % VERIFY_QUESTIONS.length] : "";
  const allGroups = ["All","Group 1","Group 2","Group 3","Group 4","Group 5","Group 6","Corporate"];

  // ══════════════════════════════════════════════════════════════════════════
  // NOW it's safe to use totalPts, metCount, etc. in effects below
  // ══════════════════════════════════════════════════════════════════════════

  // Push my score to Firebase whenever points change
  useEffect(() => {
    if (!db || !uName || !uLoc) return;
    const id = `${uName.replace(/[^a-zA-Z0-9]/g,"-")}_${uLoc.replace(/[^a-zA-Z0-9]/g,"-")}`;
    setDoc(doc(db, "scores", id), {
      name: uName, location: uLoc, pts: totalPts,
      booths: Object.keys(checkedIn).length,
      quizzes: Object.values(quizDone).reduce((s,v)=>s+(v||0),0),
      connections: metCount,
      updatedAt: serverTimestamp(),
    }, { merge: true }).catch(()=>{});
  }, [totalPts, uName, uLoc]);

  // Admin: subscribe to live Firebase data when panel opens
  useEffect(() => {
    if (!showAdmin || !db) return;
    const unsubNoms = onSnapshot(collection(db, "nominations"), snap => {
      const rows = {};
      snap.forEach(d => { rows[d.id] = d.data(); });
      setAdminData(rows);
    });
    const unsubScores = onSnapshot(collection(db, "scores"), snap => {
      const rows = [];
      snap.forEach(d => rows.push(d.data()));
      rows.sort((a,b) => b.pts - a.pts);
      setLbData(rows);
    });
    return () => { unsubNoms(); unsubScores(); };
  }, [showAdmin]);

  function handleLogoTap() {
    const next = adminTaps + 1;
    setAdminTaps(next);
    clearTimeout(adminTapTimer.current);
    if (next >= 3) { setShowAdmin(true); setAdminTaps(0); return; }
    adminTapTimer.current = setTimeout(() => setAdminTaps(0), 4000);
  }

  // Gallery functions
  async function uploadPhoto(file) {
    if (!file || !db) return;
    setGalleryUploading(true);
    try {
      const id = `${Date.now()}_${uName.replace(/[^a-zA-Z0-9]/g,"-")}`;
      // Resize & convert to base64 so it persists across sessions
      const url = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const img = new Image();
          img.onload = () => {
            const MAX = 1200;
            let w = img.width, h = img.height;
            if (w > MAX || h > MAX) {
              if (w > h) { h = Math.round(h * MAX / w); w = MAX; }
              else { w = Math.round(w * MAX / h); h = MAX; }
            }
            const canvas = document.createElement("canvas");
            canvas.width = w; canvas.height = h;
            canvas.getContext("2d").drawImage(img, 0, 0, w, h);
            resolve(canvas.toDataURL("image/jpeg", 0.7));
          };
          img.onerror = reject;
          img.src = ev.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      await setDoc(doc(db, "gallery", id), {
        url, caption: galleryCaption.trim(),
        uploaderName: uName, uploaderLoc: uLoc,
        status: "pending", uploadedAt: serverTimestamp(),
      });
      setGalleryCaption("");
      setGalleryUploaded(true);
      setTimeout(() => setGalleryUploaded(false), 3000);
    } catch(e) { alert("Upload failed: " + e.message); }
    setGalleryUploading(false);
  }
  async function approvePhoto(id, approve) {
    if (!db) return;
    await setDoc(doc(db, "gallery", id), { status: approve ? "approved" : "rejected" }, { merge: true });
  }
  async function downloadPhoto(url, caption, uploaderName) {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      const safeName = (caption || uploaderName || "summit-photo").replace(/[^a-zA-Z0-9]/g,"-").slice(0,40);
      a.download = `BBSummit2026_${safeName}.jpg`;
      a.click(); URL.revokeObjectURL(a.href);
    } catch(e) { alert("Download failed — try long-pressing the photo instead."); }
  }
  async function deletePhoto(id) {
    if (!db) return;
    await setDoc(doc(db, "gallery", id), { status: "rejected" }, { merge: true });
  }
  async function sendPushNotification() {
    if (!db || !pushMsg.trim()) return;
    setPushSending(true);
    try {
      await setDoc(doc(db, "config", "pushNotification"), {
        active: true, title: "B&B Summit 2026", message: pushMsg.trim(),
        type: bannerType, sentAt: serverTimestamp(),
      });
      setPushSent(true); setPushMsg("");
      setTimeout(() => setPushSent(false), 3000);
    } catch(e) { alert("Error: " + e.message); }
    setPushSending(false);
  }
  async function publishBanner(active) {
    if (!db) return;
    setBannerSaving(true);
    try {
      await setDoc(doc(db, "config", "notice"), {
        active, message: bannerMsg.trim(), type: bannerType, updated: new Date().toISOString(),
      });
      setBannerSaved(true);
      setTimeout(() => setBannerSaved(false), 2500);
      if (!active) setBannerMsg("");
    } catch(e) { alert("Firebase error: " + e.message); }
    setBannerSaving(false);
  }

  // ─── DAILY POLLS ────────────────────────────────────────────────────────────
  const DAILY_POLLS = {
    "Tuesday":   { q:"🍿 What's your go-to concession order?", opts:["Popcorn & Soda","Nachos","Candy","I sneak in snacks 😅"] },
    "Wednesday": { q:"🎬 Best movie of the last year?",        opts:["Inside Out 2","Dune: Part Two","Deadpool & Wolverine","Other — tell us in Connect!"] },
    "Thursday":  { q:"🏠 What's one thing you're taking home from this Summit?", opts:["New friendships","Fresh ideas for my theatre","Motivation to lead","All of the above!"] },
  };
  const now = new Date();
  const summitDayName = now.getFullYear()===2026 && now.getMonth()===2
    ? {10:"Tuesday",11:"Wednesday",12:"Thursday"}[now.getDate()] || null : null;
  const todayPoll = summitDayName ? DAILY_POLLS[summitDayName] : DAILY_POLLS["Tuesday"]; // show Tue poll as preview
  const todayPollKey = summitDayName || "Tuesday";

  async function votePoll(optIdx) {
    const updated = {...pollVote, [todayPollKey]: optIdx};
    setPollVote(updated); save("pollVote", updated);
    if (!db) return;
    const pollDocId = `poll_${todayPollKey}`;
    try {
      const fieldKey = `opt${optIdx}`;
      // Increment vote count — read, increment, write
      const current = pollResults[pollDocId] || {};
      await setDoc(doc(db, "polls", pollDocId), {
        ...current, [fieldKey]: (current[fieldKey]||0) + 1, totalVotes: (current.totalVotes||0) + 1,
      }, { merge: true });
    } catch(e) { console.warn("Poll vote error:", e); }
  }

  // ─── FIND ME AT ─────────────────────────────────────────────────────────────
  async function saveFindMeAt(status) {
    setFindMeAt(status); save("findMeAt", status);
    if (!db || !uName) return;
    const id = `${uName.replace(/[^a-zA-Z0-9]/g,"-")}_${uLoc.replace(/[^a-zA-Z0-9]/g,"-")}`;
    try {
      await setDoc(doc(db, "statuses", id), {
        name: uName, loc: uLoc, status, updatedAt: serverTimestamp(),
      }, { merge: true });
    } catch(e) { console.warn("Status save error:", e); }
  }

  // ─── COUNTDOWN & CURRENT/NEXT EVENT ─────────────────────────────────────────
  const summitInfo = useMemo(() => {
    const now = new Date();
    const summitStart = new Date(2026, 2, 9, 13, 30); // Mon March 9 1:30 PM
    const summitEnd = new Date(2026, 2, 12, 16, 0);   // Thu March 12 4:00 PM

    if (now < summitStart) {
      // Countdown mode
      const diff = summitStart - now;
      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      return { mode:"countdown", days, hours };
    }
    if (now > summitEnd) {
      return { mode:"ended" };
    }
    // During summit — find current & next event
    const dayMap = {9:"Monday, March 9",10:"Tuesday, March 10",11:"Wednesday, March 11",12:"Thursday, March 12"};
    const dayKey = dayMap[now.getDate()];
    if (!dayKey || !SCHEDULE[dayKey]) return { mode:"during", current:null, next:null };

    function parseT(t) {
      const m = t.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
      if (!m) return null;
      let h = parseInt(m[1]); const min = parseInt(m[2]); const p = m[3].toUpperCase();
      if (p==='PM' && h!==12) h+=12; if (p==='AM' && h===12) h=0;
      return h*60+min;
    }
    const nowMin = now.getHours()*60+now.getMinutes();
    const events = SCHEDULE[dayKey];
    let current = null, next = null;
    for (let i=0; i<events.length; i++) {
      const start = parseT(events[i].time);
      if (start===null) continue;
      const end = i<events.length-1 ? (parseT(events[i+1].time)||start+45) : start+60;
      if (nowMin>=start && nowMin<end) current = events[i];
      if (nowMin<start && !next) next = events[i];
    }
    return { mode:"during", current, next };
  }, [Math.floor(Date.now()/60000)]); // update every minute

  // Is summit over? (for thank-you screen)
  const summitOver = summitInfo.mode === "ended";

  // Preview mode — before March 9
  const isPreview = new Date() < new Date(2026, 2, 9);

  // Vendor quiz handlers
  function checkIn(id) {
    const updated = {...checkedIn,[id]:true};
    setCI(updated); save("ci",updated); addPopup(BOOTH_PTS);
  }
  function startQuiz(v) { setAQ(v); setQI(0); setSel(null); setAns([]); setFin(false); }
  function pickAns(i) {
    if (sel!==null) return;
    setSel(i);
    const correct = i === aq.quiz[qIdx].answer;
    const newAns = [...ans, correct];
    setAns(newAns);
    if (correct) addPopup(QUIZ_PTS);
    setTimeout(()=>{
      if (qIdx < aq.quiz.length-1) { setQI(qIdx+1); setSel(null); }
      else {
        const score = newAns.filter(Boolean).length;
        const updated = {...quizDone,[aq.id]:score};
        setQD(updated); save("qd",updated); setFin(true);
      }
    },900);
  }
  function addPopup(pts) { setPopup(pts); setTimeout(()=>setPopup(null),1600); }

  // Connect handlers
  function openModal(p) {
    const ex = conns[p.id];
    setModal(p);
    if (ex) { setCAnswer(ex.answer||""); setCNoms(ex.nominations||[]); setCNote(ex.nomNote||""); setCStep(3); }
    else    { setCAnswer(""); setCNoms([]); setCNote(""); setCStep(1); }
  }
  function closeModal() { setModal(null); setCStep(1); setCAnswer(""); setCNoms([]); setCNote(""); }
  function handleCNext() {
    if (cAnswer.trim().length < 5) return;
    modal.corporate ? commitConn([],""): setCStep(2);
  }
  function commitConn(noms, note) {
    const earned = modal.corporate || noms.length > 0;
    const updated = {...conns,[modal.id]:{answer:cAnswer,nominations:noms,nomNote:note,metAt:new Date().toISOString()}};
    setConns(updated); save("conns",updated);
    if (db && noms.length > 0) {
      const docId = `${uName.replace(/[^a-zA-Z0-9]/g,"-")}_to_${modal.id}`;
      setDoc(doc(db,"nominations",docId), {
        nominatorName: uName, nominatorLoc: uLoc,
        nomineeName: modal.name, nomineeId: modal.id,
        nominations: noms, note: note, submittedAt: serverTimestamp(),
      }, { merge:true }).catch(()=>{});
    }
    const label = modal.name;
    closeModal();
    if (earned) {
      setPtsAnim(true);
      setToast({msg:`Connected with ${label}!`,pts:`+${CONNECT_PTS} pts`});
      setTimeout(()=>setPtsAnim(false),900);
    } else { setToast({msg:`Connected with ${label}!`,pts:null}); }
    setTimeout(()=>setToast(null),3000);
  }
  function toggleNom(id) { setCNoms(prev=>prev.includes(id)?prev.filter(n=>n!==id):[...prev,id]); }

  // Filtered attendees
  const filtConns = useMemo(()=>ATTENDEES.filter(a=>{
    const q = cSearch.toLowerCase();
    const ms = a.name.toLowerCase().includes(q)||a.theatre.toLowerCase().includes(q)||a.group.toLowerCase().includes(q);
    const met = !!conns[a.id];
    const mm = cFilter==="all"||(cFilter==="met"?met:!met);
    const mg = cGroup==="All"||a.group===cGroup;
    return ms&&mm&&mg;
  }),[cSearch,cFilter,cGroup,conns]);

  // Leaderboard
  const myEntry = uName ? {name:`${uName} (You)`,loc:uLoc,pts:totalPts,v:Object.keys(checkedIn).length,q:Object.values(quizDone).reduce((s,v)=>s+(v||0),0),c:metCount} : null;
  const lb = myEntry ? [myEntry].sort((a,b)=>b.pts-a.pts) : [];

  // ─── ONBOARDING ────────────────────────────────────────────────────────────
  if (!uName || !uLoc) {
    const allLocs = [...Object.keys(LOCATION_GROUP),"Corporate Staff"].sort();
    return (
      <>
        <style>{css}</style>
        <div className="ws">
          <img src="/CreatingCommunity_logo.png" alt="B&B Creating Community"
            style={{height:120,width:"auto",objectFit:"contain",marginBottom:8,filter:"drop-shadow(0 0 20px rgba(100,180,220,.3))"}}
            onError={e=>{e.target.style.display="none";}}
          />
          <div className="wlogo" style={{marginTop:4}}>B&B</div>
          <div style={{fontWeight:800,fontSize:17,color:C.gold,marginBottom:4}}>Manager's Summit 2026</div>
          <div className="wsub">March 9–12 · Liberty Cinema 12<br/>Welcome to your summit companion!</div>
          <input className="wi" placeholder="Your preferred name" value={nameIn} onChange={e=>setNameIn(e.target.value)}/>
          <select className="wi wsel" value={locIn} onChange={e=>setLocIn(e.target.value)}>
            <option value="">Select your theatre location…</option>
            {allLocs.map(l=><option key={l} value={l}>{l}</option>)}
          </select>
          <button className="web" disabled={!nameIn.trim()||!locIn} onClick={()=>{
            setUName(nameIn.trim()); save("name",nameIn.trim());
            setULoc(locIn); save("loc",locIn);
          }}>Let's Go! 🎬</button>
        </div>
      </>
    );
  }

  // ─── MAIN RETURN ──────────────────────────────────────────────────────────
  return (
    <>
      <style>{css}</style>
      <div className="wrap">

        {/* LIVE NOTICE BANNER */}
        {noticeVisible && (
          <div className="notice-banner">
            <div className={`notice-bar ${notice.type||"info"}`}>
              <span className="notice-ico">
                {notice.type==="urgent"?"🚨":notice.type==="warning"?"🚌":notice.type==="success"?"✅":"📢"}
              </span>
              <span className="notice-txt">{notice.message}</span>
              <button className="notice-close" onClick={()=>{
                setNoticeDismissed(notice.updated); save("noticeDismissed", notice.updated);
              }}>✕</button>
            </div>
          </div>
        )}

        {/* HEADER */}
        <div className="hdr">
          <div className="hdr-row">
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <label style={{cursor:"pointer",flexShrink:0}} title="Update your photo">
                {photos["me"]
                  ? <img src={photos["me"]} alt="me" style={{width:38,height:38,borderRadius:"50%",objectFit:"cover",border:`2px solid ${C.gold}`}}/>
                  : <div style={{width:38,height:38,borderRadius:"50%",background:`${C.gold}25`,border:`2px dashed ${C.gold}60`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>👤</div>
                }
                <input type="file" accept="image/*" style={{display:"none"}} onChange={e=>handlePhotoUpload("me",e.target.files[0])}/>
              </label>
              <div onClick={handleLogoTap} style={{cursor:"default",userSelect:"none"}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <img src="/CreatingCommunity_logo.png" alt="B&B Creating Community"
                    style={{height:40,width:"auto",objectFit:"contain"}}
                    onError={e=>{e.target.style.display="none";}}
                  />
                  <div>
                    <div className="logo-cc">Creating Community</div>
                    <div className="logo">B&B Summit 2026</div>
                    <div className="sub">👋 Hey, {uName}! · {uLoc}</div>
                  </div>
                </div>
              </div>
            </div>
            <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6}}>
              <div className="pts-badge" style={ptsAnim?{transform:"scale(1.1)",transition:"transform .15s"}:{transition:"transform .15s"}} onClick={()=>setTab("leaderboard")}>
                <div className="pts-n">{totalPts.toLocaleString()}</div>
                <div className="pts-l">pts · tap for lb</div>
              </div>
              <button onClick={()=>setShowSettings(true)} style={{background:"none",border:"none",fontSize:18,cursor:"pointer",padding:2,color:C.muted}} title="Settings">⚙️</button>
            </div>
          </div>
        </div>

        {/* COUNTDOWN / CURRENT EVENT */}
        {summitInfo.mode==="countdown"&&(
          <div className="countdown-bar">
            <div style={{fontSize:11,letterSpacing:".15em",textTransform:"uppercase",color:C.teal,fontWeight:700,marginBottom:4}}>🎬 Summit Starts In</div>
            <div style={{fontSize:28,fontWeight:900,color:C.gold,lineHeight:1}}>
              {summitInfo.days>0?`${summitInfo.days}d `:""}
              {summitInfo.hours}h
            </div>
            <div style={{fontSize:11,color:C.muted,marginTop:4}}>March 9–12 · Liberty Cinema 12</div>
          </div>
        )}
        {summitInfo.mode==="during"&&(summitInfo.current||summitInfo.next)&&(
          <div className="current-event">
            {summitInfo.current&&<div style={{marginBottom:summitInfo.next?6:0}}>
              <span style={{fontWeight:700}}>🔴 Now:</span> {summitInfo.current.event.substring(0,80)}{summitInfo.current.event.length>80?"…":""}
            </div>}
            {summitInfo.next&&<div style={{opacity:.7}}>
              <span style={{fontWeight:600}}>⏭️ Next:</span> {summitInfo.next.time} — {summitInfo.next.event.substring(0,60)}{summitInfo.next.event.length>60?"…":""}
            </div>}
          </div>
        )}

        <div style={{display:"flex",justifyContent:"flex-end",marginBottom:10}}>
          <button className="theme-toggle" onClick={toggleDark}>
            {darkMode ? "☀️ Light" : "🌙 Dark"}
          </button>
        </div>
        {/* THANK YOU / RECAP SCREEN — after Thursday 4 PM */}
        {summitOver ? <>
          <div className="thankyou-wrap">
            <div style={{fontSize:60,marginBottom:16}}>🎬</div>
            <div style={{fontWeight:900,fontSize:28,color:C.gold,marginBottom:8}}>That's a Wrap!</div>
            <div style={{fontSize:15,color:C.text,lineHeight:1.7,marginBottom:20}}>
              Thank you for being part of B&B Summit 2026.<br/>
              This circle? That's what Creating Community looks like.
            </div>
            <div className="card" style={{borderColor:`${C.gold}40`,textAlign:"left",marginBottom:16}}>
              <div style={{fontSize:11,letterSpacing:".12em",textTransform:"uppercase",color:C.muted,marginBottom:8}}>Your Summit Stats</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,textAlign:"center"}}>
                <div>
                  <div style={{fontSize:24,fontWeight:900,color:C.gold}}>{totalPts}</div>
                  <div style={{fontSize:10,color:C.muted}}>Total Points</div>
                </div>
                <div>
                  <div style={{fontSize:24,fontWeight:900,color:C.teal}}>{metCount}</div>
                  <div style={{fontSize:10,color:C.muted}}>Connections</div>
                </div>
                <div>
                  <div style={{fontSize:24,fontWeight:900,color:C.green}}>{Object.keys(checkedIn).length}</div>
                  <div style={{fontSize:10,color:C.muted}}>Vendors Visited</div>
                </div>
              </div>
            </div>
            <div style={{fontSize:14,color:C.muted,lineHeight:1.7,marginBottom:20}}>
              The connections you made this week don't end here. Keep building, keep growing, keep Creating Community.
            </div>
            <div style={{marginBottom:12}}>
              <div style={{fontSize:11,color:C.muted,marginBottom:6}}>Have feedback? We'd love to hear from you.</div>
              <a href="https://forms.office.com" target="_blank" rel="noopener noreferrer"
                style={{display:"inline-block",background:`linear-gradient(135deg,${C.teal},${C.gold})`,color:"#fff",
                  padding:"12px 28px",borderRadius:30,fontWeight:700,fontSize:14,textDecoration:"none"}}>
                📝 Share Your Feedback
              </a>
            </div>
            <div style={{fontSize:12,color:C.muted,marginTop:20}}>
              With ❤️ from B&B Theatres · Since 1924
            </div>
          </div>
          <div style={{marginTop:20}}>
            <div style={{fontSize:11,color:C.muted,textAlign:"center",marginBottom:8}}>You can still browse the app:</div>
            <div style={{display:"flex",gap:6,justifyContent:"center",flexWrap:"wrap"}}>
              {["schedule","leaderboard","gallery"].map(t=>(
                <button key={t} className={`tab${tab===t?" on":""}`} onClick={()=>setTab(t)} style={{fontSize:11}}>{t==="schedule"?"📅 Schedule":t==="leaderboard"?"🏆 Leaderboard":"📸 Gallery"}</button>
              ))}
            </div>
          </div>
          {tab==="schedule"&&<div style={{marginTop:12}}>
            <div className="stitle">Summit Schedule</div>
            <div className="tabs">{DAYS.map((d,i)=>(<button key={d} className={`tab${day===i?" on":""}`} onClick={()=>setDay(i)}>{["Mon","Tue","Wed","Thu"][i]} {d.split(" ")[2]}</button>))}</div>
            <div style={{fontSize:13,fontWeight:700,color:C.teal,marginBottom:9}}>{DAYS[day]}</div>
            {SCHEDULE[DAYS[day]].map((s,i)=>{const evts=SCHEDULE[DAYS[day]];return(<div className="si" key={i}><div className="si-time">{s.time}</div><div><div className="si-ev">{s.event}</div><div className="si-meta"><span className={`vpill ${vpClass(s.venue)}`}>{s.venue} {s.loc}</span>{s.food&&<span className="vpill vp-m">🍽️ Meal</span>}</div></div></div>);})}
          </div>}
        </> : <>
        {/* ════════════════ NORMAL APP CONTENT ════════════════ */}
        {tab==="schedule"&&<>
          <div className="stitle">Summit Schedule</div>
          <div className="ssub">March 9–12, 2026 · Liberty Cinema 12</div>
          <div className="tabs">
            {DAYS.map((d,i)=>(
              <button key={d} className={`tab${day===i?" on":""}`} onClick={()=>setDay(i)}>
                {["Mon","Tue","Wed","Thu"][i]} {d.split(" ")[2]}
              </button>
            ))}
          </div>
          <div style={{fontSize:13,fontWeight:700,color:C.teal,marginBottom:9}}>{DAYS[day]}</div>
          {SCHEDULE[DAYS[day]].map((s,i)=>{
            const evts = SCHEDULE[DAYS[day]];
            const hapNow = isHappeningNow(DAYS[day], s.time, evts, i);
            return (
            <div className={`si${hapNow?" now":""}`} key={i} style={s.food&&!hapNow?{borderColor:`${C.gold}30`}:{}}>
              <div className="si-time">{s.time}</div>
              <div>
                <div className="si-ev">{s.event}</div>
                <div className="si-meta">
                  {hapNow&&<span className="now-tag">🔴 Now</span>}
                  <span className={`vpill ${vpClass(s.venue)}`}>{s.venue} {s.loc}</span>
                  {s.food&&<span className="vpill vp-m">🍽️ Meal</span>}
                </div>
              </div>
            </div>
          );})}
        </>}

        {/* ── MY GROUP ── */}
        {tab==="mygroup"&&<>
          <div className="stitle">My Group</div>
          <div className="ssub">{myGroup ? "Wednesday, March 11 · Round Robin Rotation" : "Your Corporate Summit Schedule"}</div>
          {!myGroup
            ? <>
                {/* ── CORPORATE SCHEDULE (accordion by day) ── */}
                {Object.keys(CORPORATE_SCHEDULE).map(dayKey=>{
                  const dayShort = dayKey.split(",")[0];
                  const open = corpExpDay === dayKey;
                  const reqCount = CORPORATE_SCHEDULE[dayKey].filter(s=>s.note?.includes("Required")).length;
                  return (
                    <div key={dayKey} style={{marginBottom:8,borderRadius:14,overflow:"hidden",border:`1px solid ${open?C.teal+"80":C.border}`,transition:"border-color .2s"}}>
                      <div onClick={()=>setCorpExpDay(open?null:dayKey)}
                        style={{display:"flex",alignItems:"center",gap:12,padding:"13px 16px",background:open?`${C.teal}10`:C.card,cursor:"pointer",userSelect:"none",transition:"background .2s"}}>
                        <div style={{width:10,height:10,borderRadius:"50%",background:C.teal,flexShrink:0}}/>
                        <div style={{flex:1}}>
                          <div style={{fontWeight:700,fontSize:14,color:open?C.teal:C.text}}>{dayShort} — {dayKey.split(", ")[1]}</div>
                          <div style={{fontSize:10,color:C.muted,marginTop:2}}>
                            {CORPORATE_SCHEDULE[dayKey].length} events{reqCount>0?` · ${reqCount} required`:""}
                          </div>
                        </div>
                        <div style={{fontSize:16,color:open?C.teal:C.muted,transition:"transform .2s",transform:open?"rotate(180deg)":"rotate(0deg)"}}>&#9660;</div>
                      </div>
                      {open&&(
                        <div style={{padding:"0 12px 14px",background:C.surface}}>
                          {CORPORATE_SCHEDULE[dayKey].map((s,i)=>(
                            <div key={i} style={{borderLeft:`3px solid ${s.note?.includes("Required")?C.teal:C.gold}`,padding:"10px 12px",marginTop:8,background:C.card,borderRadius:"0 10px 10px 0"}}>
                              <div style={{display:"flex",alignItems:"flex-start",gap:10}}>
                                <div style={{fontSize:18,flexShrink:0}}>{s.emoji}</div>
                                <div style={{flex:1}}>
                                  <div style={{fontSize:11,fontWeight:700,color:C.teal,marginBottom:2}}>{s.time}</div>
                                  <div style={{fontSize:13,fontWeight:700,color:C.text,lineHeight:1.4}}>{s.event.replace(/^[^\s]+\s/,"")}</div>
                                  {s.note&&<div style={{fontSize:11,color:s.note.includes("Required")?C.teal:C.muted,marginTop:3,lineHeight:1.5,fontStyle:s.note.includes("Optional")?"italic":"normal"}}>
                                    {s.note.includes("Required")?"⚡ ":""}{s.note}
                                  </div>}
                                  {s.address&&<div style={{marginTop:6}}>
                                    <div style={{fontSize:11,color:C.muted}}>📍 {s.address}</div>
                                    <a href={s.mapUrl} target="_blank" rel="noopener noreferrer"
                                      style={{display:"inline-block",marginTop:4,fontSize:11,fontWeight:700,color:C.teal,background:`${C.teal}15`,border:`1px solid ${C.teal}40`,borderRadius:8,padding:"5px 10px",textDecoration:"none"}}>
                                      🗺️ Get Directions →
                                    </a>
                                  </div>}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* ── ROUND ROBIN GROUPS (accordion) ── */}
                <div style={{height:1,background:C.border,margin:"16px 0"}}/>
                <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:4,letterSpacing:.4,textTransform:"uppercase"}}>Wednesday Round Robin Groups</div>
                <div style={{fontSize:11,color:C.muted,marginBottom:12,lineHeight:1.5}}>Tap any group to see their rotation schedule</div>
                {[1,2,3,4,5,6].map(gn=>{
                  const gi = GROUP_INFO[gn];
                  const open = expandedGroup === gn;
                  return (
                    <div key={gn} style={{marginBottom:8,borderRadius:14,overflow:"hidden",border:`1px solid ${open ? gi.color+"80" : C.border}`,transition:"border-color .2s"}}>
                      <div onClick={()=>setExpandedGroup(open ? null : gn)}
                        style={{display:"flex",alignItems:"center",gap:12,padding:"13px 16px",
                          background:open?`${gi.color}15`:C.card,cursor:"pointer",userSelect:"none",transition:"background .2s"}}>
                        <div style={{width:10,height:10,borderRadius:"50%",background:gi.color,flexShrink:0}}/>
                        <div style={{flex:1}}>
                          <div style={{fontWeight:700,fontSize:14,color:open?gi.color:C.text}}>{gi.icon} {gi.label}</div>
                          <div style={{fontSize:10,color:C.muted,marginTop:2,lineHeight:1.4}}>
                            {gi.locations.slice(0,5).join(" · ")}{gi.locations.length>5?` +${gi.locations.length-5} more`:""}
                          </div>
                        </div>
                        <div style={{fontSize:16,color:open?gi.color:C.muted,transition:"transform .2s",transform:open?"rotate(180deg)":"rotate(0deg)"}}>&#9660;</div>
                      </div>
                      {open && (
                        <div style={{padding:"0 12px 14px",background:C.surface}}>
                          <div style={{fontSize:10,color:C.muted,letterSpacing:".12em",textTransform:"uppercase",padding:"10px 0 8px",borderBottom:`1px solid ${C.border}`,marginBottom:8}}>
                            All locations: {gi.locations.join(" · ")}
                          </div>
                          {ROTATIONS[gn].map((s,i)=>(
                            <div key={i} className={`rs${s.isLunch?" lunch":""}`}
                              style={{borderColor:s.isLunch?`${C.green}40`:SESSION_COLORS[s.session]?`${SESSION_COLORS[s.session]}25`:C.border,marginBottom:5}}>
                              <div className="rs-time">{s.time}</div>
                              <div style={{flex:1}}>
                                <div className="rs-session" style={{color:s.isLunch?C.green:SESSION_COLORS[s.session]||C.text}}>
                                  {s.emoji} {s.session}
                                </div>
                                {s.host&&<div style={{fontSize:10,color:C.muted,marginTop:2}}>&#128100; {s.host}</div>}
                                {s.loc&&<div style={{fontSize:10,color:C.muted}}>&#128205; {s.loc}</div>}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            : <>
                <div className="gc" style={{background:`${GROUP_INFO[myGroup].color}15`,border:`1px solid ${GROUP_INFO[myGroup].color}50`}}>
                  <div style={{fontSize:32,marginBottom:4}}>🎬</div>
                  <div style={{fontWeight:800,fontSize:24,fontWeight:900,color:GROUP_INFO[myGroup].color}}>{GROUP_INFO[myGroup].icon} {GROUP_INFO[myGroup].label}</div>
                  <div style={{fontSize:11,color:C.muted,marginTop:4,lineHeight:1.6}}>{GROUP_INFO[myGroup].locations.join(" · ")}</div>
                </div>
                <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:8,letterSpacing:.4,textTransform:"uppercase"}}>Your Wednesday Rotation</div>
                {ROTATIONS[myGroup].map((s,i)=>(
                  <div className={`rs${s.isLunch?" lunch":""}`} key={i}
                    style={{borderColor:s.isLunch?`${C.green}40`:SESSION_COLORS[s.session]?`${SESSION_COLORS[s.session]}25`:C.border}}>
                    <div className="rs-time">{s.time}</div>
                    <div style={{flex:1}}>
                      <div className="rs-session" style={{color:s.isLunch?C.green:SESSION_COLORS[s.session]||C.text}}>
                        {s.emoji} {s.session}
                      </div>
                      {s.host&&<div style={{fontSize:11,color:C.muted,marginTop:2}}>👤 {s.host}</div>}
                      {s.loc&&<div style={{fontSize:11,color:C.muted}}>📍 {s.loc}</div>}
                    </div>
                  </div>
                ))}
                <div className="card" style={{marginTop:6,borderColor:`${C.gold}30`,background:`${C.gold}08`}}>
                  <div style={{fontSize:12,color:C.muted,lineHeight:1.6}}>💡 <strong style={{color:C.gold}}>Tip:</strong> Each session is ~50 min. Listen for announcements to rotate to your next auditorium!</div>
                </div>

                {/* WHO'S IN MY GROUP */}
                <div style={{marginTop:14}}>
                  <div style={{fontSize:12,fontWeight:600,color:C.muted,marginBottom:8,letterSpacing:.4,textTransform:"uppercase"}}>👥 Who's in {GROUP_INFO[myGroup].label}?</div>
                  <div className="group-members">
                    {ATTENDEES.filter(a=>!a.corporate&&a.group===GROUP_INFO[myGroup].label).map(a=>(
                      <div key={a.id} className="gm-chip" onClick={()=>{setTab("connect");setTimeout(()=>openModal(a),100);}}>
                        <div className="gm-av" style={{background:avColor(a.id)}}>{ini(a.name)}</div>
                        <span>{a.name.split(" ")[0]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
          }
        </>}

        {/* ── HOTEL ── */}
        {tab==="hotel"&&<>
          <div className="stitle">Hotel & Flights</div>
          <div className="ssub">Your travel info for the summit</div>

          {/* ── FLIGHT INFO ── */}
          {myFlights.length > 0 && (
            <div style={{marginBottom:14}}>
              {myFlights.map((fl,fi) => (
                <div key={fi} className="card" style={{borderColor:"#5B8FFF50",background:"#5B8FFF08",marginBottom:10}}>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
                    <div style={{width:44,height:44,borderRadius:12,background:"#5B8FFF20",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>✈️</div>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:800,fontSize:17,fontWeight:900,color:"#5B8FFF"}}>Your Flight</div>
                      <div style={{fontSize:11,color:C.muted,marginTop:1}}>{fl.airline} · Conf: <strong style={{color:C.text,letterSpacing:.5}}>{fl.conf}</strong></div>
                    </div>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:fl.notes?10:0}}>
                    {fl.arrival && (
                      <div style={{background:"rgba(75,175,125,.08)",border:"1px solid rgba(75,175,125,.2)",borderRadius:10,padding:"10px 12px"}}>
                        <div style={{fontSize:9,textTransform:"uppercase",letterSpacing:".12em",color:"rgba(75,175,125,.6)",marginBottom:4}}>✈️ Arrival</div>
                        <div style={{fontSize:15,fontWeight:700,color:"#4CAF7D"}}>{fl.arrival}</div>
                      </div>
                    )}
                    {fl.departure && (
                      <div style={{background:"rgba(230,57,70,.08)",border:"1px solid rgba(230,57,70,.2)",borderRadius:10,padding:"10px 12px"}}>
                        <div style={{fontSize:9,textTransform:"uppercase",letterSpacing:".12em",color:"rgba(230,57,70,.6)",marginBottom:4}}>🛫 Departure</div>
                        <div style={{fontSize:15,fontWeight:700,color:"#E63946"}}>{fl.departure}</div>
                      </div>
                    )}
                  </div>
                  {fl.notes && (
                    <div style={{fontSize:12,color:C.muted,lineHeight:1.6,background:"rgba(255,255,255,.04)",borderRadius:8,padding:"8px 10px",marginTop:4}}>
                      📝 {fl.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ── HOTEL INFO ── */}
          {!myHotel
            ? <div className="card" style={{textAlign:"center",padding:24}}>
                <div style={{fontSize:32,marginBottom:8}}>🏢</div>
                <div style={{fontWeight:600,marginBottom:4}}>No Hotel on File</div>
                <div style={{fontSize:13,color:C.muted,lineHeight:1.6}}>If you requested a hotel room, check with Bobbie Bagby for your assignment.</div>
              </div>
            : <>
                <div className="hcard" style={{background:`${hotelInfo.color}12`,border:`2px solid ${hotelInfo.color}50`}}>
                  <div style={{fontSize:34,marginBottom:6,textAlign:"center"}}>🏨</div>
                  <div className="hname" style={{color:hotelInfo.color,textAlign:"center"}}>{myHotel}</div>
                  <div style={{height:1,background:C.border,margin:"12px 0"}}/>
                  <div className="hrow"><span className="hrow-l">📍 Address</span><span>{hotelInfo.address}</span></div>
                  <div className="hrow"><span className="hrow-l">📞 Phone</span><a href={`tel:${hotelInfo.phone}`} style={{color:hotelInfo.color,textDecoration:"none"}}>{hotelInfo.phone}</a></div>
                  <div className="hrow" style={{border:"none"}}><span className="hrow-l">ℹ️ Notes</span><span style={{fontSize:12,color:C.muted,lineHeight:1.5}}>{hotelInfo.notes}</span></div>
                </div>
                <div className="card" style={{borderColor:`${C.gold}30`,background:`${C.gold}08`}}>
                  <div style={{fontSize:12,color:C.gold,fontWeight:600,marginBottom:4}}>🚌 Bus Schedule</div>
                  <div style={{fontSize:12,color:C.muted,lineHeight:1.7}}>
                    <strong style={{color:C.text}}>Morning pickups are for flyers only</strong> — bus departs TownePlace Suites at <strong style={{color:C.text}}>9:30 AM</strong> on Tue, Wed & Thu.<br/>
                    Return buses depart Liberty Cinema 12 after evening events.<br/>
                    <strong style={{color:C.text}}>Wednesday Main Event buses:</strong> Managers only. Corporate employees who live in KC Metro — please drive yourself to Main Event.
                  </div>
                </div>
                <div className="card">
                  <div style={{fontSize:11,color:C.muted,fontWeight:600,marginBottom:6}}>OTHER HOTEL</div>
                  <div style={{fontSize:13}}>
                    {myHotel==="TownePlace Suites"
                      ? <><strong>Hampton Inn & Suites KC Downtown</strong> · 1571 Main St, Kansas City, MO · (816) 255-3915<br/><span style={{fontSize:11,color:C.muted}}>Theatre managers staying here</span></>
                      : <><strong>TownePlace Suites KC Liberty</strong> · 130 S Stewart Rd, Liberty, MO · (816) 415-9200<br/><span style={{fontSize:11,color:C.muted}}>Corporate staff & select managers</span></>
                    }
                  </div>
                </div>
              </>
          }
        </>}

        {/* ── VENDORS ── */}
        {tab==="vendors"&&<>
          {isPreview&&<div className="preview-banner">
            <span style={{fontSize:20}}>🎮</span>
            <div>You're exploring early! All points, check-ins, and quiz scores <strong>reset automatically Sunday night</strong> so everyone starts fresh on Monday.</div>
          </div>}
          <div className="stitle">🎯 Vendor Quest</div>
          <div className="ssub">Check in at each booth · ace the quiz · earn points!</div>
          <div className="card" style={{marginBottom:12,borderColor:`${C.gold}40`,display:"flex",alignItems:"center",gap:12}}>
            <div style={{flex:1}}>
              <div style={{fontSize:11,color:C.muted,marginBottom:4}}>YOUR PROGRESS</div>
              <div className="pb-wrap"><div className="pb-fill" style={{width:`${(Object.keys(checkedIn).length/VENDORS.length)*100}%`}}/></div>
              <div style={{fontSize:11,color:C.muted}}>{Object.keys(checkedIn).length}/{VENDORS.length} booths · +{BOOTH_PTS} pts per check-in · +{QUIZ_PTS} pts per correct answer</div>
            </div>
            <div style={{fontWeight:800,fontSize:24,color:C.gold,fontWeight:900}}>{vendorPts}</div>
          </div>
          {VENDORS.map(v=>{
            const ci=checkedIn[v.id], qd=quizDone[v.id], qdone=qd!==undefined;
            return(
              <div className="vc" key={v.id} style={{borderColor:ci?`${v.color}60`:C.border}}>
                <div className="vc-hdr">
                  <div className="vc-logo" style={{background:`${v.color}15`}}>
                    {v.logoUrl
                      ? <img src={v.logoUrl} alt={v.name} style={{width:36,height:36,objectFit:"contain",borderRadius:6}}
                          onError={e=>{e.target.style.display="none";e.target.nextSibling.style.display="block";}}/>
                      : null}
                    <span style={v.logoUrl?{display:"none"}:{}}>{v.logo}</span>
                  </div>
                  <div style={{flex:1}}>
                    <div className="vc-name">{v.name}</div>
                    {v.contact&&v.contact!=="TBD"&&<div style={{fontSize:12,color:C.muted,marginTop:2}}>👤 {v.contact}</div>}
                  </div>
                  {ci&&<span style={{fontSize:17}}>✅</span>}
                </div>
                <div style={{padding:"0 14px 11px",fontSize:13,color:C.muted,lineHeight:1.5}}>{v.description}</div>
                <div className="vc-acts">
                  {ci
                    ? <div className="ci-ok">✓ Checked In (+{BOOTH_PTS} pts)</div>
                    : <button className="btn btn-s" onClick={()=>checkIn(v.id)}>📍 Check In (+{BOOTH_PTS} pts)</button>}
                  {qdone
                    ? <div className="ci-ok" style={{background:`${C.corp}18`,color:C.corp,borderColor:`${C.corp}35`}}>Quiz {qd}/{v.quiz.length} ✓</div>
                    : <button className="btn btn-g" onClick={()=>startQuiz(v)}>🧠 Take Quiz</button>}
                </div>
              </div>
            );
          })}
        </>}

        {/* ── CONNECT ── */}
        {tab==="connect"&&<>
          {isPreview&&<div className="preview-banner">
            <span style={{fontSize:20}}>🎮</span>
            <div>You're exploring early! All connections and nominations <strong>reset automatically Sunday night</strong> so everyone starts fresh on Monday.</div>
          </div>}
          <div style={{background:"linear-gradient(160deg,#1a0a2e 0%,#0d1b2e 60%,#0f1923 100%)",borderRadius:14,padding:"16px",marginBottom:12,border:"1px solid rgba(255,215,0,.12)"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <div>
                <div style={{fontSize:11,letterSpacing:".15em",textTransform:"uppercase",color:C.gold,opacity:.8,marginBottom:3}}>Creating Community</div>
                <div style={{fontWeight:800,fontSize:22,fontWeight:900,color:"#fff"}}>Connect</div>
                <div style={{fontSize:12,color:"rgba(240,230,211,.45)",fontStyle:"italic",marginTop:2}}>Meet everyone. Make it count.</div>
              </div>
              <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:8}}>
                <div style={{position:"relative",width:60,height:60}}>
                  <svg width="60" height="60" viewBox="0 0 60 60">
                    <circle cx="30" cy="30" r="25" fill="none" stroke="rgba(255,255,255,.1)" strokeWidth="5"/>
                    <circle cx="30" cy="30" r="25" fill="none" stroke={C.gold} strokeWidth="5"
                      strokeLinecap="round" strokeDasharray={`${2*Math.PI*25}`}
                      strokeDashoffset={`${2*Math.PI*25*(1-pct/100)}`}
                      transform="rotate(-90 30 30)" style={{transition:"stroke-dashoffset .6s ease"}}/>
                  </svg>
                  <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",textAlign:"center"}}>
                    <div style={{fontSize:14,fontWeight:700,color:C.gold,lineHeight:1}}>{metCount}</div>
                    <div style={{fontSize:9,color:C.muted}}>/{ATTENDEES.length}</div>
                  </div>
                </div>
                <div style={{background:"rgba(255,215,0,.1)",border:"1px solid rgba(255,215,0,.25)",borderRadius:10,padding:"5px 10px",textAlign:"center"}}>
                  <div style={{fontSize:16,fontWeight:700,color:C.gold,lineHeight:1}}>⭐ {connectPts.toLocaleString()}</div>
                  <div style={{fontSize:9,color:"rgba(255,215,0,.5)",textTransform:"uppercase",letterSpacing:".1em"}}>connect pts</div>
                </div>
              </div>
            </div>
            <div style={{height:3,background:"rgba(255,255,255,.07)",borderRadius:3,overflow:"hidden"}}>
              <div style={{height:"100%",background:`linear-gradient(90deg,${C.gold},#FFA500)`,borderRadius:3,width:`${pct}%`,transition:"width .6s ease"}}/>
            </div>
            <div style={{fontSize:10,color:"rgba(240,230,211,.35)",marginTop:4}}>{pct}% connected · {CONNECT_PTS} pts per connection</div>
          </div>
          <input className="srch" placeholder="🔍  Search name, theatre, group…" value={cSearch} onChange={e=>setCSearch(e.target.value)}/>

          {/* FIND ME AT */}
          <div className="findme-card">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:findMeEdit||!findMeAt?8:0}}>
              <div style={{fontSize:12,fontWeight:700,color:C.teal}}>📍 Find Me At</div>
              {findMeAt&&!findMeEdit&&<button onClick={()=>setFindMeEdit(true)} style={{background:"none",border:"none",fontSize:11,color:C.teal,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Edit</button>}
            </div>
            {findMeAt&&!findMeEdit
              ? <div style={{fontSize:13,color:C.text}}>{findMeAt}</div>
              : <div style={{display:"flex",gap:6}}>
                  <input className="findme-input" placeholder="e.g. At the pizza table! 🍕" value={findMeAt}
                    onChange={e=>setFindMeAt(e.target.value)}
                    onKeyDown={e=>{if(e.key==="Enter"){saveFindMeAt(findMeAt);setFindMeEdit(false);}}}/>
                  <button onClick={()=>{saveFindMeAt(findMeAt);setFindMeEdit(false);}}
                    style={{background:C.teal,color:"#fff",border:"none",borderRadius:8,padding:"8px 12px",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif",whiteSpace:"nowrap"}}>
                    Save
                  </button>
                </div>}
          </div>

          {/* DAILY POLL */}
          <div className="poll-card">
            <div style={{fontSize:12,fontWeight:700,color:C.gold,marginBottom:3}}>📊 Daily Poll</div>
            <div style={{fontSize:14,fontWeight:700,color:C.text,marginBottom:10,lineHeight:1.4}}>{todayPoll.q}</div>
            {todayPoll.opts.map((opt,i)=>{
              const voted = pollVote[todayPollKey] !== undefined;
              const myVote = pollVote[todayPollKey] === i;
              const pollDoc = pollResults[`poll_${todayPollKey}`] || {};
              const total = pollDoc.totalVotes || 0;
              const count = pollDoc[`opt${i}`] || 0;
              const pctV = total > 0 ? Math.round((count/total)*100) : 0;
              return (
                <div key={i} className={`poll-opt${myVote?" voted":""}`}
                  onClick={()=>!voted&&votePoll(i)}
                  style={voted?{cursor:"default"}:{}}>
                  <div style={{flex:1}}>
                    <div style={{marginBottom:voted?4:0}}>{opt}</div>
                    {voted&&<div className="poll-bar"><div className="poll-fill" style={{width:`${pctV}%`}}/></div>}
                  </div>
                  {voted&&<div style={{fontSize:12,fontWeight:700,color:myVote?C.teal:C.muted,minWidth:36,textAlign:"right"}}>{pctV}%</div>}
                </div>
              );
            })}
            {pollVote[todayPollKey]!==undefined&&<div style={{fontSize:10,color:C.muted,marginTop:6,textAlign:"center"}}>
              {(pollResults[`poll_${todayPollKey}`]?.totalVotes||0)} votes so far
            </div>}
          </div>
          <div className="tabs" style={{marginBottom:6}}>
            {["all","met","not yet"].map(f=>(
              <button key={f} className={`tab${cFilter===f?" on":""}`} onClick={()=>setCFilter(f)}>
                {f==="all"?"All":f==="met"?`✅ Met (${metCount})`:`⏳ Not Yet`}
              </button>
            ))}
          </div>
          <div className="tabs" style={{flexWrap:"wrap",gap:4,marginBottom:10}}>
            {allGroups.map(g=>{
              const gc = GROUP_COLOR[g]||C.gold;
              const on = cGroup===g;
              return(<button key={g} className="tab" style={on?{borderColor:gc,color:gc,background:`${gc}18`}:{}} onClick={()=>setCGroup(g)}>{g}</button>);
            })}
          </div>
          <div style={{fontSize:11,color:C.muted,marginBottom:8}}>Showing {filtConns.length} of {ATTENDEES.length}</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16}}>
            {filtConns.map(p=>{
              const met = !!conns[p.id]; const conn = conns[p.id];
              const hasPoints = met&&(p.corporate||conn?.nominations?.length>0);
              const gc = GROUP_COLOR[p.group]||"#666";
              return(
                <div key={p.id} onClick={()=>openModal(p)}
                  style={{background:met?"#1c2e20":p.corporate?"#1e1a2e":C.card,
                    border:`1px solid ${met?"rgba(0,200,100,.2)":p.corporate?"rgba(160,120,255,.2)":C.border}`,
                    borderTop:`3px solid ${gc}`,borderRadius:12,padding:"12px 10px",
                    cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:2,userSelect:"none"}}>
                  <div style={{position:"relative"}} onClick={e=>{e.stopPropagation();}}>
                    {photos[p.id]
                      ? <img src={photos[p.id]} alt={p.name} style={{width:42,height:42,borderRadius:"50%",objectFit:"cover",marginBottom:4,border:`2px solid ${avColor(p.id)}`}}/>
                      : <div style={{width:42,height:42,borderRadius:"50%",background:avColor(p.id),display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#fff",marginBottom:4}}>{ini(p.name)}</div>
                    }
                    {met&&<div style={{position:"absolute",bottom:2,right:-3,background:"#00c853",color:"#fff",borderRadius:"50%",width:15,height:15,fontSize:8,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700}}>✓</div>}
                    <label style={{position:"absolute",top:-4,right:-6,background:"rgba(0,0,0,.6)",borderRadius:"50%",width:16,height:16,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:9}} title="Add photo">
                      📷<input type="file" accept="image/*" style={{display:"none"}} onChange={e=>handlePhotoUpload(p.id, e.target.files[0])}/>
                    </label>
                  </div>
                  <div style={{fontSize:11,fontWeight:700,color:"#fff",textAlign:"center",lineHeight:1.3}}>{p.name}</div>
                  <div style={{fontSize:9,color:"rgba(240,230,211,.3)",textAlign:"center"}}>{p.role}</div>
                  <div style={{fontSize:9,borderRadius:20,border:`1px solid ${gc}44`,padding:"1px 6px",marginTop:2,color:gc,background:`${gc}11`}}>
                    {p.corporate?"Corporate":p.group}
                  </div>
                  {!p.corporate&&<div style={{fontSize:9,color:`${C.gold}90`,textAlign:"center",marginTop:1}}>{p.theatre}</div>}
                  {hasPoints&&<div style={{marginTop:4,fontSize:9,color:C.gold,background:"rgba(255,215,0,.1)",padding:"1px 7px",borderRadius:20}}>⭐ {CONNECT_PTS} pts</div>}
                  {met&&!hasPoints&&!p.corporate&&<div style={{marginTop:3,fontSize:8,color:"rgba(255,255,255,.18)",fontStyle:"italic"}}>Nominate to earn pts</div>}
                  {!met&&<div style={{marginTop:4,fontSize:9,color:"rgba(255,255,255,.2)",fontStyle:"italic"}}>Tap to connect →</div>}
                </div>
              );
            })}
          </div>
        </>}

        {/* ── GALLERY ── */}
        {tab==="gallery"&&<>
          <div className="stitle">📸 Summit Gallery</div>
          <div className="ssub">Share your favorite moments from the summit!</div>
          {galleryUploaded
            ? <div className="card" style={{textAlign:"center",padding:20,borderColor:"rgba(76,175,125,.4)",background:"rgba(76,175,125,.06)",marginBottom:12}}>
                <div style={{fontSize:28,marginBottom:6}}>🎉</div>
                <div style={{fontWeight:700,color:"#4CAF7D",marginBottom:4}}>Photo Submitted!</div>
                <div style={{fontSize:12,color:"rgba(255,255,255,.4)"}}>Your photo is being reviewed and will appear soon.</div>
              </div>
            : <div style={{marginBottom:12}}>
                <input style={{width:"100%",padding:"10px 14px",borderRadius:10,border:`1px solid ${C.border}`,background:C.inputBg,color:C.text,fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:13,outline:"none",marginBottom:8,boxSizing:"border-box"}}
                  placeholder="Add a caption (optional)…" value={galleryCaption} onChange={e=>setGalleryCaption(e.target.value)}/>
                <label className="gallery-upload">
                  {galleryUploading
                    ? <><div style={{fontSize:28,marginBottom:6}}>⏳</div><div style={{fontSize:13,color:`${C.gold}BB`,fontWeight:600}}>Uploading…</div></>
                    : <><div style={{fontSize:32,marginBottom:6}}>📷</div>
                        <div style={{fontSize:14,fontWeight:700,color:C.gold}}>Tap to Upload a Photo</div>
                        <div style={{fontSize:11,color:C.muted,marginTop:4}}>Photos are reviewed before posting</div></>}
                  <input type="file" accept="image/*" capture="environment" style={{display:"none"}} onChange={e=>uploadPhoto(e.target.files[0])} disabled={galleryUploading}/>
                </label>
              </div>}
          {galleryPhotos.length===0
            ? <div className="card" style={{textAlign:"center",padding:28}}>
                <div style={{fontSize:36,marginBottom:10}}>🎬</div>
                <div style={{fontWeight:800,fontSize:17,color:"#D4AF37",marginBottom:6}}>No Photos Yet!</div>
                <div style={{fontSize:13,color:"rgba(255,255,255,.35)"}}>Be the first to share a summit moment.</div>
              </div>
            : <div className="gallery-grid">
                {galleryPhotos.map(p=>(
                  <div key={p.id} className="gallery-item" onClick={()=>setLightbox(p)}>
                    <img src={p.url} alt={p.caption||"Summit photo"} loading="lazy"/>
                    {(p.caption||p.uploaderName)&&(<div className="gallery-cap">
                      {p.caption&&<div>{p.caption}</div>}
                      {p.uploaderName&&<div className="gallery-who">📍 {p.uploaderName} · {p.uploaderLoc}</div>}
                    </div>)}
                  </div>
                ))}
              </div>}
        </>}

        {/* ── LEADERBOARD ── */}
        {tab==="leaderboard"&&<>
          <div className="stitle">🏆 Leaderboard</div>
          <div className="ssub">Top scorers win prizes at Thursday's Awards Ceremony!</div>
          <div className="card" style={{marginBottom:14,borderColor:`${C.gold}40`}}>
            <div style={{fontSize:11,color:C.muted,marginBottom:8,letterSpacing:.5,textTransform:"uppercase"}}>Point Guide</div>
            <div style={{display:"flex",gap:14,flexWrap:"wrap"}}>
              {[[`+${BOOTH_PTS}`,"Booth check-in"],[`+${QUIZ_PTS}`,"Per correct answer"],[`+${CONNECT_PTS}`,"Connection made"]].map(([v,l])=>(
                <div key={l}><div style={{fontWeight:800,fontSize:18,color:C.gold,fontWeight:700}}>{v}</div><div style={{fontSize:11,color:C.muted}}>{l}</div></div>
              ))}
            </div>
          </div>
          {myEntry&&(
            <div className="card" style={{marginBottom:12,borderColor:C.gold,background:`${C.gold}08`}}>
              <div style={{fontSize:11,color:C.muted,marginBottom:6}}>YOUR SCORE</div>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,fontSize:15,color:C.gold}}>{uName}</div>
                  <div style={{fontSize:11,color:C.muted}}>{uLoc}</div>
                  <div style={{display:"flex",gap:5,marginTop:4}}>
                    <span className="lb-t">🏪 {myEntry.v}</span><span className="lb-t">🧠 {myEntry.q}</span><span className="lb-t">🤝 {myEntry.c}</span>
                  </div>
                </div>
                <div><div className="lb-p">{totalPts}</div><div className="lb-pl">POINTS</div></div>
              </div>
            </div>
          )}
          <div style={{fontSize:11,color:C.muted,marginBottom:8,fontStyle:"italic"}}>* Live scores — updates as attendees check in & connect</div>
          {nomCount>0&&<div className="card" style={{marginBottom:12,borderColor:`${C.teal}30`,background:`${C.teal}06`,textAlign:"center",padding:"12px 14px"}}>
            <div style={{fontSize:13,color:C.teal}}>✨ <strong>{nomCount.toLocaleString()}</strong> award nominations submitted so far!</div>
            <div style={{fontSize:11,color:C.muted,marginTop:3}}>Winners announced at Thursday's Awards Ceremony 🏆</div>
          </div>}
          {lb.length===0&&(
            <div className="card" style={{textAlign:"center",padding:28,borderColor:`${C.gold}25`}}>
              <div style={{fontSize:36,marginBottom:10}}>🏆</div>
              <div style={{fontWeight:800,fontSize:18,color:C.gold,marginBottom:6}}>The Race Hasn't Started!</div>
              <div style={{fontSize:13,color:C.muted,lineHeight:1.7}}>Check in at vendor booths, take quizzes, and connect with fellow managers to get on the board.</div>
            </div>
          )}
          {lb.map((e,i)=>{
            const r=i+1, me=e.name?.includes("(You)");
            return(
              <div className={`le${r===1?" g1":r===2?" g2":r===3?" g3":""}`} key={i} style={me?{borderColor:C.gold,background:`${C.gold}12`}:{}}>
                <div className={`rb${r===1?" r1":r===2?" r2":r===3?" r3":" ro"}`}>{r<=3?["🥇","🥈","🥉"][r-1]:r}</div>
                <div style={{flex:1}}>
                  <div className="lb-n" style={me?{color:C.gold}:{}}>{e.name}</div>
                  <div className="lb-l">{e.loc}</div>
                  <div style={{display:"flex",gap:5,marginTop:3}}>
                    <span className="lb-t">🏪 {e.v}</span><span className="lb-t">🧠 {e.q}</span><span className="lb-t">🤝 {e.c}</span>
                  </div>
                </div>
                <div><div className="lb-p">{e.pts}</div><div className="lb-pl">POINTS</div></div>
              </div>
            );
          })}
        </>}

      </>}{/* end summitOver ternary */}
      </div>{/* end .wrap */}

      {/* SETTINGS PANEL */}
      {showSettings&&(
        <div className="settings-overlay">
          <div className="settings-bg" onClick={()=>setShowSettings(false)}/>
          <div className="settings-sheet">
            <div className="settings-hdr">
              <div className="settings-title">⚙️ Settings</div>
              <button onClick={()=>setShowSettings(false)} style={{background:"none",border:"none",fontSize:18,cursor:"pointer",color:C.muted}}>✕</button>
            </div>
            <div className="settings-row">
              <div>
                <div className="settings-label">👤 Name</div>
                <div className="settings-sub">{uName}</div>
              </div>
            </div>
            <div className="settings-row">
              <div>
                <div className="settings-label">📍 Location</div>
                <div className="settings-sub">{uLoc}</div>
              </div>
            </div>
            <div className="settings-row">
              <div>
                <div className="settings-label">{darkMode?"☀️":"🌙"} Appearance</div>
                <div className="settings-sub">{darkMode?"Dark mode":"Light mode"}</div>
              </div>
              <button onClick={toggleDark} style={{background:C.tealBg,border:`1px solid ${C.tealBorder}`,borderRadius:8,padding:"6px 14px",color:C.teal,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                Switch to {darkMode?"Light":"Dark"}
              </button>
            </div>
            <div className="settings-row">
              <div>
                <div className="settings-label">🏆 Your Points</div>
                <div className="settings-sub">{totalPts} total · {Object.keys(checkedIn).length} vendors · {metCount} connections</div>
              </div>
            </div>
            <div className="settings-row" style={{border:"none"}}>
              <div>
                <div className="settings-label">📍 Find Me At</div>
                <div className="settings-sub">{findMeAt || "Not set"}</div>
              </div>
              <button onClick={()=>{setShowSettings(false);setTab("connect");setFindMeEdit(true);}}
                style={{background:C.tealBg,border:`1px solid ${C.tealBorder}`,borderRadius:8,padding:"6px 14px",color:C.teal,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                Update
              </button>
            </div>
            <div style={{marginTop:16,paddingTop:14,borderTop:`1px solid ${C.border}`}}>
              <button onClick={()=>{
                  if(confirm("Change your name/location? This will reset your profile.")){
                    save("name",""); save("loc",""); setUName(""); setULoc(""); setShowSettings(false);
                  }
                }} style={{width:"100%",padding:"12px",borderRadius:10,border:`1px solid ${C.red}40`,background:`${C.red}08`,color:C.red,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                🔄 Change Name / Location
              </button>
            </div>
            <div style={{textAlign:"center",marginTop:16,fontSize:11,color:C.muted}}>B&B Summit 2026 · Creating Community</div>
          </div>
        </div>
      )}

      {/* TUTORIAL OVERLAY */}
      {showTutorial && uName && (
        <div className="tut-overlay" onClick={()=>{}}>
          <div className="tut-sheet">
            <div className="tut-dots">{[0,1,2].map(i=><div key={i} className={`tut-dot${tutSlide===i?" on":""}`}/>)}</div>
            {tutSlide===0&&<>
              <span className="tut-icon">🤝</span>
              <div className="tut-title">Connect with Everyone</div>
              <div className="tut-desc">The Connect tab is your most important tool. Your goal — meet as many people as possible and build real community!</div>
              <div className="tut-tip">
                <div className="tut-tip-row"><span className="tut-tip-ico">1️⃣</span><span className="tut-tip-txt">Find someone, have a real conversation</span></div>
                <div className="tut-tip-row"><span className="tut-tip-ico">2️⃣</span><span className="tut-tip-txt">Tap their card in the Connect tab</span></div>
                <div className="tut-tip-row"><span className="tut-tip-ico">3️⃣</span><span className="tut-tip-txt">Answer a quick question to prove you met</span></div>
                <div className="tut-tip-row"><span className="tut-tip-ico">4️⃣</span><span className="tut-tip-txt">Nominate them for a Spotlight or Values award</span></div>
                <div className="tut-tip-row"><span className="tut-tip-ico">⭐</span><span className="tut-tip-txt"><strong style={{color:"#D4AF37"}}>Earn 50 points</strong> for each meaningful connection!</span></div>
              </div>
            </>}
            {tutSlide===1&&<>
              <span className="tut-icon">🎯</span>
              <div className="tut-title">Vendor Quest</div>
              <div className="tut-desc">Visit every vendor booth in the lobby — check in, take their quiz, and rack up points. Prizes go to the top scorers on Thursday!</div>
              <div className="tut-tip">
                <div className="tut-tip-row"><span className="tut-tip-ico">📍</span><span className="tut-tip-txt"><strong style={{color:"#D4AF37"}}>+30 points</strong> just for visiting a booth</span></div>
                <div className="tut-tip-row"><span className="tut-tip-ico">🧠</span><span className="tut-tip-txt"><strong style={{color:"#D4AF37"}}>+25 points</strong> per correct quiz answer</span></div>
                <div className="tut-tip-row"><span className="tut-tip-ico">🏆</span><span className="tut-tip-txt">Top 3 on the leaderboard win prizes at the Awards Ceremony!</span></div>
                <div className="tut-tip-row"><span className="tut-tip-ico">📅</span><span className="tut-tip-txt">Vendor tables are open Tuesday in the lobby. Vendors will also join us at Main Event on Wednesday!</span></div>
              </div>
            </>}
            {tutSlide===2&&<>
              <span className="tut-icon">🎬</span>
              <div className="tut-title">Your Summit HQ</div>
              <div className="tut-desc">Everything you need for the next 4 days is right here. No printed schedule needed — it's all in the app!</div>
              <div className="tut-tip">
                <div className="tut-tip-row"><span className="tut-tip-ico">📅</span><span className="tut-tip-txt"><strong style={{color:"#D4AF37"}}>Schedule</strong> — full 4-day agenda with locations</span></div>
                <div className="tut-tip-row"><span className="tut-tip-ico">🔄</span><span className="tut-tip-txt"><strong style={{color:"#D4AF37"}}>My Group</strong> — your Wednesday rotation times & rooms</span></div>
                <div className="tut-tip-row"><span className="tut-tip-ico">🏨</span><span className="tut-tip-txt"><strong style={{color:"#D4AF37"}}>Hotel</strong> — address, phone & bus schedule</span></div>
                <div className="tut-tip-row"><span className="tut-tip-ico">🏆</span><span className="tut-tip-txt"><strong style={{color:"#D4AF37"}}>Leaderboard</strong> — watch your points climb all week!</span></div>
              </div>
            </>}
            <div className="tut-nav">
              <button className="tut-skip" onClick={dismissTutorial}>Skip</button>
              {tutSlide < 2
                ? <button className="tut-next" onClick={()=>setTutSlide(tutSlide+1)}>Next →</button>
                : <button className="tut-next" onClick={dismissTutorial}>Let's Go! 🎬</button>}
            </div>
          </div>
        </div>
      )}

      {/* BOTTOM NAV */}
      <nav className="nav-bar">
        {NAV.map(n=>(<button key={n.id} className={`ni${tab===n.id?" on":""}`} onClick={()=>setTab(n.id)}>
          <span className="ico">{n.ico}</span><span className="lbl">{n.lbl}</span>
        </button>))}
      </nav>

      {/* VENDOR QUIZ MODAL */}
      {aq&&(
        <div className="qo">
          <div className="qm">
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14,padding:"0 0 12px",borderBottom:`1px solid ${C.border}`}}>
              <span style={{fontSize:22}}>{aq.logo}</span>
              <div style={{flex:1}}><div style={{fontWeight:700,fontSize:14}}>{aq.name}</div><div style={{fontSize:11,color:C.muted}}>Vendor Quiz</div></div>
              {!fin&&<button onClick={()=>setAQ(null)} style={{background:"none",border:"none",color:C.muted,fontSize:20,cursor:"pointer"}}>✕</button>}
            </div>
            {!fin?(
              <>
                <div className="qprog">{aq.quiz.map((_,i)=><div key={i} className={`qpip${i<qIdx?" done":i===qIdx?" cur":""}`}/>)}</div>
                <div className="qq">{aq.quiz[qIdx].q}</div>
                {aq.quiz[qIdx].options.map((o,i)=>{
                  let cls="qopt";
                  if(sel!==null){if(i===aq.quiz[qIdx].answer) cls+=" ok"; else if(i===sel) cls+=" no";}
                  return <button key={i} className={cls} onClick={()=>pickAns(i)} disabled={sel!==null}>{o}</button>;
                })}
              </>
            ):(
              <div style={{textAlign:"center",padding:"10px 0"}}>
                <div style={{width:66,height:66,borderRadius:"50%",border:`3px solid ${C.gold}`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",margin:"0 auto 12px"}}>
                  <div style={{fontWeight:800,fontSize:20,fontWeight:900,color:C.gold}}>{ans.filter(Boolean).length}/{aq.quiz.length}</div>
                </div>
                <div style={{fontWeight:800,fontSize:17,marginBottom:7}}>{ans.filter(Boolean).length===aq.quiz.length?"🎉 Perfect Score!":"Nice Work!"}</div>
                <div style={{fontSize:13,color:C.muted,marginBottom:16}}>You earned <span style={{color:C.gold,fontWeight:700}}>+{ans.filter(Boolean).length*QUIZ_PTS} points</span>!</div>
                <button className="btn btn-g" style={{width:"100%"}} onClick={()=>setAQ(null)}>Back to Vendors →</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CONNECT MODAL */}
      {modal&&(
        <div className="ctm" onClick={closeModal}>
          <div className="csh" onClick={e=>e.stopPropagation()}>
            <div className="csh-hdr" style={{background:avColor(modal.id)}}>
              {photos[modal.id]
                ? <img src={photos[modal.id]} alt={modal.name} style={{width:64,height:64,borderRadius:"50%",objectFit:"cover",marginBottom:5,border:"3px solid rgba(255,255,255,.3)"}}/>
                : <div className="csh-av">{ini(modal.name)}</div>}
              <div style={{fontSize:18,fontWeight:700,color:"#fff",textAlign:"center"}}>{modal.name}</div>
              <div style={{fontSize:12,color:"rgba(255,255,255,.7)",textAlign:"center"}}>{modal.role} · {modal.theatre}</div>
              <div style={{fontSize:10,borderRadius:20,border:`1px solid ${GROUP_COLOR[modal.group]||"#666"}55`,padding:"2px 12px",marginTop:3,letterSpacing:".05em",background:`${GROUP_COLOR[modal.group]||"#666"}30`,color:GROUP_COLOR[modal.group]||"#ccc"}}>{GROUP_ICON[modal.group]||""} {modal.group}</div>
              {modal.corporate&&<div style={{fontSize:10,color:"rgba(255,215,0,.5)",marginTop:3,fontStyle:"italic"}}>Earns {CONNECT_PTS} pts · No nomination needed</div>}
              <button onClick={closeModal} style={{position:"absolute",top:12,right:12,background:"rgba(0,0,0,.28)",border:"none",color:"#fff",fontSize:14,borderRadius:"50%",width:28,height:28,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
            </div>
            <div className="csh-body">
              {cStep===1&&(<>
                <div className="step-lbl">{modal.corporate?`Log Your Conversation · +${CONNECT_PTS} pts`:"Step 1 of 2 · Prove You Met Them"}</div>
                <div className="q-box"><span style={{fontSize:20,flexShrink:0}}>🎬</span><p className="q-text">{cQuestion}</p></div>
                <textarea className="ctextarea" rows={3} placeholder="Your answer… (at least a few words)" value={cAnswer} onChange={e=>setCAnswer(e.target.value)}/>
                <div className="hint">{cAnswer.trim().length<5?`${5-cAnswer.trim().length} more characters to continue`:"✓ Looking good!"}</div>
                <div className="pts-note">
                  {modal.corporate
                    ? <>⭐ Meeting corporate staff automatically earns <strong>{CONNECT_PTS} points</strong></>
                    : <>⭐ Nominate them in Step 2 to earn <strong>{CONNECT_PTS} points</strong></>}
                </div>
                <button className="prim-btn" disabled={cAnswer.trim().length<5} onClick={handleCNext}>
                  {modal.corporate?`Save & Earn +${CONNECT_PTS} pts ✓`:"Next: Nominate Them →"}
                </button>
              </>)}
              {cStep===2&&(<>
                <div className="step-lbl">Step 2 of 2 · Spotlight & Values</div>
                <p style={{fontSize:13,color:C.muted,lineHeight:1.6,marginBottom:14}}>
                  Does {modal.name.split(" ")[0]} deserve any of these? <span style={{color:C.gold,fontWeight:700}}>⭐ {CONNECT_PTS} pts</span> with a nomination.
                </p>
                <div style={{fontSize:10,letterSpacing:".12em",textTransform:"uppercase",color:"rgba(240,230,211,.35)",marginBottom:7}}>✨ Spotlight Awards</div>
                {SPOTLIGHT_AWARDS.map(a=><AwardRow key={a.id} award={a} selected={cNoms.includes(a.id)} onToggle={toggleNom}/>)}
                <div style={{fontSize:10,letterSpacing:".12em",textTransform:"uppercase",color:C.muted,margin:"12px 0 7px"}}>🏠 Core Values</div>
                {VALUE_AWARDS.map(a=><AwardRow key={a.id} award={a} selected={cNoms.includes(a.id)} onToggle={toggleNom}/>)}
                {cNoms.length>0&&(<div style={{marginTop:12}}>
                  <div style={{fontSize:11,color:C.muted,marginBottom:5}}>Why? (optional)</div>
                  <textarea className="ctextarea" rows={2} placeholder="What made them stand out?" value={cNote} onChange={e=>setCNote(e.target.value)}/>
                </div>)}
                <div style={{display:"flex",gap:8,marginTop:8}}>
                  <button className="ghost-btn" onClick={()=>setCStep(1)}>← Back</button>
                  <button className="prim-btn" style={{flex:2,marginTop:0}} onClick={()=>commitConn(cNoms,cNote)}>
                    {cNoms.length>0?`Save +${CONNECT_PTS} pts ✓`:"Save (skip nominations)"}
                  </button>
                </div>
              </>)}
              {cStep===3&&(<>
                <div className="met-banner">
                  <span style={{fontSize:24}}>🤝</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:14,fontWeight:700,color:"#00e676"}}>Connected!</div>
                    <div style={{fontSize:11,color:C.muted,marginTop:2}}>
                      {conns[modal.id]?.metAt ? new Date(conns[modal.id].metAt).toLocaleDateString("en-US",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}) : ""}
                    </div>
                  </div>
                  {(modal.corporate||conns[modal.id]?.nominations?.length>0)&&
                    <div style={{fontSize:12,fontWeight:700,color:C.gold,background:"rgba(255,215,0,.1)",border:"1px solid rgba(255,215,0,.2)",borderRadius:20,padding:"3px 10px"}}>+{CONNECT_PTS} pts</div>}
                </div>
                <div style={{background:"rgba(255,215,0,.05)",border:"1px solid rgba(255,215,0,.12)",borderRadius:10,padding:"11px 13px",marginBottom:13}}>
                  <div style={{fontSize:10,letterSpacing:".1em",textTransform:"uppercase",color:C.muted,marginBottom:5}}>{cQuestion}</div>
                  <div style={{fontSize:13,color:C.text,fontStyle:"italic",lineHeight:1.6,opacity:.75}}>"{conns[modal.id]?.answer}"</div>
                </div>
                {!modal.corporate&&conns[modal.id]?.nominations?.length>0&&(
                  <div style={{marginBottom:13}}>
                    <div style={{fontSize:10,letterSpacing:".1em",textTransform:"uppercase",color:C.muted,marginBottom:7}}>Nominations given:</div>
                    {conns[modal.id].nominations.map(nid=>(
                      <span key={nid} className="nom-chip">{ALL_AWARDS.find(a=>a.id===nid)?.emoji} {ALL_AWARDS.find(a=>a.id===nid)?.label}</span>
                    ))}
                  </div>
                )}
                <button className="prim-btn" onClick={closeModal}>Close</button>
              </>)}
            </div>
          </div>
        </div>
      )}

      {/* LIGHTBOX */}
      {lightbox&&(
        <div className="lightbox" onClick={()=>setLightbox(null)}>
          <button className="lightbox-close" onClick={()=>setLightbox(null)}>✕</button>
          <img src={lightbox.url} alt={lightbox.caption||"Summit photo"} onClick={e=>e.stopPropagation()}/>
          {lightbox.caption&&<div className="lightbox-cap">{lightbox.caption}</div>}
          {lightbox.uploaderName&&<div className="lightbox-who">📍 {lightbox.uploaderName} · {lightbox.uploaderLoc}</div>}
          <div style={{display:"flex",gap:10,marginTop:16}} onClick={e=>e.stopPropagation()}>
            <button onClick={()=>downloadPhoto(lightbox.url, lightbox.caption, lightbox.uploaderName)}
              style={{flex:1,padding:"11px 16px",borderRadius:12,border:"none",background:"linear-gradient(135deg,#D4AF37,#F0D060)",color:"#0A0A0F",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:7}}>
              ⬇️ Download
            </button>
            {navigator.share&&<button onClick={()=>navigator.share({title:"B&B Summit 2026",text:lightbox.caption||"Check out this summit moment!",url:lightbox.url})}
              style={{padding:"11px 16px",borderRadius:12,border:"1px solid rgba(255,255,255,.2)",background:"rgba(255,255,255,.08)",color:"#fff",fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif",display:"flex",alignItems:"center",gap:7}}>
              📤 Share
            </button>}
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast&&(<div className="toast">🎉 {toast.msg}{toast.pts&&<span style={{background:"rgba(255,255,255,.2)",borderRadius:20,padding:"2px 9px",fontSize:12}}>{toast.pts}</span>}</div>)}
      {/* FLOATING POINTS */}
      {popup&&<div className="pfloat">+{popup} pts 🎬</div>}

      {/* ── ADMIN PANEL ── */}
      {showAdmin&&(
        <div className="admin-overlay">
          <div className="admin-hdr">
            <div>
              <div className="admin-title">🎬 Admin Panel</div>
              <div style={{fontSize:11,color:C.muted,marginTop:2}}>B&B Summit 2026 · Live Results</div>
            </div>
            <button className="admin-close" onClick={()=>setShowAdmin(false)}>✕</button>
          </div>

          {/* BANNER CONTROL */}
          <div className="admin-section">
            <div className="admin-sh">📢 Send a Banner Alert</div>
            <div style={{background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.08)",borderRadius:12,padding:"14px"}}>
              <div style={{display:"flex",gap:6,marginBottom:10,flexWrap:"wrap"}}>
                {[["warning","🚌 Bus","#FF8C00"],["urgent","🚨 Urgent","#FF4444"],["info","📢 Info","#5B8FFF"],["success","✅ Good News","#4CAF7D"]].map(([val,lbl,col])=>(
                  <button key={val} onClick={()=>setBannerType(val)}
                    style={{flex:1,minWidth:70,padding:"7px 6px",borderRadius:9,border:`1.5px solid ${bannerType===val?col:"rgba(255,255,255,.1)"}`,
                      background:bannerType===val?`${col}22`:"transparent",color:bannerType===val?col:"rgba(255,255,255,.4)",
                      fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif",transition:"all .15s"}}>
                    {lbl}
                  </button>
                ))}
              </div>
              <textarea value={bannerMsg} onChange={e=>setBannerMsg(e.target.value)}
                placeholder="Type your message… e.g. 🚌 Buses leave in 10 minutes! Meet in the lobby NOW."
                rows={3} style={{width:"100%",background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.12)",borderRadius:9,color:"#E8E8F0",fontSize:13,padding:"10px 12px",resize:"vertical",outline:"none",fontFamily:"'Plus Jakarta Sans',sans-serif",lineHeight:1.6,marginBottom:10,boxSizing:"border-box"}}/>
              <div style={{display:"flex",gap:8}}>
                <button onClick={()=>publishBanner(true)} disabled={!bannerMsg.trim()||bannerSaving}
                  style={{flex:2,padding:"11px",borderRadius:10,border:"none",background:bannerSaved?"#4CAF7D":"linear-gradient(135deg,#D4AF37,#F0D060)",color:"#0A0A0F",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif",opacity:(!bannerMsg.trim()||bannerSaving)?0.4:1,transition:"all .2s"}}>
                  {bannerSaving?"Sending…":bannerSaved?"✅ Sent!":"📣 Send to Everyone"}
                </button>
                <button onClick={()=>publishBanner(false)} disabled={bannerSaving}
                  style={{flex:1,padding:"11px",borderRadius:10,border:"1px solid rgba(255,255,255,.15)",background:"transparent",color:"rgba(255,255,255,.4)",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                  Clear Banner
                </button>
              </div>
              <div style={{fontSize:11,color:"rgba(255,255,255,.25)",marginTop:8,fontStyle:"italic"}}>Banner appears instantly on every open phone. Updates live via Firebase.</div>
            </div>
          </div>

          {/* PUSH NOTIFICATIONS */}
          <div className="admin-section">
            <div className="admin-sh">🔔 Push Notification</div>
            <div style={{background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.08)",borderRadius:12,padding:"14px"}}>
              <div style={{fontSize:12,color:"rgba(255,255,255,.4)",marginBottom:10,lineHeight:1.6}}>Sends a real device notification — appears even when the app is closed.</div>
              <textarea value={pushMsg} onChange={e=>setPushMsg(e.target.value)} placeholder="e.g. 🚌 Buses leave in 5 minutes!" rows={3}
                style={{width:"100%",background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.12)",borderRadius:9,color:"#E8E8F0",fontSize:13,padding:"10px 12px",resize:"vertical",outline:"none",fontFamily:"'Plus Jakarta Sans',sans-serif",lineHeight:1.6,marginBottom:10,boxSizing:"border-box"}}/>
              <button onClick={sendPushNotification} disabled={!pushMsg.trim()||pushSending}
                style={{width:"100%",padding:"11px",borderRadius:10,border:"none",background:pushSent?"#4CAF7D":"linear-gradient(135deg,#5B8FFF,#8BB0FF)",color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif",opacity:(!pushMsg.trim()||pushSending)?0.4:1,transition:"all .2s"}}>
                {pushSending?"Sending…":pushSent?"✅ Notification Sent!":"🔔 Send Push Notification"}
              </button>
            </div>
          </div>

          {/* PHOTO APPROVALS */}
          <div className="admin-section">
            <div className="admin-sh">📸 Photo Approvals
              {pendingPhotos.length>0&&<span style={{marginLeft:8,background:"#E63946",color:"#fff",borderRadius:20,padding:"1px 8px",fontSize:10,fontWeight:700}}>{pendingPhotos.length} pending</span>}
            </div>
            {pendingPhotos.length===0
              ? <div style={{color:C.muted,fontSize:13,fontStyle:"italic",padding:"10px 0"}}>No photos waiting for approval</div>
              : pendingPhotos.map(p=>(
                  <div className="pending-photo" key={p.id}>
                    <img src={p.url} alt="pending"/>
                    <div style={{flex:1}}>
                      <div style={{fontSize:12,fontWeight:600,color:"#E8E8F0",marginBottom:2}}>{p.uploaderName}</div>
                      <div style={{fontSize:11,color:"rgba(255,215,0,.5)",marginBottom:4}}>{p.uploaderLoc}</div>
                      {p.caption&&<div style={{fontSize:11,color:"rgba(255,255,255,.45)",fontStyle:"italic",marginBottom:8}}>"{p.caption}"</div>}
                      <div style={{display:"flex",gap:6}}>
                        <button onClick={()=>approvePhoto(p.id,true)} style={{flex:1,padding:"7px",borderRadius:8,background:"rgba(76,175,125,.2)",color:"#4CAF7D",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif",border:"1px solid rgba(76,175,125,.3)"}}>✅ Approve</button>
                        <button onClick={()=>approvePhoto(p.id,false)} style={{flex:1,padding:"7px",borderRadius:8,background:"rgba(230,57,70,.15)",color:"#E63946",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif",border:"1px solid rgba(230,57,70,.25)"}}>❌ Reject</button>
                      </div>
                    </div>
                  </div>
                ))}
          </div>

          {/* AWARD TALLIES */}
          <div className="admin-section">
            <div className="admin-sh">✨ Spotlight Awards — Vote Tallies</div>
            {!adminData
              ? <div style={{color:C.muted,fontSize:13,fontStyle:"italic"}}>Connecting to Firebase…</div>
              : (() => {
                  const tally = {};
                  ALL_AWARDS.forEach(a => { tally[a.id] = {}; });
                  Object.values(adminData).forEach(row => {
                    (row.nominations||[]).forEach(awardId => {
                      if (!tally[awardId]) tally[awardId] = {};
                      const key = row.nomineeName;
                      tally[awardId][key] = (tally[awardId][key]||0) + 1;
                    });
                  });
                  return ALL_AWARDS.map(award => {
                    const votes = tally[award.id]||{};
                    const sorted = Object.entries(votes).sort((a,b)=>b[1]-a[1]);
                    const max = sorted[0]?.[1]||1;
                    return (
                      <div key={award.id} style={{background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.07)",borderRadius:12,padding:"12px 14px",marginBottom:10}}>
                        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:sorted.length?10:0}}>
                          <span style={{fontSize:18}}>{award.emoji}</span>
                          <div style={{flex:1}}>
                            <div style={{fontSize:13,fontWeight:700,color:"#fff"}}>{award.label}</div>
                            {sorted.length===0&&<div style={{fontSize:11,color:"rgba(255,255,255,.25)",fontStyle:"italic",marginTop:2}}>No votes yet</div>}
                          </div>
                          {sorted[0]&&<div style={{fontSize:10,background:"rgba(255,215,0,.12)",color:"#D4AF37",border:"1px solid rgba(255,215,0,.2)",borderRadius:20,padding:"2px 9px"}}>{sorted.reduce((s,[,v])=>s+v,0)} votes</div>}
                        </div>
                        {sorted.slice(0,5).map(([name,count],i) => (
                          <div className="nom-row" key={name} style={i===0?{background:"rgba(255,215,0,.07)",border:"1px solid rgba(255,215,0,.15)"}:{}}>
                            <div className="nom-rank">{i===0?"🥇":i===1?"🥈":i===2?"🥉":`#${i+1}`}</div>
                            <div style={{flex:1}}>
                              <div style={{fontSize:13,fontWeight:600,color:i===0?"#D4AF37":"#E8E8F0"}}>{name}</div>
                              <div className="nom-bar-wrap"><div className="nom-bar-fill" style={{width:`${(count/max)*100}%`}}/></div>
                            </div>
                            <div style={{fontSize:15,fontWeight:700,color:i===0?"#D4AF37":"rgba(255,255,255,.5)",minWidth:20,textAlign:"right"}}>{count}</div>
                          </div>
                        ))}
                      </div>
                    );
                  });
                })()}
          </div>

          {/* LIVE LEADERBOARD */}
          <div className="admin-section">
            <div className="admin-sh">🏆 Live Points Leaderboard</div>
            {!lbData
              ? <div style={{color:C.muted,fontSize:13,fontStyle:"italic"}}>Loading scores…</div>
              : lbData.length===0
                ? <div style={{color:C.muted,fontSize:13,fontStyle:"italic"}}>No scores yet</div>
                : lbData.map((e,i) => (
                    <div className="score-row" key={i} style={i<3?{border:`1px solid ${["rgba(255,215,0,.3)","rgba(192,192,192,.2)","rgba(205,127,50,.2)"][i]}`}:{}}>
                      <div className="score-rank">{i===0?"🥇":i===1?"🥈":i===2?"🥉":`${i+1}`}</div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:13,fontWeight:600,color:i===0?"#D4AF37":"#E8E8F0"}}>{e.name}</div>
                        <div style={{fontSize:11,color:"rgba(255,255,255,.35)"}}>{e.location}</div>
                        <div style={{display:"flex",gap:5,marginTop:3}}>
                          <span className="admin-badge">🏪 {e.booths}</span><span className="admin-badge">🧠 {e.quizzes}</span><span className="admin-badge">🤝 {e.connections}</span>
                        </div>
                      </div>
                      <div style={{fontWeight:800,fontSize:22,color:i===0?"#D4AF37":"rgba(255,255,255,.7)",fontWeight:700}}>{e.pts}</div>
                    </div>
                  ))}
          </div>

          {/* NOMINATION NOTES */}
          <div className="admin-section">
            <div className="admin-sh">📋 All Nomination Notes</div>
            {!adminData||Object.values(adminData).length===0
              ? <div style={{color:C.muted,fontSize:13,fontStyle:"italic"}}>No nominations submitted yet</div>
              : Object.values(adminData)
                  .filter(r=>r.nominations?.length>0&&r.note)
                  .sort((a,b)=>(b.submittedAt?.seconds||0)-(a.submittedAt?.seconds||0))
                  .map((r,i)=>(
                    <div key={i} style={{background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.06)",borderRadius:10,padding:"10px 12px",marginBottom:6}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                        <div style={{fontSize:12,fontWeight:600,color:"#E8E8F0"}}>{r.nominatorName} → <span style={{color:"#D4AF37"}}>{r.nomineeName}</span></div>
                        <div style={{fontSize:10,color:"rgba(255,255,255,.25)"}}>{r.nominations?.map(id=>ALL_AWARDS.find(a=>a.id===id)?.emoji).join(" ")}</div>
                      </div>
                      {r.note&&<div style={{fontSize:12,color:"rgba(255,255,255,.45)",fontStyle:"italic"}}>"{r.note}"</div>}
                    </div>
                  ))}
          </div>
        </div>
      )}
    </>
  );
}

// ─── AWARD ROW COMPONENT ──────────────────────────────────────────────────────
function AwardRow({ award, selected, onToggle }) {
  return (
    <div className={`award-card${selected?" sel":""}`} onClick={()=>onToggle(award.id)}>
      <span style={{fontSize:19,flexShrink:0,width:24,textAlign:"center"}}>{award.emoji}</span>
      <div style={{flex:1}}>
        <div style={{fontSize:12,fontWeight:700,lineHeight:1.3}}>{award.label}</div>
        <div style={{fontSize:10,fontStyle:"italic",marginTop:2,opacity:.5}}>{award.desc}</div>
      </div>
      <div className={`check${selected?" sel":""}`}>{selected?"✓":""}</div>
    </div>
  );
}
