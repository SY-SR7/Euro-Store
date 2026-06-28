export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type UserRole = 'customer' | 'admin' | 'sub_admin' | 'helper' | 'partner';
type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'picked_up'
  | 'shipped'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | 'rejected';
type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
type PaymentMethod = 'sham_cash' | 'cash_on_delivery';
type ExchangeStatus =
  | 'pending'
  | 'approved'
  | 'qr_generated'
  | 'qr_scanned'
  | 'completed'
  | 'rejected'
  | 'expired';
type LoyaltyTxType =
  | 'earned_purchase'
  | 'earned_referral'
  | 'earned_offline'
  | 'redeemed'
  | 'adjusted_admin'
  | 'expired';
type NotificationType = 'order_update' | 'exchange_update' | 'loyalty_update' | 'promotional' | 'system';
type PermissionLevel = 'view_only' | 'edit' | 'full_access';

type InsertWithoutGenerated<Row, Generated extends keyof Row> = Omit<Row, Generated> & Partial<Pick<Row, Generated>>;

export interface Database {
  public: {
    Tables: {
      customer_profiles: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          phone: string | null;
          avatar_url: string | null;
          loyalty_points: number;
          referral_code: string | null;
          referred_by: string | null;
          preferred_language: string;
          created_at: string;
          updated_at: string;
        };
        Insert: InsertWithoutGenerated<
          Database['public']['Tables']['customer_profiles']['Row'],
          'id' | 'loyalty_points' | 'referral_code' | 'created_at' | 'updated_at'
        >;
        Update: Partial<Database['public']['Tables']['customer_profiles']['Insert']>;
      };
      admin_profiles: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          totp_secret: string | null;
          totp_enabled: boolean;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: InsertWithoutGenerated<
          Database['public']['Tables']['admin_profiles']['Row'],
          'id' | 'totp_secret' | 'totp_enabled' | 'is_active' | 'created_at' | 'updated_at'
        >;
        Update: Partial<Database['public']['Tables']['admin_profiles']['Insert']>;
      };
      sub_admin_profiles: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          totp_secret: string | null;
          totp_enabled: boolean;
          is_active: boolean;
          created_by: string | null;
          created_at: string;
        };
        Insert: InsertWithoutGenerated<
          Database['public']['Tables']['sub_admin_profiles']['Row'],
          'id' | 'totp_secret' | 'totp_enabled' | 'is_active' | 'created_at'
        >;
        Update: Partial<Database['public']['Tables']['sub_admin_profiles']['Insert']>;
      };
      helper_profiles: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          phone: string | null;
          is_active: boolean;
          branch_name: string;
          created_at: string;
        };
        Insert: InsertWithoutGenerated<
          Database['public']['Tables']['helper_profiles']['Row'],
          'id' | 'is_active' | 'created_at'
        >;
        Update: Partial<Database['public']['Tables']['helper_profiles']['Insert']>;
      };
      partner_profiles: {
        Row: {
          id: string;
          business_name: string;
          contact_name: string;
          email: string;
          phone: string;
          address_ar: string;
          address_en: string;
          governorate: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: InsertWithoutGenerated<
          Database['public']['Tables']['partner_profiles']['Row'],
          'id' | 'is_active' | 'created_at'
        >;
        Update: Partial<Database['public']['Tables']['partner_profiles']['Insert']>;
      };
      products: {
        Row: {
          id: string;
          name_ar: string;
          name_en: string;
          slug: string;
          description_ar: string;
          description_en: string;
          category_id: string | null;
          brand_id: string | null;
          is_active: boolean;
          is_featured: boolean;
          tags: string[] | null;
          search_vector: unknown | null;
          created_at: string;
          updated_at: string;
        };
        Insert: InsertWithoutGenerated<
          Database['public']['Tables']['products']['Row'],
          'id' | 'is_active' | 'is_featured' | 'search_vector' | 'created_at' | 'updated_at'
        >;
        Update: Partial<Database['public']['Tables']['products']['Insert']>;
      };
      categories: {
        Row: {
          id: string;
          name_ar: string;
          name_en: string;
          slug: string;
          parent_id: string | null;
          image_url: string | null;
          sort_order: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: InsertWithoutGenerated<
          Database['public']['Tables']['categories']['Row'],
          'id' | 'sort_order' | 'is_active' | 'created_at'
        >;
        Update: Partial<Database['public']['Tables']['categories']['Insert']>;
      };
      orders: {
        Row: {
          id: string;
          order_number: string;
          customer_id: string | null;
          address_snapshot: Json;
          status: OrderStatus;
          payment_status: PaymentStatus;
          payment_method: PaymentMethod;
          subtotal_syp: number;
          discount_syp: number;
          loyalty_discount_syp: number;
          shipping_syp: number;
          total_syp: number;
          discount_code_id: string | null;
          loyalty_points_used: number;
          loyalty_points_earned: number;
          notes: string | null;
          rejected_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: InsertWithoutGenerated<
          Database['public']['Tables']['orders']['Row'],
          | 'id'
          | 'status'
          | 'payment_status'
          | 'payment_method'
          | 'discount_syp'
          | 'loyalty_discount_syp'
          | 'loyalty_points_used'
          | 'loyalty_points_earned'
          | 'created_at'
          | 'updated_at'
        >;
        Update: Partial<Database['public']['Tables']['orders']['Insert']>;
      };
      exchange_requests: {
        Row: {
          id: string;
          order_id: string | null;
          customer_id: string | null;
          status: ExchangeStatus;
          reason_ar: string;
          reason_en: string;
          customer_images: string[] | null;
          approved_by: string | null;
          approved_at: string | null;
          qr_code_token: string | null;
          qr_code_url: string | null;
          qr_code_generated_at: string | null;
          qr_code_expires_at: string | null;
          qr_code_used_at: string | null;
          processed_by_id: string | null;
          processed_by_role: UserRole | null;
          partner_id: string | null;
          exchange_type: 'same_item' | 'different_item' | null;
          new_variant_id: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: InsertWithoutGenerated<
          Database['public']['Tables']['exchange_requests']['Row'],
          'id' | 'status' | 'created_at' | 'updated_at'
        >;
        Update: Partial<Database['public']['Tables']['exchange_requests']['Insert']>;
      };
      loyalty_points_transactions: {
        Row: {
          id: string;
          customer_id: string | null;
          type: LoyaltyTxType;
          points: number;
          balance_after: number;
          reference_id: string | null;
          processed_by_id: string | null;
          processed_by_role: UserRole | null;
          notes: string | null;
          created_at: string;
        };
        Insert: InsertWithoutGenerated<
          Database['public']['Tables']['loyalty_points_transactions']['Row'],
          'id' | 'created_at'
        >;
        Update: Partial<Database['public']['Tables']['loyalty_points_transactions']['Insert']>;
      };
      audit_logs: {
        Row: {
          id: string;
          actor_id: string;
          actor_role: UserRole;
          action: string;
          entity_type: string;
          entity_id: string;
          before_state: Json | null;
          after_state: Json | null;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: InsertWithoutGenerated<Database['public']['Tables']['audit_logs']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['audit_logs']['Insert']>;
      };
      homepage_sections: {
        Row: {
          id: string;
          section_key: string;
          title_ar: string;
          title_en: string;
          content: Json;
          is_active: boolean;
          sort_order: number;
          updated_at: string;
        };
        Insert: InsertWithoutGenerated<
          Database['public']['Tables']['homepage_sections']['Row'],
          'id' | 'is_active' | 'sort_order' | 'updated_at'
        >;
        Update: Partial<Database['public']['Tables']['homepage_sections']['Insert']>;
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      award_loyalty_points: {
        Args: {
          p_customer_id: string;
          p_points: number;
          p_type: LoyaltyTxType;
          p_reference_id?: string | null;
          p_processed_by_id?: string | null;
          p_processed_by_role?: UserRole;
          p_notes?: string | null;
        };
        Returns: undefined;
      };
      generate_order_number: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      generate_referral_code: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
    };
    Enums: {
      user_role: UserRole;
      order_status: OrderStatus;
      payment_status: PaymentStatus;
      payment_method: PaymentMethod;
      exchange_status: ExchangeStatus;
      loyalty_tx_type: LoyaltyTxType;
      notification_type: NotificationType;
      permission_level: PermissionLevel;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
