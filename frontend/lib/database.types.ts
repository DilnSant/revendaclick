export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      _prisma_migrations: {
        Row: {
          applied_steps_count: number
          checksum: string
          finished_at: string | null
          id: string
          logs: string | null
          migration_name: string
          rolled_back_at: string | null
          started_at: string
        }
        Insert: {
          applied_steps_count?: number
          checksum: string
          finished_at?: string | null
          id: string
          logs?: string | null
          migration_name: string
          rolled_back_at?: string | null
          started_at?: string
        }
        Update: {
          applied_steps_count?: number
          checksum?: string
          finished_at?: string | null
          id?: string
          logs?: string | null
          migration_name?: string
          rolled_back_at?: string | null
          started_at?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: unknown
          new_data: Json | null
          old_data: Json | null
          tenant_id: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: unknown
          new_data?: Json | null
          old_data?: Json | null
          tenant_id?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: unknown
          new_data?: Json | null
          old_data?: Json | null
          tenant_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "plan_usage"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "audit_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_customers: {
        Row: {
          asaas_id: string
          cpf_cnpj: string | null
          created_at: string
          email: string
          id: string
          name: string
          phone: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          asaas_id: string
          cpf_cnpj?: string | null
          created_at?: string
          email: string
          id?: string
          name: string
          phone?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          asaas_id?: string
          cpf_cnpj?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          phone?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_customers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "plan_usage"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "billing_customers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_events: {
        Row: {
          asaas_id: string | null
          event_key: string
          event_type: string
          id: string
          payload: Json
          processed_at: string
          tenant_id: string | null
        }
        Insert: {
          asaas_id?: string | null
          event_key: string
          event_type: string
          id?: string
          payload?: Json
          processed_at?: string
          tenant_id?: string | null
        }
        Update: {
          asaas_id?: string | null
          event_key?: string
          event_type?: string
          id?: string
          payload?: Json
          processed_at?: string
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "billing_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "plan_usage"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "billing_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_invoices: {
        Row: {
          asaas_payment_id: string
          asaas_subscription: string | null
          bank_slip_url: string | null
          billing_type: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          invoice_url: string | null
          paid_at: string | null
          pix_copy_paste: string | null
          pix_qr_code: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          tenant_id: string
          updated_at: string
          value: number
        }
        Insert: {
          asaas_payment_id: string
          asaas_subscription?: string | null
          bank_slip_url?: string | null
          billing_type?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          invoice_url?: string | null
          paid_at?: string | null
          pix_copy_paste?: string | null
          pix_qr_code?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          tenant_id: string
          updated_at?: string
          value: number
        }
        Update: {
          asaas_payment_id?: string
          asaas_subscription?: string | null
          bank_slip_url?: string | null
          billing_type?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          invoice_url?: string | null
          paid_at?: string | null
          pix_copy_paste?: string | null
          pix_qr_code?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          tenant_id?: string
          updated_at?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "billing_invoices_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "plan_usage"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "billing_invoices_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      Chat: {
        Row: {
          createdAt: string | null
          id: string
          instanceId: string
          labels: Json | null
          name: string | null
          remoteJid: string
          unreadMessages: number
          updatedAt: string | null
        }
        Insert: {
          createdAt?: string | null
          id: string
          instanceId: string
          labels?: Json | null
          name?: string | null
          remoteJid: string
          unreadMessages?: number
          updatedAt?: string | null
        }
        Update: {
          createdAt?: string | null
          id?: string
          instanceId?: string
          labels?: Json | null
          name?: string | null
          remoteJid?: string
          unreadMessages?: number
          updatedAt?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "Chat_instanceId_fkey"
            columns: ["instanceId"]
            isOneToOne: false
            referencedRelation: "Instance"
            referencedColumns: ["id"]
          },
        ]
      }
      Chatwoot: {
        Row: {
          accountId: string | null
          conversationPending: boolean | null
          createdAt: string | null
          daysLimitImportMessages: number | null
          enabled: boolean | null
          id: string
          ignoreJids: Json | null
          importContacts: boolean | null
          importMessages: boolean | null
          instanceId: string
          logo: string | null
          mergeBrazilContacts: boolean | null
          nameInbox: string | null
          number: string | null
          organization: string | null
          reopenConversation: boolean | null
          signDelimiter: string | null
          signMsg: boolean | null
          token: string | null
          updatedAt: string
          url: string | null
        }
        Insert: {
          accountId?: string | null
          conversationPending?: boolean | null
          createdAt?: string | null
          daysLimitImportMessages?: number | null
          enabled?: boolean | null
          id: string
          ignoreJids?: Json | null
          importContacts?: boolean | null
          importMessages?: boolean | null
          instanceId: string
          logo?: string | null
          mergeBrazilContacts?: boolean | null
          nameInbox?: string | null
          number?: string | null
          organization?: string | null
          reopenConversation?: boolean | null
          signDelimiter?: string | null
          signMsg?: boolean | null
          token?: string | null
          updatedAt: string
          url?: string | null
        }
        Update: {
          accountId?: string | null
          conversationPending?: boolean | null
          createdAt?: string | null
          daysLimitImportMessages?: number | null
          enabled?: boolean | null
          id?: string
          ignoreJids?: Json | null
          importContacts?: boolean | null
          importMessages?: boolean | null
          instanceId?: string
          logo?: string | null
          mergeBrazilContacts?: boolean | null
          nameInbox?: string | null
          number?: string | null
          organization?: string | null
          reopenConversation?: boolean | null
          signDelimiter?: string | null
          signMsg?: boolean | null
          token?: string | null
          updatedAt?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "Chatwoot_instanceId_fkey"
            columns: ["instanceId"]
            isOneToOne: false
            referencedRelation: "Instance"
            referencedColumns: ["id"]
          },
        ]
      }
      commissions: {
        Row: {
          amount: number
          created_at: string
          id: string
          notes: string | null
          paid_at: string | null
          rate: number | null
          sale_id: string
          seller_id: string
          status: Database["public"]["Enums"]["commission_status"]
          tenant_id: string
          type: Database["public"]["Enums"]["commission_type"]
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          rate?: number | null
          sale_id: string
          seller_id: string
          status?: Database["public"]["Enums"]["commission_status"]
          tenant_id: string
          type?: Database["public"]["Enums"]["commission_type"]
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          rate?: number | null
          sale_id?: string
          seller_id?: string
          status?: Database["public"]["Enums"]["commission_status"]
          tenant_id?: string
          type?: Database["public"]["Enums"]["commission_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "commissions_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "plan_usage"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "commissions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      Contact: {
        Row: {
          createdAt: string | null
          id: string
          instanceId: string
          profilePicUrl: string | null
          pushName: string | null
          remoteJid: string
          updatedAt: string | null
        }
        Insert: {
          createdAt?: string | null
          id: string
          instanceId: string
          profilePicUrl?: string | null
          pushName?: string | null
          remoteJid: string
          updatedAt?: string | null
        }
        Update: {
          createdAt?: string | null
          id?: string
          instanceId?: string
          profilePicUrl?: string | null
          pushName?: string | null
          remoteJid?: string
          updatedAt?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "Contact_instanceId_fkey"
            columns: ["instanceId"]
            isOneToOne: false
            referencedRelation: "Instance"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address_city: string | null
          address_state: string | null
          cpf_cnpj: string | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          name: string
          notes: string | null
          phone: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          address_city?: string | null
          address_state?: string | null
          cpf_cnpj?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          phone?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          address_city?: string | null
          address_state?: string | null
          cpf_cnpj?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          phone?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "plan_usage"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "customers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      Dify: {
        Row: {
          apiKey: string | null
          apiUrl: string | null
          botType: Database["public"]["Enums"]["DifyBotType"]
          createdAt: string | null
          debounceTime: number | null
          delayMessage: number | null
          description: string | null
          enabled: boolean
          expire: number | null
          id: string
          ignoreJids: Json | null
          instanceId: string
          keepOpen: boolean | null
          keywordFinish: string | null
          listeningFromMe: boolean | null
          splitMessages: boolean | null
          stopBotFromMe: boolean | null
          timePerChar: number | null
          triggerOperator: Database["public"]["Enums"]["TriggerOperator"] | null
          triggerType: Database["public"]["Enums"]["TriggerType"] | null
          triggerValue: string | null
          unknownMessage: string | null
          updatedAt: string
        }
        Insert: {
          apiKey?: string | null
          apiUrl?: string | null
          botType: Database["public"]["Enums"]["DifyBotType"]
          createdAt?: string | null
          debounceTime?: number | null
          delayMessage?: number | null
          description?: string | null
          enabled?: boolean
          expire?: number | null
          id: string
          ignoreJids?: Json | null
          instanceId: string
          keepOpen?: boolean | null
          keywordFinish?: string | null
          listeningFromMe?: boolean | null
          splitMessages?: boolean | null
          stopBotFromMe?: boolean | null
          timePerChar?: number | null
          triggerOperator?:
            | Database["public"]["Enums"]["TriggerOperator"]
            | null
          triggerType?: Database["public"]["Enums"]["TriggerType"] | null
          triggerValue?: string | null
          unknownMessage?: string | null
          updatedAt: string
        }
        Update: {
          apiKey?: string | null
          apiUrl?: string | null
          botType?: Database["public"]["Enums"]["DifyBotType"]
          createdAt?: string | null
          debounceTime?: number | null
          delayMessage?: number | null
          description?: string | null
          enabled?: boolean
          expire?: number | null
          id?: string
          ignoreJids?: Json | null
          instanceId?: string
          keepOpen?: boolean | null
          keywordFinish?: string | null
          listeningFromMe?: boolean | null
          splitMessages?: boolean | null
          stopBotFromMe?: boolean | null
          timePerChar?: number | null
          triggerOperator?:
            | Database["public"]["Enums"]["TriggerOperator"]
            | null
          triggerType?: Database["public"]["Enums"]["TriggerType"] | null
          triggerValue?: string | null
          unknownMessage?: string | null
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "Dify_instanceId_fkey"
            columns: ["instanceId"]
            isOneToOne: false
            referencedRelation: "Instance"
            referencedColumns: ["id"]
          },
        ]
      }
      DifySetting: {
        Row: {
          createdAt: string | null
          debounceTime: number | null
          delayMessage: number | null
          difyIdFallback: string | null
          expire: number | null
          id: string
          ignoreJids: Json | null
          instanceId: string
          keepOpen: boolean | null
          keywordFinish: string | null
          listeningFromMe: boolean | null
          splitMessages: boolean | null
          stopBotFromMe: boolean | null
          timePerChar: number | null
          unknownMessage: string | null
          updatedAt: string
        }
        Insert: {
          createdAt?: string | null
          debounceTime?: number | null
          delayMessage?: number | null
          difyIdFallback?: string | null
          expire?: number | null
          id: string
          ignoreJids?: Json | null
          instanceId: string
          keepOpen?: boolean | null
          keywordFinish?: string | null
          listeningFromMe?: boolean | null
          splitMessages?: boolean | null
          stopBotFromMe?: boolean | null
          timePerChar?: number | null
          unknownMessage?: string | null
          updatedAt: string
        }
        Update: {
          createdAt?: string | null
          debounceTime?: number | null
          delayMessage?: number | null
          difyIdFallback?: string | null
          expire?: number | null
          id?: string
          ignoreJids?: Json | null
          instanceId?: string
          keepOpen?: boolean | null
          keywordFinish?: string | null
          listeningFromMe?: boolean | null
          splitMessages?: boolean | null
          stopBotFromMe?: boolean | null
          timePerChar?: number | null
          unknownMessage?: string | null
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "DifySetting_difyIdFallback_fkey"
            columns: ["difyIdFallback"]
            isOneToOne: false
            referencedRelation: "Dify"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "DifySetting_instanceId_fkey"
            columns: ["instanceId"]
            isOneToOne: false
            referencedRelation: "Instance"
            referencedColumns: ["id"]
          },
        ]
      }
      Evoai: {
        Row: {
          agentUrl: string | null
          apiKey: string | null
          createdAt: string | null
          debounceTime: number | null
          delayMessage: number | null
          description: string | null
          enabled: boolean
          expire: number | null
          id: string
          ignoreJids: Json | null
          instanceId: string
          keepOpen: boolean | null
          keywordFinish: string | null
          listeningFromMe: boolean | null
          splitMessages: boolean | null
          stopBotFromMe: boolean | null
          timePerChar: number | null
          triggerOperator: Database["public"]["Enums"]["TriggerOperator"] | null
          triggerType: Database["public"]["Enums"]["TriggerType"] | null
          triggerValue: string | null
          unknownMessage: string | null
          updatedAt: string
        }
        Insert: {
          agentUrl?: string | null
          apiKey?: string | null
          createdAt?: string | null
          debounceTime?: number | null
          delayMessage?: number | null
          description?: string | null
          enabled?: boolean
          expire?: number | null
          id: string
          ignoreJids?: Json | null
          instanceId: string
          keepOpen?: boolean | null
          keywordFinish?: string | null
          listeningFromMe?: boolean | null
          splitMessages?: boolean | null
          stopBotFromMe?: boolean | null
          timePerChar?: number | null
          triggerOperator?:
            | Database["public"]["Enums"]["TriggerOperator"]
            | null
          triggerType?: Database["public"]["Enums"]["TriggerType"] | null
          triggerValue?: string | null
          unknownMessage?: string | null
          updatedAt: string
        }
        Update: {
          agentUrl?: string | null
          apiKey?: string | null
          createdAt?: string | null
          debounceTime?: number | null
          delayMessage?: number | null
          description?: string | null
          enabled?: boolean
          expire?: number | null
          id?: string
          ignoreJids?: Json | null
          instanceId?: string
          keepOpen?: boolean | null
          keywordFinish?: string | null
          listeningFromMe?: boolean | null
          splitMessages?: boolean | null
          stopBotFromMe?: boolean | null
          timePerChar?: number | null
          triggerOperator?:
            | Database["public"]["Enums"]["TriggerOperator"]
            | null
          triggerType?: Database["public"]["Enums"]["TriggerType"] | null
          triggerValue?: string | null
          unknownMessage?: string | null
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "Evoai_instanceId_fkey"
            columns: ["instanceId"]
            isOneToOne: false
            referencedRelation: "Instance"
            referencedColumns: ["id"]
          },
        ]
      }
      EvoaiSetting: {
        Row: {
          createdAt: string | null
          debounceTime: number | null
          delayMessage: number | null
          evoaiIdFallback: string | null
          expire: number | null
          id: string
          ignoreJids: Json | null
          instanceId: string
          keepOpen: boolean | null
          keywordFinish: string | null
          listeningFromMe: boolean | null
          splitMessages: boolean | null
          stopBotFromMe: boolean | null
          timePerChar: number | null
          unknownMessage: string | null
          updatedAt: string
        }
        Insert: {
          createdAt?: string | null
          debounceTime?: number | null
          delayMessage?: number | null
          evoaiIdFallback?: string | null
          expire?: number | null
          id: string
          ignoreJids?: Json | null
          instanceId: string
          keepOpen?: boolean | null
          keywordFinish?: string | null
          listeningFromMe?: boolean | null
          splitMessages?: boolean | null
          stopBotFromMe?: boolean | null
          timePerChar?: number | null
          unknownMessage?: string | null
          updatedAt: string
        }
        Update: {
          createdAt?: string | null
          debounceTime?: number | null
          delayMessage?: number | null
          evoaiIdFallback?: string | null
          expire?: number | null
          id?: string
          ignoreJids?: Json | null
          instanceId?: string
          keepOpen?: boolean | null
          keywordFinish?: string | null
          listeningFromMe?: boolean | null
          splitMessages?: boolean | null
          stopBotFromMe?: boolean | null
          timePerChar?: number | null
          unknownMessage?: string | null
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "EvoaiSetting_evoaiIdFallback_fkey"
            columns: ["evoaiIdFallback"]
            isOneToOne: false
            referencedRelation: "Evoai"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "EvoaiSetting_instanceId_fkey"
            columns: ["instanceId"]
            isOneToOne: false
            referencedRelation: "Instance"
            referencedColumns: ["id"]
          },
        ]
      }
      EvolutionBot: {
        Row: {
          apiKey: string | null
          apiUrl: string | null
          createdAt: string | null
          debounceTime: number | null
          delayMessage: number | null
          description: string | null
          enabled: boolean
          expire: number | null
          id: string
          ignoreJids: Json | null
          instanceId: string
          keepOpen: boolean | null
          keywordFinish: string | null
          listeningFromMe: boolean | null
          splitMessages: boolean | null
          stopBotFromMe: boolean | null
          timePerChar: number | null
          triggerOperator: Database["public"]["Enums"]["TriggerOperator"] | null
          triggerType: Database["public"]["Enums"]["TriggerType"] | null
          triggerValue: string | null
          unknownMessage: string | null
          updatedAt: string
        }
        Insert: {
          apiKey?: string | null
          apiUrl?: string | null
          createdAt?: string | null
          debounceTime?: number | null
          delayMessage?: number | null
          description?: string | null
          enabled?: boolean
          expire?: number | null
          id: string
          ignoreJids?: Json | null
          instanceId: string
          keepOpen?: boolean | null
          keywordFinish?: string | null
          listeningFromMe?: boolean | null
          splitMessages?: boolean | null
          stopBotFromMe?: boolean | null
          timePerChar?: number | null
          triggerOperator?:
            | Database["public"]["Enums"]["TriggerOperator"]
            | null
          triggerType?: Database["public"]["Enums"]["TriggerType"] | null
          triggerValue?: string | null
          unknownMessage?: string | null
          updatedAt: string
        }
        Update: {
          apiKey?: string | null
          apiUrl?: string | null
          createdAt?: string | null
          debounceTime?: number | null
          delayMessage?: number | null
          description?: string | null
          enabled?: boolean
          expire?: number | null
          id?: string
          ignoreJids?: Json | null
          instanceId?: string
          keepOpen?: boolean | null
          keywordFinish?: string | null
          listeningFromMe?: boolean | null
          splitMessages?: boolean | null
          stopBotFromMe?: boolean | null
          timePerChar?: number | null
          triggerOperator?:
            | Database["public"]["Enums"]["TriggerOperator"]
            | null
          triggerType?: Database["public"]["Enums"]["TriggerType"] | null
          triggerValue?: string | null
          unknownMessage?: string | null
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "EvolutionBot_instanceId_fkey"
            columns: ["instanceId"]
            isOneToOne: false
            referencedRelation: "Instance"
            referencedColumns: ["id"]
          },
        ]
      }
      EvolutionBotSetting: {
        Row: {
          botIdFallback: string | null
          createdAt: string | null
          debounceTime: number | null
          delayMessage: number | null
          expire: number | null
          id: string
          ignoreJids: Json | null
          instanceId: string
          keepOpen: boolean | null
          keywordFinish: string | null
          listeningFromMe: boolean | null
          splitMessages: boolean | null
          stopBotFromMe: boolean | null
          timePerChar: number | null
          unknownMessage: string | null
          updatedAt: string
        }
        Insert: {
          botIdFallback?: string | null
          createdAt?: string | null
          debounceTime?: number | null
          delayMessage?: number | null
          expire?: number | null
          id: string
          ignoreJids?: Json | null
          instanceId: string
          keepOpen?: boolean | null
          keywordFinish?: string | null
          listeningFromMe?: boolean | null
          splitMessages?: boolean | null
          stopBotFromMe?: boolean | null
          timePerChar?: number | null
          unknownMessage?: string | null
          updatedAt: string
        }
        Update: {
          botIdFallback?: string | null
          createdAt?: string | null
          debounceTime?: number | null
          delayMessage?: number | null
          expire?: number | null
          id?: string
          ignoreJids?: Json | null
          instanceId?: string
          keepOpen?: boolean | null
          keywordFinish?: string | null
          listeningFromMe?: boolean | null
          splitMessages?: boolean | null
          stopBotFromMe?: boolean | null
          timePerChar?: number | null
          unknownMessage?: string | null
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "EvolutionBotSetting_botIdFallback_fkey"
            columns: ["botIdFallback"]
            isOneToOne: false
            referencedRelation: "EvolutionBot"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "EvolutionBotSetting_instanceId_fkey"
            columns: ["instanceId"]
            isOneToOne: false
            referencedRelation: "Instance"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_entries: {
        Row: {
          amount: number
          category: Database["public"]["Enums"]["financial_category"]
          created_at: string
          created_by: string | null
          description: string
          due_date: string | null
          id: string
          notes: string | null
          paid_at: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          reference_id: string | null
          reference_type: string | null
          status: Database["public"]["Enums"]["payment_status"]
          tenant_id: string
          type: Database["public"]["Enums"]["financial_entry_type"]
          updated_at: string
        }
        Insert: {
          amount: number
          category: Database["public"]["Enums"]["financial_category"]
          created_at?: string
          created_by?: string | null
          description: string
          due_date?: string | null
          id?: string
          notes?: string | null
          paid_at?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          reference_id?: string | null
          reference_type?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          tenant_id: string
          type: Database["public"]["Enums"]["financial_entry_type"]
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: Database["public"]["Enums"]["financial_category"]
          created_at?: string
          created_by?: string | null
          description?: string
          due_date?: string | null
          id?: string
          notes?: string | null
          paid_at?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          reference_id?: string | null
          reference_type?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          tenant_id?: string
          type?: Database["public"]["Enums"]["financial_entry_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_entries_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_entries_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "plan_usage"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "financial_entries_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      Flowise: {
        Row: {
          apiKey: string | null
          apiUrl: string | null
          createdAt: string | null
          debounceTime: number | null
          delayMessage: number | null
          description: string | null
          enabled: boolean
          expire: number | null
          id: string
          ignoreJids: Json | null
          instanceId: string
          keepOpen: boolean | null
          keywordFinish: string | null
          listeningFromMe: boolean | null
          splitMessages: boolean | null
          stopBotFromMe: boolean | null
          timePerChar: number | null
          triggerOperator: Database["public"]["Enums"]["TriggerOperator"] | null
          triggerType: Database["public"]["Enums"]["TriggerType"] | null
          triggerValue: string | null
          unknownMessage: string | null
          updatedAt: string
        }
        Insert: {
          apiKey?: string | null
          apiUrl?: string | null
          createdAt?: string | null
          debounceTime?: number | null
          delayMessage?: number | null
          description?: string | null
          enabled?: boolean
          expire?: number | null
          id: string
          ignoreJids?: Json | null
          instanceId: string
          keepOpen?: boolean | null
          keywordFinish?: string | null
          listeningFromMe?: boolean | null
          splitMessages?: boolean | null
          stopBotFromMe?: boolean | null
          timePerChar?: number | null
          triggerOperator?:
            | Database["public"]["Enums"]["TriggerOperator"]
            | null
          triggerType?: Database["public"]["Enums"]["TriggerType"] | null
          triggerValue?: string | null
          unknownMessage?: string | null
          updatedAt: string
        }
        Update: {
          apiKey?: string | null
          apiUrl?: string | null
          createdAt?: string | null
          debounceTime?: number | null
          delayMessage?: number | null
          description?: string | null
          enabled?: boolean
          expire?: number | null
          id?: string
          ignoreJids?: Json | null
          instanceId?: string
          keepOpen?: boolean | null
          keywordFinish?: string | null
          listeningFromMe?: boolean | null
          splitMessages?: boolean | null
          stopBotFromMe?: boolean | null
          timePerChar?: number | null
          triggerOperator?:
            | Database["public"]["Enums"]["TriggerOperator"]
            | null
          triggerType?: Database["public"]["Enums"]["TriggerType"] | null
          triggerValue?: string | null
          unknownMessage?: string | null
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "Flowise_instanceId_fkey"
            columns: ["instanceId"]
            isOneToOne: false
            referencedRelation: "Instance"
            referencedColumns: ["id"]
          },
        ]
      }
      FlowiseSetting: {
        Row: {
          createdAt: string | null
          debounceTime: number | null
          delayMessage: number | null
          expire: number | null
          flowiseIdFallback: string | null
          id: string
          ignoreJids: Json | null
          instanceId: string
          keepOpen: boolean | null
          keywordFinish: string | null
          listeningFromMe: boolean | null
          splitMessages: boolean | null
          stopBotFromMe: boolean | null
          timePerChar: number | null
          unknownMessage: string | null
          updatedAt: string
        }
        Insert: {
          createdAt?: string | null
          debounceTime?: number | null
          delayMessage?: number | null
          expire?: number | null
          flowiseIdFallback?: string | null
          id: string
          ignoreJids?: Json | null
          instanceId: string
          keepOpen?: boolean | null
          keywordFinish?: string | null
          listeningFromMe?: boolean | null
          splitMessages?: boolean | null
          stopBotFromMe?: boolean | null
          timePerChar?: number | null
          unknownMessage?: string | null
          updatedAt: string
        }
        Update: {
          createdAt?: string | null
          debounceTime?: number | null
          delayMessage?: number | null
          expire?: number | null
          flowiseIdFallback?: string | null
          id?: string
          ignoreJids?: Json | null
          instanceId?: string
          keepOpen?: boolean | null
          keywordFinish?: string | null
          listeningFromMe?: boolean | null
          splitMessages?: boolean | null
          stopBotFromMe?: boolean | null
          timePerChar?: number | null
          unknownMessage?: string | null
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "FlowiseSetting_flowiseIdFallback_fkey"
            columns: ["flowiseIdFallback"]
            isOneToOne: false
            referencedRelation: "Flowise"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "FlowiseSetting_instanceId_fkey"
            columns: ["instanceId"]
            isOneToOne: false
            referencedRelation: "Instance"
            referencedColumns: ["id"]
          },
        ]
      }
      Instance: {
        Row: {
          businessId: string | null
          clientName: string | null
          connectionStatus: Database["public"]["Enums"]["InstanceConnectionStatus"]
          createdAt: string | null
          disconnectionAt: string | null
          disconnectionObject: Json | null
          disconnectionReasonCode: number | null
          id: string
          integration: string | null
          name: string
          number: string | null
          ownerJid: string | null
          profileName: string | null
          profilePicUrl: string | null
          token: string | null
          updatedAt: string | null
        }
        Insert: {
          businessId?: string | null
          clientName?: string | null
          connectionStatus?: Database["public"]["Enums"]["InstanceConnectionStatus"]
          createdAt?: string | null
          disconnectionAt?: string | null
          disconnectionObject?: Json | null
          disconnectionReasonCode?: number | null
          id: string
          integration?: string | null
          name: string
          number?: string | null
          ownerJid?: string | null
          profileName?: string | null
          profilePicUrl?: string | null
          token?: string | null
          updatedAt?: string | null
        }
        Update: {
          businessId?: string | null
          clientName?: string | null
          connectionStatus?: Database["public"]["Enums"]["InstanceConnectionStatus"]
          createdAt?: string | null
          disconnectionAt?: string | null
          disconnectionObject?: Json | null
          disconnectionReasonCode?: number | null
          id?: string
          integration?: string | null
          name?: string
          number?: string | null
          ownerJid?: string | null
          profileName?: string | null
          profilePicUrl?: string | null
          token?: string | null
          updatedAt?: string | null
        }
        Relationships: []
      }
      IntegrationSession: {
        Row: {
          awaitUser: boolean
          botId: string | null
          context: Json | null
          createdAt: string | null
          id: string
          instanceId: string
          parameters: Json | null
          pushName: string | null
          remoteJid: string
          sessionId: string
          status: Database["public"]["Enums"]["SessionStatus"]
          type: string | null
          updatedAt: string
        }
        Insert: {
          awaitUser?: boolean
          botId?: string | null
          context?: Json | null
          createdAt?: string | null
          id: string
          instanceId: string
          parameters?: Json | null
          pushName?: string | null
          remoteJid: string
          sessionId: string
          status: Database["public"]["Enums"]["SessionStatus"]
          type?: string | null
          updatedAt: string
        }
        Update: {
          awaitUser?: boolean
          botId?: string | null
          context?: Json | null
          createdAt?: string | null
          id?: string
          instanceId?: string
          parameters?: Json | null
          pushName?: string | null
          remoteJid?: string
          sessionId?: string
          status?: Database["public"]["Enums"]["SessionStatus"]
          type?: string | null
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "IntegrationSession_instanceId_fkey"
            columns: ["instanceId"]
            isOneToOne: false
            referencedRelation: "Instance"
            referencedColumns: ["id"]
          },
        ]
      }
      IsOnWhatsapp: {
        Row: {
          createdAt: string
          id: string
          jidOptions: string
          lid: string | null
          remoteJid: string
          updatedAt: string
        }
        Insert: {
          createdAt?: string
          id: string
          jidOptions: string
          lid?: string | null
          remoteJid: string
          updatedAt: string
        }
        Update: {
          createdAt?: string
          id?: string
          jidOptions?: string
          lid?: string | null
          remoteJid?: string
          updatedAt?: string
        }
        Relationships: []
      }
      Kafka: {
        Row: {
          createdAt: string | null
          enabled: boolean
          events: Json
          id: string
          instanceId: string
          updatedAt: string
        }
        Insert: {
          createdAt?: string | null
          enabled?: boolean
          events: Json
          id: string
          instanceId: string
          updatedAt: string
        }
        Update: {
          createdAt?: string | null
          enabled?: boolean
          events?: Json
          id?: string
          instanceId?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "Kafka_instanceId_fkey"
            columns: ["instanceId"]
            isOneToOne: false
            referencedRelation: "Instance"
            referencedColumns: ["id"]
          },
        ]
      }
      Label: {
        Row: {
          color: string
          createdAt: string | null
          id: string
          instanceId: string
          labelId: string | null
          name: string
          predefinedId: string | null
          updatedAt: string
        }
        Insert: {
          color: string
          createdAt?: string | null
          id: string
          instanceId: string
          labelId?: string | null
          name: string
          predefinedId?: string | null
          updatedAt: string
        }
        Update: {
          color?: string
          createdAt?: string | null
          id?: string
          instanceId?: string
          labelId?: string | null
          name?: string
          predefinedId?: string | null
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "Label_instanceId_fkey"
            columns: ["instanceId"]
            isOneToOne: false
            referencedRelation: "Instance"
            referencedColumns: ["id"]
          },
        ]
      }
      landing_leads: {
        Row: {
          city: string | null
          created_at: string
          email: string | null
          id: string
          last_contact_at: string | null
          name: string
          next_action: string | null
          notes: string | null
          phone: string
          source: string
          state: string | null
          status: string
          store_name: string | null
          updated_at: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          vehicles_count: string | null
        }
        Insert: {
          city?: string | null
          created_at?: string
          email?: string | null
          id?: string
          last_contact_at?: string | null
          name: string
          next_action?: string | null
          notes?: string | null
          phone: string
          source?: string
          state?: string | null
          status?: string
          store_name?: string | null
          updated_at?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          vehicles_count?: string | null
        }
        Update: {
          city?: string | null
          created_at?: string
          email?: string | null
          id?: string
          last_contact_at?: string | null
          name?: string
          next_action?: string | null
          notes?: string | null
          phone?: string
          source?: string
          state?: string | null
          status?: string
          store_name?: string | null
          updated_at?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          vehicles_count?: string | null
        }
        Relationships: []
      }
      lead_activities: {
        Row: {
          created_at: string
          description: string
          id: string
          lead_id: string
          metadata: Json | null
          tenant_id: string
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          lead_id: string
          metadata?: Json | null
          tenant_id: string
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          lead_id?: string
          metadata?: Json | null
          tenant_id?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_activities_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "plan_usage"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "lead_activities_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_activities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          closed_at: string | null
          contacted_at: string | null
          created_at: string
          email: string | null
          follow_up_at: string | null
          follow_up_note: string | null
          id: string
          ip_address: unknown
          kanban_position: number
          message: string | null
          name: string
          notes: string | null
          phone: string
          seller_id: string | null
          source: Database["public"]["Enums"]["lead_source"]
          status: Database["public"]["Enums"]["lead_status"]
          tenant_id: string
          updated_at: string
          user_agent: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
          vehicle_id: string | null
        }
        Insert: {
          closed_at?: string | null
          contacted_at?: string | null
          created_at?: string
          email?: string | null
          follow_up_at?: string | null
          follow_up_note?: string | null
          id?: string
          ip_address?: unknown
          kanban_position?: number
          message?: string | null
          name: string
          notes?: string | null
          phone: string
          seller_id?: string | null
          source?: Database["public"]["Enums"]["lead_source"]
          status?: Database["public"]["Enums"]["lead_status"]
          tenant_id: string
          updated_at?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          vehicle_id?: string | null
        }
        Update: {
          closed_at?: string | null
          contacted_at?: string | null
          created_at?: string
          email?: string | null
          follow_up_at?: string | null
          follow_up_note?: string | null
          id?: string
          ip_address?: unknown
          kanban_position?: number
          message?: string | null
          name?: string
          notes?: string | null
          phone?: string
          seller_id?: string | null
          source?: Database["public"]["Enums"]["lead_source"]
          status?: Database["public"]["Enums"]["lead_status"]
          tenant_id?: string
          updated_at?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "plan_usage"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "leads_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      Media: {
        Row: {
          createdAt: string | null
          fileName: string
          id: string
          instanceId: string
          messageId: string
          mimetype: string
          type: string
        }
        Insert: {
          createdAt?: string | null
          fileName: string
          id: string
          instanceId: string
          messageId: string
          mimetype: string
          type: string
        }
        Update: {
          createdAt?: string | null
          fileName?: string
          id?: string
          instanceId?: string
          messageId?: string
          mimetype?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "Media_instanceId_fkey"
            columns: ["instanceId"]
            isOneToOne: false
            referencedRelation: "Instance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Media_messageId_fkey"
            columns: ["messageId"]
            isOneToOne: false
            referencedRelation: "Message"
            referencedColumns: ["id"]
          },
        ]
      }
      Message: {
        Row: {
          chatwootContactInboxSourceId: string | null
          chatwootConversationId: number | null
          chatwootInboxId: number | null
          chatwootIsRead: boolean | null
          chatwootMessageId: number | null
          contextInfo: Json | null
          id: string
          instanceId: string
          key: Json
          message: Json
          messageTimestamp: number
          messageType: string
          participant: string | null
          pushName: string | null
          sessionId: string | null
          source: Database["public"]["Enums"]["DeviceMessage"]
          status: string | null
          webhookUrl: string | null
        }
        Insert: {
          chatwootContactInboxSourceId?: string | null
          chatwootConversationId?: number | null
          chatwootInboxId?: number | null
          chatwootIsRead?: boolean | null
          chatwootMessageId?: number | null
          contextInfo?: Json | null
          id: string
          instanceId: string
          key: Json
          message: Json
          messageTimestamp: number
          messageType: string
          participant?: string | null
          pushName?: string | null
          sessionId?: string | null
          source: Database["public"]["Enums"]["DeviceMessage"]
          status?: string | null
          webhookUrl?: string | null
        }
        Update: {
          chatwootContactInboxSourceId?: string | null
          chatwootConversationId?: number | null
          chatwootInboxId?: number | null
          chatwootIsRead?: boolean | null
          chatwootMessageId?: number | null
          contextInfo?: Json | null
          id?: string
          instanceId?: string
          key?: Json
          message?: Json
          messageTimestamp?: number
          messageType?: string
          participant?: string | null
          pushName?: string | null
          sessionId?: string | null
          source?: Database["public"]["Enums"]["DeviceMessage"]
          status?: string | null
          webhookUrl?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "Message_instanceId_fkey"
            columns: ["instanceId"]
            isOneToOne: false
            referencedRelation: "Instance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Message_sessionId_fkey"
            columns: ["sessionId"]
            isOneToOne: false
            referencedRelation: "IntegrationSession"
            referencedColumns: ["id"]
          },
        ]
      }
      MessageUpdate: {
        Row: {
          fromMe: boolean
          id: string
          instanceId: string
          keyId: string
          messageId: string
          participant: string | null
          pollUpdates: Json | null
          remoteJid: string
          status: string
        }
        Insert: {
          fromMe: boolean
          id: string
          instanceId: string
          keyId: string
          messageId: string
          participant?: string | null
          pollUpdates?: Json | null
          remoteJid: string
          status: string
        }
        Update: {
          fromMe?: boolean
          id?: string
          instanceId?: string
          keyId?: string
          messageId?: string
          participant?: string | null
          pollUpdates?: Json | null
          remoteJid?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "MessageUpdate_instanceId_fkey"
            columns: ["instanceId"]
            isOneToOne: false
            referencedRelation: "Instance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "MessageUpdate_messageId_fkey"
            columns: ["messageId"]
            isOneToOne: false
            referencedRelation: "Message"
            referencedColumns: ["id"]
          },
        ]
      }
      N8n: {
        Row: {
          basicAuthPass: string | null
          basicAuthUser: string | null
          createdAt: string | null
          debounceTime: number | null
          delayMessage: number | null
          description: string | null
          enabled: boolean
          expire: number | null
          id: string
          ignoreJids: Json | null
          instanceId: string
          keepOpen: boolean | null
          keywordFinish: string | null
          listeningFromMe: boolean | null
          splitMessages: boolean | null
          stopBotFromMe: boolean | null
          timePerChar: number | null
          triggerOperator: Database["public"]["Enums"]["TriggerOperator"] | null
          triggerType: Database["public"]["Enums"]["TriggerType"] | null
          triggerValue: string | null
          unknownMessage: string | null
          updatedAt: string
          webhookUrl: string | null
        }
        Insert: {
          basicAuthPass?: string | null
          basicAuthUser?: string | null
          createdAt?: string | null
          debounceTime?: number | null
          delayMessage?: number | null
          description?: string | null
          enabled?: boolean
          expire?: number | null
          id: string
          ignoreJids?: Json | null
          instanceId: string
          keepOpen?: boolean | null
          keywordFinish?: string | null
          listeningFromMe?: boolean | null
          splitMessages?: boolean | null
          stopBotFromMe?: boolean | null
          timePerChar?: number | null
          triggerOperator?:
            | Database["public"]["Enums"]["TriggerOperator"]
            | null
          triggerType?: Database["public"]["Enums"]["TriggerType"] | null
          triggerValue?: string | null
          unknownMessage?: string | null
          updatedAt: string
          webhookUrl?: string | null
        }
        Update: {
          basicAuthPass?: string | null
          basicAuthUser?: string | null
          createdAt?: string | null
          debounceTime?: number | null
          delayMessage?: number | null
          description?: string | null
          enabled?: boolean
          expire?: number | null
          id?: string
          ignoreJids?: Json | null
          instanceId?: string
          keepOpen?: boolean | null
          keywordFinish?: string | null
          listeningFromMe?: boolean | null
          splitMessages?: boolean | null
          stopBotFromMe?: boolean | null
          timePerChar?: number | null
          triggerOperator?:
            | Database["public"]["Enums"]["TriggerOperator"]
            | null
          triggerType?: Database["public"]["Enums"]["TriggerType"] | null
          triggerValue?: string | null
          unknownMessage?: string | null
          updatedAt?: string
          webhookUrl?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "N8n_instanceId_fkey"
            columns: ["instanceId"]
            isOneToOne: false
            referencedRelation: "Instance"
            referencedColumns: ["id"]
          },
        ]
      }
      N8nSetting: {
        Row: {
          createdAt: string | null
          debounceTime: number | null
          delayMessage: number | null
          expire: number | null
          id: string
          ignoreJids: Json | null
          instanceId: string
          keepOpen: boolean | null
          keywordFinish: string | null
          listeningFromMe: boolean | null
          n8nIdFallback: string | null
          splitMessages: boolean | null
          stopBotFromMe: boolean | null
          timePerChar: number | null
          unknownMessage: string | null
          updatedAt: string
        }
        Insert: {
          createdAt?: string | null
          debounceTime?: number | null
          delayMessage?: number | null
          expire?: number | null
          id: string
          ignoreJids?: Json | null
          instanceId: string
          keepOpen?: boolean | null
          keywordFinish?: string | null
          listeningFromMe?: boolean | null
          n8nIdFallback?: string | null
          splitMessages?: boolean | null
          stopBotFromMe?: boolean | null
          timePerChar?: number | null
          unknownMessage?: string | null
          updatedAt: string
        }
        Update: {
          createdAt?: string | null
          debounceTime?: number | null
          delayMessage?: number | null
          expire?: number | null
          id?: string
          ignoreJids?: Json | null
          instanceId?: string
          keepOpen?: boolean | null
          keywordFinish?: string | null
          listeningFromMe?: boolean | null
          n8nIdFallback?: string | null
          splitMessages?: boolean | null
          stopBotFromMe?: boolean | null
          timePerChar?: number | null
          unknownMessage?: string | null
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "N8nSetting_instanceId_fkey"
            columns: ["instanceId"]
            isOneToOne: false
            referencedRelation: "Instance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "N8nSetting_n8nIdFallback_fkey"
            columns: ["n8nIdFallback"]
            isOneToOne: false
            referencedRelation: "N8n"
            referencedColumns: ["id"]
          },
        ]
      }
      Nats: {
        Row: {
          createdAt: string | null
          enabled: boolean
          events: Json
          id: string
          instanceId: string
          updatedAt: string
        }
        Insert: {
          createdAt?: string | null
          enabled?: boolean
          events: Json
          id: string
          instanceId: string
          updatedAt: string
        }
        Update: {
          createdAt?: string | null
          enabled?: boolean
          events?: Json
          id?: string
          instanceId?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "Nats_instanceId_fkey"
            columns: ["instanceId"]
            isOneToOne: false
            referencedRelation: "Instance"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_checklists: {
        Row: {
          added_seller: boolean
          added_vehicle: boolean
          completed_at: string | null
          configured_whatsapp: boolean
          created_at: string
          id: string
          published_store: boolean
          received_first_lead: boolean
          tenant_id: string
          updated_at: string
          whatsapp_connected: boolean
        }
        Insert: {
          added_seller?: boolean
          added_vehicle?: boolean
          completed_at?: string | null
          configured_whatsapp?: boolean
          created_at?: string
          id?: string
          published_store?: boolean
          received_first_lead?: boolean
          tenant_id: string
          updated_at?: string
          whatsapp_connected?: boolean
        }
        Update: {
          added_seller?: boolean
          added_vehicle?: boolean
          completed_at?: string | null
          configured_whatsapp?: boolean
          created_at?: string
          id?: string
          published_store?: boolean
          received_first_lead?: boolean
          tenant_id?: string
          updated_at?: string
          whatsapp_connected?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_checklists_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "plan_usage"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "onboarding_checklists_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      OpenaiBot: {
        Row: {
          assistantId: string | null
          assistantMessages: Json | null
          botType: Database["public"]["Enums"]["OpenaiBotType"]
          createdAt: string | null
          debounceTime: number | null
          delayMessage: number | null
          description: string | null
          enabled: boolean
          expire: number | null
          functionUrl: string | null
          id: string
          ignoreJids: Json | null
          instanceId: string
          keepOpen: boolean | null
          keywordFinish: string | null
          listeningFromMe: boolean | null
          maxTokens: number | null
          model: string | null
          openaiCredsId: string
          splitMessages: boolean | null
          stopBotFromMe: boolean | null
          systemMessages: Json | null
          timePerChar: number | null
          triggerOperator: Database["public"]["Enums"]["TriggerOperator"] | null
          triggerType: Database["public"]["Enums"]["TriggerType"] | null
          triggerValue: string | null
          unknownMessage: string | null
          updatedAt: string
          userMessages: Json | null
        }
        Insert: {
          assistantId?: string | null
          assistantMessages?: Json | null
          botType: Database["public"]["Enums"]["OpenaiBotType"]
          createdAt?: string | null
          debounceTime?: number | null
          delayMessage?: number | null
          description?: string | null
          enabled?: boolean
          expire?: number | null
          functionUrl?: string | null
          id: string
          ignoreJids?: Json | null
          instanceId: string
          keepOpen?: boolean | null
          keywordFinish?: string | null
          listeningFromMe?: boolean | null
          maxTokens?: number | null
          model?: string | null
          openaiCredsId: string
          splitMessages?: boolean | null
          stopBotFromMe?: boolean | null
          systemMessages?: Json | null
          timePerChar?: number | null
          triggerOperator?:
            | Database["public"]["Enums"]["TriggerOperator"]
            | null
          triggerType?: Database["public"]["Enums"]["TriggerType"] | null
          triggerValue?: string | null
          unknownMessage?: string | null
          updatedAt: string
          userMessages?: Json | null
        }
        Update: {
          assistantId?: string | null
          assistantMessages?: Json | null
          botType?: Database["public"]["Enums"]["OpenaiBotType"]
          createdAt?: string | null
          debounceTime?: number | null
          delayMessage?: number | null
          description?: string | null
          enabled?: boolean
          expire?: number | null
          functionUrl?: string | null
          id?: string
          ignoreJids?: Json | null
          instanceId?: string
          keepOpen?: boolean | null
          keywordFinish?: string | null
          listeningFromMe?: boolean | null
          maxTokens?: number | null
          model?: string | null
          openaiCredsId?: string
          splitMessages?: boolean | null
          stopBotFromMe?: boolean | null
          systemMessages?: Json | null
          timePerChar?: number | null
          triggerOperator?:
            | Database["public"]["Enums"]["TriggerOperator"]
            | null
          triggerType?: Database["public"]["Enums"]["TriggerType"] | null
          triggerValue?: string | null
          unknownMessage?: string | null
          updatedAt?: string
          userMessages?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "OpenaiBot_instanceId_fkey"
            columns: ["instanceId"]
            isOneToOne: false
            referencedRelation: "Instance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "OpenaiBot_openaiCredsId_fkey"
            columns: ["openaiCredsId"]
            isOneToOne: false
            referencedRelation: "OpenaiCreds"
            referencedColumns: ["id"]
          },
        ]
      }
      OpenaiCreds: {
        Row: {
          apiKey: string | null
          createdAt: string | null
          id: string
          instanceId: string
          name: string | null
          updatedAt: string
        }
        Insert: {
          apiKey?: string | null
          createdAt?: string | null
          id: string
          instanceId: string
          name?: string | null
          updatedAt: string
        }
        Update: {
          apiKey?: string | null
          createdAt?: string | null
          id?: string
          instanceId?: string
          name?: string | null
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "OpenaiCreds_instanceId_fkey"
            columns: ["instanceId"]
            isOneToOne: false
            referencedRelation: "Instance"
            referencedColumns: ["id"]
          },
        ]
      }
      OpenaiSetting: {
        Row: {
          createdAt: string | null
          debounceTime: number | null
          delayMessage: number | null
          expire: number | null
          id: string
          ignoreJids: Json | null
          instanceId: string
          keepOpen: boolean | null
          keywordFinish: string | null
          listeningFromMe: boolean | null
          openaiCredsId: string
          openaiIdFallback: string | null
          speechToText: boolean | null
          splitMessages: boolean | null
          stopBotFromMe: boolean | null
          timePerChar: number | null
          unknownMessage: string | null
          updatedAt: string
        }
        Insert: {
          createdAt?: string | null
          debounceTime?: number | null
          delayMessage?: number | null
          expire?: number | null
          id: string
          ignoreJids?: Json | null
          instanceId: string
          keepOpen?: boolean | null
          keywordFinish?: string | null
          listeningFromMe?: boolean | null
          openaiCredsId: string
          openaiIdFallback?: string | null
          speechToText?: boolean | null
          splitMessages?: boolean | null
          stopBotFromMe?: boolean | null
          timePerChar?: number | null
          unknownMessage?: string | null
          updatedAt: string
        }
        Update: {
          createdAt?: string | null
          debounceTime?: number | null
          delayMessage?: number | null
          expire?: number | null
          id?: string
          ignoreJids?: Json | null
          instanceId?: string
          keepOpen?: boolean | null
          keywordFinish?: string | null
          listeningFromMe?: boolean | null
          openaiCredsId?: string
          openaiIdFallback?: string | null
          speechToText?: boolean | null
          splitMessages?: boolean | null
          stopBotFromMe?: boolean | null
          timePerChar?: number | null
          unknownMessage?: string | null
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "OpenaiSetting_instanceId_fkey"
            columns: ["instanceId"]
            isOneToOne: false
            referencedRelation: "Instance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "OpenaiSetting_openaiCredsId_fkey"
            columns: ["openaiCredsId"]
            isOneToOne: false
            referencedRelation: "OpenaiCreds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "OpenaiSetting_openaiIdFallback_fkey"
            columns: ["openaiIdFallback"]
            isOneToOne: false
            referencedRelation: "OpenaiBot"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_addons: {
        Row: {
          addon_type: string
          created_at: string
          description: string | null
          display_name: string
          features: Json
          id: string
          is_active: boolean
          price_monthly: number
          unit: string
        }
        Insert: {
          addon_type: string
          created_at?: string
          description?: string | null
          display_name: string
          features?: Json
          id?: string
          is_active?: boolean
          price_monthly: number
          unit?: string
        }
        Update: {
          addon_type?: string
          created_at?: string
          description?: string | null
          display_name?: string
          features?: Json
          id?: string
          is_active?: boolean
          price_monthly?: number
          unit?: string
        }
        Relationships: []
      }
      plans: {
        Row: {
          created_at: string
          display_name: string
          features: Json
          id: string
          is_active: boolean
          max_leads: number
          max_users: number
          max_vehicles: number
          name: string
          price_monthly: number
          price_yearly: number
          tagline: string | null
        }
        Insert: {
          created_at?: string
          display_name: string
          features?: Json
          id?: string
          is_active?: boolean
          max_leads: number
          max_users: number
          max_vehicles: number
          name: string
          price_monthly?: number
          price_yearly?: number
          tagline?: string | null
        }
        Update: {
          created_at?: string
          display_name?: string
          features?: Json
          id?: string
          is_active?: boolean
          max_leads?: number
          max_users?: number
          max_vehicles?: number
          name?: string
          price_monthly?: number
          price_yearly?: number
          tagline?: string | null
        }
        Relationships: []
      }
      Proxy: {
        Row: {
          createdAt: string | null
          enabled: boolean
          host: string
          id: string
          instanceId: string
          password: string
          port: string
          protocol: string
          updatedAt: string
          username: string
        }
        Insert: {
          createdAt?: string | null
          enabled?: boolean
          host: string
          id: string
          instanceId: string
          password: string
          port: string
          protocol: string
          updatedAt: string
          username: string
        }
        Update: {
          createdAt?: string | null
          enabled?: boolean
          host?: string
          id?: string
          instanceId?: string
          password?: string
          port?: string
          protocol?: string
          updatedAt?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "Proxy_instanceId_fkey"
            columns: ["instanceId"]
            isOneToOne: false
            referencedRelation: "Instance"
            referencedColumns: ["id"]
          },
        ]
      }
      Pusher: {
        Row: {
          appId: string
          cluster: string
          createdAt: string | null
          enabled: boolean
          events: Json
          id: string
          instanceId: string
          key: string
          secret: string
          updatedAt: string
          useTLS: boolean
        }
        Insert: {
          appId: string
          cluster: string
          createdAt?: string | null
          enabled?: boolean
          events: Json
          id: string
          instanceId: string
          key: string
          secret: string
          updatedAt: string
          useTLS?: boolean
        }
        Update: {
          appId?: string
          cluster?: string
          createdAt?: string | null
          enabled?: boolean
          events?: Json
          id?: string
          instanceId?: string
          key?: string
          secret?: string
          updatedAt?: string
          useTLS?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "Pusher_instanceId_fkey"
            columns: ["instanceId"]
            isOneToOne: false
            referencedRelation: "Instance"
            referencedColumns: ["id"]
          },
        ]
      }
      Rabbitmq: {
        Row: {
          createdAt: string | null
          enabled: boolean
          events: Json
          id: string
          instanceId: string
          updatedAt: string
        }
        Insert: {
          createdAt?: string | null
          enabled?: boolean
          events: Json
          id: string
          instanceId: string
          updatedAt: string
        }
        Update: {
          createdAt?: string | null
          enabled?: boolean
          events?: Json
          id?: string
          instanceId?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "Rabbitmq_instanceId_fkey"
            columns: ["instanceId"]
            isOneToOne: false
            referencedRelation: "Instance"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          created_at: string
          customer_id: string | null
          discount: number
          financing_amount: number | null
          financing_type: Database["public"]["Enums"]["financing_type"]
          id: string
          lead_id: string | null
          list_price: number
          notes: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          sale_price: number
          seller_id: string | null
          sold_at: string | null
          status: Database["public"]["Enums"]["sale_status"]
          tenant_id: string
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          discount?: number
          financing_amount?: number | null
          financing_type?: Database["public"]["Enums"]["financing_type"]
          id?: string
          lead_id?: string | null
          list_price: number
          notes?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          sale_price: number
          seller_id?: string | null
          sold_at?: string | null
          status?: Database["public"]["Enums"]["sale_status"]
          tenant_id: string
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          discount?: number
          financing_amount?: number | null
          financing_type?: Database["public"]["Enums"]["financing_type"]
          id?: string
          lead_id?: string | null
          list_price?: number
          notes?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          sale_price?: number
          seller_id?: string | null
          sold_at?: string | null
          status?: Database["public"]["Enums"]["sale_status"]
          tenant_id?: string
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "plan_usage"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "sales_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_commission_rules: {
        Row: {
          created_at: string
          fixed_amount: number | null
          id: string
          is_active: boolean
          rate: number | null
          seller_id: string
          tenant_id: string
          type: Database["public"]["Enums"]["commission_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          fixed_amount?: number | null
          id?: string
          is_active?: boolean
          rate?: number | null
          seller_id: string
          tenant_id: string
          type?: Database["public"]["Enums"]["commission_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          fixed_amount?: number | null
          id?: string
          is_active?: boolean
          rate?: number | null
          seller_id?: string
          tenant_id?: string
          type?: Database["public"]["Enums"]["commission_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "seller_commission_rules_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_commission_rules_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "plan_usage"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "seller_commission_rules_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      sellers: {
        Row: {
          bio: string | null
          created_at: string
          display_name: string
          id: string
          is_active: boolean
          phone_whatsapp: string
          photo_url: string | null
          tenant_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          bio?: string | null
          created_at?: string
          display_name: string
          id?: string
          is_active?: boolean
          phone_whatsapp: string
          photo_url?: string | null
          tenant_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          bio?: string | null
          created_at?: string
          display_name?: string
          id?: string
          is_active?: boolean
          phone_whatsapp?: string
          photo_url?: string | null
          tenant_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sellers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "plan_usage"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "sellers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      Session: {
        Row: {
          createdAt: string
          creds: string | null
          id: string
          sessionId: string
        }
        Insert: {
          createdAt?: string
          creds?: string | null
          id: string
          sessionId: string
        }
        Update: {
          createdAt?: string
          creds?: string | null
          id?: string
          sessionId?: string
        }
        Relationships: [
          {
            foreignKeyName: "Session_sessionId_fkey"
            columns: ["sessionId"]
            isOneToOne: false
            referencedRelation: "Instance"
            referencedColumns: ["id"]
          },
        ]
      }
      Setting: {
        Row: {
          alwaysOnline: boolean
          createdAt: string | null
          groupsIgnore: boolean
          id: string
          instanceId: string
          msgCall: string | null
          readMessages: boolean
          readStatus: boolean
          rejectCall: boolean
          syncFullHistory: boolean
          updatedAt: string
          wavoipToken: string | null
        }
        Insert: {
          alwaysOnline?: boolean
          createdAt?: string | null
          groupsIgnore?: boolean
          id: string
          instanceId: string
          msgCall?: string | null
          readMessages?: boolean
          readStatus?: boolean
          rejectCall?: boolean
          syncFullHistory?: boolean
          updatedAt: string
          wavoipToken?: string | null
        }
        Update: {
          alwaysOnline?: boolean
          createdAt?: string | null
          groupsIgnore?: boolean
          id?: string
          instanceId?: string
          msgCall?: string | null
          readMessages?: boolean
          readStatus?: boolean
          rejectCall?: boolean
          syncFullHistory?: boolean
          updatedAt?: string
          wavoipToken?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "Setting_instanceId_fkey"
            columns: ["instanceId"]
            isOneToOne: false
            referencedRelation: "Instance"
            referencedColumns: ["id"]
          },
        ]
      }
      Sqs: {
        Row: {
          createdAt: string | null
          enabled: boolean
          events: Json
          id: string
          instanceId: string
          updatedAt: string
        }
        Insert: {
          createdAt?: string | null
          enabled?: boolean
          events: Json
          id: string
          instanceId: string
          updatedAt: string
        }
        Update: {
          createdAt?: string | null
          enabled?: boolean
          events?: Json
          id?: string
          instanceId?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "Sqs_instanceId_fkey"
            columns: ["instanceId"]
            isOneToOne: false
            referencedRelation: "Instance"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_addons: {
        Row: {
          addon_type: string
          asaas_addon_id: string | null
          asaas_payment_link: string | null
          canceled_at: string | null
          created_at: string
          grace_until: string | null
          id: string
          price_monthly: number
          quantity: number
          started_at: string
          status: string
          subscription_id: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          addon_type: string
          asaas_addon_id?: string | null
          asaas_payment_link?: string | null
          canceled_at?: string | null
          created_at?: string
          grace_until?: string | null
          id?: string
          price_monthly: number
          quantity?: number
          started_at?: string
          status?: string
          subscription_id?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          addon_type?: string
          asaas_addon_id?: string | null
          asaas_payment_link?: string | null
          canceled_at?: string | null
          created_at?: string
          grace_until?: string | null
          id?: string
          price_monthly?: number
          quantity?: number
          started_at?: string
          status?: string
          subscription_id?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_addons_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_addons_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "plan_usage"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "subscription_addons_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          asaas_payment_link: string | null
          asaas_subscription_id: string | null
          billing_cycle: string
          canceled_at: string | null
          created_at: string
          current_period_end: string
          current_period_start: string
          external_id: string | null
          grace_until: string | null
          id: string
          metadata: Json | null
          plan_id: string
          status: Database["public"]["Enums"]["subscription_status"]
          tenant_id: string
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          asaas_payment_link?: string | null
          asaas_subscription_id?: string | null
          billing_cycle?: string
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          external_id?: string | null
          grace_until?: string | null
          id?: string
          metadata?: Json | null
          plan_id: string
          status?: Database["public"]["Enums"]["subscription_status"]
          tenant_id: string
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          asaas_payment_link?: string | null
          asaas_subscription_id?: string | null
          billing_cycle?: string
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          external_id?: string | null
          grace_until?: string | null
          id?: string
          metadata?: Json | null
          plan_id?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          tenant_id?: string
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "plan_usage"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "subscriptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      Template: {
        Row: {
          createdAt: string | null
          id: string
          instanceId: string
          name: string
          template: Json
          templateId: string
          updatedAt: string
          webhookUrl: string | null
        }
        Insert: {
          createdAt?: string | null
          id: string
          instanceId: string
          name: string
          template: Json
          templateId: string
          updatedAt: string
          webhookUrl?: string | null
        }
        Update: {
          createdAt?: string | null
          id?: string
          instanceId?: string
          name?: string
          template?: Json
          templateId?: string
          updatedAt?: string
          webhookUrl?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "Template_instanceId_fkey"
            columns: ["instanceId"]
            isOneToOne: false
            referencedRelation: "Instance"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_features: {
        Row: {
          created_at: string
          enabled: boolean
          expires_at: string | null
          feature: string
          granted_by: string | null
          id: string
          note: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          expires_at?: string | null
          feature: string
          granted_by?: string | null
          id?: string
          note?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          expires_at?: string | null
          feature?: string
          granted_by?: string | null
          id?: string
          note?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_features_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_features_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "plan_usage"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "tenant_features_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_plan_history: {
        Row: {
          billing_cycle: string | null
          changed_by: string | null
          created_at: string
          from_plan_id: string | null
          from_status: string | null
          id: string
          reason: string | null
          tenant_id: string
          to_plan_id: string
          to_status: string
        }
        Insert: {
          billing_cycle?: string | null
          changed_by?: string | null
          created_at?: string
          from_plan_id?: string | null
          from_status?: string | null
          id?: string
          reason?: string | null
          tenant_id: string
          to_plan_id: string
          to_status: string
        }
        Update: {
          billing_cycle?: string | null
          changed_by?: string | null
          created_at?: string
          from_plan_id?: string | null
          from_status?: string | null
          id?: string
          reason?: string | null
          tenant_id?: string
          to_plan_id?: string
          to_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_plan_history_from_plan_id_fkey"
            columns: ["from_plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_plan_history_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "plan_usage"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "tenant_plan_history_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_plan_history_to_plan_id_fkey"
            columns: ["to_plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_public_contacts: {
        Row: {
          created_at: string
          groups_link: string | null
          id: string
          instagram: string | null
          location: string | null
          public_email: string | null
          public_phone: string | null
          public_whatsapp: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          groups_link?: string | null
          id?: string
          instagram?: string | null
          location?: string | null
          public_email?: string | null
          public_phone?: string | null
          public_whatsapp?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          groups_link?: string | null
          id?: string
          instagram?: string | null
          location?: string | null
          public_email?: string | null
          public_phone?: string | null
          public_whatsapp?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_public_contacts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "plan_usage"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "tenant_public_contacts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_whatsapp_sessions: {
        Row: {
          created_at: string
          id: string
          instance_name: string
          last_connection_at: string | null
          qr_code: string | null
          session_data: Json | null
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          instance_name: string
          last_connection_at?: string | null
          qr_code?: string | null
          session_data?: Json | null
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          instance_name?: string
          last_connection_at?: string | null
          qr_code?: string | null
          session_data?: Json | null
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_whatsapp_sessions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "plan_usage"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "tenant_whatsapp_sessions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          address: Json | null
          asaas_customer_id: string | null
          cpf_cnpj: string | null
          created_at: string
          custom_domain: string | null
          deleted_at: string | null
          deleted_reason: string | null
          description: string | null
          email: string
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          phone_whatsapp: string
          quarantine_reason: string | null
          quarantined_at: string | null
          seo_description: string | null
          seo_title: string | null
          slug: string
          social_links: Json | null
          theme: Json | null
          updated_at: string
        }
        Insert: {
          address?: Json | null
          asaas_customer_id?: string | null
          cpf_cnpj?: string | null
          created_at?: string
          custom_domain?: string | null
          deleted_at?: string | null
          deleted_reason?: string | null
          description?: string | null
          email: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          phone_whatsapp: string
          quarantine_reason?: string | null
          quarantined_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          social_links?: Json | null
          theme?: Json | null
          updated_at?: string
        }
        Update: {
          address?: Json | null
          asaas_customer_id?: string | null
          cpf_cnpj?: string | null
          created_at?: string
          custom_domain?: string | null
          deleted_at?: string | null
          deleted_reason?: string | null
          description?: string | null
          email?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          phone_whatsapp?: string
          quarantine_reason?: string | null
          quarantined_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          social_links?: Json | null
          theme?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      Typebot: {
        Row: {
          createdAt: string | null
          debounceTime: number | null
          delayMessage: number | null
          description: string | null
          enabled: boolean
          expire: number | null
          id: string
          ignoreJids: Json | null
          instanceId: string
          keepOpen: boolean | null
          keywordFinish: string | null
          listeningFromMe: boolean | null
          splitMessages: boolean | null
          stopBotFromMe: boolean | null
          timePerChar: number | null
          triggerOperator: Database["public"]["Enums"]["TriggerOperator"] | null
          triggerType: Database["public"]["Enums"]["TriggerType"] | null
          triggerValue: string | null
          typebot: string
          unknownMessage: string | null
          updatedAt: string | null
          url: string
        }
        Insert: {
          createdAt?: string | null
          debounceTime?: number | null
          delayMessage?: number | null
          description?: string | null
          enabled?: boolean
          expire?: number | null
          id: string
          ignoreJids?: Json | null
          instanceId: string
          keepOpen?: boolean | null
          keywordFinish?: string | null
          listeningFromMe?: boolean | null
          splitMessages?: boolean | null
          stopBotFromMe?: boolean | null
          timePerChar?: number | null
          triggerOperator?:
            | Database["public"]["Enums"]["TriggerOperator"]
            | null
          triggerType?: Database["public"]["Enums"]["TriggerType"] | null
          triggerValue?: string | null
          typebot: string
          unknownMessage?: string | null
          updatedAt?: string | null
          url: string
        }
        Update: {
          createdAt?: string | null
          debounceTime?: number | null
          delayMessage?: number | null
          description?: string | null
          enabled?: boolean
          expire?: number | null
          id?: string
          ignoreJids?: Json | null
          instanceId?: string
          keepOpen?: boolean | null
          keywordFinish?: string | null
          listeningFromMe?: boolean | null
          splitMessages?: boolean | null
          stopBotFromMe?: boolean | null
          timePerChar?: number | null
          triggerOperator?:
            | Database["public"]["Enums"]["TriggerOperator"]
            | null
          triggerType?: Database["public"]["Enums"]["TriggerType"] | null
          triggerValue?: string | null
          typebot?: string
          unknownMessage?: string | null
          updatedAt?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "Typebot_instanceId_fkey"
            columns: ["instanceId"]
            isOneToOne: false
            referencedRelation: "Instance"
            referencedColumns: ["id"]
          },
        ]
      }
      TypebotSetting: {
        Row: {
          createdAt: string | null
          debounceTime: number | null
          delayMessage: number | null
          expire: number | null
          id: string
          ignoreJids: Json | null
          instanceId: string
          keepOpen: boolean | null
          keywordFinish: string | null
          listeningFromMe: boolean | null
          splitMessages: boolean | null
          stopBotFromMe: boolean | null
          timePerChar: number | null
          typebotIdFallback: string | null
          unknownMessage: string | null
          updatedAt: string
        }
        Insert: {
          createdAt?: string | null
          debounceTime?: number | null
          delayMessage?: number | null
          expire?: number | null
          id: string
          ignoreJids?: Json | null
          instanceId: string
          keepOpen?: boolean | null
          keywordFinish?: string | null
          listeningFromMe?: boolean | null
          splitMessages?: boolean | null
          stopBotFromMe?: boolean | null
          timePerChar?: number | null
          typebotIdFallback?: string | null
          unknownMessage?: string | null
          updatedAt: string
        }
        Update: {
          createdAt?: string | null
          debounceTime?: number | null
          delayMessage?: number | null
          expire?: number | null
          id?: string
          ignoreJids?: Json | null
          instanceId?: string
          keepOpen?: boolean | null
          keywordFinish?: string | null
          listeningFromMe?: boolean | null
          splitMessages?: boolean | null
          stopBotFromMe?: boolean | null
          timePerChar?: number | null
          typebotIdFallback?: string | null
          unknownMessage?: string | null
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "TypebotSetting_instanceId_fkey"
            columns: ["instanceId"]
            isOneToOne: false
            referencedRelation: "Instance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "TypebotSetting_typebotIdFallback_fkey"
            columns: ["typebotIdFallback"]
            isOneToOne: false
            referencedRelation: "Typebot"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_snapshots: {
        Row: {
          id: string
          leads_count: number
          snapped_at: string
          tenant_id: string
          users_count: number
          vehicles_count: number
        }
        Insert: {
          id?: string
          leads_count?: number
          snapped_at?: string
          tenant_id: string
          users_count?: number
          vehicles_count?: number
        }
        Update: {
          id?: string
          leads_count?: number
          snapped_at?: string
          tenant_id?: string
          users_count?: number
          vehicles_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "usage_snapshots_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "plan_usage"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "usage_snapshots_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          id: string
          is_active: boolean
          last_seen_at: string | null
          name: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          id: string
          is_active?: boolean
          last_seen_at?: string | null
          name: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          last_seen_at?: string | null
          name?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "plan_usage"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "users_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          brand: string
          color: string | null
          condition: Database["public"]["Enums"]["vehicle_condition"]
          created_at: string
          description: string | null
          doors: number | null
          engine: string | null
          features: string[] | null
          fipe_price: number | null
          fuel: Database["public"]["Enums"]["fuel_type"]
          horsepower: number | null
          id: string
          images: string[] | null
          is_featured: boolean
          leads_count: number
          mileage: number
          model: string
          plate_last_digits: string | null
          price: number
          price_negotiable: boolean
          seller_id: string | null
          slug: string
          status: Database["public"]["Enums"]["vehicle_status"]
          tenant_id: string
          thumbnail_url: string | null
          title: string
          transmission: Database["public"]["Enums"]["transmission_type"]
          updated_at: string
          version: string | null
          video_url: string | null
          views_count: number
          year_manufacture: number
          year_model: number
        }
        Insert: {
          brand: string
          color?: string | null
          condition?: Database["public"]["Enums"]["vehicle_condition"]
          created_at?: string
          description?: string | null
          doors?: number | null
          engine?: string | null
          features?: string[] | null
          fipe_price?: number | null
          fuel?: Database["public"]["Enums"]["fuel_type"]
          horsepower?: number | null
          id?: string
          images?: string[] | null
          is_featured?: boolean
          leads_count?: number
          mileage?: number
          model: string
          plate_last_digits?: string | null
          price: number
          price_negotiable?: boolean
          seller_id?: string | null
          slug: string
          status?: Database["public"]["Enums"]["vehicle_status"]
          tenant_id: string
          thumbnail_url?: string | null
          title: string
          transmission?: Database["public"]["Enums"]["transmission_type"]
          updated_at?: string
          version?: string | null
          video_url?: string | null
          views_count?: number
          year_manufacture: number
          year_model: number
        }
        Update: {
          brand?: string
          color?: string | null
          condition?: Database["public"]["Enums"]["vehicle_condition"]
          created_at?: string
          description?: string | null
          doors?: number | null
          engine?: string | null
          features?: string[] | null
          fipe_price?: number | null
          fuel?: Database["public"]["Enums"]["fuel_type"]
          horsepower?: number | null
          id?: string
          images?: string[] | null
          is_featured?: boolean
          leads_count?: number
          mileage?: number
          model?: string
          plate_last_digits?: string | null
          price?: number
          price_negotiable?: boolean
          seller_id?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["vehicle_status"]
          tenant_id?: string
          thumbnail_url?: string | null
          title?: string
          transmission?: Database["public"]["Enums"]["transmission_type"]
          updated_at?: string
          version?: string | null
          video_url?: string | null
          views_count?: number
          year_manufacture?: number
          year_model?: number
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "plan_usage"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "vehicles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          role: Database["public"]["Enums"]["user_role"]
          tenant_id: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          role?: Database["public"]["Enums"]["user_role"]
          tenant_id: string
          token?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          role?: Database["public"]["Enums"]["user_role"]
          tenant_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_invitations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "plan_usage"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "vendor_invitations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      Webhook: {
        Row: {
          createdAt: string | null
          enabled: boolean | null
          events: Json | null
          headers: Json | null
          id: string
          instanceId: string
          updatedAt: string
          url: string
          webhookBase64: boolean | null
          webhookByEvents: boolean | null
        }
        Insert: {
          createdAt?: string | null
          enabled?: boolean | null
          events?: Json | null
          headers?: Json | null
          id: string
          instanceId: string
          updatedAt: string
          url: string
          webhookBase64?: boolean | null
          webhookByEvents?: boolean | null
        }
        Update: {
          createdAt?: string | null
          enabled?: boolean | null
          events?: Json | null
          headers?: Json | null
          id?: string
          instanceId?: string
          updatedAt?: string
          url?: string
          webhookBase64?: boolean | null
          webhookByEvents?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "Webhook_instanceId_fkey"
            columns: ["instanceId"]
            isOneToOne: false
            referencedRelation: "Instance"
            referencedColumns: ["id"]
          },
        ]
      }
      Websocket: {
        Row: {
          createdAt: string | null
          enabled: boolean
          events: Json
          id: string
          instanceId: string
          updatedAt: string
        }
        Insert: {
          createdAt?: string | null
          enabled?: boolean
          events: Json
          id: string
          instanceId: string
          updatedAt: string
        }
        Update: {
          createdAt?: string | null
          enabled?: boolean
          events?: Json
          id?: string
          instanceId?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "Websocket_instanceId_fkey"
            columns: ["instanceId"]
            isOneToOne: false
            referencedRelation: "Instance"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      plan_usage: {
        Row: {
          current_period_end: string | null
          features: Json | null
          lead_count: number | null
          max_leads: number | null
          max_users: number | null
          max_vehicles: number | null
          plan_display: string | null
          plan_name: string | null
          slug: string | null
          subscription_status:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          tenant_id: string | null
          tenant_name: string | null
          trial_ends_at: string | null
          user_count: number | null
          vehicle_count: number | null
        }
        Relationships: []
      }
      v_cash_flow_monthly: {
        Row: {
          month: string | null
          net_balance: number | null
          tenant_id: string | null
          total_expense: number | null
          total_income: number | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_entries_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "plan_usage"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "financial_entries_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      auth_tenant_id: { Args: never; Returns: string }
      auth_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      check_email_registered: { Args: { p_email: string }; Returns: boolean }
      get_tenant_invoices: {
        Args: { p_limit?: number; p_tenant_id: string }
        Returns: {
          asaas_payment_id: string
          billing_type: string
          description: string
          due_date: string
          invoice_id: string
          invoice_url: string
          paid_at: string
          status: Database["public"]["Enums"]["invoice_status"]
          value: number
        }[]
      }
      get_tenant_usage: {
        Args: { p_tenant_id: string }
        Returns: {
          features: Json
          leads_count: number
          max_leads: number
          max_users: number
          max_vehicles: number
          plan_display: string
          plan_name: string
          sub_status: string
          users_count: number
          users_pct: number
          vehicles_count: number
          vehicles_pct: number
        }[]
      }
    }
    Enums: {
      commission_status: "pending" | "approved" | "paid" | "canceled"
      commission_type: "percentage" | "fixed"
      DeviceMessage: "ios" | "android" | "web" | "unknown" | "desktop"
      DifyBotType: "chatBot" | "textGenerator" | "agent" | "workflow"
      financial_category:
        | "vehicle_sale"
        | "commission"
        | "service"
        | "financing"
        | "operational"
        | "marketing"
        | "salary"
        | "rent"
        | "tax"
        | "other"
      financial_entry_type: "income" | "expense"
      financing_type: "none" | "own" | "bank" | "consortium"
      fuel_type:
        | "flex"
        | "gasoline"
        | "diesel"
        | "electric"
        | "hybrid"
        | "ethanol"
      InstanceConnectionStatus: "open" | "close" | "connecting"
      invoice_status:
        | "pending"
        | "confirmed"
        | "received"
        | "overdue"
        | "refunded"
        | "canceled"
      lead_source:
        | "marketplace"
        | "whatsapp"
        | "referral"
        | "direct"
        | "social"
        | "other"
      lead_status:
        | "new"
        | "in_progress"
        | "proposal"
        | "closed_won"
        | "closed_lost"
      OpenaiBotType: "assistant" | "chatCompletion"
      payment_method:
        | "cash"
        | "pix"
        | "bank_transfer"
        | "credit_card"
        | "debit_card"
        | "financing"
        | "check"
        | "other"
      payment_status: "pending" | "paid" | "overdue" | "canceled"
      plan_type: "starter" | "pro" | "premium" | "enterprise"
      sale_status: "pending" | "completed" | "canceled"
      SessionStatus: "opened" | "closed" | "paused"
      subscription_status:
        | "active"
        | "trialing"
        | "past_due"
        | "canceled"
        | "paused"
      transmission_type: "manual" | "automatic" | "cvt" | "automated"
      TriggerOperator:
        | "contains"
        | "equals"
        | "startsWith"
        | "endsWith"
        | "regex"
      TriggerType: "all" | "keyword" | "none" | "advanced"
      user_role: "owner" | "admin" | "seller" | "viewer" | "super_admin"
      vehicle_condition: "new" | "used" | "certified"
      vehicle_status: "available" | "reserved" | "sold" | "inactive"
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
      commission_status: ["pending", "approved", "paid", "canceled"],
      commission_type: ["percentage", "fixed"],
      DeviceMessage: ["ios", "android", "web", "unknown", "desktop"],
      DifyBotType: ["chatBot", "textGenerator", "agent", "workflow"],
      financial_category: [
        "vehicle_sale",
        "commission",
        "service",
        "financing",
        "operational",
        "marketing",
        "salary",
        "rent",
        "tax",
        "other",
      ],
      financial_entry_type: ["income", "expense"],
      financing_type: ["none", "own", "bank", "consortium"],
      fuel_type: [
        "flex",
        "gasoline",
        "diesel",
        "electric",
        "hybrid",
        "ethanol",
      ],
      InstanceConnectionStatus: ["open", "close", "connecting"],
      invoice_status: [
        "pending",
        "confirmed",
        "received",
        "overdue",
        "refunded",
        "canceled",
      ],
      lead_source: [
        "marketplace",
        "whatsapp",
        "referral",
        "direct",
        "social",
        "other",
      ],
      lead_status: [
        "new",
        "in_progress",
        "proposal",
        "closed_won",
        "closed_lost",
      ],
      OpenaiBotType: ["assistant", "chatCompletion"],
      payment_method: [
        "cash",
        "pix",
        "bank_transfer",
        "credit_card",
        "debit_card",
        "financing",
        "check",
        "other",
      ],
      payment_status: ["pending", "paid", "overdue", "canceled"],
      plan_type: ["starter", "pro", "premium", "enterprise"],
      sale_status: ["pending", "completed", "canceled"],
      SessionStatus: ["opened", "closed", "paused"],
      subscription_status: [
        "active",
        "trialing",
        "past_due",
        "canceled",
        "paused",
      ],
      transmission_type: ["manual", "automatic", "cvt", "automated"],
      TriggerOperator: [
        "contains",
        "equals",
        "startsWith",
        "endsWith",
        "regex",
      ],
      TriggerType: ["all", "keyword", "none", "advanced"],
      user_role: ["owner", "admin", "seller", "viewer", "super_admin"],
      vehicle_condition: ["new", "used", "certified"],
      vehicle_status: ["available", "reserved", "sold", "inactive"],
    },
  },
} as const
