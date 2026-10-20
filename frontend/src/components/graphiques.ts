import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js';

Chart.register(ArcElement, BarElement, CategoryScale, LinearScale, LineElement, PointElement, Filler, Legend, Tooltip);

Chart.defaults.font.family = "'Archivo Variable', 'Archivo', system-ui, sans-serif";
Chart.defaults.font.size = 12;
Chart.defaults.color = '#56625c';
Chart.defaults.borderColor = '#d3d8d2';
Chart.defaults.plugins.legend.labels.boxWidth = 12;
Chart.defaults.maintainAspectRatio = false;

/** Couleurs des séries, dans l'ordre d'usage. */
export const PALETTE = ['#4f6142', '#e2b33d', '#2e5e8c', '#a66510', '#7d8f6f', '#b23a2e', '#8a948f', '#c9a961'];

export const COULEURS_ETAT: Record<string, string> = {
  EN_SERVICE: '#2f7d4f',
  EN_STOCK: '#2e5e8c',
  EN_PANNE: '#b23a2e',
  EN_REPARATION: '#a66510',
  REFORME: '#8a948f',
};
