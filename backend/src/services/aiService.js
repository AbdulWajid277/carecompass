import db from '../db/database.js';
import { retrieveForAi } from './searchService.js';

const DISCLAIMER =
  'CareCompass does not determine eligibility. Please confirm details directly with each organization before visiting or applying.';

function buildRetrievalAnswer(question, resources, language = 'en') {
  if (!resources.length) {
    return {
      answer:
        language === 'es'
          ? `No encontré recursos verificados que coincidan con su pregunta. Intente otra categoría (comida, vivienda, salud, empleo, transporte, educación o legal) o hable con un voluntario comunitario. ${DISCLAIMER}`
          : `I could not find verified resources that match your question. Try another category (food, housing, healthcare, employment, transportation, education, or legal), or ask a community volunteer for help. ${DISCLAIMER}`,
      resources: [],
      mode: 'retrieval',
    };
  }

  const lines = resources.map((r, i) => {
    const nextSteps = [
      r.phone ? `Call ${r.phone}` : null,
      r.hours ? `Hours: ${r.hours}` : null,
      r.documentsNeeded ? `Bring if possible: ${r.documentsNeeded}` : null,
      `Source last verified: ${r.lastVerifiedAt?.slice(0, 10) || 'unknown'}`,
    ]
      .filter(Boolean)
      .join('. ');

    return `${i + 1}. ${r.name} (${r.organization}) — ${r.city}, ${r.state}. ${r.description} Eligibility notes: ${r.eligibility || 'Contact organization'}. Next steps: ${nextSteps}. Source: ${r.sourceUrl || 'local CareCompass record'}.`;
  });

  const intro =
    language === 'es'
      ? `Según los registros verificados en CareCompass, estas opciones pueden ayudar con: "${question}".`
      : `Based on verified CareCompass records, these options may help with: "${question}".`;

  return {
    answer: `${intro}\n\n${lines.join('\n\n')}\n\n${DISCLAIMER}`,
    resources,
    mode: 'retrieval',
  };
}

async function callOpenAI(question, resources, language) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const context = resources
    .map(
      (r) =>
        `ID:${r.id} | ${r.name} | ${r.organization} | ${r.category} | ${r.city}, ${r.state} | ${r.description} | Eligibility: ${r.eligibility} | Docs: ${r.documentsNeeded} | Hours: ${r.hours} | Phone: ${r.phone} | Languages: ${r.languages} | Source: ${r.sourceUrl} | Verified: ${r.lastVerifiedAt}`
    )
    .join('\n');

  const system = `You are CareCompass, a careful community resource navigator assistant.
Rules:
- Only use the provided verified resource records. Do not invent programs, phone numbers, hours, or eligibility rules.
- If information is missing, say so and tell the user to confirm with the organization.
- Never decide final eligibility.
- Keep language clear and accessible (short sentences).
- Respond in ${language === 'es' ? 'Spanish' : 'English'}.
- End with a reminder to verify details with the organization.
- Include source and last-verified date when mentioning a resource.`;

  const body = {
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    temperature: 0.2,
    messages: [
      { role: 'system', content: system },
      {
        role: 'user',
        content: `Question: ${question}\n\nVerified resources:\n${context || 'None found.'}`,
      },
    ],
  };

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error('OpenAI error:', response.status, text);
    return null;
  }

  const data = await response.json();
  const answer = data.choices?.[0]?.message?.content?.trim();
  if (!answer) return null;

  return {
    answer: `${answer}\n\n${DISCLAIMER}`,
    resources,
    mode: 'openai',
  };
}

export async function answerQuestion({ question, language = 'en', userId = null }) {
  const resources = retrieveForAi(question, 5);
  let result = await callOpenAI(question, resources, language);
  if (!result) {
    result = buildRetrievalAnswer(question, resources, language);
  }

  db.prepare(
    `INSERT INTO ai_conversations (user_id, question, answer, resource_ids, language)
     VALUES (?, ?, ?, ?, ?)`
  ).run(
    userId,
    question,
    result.answer,
    JSON.stringify(resources.map((r) => r.id)),
    language
  );

  return result;
}
