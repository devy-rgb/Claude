import { addDays, eachDay, toDate } from "./dates";
import type { DailyAdMetric } from "./types";

/**
 * Deterministic, realistic mock data for a DTC brand running Meta ads with RedTrack attribution.
 * Each ad has its own CPM / CTR / CVR / AOV profile, a launch date, a ramp-up, creative fatigue,
 * weekend seasonality, and some are paused part-way through — so the dashboard has winners,
 * losers and trends to look at.
 */

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface CampaignSpec {
  name: string;
  aov: number; // average order value
  budget: number; // typical daily spend per ad at maturity
  cpm: number;
  ctr: number;
  cvr: number; // RedTrack conversions per click
  ads: string[];
}

const CAMPAIGNS: CampaignSpec[] = [
  {
    name: "PROS | Advantage+ Shopping | US",
    aov: 84,
    budget: 620,
    cpm: 19,
    ctr: 0.0145,
    cvr: 0.034,
    ads: [
      "UGC_Sarah_Hook-Problem-Agitate_v3",
      "UGC_Marcus_Unboxing_15s",
      "Static_Before-After_Grid_01",
      "VSL_Founder-Story_60s",
      "Carousel_Bestsellers_Bundle",
    ],
  },
  {
    name: "PROS | LAL 1% Purchasers 180d | US",
    aov: 79,
    budget: 340,
    cpm: 24,
    ctr: 0.0122,
    cvr: 0.031,
    ads: ["UGC_Jess_3-Reasons_v2", "Static_Testimonial_5-Star", "UGC_Sarah_Hook-Problem-Agitate_v1", "Meme_POV-Morning-Routine"],
  },
  {
    name: "RT | Site Visitors + ATC 30d",
    aov: 92,
    budget: 140,
    cpm: 31,
    ctr: 0.0215,
    cvr: 0.058,
    ads: ["DPA_Catalog_Dynamic", "Static_Offer_20-Off_Urgency", "UGC_Objection-Handling_Shipping"],
  },
  {
    name: "TOF | Interest Stack - Wellness & Fitness",
    aov: 71,
    budget: 260,
    cpm: 14,
    ctr: 0.0098,
    cvr: 0.021,
    ads: ["UGC_Gym-Bro_Reaction_v4", "Static_Ingredient-Callout", "VSL_Doctor-Explains_45s", "UGC_Street-Interview_Cut2"],
  },
  {
    name: "TEST | Creative Sandbox | ABO",
    aov: 76,
    budget: 85,
    cpm: 21,
    ctr: 0.0117,
    cvr: 0.025,
    ads: [
      "TEST_Hook-A_Did-You-Know",
      "TEST_Hook-B_Stop-Scrolling",
      "TEST_Hook-C_Us-vs-Them",
      "TEST_Static_Comparison-Chart",
      "TEST_UGC_Mom-Of-3",
      "TEST_AI-Avatar_Explainer",
    ],
  },
  {
    name: "SCALE | Winning UGC | CBO | US+CA",
    aov: 81,
    budget: 480,
    cpm: 17,
    ctr: 0.0158,
    cvr: 0.029,
    ads: ["UGC_Sarah_Hook-Problem-Agitate_v3_SCALE", "UGC_Jess_3-Reasons_v2_SCALE", "UGC_Marcus_Unboxing_30s"],
  },
];

export const MOCK_DAYS = 120;

/** Generates `days` days of data ending on `endDate` (inclusive). Same inputs → same output. */
export function generateMockMetrics(endDate: string, days = MOCK_DAYS, seed = 42): DailyAdMetric[] {
  const rand = mulberry32(seed);
  const noise = (spread: number) => 1 + (rand() * 2 - 1) * spread;
  const startDate = addDays(endDate, -(days - 1));
  const dates = eachDay(startDate, endDate);
  const rows: DailyAdMetric[] = [];
  let adCounter = 0;

  for (const [ci, c] of CAMPAIGNS.entries()) {
    for (const adName of c.ads) {
      adCounter++;
      const adId = `1202${(14_000_000_000_000 + ci * 1_000_003_117 + adCounter * 7_919_311).toString()}`;
      // Each ad gets its own personality relative to the campaign baseline.
      const quality = 0.6 + rand() * 1.0; // creative strength: <0.8 = loser, >1.2 = winner
      const isTest = c.name.startsWith("TEST");
      // Day index the ad starts. Negative = already live before the window (so day 1 isn't empty).
      const launch = isTest ? Math.floor(rand() * (days - 10)) : Math.floor(rand() * days * 0.8 - days * 0.35);
      const lifespan = isTest ? 10 + Math.floor(rand() * 30) : days * 2; // tests get cut
      const fatigueRate = 0.0015 + rand() * 0.005; // per-day performance decay
      const budgetMult = 0.6 + rand() * 0.9;
      const aov = c.aov * noise(0.12);

      for (const [i, date] of dates.entries()) {
        const age = i - launch;
        if (age < 0 || age > lifespan) continue;
        // Losers get their budget cut after ~2 weeks, winners get scaled.
        if (quality < 0.75 && age > 18 && rand() < 0.85) continue;

        const ramp = Math.min(1, 0.35 + age / 10);
        const scale = quality > 1.15 ? 1 + Math.min(age, 45) * 0.012 : 1;
        const dow = toDate(date).getUTCDay();
        const weekend = dow === 0 || dow === 6 ? 0.88 : 1;
        const fatigue = Math.max(0.6, 1 - age * fatigueRate);
        // Late-November BFCM bump on CPMs and conversion rate.
        const bfcm = date.slice(5, 7) === "11" && Number(date.slice(8)) >= 20 ? 1 : 0;

        const spend = c.budget * budgetMult * ramp * scale * weekend * noise(0.18);
        const cpm = c.cpm * (1 + bfcm * 0.35) * (1 + (1 - fatigue) * 0.4) * noise(0.12);
        const impressions = Math.round((spend / cpm) * 1000);
        const ctr = c.ctr * (0.75 + quality * 0.3) * fatigue * noise(0.15);
        const clicks = Math.round(impressions * ctr);
        const cvr = c.cvr * quality * (0.9 + fatigue * 0.35) * (1 + bfcm * 0.25) * noise(0.3);
        const expected = clicks * cvr;
        // Stochastic rounding keeps low-volume ads lumpy like real data.
        const conversions = Math.max(0, Math.floor(expected) + (rand() < expected % 1 ? 1 : 0));
        let revenue = 0;
        for (let k = 0; k < conversions; k++) revenue += aov * (0.55 + rand() * 0.95);

        rows.push({
          date,
          ad_id: adId,
          campaign_name: c.name,
          ad_name: adName,
          meta_spend: Math.round(spend * 100) / 100,
          meta_impressions: impressions,
          meta_clicks: clicks,
          rt_conversions: conversions,
          rt_revenue: Math.round(revenue * 100) / 100,
        });
      }
    }
  }
  return rows;
}
