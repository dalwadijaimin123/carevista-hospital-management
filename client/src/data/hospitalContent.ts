import {
  CalendarDays,
  FileText,
  HeartPulse,
  Pill,
  Stethoscope,
  Users,
  Brain,
  Bone,
  Baby,
  type LucideIcon,
} from "lucide-react";

export type HospitalContent = {
  slug: string;
  title: string;
  short: string;
  overview: string;
  highlights: string[];
  idealFor: string[];
  process: string[];
  note: string;
  icon: LucideIcon;
};

export const services: HospitalContent[] = [
  {
    slug: "appointments",
    title: "Appointment Management",
    short: "Request and keep track of hospital visits in one convenient place.",
    overview: "CareVista helps patients and hospital teams keep appointment information organised, from choosing a department and consultation type to reviewing the visit details. The goal is to make the administrative steps around a visit easier to understand.",
    highlights: ["Review appointment date, time and department details", "Capture contact information and visit notes", "Keep appointment information organised for authorised staff", "Support follow-up and general check-up appointment types"],
    idealFor: ["Patients planning a consultation", "People arranging a follow-up visit", "Hospital staff coordinating the appointment schedule"],
    process: ["Choose the relevant department and appointment type", "Provide accurate contact details and preferred visit information", "Review the submitted details and keep any confirmation provided by the hospital", "Contact the hospital directly if the date needs to change or symptoms become urgent"],
    note: "Submitting an online appointment request does not by itself confirm a booking or replace emergency care. Follow the confirmation instructions provided by the hospital.",
    icon: CalendarDays,
  },
  {
    slug: "specialist-consultations",
    title: "Specialist Consultations",
    short: "Explore clinical departments and understand where to start.",
    overview: "The service directory introduces the departments available in CareVista and explains the types of concerns each department commonly assesses. It helps visitors prepare for a conversation with the hospital and identify the most relevant department to contact.",
    highlights: ["Browse department summaries and areas of focus", "Learn what information may be useful for a first visit", "Find related hospital services", "Use department information to prepare questions for a clinician"],
    idealFor: ["Patients who have been advised to see a specialist", "Families comparing the listed departments", "Visitors who want to prepare before contacting the hospital"],
    process: ["Read the department overview", "If unsure, begin with General Medicine or contact the hospital for guidance", "Bring current medicines, relevant reports and a list of questions", "Follow the clinician's advice about tests, treatment and follow-up"],
    note: "Department descriptions are general information, not a diagnosis. A qualified healthcare professional can advise which service is appropriate for an individual situation.",
    icon: Stethoscope,
  },
  {
    slug: "pharmacy",
    title: "Pharmacy & Medication Support",
    short: "Make medication and stock information easier for authorised teams to manage.",
    overview: "CareVista includes pharmacy and inventory tools that help authorised hospital staff keep medicine-related stock records visible. Clear stock information can support internal planning and reduce the effort involved in reviewing frequently used items.",
    highlights: ["View inventory item names and categories", "Track quantities and reorder levels", "Identify low-stock or out-of-stock items", "Keep medication inventory information centralised for staff"],
    idealFor: ["Authorised pharmacy and inventory staff", "Hospital administrators overseeing stock", "Teams reviewing reorder requirements"],
    process: ["Authorised staff review the current item and quantity records", "Compare quantities with each item's reorder level", "Confirm actual stock physically and follow hospital purchasing procedures", "Keep records updated after approved stock movements"],
    note: "Inventory figures are operational records and should be verified by authorised staff. Patients should use medicines only as directed by a qualified clinician or pharmacist.",
    icon: Pill,
  },
  {
    slug: "patient-records",
    title: "Patient Records",
    short: "Keep essential patient and visit information organised with controlled access.",
    overview: "The management system gives authorised hospital administrators an organised view of patient-related operational information. Role-based access helps keep administrative records separate from the normal patient account experience.",
    highlights: ["Organised patient identity and department information", "Search support for authorised staff", "Related appointment information in the management workflow", "Server-side access checks for administrator functions"],
    idealFor: ["Authorised hospital administrators", "Staff who need to locate relevant patient records", "Teams maintaining consistent operational information"],
    process: ["Sign in using an authorised account", "Search for the relevant record using permitted details", "Review only the information required for the assigned task", "Follow hospital privacy and record-correction procedures"],
    note: "Access is intended for authorised personnel only. Do not share credentials or enter sensitive patient details on a shared or public device.",
    icon: FileText,
  },
  {
    slug: "patient-portal",
    title: "Patient Portal",
    short: "Access the normal-user area with a registered account.",
    overview: "The patient-facing account experience provides a dedicated entry point for registered users. Patients can sign in separately from administrators and use the patient features available in the deployed version of CareVista.",
    highlights: ["Register a normal user account", "Sign in using registered email and password", "Use the dedicated user area rather than the admin console", "Recover a forgotten password using an email OTP"],
    idealFor: ["New patients creating an account", "Registered users returning to the portal", "Users who need to reset a forgotten password"],
    process: ["Create an account with a valid email address", "Sign in using your registered credentials", "Use the Forgot password option if you cannot remember your password", "Keep your email account and sign-in details secure"],
    note: "Password reset requires the hospital application to be configured with an email delivery provider. Never share a verification code with anyone.",
    icon: Users,
  },
  {
    slug: "care-coordination",
    title: "Care Coordination",
    short: "Bring service, appointment and department information into a clearer workflow.",
    overview: "Care coordination within CareVista focuses on keeping common hospital workflows easier to navigate. The public pages introduce services and departments, while authorised teams can use the management dashboard for the operational information available to their role.",
    highlights: ["A consistent way to discover services and departments", "Appointment and department information in one workflow", "Separate experiences for patients and administrators", "Clear signposting for contact and next steps"],
    idealFor: ["Patients learning how to navigate hospital services", "Families preparing for a visit", "Hospital teams seeking a consistent operational overview"],
    process: ["Start with the relevant service or department page", "Use the contact or appointment workflow when appropriate", "Keep visit information and reports ready for the clinical team", "Ask hospital staff to clarify any next steps"],
    note: "CareVista supports information and administrative workflows; clinical decisions remain with qualified healthcare professionals.",
    icon: HeartPulse,
  },
];

export const departments: HospitalContent[] = [
  {
    slug: "cardiology",
    title: "Cardiology",
    short: "Heart and cardiovascular consultations.",
    overview: "Cardiology focuses on the heart and circulatory system. A clinician may assess symptoms, personal and family history, risk factors and previous test results to decide whether further evaluation or ongoing care is needed.",
    highlights: ["Assessment of heart-related symptoms and risk factors", "Review of blood pressure, cholesterol and relevant history", "Discussion of diagnostic tests when clinically indicated", "Follow-up planning and prevention guidance from the care team"],
    idealFor: ["People referred for a heart-related assessment", "Patients who need follow-up for a known cardiovascular condition", "People seeking professional advice about cardiovascular risk"],
    process: ["Bring prior reports and a list of current medicines", "Describe symptoms, when they started and what changes them", "Share relevant medical and family history", "Follow the clinician's plan for tests, treatment or follow-up"],
    note: "Severe chest pain, serious breathing difficulty, fainting or other possible emergency symptoms need immediate emergency medical care rather than an online request.",
    icon: HeartPulse,
  },
  {
    slug: "neurology",
    title: "Neurology",
    short: "Assessment of the brain, spinal cord, nerves and related conditions.",
    overview: "Neurology deals with conditions affecting the nervous system. A neurologist may review symptoms such as recurring headaches, changes in sensation, tremor, balance concerns or seizure history and decide what evaluation is appropriate.",
    highlights: ["Neurological history and symptom assessment", "Review of coordination, sensation and movement concerns", "Discussion of previous scans or test reports", "Care planning and follow-up for nervous-system conditions"],
    idealFor: ["Patients referred for neurological evaluation", "People with persistent or recurring neurological symptoms", "Patients returning for a planned follow-up"],
    process: ["Bring previous imaging and test reports if available", "Write down the timing and pattern of symptoms", "List current medicines and known allergies", "Ask the clinician which symptoms should prompt urgent care"],
    note: "Sudden weakness, facial droop, difficulty speaking, a new seizure or a sudden severe headache can be an emergency. Seek emergency care immediately.",
    icon: Brain,
  },
  {
    slug: "pediatrics",
    title: "Pediatrics",
    short: "Healthcare visits focused on infants, children and adolescents.",
    overview: "Pediatrics focuses on children's health, growth and development. The care team can discuss routine concerns, childhood illness, preventive care and guidance appropriate to a child's age and health history.",
    highlights: ["Age-appropriate health assessment", "Growth, development and nutrition discussions", "Advice about preventive visits and immunisation schedules", "Support for parents and caregivers with follow-up instructions"],
    idealFor: ["Parents arranging a child's consultation", "Families with questions about growth or development", "Children needing follow-up after a previous visit"],
    process: ["Bring the child's health and immunisation records if available", "Describe symptoms, duration and any changes in eating or activity", "Share allergies and medicines the child takes", "Confirm home-care advice, warning signs and follow-up plans"],
    note: "For a child who is struggling to breathe, is unusually difficult to wake, has a severe allergic reaction or appears seriously unwell, seek emergency care.",
    icon: Baby,
  },
  {
    slug: "orthopedics",
    title: "Orthopedics",
    short: "Care for bones, joints, muscles, ligaments and mobility concerns.",
    overview: "Orthopedics addresses the musculoskeletal system, including injuries and problems that affect movement. Evaluation may include a discussion of the injury or symptoms, a physical examination and review of imaging when needed.",
    highlights: ["Assessment of joint, bone and movement concerns", "Review of injury history and functional limitations", "Discussion of imaging or rehabilitation where appropriate", "Follow-up guidance based on the clinician's assessment"],
    idealFor: ["Patients referred for a bone or joint assessment", "People with ongoing mobility concerns", "Patients attending a follow-up after an injury or procedure"],
    process: ["Bring prior X-rays, scans or treatment notes if available", "Explain when the problem began and what affects movement", "Share prior injuries, surgeries and current medicines", "Follow advice about activity, rehabilitation and review appointments"],
    note: "A serious injury, uncontrolled bleeding, visible deformity or loss of circulation or sensation after an injury needs urgent medical assessment.",
    icon: Bone,
  },
  {
    slug: "general-medicine",
    title: "General Medicine",
    short: "A starting point for common health concerns and coordinated adult care.",
    overview: "General Medicine supports assessment of a wide range of adult health concerns and helps coordinate ongoing care. A clinician reviews symptoms, medical history and current medicines before recommending appropriate next steps or referral.",
    highlights: ["Initial assessment of common health concerns", "Review of medical history and current medications", "Preventive-health and routine check-up discussions", "Referral to a specialist when indicated"],
    idealFor: ["People unsure which department they need", "Patients seeking a routine health check", "Adults managing several ongoing health concerns"],
    process: ["Describe your main concern and how long it has been present", "Bring current medicine details and previous reports", "Mention allergies and important past conditions", "Ask for a clear plan covering treatment, tests and follow-up"],
    note: "Online department information cannot determine the cause of symptoms. Serious or rapidly worsening symptoms should be assessed urgently.",
    icon: Stethoscope,
  },
  {
    slug: "pharmacy",
    title: "Pharmacy",
    short: "Medication dispensing guidance and hospital medicine inventory support.",
    overview: "The pharmacy service helps patients obtain medicine-related guidance from qualified pharmacy professionals and supports the hospital's internal inventory workflow. The specific dispensing and stock processes follow the hospital's own policies.",
    highlights: ["Medication-use questions for a qualified pharmacist", "Clarification of prescription instructions", "Internal stock and reorder-level tracking for authorised staff", "Medication safety reminders and referral back to the prescriber when needed"],
    idealFor: ["Patients with questions about an existing prescription", "People who need clarification from a pharmacist", "Authorised staff maintaining hospital stock records"],
    process: ["Keep the prescription and medicine packaging available", "Tell the pharmacist about allergies and other medicines", "Confirm dose, timing, storage and any missed-dose instructions with the professional", "Contact the prescriber before making changes to prescribed treatment"],
    note: "CareVista does not replace a pharmacist or prescriber. Do not start, stop or change a prescribed medicine solely on the basis of website information.",
    icon: Pill,
  },
];
