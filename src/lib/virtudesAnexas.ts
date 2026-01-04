// Virtudes morales anexas agrupadas por cardinal

export interface VirtudAnexaGroup {
  cardinal: string;
  virtudes: string[];
}

export const VIRTUDES_ANEXAS_POR_CARDINAL: VirtudAnexaGroup[] = [
  {
    cardinal: 'Prudencia',
    virtudes: [
      'Prudencia de memoria',
      'Prudencia de inteligencia',
      'Docilidad',
      'Eutosquia',
      'Sagacidad',
      'Prudencia de razón',
      'Providencia o previsión',
      'Circunspección',
      'Precaución',
      'Prudencia monástica',
      'Prudencia gubernativa',
      'Prudencia política',
      'Prudencia económica',
      'Eubulia',
      'Synesis',
      'Gnome',
    ],
  },
  {
    cardinal: 'Justicia',
    virtudes: [
      'Religión',
      'Piedad',
      'Observancia',
      'Dulía',
      'Obediencia',
      'Reverencia o respeto',
      'Veracidad',
      'Fidelidad',
      'Simplicidad',
      'Fraternidad',
      'Justicia integral',
      'Caridad',
      'Misericordia',
      'Justicia legal',
      'Justicia distributiva',
      'Justicia conmutativa',
      'Caridad social',
      'Equidad o epiqueya',
      'Gratitud',
      'Afabilidad',
      'Liberalidad',
    ],
  },
  {
    cardinal: 'Fortaleza',
    virtudes: [
      'Magnanimidad',
      'Magnificencia',
      'Paciencia',
      'Longanimidad',
      'Perseverancia',
      'Constancia',
    ],
  },
  {
    cardinal: 'Templanza',
    virtudes: [
      'Honestidad',
      'Abstinencia',
      'Sobriedad',
      'Castidad',
      'Pudor',
      'Virginidad',
      'Continencia',
      'Mansedumbre',
      'Clemencia',
      'Modestia',
      'Humildad',
      'Estudiosidad',
      'Compostura o modestia corporal',
      'Eutrapelia',
      'Decoro o modestia en el ornato',
    ],
  },
];

// Flat list of all virtudes anexas
export const ALL_VIRTUDES_ANEXAS = VIRTUDES_ANEXAS_POR_CARDINAL.flatMap(g => g.virtudes);

// Initial virtudes shown (first 5)
export const VIRTUDES_ANEXAS_INICIAL = [
  'Religión',
  'Magnanimidad',
  'Paciencia',
  'Humildad',
  'Honestidad',
];
