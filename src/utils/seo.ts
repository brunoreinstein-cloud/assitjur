export const SITE_URL = import.meta.env.VITE_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : '');

export const defaultOgImage = '/hubjuria-logo-og.png';

interface RouteMeta {
  title: string;
  description: string;
  image?: string;
}

export const ROUTE_META: Record<string, RouteMeta> = {
  '/': {
    title: 'AssistJur.IA - O primeiro hub de agentes de IA para gestão estratégica do contencioso',
    description:
      'Gestão do contencioso com inovação e olhar estratégico. Hub único de agentes de IA especializados testado em grandes carteiras.',
  },
  '/sobre': {
    title: 'Sobre o AssistJur.IA',
    description: 'Conheça a visão e a equipe por trás do AssistJur.IA.',
  },
  '/beta': {
    title: 'Lista Beta AssistJur.IA',
    description: 'Garanta acesso antecipado ao hub de IA jurídica.',
  },
  '/login': {
    title: 'Login - AssistJur.IA',
    description: 'Acesse sua conta segura do AssistJur.IA.',
  },
  '/portal-titular': {
    title: 'Portal do Titular - AssistJur.IA',
    description: 'Exercite seus direitos como titular de dados.',
  },
  '/politica-de-privacidade': {
    title: 'Política de Privacidade - AssistJur.IA',
    description: 'Entenda como tratamos seus dados pessoais.',
  },
  '/termos-de-uso': {
    title: 'Termos de Uso - AssistJur.IA',
    description: 'Regras para utilização do AssistJur.IA.',
  },
  '/lgpd': {
    title: 'LGPD e AssistJur.IA',
    description: 'Saiba como o AssistJur.IA auxilia na conformidade com a LGPD.',
  },
};

export function buildUrl(path: string) {
  return `${SITE_URL}${path}`;
}
