import { User, PaymentRequest } from '../types';

const USERS_KEY = 'jigesh_users';
const CURRENT_USER_ID_KEY = 'jigesh_current_user_id';
const PAYMENTS_KEY = 'jigesh_payments';
const GUEST_USER_KEY = 'jigesh_guest_profile';

// Helper to get all users
const getUsers = (): User[] => {
  try {
    const users = localStorage.getItem(USERS_KEY);
    return users ? JSON.parse(users) : [];
  } catch (e) { return []; }
};

// Helper to save users
const saveUsers = (users: User[]) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

// Helper to get payments
const getPayments = (): PaymentRequest[] => {
  try {
    const payments = localStorage.getItem(PAYMENTS_KEY);
    return payments ? JSON.parse(payments) : [];
  } catch (e) { return []; }
};

const savePayments = (payments: PaymentRequest[]) => {
  localStorage.setItem(PAYMENTS_KEY, JSON.stringify(payments));
};

// --- Auth ---

export const register = async (email: string, password: string): Promise<User> => {
  await new Promise(resolve => setTimeout(resolve, 800)); // Simulating network
  
  const users = getUsers();
  if (users.find(u => u.email === email)) {
    throw new Error("Email already exists");
  }

  const newUser: User = {
    id: Date.now().toString(),
    email,
    password, // Storing password for mock auth
    name: 'New Student',
    collegeName: '',
    class: '11',
    role: 'student',
    isPremium: false,
    suspended: false,
    createdAt: Date.now()
  };

  users.push(newUser);
  saveUsers(users);
  localStorage.setItem(CURRENT_USER_ID_KEY, newUser.id);
  
  return newUser;
};

export const login = async (email: string, password: string): Promise<User> => {
  await new Promise(resolve => setTimeout(resolve, 800)); // Simulating network
  
  // Admin Backdoor
  if (email === 'admin@jigesh.ai' && password === 'admin123') {
     const adminUser: User = {
         id: 'admin',
         email: 'admin@jigesh.ai',
         name: 'System Admin',
         collegeName: 'System',
         class: '12',
         role: 'admin',
         isPremium: true
     };
     localStorage.setItem(CURRENT_USER_ID_KEY, adminUser.id);
     return adminUser;
  }

  const users = getUsers();
  const user = users.find(u => u.email === email && u.password === password);
  
  if (!user) {
    throw new Error("Invalid email or password");
  }
  
  if (user.suspended) {
    throw new Error("Account suspended. Contact support.");
  }

  localStorage.setItem(CURRENT_USER_ID_KEY, user.id);
  return user;
};

export const logout = () => {
  localStorage.removeItem(CURRENT_USER_ID_KEY);
};

export const getCurrentUser = (): User => {
  const currentId = localStorage.getItem(CURRENT_USER_ID_KEY);
  
  if (currentId === 'admin') {
      return {
         id: 'admin',
         email: 'admin@jigesh.ai',
         name: 'System Admin',
         collegeName: 'System',
         class: '12',
         role: 'admin',
         isPremium: true
      };
  }

  if (currentId) {
    const users = getUsers();
    const user = users.find(u => u.id === currentId);
    if (user) return user;
  }
  
  // Fallback to Guest/Default if no login
  const storedGuest = localStorage.getItem(GUEST_USER_KEY);
  if (storedGuest) return JSON.parse(storedGuest);
  
  const defaultUser: User = {
    id: 'guest',
    name: 'Student',
    collegeName: 'Unknown College',
    class: '12',
    role: 'student'
  };
  localStorage.setItem(GUEST_USER_KEY, JSON.stringify(defaultUser));
  return defaultUser;
};

export const updateUserProfile = (userId: string, data: Partial<User>): User => {
  const users = getUsers();
  const index = users.findIndex(u => u.id === userId);
  
  if (index !== -1) {
    // Update registered user
    const updated = { ...users[index], ...data };
    users[index] = updated;
    saveUsers(users);
    return updated;
  }
  
  // Update guest user
  const storedGuest = localStorage.getItem(GUEST_USER_KEY);
  const guest = storedGuest ? JSON.parse(storedGuest) : getCurrentUser();
  if (guest.id === userId || userId === 'guest') {
     const updated = { ...guest, ...data };
     localStorage.setItem(GUEST_USER_KEY, JSON.stringify(updated));
     return updated;
  }

  return getCurrentUser(); // Fallback
};

// --- Payments ---

export const createPaymentRequest = (user: User, plan: '1_month' | '3_months', trxId: string) => {
  const requests = getPayments();
  const amount = plan === '1_month' ? 20 : 50;
  
  const newRequest: PaymentRequest = {
    id: Date.now().toString(),
    userId: user.id,
    userName: user.name,
    userEmail: user.email || 'guest',
    plan,
    amount,
    transactionId: trxId,
    status: 'pending',
    timestamp: Date.now()
  };
  
  requests.push(newRequest);
  savePayments(requests);
};

export const getPaymentRequests = (): PaymentRequest[] => {
  return getPayments().sort((a, b) => b.timestamp - a.timestamp);
};

export const processPayment = (requestId: string, action: 'approved' | 'rejected') => {
  const requests = getPayments();
  const reqIndex = requests.findIndex(r => r.id === requestId);
  
  if (reqIndex === -1) return;
  
  requests[reqIndex].status = action;
  savePayments(requests);
  
  if (action === 'approved') {
    const userId = requests[reqIndex].userId;
    const users = getUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
      users[userIndex].isPremium = true;
      saveUsers(users);
    }
  }
};

// --- Admin ---

export const getAdminStats = () => {
  const users = getUsers();
  const requests = getPayments();
  const approvedPayments = requests.filter(r => r.status === 'approved');
  
  return {
    totalUsers: users.length,
    premiumUsers: users.filter(u => u.isPremium).length,
    totalRevenue: approvedPayments.reduce((acc, curr) => acc + curr.amount, 0),
    newUsers: users.filter(u => (u.createdAt || 0) > Date.now() - 7 * 24 * 60 * 60 * 1000).length
  };
};

export const getAllUsers = (): User[] => {
  return getUsers();
};

export const toggleUserSuspension = (userId: string) => {
  const users = getUsers();
  const index = users.findIndex(u => u.id === userId);
  if (index !== -1) {
    users[index].suspended = !users[index].suspended;
    saveUsers(users);
  }
};

// --- Misc ---

export const checkQuestionLimit = (user: User): { allowed: boolean; remaining: number | string } => {
  if (user.isPremium || user.role === 'admin') return { allowed: true, remaining: 'Unlimited' };
  
  // Simple daily limit logic using localStorage for guests/free users
  const today = new Date().toISOString().split('T')[0];
  const usageKey = `usage_${user.id}_${today}`;
  const usage = parseInt(localStorage.getItem(usageKey) || '0', 10);
  const LIMIT = 10;
  
  if (usage >= LIMIT) {
    return { allowed: false, remaining: 0 };
  }
  
  return { allowed: true, remaining: LIMIT - usage };
};

export const incrementQuestionCount = (user: User) => {
  const today = new Date().toISOString().split('T')[0];
  const usageKey = `usage_${user.id}_${today}`;
  const usage = parseInt(localStorage.getItem(usageKey) || '0', 10);
  localStorage.setItem(usageKey, (usage + 1).toString());
};

export const syncSession = (): User => getCurrentUser();