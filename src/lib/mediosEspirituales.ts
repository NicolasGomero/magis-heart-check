// Medios espirituales completos agrupados en bloques

export interface MedioEspiritualBloque {
  titulo: string;
  medios: string[];
}

export const MEDIOS_ESPIRITUALES_BLOQUES: MedioEspiritualBloque[] = [
  {
    titulo: 'Fundamentos de la vida espiritual',
    medios: [
      'Inhabitación trinitaria',
      'Configuración con Jesucristo',
      'Devoción a María',
      'Amor a la Iglesia',
      'Gracia santificante',
    ],
  },
  {
    titulo: 'Dones del Espíritu Santo',
    medios: [
      'Don de sabiduría',
      'Don de entendimiento',
      'Don de consejo',
      'Don de fortaleza',
      'Don de ciencia',
      'Don de piedad',
      'Don de temor de Dios',
      'Gracias actuales',
    ],
  },
  {
    titulo: 'Lucha espiritual',
    medios: [
      'Lucha contra el pecado mortal',
      'Lucha contra el pecado venial',
      'Lucha contra las imperfecciones voluntarias',
      'Lucha contra el mundo',
      'Lucha contra el demonio',
      'Lucha contra la propia carne',
    ],
  },
  {
    titulo: 'Purificación',
    medios: [
      'Purificación sentidos externos',
      'Purificación de sentidos internos',
      'Purificación de pasiones',
      'Purificación del entendimiento',
      'Purificación de la voluntad',
      'Noche de sentido',
      'Noche del espíritu',
    ],
  },
  {
    titulo: 'Vida sacramental',
    medios: [
      'Exigencias bautismales',
      'Sacerdocio común',
      'Disposiciones para la Reconciliación',
      'Virtud de la penitencia',
      'Espíritu de compunción',
      'Santa Misa',
      'Disposiciones para la misa',
      'Disposiciones para comulgar',
      'Acción de gracias',
      'Comunión espiritual',
      'Visitas al Santísimo',
      'Vida sacerdotal',
      'Matrimonio',
    ],
  },
  {
    titulo: 'Virtud de la religión',
    medios: [
      'Devoción',
      'Adoración',
      'Sacrificio',
      'Ofrendas u oblaciones',
      'Juramento',
      'Conjuro',
      'Invocación del nombre de Dios',
    ],
  },
  {
    titulo: 'Oración',
    medios: [
      'Oración Mental',
      'Oración Litúrgica',
      'Contemplación',
      'Presencia de Dios',
      'Examen de conciencia',
    ],
  },
  {
    titulo: 'Vida interior',
    medios: [
      'Energía de carácter',
      'Deseo de perfección',
      'Conformidad con la voluntad de Dios',
      'Fidelidad a la gracia',
      'Mejora del propio temperamento',
      'Plan de vida',
      'Lectura espiritual',
      'Amistades santas',
      'Apostolado',
      'Dirección espiritual',
      'Discernimiento de los espíritus',
      'Enamoramiento de Jesucristo en la Eucaristía',
      'Espíritu de vigilancia',
      'Conocimiento de la fe',
      'Ejercicios Anuales',
    ],
  },
  {
    titulo: 'Pilares del guerrero',
    medios: [
      'Guerrero',
      'Monje',
      'Amigo del Saber',
      'Cabeza Fría',
      'Corazón Ardiente',
      'Conciencia Clara',
      'RSC',
      'Alegría',
    ],
  },
  {
    titulo: 'Vida religiosa - La regla',
    medios: [
      'Fe en la regla',
      'Confianza en la regla',
      'Amor a la regla',
      'Culto externo de la regla',
    ],
  },
  {
    titulo: 'Vida religiosa - Pobreza',
    medios: [
      'No poseer como propio',
      'No disponer sin permiso',
      'Vivir pobremente',
    ],
  },
  {
    titulo: 'Vida religiosa - Castidad',
    medios: [
      'Vigilancia y castidad',
      'Mortificación y castidad',
      'Pudor y castidad',
      'Oración y castidad',
      'Reconciliación y castidad',
      'Eucaristía y castidad',
      'María y la castidad',
    ],
  },
  {
    titulo: 'Vida religiosa - Obediencia',
    medios: [
      'Obediencia de ejecución',
      'Obediencia de voluntad',
      'Obediencia de juicio',
    ],
  },
  {
    titulo: 'Vida religiosa - Fraternidad y silencio',
    medios: [
      'Caridad fraterna',
      'Espíritu de fe',
      'Soledad',
      'Silencio exterior',
      'Silencio interior',
      'Recogimiento',
      'Vida interior',
      'Abnegación',
      'Trabajo del religioso',
      'Apostolado',
    ],
  },
];

// Flat list of all medios espirituales
export const ALL_MEDIOS_ESPIRITUALES = MEDIOS_ESPIRITUALES_BLOQUES.flatMap(b => b.medios);

// Initial medios shown (first 10)
export const MEDIOS_ESPIRITUALES_INICIAL = [
  'Abnegación',
  'María',
  'Liturgia',
  'Oración',
  'Espíritu de Vigilancia',
  'Amigo del Saber',
  'Caridad fraterna',
  'Espíritu de Servicio',
  'Mortificación',
  'Silencio',
];
