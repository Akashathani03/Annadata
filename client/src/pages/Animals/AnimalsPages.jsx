import PlaceholderPage from '../../components/common/PlaceholderPage';

// Buy Animals is explicitly out of scope for this pass - Sell Animals
// is fully built (see SellAnimals/ folder). This placeholder stays
// until Buy Animals is built next, following the same pattern Buy
// Crops used relative to Sell Crop.
export function BuyAnimals() {
  return <PlaceholderPage icon="🛒" titleKey="navigation:animals.buyAnimal" />;
}
