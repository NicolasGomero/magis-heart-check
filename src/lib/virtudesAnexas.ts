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

// Lista cerrada de virtudes anexas "principales" (11 opciones exactas)
export const VIRTUDES_ANEXAS_PRINCIPALES: string[] = [
  'Religión',
  'Humildad',
  'Paciencia',
  'Gratitud',
  'Afabilidad',
  'Constancia',
  'Liberalidad',
  'Magnanimidad',
  'Continencia',
  'Mansedumbre',
  'Misericordia',
];

// @deprecated - Use VIRTUDES_ANEXAS_PRINCIPALES instead
export const VIRTUDES_ANEXAS_INICIAL = VIRTUDES_ANEXAS_PRINCIPALES;
