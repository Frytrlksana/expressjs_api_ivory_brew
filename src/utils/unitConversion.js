/**
 * Utilitas Konversi Satuan Antara Resep (BOM) dan Stok Bahan Baku
 *
 * Standar Satuan Ivory Brew:
 * - Berat: 1 kg = 1000 g
 * - Volume: 1 liter = 1000 ml
 * - Sirup: 1 pump = 10 ml = 0.01 liter
 * - Kopi Espresso: 1 shot = 18 gram biji kopi = 0.018 kg
 * - Non-cairan/Pieces: 1 pcs = 1 pcs
 */
const convertRecipeQuantityToMaterialStock = (recipeQuantity, recipeUnit, materialUnit) => {
  const qty = Number(recipeQuantity);
  const rUnit = String(recipeUnit || '').toLowerCase().trim();
  const mUnit = String(materialUnit || '').toLowerCase().trim();

  // Jika satuan sama, tidak perlu konversi
  if (rUnit === mUnit) {
    return qty;
  }

  // 1. Gram (g) ke Kilogram (kg)
  if (rUnit === 'g' && mUnit === 'kg') {
    return qty / 1000;
  }
  if (rUnit === 'kg' && mUnit === 'g') {
    return qty * 1000;
  }

  // 2. Mililiter (ml) ke Liter (liter)
  if (rUnit === 'ml' && (mUnit === 'liter' || mUnit === 'l')) {
    return qty / 1000;
  }
  if ((rUnit === 'liter' || rUnit === 'l') && mUnit === 'ml') {
    return qty * 1000;
  }

  // 3. Sirup: Pump ke Liter / ml
  if (rUnit === 'pump') {
    if (mUnit === 'liter' || mUnit === 'l') {
      return (qty * 10) / 1000; // 1 pump = 10 ml = 0.01 liter
    }
    if (mUnit === 'ml') {
      return qty * 10;
    }
    if (mUnit === 'pcs' || mUnit === 'pack') {
      return qty; // 1 pump diasumsikan 1 unit bila material unit pump/pcs
    }
  }

  // 4. Espresso: Shot ke kg / g
  if (rUnit === 'shot') {
    if (mUnit === 'kg') {
      return (qty * 18) / 1000; // 1 shot = 18g biji kopi = 0.018 kg
    }
    if (mUnit === 'g') {
      return qty * 18;
    }
    if (mUnit === 'pcs') {
      return qty;
    }
  }

  // 5. Cup / Tutup / Sedotan: pcs ke pack
  if (rUnit === 'pcs' && mUnit === 'pack') {
    // Jika bahan baku dihitung per pack (misal 1 pack isi 50 pcs)
    return qty / 50;
  }

  // Default: rasio 1:1 jika tidak ada aturan konversi khusus
  return qty;
};

module.exports = {
  convertRecipeQuantityToMaterialStock,
};
