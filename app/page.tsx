"use client";

import { FormEvent, useMemo, useState } from "react";
import knowledge from "./knowledge-data.json";
import documentCorpus from "./document-corpus.json";

type Entry = (typeof knowledge.entries)[number];

type AiAnswer = {
  directAnswer: string;
  keyPoints: string[];
  figures: { label: string; value: string; explanation: string }[];
  requirements: string[];
  steps: string[];
  cautions: string[];
  sourceIds: string[];
  confidence: "high" | "medium" | "limited";
  language: "en" | "ar";
};

const detailProfiles = [
  {
    terms: ["commission", "broker fee", "agency fee", "agent fee", "brokerage fee"],
    title: "Real-estate broker commission in Dubai",
    summary:
      "There is no single government-fixed commission percentage for every Dubai property transaction. The legally controlling amount is the commission written in the signed brokerage agreement. If the agreement does not state an amount, prevailing market practice may be considered. In ordinary market practice, a secondary-sale buyer is often quoted 2% of the purchase price and a residential tenant is often quoted 5% of the annual rent, but these are commercial practices—not automatic legal rates.",
    figures: [
      ["Government-fixed universal rate", "None"],
      ["Common secondary-sale quote", "2% of sale price"],
      ["Common residential-leasing quote", "5% of annual rent"],
      ["VAT on a taxable brokerage fee", "5%"],
      ["AED 2,000,000 sale at 2%", "AED 40,000 commission"],
      ["Commission plus 5% VAT", "AED 42,000 total"],
    ],
    conditions: [
      "Check the signed Contract A, Contract B, leasing brokerage agreement or other written brokerage agreement. That document should identify the rate, payer, VAT treatment and payment trigger.",
      "The party that appointed the broker normally pays the agreed remuneration. A broker acting for both parties must disclose the arrangement and each party’s obligation should be written clearly.",
      "For a sale, the broker is generally entitled after the sale contract is concluded and registered, unless the brokerage agreement sets another valid trigger or a condition remains unfulfilled.",
      "Off-plan developer commission is separate: its rate, payment timing and clawback terms come from the developer’s broker agreement or portal and should not be guessed from normal resale practice.",
    ],
    examples: [
      ["Secondary sale", "AED 2,000,000 × 2% = AED 40,000; if VAT applies, AED 2,000 VAT; total invoice AED 42,000."],
      ["Residential lease", "AED 100,000 annual rent × 5% = AED 5,000; if VAT applies, AED 250 VAT; total invoice AED 5,250."],
      ["Negotiated fee", "If the signed agreement says 1.5%, 3% or a fixed AED amount, the written agreement—not the common 2% example—is the starting point."],
    ],
    sources: [
      ["DLD FAQ — how broker fees are determined", "https://dubailand.gov.ae/en/frequently-asked-questions/"],
      ["Dubai real-estate legislation — Articles 27–33", "https://dubailand.gov.ae/media/zrrd4qw4/en-legislation.pdf"],
      ["DLD Real Estate Brokerage Practice Guide", "https://dubailand.gov.ae/media/i31iv1n0/real_estate_brokerage_practice_guide_2024.pdf"],
      ["Federal Tax Authority — VAT", "https://tax.gov.ae/en/taxes/vat.aspx"],
    ],
  },
  {
    terms: ["rent increase", "increase rent", "landlord increase", "rental increase"],
    title: "Dubai rent increase at renewal",
    summary:
      "A landlord may increase rent only at renewal, after giving the legally required notice and where the current DLD Smart Rental Index result permits an increase. The permitted percentage is not chosen freely by the landlord.",
    figures: [
      ["Up to 10% below market", "0% increase"],
      ["11%–20% below market", "Maximum 5%"],
      ["21%–30% below market", "Maximum 10%"],
      ["31%–40% below market", "Maximum 15%"],
      ["More than 40% below market", "Maximum 20%"],
      ["Change to renewal terms", "At least 90 days’ notice"],
    ],
    conditions: [
      "Check the current DLD Smart Rental Index for the exact property before relying on any percentage.",
      "The comparison is with the applicable average rental value—not with an asking price selected by the landlord.",
      "A disagreement may be taken to the Rental Disputes Center; the browser does not decide an individual dispute.",
    ],
    sources: [
      ["DLD Smart Rent Index explanation", "https://dubailand.gov.ae/en/news-media/the-smart-rent-index-mitigates-inflation-in-dubai-and-enhances-market-transparency/"],
      ["DLD tenancy legislation and guidance", "https://dubailand.gov.ae/media/051bem5a/tenancyguideen.pdf"],
    ],
    examples: [
      ["AED 100,000 current rent; index allows 10%", "Maximum new annual rent: AED 110,000, subject to valid notice and the property-specific index result."],
    ],
  },
  {
    terms: ["sale fee", "transfer fee", "sale registration", "buy property fee", "property transfer"],
    title: "Property sale registration",
    summary:
      "Dubai property-sale registration is normally charged at 4% of the sale value. The official service breakdown commonly allocates 2% to the seller and 2% to the purchaser, although the parties’ agreement may determine who ultimately bears the cost.",
    figures: [
      ["Sale registration", "4% of sale value"],
      ["Seller’s listed share", "2%"],
      ["Purchaser’s listed share", "2%"],
      ["Title deed issuance", "AED 250"],
      ["Knowledge fee", "AED 10"],
      ["Innovation fee", "AED 10"],
    ],
    conditions: [
      "Trustee/service-partner charges can be additional and depend on the transaction value and service channel.",
      "Mortgaged, gifted, company-owned and off-plan property use different service routes and may have additional charges.",
      "Use the live DLD service page for the transaction type before quoting a final completion statement.",
    ],
    sources: [
      ["DLD Property Sale Registration", "https://dubailand.gov.ae/en/eservices/property-sale-registration/"],
      ["DLD sale with initial mortgage", "https://dubailand.gov.ae/en/eservices/a-sale-registration-application-associated-with-an-initial-mortgage/"],
    ],
    examples: [
      ["AED 2,000,000 sale", "4% registration charge = AED 80,000 before trustee, certificate and other transaction-specific charges."],
    ],
  },
  {
    terms: ["mortgage fee", "mortgage registration", "register mortgage"],
    title: "Mortgage registration",
    summary:
      "An ordinary property mortgage is registered with Dubai Land Department in favour of the financing party. The principal DLD registration charge is calculated against the mortgage value, with certificate and drawing fees added where applicable.",
    figures: [
      ["Mortgage registration", "0.25% of mortgage value"],
      ["Title deed issuance", "AED 250 each"],
      ["Knowledge fee", "AED 10 per drawing"],
      ["Innovation fee", "AED 10 per drawing"],
      ["Online grant-mortgage service", "Approximately 15–20 minutes"],
    ],
    conditions: [
      "The applicable route depends on the title type, financing arrangement and whether the mortgage is ordinary, portfolio or initial.",
      "Bank, trustee and service-partner charges are separate from DLD registration charges.",
      "Use the current mortgage service page and lender completion statement before confirming a client’s total cost.",
    ],
    sources: [
      ["DLD Mortgage Registration", "https://dubailand.gov.ae/en/eservices/request-for-mortgage-registration/"],
      ["DLD Grant Property Mortgage", "https://dubailand.gov.ae/en/eservices/grant-property-mortgage/"],
    ],
    examples: [
      ["AED 1,500,000 mortgage", "0.25% DLD mortgage-registration charge = AED 3,750 before certificate, lender and service-partner charges."],
    ],
  },
  {
    terms: ["eviction notice", "evict tenant", "landlord eviction", "12 month notice"],
    title: "Landlord eviction notice",
    summary:
      "For the statutory landlord grounds that require advance eviction notice, the notice must state the legal reason and be served through the prescribed formal channel. A normal non-renewal message is not automatically a valid statutory eviction notice.",
    figures: [
      ["Required advance notice", "12 months"],
      ["Formal service", "Notary Public or registered post"],
      ["Personal-use restriction after recovery", "2 years for residential property"],
      ["Commercial-property restriction", "3 years"],
    ],
    conditions: [
      "The landlord must have a legally recognised ground; twelve months alone does not create a right to evict.",
      "The notice wording, issuing party, service evidence, timing and underlying ground all affect validity.",
      "Rental Disputes Center determines contested cases.",
    ],
    sources: [
      ["DLD Tenancy Guide", "https://dubailand.gov.ae/media/051bem5a/tenancyguideen.pdf"],
      ["DLD Ejari Tenancy Guide", "https://dubailand.gov.ae/media/rhojzudp/ejari_guide_in_dubai_en.pdf"],
    ],
    examples: [
      ["Notice served 1 August 2026", "The stated eviction date cannot be earlier than 1 August 2027, and the landlord must still have a recognised legal ground."],
    ],
  },
  {
    terms: ["off plan registration", "initial sale", "oqood", "off-plan sale"],
    title: "Initial registration of an off-plan sale",
    summary:
      "A developer registers an off-plan unit or land sale in Dubai’s provisional register while the price remains partly unpaid. Registration protects the transaction record and must follow the project and developer’s approved DLD route.",
    figures: [
      ["Sale-registration charge", "2% seller + 2% purchaser"],
      ["Title deed / issued certificate where applicable", "AED 250"],
      ["Knowledge fee", "AED 10"],
      ["Innovation fee", "AED 10"],
      ["Registration after signing", "Within 90 days"],
    ],
    conditions: [
      "The project, developer, escrow arrangements and sale contract must be valid for the specific transaction.",
      "Do not rely on a booking form or payment receipt as a substitute for the official provisional-register result.",
      "Obtain the live Oqood/DLD record for the actual unit.",
    ],
    sources: [
      ["DLD Initial Sale Registration", "https://dubailand.gov.ae/en/eservices/request-to-register-the-initial-sale/"],
      ["DLD sale with initial mortgage", "https://dubailand.gov.ae/en/eservices/a-sale-registration-application-associated-with-an-initial-mortgage/"],
    ],
    examples: [
      ["AED 1,500,000 off-plan sale", "The 4% registration charge totals AED 60,000, commonly shown as 2% seller and 2% purchaser before minor issuance fees."],
    ],
  },
];

const topicRules: Record<string, string[]> = {
  Sales: ["sales", "transfer", "booking", "contract"],
  Rentals: ["rental", "rent", "ejari", "leasing", "eviction"],
  "Due Diligence": ["due diligence", "fraud", "consumer protection"],
  Mortgages: ["mortgage", "finance", "valuation"],
  AML: ["aml", "cft", "kyc", "sanctions"],
};

const stopWords = new Set([
  "a", "an", "and", "are", "as", "at", "be", "can", "could", "do", "does", "for", "from", "how", "i", "if",
  "in", "is", "it", "me", "my", "of", "on", "or", "please", "should", "the", "their", "there", "this", "to",
  "what", "when", "where", "which", "who", "why", "will", "with", "would", "you",
]);

const conceptGroups = [
  ["commission", "brokerage", "broker", "agent", "remuneration", "fee"],
  ["rent", "rental", "lease", "leasing", "tenancy", "tenant", "landlord", "ejari"],
  ["sale", "sales", "sell", "seller", "buyer", "purchase", "purchaser", "transfer"],
  ["offplan", "off-plan", "oqood", "initial", "developer", "escrow"],
  ["mortgage", "finance", "financing", "loan", "bank", "lender"],
  ["contract", "agreement", "form", "template", "sign", "signature"],
  ["requirement", "requirements", "required", "document", "documents", "eligibility", "eligible"],
  ["advertisement", "advertising", "advert", "permit", "trakheesi", "madmoun"],
  ["service", "charge", "charges", "mollak", "jointly", "owners", "management"],
  ["notice", "eviction", "evict", "termination", "renewal", "increase"],
  ["aml", "cft", "kyc", "sanctions", "goaml", "dnfbp"],
];

function tokens(value: string) {
  const base = value
    .toLowerCase()
    .replace(/off[\s-]?plan/g, "offplan")
    .replace(/[^\p{L}\p{N}%]+/gu, " ")
    .split(/\s+/)
    .filter((word) => word.length > 1 && !stopWords.has(word));
  const expanded = new Set(base);
  for (const word of base) {
    const group = conceptGroups.find((items) => items.includes(word));
    group?.forEach((item) => expanded.add(item));
  }
  return [...expanded];
}

function textScore(text: string, query: string, title = "") {
  const lower = text.toLowerCase();
  const lowerTitle = title.toLowerCase();
  const queryTokens = tokens(query);
  const coreTokens = query
    .toLowerCase()
    .replace(/[^\p{L}\p{N}%]+/gu, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !stopWords.has(word));
  let score = lowerTitle.includes(query.toLowerCase().trim()) ? 80 : lower.includes(query.toLowerCase().trim()) ? 30 : 0;
  for (const word of queryTokens) {
    const direct = coreTokens.includes(word);
    if (lowerTitle.includes(word)) score += direct ? 16 : 5;
    if (lower.includes(word)) score += direct ? 5 : 1;
  }
  return score;
}

function bestPassages(text: string, query: string) {
  return text
    .split(/\n+/)
    .map((passage) => ({ passage, score: textScore(passage, query) }))
    .filter((item) => item.score > 1 && item.passage.length > 25)
    .sort((a, b) => b.score - a.score || a.passage.length - b.passage.length)
    .slice(0, 3)
    .map((item) => item.passage);
}

type EvidenceFact = {
  category: string;
  text: string;
  sourceId: string;
  sourceTitle: string;
};

const factCategories = [
  "Costs & figures",
  "Deadlines & validity",
  "Requirements & documents",
  "Procedure & next steps",
  "Parties & responsibilities",
  "Rules, exceptions & risks",
];

function factCategory(passage: string) {
  const value = passage.toLowerCase();
  if (/\b(aed|dirham|fee|fees|cost|charge|commission|percentage|percent)\b|%/.test(value)) return "Costs & figures";
  if (/\b(within|deadline|valid|validity|notice|day|days|month|months|year|years|expiry|expire)\b/.test(value)) return "Deadlines & validity";
  if (/\b(required|requirement|requirements|document|documents|eligib|attachment|passport|emirates id|certificate)\b/.test(value)) return "Requirements & documents";
  if (/\b(step|steps|apply|application|submit|submission|register|registration|issue|payment|service channel)\b/.test(value)) return "Procedure & next steps";
  if (/\b(buyer|seller|tenant|landlord|broker|developer|owner|applicant|party|parties|authority)\b/.test(value)) return "Parties & responsibilities";
  return "Rules, exceptions & risks";
}

function concisePassage(passage: string) {
  const clean = passage.replace(/\s+/g, " ").trim();
  return clean.length > 430 ? `${clean.slice(0, 427).replace(/\s+\S*$/, "")}…` : clean;
}

function extractValues(passage: string) {
  return [...new Set(
    passage.match(/AED\s?[\d,.]+|[\d,.]+\s?(?:AED|dirhams?)|[\d.]+\s?%|\b\d+\s?(?:calendar\s+)?(?:days?|months?|years?)\b/gi) || [],
  )].slice(0, 4);
}

function searchScore(entry: Entry, query: string) {
  const normalized = query.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
  const words = normalized.split(/\s+/).filter((word) => word.length > 2);
  const title = entry.title.toLowerCase();
  const section = entry.section.toLowerCase();
  const body = `${entry.answer} ${entry.practical} ${entry.use} ${entry.authority}`.toLowerCase();
  const lexical = words.reduce(
    (score, word) =>
      score + (title.includes(word) ? 8 : 0) + (section.includes(word) ? 4 : 0) + (body.includes(word) ? 1 : 0),
    0,
  );
  return lexical + textScore(`${section} ${body}`, query, title);
}

function statusClass(status: string) {
  if (status.toLowerCase().includes("fully")) return "verified";
  if (status.toLowerCase().includes("partial")) return "partial";
  return "controlled";
}

function answerKind(query: string, entry: Entry) {
  const value = `${query} ${entry.title}`.toLowerCase();
  if (/\b(contract|agreement|form|template)\b/.test(value)) return "contract";
  if (/\b(requirement|requirements|required|documents|eligibility)\b/.test(value)) return "requirements";
  if (/\b(fee|fees|cost|price|commission|vat|charge)\b/.test(value)) return "fees";
  if (/\b(how|process|procedure|register|apply|application|steps)\b/.test(value)) return "process";
  return "knowledge";
}

function universalDetails(entry: Entry, query: string) {
  const kind = answerKind(query, entry);
  const common = [
    ["What it means", entry.answer],
    ["Practical use", entry.practical],
    ["When it applies", entry.use],
    ["Responsible authority", `${entry.authority}. Jurisdiction: ${entry.jurisdiction}.`],
  ];
  const contract = [
    ["Who must be identified", "The correct legal parties, their authority to sign, and the broker or representative acting for each party must be recorded."],
    ["Property details to verify", "Match the property identifier and official record—such as title deed, provisional registration or Ejari—to the document before signature."],
    ["Commercial terms to record", "Price or rent, payment dates, deposits, commission and VAT, completion or commencement date, and any conditions must be written clearly."],
    ["Before signing", "Check validity dates, termination and default clauses, attachments, permit or NOC requirements, and that every required party signs the final version."],
  ];
  const requirements = [
    ["Eligibility", "Confirm the applicant, property and transaction are eligible through the stated authority and official service channel."],
    ["Documents", `Use the current official checklist. The mapped evidence for this entry is ${entry.sourceIds.join(", ") || "not yet complete"}; do not substitute informal screenshots or verbal confirmation.`],
    ["Application route", entry.officialUrl ? "Open the official control channel linked below and follow its current submission sequence." : "The exact live application channel must be confirmed with the authority before submission."],
    ["Result to retain", "Keep the issued certificate, approval, registration number, receipt or official status result with the transaction file."],
  ];
  const fees = [
    ["How the amount is fixed", "Use the official fee schedule or the signed agreement applicable to this exact transaction. A market convention is not automatically a legal tariff."],
    ["What to include in the total", "Separate the principal fee from VAT, trustee or service-provider charges, certificate fees, knowledge and innovation fees, and bank or developer charges."],
    ["Proof of payment", "Retain the tax invoice and official receipt, and confirm the payment trigger before quoting a final amount to a client."],
  ];
  const process = [
    ["Before applying", "Verify the applicant, property record, transaction type and supporting documents against the current official service requirements."],
    ["Submission", entry.officialUrl ? "Use the official channel linked below; complete the fields and upload the current required evidence." : "Confirm the current authority channel before submitting."],
    ["After submission", "Track approval, pay only through the authorised channel, verify the issued result and save it in the transaction file."],
  ];
  const specific = kind === "contract" ? contract : kind === "requirements" ? requirements : kind === "fees" ? fees : kind === "process" ? process : [];
  return [
    ...common,
    ...specific,
    ["Verification basis", entry.verification],
    ["Status and review", `${entry.status}. Last verified: ${entry.verified || "date not recorded"}. Review trigger: ${entry.review}.`],
    ["Risk or limitation", entry.gap || entry.disclaimer || "Confirm the live official position before relying on this entry for a transaction."],
    ["What to do next", entry.next],
  ];
}

export default function Home() {
  const [query, setQuery] = useState("Can a landlord increase the rent?");
  const [submitted, setSubmitted] = useState("rent increase notice");
  const [topic, setTopic] = useState("Rentals");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showSections, setShowSections] = useState(false);
  const [aiAnswer, setAiAnswer] = useState<AiAnswer | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMessage, setAiMessage] = useState("");

  const results = useMemo(() => {
    const terms = topic && !submitted ? topicRules[topic].join(" ") : submitted;
    const ranked = knowledge.entries
      .map((entry) => ({ entry, score: searchScore(entry, terms) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score || a.entry.id.localeCompare(b.entry.id));
    return ranked.slice(0, 12).map((item) => item.entry);
  }, [submitted, topic]);

  const lead = results[0] || knowledge.entries[0];
  const details = useMemo(() => universalDetails(lead, submitted), [lead, submitted]);
  const relatedControls = useMemo(
    () => results.slice(1, 6).map((entry) => ({ title: entry.title, answer: entry.answer, id: entry.id })),
    [results],
  );
  const documentResults = useMemo(() => {
    if (!submitted.trim()) return [];
    return documentCorpus.documents
      .map((document) => ({
        ...document,
        score:
          textScore(`${document.package} ${document.text}`, submitted, `${document.sourceId} ${document.title}`) +
          (lead.sourceIds.includes(document.sourceId) ? 120 : 0),
        passages: bestPassages(document.text, submitted),
      }))
      .filter((document) => document.score > 2 && document.passages.length)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);
  }, [submitted, lead]);
  const factGroups = useMemo(() => {
    const facts: EvidenceFact[] = [];
    const seen = new Set<string>();
    for (const document of documentResults) {
      for (const passage of document.passages) {
        const text = concisePassage(passage);
        const key = text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").slice(0, 180);
        if (seen.has(key)) continue;
        seen.add(key);
        facts.push({
          category: factCategory(text),
          text,
          sourceId: document.sourceId,
          sourceTitle: document.title,
        });
      }
    }
    return factCategories
      .map((category) => ({ category, facts: facts.filter((fact) => fact.category === category).slice(0, 4) }))
      .filter((group) => group.facts.length);
  }, [documentResults]);
  const numericFacts = useMemo(
    () =>
      factGroups
        .flatMap((group) => group.facts)
        .map((fact) => ({ ...fact, values: extractValues(fact.text) }))
        .filter((fact) => fact.values.length)
        .slice(0, 6),
    [factGroups],
  );
  const profile = useMemo(() => {
    const value = submitted.toLowerCase().replace(/[^\p{L}\p{N}%]+/gu, " ").trim();
    const ranked = detailProfiles
      .map((item) => ({
        item,
        score: item.terms.reduce((score, term) => {
          if (value.includes(term)) return score + term.split(" ").length * 10;
          const termWords = term.split(" ");
          return score + termWords.filter((word) => value.includes(word)).length * 2;
        }, 0),
      }))
      .sort((a, b) => b.score - a.score);
    return ranked[0]?.score > 0 ? ranked[0].item : null;
  }, [submitted]);

  async function askAi(question: string) {
    if (!question.trim()) return;
    setAiLoading(true);
    setAiAnswer(null);
    setAiMessage("");

    const entryEvidence = knowledge.entries
      .map((entry) => ({ entry, score: searchScore(entry, question) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map(({ entry }) => ({
        id: entry.id,
        title: entry.title,
        kind: "knowledge-entry" as const,
        authority: entry.authority,
        status: entry.status,
        text: [entry.answer, entry.practical, entry.use, entry.verification, entry.gap, entry.next]
          .filter(Boolean)
          .join("\n"),
      }));

    const mappedSourceIds = new Set(entryEvidence.flatMap((item) => {
      const entry = knowledge.entries.find((candidate) => candidate.id === item.id);
      return entry?.sourceIds || [];
    }));
    const documentEvidence = documentCorpus.documents
      .map((document) => ({
        document,
        score:
          textScore(`${document.package} ${document.text}`, question, `${document.sourceId} ${document.title}`) +
          (mappedSourceIds.has(document.sourceId) ? 120 : 0),
        passages: bestPassages(document.text, question),
      }))
      .filter((item) => item.score > 2 && item.passages.length)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map(({ document, passages }) => ({
        id: document.sourceId,
        title: document.title,
        kind: "official-document" as const,
        authority: document.package,
        status: "Official evidence",
        text: passages.map(concisePassage).join("\n"),
      }));

    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, evidence: [...entryEvidence, ...documentEvidence] }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Hayat AI is unavailable right now.");
      setAiAnswer(data);
    } catch (error) {
      setAiMessage(error instanceof Error ? error.message : "Hayat AI is unavailable right now.");
    } finally {
      setAiLoading(false);
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    setTopic("");
    setSubmitted(query.trim());
    void askAi(query.trim());
    document.getElementById("results")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function chooseTopic(name: string) {
    setTopic(name);
    setSubmitted(topicRules[name].join(" "));
    setQuery(name);
    void askAi(name);
    document.getElementById("results")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <main>
      <section className="hero">
        <div className="skyline skyline-left" aria-hidden="true">⌂ ◇ ▯ △ ▥</div>
        <div className="skyline skyline-right" aria-hidden="true">▥ △ ▯ ◇ ⌂</div>
        <header className="topbar">
          <button className="brand" onClick={() => scrollTo({ top: 0, behavior: "smooth" })}>
            <span className="brand-logo-wrap">
              <img src="/hayat-luxury-logo.png" alt="Hayat Luxury Properties" />
            </span>
            <span className="brand-copy">
              <span className="brand-name">Dubai Real Estate Knowledge Browser</span>
              <small>by Hayat Luxury Properties</small>
            </span>
          </button>
          <nav aria-label="Primary navigation">
            <button className="active" onClick={() => scrollTo({ top: 0, behavior: "smooth" })}>⌂<span>Home</span></button>
            <button onClick={() => setShowSections(!showSections)}>▤<span>Browse</span></button>
            <button onClick={() => document.getElementById("sources")?.scrollIntoView({ behavior: "smooth" })}>▧<span>Sources</span></button>
            <button onClick={() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })}>✦<span>Contact</span></button>
          </nav>
          <span className="checkpoint">V71</span>
        </header>

        <div className="hero-content">
          <p className="eyebrow">A Hayat Luxury Properties knowledge platform</p>
          <h1>Trusted knowledge.<br /><em>Confident real estate decisions.</em></h1>
          <form className="search" onSubmit={submit} role="search">
            <span aria-hidden="true">⌕</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="Search the knowledge base"
              placeholder="Search laws, procedures, forms, fees and terminology…"
            />
            <kbd>↵</kbd>
            <button type="submit" aria-label="Search">⌕</button>
          </form>
          <div className="metrics" aria-label="Knowledge base statistics">
            <div><i>▤</i><strong>{knowledge.entryCount.toLocaleString()}</strong><span>knowledge entries</span></div>
            <div><i>♜</i><strong>{knowledge.sourceCount.toLocaleString()}</strong><span>registered sources</span></div>
            <div><i>◇</i><strong>{knowledge.sectionCount}</strong><span>sections</span></div>
          </div>
        </div>
      </section>

      <section className="workspace" id="results">
        <div className="topic-row">
          <div>
            <p className="section-kicker">Browse by journey</p>
            <h2>Popular topics</h2>
          </div>
          <span className="result-count">{results.length} best matches</span>
        </div>
        <div className="topics">
          {Object.keys(topicRules).map((name) => (
            <button key={name} className={topic === name ? "selected" : ""} onClick={() => chooseTopic(name)}>
              <span>{name === "Sales" ? "⌂" : name === "Rentals" ? "▥" : name === "Due Diligence" ? "◇" : name === "Mortgages" ? "♜" : "♙"}</span>
              {name}
            </button>
          ))}
        </div>

        {showSections && (
          <div className="section-grid">
            {knowledge.sections.map((section) => (
              <button key={section.id} onClick={() => { setQuery(section.title); setSubmitted(section.title); setTopic(""); setShowSections(false); void askAi(section.title); }}>
                <span>{section.id}</span><strong>{section.title}</strong><small>{section.count} entries</small>
              </button>
            ))}
          </div>
        )}

        <section className={`ai-panel ${aiLoading ? "ai-loading" : ""}`} aria-live="polite">
          <div className="ai-heading">
            <div>
              <p className="section-kicker">Hayat AI · Gemini assisted</p>
              <h2>One clear answer, cross-matched to the evidence</h2>
            </div>
            <span className={`ai-confidence ${aiAnswer?.confidence || "ready"}`}>
              {aiLoading ? "Analysing evidence…" : aiAnswer ? `${aiAnswer.confidence} confidence` : "Evidence-bound AI"}
            </span>
          </div>

          {!aiAnswer && !aiLoading && !aiMessage && (
            <p className="ai-intro">Ask any Dubai real-estate question above. Hayat AI will compare the most relevant controlled entries and official-document passages, then organise the actual answer, figures, requirements and next steps.</p>
          )}
          {aiLoading && <div className="ai-progress"><i /><span>Reading the strongest matching entries and official sources…</span></div>}
          {aiMessage && <div className="ai-message"><strong>Verified search is still working</strong><span>{aiMessage}</span></div>}

          {aiAnswer && (
            <div className="ai-answer" dir={aiAnswer.language === "ar" ? "rtl" : "ltr"}>
              <article className="ai-direct">
                <span>Direct answer</span>
                <p>{aiAnswer.directAnswer}</p>
              </article>

              {aiAnswer.figures.length > 0 && (
                <div className="ai-figures">
                  {aiAnswer.figures.map((figure) => (
                    <article key={`${figure.label}-${figure.value}`}>
                      <span>{figure.label}</span><strong>{figure.value}</strong><p>{figure.explanation}</p>
                    </article>
                  ))}
                </div>
              )}

              <div className="ai-columns">
                {aiAnswer.keyPoints.length > 0 && <article><h3>Key points</h3><ul>{aiAnswer.keyPoints.map((item) => <li key={item}>{item}</li>)}</ul></article>}
                {aiAnswer.requirements.length > 0 && <article><h3>Requirements</h3><ul>{aiAnswer.requirements.map((item) => <li key={item}>{item}</li>)}</ul></article>}
                {aiAnswer.steps.length > 0 && <article><h3>What to do</h3><ol>{aiAnswer.steps.map((item) => <li key={item}>{item}</li>)}</ol></article>}
                {aiAnswer.cautions.length > 0 && <article className="ai-cautions"><h3>Important cautions</h3><ul>{aiAnswer.cautions.map((item) => <li key={item}>{item}</li>)}</ul></article>}
              </div>

              <div className="ai-sources">
                <span>Evidence used: {aiAnswer.sourceIds.join(" · ") || "No permanent Source ID confirmed"}</span>
                <b>Controlled information · verify the live authority position for the actual transaction</b>
              </div>
            </div>
          )}
        </section>

        <article className={`answer-card ${profile ? "answer-card-detailed" : ""}`}>
          <div className="answer-column answer-summary">
            <div className="column-title"><span>♢</span><h3>{profile ? profile.title : "Direct answer"}</h3></div>
            <p>{profile?.summary || lead.answer}</p>
            <div className="context-note">
              <strong>{profile ? "Bottom line" : "What this means in practice"}</strong>
              <span>{lead.practical}</span>
            </div>
            <span className="entry-code">{lead.id} · {lead.section}</span>
          </div>
          <div className="answer-column key-points">
            <div className="column-title"><span>✓</span><h3>{profile ? "Actual figures & deadlines" : "Detailed information"}</h3></div>
            {profile ? (
              <div className="figure-grid">
                {profile.figures.map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}
              </div>
            ) : (
              <div className="detail-stack answer-preview">
                {details.slice(2, 6).map(([label, value]) => (
                  <div key={label}><strong>{label}</strong><p>{value}</p></div>
                ))}
              </div>
            )}
          </div>
          <div className="answer-column evidence" id="sources">
            <div className="column-title"><span>▧</span><h3>Conditions & evidence</h3></div>
            <ul className="condition-list">
              {(profile?.conditions || [lead.use, lead.jurisdiction, lead.next]).map((item) => <li key={item}>{item}</li>)}
            </ul>
            <div className="source-box">
              <strong>{lead.authority}</strong>
              <span>{lead.sourceIds.slice(0, 4).join(" · ") || "Controlled knowledge entry"}</span>
              <b className={statusClass(lead.status)}>● {lead.status}</b>
            </div>
            <p className="checked">▣ Entry checked {lead.verified || "2026-07-28"}</p>
            <div className="official-links">
              {profile?.sources.map(([label, url]) => <a key={url} href={url} target="_blank" rel="noreferrer">{label} ↗</a>)}
              {!profile && lead.officialUrl && <a href={lead.officialUrl} target="_blank" rel="noreferrer">Open official control channel ↗</a>}
            </div>
          </div>
        </article>

        {factGroups.length > 0 && (
          <section className="fact-map">
            <div className="fact-map-heading">
              <div>
                <p className="section-kicker">Deep answer map</p>
                <h2>Verified facts organised for your question</h2>
              </div>
              <span>{factGroups.reduce((total, group) => total + group.facts.length, 0)} evidence points</span>
            </div>

            {numericFacts.length > 0 && (
              <div className="numeric-facts">
                {numericFacts.map((fact) => (
                  <article key={`${fact.sourceId}-${fact.text}`}>
                    <div>{fact.values.map((value) => <strong key={value}>{value}</strong>)}</div>
                    <p>{fact.text}</p>
                    <span>{fact.sourceId}</span>
                  </article>
                ))}
              </div>
            )}

            <div className="fact-groups">
              {factGroups.map((group, index) => (
                <details key={group.category} open={index < 2}>
                  <summary><strong>{group.category}</strong><span>{group.facts.length} verified points</span></summary>
                  <div>
                    {group.facts.map((fact) => (
                      <article key={`${fact.sourceId}-${fact.text}`}>
                        <p>{fact.text}</p>
                        <span>{fact.sourceId} · {fact.sourceTitle}</span>
                      </article>
                    ))}
                  </div>
                </details>
              ))}
            </div>
          </section>
        )}

        {documentResults.length > 0 && (
          <section className="document-answer">
            <div className="document-answer-heading">
              <div>
                <p className="section-kicker">Official-document answer</p>
                <h2>What the source documents actually say</h2>
              </div>
              <span>{documentCorpus.count} PDFs indexed · no paid AI</span>
            </div>
            <p className="document-intro">
              These are the strongest passages retrieved from the official document library for your question. Read them together with the controlled explanation above.
            </p>
            <div className="document-passages">
              {documentResults.slice(0, 3).map((document) => (
                <article key={`${document.sourceId}-${document.title}`}>
                  <header>
                    <div><strong>{document.title}</strong><span>{document.sourceId} · {document.package} · {document.language}</span></div>
                    <b>Official evidence</b>
                  </header>
                  {document.passages.map((passage) => <p key={passage}>{passage}</p>)}
                </article>
              ))}
            </div>
            {documentResults.length > 3 && (
              <details className="more-documents">
                <summary>Show {documentResults.length - 3} more supporting documents</summary>
                <div className="document-passages">
                  {documentResults.slice(3).map((document) => (
                    <article key={`${document.sourceId}-${document.title}`}>
                      <header>
                        <div><strong>{document.title}</strong><span>{document.sourceId} · {document.package} · {document.language}</span></div>
                        <b>Supporting evidence</b>
                      </header>
                      {document.passages.map((passage) => <p key={passage}>{concisePassage(passage)}</p>)}
                    </article>
                  ))}
                </div>
              </details>
            )}
            <p className="document-caution">
              Extracted passages can lose table layout or page context. For a transaction, verify the linked source or permanent Source ID before relying on a figure or deadline.
            </p>
          </section>
        )}

        {profile?.examples && (
          <article className="worked-examples">
            <div className="column-title"><span>=</span><h3>Worked examples</h3></div>
            <div className="example-grid">
              {profile.examples.map(([label, answer]) => (
                <div key={label}><strong>{label}</strong><p>{answer}</p></div>
              ))}
            </div>
            <p className="example-warning">Examples explain the calculation. The signed agreement and the facts of the actual transaction remain controlling.</p>
          </article>
        )}

        <details className="comprehensive-answer">
          <summary>
            <div><p className="section-kicker">Complete explanation</p><h2>Open the full controlled entry</h2></div>
            <span>Detailed fields + related controls</span>
          </summary>
          <div className="comprehensive-body">
            <div className="comprehensive-heading">
              <div><p className="section-kicker">Complete explanation</p><h2>{profile ? "Supporting transaction guidance" : "What you need to know"}</h2></div>
              <span>{answerKind(submitted, lead) === "contract" ? "Contract / form guidance" : answerKind(submitted, lead) === "requirements" ? "Requirements guidance" : answerKind(submitted, lead) === "fees" ? "Fee guidance" : answerKind(submitted, lead) === "process" ? "Procedure guidance" : "Knowledge guidance"}</span>
            </div>
            <div className="comprehensive-grid">
              {details.map(([label, value]) => (
                <article key={label}><strong>{label}</strong><p>{value}</p></article>
              ))}
            </div>
            {relatedControls.length > 0 && (
              <div className="related-controls">
                <h3>Related requirements and controls</h3>
                {relatedControls.map((item) => (
                  <div key={item.id}><span>{item.id}</span><strong>{item.title}</strong><p>{item.answer}</p></div>
                ))}
              </div>
            )}
          </div>
        </details>

        <div className="results-list">
          <div className="list-heading">
            <div><p className="section-kicker">Search results</p><h2>{submitted ? `Results for “${query}”` : "Recommended entries"}</h2></div>
            <span>Showing {results.length} of {knowledge.entryCount.toLocaleString()}</span>
          </div>
          {results.slice(1).map((entry) => (
            <article className="result-item" key={entry.id}>
              <button className="result-main" onClick={() => setExpanded(expanded === entry.id ? null : entry.id)}>
                <span className={`status-dot ${statusClass(entry.status)}`} />
                <span className="result-copy">
                  <small>{entry.sectionId} · {entry.section}</small>
                  <strong>{entry.title}</strong>
                  <p>{entry.answer}</p>
                </span>
                <span className="chevron">{expanded === entry.id ? "−" : "+"}</span>
              </button>
              {expanded === entry.id && (
                <div className="result-detail">
                  <div><span>Controlled explanation</span><p>{entry.answer}</p></div>
                  <div><span>Practical use</span><p>{entry.practical}</p></div>
                  <div><span>When to use</span><p>{entry.use}</p></div>
                  <div><span>Authority</span><p>{entry.authority}</p></div>
                  <div><span>Jurisdiction</span><p>{entry.jurisdiction}</p></div>
                  <div><span>Sources</span><p>{entry.sourceIds.join(" · ") || "No permanent source mapped"}</p></div>
                  <div><span>Packages</span><p>{entry.packages.join(" · ") || "No package reference mapped"}</p></div>
                  <div><span>Verification basis</span><p>{entry.verification}</p></div>
                  <div><span>English source status</span><p>{entry.english}</p></div>
                  <div><span>Arabic source status</span><p>{entry.arabic}</p></div>
                  <div><span>Review trigger</span><p>{entry.review}</p></div>
                  <div><span>Risk or open gap</span><p>{entry.gap || entry.disclaimer}</p></div>
                  <div><span>Next action</span><p>{entry.next}</p></div>
                  {entry.officialUrl && <a href={entry.officialUrl} target="_blank" rel="noreferrer">Open official channel ↗</a>}
                </div>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="contact-section" id="contact">
        <div className="contact-intro">
          <p className="section-kicker">Where life meets luxury</p>
          <h2>Contact Hayat Luxury Properties</h2>
          <p>
            A Dubai-based real-estate firm connecting clients with luxury, off-plan,
            residential, land and commercial opportunities across the UAE through
            personal, transparent and strategic guidance.
          </p>
          <div className="contact-actions">
            <a className="contact-primary" href="https://wa.me/971585066899?text=Hello%20Hayat%20Luxury%20Properties" target="_blank" rel="noreferrer">WhatsApp us</a>
            <a href="tel:+971585066899">Call +971 58 506 6899</a>
            <a href="mailto:info@hayatluxuryproperties.com">Email our team</a>
            <a href="mailto:ossama@hayatluxuryproperties.com">Email Osama</a>
          </div>
        </div>
        <div className="office-grid">
          <article>
            <span>Dubai office</span>
            <h3>Business Bay</h3>
            <p>Office 1001, B2B Tower<br />Marasi Drive, Business Bay, Dubai</p>
            <a href="https://www.google.com/maps/search/?api=1&query=B2B+Tower+Marasi+Drive+Business+Bay+Dubai" target="_blank" rel="noreferrer">Open in Maps ↗</a>
          </article>
          <article>
            <span>Sharjah office</span>
            <h3>Bin Rashid Tower</h3>
            <p>Office 606, Bin Rashid Tower<br />Sharjah, United Arab Emirates</p>
            <a href="https://www.google.com/maps/search/?api=1&query=Bin+Rashid+Tower+Sharjah" target="_blank" rel="noreferrer">Open in Maps ↗</a>
          </article>
        </div>
      </section>

      <footer>
        <div className="footer-brand">
          <img src="/hayat-luxury-logo.png" alt="Hayat Luxury Properties" />
          <span>Where Life Meets Luxury</span>
        </div>
        <div id="updates"><strong>Dubai Real Estate Knowledge Browser</strong><span>Active checkpoint V71 · Coverage Audit V52</span><span>Controlled information, not transaction-specific legal advice.</span></div>
        <div id="about"><strong>Developed by Osama Bakir</strong><a href="mailto:ossama@hayatluxuryproperties.com">ossama@hayatluxuryproperties.com</a><a href="tel:+971585066899">+971 58 506 6899</a></div>
      </footer>

      <a className="floating-whatsapp" href="https://wa.me/971585066899?text=Hello%20Hayat%20Luxury%20Properties" target="_blank" rel="noreferrer" aria-label="Contact Hayat Luxury Properties on WhatsApp">
        <span>WhatsApp</span>
        <b>↗</b>
      </a>
    </main>
  );
}
