import { db } from "./firebase";
import { doc, setDoc, collection, Timestamp, updateDoc} from "firebase/firestore";
import { getAuth, createUserWithEmailAndPassword, updateProfile} from "firebase/auth";

export const signupUser = async (email: string, password: string, name: string) => {
  const auth = getAuth();
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  if (auth.currentUser) {
    await updateProfile(auth.currentUser, { displayName: name });
  }
  return userCredential.user;
};

// Create default documents for a new user
export async function createUserRecords(userId: string, name: string, email: string) {
  try {
    // 1️⃣ User profile (one-to-one, doc ID = userId)
    await setDoc(doc(db, "Users", userId), {
      full_name: name,
      email: email,
      avatar_url: "",
      created_at: Timestamp.now(),
      updated_at: Timestamp.now(),
    });

    // 2️⃣ User preferences (one-to-one)
    await setDoc(doc(db, "User_Preferences", userId), {
      theme: "light",
      notifications_enabled: true,
      email_notifications: true,
      measurement_units: "metric",
      language: "en",
    });

    // 3️⃣ Initial fitness goal (auto-generated ID)
    await setDoc(doc(db, "Fitness_Goals", userId), {
      //user_id: userId,
      age: null,
      gender: null,
      height: null,
      weight: null,
      activity_level: null,
      goal_type: "maintain",
      target_weight: null,
      weekly_goal: null,
      tdee: null,
      target_calories: null,
      protein_target: null,
      carbs_target: null,
      fats_target: null,
      created_at: Timestamp.now(),
      is_active: true,
    });

    console.log("Default user records created successfully!");
  } catch (err) {
    console.error("Error creating user records:", err);
  }
}

export const updateFitnessGoals = async (
    userId: string, 
    field: string, 
    value: any, 
    collection: string = "Fitness_Goals"
) => {
    try {
        const userRef = doc(db, collection, userId);
        await updateDoc(userRef, { 
            [field]: value // dynamic field name
        });
        console.log(`✅ Updated ${field} in ${collection}/${userId} successfully.`);
    } catch (error) {
        console.error(`❌ Error updating ${field} for user ${userId}:`, error);
        throw error;
    }
}