'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { getSession } from '@/lib/session';

// ==========================================
// CUSTOMER ACTIONS
// ==========================================

export async function getActiveServices() {
  const { data, error } = await supabaseAdmin
    .from('services')
    .select('*')
    .eq('is_active', true)
    .order('name');
  
  if (error) {
    console.error('Error fetching services:', error);
    return [];
  }
  return data || [];
}

export async function getServiceCategories() {
  return [
    { name: 'Hair', icon: '💇' },
    { name: 'Spa', icon: '💆' },
    { name: 'Nails', icon: '💅' },
    { name: 'Makeup', icon: '💄' },
    { name: 'Skincare', icon: '🧼' },
    { name: 'Grooming', icon: '🧔' }
  ];
}

export async function getPopularServices() {
  const { data, error } = await supabaseAdmin
    .from('services')
    .select('*')
    .eq('is_active', true)
    .order('name')
    .limit(5);
  
  if (error) {
    console.error('Error fetching popular services:', error);
    return [];
  }
  return data || [];
}

export async function getActiveStaff() {
  const { data, error } = await supabaseAdmin
    .from('staff')
    .select('*')
    .eq('is_active', true);
  
  if (error) {
    console.error('Error fetching staff:', error);
    return [];
  }
  return data || [];
}

export async function createAppointment(bookingData) {
  const session = await getSession();
  if (!session || !session.userId) {
    return { error: 'Not authenticated' };
  }

  const { serviceId, staffId, date, time, totalAmount, notes, couponCode, discountAmount } = bookingData;

  const { data, error } = await supabaseAdmin
    .from('appointments')
    .insert([{
      customer_id: session.userId,
      service_id: serviceId,
      staff_id: staffId || null, // Optional
      appointment_date: date,
      start_time: time,
      total_amount: totalAmount,
      status: 'pending',
      payment_status: 'pay_at_salon',
      notes: notes || null
    }])
    .select()
    .single();

  if (error) {
    console.error('Error creating appointment:', error);
    return { error: 'Failed to create appointment' };
  }
  return { success: true, appointment: data };
}

// ==========================================
// ADMIN ACTIONS
// ==========================================

export async function getDashboardStats() {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return { error: 'Not authorized' };
  }

  const today = new Date().toISOString().split('T')[0];

  // 1. Get today's appointments
  const { data: todayAppointments, error: aptError } = await supabaseAdmin
    .from('appointments')
    .select('*, users(full_name, phone_number), services(name), staff(name)')
    .eq('appointment_date', today)
    .order('start_time');

  // 2. Calculate revenue (only completed/confirmed for today)
  let todayRevenue = 0;
  if (todayAppointments) {
    todayAppointments.forEach(apt => {
      if (apt.status === 'completed' || apt.status === 'confirmed') {
        todayRevenue += Number(apt.total_amount);
      }
    });
  }

  // 3. Get today's expenses
  const { data: todayExpenses, error: expError } = await supabaseAdmin
    .from('expenses')
    .select('amount')
    .gte('created_at', today) // greater than or equal to start of today (UTC issue possible, but simple for now)
    .lt('created_at', new Date(new Date(today).getTime() + 24 * 60 * 60 * 1000).toISOString());

  let totalExpenses = 0;
  if (todayExpenses) {
    todayExpenses.forEach(exp => {
      totalExpenses += Number(exp.amount);
    });
  }

  return {
    revenue: todayRevenue,
    expenses: totalExpenses,
    netIncome: todayRevenue - totalExpenses,
    appointmentsCount: todayAppointments?.length || 0,
    upcomingAppointments: todayAppointments || [],
  };
}

export async function getAllCustomers() {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return { error: 'Not authorized' };
  }

  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('role', 'customer')
    .order('purchased_at', { ascending: false });

  if (error) {
    console.error('Error fetching customers:', error);
    return [];
  }
  return data || [];
}

export async function getAllStaff() {
  const session = await getSession();
  if (!session || session.role !== 'admin') return { error: 'Not authorized' };

  const { data, error } = await supabaseAdmin
    .from('staff')
    .select('*')
    .order('name');
  
  if (error) {
    console.error('Error fetching all staff:', error);
    return [];
  }
  return data || [];
}

export async function removeStaff(staffId) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return { error: 'Not authorized' };

  // 1. Mark staff profile as inactive (hides from booking flow)
  const { error: staffError } = await supabaseAdmin
    .from('staff')
    .update({ is_active: false })
    .eq('id', staffId);

  if (staffError) {
    console.error('Error removing staff:', staffError);
    return { error: 'Failed to remove staff' };
  }

  // 2. Look up the staff member's phone number to strip their login role
  const { data: staffData } = await supabaseAdmin
    .from('staff')
    .select('phone')
    .eq('id', staffId)
    .single();

  if (staffData && staffData.phone) {
    // 3. Downgrade their login role back to customer
    await supabaseAdmin
      .from('users')
      .update({ role: 'customer' })
      .eq('phone_number', staffData.phone);
  }

  return { success: true };
}

// ==========================================
// ATTENDANCE & LEAVES (STAFF PORTAL & ADMIN)
// ==========================================

export async function submitLeaveRequest(startDate, endDate, reason) {
  const session = await getSession();
  if (!session || session.role !== 'staff') return { error: 'Not authorized' };

  // Need to get the staff's ID based on their phone number in the users table
  // Since session.userId is the users.id, we lookup staff by phone
  const { data: user } = await supabaseAdmin.from('users').select('phone_number').eq('id', session.userId).single();
  if (!user) return { error: 'User not found' };

  const { data: staff } = await supabaseAdmin.from('staff').select('id').eq('phone', user.phone_number).single();
  if (!staff) return { error: 'Staff profile not found' };

  const { error } = await supabaseAdmin
    .from('staff_leaves')
    .insert([{
      staff_id: staff.id,
      start_date: startDate,
      end_date: endDate,
      reason: reason,
      status: 'pending'
    }]);

  if (error) {
    console.error('Error submitting leave:', error);
    return { error: 'Failed to submit leave request' };
  }
  return { success: true };
}

export async function getStaffLeaves() {
  const session = await getSession();
  if (!session || session.role !== 'admin') return { error: 'Not authorized' };

  const { data, error } = await supabaseAdmin
    .from('staff_leaves')
    .select(`
      *,
      staff (
        name,
        phone
      )
    `)
    .order('purchased_at', { ascending: false });

  if (error) {
    console.error('Error fetching leaves:', error);
    return [];
  }
  return data || [];
}

export async function updateLeaveStatus(leaveId, status) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return { error: 'Not authorized' };

  const { error } = await supabaseAdmin
    .from('staff_leaves')
    .update({ status })
    .eq('id', leaveId);

  if (error) {
    console.error('Error updating leave:', error);
    return { error: 'Failed to update leave status' };
  }
  return { success: true };
}

export async function getStaffAttendance(dateStr) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return { error: 'Not authorized' };

  const { data, error } = await supabaseAdmin
    .from('staff_attendance')
    .select('*')
    .eq('date', dateStr);

  if (error) {
    console.error('Error fetching attendance:', error);
    return [];
  }
  return data || [];
}

export async function markAttendance(staffId, dateStr, status, checkInTime) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return { error: 'Not authorized' };

  // Use UPSERT (on conflict)
  const { error } = await supabaseAdmin
    .from('staff_attendance')
    .upsert({
      staff_id: staffId,
      date: dateStr,
      status: status,
      check_in_time: checkInTime || null
    }, { onConflict: 'staff_id, date' });

  if (error) {
    console.error('Error marking attendance:', error);
    return { error: 'Failed to mark attendance' };
  }
  return { success: true };
}

export async function addStaff(name, speciality, phone, baseSalary = 0, commissionRate = 0) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return { error: 'Not authorized' };

  // Insert into staff table
  const { data, error } = await supabaseAdmin
    .from('staff')
    .insert([
      { name, speciality, phone, is_active: true, base_salary: baseSalary, commission_rate: commissionRate }
    ])
    .select()
    .single();

  if (error) {
    console.error('Error adding staff:', error);
    return { error: 'Failed to add staff member' };
  }

  // Generate a random referral code
  const referralCode = 'GLAM-' + name.substring(0,3).toUpperCase() + '-' + Math.floor(Math.random() * 1000);
  await supabaseAdmin.from('staff').update({ referral_code: referralCode }).eq('id', data.id);

  return { success: true, staff: data };
}

// ==========================================
// OFFERS & NOTIFICATIONS (QUICK ACTIONS)
// ==========================================

export async function addOffer(title, subtitle, bg_gradient) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return { error: 'Not authorized' };

  const { error } = await supabaseAdmin
    .from('offers')
    .insert([{ title, subtitle, bg_gradient, is_active: true }]);

  if (error) {
    console.error('Error adding offer:', error);
    return { error: 'Failed to add offer' };
  }
  return { success: true };
}

export async function getActiveOffers() {
  const { data, error } = await supabaseAdmin
    .from('offers')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching offers:', error);
    return [];
  }
  return data || [];
}

export async function addNotification(message) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return { error: 'Not authorized' };

  const { error } = await supabaseAdmin
    .from('notifications')
    .insert([{ message }]);

  if (error) {
    console.error('Error adding notification:', error);
    return { error: 'Failed to send notification' };
  }
  return { success: true };
}

export async function getNotifications() {
  const { data, error } = await supabaseAdmin
    .from('notifications')
    .select('*')
    .order('purchased_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
  return data || [];
}

// ==========================================
// BOOKING ACTIONS
// ==========================================

export async function bookWalkinAppointment(serviceId) {
  const session = await getSession();
  if (!session) return { error: 'Not authorized' };

  // For walk-ins, just book for the current time
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

  const { error } = await supabaseAdmin
    .from('appointments')
    .insert([{ 
      customer_id: session.userId,
      service_id: serviceId,
      date: dateStr,
      start_time: timeStr,
      status: 'confirmed'
    }]);

  if (error) {
    console.error('Error booking walk-in:', error);
    return { error: 'Failed to secure instant booking' };
  }
  return { success: true };
}

// ==========================================
// OFFERS MANAGEMENT ACTIONS
// ==========================================

export async function getAllOffers() {
  const session = await getSession();
  if (!session || session.role !== 'admin') return [];

  const { data, error } = await supabaseAdmin
    .from('offers')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching all offers:', error);
    return [];
  }
  return data || [];
}

export async function toggleOfferStatus(id, currentStatus) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return { error: 'Not authorized' };

  const { error } = await supabaseAdmin
    .from('offers')
    .update({ is_active: !currentStatus })
    .eq('id', id);

  if (error) {
    console.error('Error toggling offer:', error);
    return { error: 'Failed to update offer' };
  }
  return { success: true };
}

export async function deleteOffer(id) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return { error: 'Not authorized' };

  const { error } = await supabaseAdmin
    .from('offers')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting offer:', error);
    return { error: 'Failed to delete offer' };
  }
  return { success: true };
}

// ==========================================
// INVENTORY / PRODUCTS ACTIONS
// ==========================================

export async function getAllProducts() {
  const { data, error } = await supabaseAdmin
    .from('products')
    .select('*')
    .order('purchased_at', { ascending: false });

  if (error) {
    console.error('Error fetching products:', error);
    return [];
  }
  return data || [];
}

export async function getAvailableProducts() {
  const { data, error } = await supabaseAdmin
    .from('products')
    .select('*')
    .eq('is_available', true)
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching available products:', error);
    return [];
  }
  return data || [];
}

export async function getProductById(id) {
  const { data, error } = await supabaseAdmin
    .from('products')
    .select('*')
    .eq('id', id)
    .single();
    
  if (error) {
    console.error('Error fetching product by id:', error);
    return null;
  }
  return data;
}

export async function addProduct(productData) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return { error: 'Not authorized' };

  // productData should now include min_stock_level
  const { error } = await supabaseAdmin
    .from('products')
    .insert([{
      ...productData,
      min_stock_level: productData.min_stock_level || 5
    }]);

  if (error) {
    console.error('Error adding product:', error);
    return { error: 'Failed to add product' };
  }
  return { success: true };
}

export async function toggleProductAvailability(id, currentStatus) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return { error: 'Not authorized' };

  const { error } = await supabaseAdmin
    .from('products')
    .update({ is_available: !currentStatus })
    .eq('id', id);

  if (error) {
    console.error('Error toggling product:', error);
    return { error: 'Failed to update product' };
  }
  return { success: true };
}

export async function deleteProduct(id) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return { error: 'Not authorized' };

  const { error } = await supabaseAdmin
    .from('products')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting product:', error);
    return { error: 'Failed to delete product' };
  }
  return { success: true };
}

export async function getLowStockProducts() {
  const session = await getSession();
  if (!session || session.role !== 'admin') return [];

  const { data, error } = await supabaseAdmin
    .rpc('get_low_stock_products');
    
  // Since we haven't defined the RPC yet, let's just do a normal select and filter in JS if needed.
  // Actually, supabase doesn't support comparing two columns directly in the standard select API without RPC.
  // So we will fetch all active products and filter them in JS.
  const { data: allProducts, error: fetchErr } = await supabaseAdmin
    .from('products')
    .select('*')
    .eq('is_available', true);
    
  if (fetchErr) {
    console.error('Error fetching for low stock:', fetchErr);
    return [];
  }
  
  return allProducts.filter(p => p.stock_quantity <= p.min_stock_level);
}

// ==========================================
// SUBSCRIPTIONS (ADMIN & CUSTOMER)
// ==========================================

export async function getAllSubscriptionPlans() {
  const { data, error } = await supabaseAdmin
    .from('subscription_plans')
    .select('*')
    .order('price');
  if (error) {
    console.error('Error fetching plans:', error);
    return [];
  }
  return data;
}

export async function getActiveSubscriptionPlans() {
  const { data, error } = await supabaseAdmin
    .from('subscription_plans')
    .select('*')
    .eq('is_active', true)
    .order('price');
  if (error) {
    console.error('Error fetching active plans:', error);
    return [];
  }
  return data;
}

export async function createSubscriptionPlan(planData) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return { success: false, error: 'Unauthorized' };
  }
  const { data, error } = await supabaseAdmin
    .from('subscription_plans')
    .insert([planData])
    .select();
  if (error) return { success: false, error: error.message };
  return { success: true, plan: data[0] };
}

export async function toggleSubscriptionPlan(id, currentState) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return { success: false, error: 'Unauthorized' };
  }
  const { error } = await supabaseAdmin
    .from('subscription_plans')
    .update({ is_active: !currentState })
    .eq('id', id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function deleteSubscriptionPlan(id) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return { success: false, error: 'Unauthorized' };
  }
  const { error } = await supabaseAdmin
    .from('subscription_plans')
    .delete()
    .eq('id', id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function getCustomerSubscriptions() {
  const session = await getSession();
  if (!session) return [];
  const { data, error } = await supabaseAdmin
    .from('customer_subscriptions')
    .select('*, subscription_plans(*)')
    .eq('customer_id', session.userId)
    .order('purchased_at', { ascending: false });
  if (error) {
    console.error('Error fetching customer subscriptions:', error);
    return [];
  }
  return data;
}

export async function purchaseSubscription(planId, billingCycle) {
  const session = await getSession();
  if (!session) return { success: false, error: 'Unauthorized' };
  
  // Calculate period end
  const start = new Date();
  const end = new Date();
  if (billingCycle === 'yearly') {
    end.setFullYear(start.getFullYear() + 1);
  } else {
    end.setMonth(start.getMonth() + 1);
  }

  const sub = {
    customer_id: session.userId,
    plan_id: planId,
    status: 'active',
    current_period_start: start.toISOString(),
    current_period_end: end.toISOString()
  };

  const { data, error } = await supabaseAdmin
    .from('customer_subscriptions')
    .insert([sub])
    .select();

  if (error) return { success: false, error: error.message };
  return { success: true, subscription: data[0] };
}

// ==========================================
// EXPENSES (ADMIN)
// ==========================================

export async function addExpense(amount, category, description) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return { success: false, error: 'Unauthorized' };
  }

  const { data, error } = await supabaseAdmin
    .from('expenses')
    .insert([{ amount, category, description }])
    .select();

  if (error) {
    console.error('Error adding expense:', error);
    return { success: false, error: error.message };
  }
  
  return { success: true, expense: data[0] };
}

// ==========================================
// PAYROLL (ADMIN)
// ==========================================

export async function getStaffPayroll(staffId, yearMonthStr) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return { success: false, error: 'Unauthorized' };
  }

  // yearMonthStr is YYYY-MM
  const [year, month] = yearMonthStr.split('-');
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];
  const totalDaysInMonth = endDate.getDate();

  // 1. Get Staff Details
  const { data: staff, error: staffError } = await supabaseAdmin
    .from('staff')
    .select('*')
    .eq('id', staffId)
    .single();
  
  if (staffError) return { success: false, error: 'Staff not found' };

  // 2. Get Attendance
  const { data: attendance } = await supabaseAdmin
    .from('staff_attendance')
    .select('*')
    .eq('staff_id', staffId)
    .gte('date', startDateStr)
    .lte('date', endDateStr);

  let workingDays = 0;
  if (attendance) {
    workingDays = attendance.filter(a => a.status === 'present').length;
  }

  // 3. Get Leaves
  const { data: leaves } = await supabaseAdmin
    .from('staff_leaves')
    .select('*')
    .eq('staff_id', staffId)
    .eq('status', 'approved')
    .gte('start_date', startDateStr)
    .lte('start_date', endDateStr);

  let leaveDays = leaves ? leaves.length : 0;

  // 4. Get Revenue (Completed appointments)
  const { data: appointments } = await supabaseAdmin
    .from('appointments')
    .select('total_amount')
    .eq('staff_id', staffId)
    .gte('appointment_date', startDateStr)
    .lte('appointment_date', endDateStr)
    .in('status', ['completed', 'confirmed']);

  let totalRevenue = 0;
  if (appointments) {
    appointments.forEach(apt => {
      totalRevenue += Number(apt.total_amount);
    });
  }

  // 5. Calculate Payroll
  const proratedSalary = Math.round((Number(staff.base_salary) / totalDaysInMonth) * workingDays);
  const commission = Math.round(totalRevenue * (Number(staff.commission_rate) / 100));
  const netTakeHome = proratedSalary + commission;

  return {
    success: true,
    data: {
      staffName: staff.name,
      baseSalary: Number(staff.base_salary),
      commissionRate: Number(staff.commission_rate),
      totalDaysInMonth,
      workingDays,
      leaveDays,
      totalRevenue,
      proratedSalary,
      commission,
      netTakeHome
    }
  };
}

// ==========================================
// ADVANCED ANALYTICS (ADMIN)
// ==========================================

export async function getAdvancedAnalytics() {
  const session = await getSession();
  if (!session || session.role !== 'admin') return null;

  const todayStr = new Date().toISOString().split('T')[0];

  // 1. Fetch all appointments
  const { data: allAppointments } = await supabaseAdmin.from('appointments').select('*');
  
  let totalBookings = 0;
  let dailyBookings = 0;
  let dateCounts = {};
  let monthCounts = {};
  let timeCounts = {};

  if (allAppointments) {
    totalBookings = allAppointments.length;
    
    allAppointments.forEach(apt => {
      if (apt.appointment_date === todayStr) dailyBookings++;
      
      // Date counts
      const d = apt.appointment_date;
      if (d) dateCounts[d] = (dateCounts[d] || 0) + 1;
      
      // Month counts (YYYY-MM)
      if (d) {
        const m = d.substring(0, 7);
        monthCounts[m] = (monthCounts[m] || 0) + 1;
      }

      // Time counts
      const t = apt.start_time;
      if (t) timeCounts[t] = (timeCounts[t] || 0) + 1;
    });
  }

  // Find High/Less days
  let busiestDay = { date: 'N/A', count: 0 };
  let quietestDay = { date: 'N/A', count: Infinity };
  for (const [date, count] of Object.entries(dateCounts)) {
    if (count > busiestDay.count) busiestDay = { date, count };
    if (count < quietestDay.count) quietestDay = { date, count };
  }
  if (quietestDay.count === Infinity) quietestDay.count = 0;

  // Find High/Less months
  let busiestMonth = { month: 'N/A', count: 0 };
  let quietestMonth = { month: 'N/A', count: Infinity };
  for (const [month, count] of Object.entries(monthCounts)) {
    if (count > busiestMonth.count) busiestMonth = { month, count };
    if (count < quietestMonth.count) quietestMonth = { month, count };
  }
  if (quietestMonth.count === Infinity) quietestMonth.count = 0;

  // Find popular time
  let popularTime = { time: 'N/A', count: 0 };
  for (const [time, count] of Object.entries(timeCounts)) {
    if (count > popularTime.count) popularTime = { time, count };
  }

  // 2. Fetch product purchases
  const { data: purchases } = await supabaseAdmin.from('product_purchases').select('*, products(name)');
  
  let storeSalesRevenue = 0;
  let productSales = {};

  if (purchases) {
    purchases.forEach(p => {
      storeSalesRevenue += Number(p.total_price);
      const pid = p.product_id;
      if (pid) {
        if (!productSales[pid]) productSales[pid] = { name: p.products?.name || 'Unknown', qty: 0 };
        productSales[pid].qty += p.quantity;
      }
    });
  }

  let topProduct = { name: 'N/A', qty: 0 };
  let lowestProduct = { name: 'N/A', qty: Infinity };
  
  for (const [pid, info] of Object.entries(productSales)) {
    if (info.qty > topProduct.qty) topProduct = info;
    if (info.qty < lowestProduct.qty) lowestProduct = info;
  }
  if (lowestProduct.qty === Infinity) lowestProduct.qty = 0;

  return {
    totalBookings,
    dailyBookings,
    busiestDay,
    quietestDay,
    busiestMonth,
    quietestMonth,
    popularTime,
    storeSalesRevenue,
    topProduct,
    lowestProduct
  };
}

// ==========================================
// MENU MANAGER (ADMIN)
// ==========================================

export async function addServiceCategory(name, icon) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return { error: 'Unauthorized' };

  const { data, error } = await supabaseAdmin
    .from('service_categories')
    .insert([{ name, icon }])
    .select();

  if (error) return { error: error.message };
  return { success: true, data };
}

export async function deleteServiceCategory(id) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return { error: 'Unauthorized' };

  const { error } = await supabaseAdmin
    .from('service_categories')
    .delete()
    .eq('id', id);

  if (error) return { error: error.message };
  return { success: true };
}

export async function addService(name, category, price, duration_minutes) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return { error: 'Unauthorized' };

  const { data, error } = await supabaseAdmin
    .from('services')
    .insert([{ name, category, price, duration_minutes, is_active: true }])
    .select();

  if (error) return { error: error.message };
  return { success: true, data };
}

export async function toggleServicePopular(id, is_popular) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return { error: 'Unauthorized' };

  const { error } = await supabaseAdmin
    .from('services')
    .update({ is_popular })
    .eq('id', id);

  if (error) return { error: error.message };
  return { success: true };
}

export async function deleteService(id) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return { error: 'Unauthorized' };

  const { error } = await supabaseAdmin
    .from('services')
    .update({ is_active: false })
    .eq('id', id);

  if (error) return { error: error.message };
  return { success: true };
}

// --- AUDIT WIRING ACTIONS ---

export async function getCRMCustomers() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') return [];

    const { data: users, error } = await supabaseAdmin.from('users').select('*').eq('role', 'customer');
    if (error) return [];
    
    // Get basic aggregated data
    const { data: appointments } = await supabaseAdmin.from('appointments').select('*');
    const { data: purchases } = await supabaseAdmin.from('product_purchases').select('*');
    
    return users.map(u => {
      const userAppts = appointments?.filter(a => a.user_id === u.id) || [];
      const userPurchases = purchases?.filter(p => p.user_id === u.id) || [];
      const totalSpent = userAppts.reduce((sum, a) => sum + (Number(a.total_amount) || 0), 0) + 
                         userPurchases.reduce((sum, p) => sum + (Number(p.total_price) || 0), 0);
      
      // Sort appts by date descending
      userAppts.sort((a, b) => new Date(b.date) - new Date(a.date));
      const lastVisit = userAppts.length > 0 ? new Date(userAppts[0].date).toLocaleDateString() : 'Never';
      
      return {
        ...u,
        totalSpent: `$${totalSpent.toFixed(2)}`,
        lastVisit,
        history: userAppts.map(a => `Booking on ${a.date}`),
        badges: totalSpent > 1000 ? ['VIP'] : []
      };
    });
  } catch (error) {
    return [];
  }
}

export async function getAppointmentsByDate(dateStr) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') return [];

    const { data, error } = await supabaseAdmin
      .from('appointments')
      .select('*, staff:staff_id(name), service:service_id(name)')
      .eq('date', dateStr);
    if (error) return [];
    return data;
  } catch (error) {
    return [];
  }
}

export async function checkoutStoreOrder(cart) {
  try {
    const session = await getSession();
    if (!session) return { error: 'Not logged in' };

    const { data: products } = await supabaseAdmin.from('products').select('*');
    const purchases = [];
    
    for (const [productId, qty] of Object.entries(cart)) {
      const product = products.find(p => p.id === productId);
      if (product) {
        purchases.push({
          customer_id: session.userId,
          product_id: productId,
          quantity: qty,
          total_price: product.price * qty,
          });
        
        // Deduct stock quantity
        const newStock = Math.max(0, product.stock_quantity - qty);
        await supabaseAdmin.from('products').update({ stock_quantity: newStock }).eq('id', productId);
        
        // Notify admin if stock goes below minimum
        if (newStock <= product.min_stock_level) {
          await supabaseAdmin.from('notifications').insert({
            title: newStock === 0 ? `🚨 Out of Stock: ${product.name}` : `⚠️ Low Stock Alert: ${product.name} (Only ${newStock} left)`,
            reach: 0
          });
        }
      }
    }
    
    if (purchases.length > 0) {
      const { error } = await supabaseAdmin.from('product_purchases').insert(purchases);
      if (error) return { error: error.message };
      return { success: true };
    }
    return { error: 'Cart empty or invalid' };
  } catch (error) {
    return { error: error.message };
  }
}

export async function getRewardPoints() {
  try {
    const session = await getSession();
    if (!session) return { total: 0, history: [] };

    const { data, error } = await supabaseAdmin
      .from('reward_points')
      .select('*')
      .eq('customer_id', session.userId)
      .order('purchased_at', { ascending: false });
      
    if (error) return { total: 0, history: [] };
    const total = data.reduce((sum, item) => sum + item.points, 0);
    return { total, history: data };
  } catch (error) {
    return { total: 0, history: [] };
  }
}

export async function getStaffAppointments() {
  try {
    // For MVP, just get latest 5 appointments if no staff auth context.
    const { data, error } = await supabaseAdmin
      .from('appointments')
      .select('*, service:service_id(name), user:user_id(name)')
      .order('date', { ascending: false })
      .limit(5);
    if (error) return [];
    return data;
  } catch (error) {
    return [];
  }
}



export async function sendPushNotification(title) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') return { error: 'Unauthorized' };

    const { error } = await supabaseAdmin.from('notifications').insert({
      title,
      reach: Math.floor(Math.random() * 500) + 50 // mock reach
    });
    if (error) return { error: error.message };
    return { success: true };
  } catch (error) {
    return { error: error.message };
  }
}

export async function getPushNotifications() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') return [];

    const { data, error } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .order('purchased_at', { ascending: false });
    if (error) return [];
    return data;
  } catch (error) {
    return [];
  }
}

export async function getMyOrders() {
  const session = await getSession();
  if (!session) return [];
  const { data, error } = await supabaseAdmin
    .from('product_purchases')
    .select('*, products(name, image_url)')
    .eq('customer_id', session.userId)
    .order('purchased_at', { ascending: false });
  if (error) {
    console.error('Error fetching orders:', error);
    return [];
  }
  return data || [];
}

export async function getAllOrders() {
  const session = await getSession();
  if (!session || session.role !== 'admin') return [];
  const { data, error } = await supabaseAdmin
    .from('product_purchases')
    .select('*, products(name), users(name, phone)')
    .order('purchased_at', { ascending: false });
  if (error) {
    console.error('Error fetching all orders:', error);
    return [];
  }
  return data || [];
}


// ==========================================
// COUPON ACTIONS
// ==========================================

export async function addCoupon(code, discount_type, discount_value) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return { error: 'Not authorized' };

  const { error } = await supabaseAdmin
    .from('coupons')
    .insert([{ 
      code: code.toUpperCase(), 
      discount_type, 
      discount_value, 
      is_active: true 
    }]);

  if (error) {
    console.error('Error adding coupon:', error);
    return { error: 'Failed to add coupon. Code might already exist.' };
  }
  return { success: true };
}

export async function getActiveCoupons() {
  const { data, error } = await supabaseAdmin
    .from('coupons')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching coupons:', error);
    return [];
  }
  return data || [];
}

export async function validateCoupon(code) {
  if (!code) return { error: 'No code provided' };

  const { data, error } = await supabaseAdmin
    .from('coupons')
    .select('*')
    .eq('code', code.toUpperCase())
    .eq('is_active', true)
    .single();

  if (error || !data) {
    return { error: 'Invalid or expired coupon code' };
  }
  
  return { success: true, coupon: data };
}

export async function deleteCoupon(id) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return { error: 'Not authorized' };

  // Soft delete
  const { error } = await supabaseAdmin
    .from('coupons')
    .update({ is_active: false })
    .eq('id', id);

  if (error) return { error: error.message };
  return { success: true };
}
