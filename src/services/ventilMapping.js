/**
 * Ventil Mapping Service
 * Provides mapping between S-CH Art.-Nr. and Parker data
 */

export const VENTIL_MAPPINGS = {
  '1225853': {
    label: '1225853 (Unterdeckung)',
    parkerArtNr: 'D1FP E55M H 9 N B 7 0',
    nenndurchfluss: 'Qn = 32 l/min'
  },
  '1109774': {
    label: '1109774',
    parkerArtNr: 'D1FP E50F H 9 N B 7 0',
    nenndurchfluss: 'Qn = 12 l/min'
  },
  '1103015': {
    label: '1103015',
    parkerArtNr: 'D1FP E50H J 9 N B 7 0',
    nenndurchfluss: 'Qn = 25 l/min'
  },
  '1102710': {
    label: '1102710',
    parkerArtNr: 'D1FP E50H H 9 N B 7 0',
    nenndurchfluss: 'Qn = 25 l/min'
  },
  '1022508': {
    label: '1022508',
    parkerArtNr: 'D1FP E50M H 9 N B 7 0',
    nenndurchfluss: 'Qn = 32 l/min'
  }
};

export const MASCHINEN_TYPEN = [
  'GAA100',
  'GAAS80', 
  'GAA60',
  'AMS60',
  'AMS100',
  'AMS200'
];

export const getVentilOptions = () => {
  return Object.keys(VENTIL_MAPPINGS).map(key => ({
    value: key,
    label: VENTIL_MAPPINGS[key].label
  }));
};

export const getParkerData = (schArtNr) => {
  const mapping = VENTIL_MAPPINGS[schArtNr];
  if (!mapping) {
    return {
      parkerArtNr: '',
      nenndurchfluss: ''
    };
  }
  
  return {
    parkerArtNr: mapping.parkerArtNr,
    nenndurchfluss: mapping.nenndurchfluss
  };
};

export const validateVentilSelection = (schArtNr) => {
  return VENTIL_MAPPINGS.hasOwnProperty(schArtNr);
};