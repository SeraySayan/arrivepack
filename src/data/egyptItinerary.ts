/**
 * Egypt itinerary engine — rule-based, no AI.
 *
 * Architecture:
 *  1. getCairoBaseContext(stayArea) supplies all Cairo/Giza-specific copy.
 *  2. Day builder functions create ItineraryDay objects using that context.
 *  3. assembleRoute() selects and orders days based on trip duration.
 *  4. applyBudgetModifiers() / applyStyleModifiers() post-process chips/copy.
 *  5. generateEgyptItinerary() is the single public export.
 *
 * Product rules enforced here:
 *  - No Zamalek copy unless stayArea === 'zamalek'.
 *  - No exact opening hours, exact prices, or official legal claims.
 *  - Stay area only modifies Cairo/Giza local logistics — never removes Luxor/Aswan.
 *  - Budget modifiers affect tone and cost labels, not the route structure.
 *  - Travel style modifiers adjust chips and day emphasis, not the route structure.
 */

import type {
  ItineraryDay,
  Activity,
  TrustMeta,
  BudgetStyle,
  TravelStyle,
  CostLevel,
  StayAreaId,
} from '../types';
import { getCairoBaseContext, type CairoContext } from '../services/cairoContext';

// ── Shared trust metadata ─────────────────────────────────────────────────────

const trust: TrustMeta = {
  sourceType: 'sample_data',
  confidence: 'medium',
  lastCheckedLabel: 'Sample data',
};

// ── Activity factory ──────────────────────────────────────────────────────────

function act(
  id: string,
  title: string,
  description: string,
  opts: {
    category?: string;
    duration?: string;
    cost?: CostLevel;
    transport?: string;
    why?: string;
  } = {}
): Activity {
  return {
    id,
    title,
    description,
    category: opts.category ?? 'Activity',
    estimatedDuration: opts.duration ?? 'Flexible',
    estimatedCostLevel: opts.cost ?? 'medium',
    transportNote: opts.transport ?? '',
    whyItFits: opts.why ?? '',
    trust,
  };
}

// ── Cairo / Giza day builders ─────────────────────────────────────────────────

function buildArrivalDay(n: number, ctx: CairoContext, b: BudgetStyle): ItineraryDay {
  const isBudget = b === 'smart_budget';
  return {
    day: n,
    title: 'Arrival & Easy First Night',
    theme: 'Settle in and start calmly',
    summary: 'Arrive, check in, and ease into Egypt. Low intensity to recover from travel.',
    chips: ['Easy start', 'Low walking'],
    morning: [
      act('e_arr_airport', 'Arrive at Cairo Airport',
        'Land, clear immigration, and transfer to your accommodation.',
        { category: 'Transport', duration: '1.5–2 hrs', cost: 'medium', transport: ctx.arrivalTransportNote, why: 'Starting point for your Egypt adventure.' }),
    ],
    afternoon: [
      act('e_arr_checkin', 'Check In & Rest',
        'Check into your accommodation, freshen up, and take it easy after your flight.',
        { category: 'Rest', duration: '2–3 hrs', cost: 'low', transport: 'At accommodation', why: 'Recovery time is smart on arrival day.' }),
    ],
    evening: [
      act('e_arr_eve', ctx.arrivalEveningTitle, ctx.arrivalEveningDescription,
        { category: 'Food & Drink', duration: '1.5–2 hrs', cost: isBudget ? 'low' : 'medium', transport: 'Walking or short Uber', why: 'Easy first evening to get comfortable in Cairo.' }),
    ],
    alternatives: [
      act('e_arr_alt', 'Room Service & Early Sleep',
        'If jet-lagged, skip the evening outing and rest for the big day ahead.',
        { category: 'Rest', duration: 'Flexible', cost: 'low', transport: 'At accommodation', why: 'Sometimes the best move is to rest.' }),
    ],
    estimatedCostLevel: isBudget ? 'low' : 'medium',
    transportSuggestion: ctx.arrivalTransportNote,
  };
}

function buildGizaDay(n: number, ctx: CairoContext, b: BudgetStyle): ItineraryDay {
  const isBudget = b === 'smart_budget';
  return {
    day: n,
    title: 'Giza Without the Chaos',
    theme: 'Pyramids early, then slow down',
    summary: 'Hit the Pyramids early before the heat and crowds. Afternoon recovery and easy evening.',
    chips: ['Best early', 'High walking'],
    morning: [
      act('e_giza_pyr', 'Pyramids of Giza (Early Entry)',
        'Arrive as early as 8am to beat the crowds and heat. The Pyramids in the morning light are incredible.',
        { category: 'Landmark', duration: '2.5–3 hrs', cost: 'medium', transport: ctx.gizaTransportNote, why: 'Must-see. Early entry means less heat and fewer crowds.' }),
      act('e_giza_sphinx', 'Great Sphinx',
        "Walk to the Sphinx and take in the view from the viewpoint below — one of Egypt's most iconic sights.",
        { category: 'Landmark', duration: '30–45 min', cost: 'low', transport: 'Walking from the pyramids complex', why: "Adjacent to the pyramids — don't miss it." }),
    ],
    afternoon: [
      act('e_giza_lunch', 'Lunch near Giza',
        isBudget
          ? 'Find a local lunch spot near the pyramids at a good price. Avoid the overpriced tourist traps.'
          : 'Find a comfortable lunch spot near the pyramids before heading back.',
        { category: 'Food', duration: '1 hr', cost: isBudget ? 'low' : 'medium', transport: 'Near pyramids area', why: 'Refuel after the morning walk.' }),
      act('e_giza_rest', 'Rest & Recover',
        'Return to your accommodation, rest during the hottest hours (2–4pm).',
        { category: 'Rest', duration: '2 hrs', cost: 'low', transport: 'At accommodation', why: 'Egyptian midday heat is intense. Smart to rest.' }),
    ],
    evening: [
      act('e_giza_eve', ctx.eveningTitle, ctx.eveningDescription,
        { category: 'Food & Neighbourhood', duration: '2–3 hrs', cost: isBudget ? 'low' : 'medium', transport: 'Walking or short Uber', why: 'A well-deserved evening after a big day.' }),
    ],
    alternatives: [
      act('e_giza_alt_gem', 'Grand Egyptian Museum (GEM)',
        "If the pyramids feel overwhelming, spend the morning at the Grand Egyptian Museum near Giza instead.",
        { category: 'Museum', duration: '2–3 hrs', cost: 'medium', transport: 'Uber/Careem to GEM, Giza', why: 'Equally fascinating, air-conditioned, and less physical.' }),
    ],
    estimatedCostLevel: isBudget ? 'low' : 'medium',
    transportSuggestion: ctx.gizaTransportNote + ' Walking in the evening.',
  };
}

function buildHistoricCairoDay(n: number, b: BudgetStyle): ItineraryDay {
  const isBudget = b === 'smart_budget';
  return {
    day: n,
    title: 'Historic Cairo & Old City',
    theme: 'Mosques, markets, and local lunch',
    summary: 'Explore Islamic Cairo — the bazaar, Al-Azhar Mosque, and a proper local lunch.',
    chips: ['Culture day', 'Moderate walking'],
    morning: [
      act('e_hcairo_khan', "Khan el-Khalili Bazaar",
        "Cairo's famous historic market. Perfect for souvenirs, spices, and street food.",
        { category: 'Market', duration: '1.5–2 hrs', cost: 'low', transport: 'Uber/Careem to Khan el-Khalili', why: 'Essential Cairo experience.' }),
      act('e_hcairo_azhar', 'Al-Azhar Mosque',
        "One of Cairo's most important mosques, a short walk from Khan el-Khalili.",
        { category: 'Historic', duration: '45 min', cost: 'low', transport: 'Walk from Khan el-Khalili', why: 'Free entry, deeply important historic site.' }),
    ],
    afternoon: [
      act('e_hcairo_lunch', 'Local Lunch in Old Cairo',
        isBudget
          ? 'Try koshary or local grilled dishes near Khan el-Khalili — some of the best-value food in Cairo.'
          : 'Try koshary or local grilled dishes near Khan el-Khalili.',
        { category: 'Food', duration: '1 hr', cost: 'low', transport: 'Near Khan el-Khalili', why: 'Authentic Egyptian food in a great setting.' }),
    ],
    evening: [
      act('e_hcairo_eve', 'Old Cairo Evening Walk',
        'The old city neighbourhood feels different after the tourist rush. Walk and discover at your own pace.',
        { category: 'Exploration', duration: '1–1.5 hrs', cost: 'low', transport: 'Walking in Old Cairo area', why: 'Relaxed and atmospheric end to the day.' }),
    ],
    alternatives: [
      act('e_hcairo_alt', 'Egyptian Museum (Cairo)',
        "If you prefer museums, the Egyptian Museum near Tahrir Square is world-class.",
        { category: 'Museum', duration: '2 hrs', cost: 'medium', transport: 'Uber to Tahrir Square', why: "Great alternative if you've already seen the bazaar." }),
    ],
    estimatedCostLevel: isBudget ? 'low' : 'medium',
    transportSuggestion: 'Uber/Careem to Old Cairo. Walking around the bazaar area.',
  };
}

function buildMuseumDay(n: number, b: BudgetStyle): ItineraryDay {
  const isBudget = b === 'smart_budget';
  const isPremium = b === 'premium_comfort';
  return {
    day: n,
    title: 'Egyptian Museum & Central Cairo',
    theme: 'Ancient history and central Cairo',
    summary: 'Spend the morning at the Egyptian Museum. Afternoon at the Cairo Citadel and Moez Street.',
    chips: ['Museum day', 'Moderate walking'],
    morning: [
      act('e_museum_main', 'Egyptian Museum',
        "The world's largest collection of ancient Egyptian artefacts. Budget 2–3 hours minimum.",
        { category: 'Museum', duration: '2.5–3 hrs', cost: 'medium', transport: 'Uber to Tahrir Square', why: "Unmissable. Includes Tutankhamun's treasures." }),
    ],
    afternoon: [
      act('e_museum_lunch', 'Lunch in Downtown Cairo',
        isBudget
          ? "Local cafes near Downtown Cairo offer authentic and affordable lunch."
          : "Explore Downtown Cairo's cafes for a relaxed lunch.",
        { category: 'Food', duration: '1–1.5 hrs', cost: isBudget ? 'low' : 'medium', transport: 'Walking from museum', why: 'Good local options at fair prices.' }),
      act('e_museum_citadel', 'Cairo Citadel',
        'Medieval fortress with a stunning mosque and panoramic city views.',
        { category: 'Historic', duration: '1.5–2 hrs', cost: 'medium', transport: 'Uber from Downtown (~15 min)', why: 'Great views and historic depth.' }),
    ],
    evening: [
      act('e_museum_moez', 'Moez Street — Golden Hour Walk',
        isPremium
          ? 'Walk through one of the oldest streets in the world during golden hour. Take your time.'
          : 'Walk through one of the oldest streets in the world during golden hour.',
        { category: 'Exploration', duration: '1.5 hrs', cost: 'low', transport: 'Walk from Citadel or short Uber', why: 'Beautiful atmosphere in the evening.' }),
    ],
    alternatives: [
      act('e_museum_alt', 'Grand Egyptian Museum (GEM)',
        "World-class modern museum near Giza — a great alternative if you want something different.",
        { category: 'Museum', duration: '2–3 hrs', cost: 'medium', transport: 'Uber to Giza (~35 min)', why: 'Air-conditioned, modern, world-class collection.' }),
    ],
    estimatedCostLevel: isBudget ? 'low' : 'medium',
    transportSuggestion: 'Uber throughout. Metro option from Tahrir for budget travellers.',
  };
}

function buildLocalCairoDay(n: number, b: BudgetStyle): ItineraryDay {
  const isBudget = b === 'smart_budget';
  return {
    day: n,
    title: 'Markets, Local Life & Hidden Cairo',
    theme: 'Explore like a local',
    summary: 'Skip the tourist trail. Find local markets, neighbourhood cafes, and authentic spots.',
    chips: ['Local food', 'Flexible'],
    morning: [
      act('e_local_coptic', 'Coptic Cairo',
        'Ancient Christian quarter with historic churches and the Coptic Museum.',
        { category: 'Historic', duration: '2 hrs', cost: isBudget ? 'low' : 'medium', transport: 'Metro: Coptic Cairo station, or Uber', why: 'Less touristy, deeply fascinating history.' }),
    ],
    afternoon: [
      act('e_local_koshary', 'Local Lunch — Koshary',
        "Try koshary, Egypt's beloved national dish, at a local spot. Cheap and delicious.",
        { category: 'Food', duration: '45 min', cost: 'low', transport: 'Near local area', why: 'Authentic, cheap, and delicious.' }),
      act('e_local_gem', 'Grand Egyptian Museum or Extra Cairo Time',
        "If you haven't visited the Grand Egyptian Museum yet, this is a great opportunity — or use the afternoon freely.",
        { category: 'Museum', duration: '2–3 hrs', cost: 'medium', transport: 'Uber to Giza (~35 min)', why: 'World-class, air-conditioned, modern experience.' }),
    ],
    evening: [
      act('e_local_eve', 'Nile-side Dinner or Cairo Evening',
        isBudget
          ? 'Find a local dinner spot near the Nile. Cairo evenings are atmospheric and affordable.'
          : 'End the day with a Nile-side dinner or explore a favourite Cairo neighbourhood.',
        { category: 'Food', duration: '2–3 hrs', cost: isBudget ? 'low' : 'medium', transport: 'Walking or short Uber', why: 'Great evening atmosphere in Cairo.' }),
    ],
    alternatives: [],
    estimatedCostLevel: isBudget ? 'low' : 'medium',
    transportSuggestion: 'Mix of Metro and Uber. Metro is affordable and practical for some routes.',
  };
}

// ── Luxor day builders ────────────────────────────────────────────────────────

function buildLuxorTravelDay(n: number, b: BudgetStyle): ItineraryDay {
  const isBudget = b === 'smart_budget';
  const isPremium = b === 'premium_comfort';
  return {
    day: n,
    title: 'Travel to Luxor & Karnak Temple',
    theme: 'Ancient temples on the Nile',
    summary: 'Fly or take a sleeper train to Luxor. Visit the magnificent Karnak Temple in the afternoon.',
    chips: ['Fly recommended', 'Book ahead'],
    morning: [
      act('e_lux_travel', 'Travel to Luxor',
        isPremium
          ? 'Fly from Cairo to Luxor (approximately 1 hour). The most comfortable way to reach Upper Egypt.'
          : isBudget
          ? 'Fly or take the overnight sleeper train from Cairo to Luxor. Domestic flight (1 hr) is recommended if budget allows.'
          : 'Fly from Cairo to Luxor (approximately 1 hour). Domestic flight is the most practical option.',
        { category: 'Transport', duration: '1 hr by air / overnight by train', cost: isBudget ? 'low' : 'medium', transport: 'Domestic flight from Cairo (EgyptAir) or overnight sleeper train', why: 'Luxor is the heart of ancient Egypt.' }),
    ],
    afternoon: [
      act('e_lux_karnak', 'Karnak Temple Complex',
        "The largest temple complex in the world. Arrive in the afternoon after getting settled in Luxor.",
        { category: 'Landmark', duration: '2–2.5 hrs', cost: 'medium', transport: 'Taxi or tuk-tuk from hotel', why: 'One of the most impressive ancient sites on Earth.' }),
    ],
    evening: [
      act('e_lux_corniche', 'Luxor Corniche Dinner',
        'Dinner along the Nile Corniche in Luxor. A calm evening in a beautiful riverside setting.',
        { category: 'Food', duration: '1.5–2 hrs', cost: isBudget ? 'low' : 'medium', transport: 'Walking from hotel', why: 'Relaxed evening in a quieter city.' }),
    ],
    alternatives: [
      act('e_lux_alt_rest', 'Rest if Travel Was Long',
        'If the journey took most of the day, skip Karnak and rest well before the West Bank tomorrow.',
        { category: 'Rest', duration: 'Flexible', cost: 'low', transport: 'At hotel', why: 'Better to be rested than rushed.' }),
    ],
    estimatedCostLevel: isBudget ? 'low' : 'medium',
    transportSuggestion: 'Domestic flight to Luxor recommended. Taxis and tuk-tuks in Luxor are easy.',
  };
}

function buildLuxorWestBankDay(n: number, b: BudgetStyle): ItineraryDay {
  const isBudget = b === 'smart_budget';
  const isPremium = b === 'premium_comfort';
  return {
    day: n,
    title: 'Luxor West Bank',
    theme: "Pharaohs, tombs, and ancient mysteries",
    summary: "Spend the day exploring the West Bank of Luxor — one of the richest archaeological areas on Earth.",
    chips: ['Best early', 'Active day'],
    morning: [
      act('e_wb_valley', 'Valley of the Kings',
        'Explore the royal tombs of ancient pharaohs. Go early — it gets very hot by midday.',
        { category: 'Landmark', duration: '2.5 hrs', cost: 'medium', transport: isPremium ? 'Private driver or guided tour to West Bank' : 'Organised tour or private driver to West Bank', why: "One of Egypt's top historic experiences." }),
      act('e_wb_hat', 'Temple of Hatshepsut',
        "Stunning mortuary temple carved into the cliffside — architecturally unique and less crowded.",
        { category: 'Landmark', duration: '1 hr', cost: 'medium', transport: 'Included in West Bank tour', why: 'Architecturally incredible. Less crowded than the Valley.' }),
    ],
    afternoon: [
      act('e_wb_colossi', 'Colossi of Memnon',
        'Quick stop at the iconic standing statues of Amenhotep III.',
        { category: 'Landmark', duration: '30 min', cost: 'low', transport: 'On the way back from West Bank', why: 'Free and impressive — a great photo stop.' }),
    ],
    evening: [
      act('e_wb_luxtemple', 'Luxor Temple at Sunset',
        'Visit Luxor Temple as the sun sets — the lighting is extraordinary.',
        { category: 'Landmark', duration: '1.5 hrs', cost: 'medium', transport: 'Walking from Corniche or short taxi', why: 'Sunset at Luxor Temple is magical.' }),
    ],
    alternatives: [
      act('e_wb_alt_museum', 'Luxor Museum',
        'A smaller, well-curated museum if you prefer a calmer afternoon after the West Bank.',
        { category: 'Museum', duration: '1–1.5 hrs', cost: 'medium', transport: 'Taxi from West Bank ferry', why: 'Excellent collection, never overcrowded.' }),
    ],
    estimatedCostLevel: isBudget ? 'low' : 'medium',
    transportSuggestion: isPremium
      ? 'Private driver recommended for West Bank efficiency and comfort.'
      : 'Private driver or organised tour for West Bank efficiency.',
  };
}

// ── Aswan day builders ────────────────────────────────────────────────────────

function buildAswanArrivalDay(n: number, b: BudgetStyle): ItineraryDay {
  const isBudget = b === 'smart_budget';
  const isPremium = b === 'premium_comfort';
  return {
    day: n,
    title: 'Travel to Aswan & Philae Temple',
    theme: 'Nile beauty and Nubian culture',
    summary: 'Travel to Aswan and visit the beautiful island temple of Philae.',
    chips: ['Nile setting', 'Scenic travel'],
    morning: [
      act('e_asw_travel', 'Travel to Aswan',
        isBudget
          ? 'Take the train from Luxor to Aswan (approximately 3 hours) — a scenic and affordable journey.'
          : isPremium
          ? 'Travel to Aswan by train or short flight. The Nile scenery along the way is beautiful.'
          : 'Travel to Aswan by train from Luxor (approximately 3 hours). Comfortable and scenic.',
        { category: 'Transport', duration: '3–4 hrs by train', cost: isBudget ? 'low' : 'medium', transport: 'Train from Luxor or domestic flight', why: 'Aswan is the gateway to Nubia and Abu Simbel.' }),
    ],
    afternoon: [
      act('e_asw_philae', 'Philae Temple',
        "An ancient island temple dedicated to Isis — one of Egypt's most beautiful sites, reached by a short boat ride.",
        { category: 'Landmark', duration: '1.5–2 hrs', cost: 'medium', transport: 'Taxi to Philae boat dock, then short boat ride', why: 'Extraordinarily beautiful Nile island setting.' }),
    ],
    evening: [
      act('e_asw_felucca', 'Felucca Sail or Nile Corniche Evening',
        "A felucca sunset sail on the Nile is Aswan's most iconic experience. Book at the waterfront.",
        { category: 'Exploration', duration: '1.5 hrs', cost: isBudget ? 'low' : 'medium', transport: 'Walking to Nile Corniche', why: "Aswan's Nile is calmer and more beautiful than Cairo's." }),
    ],
    alternatives: [
      act('e_asw_alt_nubian', 'Nubian Village Visit',
        'A colourful Nubian village by boat — a culturally rich and photogenic alternative.',
        { category: 'Cultural', duration: '2–3 hrs', cost: 'medium', transport: 'Arranged boat tour', why: 'More personal and culturally immersive Aswan experience.' }),
    ],
    estimatedCostLevel: isBudget ? 'low' : 'medium',
    transportSuggestion: 'Train from Luxor is comfortable and scenic. Taxis in Aswan are easy to find.',
  };
}

function buildAbuSimbelDay(n: number, b: BudgetStyle): ItineraryDay {
  const isBudget = b === 'smart_budget';
  const isPremium = b === 'premium_comfort';
  return {
    day: n,
    title: 'Abu Simbel — The Iconic Egypt Moment',
    theme: 'The most dramatic ancient temples in Egypt',
    summary: "A day trip from Aswan to Abu Simbel — one of Egypt's most extraordinary ancient sites.",
    chips: ['Book ahead', 'Early start'],
    morning: [
      act('e_abu_trip', 'Abu Simbel Day Trip',
        isPremium
          ? 'Fly to Abu Simbel (40 min from Aswan) for the most comfortable experience. Or join an early morning guided tour.'
          : 'Join an early morning group tour from Aswan to Abu Simbel (approximately 3.5 hrs by road, or short flight).',
        { category: 'Day Trip', duration: 'Full day including travel', cost: isPremium ? 'high' : 'medium', transport: isPremium ? 'Short flight from Aswan recommended, or private driver' : 'Group tour from Aswan or private driver', why: 'Abu Simbel is one of the most extraordinary ancient sites on Earth.' }),
    ],
    afternoon: [
      act('e_abu_return', 'Return to Aswan & Rest',
        'Return to Aswan after the day trip. Rest in the afternoon — Abu Simbel days are long.',
        { category: 'Rest', duration: 'Flexible', cost: 'low', transport: 'Return with tour group or driver', why: 'Recovery time after a full day trip.' }),
    ],
    evening: [
      act('e_abu_dinner', 'Special Aswan Dinner',
        isPremium
          ? 'Treat yourself to a Nile-view dinner in Aswan — a well-earned end to a remarkable day.'
          : 'Find a good dinner spot in Aswan after your Abu Simbel day.',
        { category: 'Food', duration: '2 hrs', cost: isPremium ? 'high' : 'medium', transport: 'Walking or short taxi', why: 'A memorable end to a remarkable day.' }),
    ],
    alternatives: [
      act('e_abu_alt_aswan', 'Relaxed Aswan Day Instead',
        "If Abu Simbel feels like too much, use this day for a slower Aswan experience — Nubian village, High Dam, or the Nile.",
        { category: 'Cultural', duration: 'Flexible', cost: 'low', transport: 'Taxi around Aswan', why: 'Aswan itself is beautiful and worth a slower day.' }),
    ],
    estimatedCostLevel: isPremium ? 'high' : 'medium',
    transportSuggestion: 'Early morning departure is essential. Book your tour or driver the night before.',
  };
}

// ── Cairo return / departure builders ────────────────────────────────────────

function buildReturnCairoDay(n: number, ctx: CairoContext, b: BudgetStyle): ItineraryDay {
  const isBudget = b === 'smart_budget';
  return {
    day: n,
    title: 'Return to Cairo',
    theme: 'Back to Cairo for the final stretch',
    summary: 'Return to Cairo from Luxor or Aswan. Light afternoon and final Cairo evening.',
    chips: ['Travel day', 'Easy evening'],
    morning: [
      act('e_ret_fly', 'Fly Back to Cairo',
        'Morning flight from Luxor or Aswan back to Cairo.',
        { category: 'Transport', duration: '1–1.5 hrs', cost: 'medium', transport: 'Domestic flight back to Cairo', why: 'Necessary connection for your final Cairo day.' }),
    ],
    afternoon: [
      act('e_ret_settle', 'Settle Back in Cairo',
        'Return to your Cairo base, freshen up, and take a gentle afternoon.',
        { category: 'Rest', duration: 'Flexible', cost: 'low', transport: ctx.arrivalTransportNote, why: 'Recovery time after travel before the final evening.' }),
    ],
    evening: [
      act('e_ret_eve', ctx.eveningTitle, ctx.eveningDescription,
        { category: 'Food & Neighbourhood', duration: '2–3 hrs', cost: isBudget ? 'low' : 'medium', transport: 'Walking or short Uber', why: 'A final Cairo evening to soak it all in.' }),
    ],
    alternatives: [
      act('e_ret_alt', 'Nile Dinner or Hotel Evening',
        'If tired from travel, a relaxed hotel dinner or Nile-side restaurant is the right call.',
        { category: 'Rest', duration: 'Flexible', cost: 'medium', transport: 'Near accommodation', why: 'Keep it simple on a travel day.' }),
    ],
    estimatedCostLevel: isBudget ? 'low' : 'medium',
    transportSuggestion: `Domestic flight to Cairo. ${ctx.arrivalTransportNote}`,
  };
}

function buildDepartureDay(n: number, ctx: CairoContext, b: BudgetStyle): ItineraryDay {
  const isBudget = b === 'smart_budget';
  const morningWalkDesc = ctx.displayName
    ? `Final quiet walk or local breakfast near ${ctx.displayName}. Cairo feels different in the morning.`
    : 'Final quiet walk or local breakfast. Cairo feels different in the morning.';
  return {
    day: n,
    title: 'Final Morning & Departure',
    theme: 'Last Cairo moments before heading home',
    summary: 'Last morning to soak it all in, final shopping, and head to the airport.',
    chips: ['Easy day', isBudget ? 'Budget-friendly' : 'Last morning'],
    morning: [
      act('e_dep_walk', 'Final Walk or Breakfast',
        morningWalkDesc,
        { category: 'Exploration', duration: '45 min–1 hr', cost: 'low', transport: 'Walking', why: 'Simple and memorable final morning.' }),
      act('e_dep_souvenirs', 'Final Souvenirs',
        'Last chance for papyrus art, cartouche jewellery, or spice packets.',
        { category: 'Shopping', duration: '45 min', cost: 'medium', transport: 'Khan el-Khalili or hotel gift shop', why: "Don't forget gifts for people back home." }),
    ],
    afternoon: [
      act('e_dep_airport', 'Hotel Checkout & Airport Departure',
        'Pack, check out, and head to Cairo Airport for departure. Allow 3+ hours.',
        { category: 'Transport', duration: '3+ hrs', cost: 'medium', transport: 'Uber/Careem or hotel transfer. Allow 3+ hours.', why: "Never rush a Cairo airport departure." }),
    ],
    evening: [],
    alternatives: [],
    estimatedCostLevel: 'low',
    transportSuggestion: 'Uber/Careem to airport. Book in advance during rush hour.',
  };
}

// ── Route assembler ───────────────────────────────────────────────────────────

/**
 * Selects and orders the right set of days based on trip duration.
 *
 * Route logic:
 *  1–2 days  → Cairo/Giza highlights only
 *  3–4 days  → Cairo/Giza + Historic Cairo + Museum
 *  5 days    → Cairo/Giza + Historic Cairo + Museum + local day
 *  6 days    → Cairo/Giza + Historic Cairo + Museum + Luxor intro + Luxor West Bank
 *  7 days    → above + Aswan arrival
 *  8 days    → above + departure from Aswan/Cairo
 *  9 days    → above + Abu Simbel + departure
 *  10 days   → full Egypt circuit (Cairo → Luxor → Aswan → Abu Simbel → Cairo return → departure)
 *  11+ days  → full circuit + extra local Cairo day + flexible overflow
 */
function assembleRoute(
  durationDays: number,
  ctx: CairoContext,
  b: BudgetStyle,
  s: TravelStyle
): ItineraryDay[] {
  const pool: ItineraryDay[] = [];

  const arrival   = () => buildArrivalDay(pool.length + 1, ctx, b);
  const giza      = () => buildGizaDay(pool.length + 1, ctx, b);
  const historic  = () => buildHistoricCairoDay(pool.length + 1, b);
  const museum    = () => buildMuseumDay(pool.length + 1, b);
  const local     = () => buildLocalCairoDay(pool.length + 1, b);
  const luxTravel = () => buildLuxorTravelDay(pool.length + 1, b);
  const luxWB     = () => buildLuxorWestBankDay(pool.length + 1, b);
  const aswan     = () => buildAswanArrivalDay(pool.length + 1, b);
  const abu       = () => buildAbuSimbelDay(pool.length + 1, b);
  const retCairo  = () => buildReturnCairoDay(pool.length + 1, ctx, b);
  const departure = () => buildDepartureDay(pool.length + 1, ctx, b);

  const push = (...builders: (() => ItineraryDay)[]): void => {
    for (const build of builders) {
      if (pool.length < durationDays) pool.push(build());
    }
  };

  if (durationDays <= 2) {
    push(arrival, giza);
    return pool;
  }

  if (durationDays <= 4) {
    push(arrival, giza, historic, museum);
    return pool;
  }

  if (durationDays === 5) {
    push(arrival, giza, historic, museum, local);
    return pool;
  }

  if (durationDays === 6) {
    push(arrival, giza, historic, museum, luxTravel, luxWB);
    return pool;
  }

  if (durationDays === 7) {
    push(arrival, giza, historic, museum, luxTravel, luxWB, aswan);
    return pool;
  }

  if (durationDays === 8) {
    push(arrival, giza, historic, museum, luxTravel, luxWB, aswan, departure);
    return pool;
  }

  if (durationDays === 9) {
    push(arrival, giza, historic, museum, luxTravel, luxWB, aswan, abu, departure);
    return pool;
  }

  if (durationDays === 10) {
    push(arrival, giza, historic, museum, luxTravel, luxWB, aswan, abu, retCairo, departure);
    return pool;
  }

  // 11+ days: full circuit with extra Cairo local day + flexible overflow
  push(arrival, giza, historic, museum, local, luxTravel, luxWB, aswan, abu, retCairo, departure);

  // Fill any remaining days with a flexible day
  while (pool.length < durationDays) {
    const n = pool.length + 1;
    pool.push({
      day: n,
      title: 'Extra Day — Flexible',
      theme: 'Use this day as you prefer',
      summary: 'Extra day for rest, revisiting a favourite place, or a day trip.',
      chips: ['Flexible', 'Your choice'],
      morning: [
        act(`e_extra${n}_m`, 'Flexible Morning',
          'Revisit a favourite spot, explore something new, or take it easy.',
          { category: 'Flexible', duration: 'Flexible', cost: 'low', transport: 'As needed', why: 'Extra days are rare — enjoy them.' }),
      ],
      afternoon: [],
      evening: [],
      alternatives: [],
      estimatedCostLevel: 'low',
      transportSuggestion: 'As needed.',
    });
  }

  return pool;
}

// ── Post-processing modifiers ─────────────────────────────────────────────────

function applyBudgetModifiers(days: ItineraryDay[], budget: BudgetStyle): ItineraryDay[] {
  if (budget === 'smart_budget') {
    return days.map((day) => ({
      ...day,
      chips: day.chips?.map((c) => (c === 'Fly recommended' ? 'Budget transport' : c)),
      estimatedCostLevel:
        day.estimatedCostLevel === 'high' ? 'medium' : day.estimatedCostLevel,
    }));
  }

  if (budget === 'premium_comfort') {
    return days.map((day) => {
      // Add "Premium pace" chip only to Cairo/Giza days (where pacing matters most)
      const isCairoDay = day.day <= 5 &&
        !day.title.includes('Luxor') &&
        !day.title.includes('Aswan') &&
        !day.title.includes('Abu Simbel');
      const chips = day.chips ?? [];
      return {
        ...day,
        chips: isCairoDay && !chips.includes('Premium pace')
          ? [...chips, 'Premium pace'].slice(0, 3)
          : chips,
      };
    });
  }

  return days;
}

function applyStyleModifiers(days: ItineraryDay[], style: TravelStyle): ItineraryDay[] {
  return days.map((day) => {
    if (style === 'relaxed_safe' || style === 'romantic') {
      return {
        ...day,
        chips: day.chips?.map((c) =>
          c === 'High walking' ? 'Moderate walking' : c === 'Active day' ? 'Relaxed pace' : c
        ),
      };
    }

    if (style === 'explore_like_local' || style === 'food_local') {
      if (day.title.includes('Markets') || day.title.includes('Historic Cairo')) {
        const chips = (day.chips ?? []).filter((c) => c !== 'Moderate walking');
        return {
          ...day,
          chips: [...chips, 'Local food'].slice(0, 3),
        };
      }
    }

    if (style === 'history_culture') {
      if (
        day.title.includes('Museum') ||
        day.title.includes('Karnak') ||
        day.title.includes('West Bank')
      ) {
        const chips = (day.chips ?? []).filter((c) => c !== 'Active day');
        return {
          ...day,
          chips: [...chips, 'Heritage'].slice(0, 3),
        };
      }
    }

    if (style === 'adventure') {
      if (day.title.includes('Abu Simbel')) {
        return {
          ...day,
          chips: ['Must-do', 'Book ahead', 'Early start'].slice(0, 3),
        };
      }
    }

    return day;
  });
}

// ── Public export ─────────────────────────────────────────────────────────────

export function generateEgyptItinerary(
  durationDays: number,
  budgetStyle: BudgetStyle,
  travelStyle: TravelStyle,
  stayArea: StayAreaId | null = null
): ItineraryDay[] {
  const cairoCtx = getCairoBaseContext(stayArea);
  const days = assembleRoute(durationDays, cairoCtx, budgetStyle, travelStyle);
  const withBudget = applyBudgetModifiers(days, budgetStyle);
  return applyStyleModifiers(withBudget, travelStyle);
}
