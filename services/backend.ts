import { User, PaymentRequest } from '../types';

// --- Mock Database Keys ---
const USERS_KEY = 'jigesh_db_users';
const PAYMENTS_KEY = 'jigesh_db_payments';
const CURRENT_USER_KEY = 'jigesh_session_user';

// --- Admin Credentials ---
const ADMIN_EMAIL = 'foysalahmedsagor2362@gmail.com';
const ADMIN_PASS = 'foysal808';

// --- Helper to get/set DB ---
const getDB = <T>(key: string): T[] => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

const saveDB = (key: string, data: any[]) => {
  localStorage.setItem(key, JSON.stringify(data));
};

// --- Initialization ---
// Seed admin if not exists
const seedAdmin = () => {
  const users = getDB<User>(USERS_KEY);
  const normalizedAdminEmail = ADMIN_EMAIL.toLowerCase().trim();
  
  if (!users.find(u => u.email === normalizedAdminEmail)) {
    const adminUser: User = {
      id: 'admin-001',
      email: normalizedAdminEmail,
      role: 'admin',
      password: ADMIN_PASS, // In real app, hash this
      name: 'Super Admin',
      isPremium: true,
      questionsToday: 0,
      lastQuestionDate: new Date().toISOString().split('T')[0],
      joinedDate: new Date().toISOString(),
      suspended: false
    };
    users.push(adminUser);
    saveDB(USERS_KEY, users);
  }
};
seedAdmin();

// --- Auth Services ---

export const login = async (email: string, pass: string): Promise<User> => {
  // Simulate network delay
  await new Promise(r => setTimeout(r, 500));
  
  const normalizedEmail = email.toLowerCase().trim();
  const users = getDB<User>(USERS_KEY);
  const user = users.find(u => u.email === normalizedEmail && u.password === pass);

  if (!user) {
    throw new Error("Invalid email or password");
  }

  if (user.suspended) {
    throw new Error("Your account has been suspended by the administrator.");
  }

  // Check premium expiry on login
  if (user.isPremium && user.premiumExpiry) {
    if (new Date() > new Date(user.premiumExpiry)) {
      user.isPremium = false;
      user.premiumPlan = undefined;
      // Save update to DB
      const uIdx = users.findIndex(u => u.id === user.id);
      if (uIdx !== -1) {
        users[uIdx] = user;
        saveDB(USERS_KEY, users);
      }
    }
  }

  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  return user;
};

export const register = async (email: string, pass: string): Promise<User> => {
  await new Promise(r => setTimeout(r, 500));
  const normalizedEmail = email.toLowerCase().trim();
  const users = getDB<User>(USERS_KEY);
  
  if (users.find(u => u.email === normalizedEmail)) {
    throw new Error("User already exists");
  }

  const newUser: User = {
    id: Date.now().toString(),
    email: normalizedEmail,
    password: pass,
    role: 'student',
    isPremium: false,
    questionsToday: 0,
    lastQuestionDate: new Date().toISOString().split('T')[0],
    joinedDate: new Date().toISOString(),
    suspended: false
  };

  users.push(newUser);
  saveDB(USERS_KEY, users);
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));
  return newUser;
};

export const logout = () => {
  localStorage.removeItem(CURRENT_USER_KEY);
};

export const getCurrentUser = (): User | null => {
  const u = localStorage.getItem(CURRENT_USER_KEY);
  return u ? JSON.parse(u) : null;
};

// CRITICAL: Call this on App mount to ensure if Admin approved payment,
// the student gets the updated status from the main DB into their session.
export const syncSession = (): User | null => {
  const sessionUser = getCurrentUser();
  if (!sessionUser) return null;

  const users = getDB<User>(USERS_KEY);
  const dbUser = users.find(u => u.id === sessionUser.id);

  if (dbUser) {
    // If the DB version is different (e.g. isPremium changed, or suspended), update session
    if (JSON.stringify(dbUser) !== JSON.stringify(sessionUser)) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(dbUser));
      return dbUser;
    }
  }
  return sessionUser;
};

export const updateUserProfile = (userId: string, data: Partial<User>): User => {
  const users = getDB<User>(USERS_KEY);
  const idx = users.findIndex(u => u.id === userId);
  if (idx === -1) throw new Error("User not found");

  users[idx] = { ...users[idx], ...data };
  saveDB(USERS_KEY, users);
  
  // Update session if it's the current user
  const currentUser = getCurrentUser();
  if (currentUser && currentUser.id === userId) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(users[idx]));
  }
  
  return users[idx];
};

export const toggleUserSuspension = (userId: string) => {
  const users = getDB<User>(USERS_KEY);
  const idx = users.findIndex(u => u.id === userId);
  if (idx !== -1) {
    // Toggle suspension status
    users[idx].suspended = !users[idx].suspended;
    saveDB(USERS_KEY, users);
  }
};

// --- Helper to sync session user from DB ---
const saveUser = (user: User) => {
  const users = getDB<User>(USERS_KEY);
  const idx = users.findIndex(u => u.id === user.id);
  if (idx !== -1) {
    users[idx] = user;
    saveDB(USERS_KEY, users);
  }
};

// --- Question Limit Logic ---

export const checkQuestionLimit = (user: User): { allowed: boolean; remaining: number | string } => {
  if (user.role === 'admin' || user.isPremium) {
    return { allowed: true, remaining: 'Unlimited' };
  }

  const today = new Date().toISOString().split('T')[0];
  
  // Reset if new day
  if (user.lastQuestionDate !== today) {
    user.questionsToday = 0;
    user.lastQuestionDate = today;
    saveUser(user);
    // Update session
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  }

  if (user.questionsToday >= 50) {
    return { allowed: false, remaining: 0 };
  }

  return { allowed: true, remaining: 50 - user.questionsToday };
};

export const incrementQuestionCount = (user: User) => {
  if (user.role === 'admin' || user.isPremium) return;

  const today = new Date().toISOString().split('T')[0];
  if (user.lastQuestionDate !== today) {
    user.questionsToday = 1;
    user.lastQuestionDate = today;
  } else {
    user.questionsToday += 1;
  }
  
  saveUser(user);
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
};

// --- Payment System ---

export const createPaymentRequest = (user: User, plan: '1_month' | '3_months', trxId: string) => {
  const payments = getDB<PaymentRequest>(PAYMENTS_KEY);
  const amount = plan === '1_month' ? 20 : 50;
  
  const req: PaymentRequest = {
    id: Date.now().toString(),
    userId: user.id,
    userEmail: user.email,
    userName: user.name || 'Unknown',
    amount,
    plan,
    transactionId: trxId,
    status: 'pending',
    date: new Date().toISOString()
  };

  payments.push(req);
  saveDB(PAYMENTS_KEY, payments);
};

export const getPaymentRequests = (): PaymentRequest[] => {
  return getDB<PaymentRequest>(PAYMENTS_KEY).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const processPayment = (paymentId: string, status: 'approved' | 'rejected') => {
  const payments = getDB<PaymentRequest>(PAYMENTS_KEY);
  const pIdx = payments.findIndex(p => p.id === paymentId);
  
  if (pIdx === -1) {
    console.error("Payment ID not found:", paymentId);
    return;
  }

  // Update payment status
  payments[pIdx].status = status;
  saveDB(PAYMENTS_KEY, payments);

  // If approved, update the User's premium status
  if (status === 'approved') {
    const users = getDB<User>(USERS_KEY);
    const uIdx = users.findIndex(u => u.id === payments[pIdx].userId);
    
    if (uIdx !== -1) {
      const user = users[uIdx];
      user.isPremium = true;
      user.premiumPlan = payments[pIdx].plan;
      
      const now = new Date();
      if (payments[pIdx].plan === '1_month') {
        now.setMonth(now.getMonth() + 1);
      } else {
        now.setMonth(now.getMonth() + 3);
      }
      user.premiumExpiry = now.toISOString();
      
      // Save updated users array to DB
      saveDB(USERS_KEY, users);
      console.log(`User ${user.email} upgraded to premium.`);
    } else {
      console.error("User not found for payment:", payments[pIdx].userId);
    }
  }
};

// --- Admin Stats ---
export const getAdminStats = () => {
  const users = getDB<User>(USERS_KEY);
  const payments = getDB<PaymentRequest>(PAYMENTS_KEY);

  const totalUsers = users.filter(u => u.role === 'student').length;
  const premiumUsers = users.filter(u => u.isPremium).length;
  const totalRevenue = payments
    .filter(p => p.status === 'approved')
    .reduce((sum, p) => sum + p.amount, 0);

  // Growth (Last 7 days)
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const newUsers = users.filter(u => new Date(u.joinedDate) > oneWeekAgo).length;

  return { totalUsers, premiumUsers, totalRevenue, newUsers };
};

export const getAllUsers = () => getDB<User>(USERS_KEY).filter(u => u.role === 'student');