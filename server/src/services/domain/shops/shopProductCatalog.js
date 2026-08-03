// Ported from the frontend's config/shopProductCatalog.js - only the
// fields needed for search matching (id/name/kannadaName). This stays
// a static constant, not a database model, for the same reason
// agroAIConfig.js stayed static: it's fixed reference/presentation
// data, not something meant to be dynamic or admin-edited.
export const shopProductCatalog = [
  { id: 'tomato_seed', name: 'Tomato Seeds', kannadaName: 'ಟೊಮ್ಯಾಟೊ ಬೀಜ' },
  { id: 'onion_seed', name: 'Onion Seeds', kannadaName: 'ಈರುಳ್ಳಿ ಬೀಜ' },
  { id: 'paddy_seed', name: 'Paddy Seeds', kannadaName: 'ಭತ್ತದ ಬೀಜ' },
  { id: 'maize_seed', name: 'Maize Seeds', kannadaName: 'ಮೆಕ್ಕೆಜೋಳ ಬೀಜ' },
  { id: 'urea', name: 'Urea', kannadaName: 'ಯೂರಿಯಾ' },
  { id: 'dap', name: 'DAP', kannadaName: 'ಡಿಎಪಿ' },
  { id: 'npk', name: 'NPK Complex', kannadaName: 'ಎನ್\u200cಪಿಕೆ' },
  { id: 'vermicompost', name: 'Vermicompost', kannadaName: 'ಎರೆಹುಳು ಗೊಬ್ಬರ' },
  { id: 'insecticide', name: 'Insecticide', kannadaName: 'ಕೀಟನಾಶಕ' },
  { id: 'fungicide', name: 'Fungicide', kannadaName: 'ಶಿಲೀಂಧ್ರನಾಶಕ' },
  { id: 'weedicide', name: 'Weedicide', kannadaName: 'ಕಳೆನಾಶಕ' },
  { id: 'sprayer', name: 'Sprayer', kannadaName: 'ಸ್ಪ್ರೇಯರ್' },
  { id: 'sickle', name: 'Sickle', kannadaName: 'ಕುಡುಗೋಲು' },
  { id: 'tarpaulin', name: 'Tarpaulin', kannadaName: 'ತಾಡಪಾಲು' },
];
