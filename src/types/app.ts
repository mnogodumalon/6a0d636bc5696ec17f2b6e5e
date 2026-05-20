// AUTOMATICALLY GENERATED TYPES - DO NOT EDIT

export type LookupValue = { key: string; label: string };
export type GeoLocation = { lat: number; long: number; info?: string };

export interface FeierDerZahl1 {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    vorname?: string;
    nachname?: string;
    datum_feier?: string; // Format: YYYY-MM-DD oder ISO String
    ort?: string;
    teilnehmerzahl?: number;
    anlass?: LookupValue;
    botschaft?: string;
    foto?: string;
  };
}

export const APP_IDS = {
  FEIER_DER_ZAHL_1: '6a0d636013c22e1dc16fc816',
} as const;


export const LOOKUP_OPTIONS: Record<string, Record<string, {key: string, label: string}[]>> = {
  'feier_der_zahl_1': {
    anlass: [{ key: "erster_geburtstag", label: "Erster Geburtstag" }, { key: "erster_jahrestag", label: "Erster Jahrestag" }, { key: "erster_arbeitstag", label: "Erster Arbeitstag" }, { key: "erster_schultag", label: "Erster Schultag" }, { key: "sonstiges", label: "Sonstiges" }],
  },
};

export const FIELD_TYPES: Record<string, Record<string, string>> = {
  'feier_der_zahl_1': {
    'vorname': 'string/text',
    'nachname': 'string/text',
    'datum_feier': 'date/datetimeminute',
    'ort': 'string/text',
    'teilnehmerzahl': 'number',
    'anlass': 'lookup/select',
    'botschaft': 'string/textarea',
    'foto': 'file',
  },
};

type StripLookup<T> = {
  [K in keyof T]: T[K] extends LookupValue | undefined ? string | LookupValue | undefined
    : T[K] extends LookupValue[] | undefined ? string[] | LookupValue[] | undefined
    : T[K];
};

// Helper Types for creating new records (lookup fields as plain strings for API)
export type CreateFeierDerZahl1 = StripLookup<FeierDerZahl1['fields']>;