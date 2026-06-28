export const GOVERNORATES = [
  { id: "damascus", en: "Damascus", ar: "دمشق" },
  { id: "rif_dimashq", en: "Rif Dimashq", ar: "ريف دمشق" },
  { id: "aleppo", en: "Aleppo", ar: "حلب" },
  { id: "homs", en: "Homs", ar: "حمص" },
  { id: "hama", en: "Hama", ar: "حماة" },
  { id: "latakia", en: "Latakia", ar: "اللاذقية" },
  { id: "tartus", en: "Tartus", ar: "طرطوس" },
  { id: "idlib", en: "Idlib", ar: "إدلب" },
  { id: "daraa", en: "Daraa", ar: "درعا" },
  { id: "as_suwayda", en: "As-Suwayda", ar: "السويداء" },
  { id: "quneitra", en: "Quneitra", ar: "القنيطرة" },
  { id: "deir_ez_zor", en: "Deir ez-Zor", ar: "دير الزور" },
  { id: "al_hasakah", en: "Al-Hasakah", ar: "الحسكة" },
  { id: "raqqa", en: "Raqqa", ar: "الرقة" },
] as const;

export type GovernorateId = (typeof GOVERNORATES)[number]["id"];
