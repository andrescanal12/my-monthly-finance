import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, setDoc, addDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB5dzlrAl_ic3T355258jrH__U68nfjSTg",
  authDomain: "my-finance-ac26.firebaseapp.com",
  projectId: "my-finance-ac26",
  storageBucket: "my-finance-ac26.firebasestorage.app",
  messagingSenderId: "709604845472",
  appId: "1:709604845472:web:998905156dfa14621866c5"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const FAMILY_ID = "canal-family";
const YEAR = 2026;

const expenses = [
  { name: "Alquiler", amount: 750, categoryId: "vivienda" },
  { name: "Cuota coche", amount: 228.15, categoryId: "transporte" },
  { name: "Máster", amount: 189.00, categoryId: "educacion" },
  { name: "Diezmo", amount: 230.00, categoryId: "otros" },
  { name: "Luz", amount: 80.00, categoryId: "vivienda" },
  { name: "Cuenta Google", amount: 25.00, categoryId: "ocio" },
  { name: "Internet", amount: 20.00, categoryId: "vivienda" }
];

const budgets = [
  { categoryId: "comida", amount: 240 },
  { categoryId: "gasolina", amount: 160 }
];

async function seed() {
  console.log("Starting seed...");
  
  // Set budgets (they are not per month, they are per family)
  for (const b of budgets) {
    const ref = doc(collection(db, "category_budgets"));
    await setDoc(ref, {
      family_id: FAMILY_ID,
      category_id: b.categoryId,
      amount: b.amount
    });
  }
  
  // For each month 0-11
  for (let month = 0; month < 12; month++) {
    console.log(`Seeding month ${month}...`);
    // Income
    const incRef = doc(collection(db, "month_income"));
    await setDoc(incRef, {
      family_id: FAMILY_ID,
      month_index: month,
      year: YEAR,
      amount: 2300
    });
    
    // Expenses
    for (const exp of expenses) {
      await addDoc(collection(db, "expenses"), {
        family_id: FAMILY_ID,
        name: exp.name,
        amount: exp.amount,
        category_id: exp.categoryId,
        month_index: month,
        year: YEAR,
        paid: false,
        is_recurring: true,
        due_day: null,
        created_at: new Date().toISOString()
      });
    }
  }
  
  console.log("Seed completed!");
  process.exit(0);
}

seed().catch(console.error);
