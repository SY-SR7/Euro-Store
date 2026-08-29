export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      admin_profiles: {
        Row: {
          created_at: string | null
          email: string
          full_name: string
          id: string
          is_active: boolean | null
          totp_enabled: boolean | null
          totp_failed_attempts: number
          totp_locked_until: string | null
          totp_secret: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name: string
          id?: string
          is_active?: boolean | null
          totp_enabled?: boolean | null
          totp_failed_attempts?: number
          totp_locked_until?: string | null
          totp_secret?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean | null
          totp_enabled?: boolean | null
          totp_failed_attempts?: number
          totp_locked_until?: string | null
          totp_secret?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      attribute_types: {
        Row: {
          created_at: string | null
          id: string
          name_ar: string
          name_en: string
          slug: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name_ar: string
          name_en: string
          slug: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name_ar?: string
          name_en?: string
          slug?: string
        }
        Relationships: []
      }
      attribute_values: {
        Row: {
          attribute_type_id: string | null
          created_at: string | null
          hex_color: string | null
          id: string
          sort_order: number | null
          value_ar: string
          value_en: string
        }
        Insert: {
          attribute_type_id?: string | null
          created_at?: string | null
          hex_color?: string | null
          id?: string
          sort_order?: number | null
          value_ar: string
          value_en: string
        }
        Update: {
          attribute_type_id?: string | null
          created_at?: string | null
          hex_color?: string | null
          id?: string
          sort_order?: number | null
          value_ar?: string
          value_en?: string
        }
        Relationships: [
          {
            foreignKeyName: "attribute_values_attribute_type_id_fkey"
            columns: ["attribute_type_id"]
            isOneToOne: false
            referencedRelation: "attribute_types"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string
          actor_role: Database["public"]["Enums"]["user_role"]
          after_state: Json | null
          before_state: Json | null
          created_at: string | null
          entity_id: string
          entity_type: string
          id: string
          ip_address: unknown
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_id: string
          actor_role: Database["public"]["Enums"]["user_role"]
          after_state?: Json | null
          before_state?: Json | null
          created_at?: string | null
          entity_id: string
          entity_type: string
          id?: string
          ip_address?: unknown
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_id?: string
          actor_role?: Database["public"]["Enums"]["user_role"]
          after_state?: Json | null
          before_state?: Json | null
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          ip_address?: unknown
          user_agent?: string | null
        }
        Relationships: []
      }
      brands: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          slug: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          slug: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          slug?: string
        }
        Relationships: []
      }
      bundle_items: {
        Row: {
          bundle_id: string
          id: string
          product_variant_id: string
          quantity: number
        }
        Insert: {
          bundle_id: string
          id?: string
          product_variant_id: string
          quantity?: number
        }
        Update: {
          bundle_id?: string
          id?: string
          product_variant_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "bundle_items_bundle_id_fkey"
            columns: ["bundle_id"]
            isOneToOne: false
            referencedRelation: "product_bundles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bundle_items_product_variant_id_fkey"
            columns: ["product_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      cart_bundle_items: {
        Row: {
          added_at: string
          bundle_id: string
          customer_id: string
          id: string
          quantity: number
          updated_at: string
        }
        Insert: {
          added_at?: string
          bundle_id: string
          customer_id: string
          id?: string
          quantity: number
          updated_at?: string
        }
        Update: {
          added_at?: string
          bundle_id?: string
          customer_id?: string
          id?: string
          quantity?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_bundle_items_bundle_id_fkey"
            columns: ["bundle_id"]
            isOneToOne: false
            referencedRelation: "product_bundles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_bundle_items_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cart_items: {
        Row: {
          added_at: string
          customer_id: string
          id: string
          product_variant_id: string
          quantity: number
          updated_at: string
        }
        Insert: {
          added_at?: string
          customer_id: string
          id?: string
          product_variant_id: string
          quantity?: number
          updated_at?: string
        }
        Update: {
          added_at?: string
          customer_id?: string
          id?: string
          product_variant_id?: string
          quantity?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_product_variant_id_fkey"
            columns: ["product_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name_ar: string
          name_en: string
          parent_id: string | null
          size_guide_id: string | null
          slug: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name_ar: string
          name_en: string
          parent_id?: string | null
          size_guide_id?: string | null
          slug: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name_ar?: string
          name_en?: string
          parent_id?: string | null
          size_guide_id?: string | null
          slug?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categories_size_guide_id_fkey"
            columns: ["size_guide_id"]
            isOneToOne: false
            referencedRelation: "size_guides"
            referencedColumns: ["id"]
          },
        ]
      }
      collection_products: {
        Row: {
          collection_id: string
          product_id: string
          sort_order: number
        }
        Insert: {
          collection_id: string
          product_id: string
          sort_order?: number
        }
        Update: {
          collection_id?: string
          product_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "collection_products_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      collections: {
        Row: {
          created_at: string
          description_ar: string | null
          description_en: string | null
          has_standalone_page: boolean
          id: string
          is_active: boolean
          is_featured_on_homepage: boolean
          name_ar: string
          name_en: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          has_standalone_page?: boolean
          id?: string
          is_active?: boolean
          is_featured_on_homepage?: boolean
          name_ar: string
          name_en: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          has_standalone_page?: boolean
          id?: string
          is_active?: boolean
          is_featured_on_homepage?: boolean
          name_ar?: string
          name_en?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      customer_addresses: {
        Row: {
          city: string
          created_at: string | null
          customer_id: string | null
          full_name: string
          governorate: string
          id: string
          is_default: boolean | null
          label: string
          phone: string
          street: string
        }
        Insert: {
          city: string
          created_at?: string | null
          customer_id?: string | null
          full_name: string
          governorate: string
          id?: string
          is_default?: boolean | null
          label: string
          phone: string
          street: string
        }
        Update: {
          city?: string
          created_at?: string | null
          customer_id?: string | null
          full_name?: string
          governorate?: string
          id?: string
          is_default?: boolean | null
          label?: string
          phone?: string
          street?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_addresses_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_profiles: {
        Row: {
          avatar_url: string | null
          cart_data: Json | null
          created_at: string | null
          email: string
          full_name: string
          gender: string | null
          id: string
          is_blocked: boolean
          loyalty_points: number | null
          loyalty_qr_version: number
          phone: string | null
          preferred_language: string | null
          qr_code_url: string | null
          referral_code: string
          referred_by: string | null
          updated_at: string | null
          wishlist_share_token: string | null
        }
        Insert: {
          avatar_url?: string | null
          cart_data?: Json | null
          created_at?: string | null
          email: string
          full_name: string
          gender?: string | null
          id?: string
          is_blocked?: boolean
          loyalty_points?: number | null
          loyalty_qr_version?: number
          phone?: string | null
          preferred_language?: string | null
          qr_code_url?: string | null
          referral_code: string
          referred_by?: string | null
          updated_at?: string | null
          wishlist_share_token?: string | null
        }
        Update: {
          avatar_url?: string | null
          cart_data?: Json | null
          created_at?: string | null
          email?: string
          full_name?: string
          gender?: string | null
          id?: string
          is_blocked?: boolean
          loyalty_points?: number | null
          loyalty_qr_version?: number
          phone?: string | null
          preferred_language?: string | null
          qr_code_url?: string | null
          referral_code?: string
          referred_by?: string | null
          updated_at?: string | null
          wishlist_share_token?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "customer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      discount_code_usages: {
        Row: {
          created_at: string
          customer_id: string | null
          discount_amount: number
          discount_code_id: string
          id: string
          order_id: string
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          discount_amount?: number
          discount_code_id: string
          id?: string
          order_id: string
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          discount_amount?: number
          discount_code_id?: string
          id?: string
          order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "discount_code_usages_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discount_code_usages_discount_code_id_fkey"
            columns: ["discount_code_id"]
            isOneToOne: false
            referencedRelation: "discount_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discount_code_usages_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      discount_codes: {
        Row: {
          category_ids: string[] | null
          code: string
          created_at: string | null
          created_by: string | null
          description: string | null
          eligibility: string
          id: string
          is_active: boolean | null
          max_uses: number | null
          max_uses_per_user: number | null
          max_uses_total: number | null
          min_cart_value: number | null
          min_order_syp: number | null
          product_ids: string[] | null
          scope: string
          type: string
          updated_at: string
          used_count: number | null
          uses_count: number | null
          valid_from: string
          valid_until: string
          value: number
        }
        Insert: {
          category_ids?: string[] | null
          code: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          eligibility?: string
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          max_uses_per_user?: number | null
          max_uses_total?: number | null
          min_cart_value?: number | null
          min_order_syp?: number | null
          product_ids?: string[] | null
          scope?: string
          type: string
          updated_at?: string
          used_count?: number | null
          uses_count?: number | null
          valid_from: string
          valid_until: string
          value: number
        }
        Update: {
          category_ids?: string[] | null
          code?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          eligibility?: string
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          max_uses_per_user?: number | null
          max_uses_total?: number | null
          min_cart_value?: number | null
          min_order_syp?: number | null
          product_ids?: string[] | null
          scope?: string
          type?: string
          updated_at?: string
          used_count?: number | null
          uses_count?: number | null
          valid_from?: string
          valid_until?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "discount_codes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      exchange_items: {
        Row: {
          created_at: string | null
          exchange_request_id: string | null
          exchange_variant_id: string | null
          id: string
          original_order_item_id: string | null
          original_variant_id: string | null
          quantity: number
        }
        Insert: {
          created_at?: string | null
          exchange_request_id?: string | null
          exchange_variant_id?: string | null
          id?: string
          original_order_item_id?: string | null
          original_variant_id?: string | null
          quantity: number
        }
        Update: {
          created_at?: string | null
          exchange_request_id?: string | null
          exchange_variant_id?: string | null
          id?: string
          original_order_item_id?: string | null
          original_variant_id?: string | null
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "exchange_items_exchange_request_id_fkey"
            columns: ["exchange_request_id"]
            isOneToOne: false
            referencedRelation: "exchange_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exchange_items_exchange_variant_id_fkey"
            columns: ["exchange_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exchange_items_original_order_item_id_fkey"
            columns: ["original_order_item_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exchange_items_original_variant_id_fkey"
            columns: ["original_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      exchange_qr_tokens: {
        Row: {
          created_at: string
          customer_id: string
          exchange_request_id: string
          expires_at: string
          id: string
          redeemed_at: string | null
          token_hash: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          exchange_request_id: string
          expires_at: string
          id?: string
          redeemed_at?: string | null
          token_hash: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          exchange_request_id?: string
          expires_at?: string
          id?: string
          redeemed_at?: string | null
          token_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "exchange_qr_tokens_exchange_request_id_fkey"
            columns: ["exchange_request_id"]
            isOneToOne: false
            referencedRelation: "exchange_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      exchange_request_images: {
        Row: {
          created_at: string
          exchange_request_id: string
          id: string
          uploaded_at: string
          url: string
        }
        Insert: {
          created_at?: string
          exchange_request_id: string
          id?: string
          uploaded_at?: string
          url: string
        }
        Update: {
          created_at?: string
          exchange_request_id?: string
          id?: string
          uploaded_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "exchange_request_images_exchange_request_id_fkey"
            columns: ["exchange_request_id"]
            isOneToOne: false
            referencedRelation: "exchange_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      exchange_requests: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          customer_id: string
          customer_images: string[] | null
          customer_whatsapp: string
          exchange_type: string | null
          id: string
          new_variant_id: string | null
          notes: string | null
          order_id: string
          order_item_id: string
          partner_id: string | null
          partner_stage: string | null
          processed_by_id: string | null
          processed_by_role: Database["public"]["Enums"]["user_role"] | null
          qr_code_expires_at: string | null
          qr_code_generated_at: string | null
          qr_code_token: string | null
          qr_code_url: string | null
          qr_code_used_at: string | null
          reason: string
          reason_ar: string
          reason_en: string
          rejection_reason: string | null
          replacement_order_id: string | null
          replacement_variant_id: string | null
          resolution_path: string | null
          return_method: string | null
          status: Database["public"]["Enums"]["exchange_status"] | null
          updated_at: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          customer_id: string
          customer_images?: string[] | null
          customer_whatsapp: string
          exchange_type?: string | null
          id?: string
          new_variant_id?: string | null
          notes?: string | null
          order_id: string
          order_item_id: string
          partner_id?: string | null
          partner_stage?: string | null
          processed_by_id?: string | null
          processed_by_role?: Database["public"]["Enums"]["user_role"] | null
          qr_code_expires_at?: string | null
          qr_code_generated_at?: string | null
          qr_code_token?: string | null
          qr_code_url?: string | null
          qr_code_used_at?: string | null
          reason: string
          reason_ar: string
          reason_en: string
          rejection_reason?: string | null
          replacement_order_id?: string | null
          replacement_variant_id?: string | null
          resolution_path?: string | null
          return_method?: string | null
          status?: Database["public"]["Enums"]["exchange_status"] | null
          updated_at?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          customer_id?: string
          customer_images?: string[] | null
          customer_whatsapp?: string
          exchange_type?: string | null
          id?: string
          new_variant_id?: string | null
          notes?: string | null
          order_id?: string
          order_item_id?: string
          partner_id?: string | null
          partner_stage?: string | null
          processed_by_id?: string | null
          processed_by_role?: Database["public"]["Enums"]["user_role"] | null
          qr_code_expires_at?: string | null
          qr_code_generated_at?: string | null
          qr_code_token?: string | null
          qr_code_url?: string | null
          qr_code_used_at?: string | null
          reason?: string
          reason_ar?: string
          reason_en?: string
          rejection_reason?: string | null
          replacement_order_id?: string | null
          replacement_variant_id?: string | null
          resolution_path?: string | null
          return_method?: string | null
          status?: Database["public"]["Enums"]["exchange_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exchange_requests_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "admin_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exchange_requests_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exchange_requests_new_variant_id_fkey"
            columns: ["new_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exchange_requests_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exchange_requests_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exchange_requests_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exchange_requests_replacement_order_id_fkey"
            columns: ["replacement_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exchange_requests_replacement_variant_id_fkey"
            columns: ["replacement_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      exchange_status_history: {
        Row: {
          changed_by_id: string | null
          changed_by_role: string | null
          created_at: string
          exchange_request_id: string
          id: string
          notes: string | null
          status: string
        }
        Insert: {
          changed_by_id?: string | null
          changed_by_role?: string | null
          created_at?: string
          exchange_request_id: string
          id?: string
          notes?: string | null
          status: string
        }
        Update: {
          changed_by_id?: string | null
          changed_by_role?: string | null
          created_at?: string
          exchange_request_id?: string
          id?: string
          notes?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "exchange_status_history_exchange_request_id_fkey"
            columns: ["exchange_request_id"]
            isOneToOne: false
            referencedRelation: "exchange_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      helper_profiles: {
        Row: {
          branch_name: string
          created_at: string | null
          email: string
          full_name: string
          id: string
          is_active: boolean | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          branch_name: string
          created_at?: string | null
          email: string
          full_name: string
          id?: string
          is_active?: boolean | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          branch_name?: string
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      homepage_sections: {
        Row: {
          content: Json
          id: string
          is_active: boolean | null
          section_key: string
          sort_order: number | null
          title_ar: string
          title_en: string
          updated_at: string | null
        }
        Insert: {
          content: Json
          id?: string
          is_active?: boolean | null
          section_key: string
          sort_order?: number | null
          title_ar: string
          title_en: string
          updated_at?: string | null
        }
        Update: {
          content?: Json
          id?: string
          is_active?: boolean | null
          section_key?: string
          sort_order?: number | null
          title_ar?: string
          title_en?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      loyalty_points_transactions: {
        Row: {
          balance_after: number
          created_at: string | null
          customer_id: string | null
          id: string
          notes: string | null
          points: number
          processed_by_id: string | null
          processed_by_role: Database["public"]["Enums"]["user_role"] | null
          reference_id: string | null
          type: Database["public"]["Enums"]["loyalty_tx_type"]
        }
        Insert: {
          balance_after: number
          created_at?: string | null
          customer_id?: string | null
          id?: string
          notes?: string | null
          points: number
          processed_by_id?: string | null
          processed_by_role?: Database["public"]["Enums"]["user_role"] | null
          reference_id?: string | null
          type: Database["public"]["Enums"]["loyalty_tx_type"]
        }
        Update: {
          balance_after?: number
          created_at?: string | null
          customer_id?: string | null
          id?: string
          notes?: string | null
          points?: number
          processed_by_id?: string | null
          processed_by_role?: Database["public"]["Enums"]["user_role"] | null
          reference_id?: string | null
          type?: Database["public"]["Enums"]["loyalty_tx_type"]
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_points_transactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body_ar: string
          body_en: string
          created_at: string | null
          data: Json | null
          dispatch_attempts: number
          dispatching_at: string | null
          email_required: boolean
          id: string
          is_read: boolean | null
          last_dispatch_error: string | null
          next_dispatch_at: string | null
          push_required: boolean
          recipient_id: string
          recipient_role: Database["public"]["Enums"]["user_role"]
          reference_id: string | null
          reference_type: string | null
          sent_email: boolean
          sent_push: boolean
          title_ar: string
          title_en: string
          type: Database["public"]["Enums"]["notification_type"]
        }
        Insert: {
          body_ar: string
          body_en: string
          created_at?: string | null
          data?: Json | null
          dispatch_attempts?: number
          dispatching_at?: string | null
          email_required?: boolean
          id?: string
          is_read?: boolean | null
          last_dispatch_error?: string | null
          next_dispatch_at?: string | null
          push_required?: boolean
          recipient_id: string
          recipient_role: Database["public"]["Enums"]["user_role"]
          reference_id?: string | null
          reference_type?: string | null
          sent_email?: boolean
          sent_push?: boolean
          title_ar: string
          title_en: string
          type: Database["public"]["Enums"]["notification_type"]
        }
        Update: {
          body_ar?: string
          body_en?: string
          created_at?: string | null
          data?: Json | null
          dispatch_attempts?: number
          dispatching_at?: string | null
          email_required?: boolean
          id?: string
          is_read?: boolean | null
          last_dispatch_error?: string | null
          next_dispatch_at?: string | null
          push_required?: boolean
          recipient_id?: string
          recipient_role?: Database["public"]["Enums"]["user_role"]
          reference_id?: string | null
          reference_type?: string | null
          sent_email?: boolean
          sent_push?: boolean
          title_ar?: string
          title_en?: string
          type?: Database["public"]["Enums"]["notification_type"]
        }
        Relationships: []
      }
      notify_me_subscriptions: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          is_notified: boolean
          product_variant_id: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          is_notified?: boolean
          product_variant_id: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          is_notified?: boolean
          product_variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notify_me_subscriptions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notify_me_subscriptions_product_variant_id_fkey"
            columns: ["product_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      offline_loyalty_operations: {
        Row: {
          balance_after: number
          balance_before: number
          created_at: string
          customer_id: string
          helper_id: string
          id: string
          invoice_amount_syp: number
          operation_type: string
          points: number
          syp_value: number
        }
        Insert: {
          balance_after: number
          balance_before: number
          created_at?: string
          customer_id: string
          helper_id: string
          id: string
          invoice_amount_syp: number
          operation_type: string
          points: number
          syp_value?: number
        }
        Update: {
          balance_after?: number
          balance_before?: number
          created_at?: string
          customer_id?: string
          helper_id?: string
          id?: string
          invoice_amount_syp?: number
          operation_type?: string
          points?: number
          syp_value?: number
        }
        Relationships: [
          {
            foreignKeyName: "offline_loyalty_operations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offline_loyalty_operations_helper_id_fkey"
            columns: ["helper_id"]
            isOneToOne: false
            referencedRelation: "helper_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          bundle_id: string | null
          created_at: string | null
          id: string
          order_id: string | null
          product_snapshot: Json
          quantity: number
          total_price_syp: number
          unit_price_syp: number
          variant_id: string | null
        }
        Insert: {
          bundle_id?: string | null
          created_at?: string | null
          id?: string
          order_id?: string | null
          product_snapshot: Json
          quantity: number
          total_price_syp: number
          unit_price_syp: number
          variant_id?: string | null
        }
        Update: {
          bundle_id?: string | null
          created_at?: string | null
          id?: string
          order_id?: string | null
          product_snapshot?: Json
          quantity?: number
          total_price_syp?: number
          unit_price_syp?: number
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_bundle_id_fkey"
            columns: ["bundle_id"]
            isOneToOne: false
            referencedRelation: "product_bundles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      order_status_history: {
        Row: {
          changed_by_id: string
          changed_by_role: Database["public"]["Enums"]["user_role"]
          created_at: string | null
          from_status: Database["public"]["Enums"]["order_status"] | null
          id: string
          notes: string | null
          order_id: string | null
          to_status: Database["public"]["Enums"]["order_status"]
        }
        Insert: {
          changed_by_id: string
          changed_by_role: Database["public"]["Enums"]["user_role"]
          created_at?: string | null
          from_status?: Database["public"]["Enums"]["order_status"] | null
          id?: string
          notes?: string | null
          order_id?: string | null
          to_status: Database["public"]["Enums"]["order_status"]
        }
        Update: {
          changed_by_id?: string
          changed_by_role?: Database["public"]["Enums"]["user_role"]
          created_at?: string | null
          from_status?: Database["public"]["Enums"]["order_status"] | null
          id?: string
          notes?: string | null
          order_id?: string | null
          to_status?: Database["public"]["Enums"]["order_status"]
        }
        Relationships: [
          {
            foreignKeyName: "order_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          address_snapshot: Json
          cancellation_reason: string | null
          cancelled_by_id: string | null
          cancelled_by_role: Database["public"]["Enums"]["user_role"] | null
          created_at: string | null
          customer_id: string | null
          discount_amount: number | null
          discount_code_id: string | null
          discount_syp: number | null
          id: string
          idempotency_key: string | null
          loyalty_discount_amount: number | null
          loyalty_discount_syp: number | null
          loyalty_points_earned: number | null
          loyalty_points_used: number | null
          notes: string | null
          order_number: string
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          payment_status: Database["public"]["Enums"]["payment_status"] | null
          rejected_reason: string | null
          rejection_reason: string | null
          shipping_cost: number | null
          shipping_syp: number
          status: Database["public"]["Enums"]["order_status"] | null
          subtotal: number | null
          subtotal_syp: number
          total_amount: number | null
          total_syp: number
          updated_at: string | null
        }
        Insert: {
          address_snapshot: Json
          cancellation_reason?: string | null
          cancelled_by_id?: string | null
          cancelled_by_role?: Database["public"]["Enums"]["user_role"] | null
          created_at?: string | null
          customer_id?: string | null
          discount_amount?: number | null
          discount_code_id?: string | null
          discount_syp?: number | null
          id?: string
          idempotency_key?: string | null
          loyalty_discount_amount?: number | null
          loyalty_discount_syp?: number | null
          loyalty_points_earned?: number | null
          loyalty_points_used?: number | null
          notes?: string | null
          order_number: string
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          rejected_reason?: string | null
          rejection_reason?: string | null
          shipping_cost?: number | null
          shipping_syp: number
          status?: Database["public"]["Enums"]["order_status"] | null
          subtotal?: number | null
          subtotal_syp: number
          total_amount?: number | null
          total_syp: number
          updated_at?: string | null
        }
        Update: {
          address_snapshot?: Json
          cancellation_reason?: string | null
          cancelled_by_id?: string | null
          cancelled_by_role?: Database["public"]["Enums"]["user_role"] | null
          created_at?: string | null
          customer_id?: string | null
          discount_amount?: number | null
          discount_code_id?: string | null
          discount_syp?: number | null
          id?: string
          idempotency_key?: string | null
          loyalty_discount_amount?: number | null
          loyalty_discount_syp?: number | null
          loyalty_points_earned?: number | null
          loyalty_points_used?: number | null
          notes?: string | null
          order_number?: string
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          rejected_reason?: string | null
          rejection_reason?: string | null
          shipping_cost?: number | null
          shipping_syp?: number
          status?: Database["public"]["Enums"]["order_status"] | null
          subtotal?: number | null
          subtotal_syp?: number
          total_amount?: number | null
          total_syp?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_discount_code_id_fkey"
            columns: ["discount_code_id"]
            isOneToOne: false
            referencedRelation: "discount_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_profiles: {
        Row: {
          address: string
          address_ar: string
          address_en: string
          business_name: string
          contact_name: string
          created_at: string | null
          created_by: string
          email: string
          full_name: string
          geographic_area: string
          governorate: string
          id: string
          is_active: boolean | null
          phone: string
          updated_at: string
        }
        Insert: {
          address: string
          address_ar: string
          address_en: string
          business_name: string
          contact_name: string
          created_at?: string | null
          created_by: string
          email: string
          full_name: string
          geographic_area: string
          governorate: string
          id: string
          is_active?: boolean | null
          phone: string
          updated_at?: string
        }
        Update: {
          address?: string
          address_ar?: string
          address_en?: string
          business_name?: string
          contact_name?: string
          created_at?: string | null
          created_by?: string
          email?: string
          full_name?: string
          geographic_area?: string
          governorate?: string
          id?: string
          is_active?: boolean | null
          phone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_profiles_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_transactions: {
        Row: {
          amount: number
          created_at: string
          error_message: string | null
          gateway: string
          id: string
          order_id: string
          status: string
          transaction_ref: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          error_message?: string | null
          gateway?: string
          id?: string
          order_id: string
          status?: string
          transaction_ref?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          error_message?: string | null
          gateway?: string
          id?: string
          order_id?: string
          status?: string
          transaction_ref?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      product_bundles: {
        Row: {
          bundle_price: number
          created_at: string
          description_ar: string | null
          description_en: string | null
          id: string
          name_ar: string
          name_en: string
          search_vector: unknown
          slug: string
          status: string
          updated_at: string
        }
        Insert: {
          bundle_price: number
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          id?: string
          name_ar: string
          name_en: string
          search_vector?: unknown
          slug: string
          status?: string
          updated_at?: string
        }
        Update: {
          bundle_price?: number
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          id?: string
          name_ar?: string
          name_en?: string
          search_vector?: unknown
          slug?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      product_helper_requests: {
        Row: {
          admin_notes: string | null
          created_at: string
          description: string | null
          helper_id: string
          id: string
          image_urls: string[] | null
          product_name_ar: string
          product_name_en: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          suggested_category_id: string | null
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          description?: string | null
          helper_id: string
          id?: string
          image_urls?: string[] | null
          product_name_ar: string
          product_name_en?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          suggested_category_id?: string | null
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          description?: string | null
          helper_id?: string
          id?: string
          image_urls?: string[] | null
          product_name_ar?: string
          product_name_en?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          suggested_category_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_helper_requests_helper_id_fkey"
            columns: ["helper_id"]
            isOneToOne: false
            referencedRelation: "helper_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_helper_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "admin_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_helper_requests_suggested_category_id_fkey"
            columns: ["suggested_category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          alt_ar: string | null
          alt_en: string | null
          alt_text_ar: string | null
          alt_text_en: string | null
          created_at: string | null
          id: string
          is_primary: boolean | null
          product_id: string | null
          sort_order: number | null
          source: string
          url: string
          variant_id: string | null
        }
        Insert: {
          alt_ar?: string | null
          alt_en?: string | null
          alt_text_ar?: string | null
          alt_text_en?: string | null
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          product_id?: string | null
          sort_order?: number | null
          source?: string
          url: string
          variant_id?: string | null
        }
        Update: {
          alt_ar?: string | null
          alt_en?: string | null
          alt_text_ar?: string | null
          alt_text_en?: string | null
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          product_id?: string | null
          sort_order?: number | null
          source?: string
          url?: string
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_images_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      product_reviews: {
        Row: {
          comment: string | null
          created_at: string
          customer_id: string
          id: string
          moderated_at: string | null
          moderated_by: string | null
          order_id: string
          product_id: string
          rating: number
          status: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          customer_id: string
          id?: string
          moderated_at?: string | null
          moderated_by?: string | null
          order_id: string
          product_id: string
          rating: number
          status?: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          customer_id?: string
          id?: string
          moderated_at?: string | null
          moderated_by?: string | null
          order_id?: string
          product_id?: string
          rating?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_reviews_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_reviews_moderated_by_fkey"
            columns: ["moderated_by"]
            isOneToOne: false
            referencedRelation: "admin_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          compare_price_syp: number | null
          created_at: string | null
          id: string
          is_active: boolean | null
          low_stock_threshold: number | null
          price_override: number | null
          price_syp: number
          product_id: string | null
          sku: string
          stock_quantity: number | null
          updated_at: string
          weight_grams: number | null
        }
        Insert: {
          compare_price_syp?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          low_stock_threshold?: number | null
          price_override?: number | null
          price_syp: number
          product_id?: string | null
          sku: string
          stock_quantity?: number | null
          updated_at?: string
          weight_grams?: number | null
        }
        Update: {
          compare_price_syp?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          low_stock_threshold?: number | null
          price_override?: number | null
          price_syp?: number
          product_id?: string | null
          sku?: string
          stock_quantity?: number | null
          updated_at?: string
          weight_grams?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_videos: {
        Row: {
          created_at: string | null
          id: string
          product_id: string | null
          sort_order: number
          thumbnail_url: string
          url: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          product_id?: string | null
          sort_order?: number
          thumbnail_url: string
          url: string
        }
        Update: {
          created_at?: string | null
          id?: string
          product_id?: string | null
          sort_order?: number
          thumbnail_url?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_videos_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          base_price: number
          brand_id: string | null
          category_id: string | null
          created_at: string | null
          created_by: string | null
          description_ar: string
          description_en: string
          discount_end_at: string | null
          discount_percentage: number | null
          discount_start_at: string | null
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          name_ar: string
          name_en: string
          search_vector: unknown
          size_guide_id: string | null
          slug: string
          status: string
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          base_price?: number
          brand_id?: string | null
          category_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description_ar: string
          description_en: string
          discount_end_at?: string | null
          discount_percentage?: number | null
          discount_start_at?: string | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          name_ar: string
          name_en: string
          search_vector?: unknown
          size_guide_id?: string | null
          slug: string
          status?: string
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          base_price?: number
          brand_id?: string | null
          category_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description_ar?: string
          description_en?: string
          discount_end_at?: string | null
          discount_percentage?: number | null
          discount_start_at?: string | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          name_ar?: string
          name_en?: string
          search_vector?: unknown
          size_guide_id?: string | null
          slug?: string
          status?: string
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_size_guide_id_fkey"
            columns: ["size_guide_id"]
            isOneToOne: false
            referencedRelation: "size_guides"
            referencedColumns: ["id"]
          },
        ]
      }
      push_notification_tokens: {
        Row: {
          created_at: string
          customer_id: string | null
          id: string
          platform: string
          token: string
          user_id: string
          user_role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          id?: string
          platform: string
          token: string
          user_id: string
          user_role: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          id?: string
          platform?: string
          token?: string
          user_id?: string
          user_role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: [
          {
            foreignKeyName: "push_notification_tokens_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_tracking: {
        Row: {
          bonus_awarded: boolean | null
          created_at: string | null
          id: string
          referral_code: string
          referred_id: string | null
          referrer_id: string | null
        }
        Insert: {
          bonus_awarded?: boolean | null
          created_at?: string | null
          id?: string
          referral_code: string
          referred_id?: string | null
          referrer_id?: string | null
        }
        Update: {
          bonus_awarded?: boolean | null
          created_at?: string | null
          id?: string
          referral_code?: string
          referred_id?: string | null
          referrer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referral_tracking_referred_id_fkey"
            columns: ["referred_id"]
            isOneToOne: false
            referencedRelation: "customer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_tracking_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "customer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          points_awarded: number | null
          referral_code: string
          referred_id: string
          referrer_id: string
          status: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          points_awarded?: number | null
          referral_code: string
          referred_id: string
          referrer_id: string
          status?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          points_awarded?: number | null
          referral_code?: string
          referred_id?: string
          referrer_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referred_id_fkey"
            columns: ["referred_id"]
            isOneToOne: true
            referencedRelation: "customer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "customer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      search_analytics: {
        Row: {
          created_at: string
          customer_id: string | null
          id: string
          query: string
          result_count: number
          session_id: string | null
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          id?: string
          query: string
          result_count?: number
          session_id?: string | null
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          id?: string
          query?: string
          result_count?: number
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "search_analytics_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      shipping_rates: {
        Row: {
          base_rate_syp: number
          free_shipping_threshold_syp: number | null
          governorate: string
          id: string
          is_active: boolean | null
        }
        Insert: {
          base_rate_syp: number
          free_shipping_threshold_syp?: number | null
          governorate: string
          id?: string
          is_active?: boolean | null
        }
        Update: {
          base_rate_syp?: number
          free_shipping_threshold_syp?: number | null
          governorate?: string
          id?: string
          is_active?: boolean | null
        }
        Relationships: []
      }
      size_guides: {
        Row: {
          content: Json
          created_at: string
          id: string
          name: string
        }
        Insert: {
          content: Json
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          content?: Json
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      sub_admin_permissions: {
        Row: {
          created_at: string | null
          granted_by: string | null
          id: string
          module: string
          permission_level: Database["public"]["Enums"]["permission_level"]
          sub_admin_id: string | null
        }
        Insert: {
          created_at?: string | null
          granted_by?: string | null
          id?: string
          module: string
          permission_level: Database["public"]["Enums"]["permission_level"]
          sub_admin_id?: string | null
        }
        Update: {
          created_at?: string | null
          granted_by?: string | null
          id?: string
          module?: string
          permission_level?: Database["public"]["Enums"]["permission_level"]
          sub_admin_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sub_admin_permissions_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "admin_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sub_admin_permissions_sub_admin_id_fkey"
            columns: ["sub_admin_id"]
            isOneToOne: false
            referencedRelation: "sub_admin_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sub_admin_profiles: {
        Row: {
          created_at: string | null
          created_by: string | null
          email: string
          full_name: string
          id: string
          is_active: boolean | null
          totp_enabled: boolean | null
          totp_failed_attempts: number
          totp_locked_until: string | null
          totp_secret: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          email: string
          full_name: string
          id?: string
          is_active?: boolean | null
          totp_enabled?: boolean | null
          totp_failed_attempts?: number
          totp_locked_until?: string | null
          totp_secret?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean | null
          totp_enabled?: boolean | null
          totp_failed_attempts?: number
          totp_locked_until?: string | null
          totp_secret?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sub_admin_profiles_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          description: string | null
          key: string
          updated_at: string | null
          updated_by: string | null
          value: string | null
        }
        Insert: {
          description?: string | null
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value?: string | null
        }
        Update: {
          description?: string | null
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "system_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "admin_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      variant_attributes: {
        Row: {
          attribute_value_id: string
          variant_id: string
        }
        Insert: {
          attribute_value_id: string
          variant_id: string
        }
        Update: {
          attribute_value_id?: string
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "variant_attributes_attribute_value_id_fkey"
            columns: ["attribute_value_id"]
            isOneToOne: false
            referencedRelation: "attribute_values"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "variant_attributes_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      wishlist_items: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          product_id: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          product_id: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_items_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishlist_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_customer_cart_item: {
        Args: {
          p_customer_id: string
          p_item_type: string
          p_item_id: string
          p_quantity: number
        }
        Returns: Json
      }
      remove_customer_cart_item: {
        Args: {
          p_customer_id: string
          p_cart_item_id: string
        }
        Returns: boolean
      }
      set_customer_cart_item_quantity: {
        Args: {
          p_customer_id: string
          p_cart_item_id: string
          p_quantity: number
        }
        Returns: Json
      }
      admin_list_orders: {
        Args: {
          p_limit?: number
          p_page?: number
          p_search?: string
          p_status?: string
        }
        Returns: Json
      }
      admin_report_data: {
        Args: { p_from: string; p_to: string; p_type: string }
        Returns: Json
      }
      admin_save_collection: {
        Args: {
          p_collection_id: string
          p_description_ar: string
          p_description_en: string
          p_has_standalone_page: boolean
          p_is_active: boolean
          p_is_featured_on_homepage: boolean
          p_name_ar: string
          p_name_en: string
          p_product_ids: string[]
          p_slug: string
          p_sort_order: number
        }
        Returns: string
      }
      admin_save_product_bundle: {
        Args: {
          p_bundle_id: string
          p_bundle_price: number
          p_description_ar: string
          p_description_en: string
          p_items: Json
          p_name_ar: string
          p_name_en: string
          p_slug: string
          p_status: string
        }
        Returns: string
      }
      admin_search_customers: {
        Args: { p_limit?: number; p_search?: string }
        Returns: Json
      }
      approve_exchange_request_atomic: {
        Args: {
          p_actor_id: string
          p_actor_role: string
          p_exchange_request_id: string
          p_partner_id: string
          p_qr_code_url: string
          p_qr_expires_at: string
          p_qr_token: string
          p_qr_token_hash: string
          p_resolution_path: string
        }
        Returns: {
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          customer_id: string
          customer_images: string[] | null
          customer_whatsapp: string
          exchange_type: string | null
          id: string
          new_variant_id: string | null
          notes: string | null
          order_id: string
          order_item_id: string
          partner_id: string | null
          partner_stage: string | null
          processed_by_id: string | null
          processed_by_role: Database["public"]["Enums"]["user_role"] | null
          qr_code_expires_at: string | null
          qr_code_generated_at: string | null
          qr_code_token: string | null
          qr_code_url: string | null
          qr_code_used_at: string | null
          reason: string
          reason_ar: string
          reason_en: string
          rejection_reason: string | null
          replacement_order_id: string | null
          replacement_variant_id: string | null
          resolution_path: string | null
          return_method: string | null
          status: Database["public"]["Enums"]["exchange_status"] | null
          updated_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "exchange_requests"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      award_loyalty_points: {
        Args: {
          p_customer_id: string
          p_description?: string
          p_notes?: string
          p_points: number
          p_processed_by_id?: string
          p_processed_by_role?: Database["public"]["Enums"]["user_role"]
          p_reference_id?: string
          p_type: Database["public"]["Enums"]["loyalty_tx_type"]
        }
        Returns: undefined
      }
      cart_bundle_available_quantity: {
        Args: { p_bundle_id: string }
        Returns: number
      }
      catalog_search_with_facets: {
        Args: {
          p_attributes?: Json
          p_brand_ids?: string[]
          p_category_ids?: string[]
          p_discount_min?: number
          p_featured_only?: boolean
          p_max_price?: number
          p_min_price?: number
          p_page?: number
          p_per_page?: number
          p_search?: string
          p_sort?: string
        }
        Returns: Json
      }
      claim_pending_notifications: {
        Args: { p_limit?: number }
        Returns: {
          body_ar: string
          body_en: string
          created_at: string | null
          data: Json | null
          dispatch_attempts: number
          dispatching_at: string | null
          email_required: boolean
          id: string
          is_read: boolean | null
          last_dispatch_error: string | null
          next_dispatch_at: string | null
          push_required: boolean
          recipient_id: string
          recipient_role: Database["public"]["Enums"]["user_role"]
          reference_id: string | null
          reference_type: string | null
          sent_email: boolean
          sent_push: boolean
          title_ar: string
          title_en: string
          type: Database["public"]["Enums"]["notification_type"]
        }[]
        SetofOptions: {
          from: "*"
          to: "notifications"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      complete_helper_exchange: {
        Args: {
          p_exchange_request_id: string
          p_helper_id: string
          p_replacement_variant_id: string
        }
        Returns: {
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          customer_id: string
          customer_images: string[] | null
          customer_whatsapp: string
          exchange_type: string | null
          id: string
          new_variant_id: string | null
          notes: string | null
          order_id: string
          order_item_id: string
          partner_id: string | null
          partner_stage: string | null
          processed_by_id: string | null
          processed_by_role: Database["public"]["Enums"]["user_role"] | null
          qr_code_expires_at: string | null
          qr_code_generated_at: string | null
          qr_code_token: string | null
          qr_code_url: string | null
          qr_code_used_at: string | null
          reason: string
          reason_ar: string
          reason_en: string
          rejection_reason: string | null
          replacement_order_id: string | null
          replacement_variant_id: string | null
          resolution_path: string | null
          return_method: string | null
          status: Database["public"]["Enums"]["exchange_status"] | null
          updated_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "exchange_requests"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      complete_helper_exchange_secure: {
        Args: {
          p_exchange_request_id: string
          p_helper_id: string
          p_replacement_variant_id: string
        }
        Returns: {
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          customer_id: string
          customer_images: string[] | null
          customer_whatsapp: string
          exchange_type: string | null
          id: string
          new_variant_id: string | null
          notes: string | null
          order_id: string
          order_item_id: string
          partner_id: string | null
          partner_stage: string | null
          processed_by_id: string | null
          processed_by_role: Database["public"]["Enums"]["user_role"] | null
          qr_code_expires_at: string | null
          qr_code_generated_at: string | null
          qr_code_token: string | null
          qr_code_url: string | null
          qr_code_used_at: string | null
          reason: string
          reason_ar: string
          reason_en: string
          rejection_reason: string | null
          replacement_order_id: string | null
          replacement_variant_id: string | null
          resolution_path: string | null
          return_method: string | null
          status: Database["public"]["Enums"]["exchange_status"] | null
          updated_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "exchange_requests"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      ensure_wishlist_share_token: {
        Args: { p_customer_id: string }
        Returns: string
      }
      generate_order_number: { Args: never; Returns: string }
      generate_referral_code: { Args: never; Returns: string }
      helper_scan_exchange_atomic: {
        Args: {
          p_exchange_request_id: string
          p_helper_id: string
          p_token_hash: string
        }
        Returns: {
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          customer_id: string
          customer_images: string[] | null
          customer_whatsapp: string
          exchange_type: string | null
          id: string
          new_variant_id: string | null
          notes: string | null
          order_id: string
          order_item_id: string
          partner_id: string | null
          partner_stage: string | null
          processed_by_id: string | null
          processed_by_role: Database["public"]["Enums"]["user_role"] | null
          qr_code_expires_at: string | null
          qr_code_generated_at: string | null
          qr_code_token: string | null
          qr_code_url: string | null
          qr_code_used_at: string | null
          reason: string
          reason_ar: string
          reason_en: string
          rejection_reason: string | null
          replacement_order_id: string | null
          replacement_variant_id: string | null
          resolution_path: string | null
          return_method: string | null
          status: Database["public"]["Enums"]["exchange_status"] | null
          updated_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "exchange_requests"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      merge_customer_cart: {
        Args: { p_customer_id: string; p_items: Json }
        Returns: Json
      }
      merge_customer_cart_v2: {
        Args: { p_customer_id: string; p_items: Json }
        Returns: Json
      }
      partner_receive_exchange_atomic: {
        Args: {
          p_exchange_id: string
          p_partner_id: string
          p_token_hash: string
        }
        Returns: {
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          customer_id: string
          customer_images: string[] | null
          customer_whatsapp: string
          exchange_type: string | null
          id: string
          new_variant_id: string | null
          notes: string | null
          order_id: string
          order_item_id: string
          partner_id: string | null
          partner_stage: string | null
          processed_by_id: string | null
          processed_by_role: Database["public"]["Enums"]["user_role"] | null
          qr_code_expires_at: string | null
          qr_code_generated_at: string | null
          qr_code_token: string | null
          qr_code_url: string | null
          qr_code_used_at: string | null
          reason: string
          reason_ar: string
          reason_en: string
          rejection_reason: string | null
          replacement_order_id: string | null
          replacement_variant_id: string | null
          resolution_path: string | null
          return_method: string | null
          status: Database["public"]["Enums"]["exchange_status"] | null
          updated_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "exchange_requests"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      place_order_atomic: {
        Args: {
          p_address_snapshot: Json
          p_customer_id: string
          p_discount_code_id: string
          p_discount_syp: number
          p_idempotency_key?: string
          p_items: Json
          p_loyalty_discount_syp: number
          p_loyalty_points_used: number
          p_notes: string
          p_order_number: string
          p_points_earned: number
          p_shipping_syp: number
          p_subtotal_syp: number
          p_total_syp: number
        }
        Returns: string
      }
      place_order_secure_atomic: {
        Args: {
          p_address_snapshot: Json
          p_customer_id: string
          p_discount_code_id: string
          p_discount_syp: number
          p_idempotency_key: string
          p_items: Json
          p_loyalty_discount_syp: number
          p_loyalty_points_used: number
          p_notes: string
          p_order_number: string
          p_payment_method: string
          p_points_earned: number
          p_shipping_syp: number
          p_subtotal_syp: number
          p_total_syp: number
        }
        Returns: string
      }
      process_offline_loyalty_atomic: {
        Args: {
          p_customer_id: string
          p_helper_id: string
          p_invoice_amount_syp: number
          p_operation_id: string
          p_operation_type: string
          p_requested_points?: number
        }
        Returns: Json
      }
      register_customer_profile: {
        Args: {
          p_customer_id: string
          p_email: string
          p_full_name: string
          p_phone?: string
          p_preferred_language?: string
          p_qr_code_url?: string
          p_referral_code?: string
        }
        Returns: {
          avatar_url: string | null
          cart_data: Json | null
          created_at: string | null
          email: string
          full_name: string
          gender: string | null
          id: string
          is_blocked: boolean
          loyalty_points: number | null
          loyalty_qr_version: number
          phone: string | null
          preferred_language: string | null
          qr_code_url: string | null
          referral_code: string
          referred_by: string | null
          updated_at: string | null
          wishlist_share_token: string | null
        }
        SetofOptions: {
          from: "*"
          to: "customer_profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      reject_exchange_request_atomic: {
        Args: {
          p_actor_id: string
          p_actor_role: string
          p_exchange_request_id: string
          p_rejection_reason: string
        }
        Returns: {
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          customer_id: string
          customer_images: string[] | null
          customer_whatsapp: string
          exchange_type: string | null
          id: string
          new_variant_id: string | null
          notes: string | null
          order_id: string
          order_item_id: string
          partner_id: string | null
          partner_stage: string | null
          processed_by_id: string | null
          processed_by_role: Database["public"]["Enums"]["user_role"] | null
          qr_code_expires_at: string | null
          qr_code_generated_at: string | null
          qr_code_token: string | null
          qr_code_url: string | null
          qr_code_used_at: string | null
          reason: string
          reason_ar: string
          reason_en: string
          rejection_reason: string | null
          replacement_order_id: string | null
          replacement_variant_id: string | null
          resolution_path: string | null
          return_method: string | null
          status: Database["public"]["Enums"]["exchange_status"] | null
          updated_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "exchange_requests"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      replace_customer_cart: {
        Args: { p_customer_id: string; p_items: Json }
        Returns: Json
      }
      replace_customer_cart_v2: {
        Args: { p_customer_id: string; p_items: Json }
        Returns: Json
      }
      replace_sub_admin_permissions: {
        Args: {
          p_granted_by: string
          p_permissions: Json
          p_sub_admin_id: string
        }
        Returns: Json
      }
      resolve_audit_actor_role: {
        Args: { p_actor_id: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      terminate_order_atomic: {
        Args: {
          p_actor_id: string
          p_actor_role: string
          p_order_id: string
          p_reason?: string
          p_target_status: string
        }
        Returns: {
          address_snapshot: Json
          cancellation_reason: string | null
          cancelled_by_id: string | null
          cancelled_by_role: Database["public"]["Enums"]["user_role"] | null
          created_at: string | null
          customer_id: string | null
          discount_amount: number | null
          discount_code_id: string | null
          discount_syp: number | null
          id: string
          idempotency_key: string | null
          loyalty_discount_amount: number | null
          loyalty_discount_syp: number | null
          loyalty_points_earned: number | null
          loyalty_points_used: number | null
          notes: string | null
          order_number: string
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          payment_status: Database["public"]["Enums"]["payment_status"] | null
          rejected_reason: string | null
          rejection_reason: string | null
          shipping_cost: number | null
          shipping_syp: number
          status: Database["public"]["Enums"]["order_status"] | null
          subtotal: number | null
          subtotal_syp: number
          total_amount: number | null
          total_syp: number
          updated_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "orders"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      transition_order_atomic: {
        Args: {
          p_actor_id: string
          p_actor_role: string
          p_notes?: string
          p_order_id: string
          p_target_status: string
        }
        Returns: {
          address_snapshot: Json
          cancellation_reason: string | null
          cancelled_by_id: string | null
          cancelled_by_role: Database["public"]["Enums"]["user_role"] | null
          created_at: string | null
          customer_id: string | null
          discount_amount: number | null
          discount_code_id: string | null
          discount_syp: number | null
          id: string
          idempotency_key: string | null
          loyalty_discount_amount: number | null
          loyalty_discount_syp: number | null
          loyalty_points_earned: number | null
          loyalty_points_used: number | null
          notes: string | null
          order_number: string
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          payment_status: Database["public"]["Enums"]["payment_status"] | null
          rejected_reason: string | null
          rejection_reason: string | null
          shipping_cost: number | null
          shipping_syp: number
          status: Database["public"]["Enums"]["order_status"] | null
          subtotal: number | null
          subtotal_syp: number
          total_amount: number | null
          total_syp: number
          updated_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "orders"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      unaccent: { Args: { "": string }; Returns: string }
    }
    Enums: {
      exchange_status:
        | "pending"
        | "approved"
        | "rejected"
        | "item_received_by_shipping"
        | "completed"
      loyalty_tx_type:
        | "earned_purchase"
        | "earned_referral"
        | "earned_offline"
        | "redeemed"
        | "adjusted_admin"
        | "expired"
        | "redeemed_offline"
      notification_type:
        | "order_update"
        | "exchange_update"
        | "loyalty_update"
        | "promotional"
        | "system"
      order_status:
        | "pending"
        | "confirmed"
        | "processing"
        | "picked_up"
        | "shipped"
        | "delivered"
        | "completed"
        | "cancelled"
        | "rejected"
      payment_method: "sham_cash" | "cash_on_delivery"
      payment_status: "pending" | "paid" | "failed" | "refunded"
      permission_level: "view_only" | "edit" | "full_access"
      user_role:
        | "customer"
        | "admin"
        | "sub_admin"
        | "helper"
        | "partner"
        | "system"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      exchange_status: [
        "pending",
        "approved",
        "rejected",
        "item_received_by_shipping",
        "completed",
      ],
      loyalty_tx_type: [
        "earned_purchase",
        "earned_referral",
        "earned_offline",
        "redeemed",
        "adjusted_admin",
        "expired",
        "redeemed_offline",
      ],
      notification_type: [
        "order_update",
        "exchange_update",
        "loyalty_update",
        "promotional",
        "system",
      ],
      order_status: [
        "pending",
        "confirmed",
        "processing",
        "picked_up",
        "shipped",
        "delivered",
        "completed",
        "cancelled",
        "rejected",
      ],
      payment_method: ["sham_cash", "cash_on_delivery"],
      payment_status: ["pending", "paid", "failed", "refunded"],
      permission_level: ["view_only", "edit", "full_access"],
      user_role: [
        "customer",
        "admin",
        "sub_admin",
        "helper",
        "partner",
        "system",
      ],
    },
  },
} as const
