











export const CURRENT_SEMESTER = 5;

export const BRANCHES = [
{ code: "CSE", name: "Computer Science & Engineering", sections: ["A", "B"] },
{ code: "ECE", name: "Electronics & Communication", sections: ["A", "B"] },
{ code: "MECH", name: "Mechanical Engineering", sections: ["A"] }];


const COMMON_1 = [
["MA101", "Engineering Mathematics I"],
["PH102", "Engineering Physics"],
["EN103", "Technical English"],
["CS104", "Programming for Problem Solving"],
["EG105", "Engineering Graphics"]];

const COMMON_2 = [
["MA201", "Engineering Mathematics II"],
["CH202", "Engineering Chemistry"],
["EE203", "Basic Electrical Engineering"],
["CS204", "Data Structures"],
["ME205", "Engineering Mechanics"]];


const BRANCH_SUBJECTS = {
  CSE: {
    3: [
    ["CS301", "Discrete Mathematics"],
    ["CS302", "Object Oriented Programming"],
    ["CS303", "Digital Logic Design"],
    ["CS304", "Computer Organization"],
    ["CS305", "Database Management Systems"]],

    4: [
    ["CS401", "Design & Analysis of Algorithms"],
    ["CS402", "Operating Systems"],
    ["CS403", "Software Engineering"],
    ["CS404", "Theory of Computation"],
    ["CS405", "Java Programming"]],

    5: [
    ["CS501", "Computer Networks"],
    ["CS502", "Machine Learning"],
    ["CS503", "Web Technologies"],
    ["CS504", "Compiler Design"],
    ["CS505", "Cloud Computing"]]

  },
  ECE: {
    3: [
    ["EC301", "Network Theory"],
    ["EC302", "Electronic Devices & Circuits"],
    ["EC303", "Signals & Systems"],
    ["EC304", "Digital Electronics"],
    ["EC305", "Electromagnetic Fields"]],

    4: [
    ["EC401", "Analog Communication"],
    ["EC402", "Linear Integrated Circuits"],
    ["EC403", "Control Systems"],
    ["EC404", "Microprocessors"],
    ["EC405", "Transmission Lines"]],

    5: [
    ["EC501", "Digital Signal Processing"],
    ["EC502", "VLSI Design"],
    ["EC503", "Antennas & Wave Propagation"],
    ["EC504", "Embedded Systems"],
    ["EC505", "Digital Communication"]]

  },
  MECH: {
    3: [
    ["ME301", "Thermodynamics"],
    ["ME302", "Strength of Materials"],
    ["ME303", "Manufacturing Technology"],
    ["ME304", "Fluid Mechanics"],
    ["ME305", "Material Science"]],

    4: [
    ["ME401", "Theory of Machines"],
    ["ME402", "Heat Transfer"],
    ["ME403", "Machine Design"],
    ["ME404", "Applied Thermal Engineering"],
    ["ME405", "Metrology & Measurements"]],

    5: [
    ["ME501", "Dynamics of Machinery"],
    ["ME502", "Refrigeration & Air Conditioning"],
    ["ME503", "Finite Element Analysis"],
    ["ME504", "CAD / CAM"],
    ["ME505", "Industrial Engineering"]]

  }
};

export function buildSubjects() {
  const out = [];
  for (const b of BRANCHES) {
    for (const [code, name] of COMMON_1)
    out.push({ code: `${b.code}-${code}`, name, branch: b.code, semester: 1 });
    for (const [code, name] of COMMON_2)
    out.push({ code: `${b.code}-${code}`, name, branch: b.code, semester: 2 });
    for (const sem of [3, 4, 5]) {
      for (const [code, name] of BRANCH_SUBJECTS[b.code]?.[sem] ?? [])
      out.push({ code, name, branch: b.code, semester: sem });
    }
  }
  return out;
}

const MALE_NAMES = [
"Arjun Reddy", "Karthik Naidu", "Rahul Varma", "Sai Teja", "Vikram Chowdary", "Nikhil Rao",
"Aditya Sharma", "Manoj Kumar", "Rohit Yadav", "Praveen Babu", "Harsha Vardhan", "Sandeep Goud",
"Anil Prasad", "Kiran Kumar", "Tarun Sai"];

const FEMALE_NAMES = [
"Ananya Iyer", "Sneha Reddy", "Divya Prasad", "Meghana Rao", "Keerthi Suresh", "Pooja Sharma",
"Lavanya Devi", "Harika Sri", "Sushma Nair", "Bhavana Jain", "Nandini Patel", "Ritika Verma",
"Sravani Bandi", "Aishwarya M", "Tejaswini K"];


const CITIES = ["Hyderabad", "Vijayawada", "Warangal", "Guntur", "Nellore"];

function rng(seed) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648;
  };
}

export function buildStudents() {
  const students = [];
  const r = rng(42);
  let m = 0;
  let f = 0;
  const yearPrefix = "22";
  BRANCHES.forEach((b, bi) => {
    b.sections.forEach((sec, si) => {
      const count = 6;
      for (let i = 1; i <= count; i++) {
        const isMale = (i + si + bi) % 2 === 0;
        const name = isMale ?
        MALE_NAMES[m++ % MALE_NAMES.length] :
        FEMALE_NAMES[f++ % FEMALE_NAMES.length];
        const num = String(si * count + i).padStart(3, "0");
        const roll = `${yearPrefix}${b.code}${sec}${num}`;
        const photoIdx = ((bi + 1) * 17 + si * 7 + i * 3) % 90;
        students.push({
          id: roll,
          name,
          roll,
          email: `${roll.toLowerCase()}@college.edu`,
          mobile: `9${Math.floor(100000000 + r() * 899999999)}`,
          branch: b.code,
          section: sec,
          semester: CURRENT_SEMESTER,
          address: `${CITIES[Math.floor(r() * CITIES.length)] ?? "Hyderabad"}, India`,
          gender: isMale ? "male" : "female",
          photo: `https://randomuser.me/api/portraits/${isMale ? "men" : "women"}/${photoIdx}.jpg`
        });
      }
    });
  });
  return students.sort((a, b) => a.roll.localeCompare(b.roll));
}

export function buildMarks(students, subjects) {
  const r = rng(7);
  const out = [];
  for (const s of students) {
    const skill = 0.45 + r() * 0.5;
    for (const sem of [1, 2, 3, 4, 5]) {
      const subs = subjects.filter((x) => x.branch === s.branch && x.semester === sem);
      for (const sub of subs) {
        const noise = (r() - 0.5) * 0.25;
        const factor = Math.min(0.98, Math.max(0.32, skill + noise));
        const mid1 = Math.round(40 * factor);
        const mid2 = Math.round(40 * Math.min(0.99, factor + (r() - 0.4) * 0.15));
        const current = sem === CURRENT_SEMESTER;
        out.push({
          id: `${s.id}-${sub.code}`,
          studentId: s.id,
          subjectCode: sub.code,
          semester: sem,
          mid1,
          mid2: current && r() > 0.85 ? null : mid2,
          assignment: current ? r() > 0.7 ? null : Math.round(7 + r() * 3) : Math.round(7 + r() * 3),
          external: current ? null : Math.round(70 * Math.min(0.99, factor + 0.05))
        });
      }
    }
  }
  return out;
}

export const SEED_NOTICES = [
{
  id: "n1",
  title: "Mid Semester II Examinations Scheduled",
  body: "Mid Semester II exams for all branches begin from 24th of this month. Detailed timetable is published on the notice board.",
  category: "Examination",
  pinned: true,
  createdAt: new Date(Date.now() - 2 * 864e5).toISOString(),
  file: null
},
{
  id: "n2",
  title: "TCS Placement Drive - Registration Open",
  body: "Eligible pre-final year students can register for the TCS NQT drive before Friday 5 PM.",
  category: "Placement",
  pinned: true,
  createdAt: new Date(Date.now() - 4 * 864e5).toISOString(),
  file: null
},
{
  id: "n3",
  title: "Library Timings Updated",
  body: "The central library will now remain open from 8:00 AM to 9:00 PM on all working days.",
  category: "General",
  pinned: false,
  createdAt: new Date(Date.now() - 7 * 864e5).toISOString(),
  file: null
},
{
  id: "n4",
  title: "Independence Day Holiday",
  body: "The institute will remain closed on 15th August. Flag hoisting at 8:00 AM in the main ground.",
  category: "Holiday",
  pinned: false,
  createdAt: new Date(Date.now() - 11 * 864e5).toISOString(),
  file: null
}];


export const SEED_LIBRARY = [
{
  id: "l1",
  book: "Computer Networks",
  author: "Andrew S. Tanenbaum",
  subject: "Computer Networks",
  branch: "CSE",
  title: "Computer Networks - Unit Notes",
  fileName: "cn-notes.txt",
  dataUrl: textFile("Computer Networks - consolidated unit notes for Semester 5."),
  size: 1024,
  uploadedAt: new Date(Date.now() - 9 * 864e5).toISOString()
},
{
  id: "l2",
  book: "Introduction to Machine Learning",
  author: "Ethem Alpaydin",
  subject: "Machine Learning",
  branch: "CSE",
  title: "Machine Learning - Reference Material",
  fileName: "ml-material.txt",
  dataUrl: textFile("Machine Learning reference material: regression, classification, clustering."),
  size: 1024,
  uploadedAt: new Date(Date.now() - 5 * 864e5).toISOString()
},
{
  id: "l3",
  book: "VLSI Design",
  author: "Neil Weste",
  subject: "VLSI Design",
  branch: "ECE",
  title: "VLSI Design - Lecture Notes",
  fileName: "vlsi-notes.txt",
  dataUrl: textFile("VLSI Design lecture notes: CMOS logic, layout, timing."),
  size: 1024,
  uploadedAt: new Date(Date.now() - 6 * 864e5).toISOString()
},
{
  id: "l4",
  book: "Refrigeration and Air Conditioning",
  author: "C. P. Arora",
  subject: "Refrigeration & Air Conditioning",
  branch: "MECH",
  title: "RAC - Study Material",
  fileName: "rac-material.txt",
  dataUrl: textFile("Refrigeration & Air Conditioning study material."),
  size: 1024,
  uploadedAt: new Date(Date.now() - 3 * 864e5).toISOString()
}];


export const SEED_SYLLABUS = BRANCHES.map((b, i) => ({
  id: `s${i}`,
  branch: b.code,
  semester: CURRENT_SEMESTER,
  title: `${b.code} - Semester ${CURRENT_SEMESTER} Syllabus`,
  fileName: `${b.code.toLowerCase()}-sem${CURRENT_SEMESTER}-syllabus.txt`,
  dataUrl: textFile(`${b.name}\nSemester ${CURRENT_SEMESTER} syllabus - unit wise topics for all subjects.`),
  size: 2048,
  uploadedAt: new Date(Date.now() - 20 * 864e5).toISOString()
}));

export const SEED_TIMETABLE = [
{
  id: "t1",
  branch: "CSE",
  section: "A",
  semester: CURRENT_SEMESTER,
  title: "CSE A - Semester 5 Timetable",
  fileName: "cse-a-timetable.txt",
  dataUrl: textFile("CSE A Semester 5 class timetable."),
  size: 900,
  uploadedAt: new Date(Date.now() - 15 * 864e5).toISOString()
},
{
  id: "t2",
  branch: "CSE",
  section: "B",
  semester: CURRENT_SEMESTER,
  title: "CSE B - Semester 5 Timetable",
  fileName: "cse-b-timetable.txt",
  dataUrl: textFile("CSE B Semester 5 class timetable."),
  size: 900,
  uploadedAt: new Date(Date.now() - 15 * 864e5).toISOString()
}];


export const DEFAULT_ADMIN = {
  name: "Dr. Ramesh Chandra",
  email: "admin@college.edu",
  mobile: "9876543210",
  photo: "https://randomuser.me/api/portraits/men/32.jpg",
  password: "admin@123"
};

export const STUDENT_DEMO_PASSWORD = "student@123";

function textFile(content) {
  return `data:text/plain;base64,${btoa(content)}`;
}