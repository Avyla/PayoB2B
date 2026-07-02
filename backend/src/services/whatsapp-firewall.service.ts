import { prisma } from '../models/db';

class WhatsAppFirewallService {
  private whitelist: Set<string>;

  constructor() {
    this.whitelist = new Set();
  }

  /**
   * Carga los números vinculados desde PostgreSQL a la memoria RAM.
   * Debe ejecutarse al arrancar el servidor.
   */
  async initialize(): Promise<void> {
    try {
      const numbers = await prisma.numeroWhatsApp.findMany({
        select: { numero: true }
      });
      
      this.whitelist.clear();
      numbers.forEach(n => this.whitelist.add(n.numero));
      
      console.log(`[Firewall] Caché inicializada con ${this.whitelist.size} números autorizados.`);
    } catch (error) {
      console.error('[Firewall] Error inicializando caché:', error);
    }
  }

  /**
   * Verifica si un número está en la lista blanca (O(1) en memoria).
   */
  isAuthorized(phoneNumber: string): boolean {
    return this.whitelist.has(phoneNumber);
  }

  /**
   * Agrega un número a la lista blanca en caliente.
   */
  addNumber(phoneNumber: string): void {
    this.whitelist.add(phoneNumber);
    console.log(`[Firewall] Número +${phoneNumber} agregado a la caché.`);
  }

  /**
   * Remueve un número de la lista blanca en caliente.
   */
  removeNumber(phoneNumber: string): void {
    this.whitelist.delete(phoneNumber);
    console.log(`[Firewall] Número +${phoneNumber} removido de la caché.`);
  }

  /**
   * Obtiene la cantidad de números cacheados.
   */
  get size(): number {
    return this.whitelist.size;
  }
}

// Singleton
export const WhatsAppFirewall = new WhatsAppFirewallService();
