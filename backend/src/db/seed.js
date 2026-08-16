import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';
import db, { initSchema } from './database.js';

export function seedIfEmpty() {
  initSchema();

  const count = db.prepare('SELECT COUNT(*) AS c FROM resources').get().c;
  if (count > 0) {
    console.log(`Database already seeded (${count} resources).`);
    return { seeded: false, count };
  }

  const passwordHash = bcrypt.hashSync('password123', 10);
  const adminHash = bcrypt.hashSync('admin123', 10);

  const insertUser = db.prepare(`
  INSERT INTO users (email, password_hash, full_name, role, preferred_language)
  VALUES (?, ?, ?, ?, ?)
`);

  insertUser.run('admin@carecompass.org', adminHash, 'CareCompass Admin', 'admin', 'en');
  insertUser.run('maria@example.com', passwordHash, 'Maria Lopez', 'user', 'es');
  insertUser.run('volunteer@carecompass.org', passwordHash, 'Jordan Lee', 'volunteer', 'en');

  const resources = [
  {
    name: 'Eastside Community Food Pantry',
    organization: 'Hope Harvest Collective',
    category: 'food',
    description: 'Weekly food boxes and fresh produce for households experiencing food insecurity. Walk-ins welcome; bilingual staff available.',
    eligibility: 'Open to any household in need. Photo ID preferred but not required. No income verification for emergency boxes.',
    documents_needed: 'Photo ID (preferred); proof of address if available',
    address: '2140 Manor Rd',
    city: 'Austin',
    state: 'TX',
    zip: '78722',
    latitude: 30.2849,
    longitude: -97.7093,
    phone: '(512) 555-0142',
    email: 'pantry@hopeharvest.org',
    website: 'https://example.org/hope-harvest',
    hours: 'Tue & Thu 10:00 AM – 2:00 PM; Sat 9:00 AM – 12:00 PM',
    languages: 'English, Spanish',
    source_url: 'https://example.org/hope-harvest/pantry',
  },
  {
    name: 'Capitol City Meal Delivery',
    organization: 'Meals of Mercy',
    category: 'food',
    description: 'Home-delivered nutritious meals for older adults and people with limited mobility.',
    eligibility: 'Age 60+ or disability with mobility limitation. Must live within delivery zone.',
    documents_needed: 'Proof of age or disability documentation; address confirmation',
    address: '8801 Research Blvd',
    city: 'Austin',
    state: 'TX',
    zip: '78758',
    latitude: 30.3752,
    longitude: -97.7198,
    phone: '(512) 555-0198',
    email: 'intake@mealsofmercy.org',
    website: 'https://example.org/meals-mercy',
    hours: 'Mon–Fri 8:00 AM – 4:00 PM (intake line)',
    languages: 'English, Spanish, Vietnamese',
    source_url: 'https://example.org/meals-mercy/delivery',
  },
  {
    name: 'Safe Harbor Emergency Shelter',
    organization: 'Safe Harbor Alliance',
    category: 'housing',
    description: 'Short-term emergency shelter with case management, showers, and storage for belongings.',
    eligibility: 'Adults 18+ experiencing homelessness. Families accepted in family wing.',
    documents_needed: 'Government ID if available; no documentation required for overnight emergency stay',
    address: '500 E 7th St',
    city: 'Austin',
    state: 'TX',
    zip: '78701',
    latitude: 30.2678,
    longitude: -97.7365,
    phone: '(512) 555-0110',
    email: 'intake@safeharbor.org',
    website: 'https://example.org/safe-harbor',
    hours: 'Intake 24/7; case management Mon–Fri 9:00 AM – 5:00 PM',
    languages: 'English, Spanish',
    source_url: 'https://example.org/safe-harbor/shelter',
  },
  {
    name: 'Rental Assistance Helpline',
    organization: 'Housing Stability Network',
    category: 'housing',
    description: 'One-time rental and utility assistance for households at risk of eviction. Application review within 5–10 business days.',
    eligibility: 'Income at or below 80% AMI; current lease; past-due notice or eviction filing.',
    documents_needed: 'Lease, past-due notice, ID, income proof (pay stubs or benefits letter)',
    address: '1201 W 6th St',
    city: 'Austin',
    state: 'TX',
    zip: '78703',
    latitude: 30.2711,
    longitude: -97.7582,
    phone: '(512) 555-0177',
    email: 'help@housingstability.org',
    website: 'https://example.org/housing-stability',
    hours: 'Mon–Fri 9:00 AM – 4:00 PM',
    languages: 'English, Spanish, Arabic',
    source_url: 'https://example.org/housing-stability/rental-aid',
  },
  {
    name: 'Community Health Access Clinic',
    organization: 'Open Door Health',
    category: 'healthcare',
    description: 'Primary care, dental screenings, and behavioral health referrals on a sliding fee scale.',
    eligibility: 'Uninsured and underinsured residents. Insurance accepted when available.',
    documents_needed: 'Photo ID; proof of income for sliding scale; insurance card if any',
    address: '1701 Toomey Rd',
    city: 'Austin',
    state: 'TX',
    zip: '78704',
    latitude: 30.2505,
    longitude: -97.7661,
    phone: '(512) 555-0133',
    email: 'appointments@opendoor.health',
    website: 'https://example.org/open-door',
    hours: 'Mon–Fri 8:00 AM – 6:00 PM; Sat 9:00 AM – 1:00 PM',
    languages: 'English, Spanish',
    source_url: 'https://example.org/open-door/clinic',
  },
  {
    name: 'Mental Health Crisis Warmline',
    organization: 'Mindful Bridges',
    category: 'healthcare',
    description: 'Non-emergency emotional support and local mental health referrals. Not a substitute for 911 or 988.',
    eligibility: 'Anyone seeking emotional support or navigation help.',
    documents_needed: 'None',
    address: 'Remote / phone-based',
    city: 'Austin',
    state: 'TX',
    zip: '78701',
    latitude: 30.2672,
    longitude: -97.7431,
    phone: '(512) 555-0988',
    email: 'warmline@mindfulbridges.org',
    website: 'https://example.org/mindful-bridges',
    hours: 'Daily 8:00 AM – 10:00 PM',
    languages: 'English, Spanish',
    source_url: 'https://example.org/mindful-bridges/warmline',
  },
  {
    name: 'Job Ready Career Center',
    organization: 'Workforce Forward',
    category: 'employment',
    description: 'Resume help, interview coaching, job board access, and connections to training programs.',
    eligibility: 'Job seekers 16+. Priority for recently unemployed and underemployed adults.',
    documents_needed: 'Resume if available; work authorization documents for placement programs',
    address: '9001 N IH-35',
    city: 'Austin',
    state: 'TX',
    zip: '78753',
    latitude: 30.3521,
    longitude: -97.6984,
    phone: '(512) 555-0155',
    email: 'careers@workforceforward.org',
    website: 'https://example.org/workforce-forward',
    hours: 'Mon–Thu 9:00 AM – 5:00 PM; Fri 9:00 AM – 2:00 PM',
    languages: 'English, Spanish',
    source_url: 'https://example.org/workforce-forward/job-ready',
  },
  {
    name: 'Skills Bridge Training Grants',
    organization: 'Workforce Forward',
    category: 'employment',
    description: 'Short-term certificate training support for high-demand fields such as healthcare support and IT help desk.',
    eligibility: 'Adults 18+ meeting income guidelines; commitment to complete program.',
    documents_needed: 'ID, income verification, high school diploma or GED if available',
    address: '9001 N IH-35',
    city: 'Austin',
    state: 'TX',
    zip: '78753',
    latitude: 30.3521,
    longitude: -97.6984,
    phone: '(512) 555-0156',
    email: 'training@workforceforward.org',
    website: 'https://example.org/workforce-forward/skills',
    hours: 'Mon–Fri 9:00 AM – 4:00 PM',
    languages: 'English, Spanish',
    source_url: 'https://example.org/workforce-forward/skills-bridge',
  },
  {
    name: 'Metro Access Reduced Fare Program',
    organization: 'Capital Transit Access',
    category: 'transportation',
    description: 'Reduced-fare transit cards for qualifying riders and ADA paratransit eligibility assessments.',
    eligibility: 'Low-income riders, seniors 65+, and riders with qualifying disabilities.',
    documents_needed: 'Photo ID; income or disability documentation depending on program',
    address: '2910 E 5th St',
    city: 'Austin',
    state: 'TX',
    zip: '78702',
    latitude: 30.2601,
    longitude: -97.7158,
    phone: '(512) 555-0121',
    email: 'access@captransit.example',
    website: 'https://example.org/captransit/access',
    hours: 'Mon–Fri 8:00 AM – 5:00 PM',
    languages: 'English, Spanish',
    source_url: 'https://example.org/captransit/reduced-fare',
  },
  {
    name: 'Adult Education & ESL Hub',
    organization: 'Literacy Rising',
    category: 'education',
    description: 'Free GED prep, ESL classes, digital literacy workshops, and citizenship study groups.',
    eligibility: 'Adults 16+ not currently enrolled in high school. Open registration each term.',
    documents_needed: 'Photo ID preferred; no immigration status required for ESL/GED',
    address: '2200 E Martin Luther King Jr Blvd',
    city: 'Austin',
    state: 'TX',
    zip: '78702',
    latitude: 30.2804,
    longitude: -97.7172,
    phone: '(512) 555-0164',
    email: 'learn@literacyrising.org',
    website: 'https://example.org/literacy-rising',
    hours: 'Mon–Thu 9:00 AM – 8:00 PM; Sat 10:00 AM – 2:00 PM',
    languages: 'English, Spanish, Mandarin',
    source_url: 'https://example.org/literacy-rising/programs',
  },
  {
    name: 'Immigration Legal Clinic',
    organization: 'Justice Pathways',
    category: 'legal',
    description: 'Low-cost and pro bono consultations for immigration forms, family petitions, and know-your-rights workshops.',
    eligibility: 'Income-eligible individuals and families. Screening required before full representation.',
    documents_needed: 'Any immigration paperwork you have; photo ID; household income info',
    address: '1403 E 6th St',
    city: 'Austin',
    state: 'TX',
    zip: '78702',
    latitude: 30.2635,
    longitude: -97.7291,
    phone: '(512) 555-0182',
    email: 'clinic@justicepathways.org',
    website: 'https://example.org/justice-pathways',
    hours: 'Clinic hours Wed 1:00 PM – 6:00 PM (appointment preferred)',
    languages: 'English, Spanish, Arabic',
    source_url: 'https://example.org/justice-pathways/immigration',
  },
  {
    name: 'Disability Rights Helpline',
    organization: 'Access & Equity Center',
    category: 'legal',
    description: 'Guidance on disability accommodations, benefits appeals, and discrimination concerns.',
    eligibility: 'People with disabilities and caregivers seeking civil rights navigation.',
    documents_needed: 'Any denial letters or accommodation requests related to your issue',
    address: '402 W 8th St',
    city: 'Austin',
    state: 'TX',
    zip: '78701',
    latitude: 30.2702,
    longitude: -97.7456,
    phone: '(512) 555-0148',
    email: 'rights@accessequity.org',
    website: 'https://example.org/access-equity',
    hours: 'Mon–Fri 9:00 AM – 4:00 PM',
    languages: 'English, Spanish, ASL (by appointment)',
    source_url: 'https://example.org/access-equity/helpline',
  },
];

  const insertResource = db.prepare(`
  INSERT INTO resources (
    name, organization, category, description, eligibility, documents_needed,
    address, city, state, zip, latitude, longitude, phone, email, website,
    hours, languages, source_url, last_verified_at, created_by
  ) VALUES (
    @name, @organization, @category, @description, @eligibility, @documents_needed,
    @address, @city, @state, @zip, @latitude, @longitude, @phone, @email, @website,
    @hours, @languages, @source_url, datetime('now', '-' || abs(random() % 40) || ' days'), 1
  )
`);

  const tx = db.transaction((rows) => {
    for (const row of rows) insertResource.run(row);
  });

  tx(resources);
  console.log(`Seeded ${resources.length} resources and 3 demo users.`);
  console.log('Demo logins:');
  console.log('  admin@carecompass.org / admin123');
  console.log('  maria@example.com / password123');
  return { seeded: true, count: resources.length };
}

const isDirectRun =
  process.argv[1] &&
  path.resolve(fileURLToPath(import.meta.url)) === path.resolve(process.argv[1]);

if (isDirectRun) {
  seedIfEmpty();
}
