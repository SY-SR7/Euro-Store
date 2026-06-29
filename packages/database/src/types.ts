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
        Insert: {
          id?: string;
          full_name: string;
          email: string;
          phone?: string | null;
          avatar_url?: string | null;
          loyalty_points?: number;
          referral_code?: string | null;
          referred_by?: string | null;
          preferred_language?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['customer_profiles']['Insert']>;
        Relationships: [];
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
        Relationships: [];
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
        Relationships: [];
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
        Relationships: [];
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
        Relationships: [];
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
          search_vector: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: InsertWithoutGenerated<
          Database['public']['Tables']['products']['Row'],
          'id' | 'is_active' | 'is_featured' | 'search_vector' | 'created_at' | 'updated_at'
        >;
        Update: Partial<Database['public']['Tables']['products']['Insert']>;
        Relationships: [];
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
        Relationships: [];
      };
      brands: {
        Row: {
          id: string;
          name: string;
          slug: string;
          logo_url: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          logo_url?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['brands']['Insert']>;
        Relationships: [];
      };
      attribute_types: {
        Row: {
          id: string;
          name_ar: string;
          name_en: string;
          slug: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name_ar: string;
          name_en: string;
          slug: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['attribute_types']['Insert']>;
        Relationships: [];
      };
      attribute_values: {
        Row: {
          id: string;
          attribute_type_id: string | null;
          value_ar: string;
          value_en: string;
          hex_color: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          attribute_type_id?: string | null;
          value_ar: string;
          value_en: string;
          hex_color?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['attribute_values']['Insert']>;
        Relationships: [];
      };
      product_variants: {
        Row: {
          id: string;
          product_id: string | null;
          sku: string;
          price_syp: number;
          compare_price_syp: number | null;
          stock_quantity: number;
          weight_grams: number | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id?: string | null;
          sku: string;
          price_syp: number;
          compare_price_syp?: number | null;
          stock_quantity?: number;
          weight_grams?: number | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['product_variants']['Insert']>;
        Relationships: [];
      };
      variant_attributes: {
        Row: {
          variant_id: string;
          attribute_value_id: string;
        };
        Insert: {
          variant_id: string;
          attribute_value_id: string;
        };
        Update: Partial<Database['public']['Tables']['variant_attributes']['Insert']>;
        Relationships: [];
      };
      product_images: {
        Row: {
          id: string;
          product_id: string | null;
          variant_id: string | null;
          url: string;
          alt_ar: string | null;
          alt_en: string | null;
          sort_order: number;
          is_primary: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id?: string | null;
          variant_id?: string | null;
          url: string;
          alt_ar?: string | null;
          alt_en?: string | null;
          sort_order?: number;
          is_primary?: boolean;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['product_images']['Insert']>;
        Relationships: [];
      };
      product_videos: {
        Row: {
          id: string;
          product_id: string | null;
          url: string;
          thumbnail_url: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id?: string | null;
          url: string;
          thumbnail_url: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['product_videos']['Insert']>;
        Relationships: [];
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
        Relationships: [];
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
        Relationships: [];
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
        Relationships: [];
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
        Relationships: [];
      };
      shipping_rates: {
        Row: {
          id: string;
          governorate: string;
          base_rate_syp: number;
          free_shipping_threshold_syp: number | null;
          is_active: boolean;
        };
        Insert: InsertWithoutGenerated<Database['public']['Tables']['shipping_rates']['Row'], 'id' | 'is_active'>;
        Update: Partial<Database['public']['Tables']['shipping_rates']['Insert']>;
        Relationships: [];
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
        Relationships: [];
      };

      customer_addresses: {
        Row: {
          id: string;
          customer_id: string | null;
          label: string;
          full_name: string;
          phone: string;
          governorate: string;
          city: string;
          street: string;
          is_default: boolean;
          created_at: string;
        };
        Insert: InsertWithoutGenerated<
          Database['public']['Tables']['customer_addresses']['Row'],
          'id' | 'is_default' | 'created_at'
        >;
        Update: Partial<Database['public']['Tables']['customer_addresses']['Insert']>;
        Relationships: [];
      };
      discount_codes: {
        Row: {
          id: string;
          code: string;
          type: 'percentage' | 'fixed';
          value: number;
          min_order_syp: number;
          max_uses: number | null;
          used_count: number;
          valid_from: string;
          valid_until: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: InsertWithoutGenerated<
          Database['public']['Tables']['discount_codes']['Row'],
          'id' | 'used_count' | 'is_active' | 'created_at'
        >;
        Update: Partial<Database['public']['Tables']['discount_codes']['Insert']>;
        Relationships: [];
      };
      exchange_items: {
        Row: {
          id: string;
          exchange_request_id: string | null;
          original_order_item_id: string | null;
          original_variant_id: string | null;
          exchange_variant_id: string | null;
          quantity: number;
          created_at: string;
        };
        Insert: InsertWithoutGenerated<
          Database['public']['Tables']['exchange_items']['Row'],
          'id' | 'created_at'
        >;
        Update: Partial<Database['public']['Tables']['exchange_items']['Insert']>;
        Relationships: [];
      };
      exchange_qr_tokens: {
        Row: {
          id: string;
          exchange_request_id: string;
          customer_id: string;
          token_hash: string;
          expires_at: string;
          redeemed_at: string | null;
          created_at: string;
        };
        Insert: InsertWithoutGenerated<
          Database['public']['Tables']['exchange_qr_tokens']['Row'],
          'id' | 'redeemed_at'
        >;
        Update: Partial<Database['public']['Tables']['exchange_qr_tokens']['Insert']>;
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          recipient_id: string;
          recipient_role: UserRole;
          type: NotificationType;
          title_ar: string;
          title_en: string;
          body_ar: string;
          body_en: string;
          data: Json | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: InsertWithoutGenerated<
          Database['public']['Tables']['notifications']['Row'],
          'id' | 'is_read' | 'created_at'
        >;
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>;
        Relationships: [];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string | null;
          variant_id: string | null;
          product_snapshot: Json;
          quantity: number;
          unit_price_syp: number;
          total_price_syp: number;
          created_at: string;
        };
        Insert: InsertWithoutGenerated<
          Database['public']['Tables']['order_items']['Row'],
          'id' | 'created_at'
        >;
        Update: Partial<Database['public']['Tables']['order_items']['Insert']>;
        Relationships: [];
      };
      order_status_history: {
        Row: {
          id: string;
          order_id: string | null;
          from_status: OrderStatus | null;
          to_status: OrderStatus;
          changed_by_id: string;
          changed_by_role: UserRole;
          notes: string | null;
          created_at: string;
        };
        Insert: InsertWithoutGenerated<
          Database['public']['Tables']['order_status_history']['Row'],
          'id' | 'created_at'
        >;
        Update: Partial<Database['public']['Tables']['order_status_history']['Insert']>;
        Relationships: [];
      };
      referral_tracking: {
        Row: {
          id: string;
          referrer_id: string | null;
          referred_id: string | null;
          referral_code: string;
          bonus_awarded: boolean;
          created_at: string;
        };
        Insert: InsertWithoutGenerated<
          Database['public']['Tables']['referral_tracking']['Row'],
          'id' | 'bonus_awarded' | 'created_at'
        >;
        Update: Partial<Database['public']['Tables']['referral_tracking']['Insert']>;
        Relationships: [];
      };
      sub_admin_permissions: {
        Row: {
          id: string;
          sub_admin_id: string | null;
          module: string;
          permission_level: PermissionLevel;
          granted_by: string | null;
          created_at: string;
        };
        Insert: InsertWithoutGenerated<
          Database['public']['Tables']['sub_admin_permissions']['Row'],
          'id' | 'created_at'
        >;
        Update: Partial<Database['public']['Tables']['sub_admin_permissions']['Insert']>;
        Relationships: [];
      };
      system_settings: {
        Row: {
          key: string;
          value: string | null;
          description: string | null;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          key: string;
          value?: string | null;
          description?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: Partial<Database['public']['Tables']['system_settings']['Insert']>;
        Relationships: [];
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
