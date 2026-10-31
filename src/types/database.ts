export type MainCategory = 'needs' | 'wants' | 'savings' | 'income';

export interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  currency: string;
  created_at?: string;
  updated_at?: string;
}

export interface BudgetSettings {
  id?: string;
  user_id?: string;
  month_year: string; // 'YYYY-MM'
  monthly_income: number;
  needs_percentage: number;
  wants_percentage: number;
  savings_percentage: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Category {
  id: string;
  user_id?: string | null;
  name: string;
  main_category: MainCategory;
  icon: string;
  color: string;
  is_default: boolean;
  created_at?: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: 'income' | 'expense';
  amount: number;
  title: string;
  main_category: MainCategory;
  category_name: string;
  category_id?: string | null;
  date: string; // 'YYYY-MM-DD'
  notes?: string | null;
  created_at?: string;
}

export interface MonthSummary {
  month_year: string;
  income: number;
  total_expense: number;
  needs_expense: number;
  wants_expense: number;
  savings_allocated: number;
  net_savings: number;
  budget_needs: number;
  budget_wants: number;
  budget_savings: number;
  remaining_needs_budget: number;
  remaining_wants_budget: number;
  remaining_total_budget: number;
  savings_rate_percent: number;
  daily_limit: number;
  spent_today: number;
  remaining_today: number;
  weekly_limit: number;
  spent_this_week: number;
  remaining_this_week: number;
  days_left_in_month: number;
  total_days_in_month: number;
  alert_level_daily: 'safe' | 'warning' | 'danger';
  alert_level_weekly: 'safe' | 'warning' | 'danger';
  alert_level_monthly: 'safe' | 'warning' | 'danger';
}

export interface SmartRecommendation {
  type: 'warning' | 'success' | 'tip' | 'action';
  title: string;
  message: string;
  impactNominal?: number;
  category?: string;
}
