import React from 'react';
import './KpiTiles.css';
import {
  FiUsers,
  FiUser,
  FiUserCheck,
  FiUserX,
  FiHome,
  FiGrid,
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle,
  FiAlertTriangle,
  FiInfo,
  FiBell,
  FiCalendar,
  FiClock,
  FiDollarSign,
  FiCreditCard,
  FiTrendingUp,
  FiTrendingDown,
  FiActivity,
  FiBarChart2,
  FiPieChart,
  FiFileText,
  FiFile,
  FiTool,
  FiShield,
  FiShieldOff,
  FiTag,
  FiSend,
  FiDownload,
  FiUpload,
} from 'react-icons/fi';

// One consistent, high‑quality Feather set
const LIB_ICONS = {
  // People / roles
  users: FiUsers,
  user: FiUser,
  userCheck: FiUserCheck,
  userX: FiUserX,

  // Property / units
  home: FiHome,
  units: FiGrid,

  // Money / payments
  banknote: FiDollarSign,
  wallet: FiCreditCard,
  receipt: FiFileText,
  invoice: FiFile,
  revenue: FiDollarSign,
  expenses: FiTag,
  fund: FiDollarSign,

  // Status / states
  checkCircle: FiCheckCircle,
  success: FiCheckCircle,
  alert: FiAlertCircle,
  warning: FiAlertTriangle,
  error: FiXCircle,
  info: FiInfo,
  bell: FiBell,

  // Payment lifecycle
  paid: FiCheckCircle,
  submitted: FiSend,
  pending: FiClock,
  overdue: FiAlertTriangle,
  rejected: FiXCircle,
  refunded: FiDownload,   // optional
  collected: FiUpload,    // optional

  // Time / scheduling
  calendar: FiCalendar,
  clock: FiClock,
  nextDue: FiCalendar,
  lastPayment: FiClock,

  // Analytics
  chartUp: FiTrendingUp,
  chartDown: FiTrendingDown,
  activity: FiActivity,
  barChart: FiBarChart2,
  pieChart: FiPieChart,

  // Admin / security / ops
  shield: FiShield,
  shieldOff: FiShieldOff,
  maintenance: FiTool,
  tag: FiTag,
};

// Helpful aliases so you can use natural keys in tiles
const ALIASES = {
  // people
  residents: 'users',
  owners: 'users',
  tenants: 'users',
  admins: 'userCheck',
  inactiveUsers: 'userX',

  // property
  apartments: 'home',
  buildings: 'home',

  // finance
  money: 'banknote',
  amount: 'banknote',
  balance: 'banknote',
  collected: 'revenue',
  outstanding: 'alert',
  allocation: 'tag',

  // statuses
  success: 'checkCircle',
  ok: 'checkCircle',
  fail: 'error',
  danger: 'warning',

  // payments
  payment: 'wallet',
  payments: 'wallet',
  invoices: 'invoice',

  // time
  due: 'calendar',
  deadline: 'calendar',
  date: 'calendar',

  // analytics
  trendUp: 'chartUp',
  trendDown: 'chartDown',
  stats: 'barChart',
};

// Build KPI_ICONS with canonical keys + aliases (backward compatible)
const buildIcons = () => {
  const toCmp = (Cmp) => (props) => <Cmp size={22} strokeWidth={1.8} aria-hidden {...props} />;
  const entries = [
    ...Object.entries(LIB_ICONS).map(([k, C]) => [k, toCmp(C)]),
    ...Object.entries(ALIASES).map(([alias, target]) => {
      const C = LIB_ICONS[target];
      return [alias, toCmp(C || FiTag)];
    }),
  ];
  return Object.fromEntries(entries);
};

export const KPI_ICONS = buildIcons();

// Optional: allow using string keys (iconKey) or a custom component (icon)
const getIconFromItem = (it) => {
  if (it.icon) return it.icon; // Backward‑compatible component/function
  if (it.iconKey && KPI_ICONS[it.iconKey]) return KPI_ICONS[it.iconKey];
  return KPI_ICONS.banknote; // default
};

const KpiTiles = ({ items = [] }) => {
  return (
    <div className="kpi-tiles">
      {items.map((it, idx) => {
        const Icon = getIconFromItem(it);
        const accent = it.color || 'indigo';
        return (
          <div key={idx} className={`kpi-tile accent-${accent}`}>
            <div className="kpi-tile-head">
              <div className="kpi-icon" aria-hidden><Icon /></div>
              <div className="kpi-metric">
                <span className="kpi-number">{it.value}</span>
                <span className="kpi-label">{it.label}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default KpiTiles;