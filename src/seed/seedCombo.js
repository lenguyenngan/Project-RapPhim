// src/seed/seedCombo.js
import Combo from "../model/Combo.js";
import { comboData } from "../data/combos.js";

const seedCombos = async () => {
  try {
    const existingCount = await Combo.countDocuments();
    if (existingCount > 0) {
      console.log("✅ Combo đã tồn tại, bỏ qua seed.");
      return;
    }

    const cleanCombos = comboData.map((combo) => ({
      comboId: combo.comboId,
      name: combo.name,
      description: combo.description,
      price: combo.price,
      originalPrice: combo.originalPrice,
      image: combo.image,
      items: combo.items,
      discount: combo.discount,
      isActive: combo.isActive ?? true,
      category: combo.category,
      createdAt: combo.createdAt || new Date(),
      updatedAt: combo.updatedAt || new Date(),
    }));

    await Combo.insertMany(cleanCombos);
    console.log(`🍿 Seeded ${cleanCombos.length} combo mẫu thành công!`);
  } catch (error) {
    console.error("❌ Lỗi khi seed combo:", error.message);
  }
};

export default seedCombos;
