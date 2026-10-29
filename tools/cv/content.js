// Single source for the résumé (one page, targeted) and the CV (full record).
// Every fact here comes from the portfolio (index.html) or the project's own repo. Nothing is inferred.

const contact = [
  "Las Piñas City, Philippines",
  "garciatheodoreiii715@gmail.com",
  "linkedin.com/in/theodore-garcia-179b24333",
  "github.com/theoithinkk",
  "theoithinkk.github.io/TheoPortfolio",
];

const dlsu = {
  org: "De La Salle University", where: "Manila, Philippines",
  role: "Bachelor of Science in Computer Science, major in Network and Information Security", when: "2024 – 2028 (expected)",
  bullets: [
    "Dean's Lister, Terms 1–6 (every term to date)",
    "DOST Merit Scholar, Department of Science and Technology undergraduate scholarship",
  ],
};
const seton = {
  org: "Elizabeth Seton School", where: "Las Piñas City, Philippines",
  role: "Senior High School, Science, Technology, Engineering and Mathematics (STEM) strand", when: "",
  bullets: ["Ranked in the top 20% of the STEM batch; Excellence Award (With Honors) and Annual Excellence Award (With Honors)"],
};

const certs = "ISC2 Certified in Cybersecurity (CC); AWS Certified Cloud Practitioner; AWS Certified AI Practitioner";

const darkhole = {
  org: "DarkHole V2 Penetration Test", where: "Team project",
  role: "Vulnerability Assessment and Penetration Testing (Nmap, Nessus, Burp Suite, sqlmap)", when: "Jul – Aug 2026",
  bullets: [
    "Performed a black-box internal test of a Linux host and its PHP web application under a defined scope and rules of engagement.",
    "Validated scanner output by hand and chained five weaknesses (exposed .git repository, hardcoded credentials, SQL injection, cron command injection, password reuse with sudo) into full root access.",
    "Co-authored a 39-page findings report: 13 findings (2 Critical, 5 High) with CVSS 3.1 vectors and prioritized remediation.",
  ],
};
const auditbridge = {
  org: "AuditBridge, Compliance Mapping and Risk Register Engine", where: "Personal project",
  role: "Python", when: "In progress",
  bullets: [
    "Collects findings from CIS configuration checks, Nmap service scans and read-only web checks in a lab, with severity and evidence.",
    "Maps each finding to ISO/IEC 27001, NIST SP 800-53, PCI DSS, SOC 2, OWASP and CIS controls, with the rationale documented.",
    "Scores risk on an explainable 5×5 likelihood and impact scale; exports risk registers (CSV/XLSX), compliance report cards and an HTML heat map.",
  ],
};
const galicious = {
  org: "Galicious Secret Scanner", where: "Team project",
  role: "Python, Flask, SARIF 2.1.0", when: "",
  bullets: [
    "Co-developed a scanner that finds leaked credentials in folders and GitHub repositories, including secrets deleted from the latest commit but still in Git history.",
    "Combines regex signatures with a Shannon-entropy check and an opt-in validity test against AWS STS, GitHub, Stripe and Slack; every output is redacted.",
    "Tested against VulnRepo, a purpose-built repository with history-only secrets and decoys that must not be flagged.",
  ],
};
const pablings = {
  org: "Pablings Payroll", where: "Client project",
  role: "Electron, SheetJS", when: "",
  bullets: [
    "Built a local-first Windows payroll app for a working barbershop that turns the weekly Google Sheet export into commissions, allowances, late deductions and net pay, then exports payslips in the shop's layout.",
    "Kept employee pay data on the owner's machine, with no cloud service and no database.",
  ],
};
const pinoyflex = {
  org: "PinoyFlex", where: "Team project",
  role: "React, Vite, Node.js, Express, MongoDB Atlas", when: "2026",
  bullets: [
    "Full-stack fitness community app built by a five-person team: posts, comments, follows, workout logs, badges, notifications and user reports with admin moderation; deployed on Render.",
    "Security: bcrypt password hashing; httpOnly, SameSite and production-only Secure session cookies; role-based access control with suspended accounts; rate limiting on login and the API; generic login errors that don't reveal which usernames exist.",
  ],
};
const sinag = {
  org: "Project Sinag, Filipino Sunshine Powerhouse Realty", where: "Client project",
  role: "TypeScript, Node.js, Express, MySQL, React, Tailwind CSS", when: "Oct 2026 – present",
  bullets: [
    "Building, with a seven-person Scrum team, a web app replacing a brokerage's Excel files: listings, inquiries, viewings, referrals, commissions.",
    "Set up the architecture, MySQL migrations, CI (111 API tests per pull request) and the Scrum process; wrote the log-in, role checks, audit log, event bus and consent modules.",
    "Security: bcrypt; HttpOnly, SameSite, HTTPS-only session cookies with a 30-minute idle timeout and a new ID at log-in; a lockout after 5 failures that treats unknown e-mails the same, so no response reveals which accounts exist.",
    "Data Privacy Act (RA 10173): versioned privacy notices, consent saved in the same transaction as each form, anonymizing withdrawal, and e-mails kept only as SHA-256 fingerprints in events and audit logs.",
  ],
};
const promptathon = {
  org: "Prompt-a-thon Practice App", where: "Personal project",
  role: "Node.js, Express, Claude API", when: "",
  bullets: [
    "Built a starter app for the LSCS Prompt-a-thon that streams Claude API replies to a chat UI with a live-editable system prompt.",
    "Added a mock mode that runs without an API key, and kept keys in an ignored .env file.",
  ],
};
const voip = {
  org: "VoIP over SIP/RTP", where: "Course project",
  role: "Java, UDP", when: "",
  bullets: [
    "Built a Java voice-call client: SIP/SDP signaling over UDP, RTP audio and RTCP sender reports every 5 seconds.",
    "Supported file, one-way and two-way call modes with clean teardown between calls.",
  ],
};
const catbot = {
  org: "CatBot", where: "Course project",
  role: "Python, reinforcement learning", when: "",
  bullets: ["Built a tabular Q-learning agent that catches cats with different movement styles on an 8×8 grid, evaluated over 20 games against 5 graded cats plus unseen behaviors."],
};
const uipath = {
  org: "UiPath Automation", where: "Personal project",
  role: "Robotic process automation, UiPath Studio", when: "",
  bullets: ["Built an automation workflow in UiPath Studio, with a recorded demo of it running."],
};

const k17 = {
  org: "K17 CTF 2026, UNSW Security Society", where: "Online",
  role: "Team SlayTheFlagII: 152nd of 682 teams (top 23%)", when: "Sep 2026",
  bullets: ["Solved cryptography, digital forensics, reverse engineering, web exploitation, OSINT and miscellaneous challenges."],
};
const isoctf = {
  org: "ISO 2026 CTF: Uncharted Knowledge, Information Security Organization, DLSU", where: "Manila, Philippines",
  role: "2nd place", when: "2026",
  bullets: ["Solved cryptography, OS and Linux, digital forensics, web, metadata analysis, OSINT and steganography challenges."],
};
const packet = {
  org: "Packet Capture CTF", where: "",
  role: "16 step-by-step writeups: OSINT, web exploitation, digital and network forensics, steganography (github.com/theoithinkk/CTFwriteups)", when: "",
  bullets: [],
};

const lscs = {
  org: "La Salle Computer Society", where: "Manila, Philippines",
  role: "Associate Vice President for Academics", when: "Sep 2025 – Sep 2026",
  bullets: [
    "Directed pre-event operations for 10+ academic events: technical talks, exam reviews, publications and coding competitions.",
    "Coordinated scheduling, documentation and stakeholder communication with faculty and partner departments.",
  ],
  sub: { role: "Junior Officer, Research and Development", when: "Oct 2024 – Sep 2025",
         bullets: ["Helped plan and run the Research and Development committee's events."] },
};
const sprint = {
  org: "DLSU SPRINT", where: "Manila, Philippines",
  role: "Associate Vice President for Human Resource Development", when: "Sep 2025 – Sep 2026",
  bullets: ["Led member engagement for 30+ members of an invite-only leadership organization through 3+ team-building and development initiatives."],
};
const csg = {
  org: "Computer Studies Government, De La Salle University", where: "Manila, Philippines",
  role: "Executive for Internal Relations", when: "Sep 2024 – Oct 2025",
  bullets: ["Point of contact between the student government, 10+ student organizations and the Dean's Office; ran internal communications."],
};
const acm = {
  org: "DLSU ACM Student Chapter", where: "Manila, Philippines",
  role: "Associate for Activities", when: "Oct 2024 – Oct 2025",
  bullets: ["Ran the chapter's general assemblies and lab orientations for members."],
};

const skills = {
  grc: "ISO/IEC 27001, NIST SP 800-53, CIS Benchmarks, PCI DSS, SOC 2, RA 10173 (Data Privacy Act), 5×5 risk scoring, risk registers, control mapping, policy and SOP drafting",
  cloud: "AWS core services, AWS IAM, shared responsibility model, GitHub Actions, Claude API",
  offsec: "Burp Suite, Nmap (NSE), Nessus, sqlmap, Nikto, Kali Linux, OWASP Top 10, CVSS 3.1",
  code: "Python, JavaScript, Java, C, SQL, PHP, Rust, Bash, HTML, CSS",
  tools: "Linux, Git, GitHub, Flask, Node.js, Express, Electron, Google Apps Script, Microsoft 365, Excel",
};

module.exports = {
  resume: {
    file: "Theodore-Garcia-Resume",
    name: "Theodore Garcia", contact,
    sections: [
      { title: "Education", entries: [dlsu] },
      { title: "Certifications", lines: [["Certified", `${certs}. In progress: CompTIA Security+`]] },
      // One page: the same facts as the CV, fewer bullets. Galicious and Pablings are in the CV only.
      { title: "Projects", entries: [
        { ...darkhole, bullets: [darkhole.bullets[0],
          "Validated scanner output by hand and chained five weaknesses (exposed .git, hardcoded credentials, SQL injection, cron command injection, sudo via password reuse) into root.",
          darkhole.bullets[2]] },
        { ...auditbridge, bullets: [
          "Maps findings from CIS configuration checks, Nmap scans and read-only web checks to ISO/IEC 27001, NIST SP 800-53, PCI DSS, SOC 2, OWASP and CIS controls, with the rationale documented.",
          "Scores risk on an explainable 5×5 likelihood and impact scale; exports risk registers (CSV/XLSX), compliance report cards and an HTML heat map.",
        ] },
        { ...sinag, bullets: ["Real-estate brokerage app with a seven-person Scrum team; set up the architecture and CI, and built log-in with a lockout that hides which accounts exist, hardened sessions, audit logging and RA 10173 consent."] },
        { ...pinoyflex, bullets: ["Five-person full-stack fitness community app; secured with bcrypt hashing, hardened session cookies, role-based access control, rate limiting and non-enumerating login errors."] },
      ] },
      { title: "Competitions", lines: [
        ["K17 CTF 2026, UNSW Security Society (Sep 2026)", "152nd of 682 teams (top 23%) with Team SlayTheFlagII"],
        ["ISO 2026 CTF: Uncharted Knowledge, DLSU (2026)", "2nd place; 16 published CTF writeups at github.com/theoithinkk/CTFwriteups"],
      ] },
      { title: "Leadership Experience", entries: [
        { ...lscs, sub: undefined, role: "Associate Vice President for Academics (promoted from Junior Officer, Oct 2024)", when: "Oct 2024 – Sep 2026",
          bullets: ["Directed pre-event operations for 10+ academic events and coordinated scheduling, documentation and stakeholder communication with faculty and partner departments."] },
        csg] },   // DLSU SPRINT and ACM are in the CV
      { title: "Skills", lines: [["GRC", "ISO/IEC 27001, NIST SP 800-53, CIS, PCI DSS, SOC 2, RA 10173, risk registers, 5×5 risk scoring, control mapping"], ["Cloud", skills.cloud], ["Security tools", skills.offsec], ["Programming", skills.code]] },
    ],
  },
  cv: {
    file: "Theodore-Garcia-CV",
    name: "Theodore Garcia", contact,
    sections: [
      { title: "Education", entries: [dlsu, seton] },
      { title: "Certifications", lines: [
        ["Certified", certs],
        ["Skill badges", "IBM SkillsBuild: GRC and Data Privacy; Vulnerability Management; System and Network Security; Cloud Security"],
        ["Working toward", "CompTIA Security+; AWS Certified Security Specialty; ISO/IEC 27001 Lead Auditor or Lead Implementer (PECB); ISACA CISA or CRISC"],
      ] },
      { title: "Projects", entries: [darkhole, auditbridge, sinag, galicious, pinoyflex, pablings, promptathon, voip, catbot, uipath] },
      { title: "Competitions and Writeups", entries: [k17, isoctf, packet] },
      { title: "Leadership Experience", entries: [lscs, sprint, csg, acm] },
      { title: "Research", lines: [
        ["Senior high research", "Outstanding Research Award, Elizabeth Seton School; oral presenter, PAREF Southridge Research Congress"],
      ] },
      { title: "Skills", lines: [["GRC and privacy", skills.grc], ["Cloud and AI", skills.cloud], ["Offensive security", skills.offsec], ["Languages", skills.code], ["Tools and frameworks", skills.tools]] },
    ],
  },
};
