import wooCommerceApi from '../woocommerce';
import { supabase } from '../supabase-client';

// Tipos para sync
export interface SyncMetadata {
  id?: number;
  sync_type: 'products' | 'customers' | 'full' | 'incremental';
  started_at: Date;
  completed_at?: Date;
  status: 'running' | 'completed' | 'failed';
  items_processed: number;
  items_created: number;
  items_updated: number;
  items_failed: number;
  error_message?: string;
  last_synced_at?: Date;
  triggered_by: 'login' | 'manual' | 'webhook' | 'scheduled';
  user_id?: string;
  metadata?: Record<string, any>;
}

export interface SyncOptions {
  syncType: 'products' | 'customers' | 'full' | 'incremental';
  triggeredBy: 'login' | 'manual' | 'webhook' | 'scheduled';
  userId?: string;
  forceFullSync?: boolean;
  batchSize?: number;
}

export interface SyncResult {
  success: boolean;
  metadata?: SyncMetadata;
  error?: string;
}

// Classe para gerenciar sync do WooCommerce
export class WooCommerceSyncService {
  private static instance: WooCommerceSyncService;

  private constructor() {}

  static getInstance(): WooCommerceSyncService {
    if (!WooCommerceSyncService.instance) {
      WooCommerceSyncService.instance = new WooCommerceSyncService();
    }
    return WooCommerceSyncService.instance;
  }

  /**
   * Inicia um sync do WooCommerce
   */
  async sync(options: SyncOptions): Promise<SyncResult> {
    const { syncType, triggeredBy, userId, forceFullSync = false, batchSize = 100 } = options;

    try {
      // Criar registro de metadata
      const metadata: SyncMetadata = {
        sync_type: syncType,
        started_at: new Date(),
        status: 'running',
        items_processed: 0,
        items_created: 0,
        items_updated: 0,
        items_failed: 0,
        triggered_by: triggeredBy,
        user_id: userId,
      };

      const { data: metadataRecord, error: metadataError } = await supabase
        .from('wc_sync_metadata')
        .insert(metadata)
        .select()
        .single();

      if (metadataError) {
        throw new Error(`Failed to create sync metadata: ${metadataError.message}`);
      }

      const syncId = metadataRecord.id;

      try {
        // Executar sync baseado no tipo
        if (syncType === 'products' || syncType === 'full' || syncType === 'incremental') {
          await this.syncProducts(syncId, forceFullSync, batchSize);
        }

        if (syncType === 'customers' || syncType === 'full' || syncType === 'incremental') {
          await this.syncCustomers(syncId, forceFullSync, batchSize);
        }

        // Atualizar metadata como completado
        await this.updateSyncMetadata(syncId, {
          status: 'completed',
          completed_at: new Date(),
        });

        // Buscar metadata atualizado
        const { data: finalMetadata } = await supabase
          .from('wc_sync_metadata')
          .select('*')
          .eq('id', syncId)
          .single();

        return {
          success: true,
          metadata: finalMetadata as SyncMetadata,
        };
      } catch (syncError) {
        // Atualizar metadata como falha
        await this.updateSyncMetadata(syncId, {
          status: 'failed',
          error_message: syncError instanceof Error ? syncError.message : 'Unknown error',
        });

        throw syncError;
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Sincroniza produtos do WooCommerce
   */
  private async syncProducts(syncId: number, forceFullSync: boolean, batchSize: number): Promise<void> {
    let page = 1;
    let totalProcessed = 0;
    let totalCreated = 0;
    let totalUpdated = 0;
    let totalFailed = 0;

    // Obter última data de sync se não for full sync
    let lastSyncDate: Date | null = null;
    if (!forceFullSync) {
      const { data: lastSync } = await supabase
        .from('wc_sync_metadata')
        .select('last_synced_at')
        .eq('sync_type', 'products')
        .eq('status', 'completed')
        .order('started_at', { ascending: false })
        .limit(1)
        .single();

      if (lastSync?.last_synced_at) {
        lastSyncDate = new Date(lastSync.last_synced_at);
      }
    }

    while (true) {
      try {
        // Buscar produtos do WooCommerce
        const response = await wooCommerceApi.get('products', {
          page,
          per_page: batchSize,
          // Se não for full sync, buscar apenas produtos modificados após último sync
          ...(lastSyncDate && {
            after: lastSyncDate.toISOString(),
          }),
        });

        const products = response.data;

        if (products.length === 0) {
          break;
        }

        // Processar cada produto
        for (const product of products) {
          try {
            const result = await this.upsertProduct(product);
            if (result === 'created') {
              totalCreated++;
            } else if (result === 'updated') {
              totalUpdated++;
            }
            totalProcessed++;
          } catch (error) {
            console.error(`Failed to sync product ${product.id}:`, error);
            totalFailed++;
          }
        }

        // Atualizar progresso
        await this.updateSyncMetadata(syncId, {
          items_processed: totalProcessed,
          items_created: totalCreated,
          items_updated: totalUpdated,
          items_failed: totalFailed,
        });

        page++;

        // Se retornou menos que o batch size, chegamos ao fim
        if (products.length < batchSize) {
          break;
        }
      } catch (error) {
        console.error(`Failed to fetch products page ${page}:`, error);
        totalFailed += batchSize;
        break;
      }
    }

    // Atualizar última data de sync
    const { data: latestProduct } = await supabase
      .from('wc_products_cache')
      .select('wc_modified_at')
      .order('wc_modified_at', { ascending: false })
      .limit(1)
      .single();

    if (latestProduct?.wc_modified_at) {
      await this.updateSyncMetadata(syncId, {
        last_synced_at: new Date(latestProduct.wc_modified_at),
      });
    }
  }

  /**
   * Sincroniza clientes do WooCommerce
   */
  private async syncCustomers(syncId: number, forceFullSync: boolean, batchSize: number): Promise<void> {
    let page = 1;
    let totalProcessed = 0;
    let totalCreated = 0;
    let totalUpdated = 0;
    let totalFailed = 0;

    // Obter última data de sync se não for full sync
    let lastSyncDate: Date | null = null;
    if (!forceFullSync) {
      const { data: lastSync } = await supabase
        .from('wc_sync_metadata')
        .select('last_synced_at')
        .eq('sync_type', 'customers')
        .eq('status', 'completed')
        .order('started_at', { ascending: false })
        .limit(1)
        .single();

      if (lastSync?.last_synced_at) {
        lastSyncDate = new Date(lastSync.last_synced_at);
      }
    }

    while (true) {
      try {
        // Buscar clientes do WooCommerce
        const response = await wooCommerceApi.get('customers', {
          page,
          per_page: batchSize,
          // Se não for full sync, buscar apenas clientes modificados após último sync
          ...(lastSyncDate && {
            after: lastSyncDate.toISOString(),
          }),
        });

        const customers = response.data;

        if (customers.length === 0) {
          break;
        }

        // Processar cada cliente
        for (const customer of customers) {
          try {
            const result = await this.upsertCustomer(customer);
            if (result === 'created') {
              totalCreated++;
            } else if (result === 'updated') {
              totalUpdated++;
            }
            totalProcessed++;
          } catch (error) {
            console.error(`Failed to sync customer ${customer.id}:`, error);
            totalFailed++;
          }
        }

        // Atualizar progresso
        await this.updateSyncMetadata(syncId, {
          items_processed: totalProcessed,
          items_created: totalCreated,
          items_updated: totalUpdated,
          items_failed: totalFailed,
        });

        page++;

        // Se retornou menos que o batch size, chegamos ao fim
        if (customers.length < batchSize) {
          break;
        }
      } catch (error) {
        console.error(`Failed to fetch customers page ${page}:`, error);
        totalFailed += batchSize;
        break;
      }
    }

    // Atualizar última data de sync
    const { data: latestCustomer } = await supabase
      .from('wc_customers_cache')
      .select('wc_modified_at')
      .order('wc_modified_at', { ascending: false })
      .limit(1)
      .single();

    if (latestCustomer?.wc_modified_at) {
      await this.updateSyncMetadata(syncId, {
        last_synced_at: new Date(latestCustomer.wc_modified_at),
      });
    }
  }

  /**
   * Insere ou atualiza um produto no cache
   */
  private async upsertProduct(product: any): Promise<'created' | 'updated'> {
    const { data: existing } = await supabase
      .from('wc_products_cache')
      .select('id')
      .eq('id', product.id)
      .single();

    const productData = {
      id: product.id,
      name: product.name,
      type: product.type || 'simple', // simple, variable, grouped, external
      sku: product.sku || null,
      price: product.price ? parseFloat(product.price) : null,
      regular_price: product.regular_price ? parseFloat(product.regular_price) : null,
      description: product.description || null,
      short_description: product.short_description || null,
      stock_status: product.stock_status || null,
      stock_quantity: product.stock_quantity || null,
      manage_stock: product.manage_stock || false,
      images: product.images || [],
      categories: product.categories || [],
      attributes: product.attributes || [],
      variations: product.variations || [],
      meta_data: product.meta_data || [],
      precos_por_quantidade: this.extractPrecosPorQuantidade(product.meta_data),
      wc_modified_at: product.date_modified ? new Date(product.date_modified) : new Date(),
      synced_at: new Date(),
      is_active: true,
    };

    if (existing) {
      // Atualizar
      await supabase
        .from('wc_products_cache')
        .update(productData)
        .eq('id', product.id);
      return 'updated';
    } else {
      // Inserir
      await supabase
        .from('wc_products_cache')
        .insert(productData);
      return 'created';
    }
  }

  /**
   * Insere ou atualiza um cliente no cache
   */
  private async upsertCustomer(customer: any): Promise<'created' | 'updated'> {
    const { data: existing } = await supabase
      .from('wc_customers_cache')
      .select('id')
      .eq('id', customer.id)
      .single();

    const customerData = {
      id: customer.id,
      email: customer.email,
      first_name: customer.first_name || null,
      last_name: customer.last_name || null,
      username: customer.username || null,
      billing: customer.billing || {},
      shipping: customer.shipping || {},
      role: customer.role || null,
      wc_modified_at: customer.date_modified ? new Date(customer.date_modified) : new Date(),
      synced_at: new Date(),
      is_active: true,
    };

    if (existing) {
      // Atualizar
      await supabase
        .from('wc_customers_cache')
        .update(customerData)
        .eq('id', customer.id);
      return 'updated';
    } else {
      // Inserir
      await supabase
        .from('wc_customers_cache')
        .insert(customerData);
      return 'created';
    }
  }

  /**
   * Extrai preços por quantidade do meta_data do produto
   */
  private extractPrecosPorQuantidade(metaData: any[]): any {
    const precoField = metaData?.find((meta: any) => meta.key === 'precos_por_quantidade');
    if (precoField?.value) {
      try {
        return typeof precoField.value === 'string'
          ? JSON.parse(precoField.value)
          : precoField.value;
      } catch (error) {
        console.error('Failed to parse precos_por_quantidade:', error);
        return null;
      }
    }
    return null;
  }

  /**
   * Atualiza metadata de sync
   */
  private async updateSyncMetadata(
    syncId: number,
    updates: Partial<SyncMetadata>
  ): Promise<void> {
    await supabase
      .from('wc_sync_metadata')
      .update(updates)
      .eq('id', syncId);
  }

  /**
   * Obtém o status do último sync
   */
  async getLastSyncStatus(syncType?: 'products' | 'customers' | 'full' | 'incremental'): Promise<SyncMetadata | null> {
    const query = supabase
      .from('wc_sync_metadata')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(1);

    if (syncType) {
      query.eq('sync_type', syncType);
    }

    const { data, error } = await query.single();

    if (error || !data) {
      return null;
    }

    return data as SyncMetadata;
  }

  /**
   * Verifica se o cache está desatualizado
   */
  async isCacheStale(maxAgeMinutes: number = 60): Promise<boolean> {
    const lastSync = await this.getLastSyncStatus('full');

    if (!lastSync || lastSync.status !== 'completed') {
      return true;
    }

    const lastSyncTime = new Date(lastSync.completed_at || lastSync.started_at);
    const now = new Date();
    const diffMinutes = (now.getTime() - lastSyncTime.getTime()) / (1000 * 60);

    return diffMinutes > maxAgeMinutes;
  }
}

// Exportar instância singleton
export const wooCommerceSyncService = WooCommerceSyncService.getInstance();
