const API_BASE_URL = 'http://localhost:5000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
};

export const expenseService = {
  getExpenses: async (params = {}) => {
    const url = new URL(`${API_BASE_URL}/expenses`);
    if (params.month) url.searchParams.append('month', params.month);
    if (params.category && params.category !== 'all') url.searchParams.append('category', params.category);
    if (params.q) url.searchParams.append('q', params.q);
    const res = await fetch(url.toString(), { headers: getAuthHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch expenses');
    return data;
  },
  createExpense: async (expense) => {
    const res = await fetch(`${API_BASE_URL}/expenses`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(expense)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create expense');
    return data;
  },
  updateExpense: async (id, expense) => {
    const res = await fetch(`${API_BASE_URL}/expenses/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(expense)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update expense');
    return data;
  },
  deleteExpense: async (id) => {
    const res = await fetch(`${API_BASE_URL}/expenses/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete expense');
    return data;
  },
  getStats: async (year) => {
    const url = new URL(`${API_BASE_URL}/expenses/stats`);
    if (year) url.searchParams.append('year', year);
    const res = await fetch(url.toString(), { headers: getAuthHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch expense stats');
    return data;
  }
};